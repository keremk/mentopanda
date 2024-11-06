-- Training policies
CREATE POLICY "Anyone can view public trainings" ON trainings FOR
SELECT
  TO authenticated USING (is_public = TRUE);

CREATE POLICY "Organization members can view private trainings" ON trainings FOR
SELECT
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        profiles
      WHERE
        profiles.id = auth.uid ()
        AND profiles.organization_id = trainings.organization_id
    )
  );

CREATE POLICY "Users can view enrolled trainings" ON trainings FOR
SELECT
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        enrollments
      WHERE
        enrollments.training_id = trainings.id
        AND enrollments.user_id = auth.uid ()
    )
  );

CREATE POLICY "Trainings are manageable by users with training.manage permission" ON trainings FOR ALL TO authenticated USING (
  authorize ('training.manage')
  AND EXISTS (
    SELECT
      1
    FROM
      profiles
    WHERE
      profiles.id = auth.uid ()
      AND profiles.organization_id = trainings.organization_id
  )
);