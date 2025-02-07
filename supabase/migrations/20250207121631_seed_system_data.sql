-- System Organizations
create or replace function insert_system_org(
        org_id int,
        org_name text,
        org_domain text
    ) returns void as $$ begin if not exists (
        select 1
        from organizations
        where id = org_id
    ) then
insert into organizations (id, name, domain)
values (org_id, org_name, org_domain);

end if;

end;

$$ language plpgsql;

-- System Permissions
create or replace function insert_role_permissions(
        role_name user_role,
        permissions app_permission [] -- Changed to app_permission[] type
    ) returns void as $$ begin if not exists (
        select 1
        from role_permissions
        where role = role_name
    ) then
insert into role_permissions (role, permission)
select role_name,
    unnest(permissions);

end if;

end;

$$ language plpgsql;

do $$ begin -- System Organizations
perform insert_system_org(
    1,
    'NoOrganizationSpecified',
    'no-organization-specified.local'
);

perform insert_system_org(2, 'Coding Ventures', 'codingventures.com');

-- Ensure sequence starts after our system orgs
perform setval('organizations_id_seq', 3, false);

-- System Roles and Permissions
perform insert_role_permissions(
    'admin'::user_role,
    ARRAY [
        'training.manage'::app_permission,
        'training.make.public'::app_permission,
        'enrollment.manage'::app_permission,
        'user.select'::app_permission,
        'user.admin'::app_permission,
        'organization.admin'::app_permission
    ]
);

perform insert_role_permissions(
    'manager'::user_role,
    ARRAY [
        'training.manage'::app_permission,
        'enrollment.manage'::app_permission,
        'user.select'::app_permission
    ]
);

perform insert_role_permissions(
    'member'::user_role,
    ARRAY [
        'enrollment.manage'::app_permission
    ]
);

-- Clean up helper functions
drop function if exists insert_system_org(int, text, text);

drop function if exists insert_role_permissions(user_role, app_permission []);

end $$;