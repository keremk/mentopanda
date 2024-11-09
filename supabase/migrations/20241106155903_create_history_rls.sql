CREATE POLICY "Users can manage their own history" ON history
FOR ALL
  USING (auth.uid () = user_id)
WITH
  CHECK (auth.uid () = user_id);
