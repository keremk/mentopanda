-- Enable RLS on invite_codes table
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Only the creator can view their own invite codes
CREATE POLICY "Users can view their own invite codes" ON invite_codes
    FOR SELECT
    USING (auth.uid() = created_by);

-- Policy: Only users with trials.manage permission can create invite codes
-- Use the user's current project ID from JWT for authorization
CREATE POLICY "Users with trials.manage can create invite codes" ON invite_codes
    FOR INSERT
    WITH CHECK (
        auth.uid() = created_by 
        AND authorize('trials.manage'::app_permission, (auth.jwt()->'current_project_id')::bigint)
    );

-- Policy: Only the creator can update their own invite codes
CREATE POLICY "Users can update their own invite codes" ON invite_codes
    FOR UPDATE
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Policy: Only the creator can delete their own invite codes
CREATE POLICY "Users can delete their own invite codes" ON invite_codes
    FOR DELETE
    USING (auth.uid() = created_by);

-- Create a SECURITY DEFINER function to validate invite codes
-- This function runs with elevated privileges and can bypass RLS
CREATE OR REPLACE FUNCTION validate_invite_code(code_to_validate TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invite_record invite_codes%ROWTYPE;
    created_at_ts TIMESTAMP WITH TIME ZONE;
    expiry_date TIMESTAMP WITH TIME ZONE;
    now_ts TIMESTAMP WITH TIME ZONE;
    result JSON;
BEGIN
    -- Find the invite code (bypasses RLS due to SECURITY DEFINER)
    SELECT * INTO invite_record
    FROM invite_codes
    WHERE code = code_to_validate;
    
    -- Check if code exists
    IF invite_record IS NULL THEN
        RETURN json_build_object(
            'isValid', false,
            'reason', 'not_found'
        );
    END IF;
    
    -- Check if already validated
    IF invite_record.validated = true THEN
        RETURN json_build_object(
            'isValid', false,
            'reason', 'already_validated',
            'inviteCode', row_to_json(invite_record)
        );
    END IF;
    
    -- Check if expired
    created_at_ts := invite_record.created_at;
    expiry_date := created_at_ts + (invite_record.expire_by || ' days')::INTERVAL;
    now_ts := NOW();
    
    IF now_ts > expiry_date THEN
        RETURN json_build_object(
            'isValid', false,
            'reason', 'expired',
            'inviteCode', row_to_json(invite_record)
        );
    END IF;
    
    -- Code is valid, mark it as validated
    UPDATE invite_codes 
    SET validated = true
    WHERE id = invite_record.id;
    
    -- Get the updated record
    SELECT * INTO invite_record
    FROM invite_codes
    WHERE id = invite_record.id;
    
    RETURN json_build_object(
        'isValid', true,
        'inviteCode', row_to_json(invite_record)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'isValid', false,
            'reason', 'error',
            'message', SQLERRM
        );
END;
$$;

-- Create a SECURITY DEFINER function to get invite code details (without validation)
CREATE OR REPLACE FUNCTION get_invite_code_by_code(code_to_find TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invite_record invite_codes%ROWTYPE;
BEGIN
    -- Find the invite code (bypasses RLS due to SECURITY DEFINER)
    SELECT * INTO invite_record
    FROM invite_codes
    WHERE code = code_to_find;
    
    -- Check if code exists
    IF invite_record IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN row_to_json(invite_record);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;
