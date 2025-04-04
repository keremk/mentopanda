-- Add trial invitations policy
-- This allows users with trials.manage permission to manage trial invitations
CREATE POLICY "Trial invitations are manageable by users with trials.manage permission" ON invitations FOR ALL 
TO authenticated 
USING (
  is_trial = true AND 
  'trials.manage' = ANY(
    ARRAY(
      SELECT jsonb_array_elements_text((auth.jwt()->'permissions')::jsonb)
    )::public.app_permission[]
  )
)
WITH CHECK (
  is_trial = true AND 
  'trials.manage' = ANY(
    ARRAY(
      SELECT jsonb_array_elements_text((auth.jwt()->'permissions')::jsonb)
    )::public.app_permission[]
  )
);
