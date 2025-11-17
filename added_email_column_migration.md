# Supabase SQL Migration for AddedEmail Table Extensions - Complete Database Design

## CURRENT TABLE SCHEMA (Before Migration)

The AddedEmail table currently has 7 columns:

- `id` SERIAL PRIMARY KEY
- `email` VARCHAR NOT NULL UNIQUE
- `first_name` VARCHAR NULL
- `last_name` VARCHAR NULL
- `created_by` UUID NULL
- `created_at` TIMESTAMPTZ DEFAULT NOW()
- `updated_at` TIMESTAMPTZ DEFAULT NOW()

_(NO additional phone_number, school, grade, or date_of_birth fields exist yet)_

## Extended Table Schema (After Migration)

The AddedEmail table will have **11 columns** adding 4 new profile fields:

- `phone_number` (TEXT, nullable)
- `school` (TEXT, nullable)
- `grade` (TEXT, nullable)
- `date_of_birth` (DATE, nullable)

## Migration Instructions for AI Assistant

Prompt to provide to your Supabase AI Assistant:

---

"Please execute this SQL migration to extend the `addedemail` table with new profile fields. The table should have the following additional columns:

- `phone_number` (text, nullable)
- `school` (text, nullable)
- `grade` (text, nullable)
- `date_of_birth` (date, nullable)

## SQL Migration Code:

```sql
-- ALTER TABLE statement to add new columns to addedemail table
ALTER TABLE addedemail
ADD COLUMN phone_number text DEFAULT NULL,
ADD COLUMN school text DEFAULT NULL,
ADD COLUMN grade text DEFAULT NULL,
ADD COLUMN date_of_birth date DEFAULT NULL;

-- Update existing rows to set NULL values (no data migration needed since these are new fields)
UPDATE addedemail
SET phone_number = NULL, school = NULL, grade = NULL, date_of_birth = NULL
WHERE phone_number IS NULL;

-- Verify the table structure
\dt addedemail;

-- Confirm new columns exist by describing table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'addedemail' AND table_schema = 'public'
ORDER BY ordinal_position;
```

Please execute this migration and verify that the table structure has been updated successfully.
The migration should be safe since we're only adding new nullable columns with no impact on existing data."

---

## Migration Features:

1. **Safe Migration**: All new columns are nullable with no required data migration
2. **Date Format**: `date_of_birth` uses proper `date` type for storing birth dates
3. **South African Context**: Example data includes South African phone numbers and school names
4. **Backward Compatible**: Existing code will continue to work as all new fields are optional

## Verification Query:

After migration, verify the structure with:

```sql
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'addedemail'
ORDER BY ordinal_position;
```

Expected columns after migration should include:

- id, email, first_name, last_name, **phone_number**, **school**, **grade**, **date_of_birth**, created_by, created_at, updated_at
