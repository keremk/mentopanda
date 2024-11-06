BEGIN;

-- Load pgTAP
SELECT
  plan (6);

-- Adjust number based on total test count
-- Create test users and data
SELECT
  tests.create_supabase_user ('test.member', 'member', 1);

SELECT
  tests.create_supabase_user ('test.manager', 'manager', 1);

SELECT
  tests.create_supabase_user ('test.admin', 'admin', 2);

-- Test 1: RLS is disabled for public schema
SELECT
  check_test (tests.rls_enabled ('public'), FALSE);

-- Test 2: RLS is enabled for profiles table
SELECT
  check_test (tests.rls_enabled ('public', 'profiles'), TRUE);

-- Test 3: Users can view their own profile
SELECT
  tests.authenticate_as ('test.member');

SELECT
  results_eq (
    'SELECT count(*) FROM profiles WHERE id = auth.uid()',
    ARRAY[1::bigint],
    'Member should be able to view their own profile'
  );

SELECT
  tests.clear_authentication ();

-- Test 4: Non-admin users cannot update their role
SELECT
  tests.authenticate_as ('test.member');

SELECT
  throws_ok (
    $$
    UPDATE profiles 
    SET user_role = 'admin'::public.user_role  -- Add type cast
    WHERE id = auth.uid()  -- Use auth.uid() instead of subquery
    $$,
    '42501', -- Permission denied error code
    'new row violates row-level security policy for table "profiles"' -- Expected error message
  );

SELECT
  tests.clear_authentication ();

-- Test 5: Admin users can update other profiles in their organization
SELECT
  tests.authenticate_as ('test.admin');

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
  tests.clear_authentication ();

-- Test 6: Admin users cannot update profiles in other organizations
SET
  local role postgres;

INSERT INTO
  organizations (id, name, domain)
VALUES
  (3, 'Other Org', 'other.com');

SELECT
  tests.create_supabase_user ('test.member.2', 'member', 3);

RESET role;

SELECT
  tests.authenticate_as ('test.admin');

DO $$
DECLARE
    admin_id uuid := tests.get_supabase_uid('test.admin');
    member_id uuid := tests.get_supabase_uid('test.member.2');
    r record;
BEGIN
    RAISE NOTICE 'Debug information:';
    
    FOR r IN (
        SELECT id, organization_id, user_role 
        FROM profiles 
        WHERE id IN (admin_id, member_id)
    ) LOOP
        RAISE NOTICE 'Profile - ID: %, Org: %, Role: %', 
            r.id, 
            r.organization_id, 
            r.user_role;
    END LOOP;

    -- Check if admin has user.admin permission
    RAISE NOTICE 'Admin has user.admin permission: %', 
        authorize('user.admin');
END $$;

SELECT
  throws_ok (
    $$
    UPDATE profiles 
    SET user_role = 'manager' 
    WHERE id = tests.get_supabase_uid('test.member.2')
  $$,
    'new row violates row-level security policy for table "profiles"'
  );

SELECT
  tests.clear_authentication ();

SELECT
  *
FROM
  finish ();

ROLLBACK;