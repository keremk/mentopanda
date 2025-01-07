-- Create buckets
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true),
    ('trainings', 'trainings', true);

-- Create a single policy that handles both buckets
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        (
            bucket_id = 'avatars'
            OR bucket_id = 'trainings'
        )
        AND auth.uid() = owner
    );