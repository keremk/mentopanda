BEGIN;
SELECT plan(3);
-- Create organizations and test data
SET local role postgres;
INSERT INTO organizations (id, name, domain)
VALUES (100, 'Test Org 100', 'test100.com'),
    (101, 'Test Org 101', 'test101.com');
RESET role;
-- Create test users
SELECT tests.create_supabase_user('test.member.100', 'member', 100);
SELECT tests.create_supabase_user('test.member.101', 'member', 101);
-- Test 1: Member can view their own organization
SELECT diag('Test 1: Member can view their own organization');
SELECT tests.authenticate_as('test.member.100');
SELECT results_eq(
        $$
        SELECT count(*)::bigint
        FROM organizations
        WHERE id = 100 $$,
            ARRAY [1::bigint],
            'Member should be able to view their own organization'
    );
-- Test 2: Member cannot view other organizations
SELECT diag('Test 2: Member cannot view other organizations');
SELECT results_eq(
        $$
        SELECT count(*)::bigint
        FROM organizations
        WHERE id = 101 $$,
            ARRAY [0::bigint],
            'Member should not be able to view other organizations'
    );
-- Test 3: Member cannot modify organizations
SELECT diag('Test 3: Member cannot modify organizations');
SELECT results_eq(
        $$ WITH updated AS (
            UPDATE organizations
            SET name = 'Updated Name'
            WHERE id = 100
            RETURNING id
        )
        SELECT COUNT(*)
        FROM updated $$,
            ARRAY [0::bigint],
            'Member should not be able to modify organizations'
    );
SELECT *
FROM finish();
ROLLBACK;