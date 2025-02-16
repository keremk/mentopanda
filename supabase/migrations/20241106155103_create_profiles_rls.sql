-- Allow users to view their own profile always
CREATE POLICY "Users can view their own profile" ON profiles FOR
SELECT TO authenticated USING (id = auth.uid());

-- Allow users to view profiles of users in their projects
CREATE POLICY "Users can view profiles of users in shared projects" ON profiles FOR
SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM projects_profiles pp1
        JOIN projects_profiles pp2 ON pp1.project_id = pp2.project_id
      WHERE pp1.profile_id = auth.uid()
        AND pp2.profile_id = profiles.id
    )
  );

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON profiles FOR
UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());