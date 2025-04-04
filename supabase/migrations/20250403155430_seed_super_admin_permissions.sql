-- Create seed for super_admin role with all permissions
INSERT INTO role_permissions (role, permission)
VALUES
  ('super_admin', 'training.manage'),
  ('super_admin', 'enrollment.manage'),
  ('super_admin', 'project.manage'),
  ('super_admin', 'project.member.manage'),
  ('super_admin', 'training.history'),
  ('super_admin', 'basic.access'),
  ('super_admin', 'trials.manage')
ON CONFLICT (role, permission) DO NOTHING; 