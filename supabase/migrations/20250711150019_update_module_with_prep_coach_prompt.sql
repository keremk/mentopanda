-- Add prep_coach_prompt column to modules table
ALTER TABLE modules
ADD COLUMN prep_coach_prompt text;

COMMENT ON COLUMN modules.prep_coach_prompt IS 'Prompt for the prep coach, similar to scenario_prompt, assessment_prompt, and moderator_prompt';
