-- Enable RLS on progress tables
ALTER TABLE "progress_overall" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "progress_modules" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROGRESS_OVERALL RLS POLICIES
-- ============================================

-- Combined policy for viewing progress_overall
CREATE POLICY "Users can view progress they own or have permission to see" ON progress_overall
FOR SELECT
USING (
  -- Either it's the user's own progress
  auth.uid() = profile_id
  OR
  -- Or they have permission to view training history in projects where this profile is enrolled
  EXISTS (
    SELECT 1
    FROM projects_profiles pp
    JOIN projects p ON p.id = pp.project_id
    WHERE pp.profile_id = progress_overall.profile_id
    AND authorize('training.history', p.id)
  )
);

-- Policy for users to manage only their own progress_overall
CREATE POLICY "Users can insert their own progress" ON progress_overall
FOR INSERT
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own progress" ON progress_overall
FOR UPDATE
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own progress" ON progress_overall
FOR DELETE
USING (auth.uid() = profile_id);

-- ============================================
-- PROGRESS_MODULES RLS POLICIES
-- ============================================

-- Combined policy for viewing progress_modules
CREATE POLICY "Users can view module progress they own or have permission to see" ON progress_modules
FOR SELECT
USING (
  -- Either they own the overall progress record
  EXISTS (
    SELECT 1
    FROM progress_overall po
    WHERE po.id = progress_modules.progress_overall_id
    AND po.profile_id = auth.uid()
  )
  OR
  -- Or they have permission to view training history for the module's project
  EXISTS (
    SELECT 1
    FROM progress_overall po
    JOIN modules m ON m.id = progress_modules.module_id
    JOIN trainings t ON t.id = m.training_id
    WHERE po.id = progress_modules.progress_overall_id
    AND authorize('training.history', t.project_id)
  )
);

-- Policy for users to manage only their own progress_modules
CREATE POLICY "Users can insert their own module progress" ON progress_modules
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM progress_overall po
    WHERE po.id = progress_overall_id
    AND po.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own module progress" ON progress_modules
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM progress_overall po
    WHERE po.id = progress_overall_id
    AND po.profile_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM progress_overall po
    WHERE po.id = progress_overall_id
    AND po.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own module progress" ON progress_modules
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM progress_overall po
    WHERE po.id = progress_overall_id
    AND po.profile_id = auth.uid()
  )
);