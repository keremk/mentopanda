CREATE POLICY "Modules are viewable by project members or if project is public" ON modules FOR
SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM trainings t
    JOIN projects p ON p.id = t.project_id
    WHERE t.id = modules.training_id
    AND (
      -- Either the project is public
      p.is_public = true
      OR 
      -- Or the module belongs to the user's current project
      p.id = (auth.jwt()->>'current_project_id')::bigint
    )
  )
);

CREATE POLICY "Modules are manageable by users with training.manage permission" ON modules FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM trainings t
    WHERE t.id = modules.training_id 
    AND authorize('training.manage', t.project_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM trainings t
    WHERE t.id = modules.training_id 
    AND authorize('training.manage', t.project_id)
  )
);