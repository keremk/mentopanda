CREATE OR REPLACE FUNCTION create_project(project_name text) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE new_project_id bigint;

BEGIN -- Check if user is authenticated
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated';

END IF;

-- Start transaction
BEGIN -- Create new project (always private)
INSERT INTO public.projects (name, is_public, created_by)
VALUES (project_name, false, auth.uid())
RETURNING id INTO new_project_id;

-- Add creator as admin
INSERT INTO public.projects_profiles (project_id, profile_id, role)
VALUES (
        new_project_id,
        auth.uid(),
        'admin'::public.user_role
    );

RETURN new_project_id;

EXCEPTION
WHEN OTHERS THEN -- Roll back both inserts if either fails
RAISE;

END;

END;

$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_project(text) TO authenticated;

-- Revoke execute from anon and public
REVOKE EXECUTE ON FUNCTION create_project(text)
FROM anon,
    public;