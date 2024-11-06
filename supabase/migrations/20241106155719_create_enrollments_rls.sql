-- Enrollment policies
CREATE POLICY "Users can view their own enrollments" ON enrollments FOR
SELECT
  TO authenticated USING (user_id = auth.uid ());

CREATE POLICY "Users can enroll themselves in trainings" ON enrollments FOR insert TO authenticated
WITH
  CHECK (
    user_id = auth.uid ()
    AND EXISTS (
      SELECT
        1
      FROM
        trainings
      WHERE
        trainings.id = enrollments.training_id
        AND (
          trainings.is_public = TRUE
          OR EXISTS (
            SELECT
              1
            FROM
              profiles
            WHERE
              profiles.id = auth.uid ()
              AND profiles.organization_id = trainings.organization_id
          )
        )
    )
  );

CREATE POLICY "Users can remove their own enrollments" ON enrollments FOR delete TO authenticated USING (user_id = auth.uid ());