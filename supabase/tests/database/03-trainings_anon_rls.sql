BEGIN;
SELECT plan (2);
-- Create organizations
SET local role postgres;
INSERT INTO organizations (id, name, domain)
VALUES (3, 'Other Org', 'other.com');
INSERT INTO trainings (id, title, organization_id, is_public)
VALUES (100, 'Public Training', 2, TRUE),
  (101, 'Private Training', 2, FALSE);
RESET role;
SET local role anon;
-- Test 1: Anon users can view public trainings
SELECT diag ('Test 1 Anon users can view public trainings');
SELECT results_eq (
    $$
    SELECT count(*)
    FROM trainings
    WHERE is_public = true
      AND id = 100 $$,
      ARRAY [1::bigint],
      'Anonymous users can view public trainings'
  );
-- Test 2: Anon users should not see private trainings
SELECT diag (
    'Test 2 Anon users should not see private trainings'
  );
SELECT results_eq (
    $$
    SELECT count(*)
    FROM trainings
    WHERE is_public = false
      AND id = 101 $$,
      ARRAY [0::bigint],
      'Anonymous users cannot view private trainings'
  );
RESET role;
SELECT *
FROM finish ();
ROLLBACK;