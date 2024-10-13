-- Clear existing data from the role_permissions table
truncate table role_permissions;

-- Seed permissions for Admin role
insert into
  role_permissions (role, permission)
values
  ('admin', 'training.manage'),
  ('admin', 'training.make.public'),
  ('admin', 'enrollment.manage'),
  ('admin', 'user.admin');

-- Seed permissions for Manager role
insert into
  role_permissions (role, permission)
values
  ('manager', 'training.manage'),
  ('manager', 'enrollment.manage');

-- Seed permissions for Member role
insert into
  role_permissions (role, permission)
values
  ('member', 'enrollment.manage');
