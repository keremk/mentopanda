-- Add is_trial column with default false
ALTER TABLE invitations ADD COLUMN is_trial BOOLEAN NOT NULL DEFAULT false;

-- Make project_id column nullable
ALTER TABLE invitations ALTER COLUMN project_id DROP NOT NULL;

-- Update unique index to handle nullable project_id
DROP INDEX IF EXISTS invitations_project_invitee_unique_idx;
CREATE UNIQUE INDEX invitations_project_invitee_unique_idx 
ON invitations (COALESCE(project_id, 0), invitee_email);

COMMENT ON COLUMN invitations.is_trial IS 'Indicates if the invitation is for a trial account';
COMMENT ON COLUMN invitations.project_id IS 'Project ID the invitation is for (nullable for system invitations)';
