-- Add skills and emotion columns to modules_characters table
ALTER TABLE modules_characters 
ADD COLUMN skills jsonb,
ADD COLUMN emotion jsonb;

-- Add comments to the new columns
COMMENT ON COLUMN modules_characters.skills IS 'JSONB column to store character skills data';
COMMENT ON COLUMN modules_characters.emotion IS 'JSONB column to store character emotion data';