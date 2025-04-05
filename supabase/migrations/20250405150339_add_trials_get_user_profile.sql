-- Update get_user_profile to include organization_id and permissions
create or replace function get_user_profile(user_id uuid) returns json language plpgsql security definer
set search_path = public as $$
declare 
  result json;
  user_project_role user_role;

begin -- Check if the requesting user is the same as the requested profile
if auth.uid() != user_id then raise exception 'Permission denied' using hint = 'Users can only access their own profiles';
end if;

-- Get the user's role in their current project
select pp.role into user_project_role
from profiles p
join projects_profiles pp on p.current_project_id = pp.project_id and p.id = pp.profile_id
where p.id = user_id;

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
    'trial_start',
    p.trial_start,
    'trial_end',
    p.trial_end,
    'current_project',
    json_build_object(
      'id',
      proj.id,
      'name',
      proj.name,
      'is_public',
      proj.is_public
    ),
    -- Get permissions directly from the database based on the user's role in their current project
    'permissions',
    array(
      select rp.permission
      from role_permissions rp
      where rp.role = user_project_role
    ),
    'project_role',
    user_project_role
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