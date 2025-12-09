-- GEP-Specific Simplified Onboarding
-- Since GEP focuses on entrepreneurs and funding, we only need minimal onboarding fields

-- Add only essential GEP onboarding fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- Note: GEP uses existing columns:
-- - full_name (for name)
-- - business_name (already exists)
-- - business_category (already exists) 
-- - city, state (already exists)
-- - bio (already exists)
-- - skills (already exists)

-- Create index for onboarding status
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_complete ON profiles(onboarding_complete);

COMMENT ON COLUMN profiles.onboarding_complete IS 'Indicates if user has completed the GEP onboarding process';

