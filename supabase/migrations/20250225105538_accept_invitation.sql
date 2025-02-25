CREATE OR REPLACE FUNCTION accept_invitation(invitation_id BIGINT, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the creator
SET search_path = public
AS $$
DECLARE
  v_project_id BIGINT;
  v_role USER_ROLE;
  v_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO v_email FROM auth.users WHERE id = user_id;
  
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Get the invitation details
  SELECT project_id, role INTO v_project_id, v_role
  FROM invitations
  WHERE id = invitation_id
  AND invitee_email = v_email;
  
  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or not for this user';
  END IF;
  
  -- Add the user to the project
  INSERT INTO projects_profiles (project_id, profile_id, role)
  VALUES (v_project_id, user_id, v_role)
  ON CONFLICT (project_id, profile_id) DO UPDATE SET role = v_role;
  
  -- Delete the invitation
  DELETE FROM invitations WHERE id = invitation_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Add comment explaining the function
COMMENT ON FUNCTION accept_invitation(BIGINT, UUID) IS 'Securely accepts an invitation and adds a user to a project - bypasses RLS';
