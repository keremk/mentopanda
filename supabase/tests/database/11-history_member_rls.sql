BEGIN;
SELECT plan(6);
-- Create organizations and test data
SET local role postgres;
INSERT INTO organizations (id, name, domain)
VALUES (3, 'Other Org', 'other.com');
INSERT INTO trainings (id, title, organization_id, is_public)
VALUES (100, 'Training', 2, TRUE);
INSERT INTO modules (id, title, training_id)
VALUES (100, 'Module 1', 100),
    (101, 'Module 2', 100);
RESET role;
-- Create test users
SELECT tests.create_supabase_user('test.member.2', 'member', 2);
SELECT tests.create_supabase_user('test.member.3', 'member', 3);
-- Test 1: Member can create their own history record
SELECT diag(
        'Test 1: Member can create their own history record'
    );
SELECT tests.authenticate_as('test.member.2');
SELECT results_eq(
        $$ WITH inserted AS (
            INSERT INTO history (module_id, user_id, assessment_text)
            VALUES (
                    100,
                    tests.get_supabase_uid('test.member.2'),
                    'Test assessment'
                )
            RETURNING id
        )
        SELECT COUNT(*)
        FROM inserted $$,
            ARRAY [1::bigint],
            'Member should be able to create their own history record'
    );
-- Test 2: Member can view their own history
SELECT diag('Test 2: Member can view their own history');
SELECT results_eq(
        $$
        SELECT count(*)::bigint
        FROM history
        WHERE user_id = tests.get_supabase_uid('test.member.2') $$,
            ARRAY [1::bigint],
            'Member should see their own history'
    );
-- Test 3: Member cannot view other member's history
SELECT diag(
        'Test 3: Member cannot view other members history'
    );
SELECT results_eq(
        $$
        SELECT count(*)::bigint
        FROM history
        WHERE user_id = tests.get_supabase_uid('test.member.3') $$,
            ARRAY [0::bigint],
            'Member should not see other members history'
    );
-- Test 4: Member cannot create history for another user
SELECT diag(
        'Test 4: Member cannot create history for another user'
    );
SELECT throws_ok(
        $$
        INSERT INTO history (module_id, user_id, assessment_text)
        VALUES (
                100,
                tests.get_supabase_uid('test.member.3'),
                'Test assessment'
            ) $$,
            'new row violates row-level security policy for table "history"',
            'Member should not be able to create history for another user'
    );
-- Test 5: Member can update their own history
SELECT diag('Test 5: Member can update their own history');
SELECT results_eq(
        $$ WITH updated AS (
            UPDATE history
            SET assessment_text = 'Updated assessment'
            WHERE user_id = tests.get_supabase_uid('test.member.2')
                AND module_id = 100
            RETURNING id
        )
        SELECT COUNT(*)
        FROM updated $$,
            ARRAY [1::bigint],
            'Member should be able to update their own history'
    );
-- Test 6: Member can delete their own history
SELECT diag('Test 6: Member can delete their own history');
SELECT results_eq(
        $$ WITH deleted AS (
            DELETE FROM history
            WHERE user_id = tests.get_supabase_uid('test.member.2')
                AND module_id = 100
            RETURNING id
        )
        SELECT COUNT(*)
        FROM deleted $$,
            ARRAY [1::bigint],
            'Member should be able to delete their own history'
    );
SELECT *
FROM finish();
ROLLBACK;