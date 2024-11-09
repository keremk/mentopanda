BEGIN;

SELECT plan(6);

-- Create organizations and test data
SET local role postgres;

INSERT INTO organizations (id, name, domain)
VALUES 
    (100, 'Test Org 100', 'test100.com'),
    (101, 'Test Org 101', 'test101.com');

-- Create test users
SELECT tests.create_supabase_user('test.admin.100', 'admin', 100);
SELECT tests.create_supabase_user('test.admin.101', 'admin', 101);
SELECT tests.create_supabase_user('test.manager.100', 'manager', 100);
RESET role;

-- Test 1: Admin can view their own organization
SELECT diag('Test 1: Admin can view their own organization');
SELECT tests.authenticate_as('test.admin.100');

SELECT results_eq(
    $$
    SELECT count(*)::bigint FROM organizations 
    WHERE id = 100
    $$,
    ARRAY[1::bigint],
    'Admin should be able to view their own organization'
);

-- Test 2: Admin cannot view other organizations
SELECT diag('Test 2: Admin cannot view other organizations');
SELECT results_eq(
    $$
    SELECT count(*)::bigint FROM organizations 
    WHERE id = 101
    $$,
    ARRAY[0::bigint],
    'Admin should not be able to view other organizations'
);

-- Test 3: Admin can not update their own organization without organization.admin permission
SELECT tests.authenticate_as('test.manager.100');

SELECT diag('Test 3: Admin can not update their own organization without organization.admin permission');
SELECT results_eq(
    $$
    WITH updated AS (
        UPDATE organizations 
        SET name = 'Updated Org 100'
        WHERE id = 100
        RETURNING id
    )
    SELECT COUNT(*) FROM updated
    $$,
    ARRAY[0::bigint],
    'Admin should not be able to update their own organization without organization.admin permission'
);

-- Test 4: Admin cannot update other organizations
SELECT diag('Test 4: Admin cannot update other organizations');
SELECT results_eq(
    $$
    WITH updated AS (
        UPDATE organizations 
        SET name = 'Updated Org 101'
        WHERE id = 101
        RETURNING id
    )
    SELECT COUNT(*) FROM updated
    $$,
    ARRAY[0::bigint],
    'Admin should not be able to update other organizations'
);

-- Test 5: Admin cannot modify organization with ID 1
SELECT diag('Test 5: Admin cannot modify organization with ID 1');
SELECT results_eq(
    $$
    WITH updated AS (
        UPDATE organizations 
        SET name = 'Updated Name'
        WHERE id = 1
        RETURNING id
    )
    SELECT COUNT(*) FROM updated
    $$,
    ARRAY[0::bigint],
    'Admin should not be able to modify organization with ID 1'
);

-- Test 6: Admin cannot delete organizations
SELECT tests.authenticate_as('test.admin.101');

SELECT diag('Test 6: Admin cannot delete organizations');
SELECT results_eq(
    $$
    WITH deleted AS (
        DELETE FROM organizations 
        WHERE id = 100
        RETURNING id
    )
    SELECT COUNT(*) FROM deleted
    $$,
    ARRAY[0::bigint],
    'Admin should not be able to delete organizations'
);

SELECT * FROM finish();

ROLLBACK;
