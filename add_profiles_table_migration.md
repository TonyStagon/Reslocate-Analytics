# Profile Table Migration Instructions

## Problem

The profiles table was not being found because it likely doesn't exist or has incorrect structure in the database. This prevents users from being added to the profiles table.

## Solution

I've created a new migration file: `supabase/migrations/create_profiles_table.sql`

This migration will:

1. Create the profiles table with proper structure
2. Add indexes for performance
3. Set up Row Level Security (RLS) policies
4. Create automatic timestamp triggers

## How to Execute the Migration

### Option 1: Run through Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/create_profiles_table.sql`
4. Execute the query

### Option 2: Use Supabase CLI

```bash
# If you have Supabase CLI installed
supabase migration up
```

### Option 3: Upload via Supabase Studio

1. In the Supabase dashboard, go to "Table Editor"
2. Grab the SQL code and execute it manually

## Verification

After running the migration, verify the profiles table exists:

```sql
SELECT tablename FROM pg_tables WHERE tablename = 'profiles';
```

Check table structure:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

## Expected Results

After successful migration:

- ✅ Profiles table will be created with all required columns
- ✅ Profiles should now be added successfully when users are created
- ✅ User Management interface should function properly
- ✅ Both createUserWithEmail and addEmailToProfileTable should work

## Common Issues Fixed

1. **Missing table**: Profiles table didn't exist
2. **Missing columns**: Profile interface vs database mismatch
3. **Foreign key conflicts**: ID structure was inconsistent
4. **Validation errors**: Too many optional fields of unknown structure

## Fields Reported from Error (Based On Original Request)

This fix ensures all reported fields will be compatible:

- id (uuid)
- email (text)
- first_name (text)
- last_name (text)
- phone_number (text)
- school (text)
- grade (text)
- date_of_birth (date)
- is_verified (boolean)
- role (text)
- plus all common profile information fields

After the database migration is complete, restart your application and test the User Management features to ensure profiles are being stored correctly.
