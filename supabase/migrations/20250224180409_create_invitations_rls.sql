-- Invitations policies
CREATE POLICY "Invitations are viewable by invitee" ON invitations FOR SELECT 
TO authenticated 
USING (
    invitee_email = auth.jwt()->>'email'
);

CREATE POLICY "Invitations are manageable by users with project.member.manage permission" ON invitations FOR ALL 
TO authenticated 
USING (authorize('project.member.manage', project_id))
WITH CHECK (authorize('project.member.manage', project_id));