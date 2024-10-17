-- Let's recap what we did to solve the issue:
-- We removed the attempt to change roles within the handle_new_user function, which was causing the security error.
-- We relied on the security definer attribute to run the entire function with elevated privileges.
-- We ensured that the handle_new_user owner (supabase_admin) had the necessary permissions on the relevant tables.
-- We added Row Level Security (RLS) policies to allow the handle_new_user owner (supabase_admin) full access to the profiles and user_roles tables.

-- Assuming the function is owned by 'supabase_admin' or a similar privileged role
grant usage on schema public to supabase_admin;
grant all on public.profiles to supabase_admin;
grant all on public.user_roles to supabase_admin;

-- Ensure the RLS policies allow the handle_new_user owner (supabase_admin) to perform these operations
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create policy "Allow handle_new_user owner (supabase_admin) full access to profiles"
on public.profiles
to supabase_admin
using (true)
with check (true);

create policy "Allow handle_new_user owner (supabase_admin) full access to user_roles"
on public.user_roles
to supabase_admin
using (true)
with check (true);