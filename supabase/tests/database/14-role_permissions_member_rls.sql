BEGIN;
SELECT plan (4);
-- Create test users with different roles
SET local role postgres;
INSERT INTO organizations (id, name, domain)
VALUES (100, 'Test Org 100', 'test100.com');
SELECT tests.create_supabase_user ('test.member.100', 'member', 100);
RESET role;
SELECT tests.authenticate_as('test.member.100');
-- Test 1: Authenticated member can view role permissions
SELECT diag (
    'Test 1: Authenticated member can view role permissions'
  );
SELECT results_eq (
    $$
    SELECT count(*)::bigint
    FROM role_permissions
    WHERE role = 'member'::public.user_role
      AND permission = 'enrollment.manage'::public.app_permission $$,
      ARRAY [1::bigint],
      'Member should be able to view role permissions'
  );
-- Test 2: Member cannot insert role permissions
SELECT diag ('Test 2: Member cannot insert role permissions');
SELECT throws_ok(
    $$
    INSERT INTO role_permissions (role, permission)
    VALUES (
        'member'::public.user_role,
        'training.manage'::public.app_permission
      ) $$,
      'new row violates row-level security policy for table "role_permissions"',
      'Member should not be able to create new role/permission'
  );
-- Test 3: Member cannot update role permissions
SELECT diag ('Test 3: Member cannot update role permissions');
SELECT results_eq (
    $$ WITH updated AS (
      UPDATE role_permissions
      SET permission = 'training.manage'::public.app_permission
      WHERE role = 'member'::public.user_role
      RETURNING role
    )
    SELECT COUNT(*)
    FROM updated $$,
      ARRAY [0::bigint],
      'Member should not be able to update role permissions'
  );
-- Test 4: Member cannot delete role permissions
SELECT diag ('Test 4: Member cannot delete role permissions');
SELECT results_eq (
    $$ WITH deleted AS (
      DELETE FROM role_permissions
      WHERE role = 'member'::public.user_role
      RETURNING role
    )
    SELECT COUNT(*)
    FROM deleted $$,
      ARRAY [0::bigint],
      'Member should not be able to delete role permissions'
  );
SELECT *
FROM finish ();
ROLLBACK;