-- Allow users to view their own organization
CREATE POLICY "Users can view their own organization" ON organizations FOR
SELECT
  USING (
    id IN (
      SELECT
        organization_id
      FROM
        profiles
      WHERE
        id = auth.uid ()
    )
  );

-- Allow organization admins to update organizations they belong to, except IDs 1
CREATE POLICY "Organization admins can update their organizations" ON organizations FOR ALL USING (
  authorize ('organization.admin') AND
  id IN (
    SELECT
      organization_id
    FROM
      profiles
    WHERE
      id = auth.uid ()
  ) AND
  id NOT IN (1)
)
WITH
  CHECK (authorize ('organization.admin'));
