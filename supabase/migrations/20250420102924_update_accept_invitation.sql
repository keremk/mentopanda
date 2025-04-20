DROP FUNCTION IF EXISTS accept_invitation(BIGINT, UUID);

CREATE OR REPLACE FUNCTION accept_invitation(
    invitation_id BIGINT, 
    user_id UUID, 
    p_project_id BIGINT DEFAULT NULL -- Optional project ID, takes precedence if provided
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the creator
SET search_path = public
AS $$
DECLARE
  v_invitation_project_id BIGINT; -- Project ID from the invitation record (can be NULL)
  v_target_project_id BIGINT; -- The final project ID to use
  v_role USER_ROLE;
  v_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO v_email FROM auth.users WHERE id = user_id;
  
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'User not found: %', user_id;
  END IF;
  
  -- Get the invitation details (role is required, project_id might be null)
  SELECT project_id, role 
  INTO v_invitation_project_id, v_role
  FROM invitations
  WHERE id = invitation_id
  AND invitee_email = v_email;
  
  -- Check if invitation exists and belongs to the user
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or not for this user (ID: %, Email: %)', invitation_id, v_email;
  END IF;

  -- Determine the target project ID
  IF p_project_id IS NOT NULL THEN
    v_target_project_id := p_project_id; -- Use provided project ID
  ELSE
    v_target_project_id := v_invitation_project_id; -- Fallback to invitation's project ID
  END IF;

  -- Ensure we have a project ID to proceed
  IF v_target_project_id IS NULL THEN
    RAISE EXCEPTION 'Project ID must be provided directly or exist in the invitation record (Invitation ID: %)', invitation_id;
  END IF;
  
  -- Add the user to the determined project
  INSERT INTO projects_profiles (project_id, profile_id, role)
  VALUES (v_target_project_id, user_id, v_role)
  ON CONFLICT (project_id, profile_id) DO UPDATE SET role = v_role;
  
  -- Delete the invitation
  DELETE FROM invitations WHERE id = invitation_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise the original exception to preserve details
    RAISE; 
END;
$$;

-- Update comment
COMMENT ON FUNCTION accept_invitation(BIGINT, UUID, BIGINT) IS 'Securely accepts an invitation, adds a user to a project using provided project_id or fallback to invitation project_id - bypasses RLS';
