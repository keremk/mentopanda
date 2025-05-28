-- Add credit-based columns to usage table and remove old calculated_usage column

-- Add new credit columns
ALTER TABLE usage 
ADD COLUMN available_credits numeric(10,2) DEFAULT 0 NOT NULL,
ADD COLUMN used_credits numeric(10,2) DEFAULT 0 NOT NULL;

-- Remove the old calculated_usage column since we're moving to credits
ALTER TABLE usage 
DROP COLUMN calculated_usage;
