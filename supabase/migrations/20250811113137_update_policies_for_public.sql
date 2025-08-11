-- Fix RLS policies to allow anonymous access to modules and characters for public trainings

-- 1. Drop existing SELECT policies that have faulty logic
DROP POLICY IF EXISTS "Modules are viewable by project members or if training is publi" ON modules;
DROP POLICY IF EXISTS "Modules-characters associations are viewable by project members" ON modules_characters;

-- 2. Recreate modules SELECT policy with simplified logic
CREATE POLICY "Modules are viewable by project members or if training is publi" ON modules
FOR SELECT TO anon, authenticated
USING (
  -- Allow if training is public (works for anonymous users)
  (EXISTS (SELECT 1 FROM trainings t WHERE t.id = modules.training_id AND t.is_public = true))
  OR
  -- Allow if user has access to project (for authenticated users)
  (EXISTS (
    SELECT 1 FROM trainings t 
    JOIN projects p ON p.id = t.project_id 
    WHERE t.id = modules.training_id 
    AND (
      p.is_public = true 
      OR p.id = ((auth.jwt() ->> 'current_project_id'::text))::bigint
    )
  ))
);

-- 3. Recreate modules_characters SELECT policy with simplified logic  
CREATE POLICY "Modules-characters associations are viewable by project members" ON modules_characters
FOR SELECT TO anon, authenticated  
USING (
  -- Allow if training is public (works for anonymous users)
  (EXISTS (
    SELECT 1 FROM modules m 
    JOIN trainings t ON t.id = m.training_id 
    WHERE m.id = modules_characters.module_id AND t.is_public = true
  ))
  OR
  -- Allow if user has access to project (for authenticated users)
  (EXISTS (
    SELECT 1 FROM modules m
    JOIN trainings t ON t.id = m.training_id
    JOIN projects p ON p.id = t.project_id  
    WHERE m.id = modules_characters.module_id
    AND (
      p.is_public = true 
      OR p.id = ((auth.jwt() ->> 'current_project_id'::text))::bigint
    )
  ))
);