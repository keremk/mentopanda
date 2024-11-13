BEGIN;
SELECT plan(6);
-- Create organizations and test data
SET local role postgres;
INSERT INTO organizations (id, name, domain)
VALUES (3, 'Other Org', 'other.com');
INSERT INTO trainings (id, title, organization_id, is_public)
VALUES (100, 'Public Training', 2, TRUE),
    (101, 'Private Training Org 2', 2, FALSE),
    (102, 'Private Training Org 3', 3, FALSE);
RESET role;
-- Create test users
SELECT tests.create_supabase_user('test.member.2', 'member', 2);
SELECT tests.create_supabase_user('test.member.3', 'member', 3);
-- Test 1: Member can enroll in public training
SELECT diag('Test 1: Member can enroll in public training');
SELECT tests.authenticate_as('test.member.2');
SELECT results_eq(
        $$ WITH inserted AS (
            INSERT INTO enrollments (training_id, user_id)
            VALUES (100, tests.get_supabase_uid('test.member.2'))
            RETURNING id
        )
        SELECT COUNT(*)
        FROM inserted $$,
            ARRAY [1::bigint],
            'Member should be able to enroll in public training'
    );
-- Test 2: Member can view their own enrollment
SELECT diag('Test 2: Member can view their own enrollment');
SELECT results_eq(
        $$
        SELECT count(*)::bigint
        FROM enrollments
        WHERE user_id = tests.get_supabase_uid('test.member.2') $$,
            ARRAY [1::bigint],
            'Member should see their own enrollment'
    );
-- Test 3: Member can enroll in private training from their organization
SELECT diag(
        'Test 3: Member can enroll in private training from their organization'
    );
SELECT results_eq(
        $$ WITH inserted AS (
            INSERT INTO enrollments (training_id, user_id)
            VALUES (101, tests.get_supabase_uid('test.member.2'))
            RETURNING id
        )
        SELECT COUNT(*)
        FROM inserted $$,
            ARRAY [1::bigint],
            'Member should be able to enroll in private training from their organization'
    );
-- Test 4: Member cannot enroll in private training from another organization
SELECT diag(
        'Test 4: Member cannot enroll in private training from another organization'
    );
SELECT tests.authenticate_as('test.member.2');
SELECT throws_ok(
        $$
        INSERT INTO enrollments (training_id, user_id)
        VALUES (102, tests.get_supabase_uid('test.member.2')) $$,
            'new row violates row-level security policy for table "enrollments"',
            'Member should not be able to enroll in private training from another organization'
    );
-- Test 5: Member cannot enroll another user
SELECT diag('Test 5: Member cannot enroll another user');
SELECT throws_ok(
        $$
        INSERT INTO enrollments (training_id, user_id)
        VALUES (100, tests.get_supabase_uid('test.member.3')) $$,
            'new row violates row-level security policy for table "enrollments"',
            'Member should not be able to enroll another user'
    );
-- Test 6: Member can delete their own enrollment
SELECT diag('Test 6: Member can delete their own enrollment');
SELECT results_eq(
        $$ WITH deleted AS (
            DELETE FROM enrollments
            WHERE user_id = tests.get_supabase_uid('test.member.2')
                AND training_id = 100
            RETURNING id
        )
        SELECT COUNT(*)
        FROM deleted $$,
            ARRAY [1::bigint],
            'Member should be able to delete their own enrollment'
    );
SELECT *
FROM finish();
ROLLBACK;