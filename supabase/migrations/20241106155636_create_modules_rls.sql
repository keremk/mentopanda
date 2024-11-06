-- Module policies
CREATE POLICY "Anyone can view modules of public trainings" ON modules FOR
SELECT
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        trainings
      WHERE
        trainings.id = modules.training_id
        AND trainings.is_public = TRUE
    )
  );

CREATE POLICY "Organization members can view modules of private trainings" ON modules FOR
SELECT
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        trainings
        JOIN profiles ON profiles.organization_id = trainings.organization_id
      WHERE
        trainings.id = modules.training_id
        AND profiles.id = auth.uid ()
    )
  );

CREATE POLICY "Users can view modules of enrolled trainings" ON modules FOR
SELECT
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        enrollments
      WHERE
        enrollments.training_id = modules.training_id
        AND enrollments.user_id = auth.uid ()
    )
  );

CREATE POLICY "Modules are manageable by users with training.manage permission" ON modules FOR ALL TO authenticated USING (
  authorize ('training.manage')
  AND EXISTS (
    SELECT
      1
    FROM
      trainings
      JOIN profiles ON profiles.organization_id = trainings.organization_id
    WHERE
      trainings.id = modules.training_id
      AND profiles.id = auth.uid ()
  )
);