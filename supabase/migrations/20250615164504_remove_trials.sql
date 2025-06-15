-- Remove trials functionality from database

-- 1. Drop the trial invitations RLS policy
DROP POLICY IF EXISTS "Trial invitations are manageable by users with trials.manage pe" ON invitations;

-- 2. Remove is_trial column from invitations table
ALTER TABLE invitations DROP COLUMN IF EXISTS is_trial;

-- 3. Remove trial columns from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS trial_start;
ALTER TABLE profiles DROP COLUMN IF EXISTS trial_end;

-- 4. Update get_user_profile function to remove trial references
CREATE OR REPLACE FUNCTION get_user_profile(user_id uuid) RETURNS json 
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE 
  result json;
  user_project_role user_role;

BEGIN 
  -- Check if the requesting user is the same as the requested profile
  IF auth.uid() != user_id THEN 
    RAISE EXCEPTION 'Permission denied' USING hint = 'Users can only access their own profiles';
  END IF;

  -- Get the user's role in their current project
  SELECT pp.role INTO user_project_role
  FROM profiles p
  JOIN projects_profiles pp ON p.current_project_id = pp.project_id AND p.id = pp.profile_id
  WHERE p.id = user_id;

  SELECT json_build_object(
      'id',
      au.id,
      'email',
      au.email,
      'display_name',
      COALESCE(
        (au.raw_user_meta_data->>'display_name')::text,
        split_part(au.email, '@', 1),
        'User'
      ),
      'avatar_url',
      (au.raw_user_meta_data->>'avatar_url')::text,
      'pricing_plan',
      p.pricing_plan,
      'onboarding',
      p.onboarding,
      'current_project',
      json_build_object(
        'id',
        proj.id,
        'name',
        proj.name,
        'is_public',
        proj.is_public
      ),
      -- Get permissions directly from the database based on the user's role in their current project
      'permissions',
      array(
        SELECT rp.permission
        FROM role_permissions rp
        WHERE rp.role = user_project_role
      ),
      'project_role',
      user_project_role
    ) INTO result
  FROM auth.users au
    JOIN public.profiles p ON p.id = au.id
    JOIN public.projects proj ON proj.id = p.current_project_id
  WHERE au.id = user_id;

  RETURN result;

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_profile(uuid) TO authenticated;
