CREATE POLICY "Modules-characters associations are viewable by project members or if project is public" ON modules_characters FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM modules m
                JOIN trainings t ON t.id = m.training_id
                JOIN projects p ON p.id = t.project_id
                LEFT JOIN projects_profiles pp ON pp.project_id = p.id
                AND pp.profile_id = auth.uid()
            WHERE m.id = modules_characters.module_id
                AND (
                    -- Either the project is public
                    p.is_public = true
                    OR -- Or the user is a member of the project
                    pp.profile_id IS NOT NULL
                )
        )
    );

CREATE POLICY "Modules-characters associations are manageable by users with training.manage permission" ON modules_characters FOR ALL TO authenticated USING (
    authorize('training.manage')
    AND EXISTS (
        SELECT 1
        FROM modules m
            JOIN trainings t ON t.id = m.training_id
        WHERE m.id = modules_characters.module_id
            AND t.project_id = (
                SELECT current_project_id
                FROM profiles
                WHERE id = auth.uid()
            )
    )
) WITH CHECK (
    authorize('training.manage')
    AND EXISTS (
        SELECT 1
        FROM modules m
            JOIN trainings t ON t.id = m.training_id
        WHERE m.id = modules_characters.module_id
            AND t.project_id = (
                SELECT current_project_id
                FROM profiles
                WHERE id = auth.uid()
            )
    )
);