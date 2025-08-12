-- Drop the old function if it exists
DROP FUNCTION IF EXISTS get_public_trainings_with_fork_status(bigint, integer, integer);

-- Create consolidated function to get public trainings with creator info and optional fork status
-- This function efficiently gets creator avatar/display_name from auth.users and optionally checks fork status
-- When user_project_id is NULL (anonymous users), fork status is always false
-- When user_project_id is provided (authenticated users), fork status is calculated

CREATE OR REPLACE FUNCTION get_public_trainings(
  user_project_id bigint DEFAULT NULL,
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
  creator_avatar_url text,
  creator_display_name text,
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
    u.raw_user_meta_data->>'avatar_url' as creator_avatar_url,
    u.raw_user_meta_data->>'display_name' as creator_display_name,
    CASE 
      WHEN user_project_id IS NULL THEN false
      ELSE EXISTS(
        SELECT 1 FROM trainings f 
        WHERE f.origin_id = t.id 
        AND f.project_id = user_project_id
      )
    END as is_forked
  FROM trainings t
  LEFT JOIN auth.users u ON t.created_by = u.id
  WHERE t.is_public = true
  ORDER BY t.fork_count DESC, t.created_at DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION get_public_trainings(bigint, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_trainings(bigint, integer, integer) TO anon;