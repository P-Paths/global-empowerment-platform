-- Fix RLS policies for profiles table
-- Allows users to create/update their own profiles properly

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- Recreate policies with proper checks
-- SELECT: Everyone can read profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- INSERT: Users can create their own profile
-- The user_id must match auth.uid() (the authenticated user)
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own profile
-- Must match user_id to auth.uid()
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow UPSERT operations (INSERT ... ON CONFLICT)
-- This is needed for the onboarding service which uses upsert
-- The policy will check user_id matches auth.uid() on both insert and update

COMMENT ON POLICY "Users can insert own profile" ON profiles IS 
'Allows users to create their own profile when user_id matches auth.uid()';

COMMENT ON POLICY "Users can update own profile" ON profiles IS 
'Allows users to update their own profile when user_id matches auth.uid()';

