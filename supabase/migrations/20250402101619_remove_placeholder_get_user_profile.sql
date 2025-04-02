-- Update get_user_profile to include organization_id and permissions
create or replace function get_user_profile(user_id uuid) returns json language plpgsql security definer
set search_path = public as $$
declare result json;

begin -- Check if the requesting user is the same as the requested profile
if auth.uid() != user_id then raise exception 'Permission denied' using hint = 'Users can only access their own profiles';

end if;

select json_build_object(
    'id',
    au.id,
    'email',
    au.email,
    'display_name',
    COALESCE(
      (au.raw_user_meta_data->>'display_name')::text,
      split_part(au.email, '@', 1),
      'User'
    ),
    'avatar_url',
    (au.raw_user_meta_data->>'avatar_url')::text,
    'pricing_plan',
    p.pricing_plan,
    'current_project',
    json_build_object(
      'id',
      proj.id,
      'name',
      proj.name,
      'is_public',
      proj.is_public
    ),
    -- Convert JWT permissions from JSON to array using array constructor
    'permissions',
    array(
      select elem::app_permission
      from jsonb_array_elements_text(coalesce(auth.jwt()->'permissions', '[]'::jsonb)) as elem
    ),
    'project_role',
    (auth.jwt()->>'project_role')::user_role
  ) into result
from auth.users au
  join public.profiles p on p.id = au.id
  join public.projects proj on proj.id = p.current_project_id
where au.id = user_id;

return result;

end;

$$;

-- Grant execute permission to authenticated users
grant execute on function get_user_profile(uuid) to authenticated;