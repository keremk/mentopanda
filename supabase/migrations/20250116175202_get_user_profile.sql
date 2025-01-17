-- Create a function to get user profile with auth data
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
        'displayName',
        COALESCE(
            (au.raw_user_meta_data->>'display_name')::text,
            split_part(au.email, '@', 1),
            'User'
        ),
        'avatarUrl',
        COALESCE(
            (au.raw_user_meta_data->>'avatar_url')::text,
            '/placeholder.svg'
        ),
        'pricingPlan',
        p.pricing_plan,
        'organizationName',
        o.name
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