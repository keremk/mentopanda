CREATE POLICY "Any member can view role permissions" ON role_permissions FOR
SELECT
  TO authenticated USING (TRUE);