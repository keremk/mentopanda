-- Add origin tracking columns to trainings table
ALTER TABLE trainings 
ADD COLUMN origin_id BIGINT REFERENCES trainings(id),
ADD COLUMN forked_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient origin_id queries
CREATE INDEX idx_trainings_origin_id ON trainings(origin_id) WHERE origin_id IS NOT NULL;