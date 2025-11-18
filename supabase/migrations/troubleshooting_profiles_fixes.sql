-- ============================================
-- TROUBLESHOOTING FIXES FOR PROFILES TABLE
-- Run these queries if you encounter specific issues
-- ============================================

-- ============================================
-- FIX 1: Foreign Key Constraint Violation
-- ============================================
-- If you get foreign key errors, temporarily disable the constraint:
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- After fixing data, re-add the constraint:
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================
-- FIX 2: RLS Policies Blocking Inserts
-- ============================================
-- Check if service_role policy exists:
SELECT * FROM pg_policies WHERE tablename = 'profiles' AND policyname LIKE '%service%';

-- If missing, add it:
CREATE POLICY "Service role can manage all profiles" 
ON public.profiles
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Alternative: Temporarily disable RLS for testing (NOT RECOMMENDED FOR PRODUCTION)
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- Remember to re-enable: ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FIX 3: Username Length Constraint
-- ============================================
-- If first_name constraint is causing issues:
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS username_length;

-- ============================================
-- FIX 4: Missing Indexes Causing Slow Queries
-- ============================================
-- Add performance indexes if missing:
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- ============================================
-- FIX 5: Orphaned Records Cleanup
-- ============================================
-- Delete profiles without corresponding auth users (USE WITH CAUTION):
-- DELETE FROM public.profiles 
-- WHERE id NOT IN (SELECT id FROM auth.users);

-- ============================================
-- FIX 6: Sync Missing Profiles for Existing Auth Users
-- ============================================
-- Create profiles for auth users that don't have one:
INSERT INTO public.profiles (id, user_id, email, role, created_at, updated_at)
SELECT 
    au.id,
    au.id,
    au.email,
    'Learner' as role,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FIX 7: Reset Auto-increment ID (if using serial)
-- ============================================
-- Not needed for UUID-based id, but useful for other tables
-- SELECT setval('profiles_id_seq', (SELECT MAX(id) FROM profiles));

-- ============================================
-- FIX 8: Check and Fix Data Type Mismatches
-- ============================================
-- Ensure all columns have correct data types:
-- ALTER TABLE public.profiles ALTER COLUMN id TYPE UUID USING id::uuid;
-- ALTER TABLE public.profiles ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
-- ALTER TABLE public.profiles ALTER COLUMN email TYPE TEXT;
-- ALTER TABLE public.profiles ALTER COLUMN role TYPE TEXT;

-- ============================================
-- FIX 9: Add Default Values to Columns
-- ============================================
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'Learner',
ALTER COLUMN status SET DEFAULT 'active',
ALTER COLUMN is_verified SET DEFAULT false,
ALTER COLUMN country SET DEFAULT 'South Africa',
ALTER COLUMN career_quest_completed SET DEFAULT false;

-- ============================================
-- FIX 10: Grant Permissions to Service Role
-- ============================================
-- Ensure service role has all necessary permissions:
GRANT ALL ON public.profiles TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- ============================================
-- VERIFICATION: Test Insert After Fixes
-- ============================================
-- Test with a new UUID (this will fail if auth user doesn't exist):
DO $$
DECLARE
    test_uuid UUID := gen_random_uuid();
    test_email TEXT := 'test_' || SUBSTRING(test_uuid::TEXT, 1, 8) || '@example.com';
BEGIN
    -- First create auth user (requires service role)
    -- This part needs to be done via Supabase Admin API
    
    -- Then insert profile
    INSERT INTO public.profiles (
        id,
        user_id,
        email,
        role,
        first_name,
        last_name,
        is_verified,
        status
    ) VALUES (
        test_uuid,
        test_uuid,
        test_email,
        'Learner',
        'Test',
        'User',
        true,
        'active'
    );
    
    RAISE NOTICE 'Test insert successful with UUID: %', test_uuid;
    
    -- Cleanup test data
    DELETE FROM public.profiles WHERE id = test_uuid;
    RAISE NOTICE 'Test data cleaned up';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test insert failed: %', SQLERRM;
END $$;

-- ============================================
-- FINAL VERIFICATION QUERY
-- ============================================
SELECT 
    'Profiles Count' as metric,
    COUNT(*) as value
FROM public.profiles
UNION ALL
SELECT 
    'Auth Users Count' as metric,
    COUNT(*) as value
FROM auth.users
UNION ALL
SELECT 
    'Missing Profiles' as metric,
    COUNT(*) as value
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
UNION ALL
SELECT 
    'Orphaned Profiles' as metric,
    COUNT(*) as value
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL;
