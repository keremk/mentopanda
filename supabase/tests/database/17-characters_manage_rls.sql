BEGIN;

SELECT plan (6);

-- Create organizations
SET local role postgres;

INSERT INTO organizations (id, name, domain)
VALUES (3, 'Other Org', 'other.com');

INSERT INTO characters (
        id,
        name,
        ai_description,
        organization_id,
        is_public
    )
VALUES (
        100,
        'Private Character Org 2',
        'Test description',
        2,
        FALSE
    ),
    (
        101,
        'Private Character Org 3',
        'Test description',
        3,
        FALSE
    );

RESET role;

-- Create test users and data
SELECT tests.create_supabase_user ('test.manage.2', 'manager', 2);

SELECT tests.create_supabase_user ('test.member.2', 'member', 2);

-- Test 1: Member from org 2 cannot manage private character, they need training.manage permission
SELECT diag (
        'Test 1: Member from org 2 cannot manage private character, they need training.manage permission'
    );

SELECT tests.authenticate_as ('test.member.2');

SELECT results_eq (
        $$ WITH updated AS (
            UPDATE characters
            SET name = 'Updated Name'
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
        SELECT name
        FROM characters
        WHERE id = 100 $$,
            ARRAY ['Private Character Org 2'],
            'Name should not be updated'
    );

SELECT tests.authenticate_as_service_role ();

-- Test 2: Manager from org 2 can manage private character from org 2
SELECT diag (
        'Test 2: Manager from org 2 can manage private character from org 2'
    );

SELECT tests.authenticate_as ('test.manage.2');

SELECT results_eq (
        $$ WITH updated AS (
            UPDATE characters
            SET name = 'Updated Name'
            WHERE id = 100
            RETURNING id
        )
        SELECT COUNT(*)
        FROM updated $$,
            ARRAY [1::bigint],
            'Update should affect 1 row due to RLS policy'
    );

SELECT results_eq (
        $$
        SELECT name
        FROM characters
        WHERE id = 100 $$,
            ARRAY ['Updated Name'],
            'Name should be updated'
    );

-- Test 3: Manager from org 2 cannot manage private character from org 3
SELECT diag (
        'Test 3: Manager from org 2 cannot manage private character from org 3'
    );

SELECT tests.authenticate_as ('test.manage.2');

SELECT results_eq (
        $$ WITH updated AS (
            UPDATE characters
            SET name = 'Updated Name'
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
        SELECT name
        FROM characters
        WHERE id = 101 $$,
            ARRAY ['Private Character Org 3'],
            'Name should not be updated'
    );

SELECT *
FROM finish ();

ROLLBACK;