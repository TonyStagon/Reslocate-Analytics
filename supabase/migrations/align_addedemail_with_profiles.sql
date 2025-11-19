-- Align AddedEmail table structure with profiles table
-- Remove fields that don't exist in profiles table or add missing ones

-- Option 1: Add missing fields to addedemail to match profiles
-- (This is the recommended approach since the code already uses these fields)

ALTER TABLE public.addedemail 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS school TEXT,
ADD COLUMN IF NOT EXISTS grade TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_addedemail_phone_number ON public.addedemail(phone_number);
CREATE INDEX IF NOT EXISTS idx_addedemail_school ON public.addedemail(school);

-- Update comments
COMMENT ON COLUMN public.addedemail.phone_number IS 'Contact phone number (optional)';
COMMENT ON COLUMN public.addedemail.school IS 'School name (optional)';
COMMENT ON COLUMN public.addedemail.grade IS 'Grade level (optional)';
COMMENT ON COLUMN public.addedemail.date_of_birth IS 'Date of birth (optional)';

-- Verify the structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'addedemail' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
