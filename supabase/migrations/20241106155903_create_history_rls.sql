CREATE POLICY "Users can read their own history" ON history FOR
SELECT
  USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own history" ON history FOR insert
WITH
  CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own history" ON history
FOR UPDATE
  USING (auth.uid () = user_id)
WITH
  CHECK (auth.uid () = user_id);

CREATE POLICY "Users can delete their own history" ON history FOR delete USING (auth.uid () = user_id);
