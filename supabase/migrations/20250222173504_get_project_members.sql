CREATE OR REPLACE FUNCTION public.get_project_members(p_project_id bigint)
RETURNS json AS $$
DECLARE
    authorized boolean;
    members json;
BEGIN
    -- Check if the caller has 'project.member.manage' permission
    authorized := public.authorize('project.member.manage'::public.app_permission);

    IF authorized THEN
        -- Retrieve members' information for the specified project
        SELECT json_agg(json_build_object(
            'user_id', pp.profile_id,
            'email', u.email,
            'displayname', u.raw_user_meta_data->>'displayname',
            'avatar_url', u.raw_user_meta_data->>'avatar_url',
            'role', pp.role
        ))
        INTO members
        FROM public.projects_profiles pp
        JOIN auth.users u ON pp.profile_id = u.id
        WHERE pp.project_id = p_project_id;

        -- Return success with members data, defaulting to empty array if no members
        RETURN json_build_object(
            'status', 'success',
            'data', COALESCE(members, '[]'::json)
        );
    ELSE
        -- Return error if user lacks permission
        RETURN json_build_object(
            'status', 'error',
            'message', 'Access denied'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_project_members TO authenticated;