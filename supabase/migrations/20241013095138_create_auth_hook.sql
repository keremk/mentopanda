-- create the auth hook function
create
or replace function public.custom_access_token_hook (event jsonb) returns jsonb language plpgsql stable as $$
  declare
    claims jsonb;
    user_role public.user_role;
  begin
    -- fetch the user role in the user_roles table
    select role into user_role from public.user_roles where user_id = (event->>'user_id')::uuid;

    claims := event->'claims';

    if user_role is not null then
      -- set the claim
      claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    else
      claims := jsonb_set(claims, '{user_role}', 'null');
    end if;

    -- update the 'claims' object in the original event
    event := jsonb_set(event, '{claims}', claims);

    -- return the modified or original event
    return event;
  end;
$$;

-- grant necessary permissions
grant usage on schema public to supabase_auth_admin;

grant
execute on function public.custom_access_token_hook to supabase_auth_admin;

revoke
execute on function public.custom_access_token_hook
from
  authenticated,
  anon,
  public;

grant all on table public.user_roles to supabase_auth_admin;

revoke all on table public.user_roles
from
  authenticated,
  anon,
  public;

-- check if the policy exists before creating it
do $$ begin
  -- check if the policy exists
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_roles'
      and policyname = 'allow auth admin to read user roles'
  ) then -- create the policy directly if it does not exist
  create policy "allow auth admin to read user roles" on public.user_roles as permissive for
  select to supabase_auth_admin using (true);

end if;

end $$;