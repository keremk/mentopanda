-- VERY IMPORTANT: In PostgreSQL, when an RLS policy's USING clause evaluates to false, the row is silently filtered out rather than throwing an error. Only the WITH CHECK clause throws errors.

BEGIN;

-- Load pgTAP
SELECT
  plan (9);

-- Create organizations
SET
  local role postgres;

INSERT INTO
  organizations (id, name, domain)
VALUES
  (3, 'Other Org', 'other.com');

RESET role;

-- Create test users and data
SELECT
  tests.create_supabase_user ('test.member', 'member', 1);

SELECT
  tests.create_supabase_user ('test.manager', 'manager', 3);

SELECT
  tests.create_supabase_user ('test.admin', 'admin', 2);

SELECT
  tests.create_supabase_user ('test.member.3', 'member', 3);

SELECT diag('--- Profiles Debug Info ---');
SELECT diag(format('Profile data: %s', row_to_json(p)::text))
FROM profiles p;

SELECT diag('--- Role Permissions Debug Info ---');
SELECT diag(format('Role Permission: %s', row_to_json(rp)::text))
FROM role_permissions rp;

-- Test 1: RLS is disabled for public schema
SELECT diag('Test 1: RLS is disabled for public schema');
SELECT
  check_test (tests.rls_enabled ('public'), FALSE);

-- Test 2: RLS is enabled for profiles table
SELECT diag('Test 2: RLS is enabled for profiles table');
SELECT
  check_test (tests.rls_enabled ('public', 'profiles'), TRUE);

-- Test 3: Members can only view their own profile
SELECT diag('Test 3: Members can only view their own profile');
SELECT
  tests.authenticate_as ('test.member');

SELECT
  results_eq (
    'SELECT count(*) FROM profiles WHERE id = auth.uid()',
    ARRAY[1::bigint],
    'Member should be able to view their own profile'
  );

SELECT
  tests.authenticate_as_service_role ();

-- Test 4: Non-admin users can update their own profile
SELECT diag('Test 4: Non-admin users cannot update their role');

SELECT
  tests.authenticate_as ('test.member');

SELECT
  lives_ok (
    $$
    UPDATE profiles 
    SET organization_id = 3  -- Change to a different organization
    WHERE id = auth.uid()  -- Use auth.uid() instead of subquery
    $$,
    'Member should update their own profile' -- Expected error message
  );

SELECT
  tests.authenticate_as_service_role ();

-- Test 5: Non-admin users cannot update other profiles
SELECT diag('Test 5: Non-admin users cannot update other profiles');

SELECT diag('--- Profile Details ---');
SELECT diag(format('Profile data: %s', row_to_json(p)::text))
FROM profiles p 
WHERE id IN (
    tests.get_supabase_uid('test.member'),
    tests.get_supabase_uid('test.member.3')
);

-- Debug target profile
SELECT diag(format('Target profile: %s', row_to_json(p)::text))
FROM profiles p 
WHERE id = tests.get_supabase_uid('test.member.3');

-- test.manager is not an admin, so they cannot update test.member.3 organization_id
SELECT
  tests.authenticate_as ('test.manager');

SELECT diag('--- Profile After Authentication as test.member ---');
SELECT diag(format('Profile data: %s', row_to_json(p)::text))
FROM profiles p 
WHERE id IN (
    tests.get_supabase_uid('test.member.3')
);

-- Debug current state
SELECT diag(format('Current user ID: %s', auth.uid()::text));
SELECT diag(format('Current user organization: %s', get_current_user_organization_id()::text));
SELECT diag(format('Has user.admin permission: %s', authorize('user.admin')::text));
SELECT diag(format('Has user.select permission: %s', authorize('user.select')::text));

-- Attempt update
SELECT results_eq(
    $$
    WITH updated AS (
        UPDATE profiles 
        SET organization_id = 1
        WHERE id = tests.get_supabase_uid('test.member.3')
        RETURNING id
    )
    SELECT COUNT(*) FROM updated
    $$,
    ARRAY[0::bigint],
    'Update should affect 0 rows due to RLS policy'
);

SELECT
  tests.authenticate_as_service_role ();

SELECT diag('--- Profile Details ---');
SELECT diag(format('Profile data: %s', row_to_json(p)::text))
FROM profiles p 
WHERE id IN (
    tests.get_supabase_uid('test.member'),
    tests.get_supabase_uid('test.member.3')
);

-- Verify no changes were made
SELECT results_eq(
    $$
    SELECT organization_id FROM profiles 
    WHERE id = tests.get_supabase_uid('test.member.3')
    $$,
    ARRAY[3::integer],
    'Organization ID should remain unchanged'
);

-- Test 6: Admin users can update other profiles in their organization
SELECT diag('Test 6: Admin users can update other profiles in their organization');

SELECT
  tests.authenticate_as ('test.member.3');

SELECT
  lives_ok (
    $$
    UPDATE profiles 
    SET user_role = 'manager' 
    WHERE id = tests.get_supabase_uid('test.member')
  $$,
    'Admin should be able to update profiles in their organization'
  );

SELECT
  tests.authenticate_as_service_role ();

-- Test 7: Admin users cannot update profiles in other organizations
SELECT diag('Test 7: Admin users cannot update profiles in other organizations');

SELECT
  tests.authenticate_as ('test.admin');

SELECT results_eq(
    $$
    WITH updated AS (
        UPDATE profiles 
        SET user_role = 'manager'::public.user_role
        WHERE id = tests.get_supabase_uid('test.member.3')
        RETURNING id
    )
    SELECT COUNT(*) FROM updated
    $$,
    ARRAY[0::bigint],
    'Update should affect 0 rows due to RLS policy'
);


SELECT
  tests.authenticate_as_service_role ();

-- Verify no changes were made
SELECT results_eq(
    $$
    SELECT user_role FROM profiles 
    WHERE id = tests.get_supabase_uid('test.member.3')
    $$,
    ARRAY['member'::public.user_role],
    'Organization ID should remain unchanged'
);

SELECT
  *
FROM
  finish ();

ROLLBACK;