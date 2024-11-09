-- Policy for users to manage their own enrollments (view, create, update, delete)
CREATE POLICY "Users can manage their own enrollments" ON enrollments
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM trainings
      WHERE trainings.id = enrollments.training_id
      AND (
        trainings.is_public = TRUE
        OR EXISTS (
          SELECT 1
          FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.organization_id = trainings.organization_id
        )
      )
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM trainings
      WHERE trainings.id = enrollments.training_id
      AND (
        trainings.is_public = TRUE
        OR EXISTS (
          SELECT 1
          FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.organization_id = trainings.organization_id
        )
      )
    )
  );

-- Policy for users with training.manage permission to manage enrollments in their organization
CREATE POLICY "Training managers can manage organization enrollments" ON enrollments
  FOR ALL TO authenticated
  USING (
    authorize('training.manage')
    AND EXISTS (
      SELECT 1
      FROM profiles p1
      JOIN profiles p2 ON p1.organization_id = p2.organization_id
      WHERE p1.id = auth.uid()
      AND p2.id = enrollments.user_id
    )
  )
  WITH CHECK (
    authorize('training.manage')
    AND EXISTS (
      SELECT 1
      FROM profiles p1
      JOIN profiles p2 ON p1.organization_id = p2.organization_id
      WHERE p1.id = auth.uid()
      AND p2.id = enrollments.user_id
    )
  );