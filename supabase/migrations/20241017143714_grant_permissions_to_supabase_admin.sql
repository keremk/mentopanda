-- Update permissions for supabase_admin
grant usage on schema public to supabase_admin;
grant all on public.profiles to supabase_admin;

-- Ensure the RLS policies allow the handle_new_user owner (supabase_admin) to perform these operations
create policy "Allow handle_new_user owner (supabase_admin) full access to profiles"
on public.profiles
to supabase_admin
using (true)
with check (true);