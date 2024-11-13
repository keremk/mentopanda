BEGIN;
SELECT plan (4);
-- Create organizations
SET local role postgres;
INSERT INTO organizations (id, name, domain)
VALUES (3, 'Other Org', 'other.com');
RESET role;
-- Create test users and data
SELECT tests.create_supabase_user ('test.admin.2', 'admin', 2);
SELECT tests.create_supabase_user ('test.member.2', 'member', 2);
SELECT tests.create_supabase_user ('test.member.3', 'member', 3);
-- Test 1: Admin users can update other profiles in their organization - e.g. make member a manager 
SELECT diag (
    'Test 1: Admin users can update other profiles in their organization'
  );
SELECT tests.authenticate_as ('test.admin.2');
SELECT results_eq (
    $$ WITH updated AS (
      UPDATE profiles
      SET user_role = 'manager'::public.user_role
      WHERE id = tests.get_supabase_uid('test.member.2')
      RETURNING id
    )
    SELECT COUNT(*)
    FROM updated $$,
      ARRAY [1::bigint],
      'Update should affect 1 row and be successful'
  );
SELECT tests.authenticate_as_service_role ();
-- Verify changes were made
SELECT results_eq (
    $$
    SELECT user_role
    FROM profiles
    WHERE id = tests.get_supabase_uid('test.member.2') $$,
      ARRAY ['manager'::public.user_role],
      'Member in the same organization should have been updated'
  );
-- Test 2: Admin users cannot update profiles in other organizations
SELECT diag (
    'Test 2: Admin users cannot update profiles in other organizations'
  );
SELECT tests.authenticate_as ('test.admin.2');
SELECT results_eq (
    $$ WITH updated AS (
      UPDATE profiles
      SET user_role = 'manager'::public.user_role
      WHERE id = tests.get_supabase_uid('test.member.3')
      RETURNING id
    )
    SELECT COUNT(*)
    FROM updated $$,
      ARRAY [0::bigint],
      'Update should affect 0 rows due to RLS policy'
  );
SELECT tests.authenticate_as_service_role ();
-- Verify no changes were made
SELECT results_eq (
    $$
    SELECT user_role
    FROM profiles
    WHERE id = tests.get_supabase_uid('test.member.3') $$,
      ARRAY ['member'::public.user_role],
      'Organization ID should remain unchanged'
  );
SELECT *
FROM finish ();
ROLLBACK;