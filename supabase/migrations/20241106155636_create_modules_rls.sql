-- Module policies
CREATE POLICY "Anyone can view modules of public trainings" ON modules FOR
SELECT
  USING (
    EXISTS (
      SELECT
        1
      FROM
        trainings
      WHERE
        trainings.id = modules.training_id AND
        trainings.is_public = TRUE
    )
  );

CREATE POLICY "Private modules are only viewable by organization members the training module belongs to" ON modules FOR
SELECT
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        trainings
        JOIN profiles ON profiles.organization_id = trainings.organization_id
      WHERE
        trainings.id = modules.training_id AND
        profiles.id = auth.uid ()
    )
  );

CREATE POLICY "Modules are manageable by users with training.manage permission" ON modules FOR ALL TO authenticated USING (
  authorize ('training.manage') AND
  EXISTS (
    SELECT
      1
    FROM
      trainings
      JOIN profiles ON profiles.organization_id = trainings.organization_id
    WHERE
      trainings.id = modules.training_id AND
      profiles.id = auth.uid ()
  )
)
WITH
  CHECK (
    authorize ('training.manage') AND
    EXISTS (
      SELECT
        1
      FROM
        trainings
        JOIN profiles ON profiles.organization_id = trainings.organization_id
      WHERE
        trainings.id = modules.training_id AND
        profiles.id = auth.uid ()
    )
  );
