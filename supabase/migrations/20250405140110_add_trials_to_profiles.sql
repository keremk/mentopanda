-- Add trial_start and trial_end columns to the profiles table
ALTER TABLE "profiles" 
ADD COLUMN "trial_start" TIMESTAMP WITH TIME ZONE,
ADD COLUMN "trial_end" TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the purpose of these columns
COMMENT ON COLUMN "profiles"."trial_start" IS 'The date when the user trial started';
COMMENT ON COLUMN "profiles"."trial_end" IS 'The date when the user trial ends';

-- Update existing profiles to have NULL values for the new columns
-- This is automatic in Postgres, but we're explicitly documenting the behavior
