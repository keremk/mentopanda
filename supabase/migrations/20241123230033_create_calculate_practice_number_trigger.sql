-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS set_practice_number ON history;
DROP FUNCTION IF EXISTS calculate_practice_number();

-- Create the function that will be called by the trigger
CREATE OR REPLACE FUNCTION calculate_practice_number() 
RETURNS TRIGGER AS $$
DECLARE
    next_practice_no integer;
    current_max integer;
BEGIN
    -- Get the current max practice number
    SELECT MAX(practice_no) 
    INTO current_max
    FROM history
    WHERE user_id = NEW.user_id
      AND module_id = NEW.module_id;
      
    -- -- Log the values for debugging
    -- RAISE NOTICE 'Current max practice_no: %, User ID: %, Module ID: %', 
    --     current_max, NEW.user_id, NEW.module_id;

    -- Calculate next practice number
    next_practice_no := COALESCE(current_max, 0) + 1;
    
    -- RAISE NOTICE 'Setting next practice_no to: %', next_practice_no;

    -- Set the new practice_no
    NEW.practice_no := next_practice_no;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that will fire before insert
CREATE TRIGGER set_practice_number 
    BEFORE INSERT ON history 
    FOR EACH ROW 
    EXECUTE FUNCTION calculate_practice_number();