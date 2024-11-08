BEGIN;

SELECT plan(2);

-- Create organizations and test data
SET local role postgres;

INSERT INTO organizations (id, name, domain)
VALUES (3, 'Other Org', 'other.com');

INSERT INTO trainings (id, title, organization_id, is_public)
VALUES (100, 'Public Training', 2, TRUE),
       (101, 'Private Training', 2, FALSE);

INSERT INTO modules (id, title, training_id)
VALUES (100, 'Public Module', 100),
       (101, 'Private Module', 101);

RESET role;

SET local role anon;

-- Test 1: Anon users can view modules from public trainings
SELECT diag('Test 1: Anon users can view modules from public trainings');
SELECT results_eq(
    $$
    SELECT count(*) FROM modules 
    WHERE id = 100 AND training_id IN (SELECT id FROM trainings WHERE is_public = true)
    $$,
    ARRAY[1::bigint],
    'Anonymous users can view modules from public trainings'
);

-- Test 2: Anon users should not see modules from private trainings
SELECT diag('Test 2: Anon users should not see modules from private trainings');
SELECT results_eq(
    $$
    SELECT count(*) FROM modules 
    WHERE id = 101 AND training_id IN (SELECT id FROM trainings WHERE is_public = false)
    $$,
    ARRAY[0::bigint],
    'Anonymous users cannot view modules from private trainings'
);

RESET role;

SELECT * FROM finish();

ROLLBACK;
