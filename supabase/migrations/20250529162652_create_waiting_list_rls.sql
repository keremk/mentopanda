-- Enable RLS on waiting_list table
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert waiting list entries (no authentication required)
CREATE POLICY "Anyone can join waiting list" ON waiting_list
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow anyone to view waiting list entries (needed for INSERT...SELECT)
CREATE POLICY "Anyone can view waiting list" ON waiting_list
    FOR SELECT
    USING (true);

-- Policy: Only authenticated users can delete waiting list entries
CREATE POLICY "Authenticated users can delete waiting list entries" ON waiting_list
    FOR DELETE
    TO authenticated
    USING (true);
