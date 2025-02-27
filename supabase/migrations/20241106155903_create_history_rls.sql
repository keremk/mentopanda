-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own history" ON history;
DROP POLICY IF EXISTS "Users with training.history permission can view history in their project" ON history;

-- Combined policy for viewing history
CREATE POLICY "Users can view history they own or have permission to see" ON history
FOR SELECT
USING (
  -- Either it's the user's own history
  auth.uid() = user_id
  OR
  -- Or they have permission to view history in this project
  EXISTS (
    SELECT 1
    FROM modules m
    JOIN trainings t ON t.id = m.training_id
    WHERE m.id = history.module_id
    AND authorize('training.history', t.project_id)
  )
);

-- Policy for users to manage only their own history
CREATE POLICY "Users can insert their own history" ON history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own history" ON history
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history" ON history
FOR DELETE
USING (auth.uid() = user_id);