BEGIN;

SELECT plan(6);

-- Create organizations
SET local role postgres;

INSERT INTO organizations (id, name, domain)
VALUES (3, 'Other Org', 'other.com');

INSERT INTO trainings (id, title, organization_id, is_public)
VALUES (100, 'Private Training Org 2', 2, FALSE),
       (101, 'Private Training Org 3', 3, FALSE);

INSERT INTO modules (id, title, training_id)
VALUES (100, 'Module for Org 2 Training', 100),
       (101, 'Module for Org 3 Training', 101);

RESET role;

-- Create test users and data
SELECT tests.create_supabase_user('test.manage.2', 'manager', 2);
SELECT tests.create_supabase_user('test.member.2', 'member', 2);

-- Test 1: Member from org 2 cannot manage modules, they need training.manage permission
SELECT diag('Test 1: Member from org 2 cannot manage modules, they need training.manage permission');
SELECT tests.authenticate_as('test.member.2');

SELECT results_eq(
    $$
    WITH updated AS (
        UPDATE modules 
        SET title = 'Updated Title'
        WHERE id = 100
        RETURNING id
    )
    SELECT COUNT(*) FROM updated
    $$,
    ARRAY[0::bigint],
    'Update should affect 0 rows due to RLS policy'
);

SELECT results_eq(
    $$
    SELECT title FROM modules WHERE id = 100
    $$,
    ARRAY['Module for Org 2 Training'],
    'Title should not be updated'
);

SELECT tests.authenticate_as_service_role();

-- Test 2: Manager from org 2 can manage modules from private training in org 2
SELECT diag('Test 2: Manager from org 2 can manage modules from private training in org 2');
SELECT tests.authenticate_as('test.manage.2');

SELECT results_eq(
    $$
    WITH updated AS (
        UPDATE modules 
        SET title = 'Updated Title'
        WHERE id = 100
        RETURNING id
    )
    SELECT COUNT(*) FROM updated
    $$,
    ARRAY[1::bigint],
    'Update should affect 1 row'
);

SELECT results_eq(
    $$
    SELECT title FROM modules WHERE id = 100
    $$,
    ARRAY['Updated Title'],
    'Title should be updated'
);

-- Test 3: Manager from org 2 cannot manage modules from private training in org 3
SELECT diag('Test 3: Manager from org 2 cannot manage modules from private training in org 3');
SELECT tests.authenticate_as('test.manage.2');

SELECT results_eq(
    $$
    WITH updated AS (
        UPDATE modules 
        SET title = 'Updated Title'
        WHERE id = 101
        RETURNING id
    )
    SELECT COUNT(*) FROM updated
    $$,
    ARRAY[0::bigint],
    'Update should affect 0 rows due to RLS policy'
);

SELECT tests.authenticate_as_service_role();

SELECT results_eq(
    $$
    SELECT title FROM modules WHERE id = 101
    $$,
    ARRAY['Module for Org 3 Training'],
    'Title should not be updated'
);

SELECT * FROM finish();

ROLLBACK;
