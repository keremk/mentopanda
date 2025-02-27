CREATE POLICY "Characters are viewable by project members or if project is public" ON characters FOR
SELECT TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = characters.project_id
        AND (
            -- Either the project is public
            p.is_public = true
            OR 
            -- Or the character belongs to the user's current project
            p.id = (auth.jwt()->>'current_project_id')::bigint
        )
    )
);

CREATE POLICY "Characters are manageable by users with training.manage permission" ON characters FOR ALL TO authenticated 
USING (authorize('training.manage', characters.project_id))
WITH CHECK (authorize('training.manage', characters.project_id));