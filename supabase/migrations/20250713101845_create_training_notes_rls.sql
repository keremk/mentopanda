-- RLS Policies for training_notes table
-- User-specific notes data - only accessible by the user who created them

-- SELECT: Users can view their own training notes
CREATE POLICY "Users can view their own training notes" ON training_notes
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- INSERT: Authenticated users can create training notes for themselves
CREATE POLICY "Users can create their own training notes" ON training_notes
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own training notes
CREATE POLICY "Users can update their own training notes" ON training_notes
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own training notes
CREATE POLICY "Users can delete their own training notes" ON training_notes
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);
