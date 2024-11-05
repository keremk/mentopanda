-- create the auth hook function
create or replace function public.custom_access_token_hook(event jsonb) returns jsonb language plpgsql stable as $$
declare
  claims jsonb;
  user_role public.user_role;
begin
  -- fetch the user role from the profiles table
  select p.user_role into user_role 
  from public.profiles p 
  where p.id = (event->>'user_id')::uuid;

  claims := event->'claims';

  if user_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  else
    claims := jsonb_set(claims, '{user_role}', '"member"');
  end if;

  event := jsonb_set(event, '{claims}', claims);

  return event;
end;
$$;

-- grant necessary permissions
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- Grant SELECT permission on profiles table to supabase_auth_admin
grant select on public.profiles to supabase_auth_admin;

-- Add RLS policy for supabase_auth_admin to access profiles
create policy "Allow supabase_auth_admin to read profiles"
on public.profiles
for select
to supabase_auth_admin
using (true);