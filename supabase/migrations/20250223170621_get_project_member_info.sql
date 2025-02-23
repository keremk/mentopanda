CREATE OR REPLACE FUNCTION public.get_project_member_info(p_project_id bigint, p_user_id uuid)
RETURNS json AS $$
DECLARE
    authorized boolean;
    member_info json;
BEGIN
    -- Check if the caller has 'project.member.manage' permission
    authorized := public.authorize('project.member.manage'::public.app_permission);

    IF authorized THEN
        -- Retrieve single member's information for the specified project and user
        SELECT json_build_object(
            'user_id', pp.profile_id,
            'email', u.email,
            'displayname', u.raw_user_meta_data->>'displayname',
            'avatar_url', u.raw_user_meta_data->>'avatar_url',
            'role', pp.role
        )
        INTO member_info
        FROM public.projects_profiles pp
        JOIN auth.users u ON pp.profile_id = u.id
        WHERE pp.project_id = p_project_id 
        AND pp.profile_id = p_user_id;

        -- Return success with member data, null if member not found
        RETURN json_build_object(
            'status', 'success',
            'data', COALESCE(member_info, null)
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

GRANT EXECUTE ON FUNCTION public.get_project_member_info TO authenticated;
