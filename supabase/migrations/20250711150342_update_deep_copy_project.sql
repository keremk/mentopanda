-- Update deep_copy_project to handle prep_coach_prompt in modules
-- This assumes the function is being replaced in its entirety for clarity
CREATE OR REPLACE FUNCTION deep_copy_project(
    source_project_id BIGINT,
    target_project_id BIGINT, 
    target_user_id UUID
)
RETURNS void AS $$
DECLARE
    source_training_id BIGINT;
    new_training_id BIGINT;
    character_id_map HSTORE := ''::HSTORE;
    old_character_id BIGINT;
    new_character_id BIGINT;
    module_rec RECORD;
BEGIN
    -- First, build a map of character IDs that will be needed
    FOR old_character_id IN
        SELECT DISTINCT characters.id
        FROM modules_characters
        JOIN modules ON modules.id = modules_characters.module_id
        JOIN trainings ON trainings.id = modules.training_id
        JOIN characters ON characters.id = modules_characters.character_id
        WHERE trainings.project_id = source_project_id
    LOOP
        -- Create new character
        INSERT INTO characters (
            name, voice, ai_description, ai_model,
            description, avatar_url, project_id, created_by
        )
        SELECT 
            name, voice, ai_description, ai_model,
            description, avatar_url, target_project_id, target_user_id
        FROM characters
        WHERE id = old_character_id
        RETURNING id INTO new_character_id;
        
        -- Store the mapping of old to new character IDs
        character_id_map := character_id_map || HSTORE(
            old_character_id::text,
            new_character_id::text
        );
    END LOOP;

    -- Create a temporary table to store module mappings
    CREATE TEMPORARY TABLE module_mapping (
        old_id BIGINT,
        new_id BIGINT,
        training_id BIGINT
    ) ON COMMIT DROP;

    -- Copy each training and its modules
    FOR source_training_id IN
        SELECT id FROM trainings WHERE project_id = source_project_id
    LOOP
        -- Copy the training
        INSERT INTO trainings (
            title, tagline, description, image_url, preview_url,
            created_by, project_id
        )
        SELECT 
            title, tagline, description, image_url, preview_url,
            target_user_id, target_project_id
        FROM trainings 
        WHERE id = source_training_id
        RETURNING id INTO new_training_id;
        
        -- Copy modules for this specific training
        FOR module_rec IN
            SELECT id, title, instructions, ordinal, ai_model, 
                   scenario_prompt, assessment_prompt, moderator_prompt, prep_coach_prompt,
                   video_url, audio_url
            FROM modules
            WHERE training_id = source_training_id
        LOOP
            INSERT INTO modules (
                training_id, title, instructions, ordinal,
                ai_model, scenario_prompt, assessment_prompt,
                moderator_prompt, prep_coach_prompt, video_url, audio_url
            )
            VALUES (
                new_training_id, module_rec.title, module_rec.instructions, module_rec.ordinal,
                module_rec.ai_model, module_rec.scenario_prompt, module_rec.assessment_prompt,
                module_rec.moderator_prompt, module_rec.prep_coach_prompt, module_rec.video_url, module_rec.audio_url
            )
            RETURNING id INTO new_character_id;
            
            -- Store the module mapping
            INSERT INTO module_mapping (old_id, new_id, training_id)
            VALUES (module_rec.id, new_character_id, new_training_id);
        END LOOP;
    END LOOP;
    
    -- Copy module_characters relationships using the mappings
    INSERT INTO modules_characters (
        module_id, character_id, ordinal, prompt
    )
    SELECT 
        mm.new_id,
        (character_id_map -> mc.character_id::text)::bigint,
        mc.ordinal,
        mc.prompt
    FROM modules_characters mc
    JOIN module_mapping mm ON mc.module_id = mm.old_id
    WHERE mc.character_id::text = ANY (akeys(character_id_map));
    
    -- Drop the temporary table
    DROP TABLE module_mapping;
END;
$$ LANGUAGE plpgsql;
