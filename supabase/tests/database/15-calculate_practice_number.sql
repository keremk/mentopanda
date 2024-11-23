BEGIN;
SELECT plan(6);

-- Setup test data
SET local role postgres;

-- Create test organization
INSERT INTO organizations (id, name, domain)
VALUES (200, 'Test Org 200', 'test200.com');

-- Create test user
SELECT tests.create_supabase_user('test.member.200', 'member', 200);

-- Create test training and module
INSERT INTO trainings (id, title, organization_id)
VALUES (2000, 'Test Training', 200);

INSERT INTO modules (id, training_id, title)
VALUES (3000, 2000, 'Test Module');

RESET role;

-- Authenticate as test user
SELECT tests.authenticate_as('test.member.200');

-- Test initial state
SELECT is(
    (SELECT COUNT(*) FROM history),
    0::bigint,
    'History table should be empty at start'
);

-- Test 1: First practice should get number 1
SELECT diag ('Test 1: First practice should get number 1');
SELECT lives_ok(
    $$
    INSERT INTO history (user_id, module_id, transcript)
    VALUES (
        tests.get_supabase_uid('test.member.200'),
        3000,
        'First practice transcript'
    )
    $$,
    'Should be able to insert first practice'
);

-- Debug: Show the actual value after first insert
-- SELECT diag('After first insert - practice_no: ' || practice_no::text)
-- FROM history 
-- WHERE user_id = tests.get_supabase_uid('test.member.200')
-- AND module_id = 3000;

SELECT is(
    (
        SELECT practice_no 
        FROM history 
        WHERE user_id = tests.get_supabase_uid('test.member.200')
        AND module_id = 3000
    ),
    1,
    'First practice should have practice_no = 1'
);

-- Debug: Show count between inserts
-- SELECT diag('Count between inserts: ' || count(*)::text)
-- FROM history 
-- WHERE user_id = tests.get_supabase_uid('test.member.200')
-- AND module_id = 3000;

-- Test 2: Second practice should get number 2
SELECT diag ('Test 2: Second practice should get number 2');
SELECT lives_ok(
    $$
    INSERT INTO history (user_id, module_id, transcript)
    VALUES (
        tests.get_supabase_uid('test.member.200'),
        3000,
        'Second practice transcript'
    )
    $$,
    'Should be able to insert second practice'
);

-- Debug: Show all records after second insert
-- SELECT diag('All records after second insert:');
-- SELECT diag('practice_no: ' || practice_no::text || ', started_at: ' || started_at::text)
-- FROM history 
-- WHERE user_id = tests.get_supabase_uid('test.member.200')
-- AND module_id = 3000
-- ORDER BY started_at;

-- Verify count
SELECT is(
    (
        SELECT COUNT(*) 
        FROM history 
        WHERE user_id = tests.get_supabase_uid('test.member.200')
        AND module_id = 3000
    ),
    2::bigint,
    'Should have exactly two records'
);

-- Verify both practice numbers exist
SELECT is(
    (
        SELECT array_agg(practice_no ORDER BY started_at)
        FROM history 
        WHERE user_id = tests.get_supabase_uid('test.member.200')
        AND module_id = 3000
    ),
    ARRAY[1, 2],
    'Should have practice numbers 1 and 2 in order'
);

SELECT * FROM finish();
ROLLBACK;
