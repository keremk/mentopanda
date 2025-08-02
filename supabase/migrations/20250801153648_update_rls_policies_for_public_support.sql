-- Update RLS policies to support public trainings

-- Replace existing trainings policy
DROP POLICY "Trainings are viewable by project members or if project is publ" ON trainings;

CREATE POLICY "Trainings are viewable by project members or if public" ON trainings
FOR SELECT TO authenticated, anon
USING (
  is_public = true OR 
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = trainings.project_id 
    AND (
      p.is_public = true OR 
      p.id = ((auth.jwt() ->> 'current_project_id'::text))::bigint
    )
  )
);

-- Replace existing modules policy (minimal performance impact - just adds boolean check)
DROP POLICY "Modules are viewable by project members or if project is public" ON modules;

CREATE POLICY "Modules are viewable by project members or if training is public" ON modules
FOR SELECT TO authenticated, anon
USING (
  EXISTS (
    SELECT 1 FROM (trainings t JOIN projects p ON p.id = t.project_id)
    WHERE t.id = modules.training_id 
    AND (
      t.is_public = true OR
      p.is_public = true OR 
      p.id = ((auth.jwt() ->> 'current_project_id'::text))::bigint
    )
  )
);

-- Replace existing characters policy (uses denormalized flag for performance)
DROP POLICY "Characters are viewable by project members or if project is pub" ON characters;

CREATE POLICY "Characters are viewable by project members or if used in public training" ON characters
FOR SELECT TO authenticated, anon
USING (
  -- Existing project-based access (fast)
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = characters.project_id 
    AND (
      p.is_public = true OR 
      p.id = ((auth.jwt() ->> 'current_project_id'::text))::bigint
    )
  )
  OR
  -- New public training access (fast - just boolean check)
  is_used_in_public_training = true
);

-- Replace existing modules-characters policy
DROP POLICY "Modules-characters associations are viewable by project members" ON modules_characters;

CREATE POLICY "Modules-characters associations are viewable by project members or if training is public" ON modules_characters
FOR SELECT TO authenticated, anon
USING (
  EXISTS (
    SELECT 1 FROM ((modules m JOIN trainings t ON t.id = m.training_id) JOIN projects p ON p.id = t.project_id)
    WHERE m.id = modules_characters.module_id 
    AND (
      t.is_public = true OR
      p.is_public = true OR 
      p.id = ((auth.jwt() ->> 'current_project_id'::text))::bigint
    )
  )
);