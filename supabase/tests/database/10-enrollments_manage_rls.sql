BEGIN;

SELECT plan(6);

-- Create organizations and test data
SET local role postgres;

INSERT INTO organizations (id, name, domain)
VALUES (3, 'Other Org', 'other.com');

INSERT INTO trainings (id, title, organization_id, is_public)
VALUES 
    (100, 'Public Training', 2, TRUE),
    (101, 'Private Training Org 2', 2, FALSE),
    (102, 'Private Training Org 3', 3, FALSE);

-- Create test users first (before inserting enrollments)
SELECT tests.create_supabase_user('test.manage.2', 'manager', 2);
SELECT tests.create_supabase_user('test.member.2', 'member', 2);
SELECT tests.create_supabase_user('test.member.3', 'member', 3);
SELECT tests.create_supabase_user('test.manage.3', 'manager', 3);

-- Create some initial enrollments
INSERT INTO enrollments (id, training_id, user_id)
VALUES 
    (100, 100, tests.get_supabase_uid('test.member.2')),
    (101, 101, tests.get_supabase_uid('test.member.2')),
    (102, 102, tests.get_supabase_uid('test.member.3'));

RESET role;

-- Test 1: Manager can view enrollments in their organization
SELECT diag('Test 1: Manager can view enrollments in their organization');
SELECT tests.authenticate_as('test.manage.2');

SELECT results_eq(
    $$
    SELECT count(*)::bigint FROM enrollments 
    WHERE user_id = tests.get_supabase_uid('test.member.2')
    $$,
    ARRAY[2::bigint],
    'Manager should see enrollments from their organization'
);

-- Test 2: Manager cannot view enrollments from other organizations
SELECT diag('Test 2: Manager cannot view enrollments from other organizations');
SELECT results_eq(
    $$
    SELECT count(*)::bigint FROM enrollments 
    WHERE user_id = tests.get_supabase_uid('test.member.3')
    $$,
    ARRAY[0::bigint],
    'Manager should not see enrollments from other organizations'
);

-- Test 3: Manager can enroll users from their organization
SELECT diag('Test 3: Manager can enroll users from their organization');
SELECT results_eq(
    $$
    WITH inserted AS (
        INSERT INTO enrollments (training_id, user_id)
        VALUES (100, tests.get_supabase_uid('test.member.2'))
        RETURNING id
    )
    SELECT COUNT(*) FROM inserted
    $$,
    ARRAY[1::bigint],
    'Manager should be able to enroll users from their organization'
);

-- Test 4: Manager cannot enroll users from other organizations
SELECT diag('Test 4: Manager cannot enroll users from other organizations');
SELECT throws_ok(
    $$
    INSERT INTO enrollments (training_id, user_id)
    VALUES (100, tests.get_supabase_uid('test.member.3'))
    $$,
    'new row violates row-level security policy for table "enrollments"',
    'Manager should not be able to enroll users from other organizations'
);

-- Test 5: Manager can delete enrollments from their organization
SELECT diag('Test 5: Manager can delete enrollments from their organization');
SELECT results_eq(
    $$
    WITH deleted AS (
        DELETE FROM enrollments 
        WHERE user_id = tests.get_supabase_uid('test.member.2')
        AND id = 100
        RETURNING id
    )
    SELECT COUNT(*) FROM deleted
    $$,
    ARRAY[1::bigint],
    'Manager should be able to delete enrollments from their organization'
);

-- Test 6: Manager cannot delete enrollments from other organizations
SELECT diag('Test 6: Manager cannot delete enrollments from other organizations');

SELECT results_eq(
    $$
    WITH deleted AS (
        DELETE FROM enrollments 
        WHERE user_id = tests.get_supabase_uid('test.member.3')
        AND training_id = 100
        RETURNING id
    )
    SELECT COUNT(*) FROM deleted
    $$,
    ARRAY[0::bigint],
    'Admin should not be able to delete enrollments from other organizations'
);

SELECT * FROM finish();

ROLLBACK;
