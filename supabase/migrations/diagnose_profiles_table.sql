-- Run these diagnostic queries in Supabase SQL Editor to troubleshoot profiles table

-- ============================================
-- 1. Check current profiles table structure
-- ============================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- 2. Check for any existing profiles
-- ============================================
SELECT 
    id,
    user_id,
    email,
    first_name,
    last_name,
    role,
    created_at,
    updated_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 3. Check constraints on profiles table
-- ============================================
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass;

-- ============================================
-- 4. Check foreign key relationships
-- ============================================
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'profiles';

-- ============================================
-- 5. Get a valid auth user ID for testing
-- ============================================
SELECT id, email FROM auth.users LIMIT 1;

-- ============================================
-- 6. Test insert with minimal data
-- ============================================
-- Uncomment and replace the UUID with a real auth user ID from query #5:
-- INSERT INTO public.profiles (
--     id,
--     user_id,
--     email,
--     role,
--     first_name,
--     last_name
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000000'::uuid,  -- Replace with real auth user ID
--     '00000000-0000-0000-0000-000000000000'::uuid,  -- Same ID
--     'test@example.com',
--     'Learner',
--     'Test',
--     'User'
-- )
-- RETURNING *;

-- ============================================
-- 7. Check if RLS is blocking inserts
-- ============================================
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';

-- ============================================
-- 8. Check RLS policies
-- ============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- ============================================
-- 9. Check addedemail table structure for comparison
-- ============================================
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'addedemail' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- 10. Count records in both tables
-- ============================================
SELECT 
    'profiles' as table_name,
    COUNT(*) as record_count
FROM public.profiles
UNION ALL
SELECT 
    'addedemail' as table_name,
    COUNT(*) as record_count
FROM public.addedemail;

-- ============================================
-- 11. Check for orphaned profiles (no auth user)
-- ============================================
SELECT 
    p.id,
    p.email,
    p.created_at
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL;

-- ============================================
-- 12. Check for missing profiles (auth user without profile)
-- ============================================
SELECT 
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
