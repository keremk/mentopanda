CREATE POLICY "Anyone can view public characters" ON characters FOR
SELECT USING (is_public = TRUE);

CREATE POLICY "Private characters are only viewable by organization members the character belongs to" ON characters FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
                AND profiles.organization_id = characters.organization_id
                AND characters.is_public = FALSE
        )
    );

CREATE POLICY "Characters are manageable by users with training.manage permission" ON characters FOR ALL TO authenticated USING (
    authorize('training.manage')
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.organization_id = characters.organization_id
    )
) WITH CHECK (
    authorize('training.manage')
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.organization_id = characters.organization_id
    )
);

