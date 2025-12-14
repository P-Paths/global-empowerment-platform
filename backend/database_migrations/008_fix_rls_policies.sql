-- Fix RLS policies for profiles and user_learning_profiles
-- This migration addresses:
-- 1. Missing INSERT policy for user_learning_profiles (needed for trigger)
-- 2. Profiles upsert policy to handle both id and user_id matching auth.uid()

-- ============================================
-- 1. Fix user_learning_profiles INSERT policy
-- ============================================
-- The trigger create_user_learning_profile() needs to be able to insert
-- We need a policy that allows inserts when the user_id matches a profile
-- that belongs to the authenticated user

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert own learning profile" ON user_learning_profiles;

-- Create INSERT policy that allows trigger to work
-- The trigger inserts with user_id = profiles.id, so we need to check
-- that the profile exists and belongs to the authenticated user
CREATE POLICY "Users can insert own learning profile" 
ON user_learning_profiles FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = user_learning_profiles.user_id 
        AND profiles.user_id = auth.uid()
    )
);

-- Also allow service role to insert (for backend operations)
-- This is needed when backend creates profiles using service role
-- Service role bypasses RLS, but having this policy is good practice

COMMENT ON POLICY "Users can insert own learning profile" ON user_learning_profiles IS 
'Allows users to create their own learning profile when a profile exists with matching user_id';

-- ============================================
-- 2. Fix profiles INSERT policy for upsert operations
-- ============================================
-- The RLS policy should check user_id matches auth.uid()
-- Note: The id column is auto-generated, but Supabase allows setting it during upsert
-- The key is that user_id must match auth.uid() for the insert to be allowed

-- Drop and recreate INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create INSERT policy that checks user_id matches auth.uid()
-- This is the standard pattern for Supabase RLS
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can insert own profile" ON profiles IS 
'Allows users to create their own profile when user_id matches auth.uid()';

-- ============================================
-- 3. Ensure UPDATE policy is correct
-- ============================================
-- Update the UPDATE policy to be consistent
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can update own profile" ON profiles IS 
'Allows users to update their own profile when user_id matches auth.uid()';
