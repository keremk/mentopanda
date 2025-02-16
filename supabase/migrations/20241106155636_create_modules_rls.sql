-- Module policies
CREATE POLICY "Modules are viewable by project members or if project is public" ON modules FOR
SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM trainings t
        JOIN projects p ON p.id = t.project_id
        LEFT JOIN projects_profiles pp ON pp.project_id = p.id
        AND pp.profile_id = auth.uid()
      WHERE t.id = modules.training_id
        AND (
          -- Either the project is public
          p.is_public = true
          OR -- Or the user is a member of the project
          pp.profile_id IS NOT NULL
        )
    )
  );

CREATE POLICY "Modules are manageable by users with training.manage permission" ON modules FOR ALL TO authenticated USING (
  authorize ('training.manage') AND
  EXISTS (
    SELECT
      1
    FROM
      trainings
      JOIN profiles ON profiles.current_project_id = trainings.project_id
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
        JOIN profiles ON profiles.current_project_id = trainings.project_id
      WHERE
        trainings.id = modules.training_id AND
        profiles.id = auth.uid ()
    )
  );
