-- Training policies
CREATE POLICY "Anyone can view public trainings" ON trainings FOR
SELECT
  USING (is_public = TRUE);

CREATE POLICY "Private trainings are only viewable by organization members the training belongs to" ON trainings FOR
SELECT
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        profiles
      WHERE
        profiles.id = auth.uid () AND
        profiles.organization_id = trainings.organization_id AND
        trainings.is_public = FALSE
    )
  );

CREATE POLICY "Trainings are manageable by users with training.manage permission" ON trainings FOR ALL TO authenticated USING (
  authorize ('training.manage') AND
  EXISTS (
    SELECT
      1
    FROM
      profiles
    WHERE
      profiles.id = auth.uid () AND
      profiles.organization_id = trainings.organization_id
  )
)
WITH
  CHECK (
    authorize ('training.manage') AND
    EXISTS (
      SELECT
        1
      FROM
        profiles
      WHERE
        profiles.id = auth.uid () AND
        profiles.organization_id = trainings.organization_id
    )
  );