-- Add onboarding status enum type
CREATE TYPE onboarding_status AS ENUM ('not_started', 'complete');

-- Add onboarding column to profiles table
ALTER TABLE profiles 
ADD COLUMN onboarding onboarding_status NOT NULL DEFAULT 'not_started';

-- Add comment for documentation
COMMENT ON COLUMN profiles.onboarding IS 'Tracks the user onboarding status: not_started or complete';
