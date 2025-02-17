-- Enable HSTORE extension if not enabled
CREATE EXTENSION IF NOT EXISTS hstore;

CREATE OR REPLACE FUNCTION deep_copy_project(
    source_project_id BIGINT,
    target_project_id BIGINT, 
    target_user_id UUID
)
RETURNS void AS $$
DECLARE
    new_training_id BIGINT;
    new_module_id BIGINT;
    new_character_id BIGINT;
    old_character_id BIGINT;
    character_id_map HSTORE := ''::HSTORE;
BEGIN
    -- Copy trainings
    FOR new_training_id IN
        WITH new_trainings AS (
            INSERT INTO trainings (
                title, tagline, description, image_url, preview_url,
                created_by, project_id
            )
            SELECT 
                title, tagline, description, image_url, preview_url,
                target_user_id, target_project_id
            FROM trainings 
            WHERE project_id = source_project_id
            RETURNING id
        )
        SELECT id FROM new_trainings
    LOOP
        -- Copy modules for each training
        WITH new_modules AS (
            INSERT INTO modules (
                training_id, title, instructions, ordinal,
                ai_model, scenario_prompt, assessment_prompt,
                moderator_prompt, video_url, audio_url
            )
            SELECT 
                new_training_id, title, instructions, ordinal,
                ai_model, scenario_prompt, assessment_prompt,
                moderator_prompt, video_url, audio_url
            FROM modules
            WHERE training_id IN (
                SELECT id FROM trainings 
                WHERE project_id = source_project_id
            )
            RETURNING id
        )
        SELECT id FROM new_modules INTO new_module_id;

        -- Copy characters if not already copied
        FOR old_character_id, new_character_id IN
            WITH new_characters AS (
                INSERT INTO characters (
                    name, voice, ai_description, ai_model,
                    description, avatar_url, project_id, created_by
                )
                SELECT DISTINCT ON (characters.id)
                    characters.name, characters.voice, characters.ai_description, 
                    characters.ai_model, characters.description, characters.avatar_url, 
                    target_project_id, target_user_id
                FROM modules_characters
                JOIN modules ON modules.id = modules_characters.module_id
                JOIN trainings ON trainings.id = modules.training_id
                JOIN characters ON characters.id = modules_characters.character_id
                WHERE trainings.project_id = source_project_id
                AND NOT EXISTS (
                    SELECT 1 FROM characters 
                    WHERE project_id = target_project_id 
                    AND name = characters.name
                )
                RETURNING id, characters.id as old_id
            )
            SELECT old_id, id FROM new_characters
        LOOP
            -- Store the mapping of old to new character IDs
            character_id_map := character_id_map || HSTORE(
                old_character_id::text,
                new_character_id::text
            );
        END LOOP;

        -- Only copy module_characters if we have characters
        IF character_id_map IS NOT NULL AND character_id_map != ''::HSTORE THEN
            -- Copy module_characters relationships
            INSERT INTO modules_characters (
                module_id, character_id, ordinal, prompt
            )
            SELECT 
                new_module_id,
                (character_id_map -> mc.character_id::text)::bigint,
                mc.ordinal,
                mc.prompt
            FROM modules_characters mc
            JOIN modules m ON mc.module_id = m.id
            WHERE m.training_id IN (
                SELECT id FROM trainings 
                WHERE project_id = source_project_id
            )
            AND mc.character_id::text = ANY (akeys(character_id_map));
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql; 