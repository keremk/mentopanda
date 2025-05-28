-- Add separate credit tracking columns to usage table
-- Replace available_credits and used_credits with separate subscription and purchased credit tracking

-- Add new credit columns for separate tracking
ALTER TABLE usage 
ADD COLUMN subscription_credits numeric(10,2) DEFAULT 0 NOT NULL,
ADD COLUMN purchased_credits numeric(10,2) DEFAULT 0 NOT NULL,
ADD COLUMN used_subscription_credits numeric(10,2) DEFAULT 0 NOT NULL,
ADD COLUMN used_purchased_credits numeric(10,2) DEFAULT 0 NOT NULL;


-- Drop the old columns
ALTER TABLE usage 
DROP COLUMN available_credits,
DROP COLUMN used_credits; 