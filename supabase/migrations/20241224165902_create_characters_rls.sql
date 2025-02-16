CREATE POLICY "Characters are viewable by project members or if project is public" ON characters FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM projects p
                LEFT JOIN projects_profiles pp ON pp.project_id = p.id
                AND pp.profile_id = auth.uid()
            WHERE p.id = characters.project_id
                AND (
                    -- Either the project is public
                    p.is_public = true
                    OR -- Or the user is a member of the project
                    pp.profile_id IS NOT NULL
                )
        )
    );

CREATE POLICY "Characters are manageable by users with training.manage permission" ON characters FOR ALL TO authenticated USING (
    authorize('training.manage')
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.current_project_id = characters.project_id
    )
) WITH CHECK (
    authorize('training.manage')
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.current_project_id = characters.project_id
    )
);