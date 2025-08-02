-- Add columns for public training support
ALTER TABLE trainings ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE trainings ADD COLUMN fork_count INTEGER NOT NULL DEFAULT 0;

-- Add denormalization column to characters table to avoid expensive RLS joins
ALTER TABLE characters ADD COLUMN is_used_in_public_training BOOLEAN NOT NULL DEFAULT false;