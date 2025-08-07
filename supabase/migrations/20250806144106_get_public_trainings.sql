-- Function to get public trainings with fork status for authenticated users
-- This function efficiently checks if each public training has been forked
-- by the user to their current project using a single optimized query

CREATE OR REPLACE FUNCTION get_public_trainings_with_fork_status(
  user_project_id bigint,
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id bigint,
  title text,
  tagline text,
  description text,
  image_url text,
  project_id bigint,
  created_at timestamptz,
  updated_at timestamptz,
  is_public boolean,
  fork_count integer,
  origin_id bigint,
  forked_at timestamptz,
  created_by uuid,
  preview_url text,
  is_forked boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.tagline,
    t.description,
    t.image_url,
    t.project_id,
    t.created_at,
    t.updated_at,
    t.is_public,
    t.fork_count,
    t.origin_id,
    t.forked_at,
    t.created_by,
    t.preview_url,
    EXISTS(
      SELECT 1 FROM trainings f 
      WHERE f.origin_id = t.id 
      AND f.project_id = user_project_id
    ) as is_forked
  FROM trainings t
  WHERE t.is_public = true
  ORDER BY t.fork_count DESC, t.created_at DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_public_trainings_with_fork_status(bigint, integer, integer) TO authenticated;