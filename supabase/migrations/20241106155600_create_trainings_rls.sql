-- Training policies
CREATE POLICY "Trainings are viewable by project members or if project is public" ON trainings FOR
SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = trainings.project_id
    AND (
      -- Either the project is public
      p.is_public = true
      OR 
      -- Or the training belongs to the user's current project
      p.id = (auth.jwt()->>'current_project_id')::bigint
    )
  )
);

CREATE POLICY "Trainings are manageable by users with training.manage permission" ON trainings FOR ALL TO authenticated 
USING (authorize('training.manage', trainings.project_id))
WITH CHECK (authorize('training.manage', trainings.project_id));