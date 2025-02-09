-- Update get_user_profile to include organization_id and permissions
create or replace function get_user_profile(user_id uuid) 
returns json 
language plpgsql 
security definer
set search_path = public 
as $$
declare 
  result json;
  user_permissions app_permission[];
begin
  -- Check if the requesting user is the same as the requested profile
  if auth.uid() != user_id then 
    raise exception 'Permission denied' 
    using hint = 'Users can only access their own profiles';
  end if;

  -- Get all permissions for the user's role
  select array_agg(permission)
  into user_permissions
  from public.role_permissions rp
  inner join public.profiles p on p.user_role = rp.role
  where p.id = user_id;

  select json_build_object(
    'id', au.id,
    'email', au.email,
    'displayName', COALESCE(
      (au.raw_user_meta_data->>'display_name')::text,
      split_part(au.email, '@', 1),
      'User'
    ),
    'avatarUrl', COALESCE(
      (au.raw_user_meta_data->>'avatar_url')::text,
      '/placeholder.svg'
    ),
    'pricingPlan', p.pricing_plan,
    'organizationName', o.name,
    'organizationId', p.organization_id,
    'role', p.user_role,
    'permissions', user_permissions
  ) into result
  from auth.users au
  left join public.profiles p on p.id = au.id
  left join public.organizations o on o.id = p.organization_id
  where au.id = user_id;

  return result;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function get_user_profile(uuid) to authenticated; 