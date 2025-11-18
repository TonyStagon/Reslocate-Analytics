-- Migration to fix profiles table structure
-- This migration adds missing columns and ensures data consistency
-- Run this in Supabase SQL Editor

-- 1. Add missing columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Populate user_id with id value for existing records NOT YOU
UPDATE public.profiles 
SET user_id = id 
WHERE user_id IS NULL;

-- 3. Make user_id NOT NULL after populating
ALTER TABLE public.profiles 
ALTER COLUMN user_id SET NOT NULL;

-- 4. Add index on user_id for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- 5. Update the trigger function to handle updated_at
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

-- 7. Add comment for documentation
COMMENT ON COLUMN public.profiles.user_id IS 'User identifier matching auth.users.id';
COMMENT ON COLUMN public.profiles.created_at IS 'Record creation timestamp';

-- 8. Verify the structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
    AND table_schema = 'public'
    AND column_name IN ('id', 'user_id', 'created_at', 'updated_at', 'email', 'first_name', 'last_name')
ORDER BY ordinal_position;
