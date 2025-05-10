DROP POLICY IF EXISTS "Allow Character Avatar SELECT for Members or Public" ON storage.objects;

CREATE POLICY "Allow Character Avatar SELECT for Members or Public" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'avatars' AND
    name LIKE 'character-avatars/%' AND
    (
        -- User is a member of the project containing the character
        EXISTS (
            SELECT 1
            FROM public.projects_profiles pp
            WHERE
                pp.project_id = public.get_character_project_id(((string_to_array(storage.objects.name, '/'))[2])::bigint) AND
                pp.profile_id = auth.uid()
        ) OR
        -- Project containing the character is public
        EXISTS (
             SELECT 1
             FROM public.projects p
             WHERE
                p.id = public.get_character_project_id(((string_to_array(storage.objects.name, '/'))[2])::bigint) AND
                p.is_public = true
        )
    )
);
