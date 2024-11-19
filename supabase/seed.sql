-- Clear existing data
truncate table role_permissions cascade;

-- Create the special "no organization" record first
insert into organizations (id, name, domain)
values (1, 'NoOrganizationSpecified', 'no-organization-specified.local')
on conflict (id) do nothing;

insert into organizations (id, name, domain)
values (2, 'Coding Ventures', 'codingventures.com')
on conflict (id) do nothing;

-- Set the sequence to start after 2 to preserve id=1 and id=2
alter sequence organizations_id_seq restart with 3;

-- Seed permissions for Admin role
insert into role_permissions (role, permission)
values
  ('admin', 'training.manage'),
  ('admin', 'training.make.public'),
  ('admin', 'enrollment.manage'),
  ('admin', 'user.select'),
  ('admin', 'user.admin'),
  ('admin', 'organization.admin');

-- Seed permissions for Manager role
insert into role_permissions (role, permission)
values
  ('manager', 'training.manage'),
  ('manager', 'enrollment.manage'),
  ('manager', 'user.select');

-- Seed permissions for Member role
insert into role_permissions (role, permission)
values
  ('member', 'enrollment.manage');
