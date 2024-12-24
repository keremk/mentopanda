BEGIN;

SELECT plan(6);

-- Create test data
SET local role postgres;

-- Create organizations
INSERT INTO organizations (id, name, domain)
VALUES (3, 'Other Org', 'other.com');

-- Create a training in org 2
INSERT INTO trainings (id, title, organization_id)
VALUES (100, 'Test Training Org 2', 2);

-- Create a module
INSERT INTO modules (id, training_id, title)
VALUES (100, 100, 'Test Module');

-- Create characters
INSERT INTO characters (id, name, ai_description, organization_id)
VALUES (100, 'Test Character 1', 'Description 1', 2),
    (101, 'Test Character 2', 'Description 2', 2);

RESET role;

-- Create test users with different roles
SELECT tests.create_supabase_user('test.member.2', 'member', 2);

SELECT tests.create_supabase_user('test.manager.2', 'manager', 2);

SELECT tests.create_supabase_user('test.admin.2', 'admin', 2);

SELECT tests.create_supabase_user('test.member.3', 'member', 3);

-- Test 1: Anonymous users cannot insert module-character associations
SELECT diag(
        'Test 1: Anonymous users cannot insert module-character associations'
    );

SET local role anon;

SELECT throws_ok(
        $$
        INSERT INTO modules_characters (module_id, character_id)
        VALUES (100, 100) $$,
            42501,
            'new row violates row-level security policy for table "modules_characters"',
            'Anonymous users should not be able to insert module-character associations'
    );

-- Test 2: Regular member cannot insert module-character associations
SELECT diag(
        'Test 2: Regular member cannot insert module-character associations'
    );

SELECT tests.authenticate_as('test.member.2');

SELECT throws_ok(
        $$
        INSERT INTO modules_characters (module_id, character_id)
        VALUES (100, 100) $$,
            42501,
            'new row violates row-level security policy for table "modules_characters"',
            'Regular members should not be able to insert module-character associations'
    );

-- Test 3: Manager with training.manage can insert module-character associations
SELECT diag(
        'Test 3: Manager with training.manage can insert module-character associations'
    );

SELECT tests.authenticate_as('test.manager.2');

SELECT lives_ok(
        $$
        INSERT INTO modules_characters (module_id, character_id)
        VALUES (100, 100) $$,
            'Manager with training.manage should be able to insert module-character associations'
    );

-- Test 4: Admin with training.manage can update module-character associations
SELECT diag(
        'Test 4: Admin with training.manage can update module-character associations'
    );

SELECT tests.authenticate_as('test.admin.2');

SELECT lives_ok(
        $$
        UPDATE modules_characters
        SET ordinal = 1
        WHERE module_id = 100
            AND character_id = 100 $$,
            'Admin with training.manage should be able to update module-character associations'
    );

-- Test 5: Manager from other org cannot insert module-character associations
SELECT diag(
        'Test 5: Manager from other org cannot insert module-character associations'
    );

SELECT tests.authenticate_as('test.member.3');

SELECT throws_ok(
        $$
        INSERT INTO modules_characters (module_id, character_id)
        VALUES (100, 100) $$,
            42501,
            'new row violates row-level security policy for table "modules_characters"',
            'Manager from other org should not be able to insert module-character associations'
    );

-- Test 6: Manager with training.manage can delete module-character associations
SELECT diag(
        'Test 6: Manager with training.manage can delete module-character associations'
    );

SELECT tests.authenticate_as('test.manager.2');

SELECT lives_ok(
        $$
        DELETE FROM modules_characters
        WHERE module_id = 100
            AND character_id = 100 $$,
            'Manager with training.manage should be able to delete module-character associations'
    );

SELECT *
FROM finish();

ROLLBACK;