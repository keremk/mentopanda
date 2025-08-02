-- Trigger function to maintain is_used_in_public_training flag
CREATE OR REPLACE FUNCTION update_character_public_flags()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.is_public != NEW.is_public THEN
    IF NEW.is_public = true THEN
      -- Training became public - mark all its characters as public
      UPDATE characters SET is_used_in_public_training = true
      WHERE id IN (
        SELECT DISTINCT c.id FROM characters c
        JOIN modules_characters mc ON c.id = mc.character_id  
        JOIN modules m ON mc.module_id = m.id
        WHERE m.training_id = NEW.id
      );
    ELSE
      -- Training became private - check if characters are still used in other public trainings
      UPDATE characters SET is_used_in_public_training = CASE
        WHEN EXISTS (
          SELECT 1 FROM modules m2
          JOIN trainings t2 ON m2.training_id = t2.id
          JOIN modules_characters mc2 ON m2.id = mc2.module_id
          WHERE mc2.character_id = characters.id 
          AND t2.is_public = true 
          AND t2.id != NEW.id
        ) THEN true
        ELSE false
      END
      WHERE id IN (
        SELECT DISTINCT c.id FROM characters c
        JOIN modules_characters mc ON c.id = mc.character_id
        JOIN modules m ON mc.module_id = m.id  
        WHERE m.training_id = NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER training_public_flag_trigger
  AFTER UPDATE ON trainings
  FOR EACH ROW
  EXECUTE FUNCTION update_character_public_flags();