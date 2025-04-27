DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- Allow INSERT if user is authorized for 'training.manage' on the training's project
CREATE POLICY "Allow Training Cover INSERT" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'trainings' AND
    -- Find the project_id for the training being inserted into, then authorize
    public.authorize(
        'training.manage'::public.app_permission,
        (SELECT project_id FROM public.trainings WHERE id = ((string_to_array(name, '/'))[2])::bigint) -- Use index [2] for ID
    )
);

-- Allow UPDATE if user is authorized for 'training.manage' on the training's project
CREATE POLICY "Allow Training Cover UPDATE" ON storage.objects
FOR UPDATE TO authenticated
USING ( -- Check permission based on the object being updated
    bucket_id = 'trainings' AND
    public.authorize(
        'training.manage'::public.app_permission,
        (SELECT project_id FROM public.trainings WHERE id = ((string_to_array(name, '/'))[2])::bigint)
    )
)
WITH CHECK ( -- Re-check permission for the update operation
    bucket_id = 'trainings' AND
    public.authorize(
        'training.manage'::public.app_permission,
        (SELECT project_id FROM public.trainings WHERE id = ((string_to_array(name, '/'))[2])::bigint)
    )
);

-- Allow SELECT if user is a member of the project OR the project is public
CREATE POLICY "Allow Training Cover SELECT for Members or Public" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'trainings' AND
    (
        -- User is a member of the project containing the training
        EXISTS (
            SELECT 1
            FROM public.trainings t
            JOIN public.projects_profiles pp ON t.project_id = pp.project_id
            WHERE
                t.id = ((string_to_array(storage.objects.name, '/'))[2])::bigint AND
                pp.profile_id = auth.uid()
        ) OR
        -- Project containing the training is public
        EXISTS (
             SELECT 1
             FROM public.trainings t
             JOIN public.projects p ON t.project_id = p.id
             WHERE
                t.id = ((string_to_array(storage.objects.name, '/'))[2])::bigint AND
                p.is_public = true
        )
    )
);

-- Allow DELETE if user is authorized for 'training.manage' on the training's project
CREATE POLICY "Allow Training Cover DELETE" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'trainings' AND
    public.authorize(
        'training.manage'::public.app_permission,
        (SELECT project_id FROM public.trainings WHERE id = ((string_to_array(name, '/'))[2])::bigint)
    )
);


-- Allow INSERT if user has 'training.manage' permission on the character's project
CREATE POLICY "Allow Avatar INSERT" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'avatars' AND
    public.authorize(
        'training.manage'::public.app_permission,
        -- Look up project_id from the characters table using characterId from path {characterId}/avatar.png
        (SELECT project_id FROM public.characters WHERE id = ((string_to_array(name, '/'))[2])::bigint)
    )
);

-- Allow UPDATE if user has 'training.manage' permission on the character's project
CREATE POLICY "Allow Avatar UPDATE" ON storage.objects
FOR UPDATE TO authenticated
USING ( -- Check permission based on the object being updated
    bucket_id = 'avatars' AND
    public.authorize(
        'training.manage'::public.app_permission,
        (SELECT project_id FROM public.characters WHERE id = ((string_to_array(name, '/'))[2])::bigint)
    )
)
WITH CHECK ( -- Re-check permission for the update operation
    bucket_id = 'avatars' AND
    public.authorize(
        'training.manage'::public.app_permission,
        (SELECT project_id FROM public.characters WHERE id = ((string_to_array(name, '/'))[2])::bigint)
    )
);

-- Allow SELECT if user is a member of the project OR the project is public
CREATE POLICY "Allow Avatar SELECT for Members or Public" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'avatars' AND
    (
        -- User is a member of the project containing the character
        EXISTS (
            SELECT 1
            FROM public.characters c
            JOIN public.projects_profiles pp ON c.project_id = pp.project_id
            WHERE
                c.id = ((string_to_array(storage.objects.name, '/'))[2])::bigint AND
                pp.profile_id = auth.uid()
        ) OR
        -- Project containing the character is public
        EXISTS (
             SELECT 1
             FROM public.characters c
             JOIN public.projects p ON c.project_id = p.id
             WHERE
                c.id = ((string_to_array(storage.objects.name, '/'))[2])::bigint AND
                p.is_public = true
        )
    )
);

-- Allow DELETE if user has 'training.manage' permission on the character's project
CREATE POLICY "Allow Avatar DELETE" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'avatars' AND
    public.authorize(
        'training.manage'::public.app_permission,
        (SELECT project_id FROM public.characters WHERE id = ((string_to_array(name, '/'))[2])::bigint)
    )
);

