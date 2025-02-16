-- Training policies
CREATE POLICY "Trainings are viewable by project members or if project is public" ON trainings FOR
SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM projects p
        LEFT JOIN projects_profiles pp ON pp.project_id = p.id
        AND pp.profile_id = auth.uid()
      WHERE p.id = trainings.project_id
        AND (
          -- Either the project is public
          p.is_public = true
          OR -- Or the user is a member of the project
          pp.profile_id IS NOT NULL
        )
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
      profiles.current_project_id = trainings.project_id
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
        profiles.current_project_id = trainings.project_id
    )
  );