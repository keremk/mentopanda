-- System Projects
create or replace function insert_system_project(
        project_id int,
        project_name text,
        is_public boolean
    ) returns void as $$ begin if not exists (
        select 1
        from projects
        where id = project_id
    ) then
insert into projects (id, name, is_public)
values (project_id, project_name, is_public);

end if;

end;

$$ language plpgsql;

-- Helper function for role permissions
create or replace function insert_role_permissions(
        role_name user_role,
        permissions app_permission []
    ) returns void as $$ begin
insert into role_permissions (role, permission)
select role_name,
    permission
from unnest(permissions) as permission on conflict (role, permission) do nothing;

end;

$$ language plpgsql;

do $$ begin -- System Projects
perform insert_system_project(
    1,
    'Public Trainings',
    true -- This is a public project
);

-- Ensure sequence starts after our system projects
perform setval('projects_id_seq', 2, false);

-- System Roles and Permissions
perform insert_role_permissions(
    'admin'::user_role,
    ARRAY [
            'training.manage'::app_permission,
            'enrollment.manage'::app_permission,
            'project.manage'::app_permission,
            'project.member.manage'::app_permission,
            'training.history'::app_permission,
            'basic.access'::app_permission
        ]
);

perform insert_role_permissions(
    'manager'::user_role,
    ARRAY [
            'training.manage'::app_permission,
            'basic.access'::app_permission
        ]
);

perform insert_role_permissions(
    'member'::user_role,
    ARRAY [
            'basic.access'::app_permission
        ]
);

-- Clean up helper functions
drop function if exists insert_system_project(int, text, boolean);

drop function if exists insert_role_permissions(user_role, app_permission []);

end $$;