CREATE POLICY "Modules-characters associations are viewable by project members or if project is public" ON modules_characters FOR
SELECT TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM modules m
        JOIN trainings t ON t.id = m.training_id
        JOIN projects p ON p.id = t.project_id
        WHERE m.id = modules_characters.module_id
        AND (
            -- Either the project is public
            p.is_public = true
            OR 
            -- Or the module belongs to the user's current project
            p.id = (auth.jwt()->>'current_project_id')::bigint
        )
    )
);

CREATE POLICY "Modules-characters associations are manageable by users with training.manage permission" ON modules_characters FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM modules m
        JOIN trainings t ON t.id = m.training_id
        WHERE m.id = modules_characters.module_id
        AND authorize('training.manage', t.project_id)
    )
) WITH CHECK (
    EXISTS (
        SELECT 1
        FROM modules m
        JOIN trainings t ON t.id = m.training_id
        WHERE m.id = modules_characters.module_id
        AND authorize('training.manage', t.project_id)
    )
);
