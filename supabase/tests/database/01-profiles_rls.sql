-- VERY IMPORTANT: In PostgreSQL, when an RLS policy's USING clause evaluates to false, the row is silently filtered out rather than throwing an error. Only the WITH CHECK clause throws errors.
BEGIN;
SELECT plan (7);
-- Create organizations
SET local role postgres;
INSERT INTO organizations (id, name, domain)
VALUES (3, 'Other Org', 'other.com');
RESET role;
-- Create test users and data
SELECT tests.create_supabase_user ('test.member.2', 'member', 2);
SELECT tests.create_supabase_user ('test.manager', 'manager', 3);
SELECT tests.create_supabase_user ('test.member.3', 'member', 3);
-- Test 1: RLS is disabled for public schema
SELECT diag ('Test 1: RLS is disabled for public schema');
SELECT check_test (tests.rls_enabled ('public'), FALSE);
-- Test 2: RLS is enabled for profiles table
SELECT diag ('Test 2: RLS is enabled for profiles table');
SELECT check_test (tests.rls_enabled ('public', 'profiles'), TRUE);
-- Test 3: Members can only view their own profile
SELECT diag (
    'Test 3: Members can only view their own profile'
  );
SELECT tests.authenticate_as ('test.member.2');
SELECT results_eq (
    'SELECT count(*) FROM profiles WHERE id = auth.uid()',
    ARRAY [1::bigint],
    'Member should be able to view their own profile'
  );
SELECT tests.authenticate_as_service_role ();
-- Test 4: Non-admin users can update their own profile - change their organization_id
SELECT diag (
    'Test 4: Non-admin users can update their own profile - change their organization_id'
  );
SELECT tests.authenticate_as ('test.member.2');
SELECT results_eq (
    $$ WITH updated AS (
      UPDATE profiles
      SET organization_id = 3
      WHERE id = tests.get_supabase_uid('test.member.2')
      RETURNING id
    )
    SELECT COUNT(*)
    FROM updated $$,
      ARRAY [1::bigint],
      'Update should affect 0 rows due to RLS policy'
  );
SELECT tests.authenticate_as_service_role ();
-- Verify no changes were made
SELECT results_eq (
    $$
    SELECT organization_id
    FROM profiles
    WHERE id = tests.get_supabase_uid('test.member.2') $$,
      ARRAY [3::bigint],
      'Organization ID should be unchanged'
  );
-- Test 5: Non-admin users cannot update other profiles
SELECT diag (
    'Test 5: Non-admin users cannot update other profiles'
  );
-- test.manager is not an admin, so they cannot update test.member.3 organization_id
SELECT tests.authenticate_as ('test.manager');
-- Attempt update
SELECT results_eq (
    $$ WITH updated AS (
      UPDATE profiles
      SET organization_id = 1
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
    SELECT organization_id
    FROM profiles
    WHERE id = tests.get_supabase_uid('test.member.3') $$,
      ARRAY [3::bigint],
      'Organization ID should remain unchanged'
  );
SELECT *
FROM finish ();
ROLLBACK;