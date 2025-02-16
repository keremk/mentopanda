-- Policy for users to manage their own enrollments (view, create, update, delete)
CREATE POLICY "Users can manage their own enrollments" ON enrollments FOR ALL TO authenticated USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM trainings t
      JOIN projects p ON p.id = t.project_id
      LEFT JOIN projects_profiles pp ON pp.project_id = p.id
      AND pp.profile_id = auth.uid()
    WHERE t.id = enrollments.training_id
      AND (
        -- Either the project is public
        p.is_public = true
        OR -- Or the user is a member of the project
        pp.profile_id IS NOT NULL
      )
  )
) WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM trainings t
      JOIN projects p ON p.id = t.project_id
      LEFT JOIN projects_profiles pp ON pp.project_id = p.id
      AND pp.profile_id = auth.uid()
    WHERE t.id = enrollments.training_id
      AND (
        -- Either the project is public
        p.is_public = true
        OR -- Or the user is a member of the project
        pp.profile_id IS NOT NULL
      )
  )
);

-- Policy for users with training.manage permission to manage enrollments in their project
CREATE POLICY "Training managers can manage other users' enrollments in their project" ON enrollments FOR ALL TO authenticated USING (
  authorize('enrollment.manage')
  AND EXISTS (
    SELECT 1
    FROM trainings t
    WHERE t.id = enrollments.training_id
      AND t.project_id = (
        SELECT current_project_id
        FROM profiles
        WHERE id = auth.uid()
      )
  )
) WITH CHECK (
  authorize('enrollment.manage')
  AND EXISTS (
    SELECT 1
    FROM trainings t
    WHERE t.id = enrollments.training_id
      AND t.project_id = (
        SELECT current_project_id
        FROM profiles
        WHERE id = auth.uid()
      )
  )
);