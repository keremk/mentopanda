-- Drop existing policies
drop policy if exists "Users can view project members" on projects_profiles;
drop policy if exists "Users can manage project members" on projects_profiles;
drop policy if exists "Project creators can manage members" on projects_profiles;

-- Create security definer function to check project ownership (RLS bypass)
create or replace function is_project_owner(project_id bigint) returns boolean language sql security definer
set search_path = public as $$
select exists (
    select 1
    from projects
    where id = project_id
    and created_by = auth.uid()
);
$$;

-- Create security definer function to check project membership (RLS bypass)
create or replace function is_member_of_project(project_id bigint) returns boolean language sql security definer
set search_path = public as $$
select exists (
    select 1
    from projects_profiles
    where project_id = $1
    and profile_id = auth.uid()
);
$$;

-- 1. View policy: Users can see members of their current project or projects they're a member of
create policy "Users can view project members" on projects_profiles for
select to authenticated using (
    profile_id = auth.uid()
    or project_id = (auth.jwt()->>'current_project_id')::bigint
    or is_member_of_project(project_id)
);

-- 2. Member management policy
create policy "Users with project.member.manage permission can manage project members" on projects_profiles for all to authenticated 
using (authorize('project.member.manage', project_id))
with check (authorize('project.member.manage', project_id));

-- 3. Project owner policy (bypasses permission check)
create policy "Project creators can manage members" on projects_profiles for all to authenticated 
using (is_project_owner(project_id))
with check (is_project_owner(project_id));