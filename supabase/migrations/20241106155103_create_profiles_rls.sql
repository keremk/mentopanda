-- Profile policies
-- CREATE POLICY "Users can view their own profile" ON profiles FOR
-- SELECT
--   TO authenticated USING (id = auth.uid ());

-- Create a function to get the current user's organization_id
CREATE
OR REPLACE function public.get_current_user_organization_id () returns bigint language sql security definer stable
SET
  search_path = public AS $$
  SELECT organization_id 
  FROM profiles 
  WHERE id = auth.uid()
$$;

CREATE POLICY "Users with user.select permission can only view profiles in same organization" ON profiles FOR
SELECT
  TO authenticated USING (
    -- Allow users to see their own profile regardless of organization
    id = auth.uid ()
    OR (
      authorize ('user.select') 
      -- Use the function to get organization_id without recursion
      AND get_current_user_organization_id () != 1 -- Exclude special "No organization" case
      AND organization_id = get_current_user_organization_id ()
    )
  );

CREATE POLICY "Users can update their own profile or admins can update profiles in their organization" ON profiles 
FOR UPDATE
  TO authenticated USING (
    id = auth.uid () 
    OR (
      -- Check if user has user.admin permission AND target profile is in same organization
      authorize ('user.admin')
      AND organization_id = get_current_user_organization_id ()
    )
  )
WITH
  CHECK (
    id = auth.uid () 
    OR (
      -- Check if user has user.admin permission AND target profile is in same organization
      authorize ('user.admin')
      AND organization_id = get_current_user_organization_id ()
    )
  );