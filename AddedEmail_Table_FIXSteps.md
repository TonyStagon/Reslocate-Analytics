# AddedEmail Table Insertion Issues - Troubleshooting Document

## Problem Statement

Users are not being successfully inserted into the `AddedEmail` table via the `createUserWithEmail` function in [`userService.ts`](src/lib/userService.ts).

## Root Cause Analysis - 8 Potential Issues

### 1. **RLS (Row Level Security) Conflicts**

- **Issue**: RLS might have been enabled after the original migration without proper policies
- **Current State**: RLS is commented out in migration ([`create_added_email_table.sql:35`](supabase/migrations/create_added_email_table.sql:35))
- **Impact**: If RLS was enabled without policies, only service role users can insert data
- **Fix Check**: Verify RLS status and the contrast from using [`supabase`](src/lib/userService.ts:1) vs [`supabaseAdmin`](src/lib/userService.ts:1) at row insertion

### 2. **Schema Visibility Issue**

- **Issue**: Table in `public` schema but [`from('AddedEmail')`](src/lib/userService.ts:122) doesn't specify schema
- **Impact**: Supabase/Postgres routing might default incorrectly
- **Fix**: Try `from('public.AddedEmail')` or verify database `search_path`

### 3. **Database Constraint Conflicts**

- **Issue**: Error code `23505` (unique violation) caught at line 132 but no explicit unique constraint exists
- **Evidence**: [Source](src/lib/userService.ts:132)
- **Impact**: Suggests hidden constraints or post-migration changes
- **Fix**: Validate the actual database schema directly

### 4. **Error Handling Suppressing Issues**

- **Issue**: Errors treated as "warnings" without propagating failure states
- **Code Review**: Lines 127-140 in [`createUserWithEmail`](src/lib/userService.ts:40)
- **Impact**: Critical database rejections could be misinterpreted as 'warnings'
- **Fix**: Add more verbose error logging regardless of assumption

### 5. **Header Authorization Issue**

- **Issue**: Transaction creates user, auth establishes, but insufficient headers for follow-on RLS operations
- **Flow Order**: Auth User (apparently succeeds) → Profile Insert → AddedEmail Insert
- **Impact**: Potential blocking near new user session establishment period
- **Fix**: Use [`supabaseAdmin`](src/lib/userService.ts:1) uniformly for AddedEmail insert in that insertion path

### 6. **Uncaptured Promise Handling**

- **Issue**: Asynchronous operations could leave gaps in error boundary protection
- **Location**: Lines 121-127's concurrent dependency timing
- **Impact**: Occasional Unhandled Promise rejections
- **Fix**: Add broader promise instrumentation alternatively minor wait for strict auth fulfillment (`new Promise` chain)

### 7. **Type Mismatch with UUID field**

- **Issue**: `created_by UUID` field in migration matching [`authData.user.id`](src/lib/userService.ts:116) but server-side format validation might differ
- **Evidence**: Compare `public.AddedEmail.created_by` column spec ([`create_added_email_table.sql:7`](supabase/migrations/create_added_email_table.sql:7))
- **Fix**: Infer server logging for visible type coercion failure

### 8. **Resource Permissions Conflict**

- **Issue**: Mixity of admin key versus anonymous immediate utilization during coalesce of parent composite transaction
- **Key Difference**: Compare lines [162-164](src/lib/userService.ts:162) `supabaseAdmin` versus [121-125](src/lib/userService.ts:121) `supabase` operations during save chain
- **Impact**: Admin-context authorized insert bypassing RLS, versus next operations blocked due to not session-authenticated yet
- **Fix**: ALWAYS use [`supabaseAdmin`](src/lib/userService.ts:1) instead of switching clients mid-out transaction for finalizing AddedEmail insertion in this function

## Immediate Quick Fix Testing

Switch line 121 from:

```typescript
const { data: insertedEmail, error: addedEmailError } = await supabase.from(
  "AddedEmail"
);
```

To:

```typescript
const { data: insertedEmail, error: addedEmailError } =
  await supabaseAdmin.from("AddedEmail");
```

The hypothesis is that functional context not yet authenticated — successful auth user insertion, profile insert, however AddedEmail blocking immediately — swap to admin role removes potential blocker immediately.

## Diagnosis Commands (To Run in Supabase SQL Editor)

```sql
-- Check RLS policies
SELECT table_name, row_security_active
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'AddedEmail';

-- Check actual unique constraints
SELECT
    tc.table_schema,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
  AND tc.table_name = 'AddedEmail';

-- Test immediate insert with returned values visibility
INSERT INTO public.AddedEmail (email, first_name, last_name, created_by)
VALUES ('test@example.com', 'Test', 'User', '550e8400-e29b-41d4-a716-446655440000'::uuid)
RETURNING id, email;
```

## Implementation Verification Notes

Step-by-step validation required:

1. Run immediate admin client swap
2. If recurring duplicate constraint reference present — examine unique index being non-declared during production database changes
3. If row blocking persists — check RLS active / foreign key constraints precluding unverified users
