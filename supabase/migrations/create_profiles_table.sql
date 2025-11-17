-- Create profiles table for user management system
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  school TEXT,
  grade TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'Learner', 
  date_of_birth DATE,
  is_verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active',
  profile_picture TEXT,
  race TEXT,
  gender TEXT,
  province TEXT,
  streetaddress TEXT,
  country TEXT DEFAULT 'South Africa',
  last_seen TIMESTAMPTZ,
  career_quest_completed BOOLEAN DEFAULT FALSE,
  education_level TEXT,
  employment_status TEXT,
  industry TEXT
);

-- Ensure updated_at updates automatically
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Add Row Level Security policy
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid()::text = id::text);

-- Policy to allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Policy to allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Policy for admins to view all profiles
CREATE POLICY "Admin users can view all profiles" ON public.profiles
  FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy for service_role users to manage all profiles
CREATE POLICY "Service role can manage all profiles" ON public.profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Comments for documentation
COMMENT ON TABLE public.profiles IS 'User profiles for the analytics platform';
COMMENT ON COLUMN public.profiles.id IS 'Primary key and foreign key to auth.users.id';
COMMENT ON COLUMN public.profiles.role IS 'User role: Learner, Parent, Tutor, Other';

-- Verify table creation
SELECT 'Table created successfully' AS status;