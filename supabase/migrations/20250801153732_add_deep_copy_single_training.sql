-- Deep copy function for individual training with ID mappings for storage operations
CREATE OR REPLACE FUNCTION deep_copy_training(
  source_training_id BIGINT,
  target_project_id BIGINT,
  target_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  new_training_id BIGINT;
  source_module RECORD;
  new_module_id BIGINT;
  source_character RECORD;
  new_character_id BIGINT;
  character_mapping JSONB := '{}';
  module_mapping JSONB := '{}';
  result JSONB;
BEGIN
  -- 1. Copy training (with is_public=false)
  INSERT INTO trainings (title, tagline, description, image_url, preview_url, project_id, created_by, is_public, fork_count)
  SELECT title, tagline, description, image_url, preview_url, target_project_id, target_user_id, false, 0
  FROM trainings WHERE id = source_training_id
  RETURNING id INTO new_training_id;

  -- 2. Copy characters first (to build mapping)
  FOR source_character IN 
    SELECT DISTINCT c.* FROM characters c
    JOIN modules_characters mc ON c.id = mc.character_id
    JOIN modules m ON mc.module_id = m.id
    WHERE m.training_id = source_training_id
  LOOP
    INSERT INTO characters (name, voice, ai_description, ai_model, description, avatar_url, project_id, created_by)
    VALUES (source_character.name, source_character.voice, source_character.ai_description, 
            source_character.ai_model, source_character.description, source_character.avatar_url, 
            target_project_id, target_user_id)
    RETURNING id INTO new_character_id;
    
    character_mapping := character_mapping || jsonb_build_object(source_character.id::text, new_character_id);
  END LOOP;

  -- 3. Copy modules and link to new characters
  FOR source_module IN SELECT * FROM modules WHERE training_id = source_training_id ORDER BY ordinal LOOP
    INSERT INTO modules (training_id, title, instructions, ordinal, ai_model, scenario_prompt, 
                        assessment_prompt, moderator_prompt, prep_coach_prompt, video_url, audio_url)
    VALUES (new_training_id, source_module.title, source_module.instructions, source_module.ordinal,
            source_module.ai_model, source_module.scenario_prompt, source_module.assessment_prompt,
            source_module.moderator_prompt, source_module.prep_coach_prompt, 
            source_module.video_url, source_module.audio_url)
    RETURNING id INTO new_module_id;

    module_mapping := module_mapping || jsonb_build_object(source_module.id::text, new_module_id);

    -- Copy module-character associations
    INSERT INTO modules_characters (module_id, character_id, ordinal, prompt, skills, traits)
    SELECT new_module_id, 
           (character_mapping->>mc.character_id::text)::BIGINT,
           mc.ordinal, mc.prompt, mc.skills, mc.traits
    FROM modules_characters mc 
    WHERE mc.module_id = source_module.id;
  END LOOP;

  -- 4. Increment fork count
  UPDATE trainings SET fork_count = fork_count + 1 WHERE id = source_training_id;

  -- 5. Return mapping for storage operations
  result := jsonb_build_object(
    'training_id', new_training_id,
    'character_mapping', character_mapping,
    'module_mapping', module_mapping
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;