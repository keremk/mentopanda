BEGIN;
SELECT plan (6);
-- Create organizations
SET local role postgres;
INSERT INTO organizations (id, name, domain)
VALUES (3, 'Other Org', 'other.com');
INSERT INTO trainings (id, title, organization_id, is_public)
VALUES (100, 'Private Training Org 2', 2, FALSE),
  (101, 'Private Training Org 3', 3, FALSE);
RESET role;
-- Create test users and data
SELECT tests.create_supabase_user ('test.manage.2', 'manager', 2);
SELECT tests.create_supabase_user ('test.member.2', 'member', 2);
-- Test 1: Member from org 2 cannot manage private training, they need training.manage permission
SELECT diag (
    'Test 1: Member from org 2 cannot manage private training, they need training.manage permission'
  );
SELECT tests.authenticate_as ('test.member.2');
SELECT results_eq (
    $$ WITH updated AS (
      UPDATE trainings
      SET title = 'Updated Title'
      WHERE id = 100
      RETURNING id
    )
    SELECT COUNT(*)
    FROM updated $$,
      ARRAY [0::bigint],
      'Update should affect 0 rows due to RLS policy'
  );
SELECT results_eq (
    $$
    SELECT title
    FROM trainings
    WHERE id = 100 $$,
      ARRAY ['Private Training Org 2'],
      'Title should not be updated'
  );
SELECT tests.authenticate_as_service_role ();
-- Test 2: Manager from org 2 can manage private training from org 2
SELECT diag (
    'Test 2: Manager from org 2 can manage private training from org 2'
  );
SELECT tests.authenticate_as ('test.manage.2');
SELECT results_eq (
    $$ WITH updated AS (
      UPDATE trainings
      SET title = 'Updated Title'
      WHERE id = 100
      RETURNING id
    )
    SELECT COUNT(*)
    FROM updated $$,
      ARRAY [1::bigint],
      'Update should affect 0 rows due to RLS policy'
  );
SELECT results_eq (
    $$
    SELECT title
    FROM trainings
    WHERE id = 100 $$,
      ARRAY ['Updated Title'],
      'Title should be updated'
  );
-- Test 3: Manager from org 2 cannot manage private training from org 3
SELECT diag (
    'Test 3: Manager from org 2 cannot manage private training from org 3'
  );
SELECT tests.authenticate_as ('test.manage.2');
SELECT results_eq (
    $$ WITH updated AS (
      UPDATE trainings
      SET title = 'Updated Title'
      WHERE id = 101
      RETURNING id
    )
    SELECT COUNT(*)
    FROM updated $$,
      ARRAY [0::bigint],
      'Update should affect 0 rows due to RLS policy'
  );
SELECT tests.authenticate_as_service_role ();
SELECT results_eq (
    $$
    SELECT title
    FROM trainings
    WHERE id = 101 $$,
      ARRAY ['Private Training Org 3'],
      'Title should not be updated'
  );
SELECT *
FROM finish ();
ROLLBACK;