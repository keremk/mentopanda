BEGIN;

SELECT plan (2);

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
        'Public Character',
        'Test description',
        2,
        TRUE
    ),
    (
        101,
        'Private Character',
        'Test description',
        2,
        FALSE
    );

RESET role;

SET local role anon;

-- Test 1: Anon users can view public characters
SELECT diag ('Test 1 Anon users can view public characters');

SELECT results_eq (
        $$
        SELECT count(*)
        FROM characters
        WHERE is_public = true
            AND id = 100 $$,
            ARRAY [1::bigint],
            'Anonymous users can view public characters'
    );

-- Test 2: Anon users should not see private characters
SELECT diag (
        'Test 2 Anon users should not see private characters'
    );

SELECT results_eq (
        $$
        SELECT count(*)
        FROM characters
        WHERE is_public = false
            AND id = 101 $$,
            ARRAY [0::bigint],
            'Anonymous users cannot view private characters'
    );

RESET role;

SELECT *
FROM finish ();

ROLLBACK;