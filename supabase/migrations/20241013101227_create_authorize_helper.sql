CREATE OR REPLACE FUNCTION authorize(requested_permission app_permission) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public AS $$ BEGIN RETURN requested_permission = ANY(
    ARRAY(
      SELECT jsonb_array_elements_text((auth.jwt()->'permissions')::jsonb)
    )::public.app_permission []
  );

END;

$$;