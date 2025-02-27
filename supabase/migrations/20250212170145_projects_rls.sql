-- Drop existing policies if any
drop policy if exists "Users can create projects" on projects;
drop policy if exists "Users can view their projects" on projects;
drop policy if exists "Users can manage projects with permission" on projects;

-- Create policy for project creation
create policy "Users can create projects" on projects for
insert to authenticated with check (auth.uid() = created_by);

-- Create policy for viewing projects
create policy "Users can view their projects" on projects for
select to authenticated using (
    is_public = true
    or created_by = auth.uid()
    or id = (auth.jwt()->>'current_project_id')::bigint
    or exists (
        select 1
        from projects_profiles
        where projects_profiles.project_id = projects.id
        and projects_profiles.profile_id = auth.uid()
    )
);

-- Create policy for updating/deleting projects
create policy "Users can manage projects with permission" on projects for all to authenticated 
using (authorize('project.manage', id))
with check (authorize('project.manage', id));