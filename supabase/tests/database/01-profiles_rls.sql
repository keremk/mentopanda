-- VERY IMPORTANT: In PostgreSQL, when an RLS policy's USING clause evaluates to false, the row is silently filtered out rather than throwing an error. Only the WITH CHECK clause throws errors.
BEGIN;

-- Reset the projects sequence
SELECT setval('projects_id_seq', 1, false);

-- Diagnostic to show sequence value before we start
SELECT diag(
    format(
      'Initial sequence value: %s',
      nextval('projects_id_seq')
    )
  );

-- Continue with existing test plan
SELECT plan(7);

SELECT tests.authenticate_as_service_role();

-- Create test users
SELECT tests.create_supabase_user('test.member.1', 1);

SELECT tests.create_supabase_user('test.member.2', 1);

SELECT tests.create_supabase_user('test.member.3', 1);

-- For testing non-shared project access
-- Create a private project for testing shared project access
SELECT tests.authenticate_as('test.member.1');

-- Create project with known ID 2
SELECT public.create_project('Private Project 1');

-- Switch to service role to view all projects
SELECT tests.authenticate_as_service_role();

SELECT diag('Projects after creation:');

SELECT diag(format('Project ID: %s, Name: %s', id, name))
FROM projects
ORDER BY id;

-- Switch back to test user
SELECT tests.authenticate_as('test.member.1');

-- Add test.member.2 to the private project (using known project ID 2)
INSERT INTO projects_profiles (project_id, profile_id, role)
VALUES (
    2,
    tests.get_supabase_uid('test.member.2'),
    'member'
  );

-- Test 2: Users can view their own profile
SELECT diag('Test 2: Users can view their own profile');

SELECT tests.authenticate_as('test.member.1');

SELECT results_eq(
    'SELECT count(*) FROM profiles WHERE id = auth.uid()',
    ARRAY [1::bigint],
    'User should be able to view their own profile'
  );

-- Test 3: Users cannot view profiles of users not in shared projects
SELECT diag(
    'Test 3: Users cannot view profiles of users not in shared projects'
  );

SELECT tests.authenticate_as('test.member.1');

SELECT results_eq(
    $$
    SELECT count(*)
    FROM profiles
    WHERE id = tests.get_supabase_uid('test.member.3') $$,
      ARRAY [0::bigint],
      'User should not be able to view profiles of users not in shared projects'
  );

-- Test 4: Users can view profiles of users in shared projects
SELECT diag(
    'Test 4: Users can view profiles of users in shared projects'
  );

SELECT tests.authenticate_as('test.member.1');

SELECT results_eq(
    $$
    SELECT count(*)
    FROM profiles
    WHERE id = tests.get_supabase_uid('test.member.2') $$,
      ARRAY [1::bigint],
      'User should be able to view profiles of users in shared projects'
  );

-- Test 5: Users can update their own profile current_project_id
SELECT diag(
    'Test 5: Users can update their own profile current_project_id'
  );

SELECT tests.authenticate_as('test.member.1');

UPDATE profiles
SET current_project_id = 2
WHERE id = auth.uid();

SELECT results_eq(
    $$ WITH updated AS (
      UPDATE profiles
      SET current_project_id = 2
      WHERE id = auth.uid()
      RETURNING id
    )
    SELECT count(*)
    FROM updated $$,
      ARRAY [1::bigint],
      'User should be able to update their own profile'
  );

-- Test 6: Users cannot update other users' profiles
SELECT diag(
    'Test 6: Users cannot update other users profiles'
  );

SELECT tests.authenticate_as('test.member.1');

UPDATE profiles
SET current_project_id = 2
WHERE id = tests.get_supabase_uid('test.member.2');

SELECT results_eq(
    $$ WITH updated AS (
      UPDATE profiles
      SET current_project_id = 2
      WHERE id = tests.get_supabase_uid('test.member.2')
      RETURNING id
    )
    SELECT count(*)
    FROM updated $$,
      ARRAY [0::bigint],
      'User should not be able to update other users profiles'
  );

-- Test 7: Service role can view all profiles
SELECT diag('Test 7: Service role can view all profiles');

SELECT tests.authenticate_as_service_role();

SELECT isnt(
    (
      SELECT count(*)
      FROM profiles
    ),
    0::bigint,
    'Service role should be able to view all profiles'
  );

-- Test 8: Anonymous users cannot view any profiles
SELECT diag(
    'Test 8: Anonymous users cannot view any profiles'
  );

SELECT tests.clear_authentication();

SELECT results_eq(
    'SELECT count(*) FROM profiles',
    ARRAY [0::bigint],
    'Anonymous users should not be able to view any profiles'
  );

-- Clean up
SELECT tests.authenticate_as_service_role();

TRUNCATE trainings CASCADE;

TRUNCATE projects CASCADE;

TRUNCATE projects_profiles CASCADE;

SELECT *
FROM finish();

ROLLBACK;