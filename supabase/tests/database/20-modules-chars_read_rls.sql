BEGIN;

SELECT plan(4);

-- Create test data
SET local role postgres;

-- Create organizations
INSERT INTO organizations (id, name, domain)
VALUES (3, 'Other Org', 'other.com');

-- Create a public training in org 2
INSERT INTO trainings (id, title, organization_id, is_public)
VALUES (100, 'Public Training Org 2', 2, TRUE);

-- Create a private training in org 2
INSERT INTO trainings (id, title, organization_id, is_public)
VALUES (101, 'Private Training Org 2', 2, FALSE);

-- Create modules for both trainings
INSERT INTO modules (id, training_id, title)
VALUES (100, 100, 'Module Public'),
    (101, 101, 'Module Private');

-- Create characters
INSERT INTO characters (id, name, ai_description, organization_id)
VALUES (100, 'Test Character 1', 'Description 1', 2),
    (101, 'Test Character 2', 'Description 2', 2);

-- Create module-character associations
INSERT INTO modules_characters (module_id, character_id)
VALUES (100, 100),
    -- public training module
    (101, 101);

RESET role;

-- Create test users
SELECT tests.create_supabase_user('test.member.2', 'member', 2);

SELECT tests.create_supabase_user('test.member.3', 'member', 3);

-- Test 1: Anonymous user can see module-character associations for public training
SELECT diag(
        'Test 1: Anonymous user can see module-character associations for public training'
    );

SET local role anon;

-- Debug: Show query results for anon user
SELECT diag(
        format(
            'Anon user can see these module_characters: %s',
            (
                SELECT string_agg(
                        module_id::text || '-' || character_id::text,
                        ', '
                    )
                FROM modules_characters
                WHERE module_id = 100
            )
        )
    );

SELECT results_eq(
        $$
        SELECT count(*)
        FROM modules_characters
        WHERE module_id = 100 $$,
            ARRAY [1::bigint],
            'Anonymous user should see module-character association for public training'
    );

-- Test 2: Anonymous user cannot see module-character associations for private training
SELECT diag(
        'Test 2: Anonymous user cannot see module-character associations for private training'
    );

-- Debug: Show query results for anon user private training
SELECT diag(
        format(
            'Anon user can see these private module_characters: %s',
            (
                SELECT string_agg(
                        module_id::text || '-' || character_id::text,
                        ', '
                    )
                FROM modules_characters
                WHERE module_id = 101
            )
        )
    );

SELECT results_eq(
        $$
        SELECT count(*)
        FROM modules_characters
        WHERE module_id = 101 $$,
            ARRAY [0::bigint],
            'Anonymous user should not see module-character association for private training'
    );

SELECT tests.authenticate_as_service_role ();

-- Test 3: Org 2 member can see both public and private module-character associations
SELECT diag(
        'Test 3: Org 2 member can see both public and private module-character associations'
    );

SELECT tests.authenticate_as('test.member.2');

-- Debug: Show current user info
SELECT diag(
        format('Current user auth.uid(): %s', auth.uid())
    );

SELECT diag(
        format(
            'Current user profile: %s',
            (
                SELECT json_build_object(
                        'id',
                        id,
                        'org_id',
                        organization_id,
                        'role',
                        user_role
                    )::text
                FROM profiles
                WHERE id = auth.uid()
            )
        )
    );

-- Debug: Show visible module_characters for org 2 member
SELECT diag(
        format(
            'Org 2 member can see these test module_characters: %s',
            (
                SELECT string_agg(
                        module_id::text || '-' || character_id::text,
                        ', '
                    )
                FROM modules_characters
                WHERE module_id IN (100, 101)
            )
        )
    );

SELECT results_eq(
        $$
        SELECT count(*)
        FROM modules_characters
        WHERE module_id IN (100, 101) $$,
            ARRAY [2::bigint],
            'Org 2 member should see both test public and private module-character associations'
    );

-- Test 4: Org 3 member can only see public module-character associations
SELECT diag(
        'Test 4: Org 3 member can only see public module-character associations'
    );

SELECT tests.authenticate_as('test.member.3');

-- Debug: Show current user info for org 3 member
SELECT diag(
        format('Current user auth.uid(): %s', auth.uid())
    );

SELECT diag(
        format(
            'Current user profile: %s',
            (
                SELECT json_build_object(
                        'id',
                        id,
                        'org_id',
                        organization_id,
                        'role',
                        user_role
                    )::text
                FROM profiles
                WHERE id = auth.uid()
            )
        )
    );

-- Debug: Show visible module_characters for org 3 member
SELECT diag(
        format(
            'Org 3 member can see these module_characters: %s',
            (
                SELECT string_agg(
                        module_id::text || '-' || character_id::text,
                        ', '
                    )
                FROM modules_characters
                WHERE module_id = 100
            )
        )
    );

SELECT results_eq(
        $$
        SELECT count(*)
        FROM modules_characters
        WHERE module_id = 100 $$,
            ARRAY [1::bigint],
            'Org 3 member should only see public module-character associations'
    );

SELECT *
FROM finish();

ROLLBACK;