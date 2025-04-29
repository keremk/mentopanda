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

-- Ensure any temporary or incorrect avatar policies are removed first
DROP POLICY IF EXISTS "Allow Avatar INSERT" ON storage.objects;
DROP POLICY IF EXISTS "Allow Avatar UPDATE" ON storage.objects;
DROP POLICY IF EXISTS "Allow Avatar SELECT for Members or Public" ON storage.objects;
DROP POLICY IF EXISTS "Allow Avatar DELETE" ON storage.objects;
DROP POLICY IF EXISTS "Allow OWN User Avatar INSERT" ON storage.objects;
DROP POLICY IF EXISTS "Allow OWN User Avatar UPDATE" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated Avatar SELECT" ON storage.objects;
DROP POLICY IF EXISTS "Allow OWN User Avatar DELETE" ON storage.objects;

-- Function to get project_id for a character, bypassing RLS SELECT checks on characters
CREATE OR REPLACE FUNCTION public.get_character_project_id(p_character_id bigint) -- Adjust type if needed
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER -- Runs as owner (postgres), bypassing RLS
SET search_path = public -- Ensure it finds public.characters
AS $$
    SELECT project_id FROM public.characters WHERE id = p_character_id;
$$;

-- Grant permission for authenticated users to EXECUTE this function
GRANT EXECUTE ON FUNCTION public.get_character_project_id(bigint) TO authenticated; -- Adjust type if needed

-- ==========================================
-- POLICIES FOR USER AVATARS (user-avatars/)
-- ==========================================

-- Allow users to INSERT their own avatar
CREATE POLICY "Allow OWN User Avatar INSERT" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'avatars' AND
    -- Check if the path starts with 'user-avatars/' followed by the user's own ID
    name LIKE ('user-avatars/' || auth.uid() || '/%')
);

-- Allow users to UPDATE their own avatar
CREATE POLICY "Allow OWN User Avatar UPDATE" ON storage.objects
FOR UPDATE TO authenticated
USING ( -- User must own the existing object
    bucket_id = 'avatars' AND
    name LIKE ('user-avatars/' || auth.uid() || '/%')
)
WITH CHECK ( -- User must still own the object after update
    bucket_id = 'avatars' AND
    name LIKE ('user-avatars/' || auth.uid() || '/%')
);

-- Allow any authenticated user to SELECT any user's avatar
CREATE POLICY "Allow Authenticated User Avatar SELECT" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'avatars' AND
    name LIKE 'user-avatars/%'
);

-- Allow users to DELETE their own avatar
CREATE POLICY "Allow OWN User Avatar DELETE" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'avatars' AND
    name LIKE ('user-avatars/' || auth.uid() || '/%')
);


-- ==========================================
-- POLICIES FOR CHARACTER AVATARS (character-avatars/)
-- ==========================================
-- Re-apply the original logic, assuming 'training.manage' IS the correct permission needed

-- Allow INSERT if user has 'training.manage' permission on the character's project
CREATE POLICY "Allow Character Avatar INSERT" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'avatars' AND
    name LIKE 'character-avatars/%' AND
    public.authorize(
        'training.manage'::public.app_permission,
        -- Use the helper function to bypass characters RLS SELECT check
        public.get_character_project_id(((string_to_array(name, '/'))[2])::bigint) -- Use index [2] and adjust cast!
    )
);

CREATE POLICY "Allow Character Avatar UPDATE" ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'avatars' AND
    name LIKE 'character-avatars/%' AND
    public.authorize(
        'training.manage'::public.app_permission,
        public.get_character_project_id(((string_to_array(name, '/'))[2])::bigint) -- Use index [2] and adjust cast!
    )
)
WITH CHECK (
        bucket_id = 'avatars' AND
        name LIKE 'character-avatars/%' AND
        public.authorize(
        'training.manage'::public.app_permission,
        public.get_character_project_id(((string_to_array(name, '/'))[2])::bigint) -- Use index [2] and adjust cast!
    )
);

-- Allow SELECT if user is a member of the project OR the project is public
CREATE POLICY "Allow Character Avatar SELECT for Members or Public" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'avatars' AND
    name LIKE 'character-avatars/%' AND
    (
        -- User is a member of the project containing the character
        EXISTS (
            SELECT 1
            FROM public.characters c
            JOIN public.projects_profiles pp ON c.project_id = pp.project_id
            WHERE
                c.id = public.get_character_project_id(((string_to_array(storage.objects.name, '/'))[2])::bigint) AND -- Adjust cast!
                pp.profile_id = auth.uid()
        ) OR
        -- Project containing the character is public
        EXISTS (
             SELECT 1
             FROM public.characters c
             JOIN public.projects p ON c.project_id = p.id
             WHERE
                c.id = public.get_character_project_id(((string_to_array(storage.objects.name, '/'))[2])::bigint) AND -- Adjust cast!
                p.is_public = true
        )
    )
);

-- Allow DELETE if user has 'training.manage' permission on the character's project
CREATE POLICY "Allow Character Avatar DELETE" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'avatars' AND
    name LIKE 'character-avatars/%' AND
    public.authorize(
        'training.manage'::public.app_permission,
        (SELECT project_id FROM public.characters WHERE id = public.get_character_project_id(((string_to_array(name, '/'))[2])::bigint)) -- Adjust cast!
    )
);

