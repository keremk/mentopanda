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

-- Create security definer function to check membership (RLS bypass)
create or replace function is_project_member(project_id bigint) returns boolean language sql security definer as $$
select exists (
        select 1
        from projects_profiles
        where project_id = $1
            and profile_id = auth.uid()
    );

$$;

-- 1. View policy: Users can see their own memberships
create policy "Users can view project members" on projects_profiles for
select to authenticated using (profile_id = auth.uid());

-- 2. Member management policy (requires existing membership)
create policy "Users can manage project members" on projects_profiles for all to authenticated using (
    is_project_member(project_id)
    and authorize('project.member.manage')
) with check (
    is_project_member(project_id)
    and authorize('project.member.manage')
);

-- 3. Project owner policy (bypasses membership check)
create policy "Project creators can manage members" on projects_profiles for all to authenticated using (is_project_owner(project_id)) with check (is_project_owner(project_id));