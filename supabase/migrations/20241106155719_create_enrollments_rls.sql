-- Policy for users to manage their own enrollments (view, create, update, delete)
CREATE POLICY "Users can manage their own enrollments" ON enrollments FOR ALL TO authenticated USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM trainings t
    JOIN projects p ON p.id = t.project_id
    WHERE t.id = enrollments.training_id
    AND (
      -- Either the project is public
      p.is_public = true
      OR 
      -- Or the training belongs to the user's current project
      p.id = (auth.jwt()->>'current_project_id')::bigint
    )
  )
) WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM trainings t
    JOIN projects p ON p.id = t.project_id
    WHERE t.id = enrollments.training_id
    AND (
      -- Either the project is public
      p.is_public = true
      OR 
      -- Or the training belongs to the user's current project
      p.id = (auth.jwt()->>'current_project_id')::bigint
    )
  )
);

-- Policy for users with training.manage permission to manage enrollments in their project
CREATE POLICY "Users with enrollment.manage permission can manage other users' enrollments in their project" ON enrollments FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM trainings t
    WHERE t.id = enrollments.training_id
    AND authorize('enrollment.manage', t.project_id)
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM trainings t
    WHERE t.id = enrollments.training_id
    AND authorize('enrollment.manage', t.project_id)
  )
);