-- Create buckets if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('avatars', 'avatars', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'trainings') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('trainings', 'trainings', true);
    END IF;
END $$;

-- Create a single policy that handles both buckets
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        (
            bucket_id = 'avatars'
            OR bucket_id = 'trainings'
        )
        AND auth.uid() = owner
    );