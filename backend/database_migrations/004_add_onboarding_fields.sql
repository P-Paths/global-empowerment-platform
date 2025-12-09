-- Migration: Add onboarding fields to profiles table
-- This migration adds all fields needed for the GEP onboarding process

-- Add missing onboarding fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS zip TEXT,
ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'experienced')),
ADD COLUMN IF NOT EXISTS selected_category TEXT CHECK (selected_category IN ('automotive', 'real_estate', 'luxury_items', 'small_businesses', 'high_value_goods', 'art_collectibles')),
ADD COLUMN IF NOT EXISTS messaging_preference TEXT CHECK (messaging_preference IN ('auto_reply', 'human_in_loop', 'manual')),
ADD COLUMN IF NOT EXISTS wants_escrow BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- Create index for faster onboarding status queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_complete ON profiles(onboarding_complete);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Update full_name if first_name and last_name are provided (for existing users)
-- This is a one-time migration to populate full_name from first_name + last_name
UPDATE profiles 
SET full_name = TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
WHERE (first_name IS NOT NULL OR last_name IS NOT NULL) 
  AND (full_name IS NULL OR full_name = '');

-- Add comment to table
COMMENT ON COLUMN profiles.onboarding_complete IS 'Indicates if user has completed the onboarding process';
COMMENT ON COLUMN profiles.experience_level IS 'User experience level: beginner, intermediate, or experienced';
COMMENT ON COLUMN profiles.selected_category IS 'Primary category user wants to sell in';
COMMENT ON COLUMN profiles.messaging_preference IS 'How user wants AI to handle messages: auto_reply, human_in_loop, or manual';

