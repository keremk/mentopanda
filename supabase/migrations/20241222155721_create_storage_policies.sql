insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid() = owner
    );