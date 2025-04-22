-- Function to safely get user emails from auth.users by IDs
CREATE OR REPLACE FUNCTION public.get_user_emails_by_ids(user_ids uuid[])
RETURNS TABLE (id uuid, email text)
LANGUAGE sql
SECURITY DEFINER -- Use DEFINER for safety, allows controlled access to auth schema
AS $$
  SELECT u.id, u.email
  FROM auth.users u
  WHERE u.id = ANY(user_ids);
$$;

-- Grant execute permission to the service_role (used by your script)
GRANT EXECUTE ON FUNCTION public.get_user_emails_by_ids(uuid[]) TO service_role;
-- Grant execute permission to authenticated users if needed elsewhere
GRANT EXECUTE ON FUNCTION public.get_user_emails_by_ids(uuid[]) TO authenticated;
