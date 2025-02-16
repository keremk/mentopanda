CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb) RETURNS jsonb 
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    claims jsonb;
    user_id uuid;
    current_project_id bigint;
    project_role public.user_role;
    user_permissions public.app_permission[];
    debug_profiles jsonb;
    debug_projects jsonb;
BEGIN
    RAISE LOG 'custom_access_token_hook called with event: %', event;

    claims := event->'claims';
    user_id := (event->>'user_id')::uuid;

    -- Debug the full profiles row
    SELECT row_to_json(p)::jsonb INTO debug_profiles
    FROM public.profiles p
    WHERE p.id = user_id;
    
    RAISE LOG 'Debug profiles row: %', debug_profiles;

    -- Get current project and explicit role if any
    SELECT p.current_project_id, pp.role 
    INTO current_project_id, project_role
    FROM public.profiles p
    LEFT JOIN public.projects_profiles pp ON pp.project_id = p.current_project_id AND pp.profile_id = user_id
    WHERE p.id = user_id;

    -- Debug the full projects row
    SELECT row_to_json(pr)::jsonb INTO debug_projects
    FROM public.projects pr
    WHERE pr.id = current_project_id;
    
    RAISE LOG 'Debug projects row: %', debug_projects;
    RAISE LOG 'Found project_id: %, role: %', current_project_id, project_role;

    -- Get permissions for the role
    SELECT array_agg(permission) INTO user_permissions
    FROM public.role_permissions
    WHERE role = COALESCE(project_role, 'member'::public.user_role);

    -- Set our custom claims
    claims := jsonb_set(claims, '{current_project_id}', to_jsonb(current_project_id));
    claims := jsonb_set(claims, '{project_role}', to_jsonb(COALESCE(project_role, 'member')));
    claims := jsonb_set(claims, '{permissions}', to_jsonb(COALESCE(user_permissions, ARRAY[]::public.app_permission[])));

    -- Update the claims in the event
    RETURN jsonb_set(event, '{claims}', claims);
END;
$$;