BEGIN;

SELECT plan(2);

-- Create organizations
SET local role postgres;

INSERT INTO organizations (id, name, domain)
VALUES (3, 'Other Org', 'other.com');

INSERT INTO trainings (id, title, organization_id, is_public)
VALUES (100, 'Private Training Org 2', 2, FALSE);

INSERT INTO modules (id, title, training_id)
VALUES (100, 'Module for Org 2 Training', 100);

RESET role;

-- Create test users and data
SELECT tests.create_supabase_user('test.member.2', 'member', 2);
SELECT tests.create_supabase_user('test.member.3', 'member', 3);

-- Member from org 2 can view modules from private training in org 2
SELECT diag('Test 1: Member from org 2 can view modules from private training in org 2');
SELECT tests.authenticate_as('test.member.2');

SELECT results_eq(
    $$
    SELECT count(*) FROM modules WHERE id = 100
    $$,
    ARRAY[1::bigint],
    'Organization 2 member should see modules from private training in org 2'
);

SELECT tests.authenticate_as_service_role();

-- Test: Member from org 3 cannot view modules from private training in org 2
SELECT diag('Test 2: Member from org 3 cannot view modules from private training in org 2');
SELECT tests.authenticate_as('test.member.3');

SELECT results_eq(
    $$
    SELECT count(*) FROM modules WHERE id = 100
    $$,
    ARRAY[0::bigint],
    'Member from org 3 should not see modules from private training in org 2'
);

SELECT * FROM finish();

ROLLBACK;
