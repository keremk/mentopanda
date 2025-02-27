CREATE OR REPLACE FUNCTION authorize(requested_permission app_permission, project_id bigint) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public AS $$ 
DECLARE
  jwt_project_id bigint;
BEGIN
  -- Get the current project ID from JWT
  jwt_project_id := (auth.jwt()->'current_project_id')::bigint;
  
  -- Only authorize if the requested project matches the current project in JWT
  -- and the user has the requested permission
  RETURN 
    project_id = jwt_project_id AND
    requested_permission = ANY(
      ARRAY(
        SELECT jsonb_array_elements_text((auth.jwt()->'permissions')::jsonb)
      )::public.app_permission[]
    );
END;
$$;