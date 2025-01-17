BEGIN;

SELECT plan(4);

-- Setup test data
SET local role postgres;

-- Create test organizations
INSERT INTO organizations (id, name, domain)
VALUES (100, 'Test Org', 'test.com'),
    (101, 'Other Org', 'other.com');

-- Create test users with different scenarios and store their IDs
WITH created_users AS (
    SELECT tests.create_supabase_user(
            'test.user.1',
            'member',
            100,
            'test.user.1@test.com',
            NULL,
            jsonb_build_object(
                'display_name',
                'Test User One',
                'avatar_url',
                'https://example.com/avatar1.jpg'
            )
        ) as user1_id,
        tests.create_supabase_user(
            'test.user.2',
            'admin',
            101
        ) as user2_id
)
SELECT user1_id,
    user2_id
FROM created_users;

-- Verify the metadata was set correctly
SELECT diag(
        'Verifying metadata for test.user.1: ' || (
            SELECT raw_user_meta_data::text
            FROM auth.users
            WHERE email = 'test.user.1@test.com'
        )
    );

-- Test 1: User with complete profile and metadata
SELECT diag('Test 1: Fetching complete user profile');

SELECT tests.authenticate_as('test.user.1');

-- Debug: Show the actual result
SELECT diag(
        'Actual result: ' || (
            SELECT row_to_json(r)::text
            FROM (
                    SELECT (r->>'displayName')::text as display_name,
                        (r->>'organizationName')::text as org_name,
                        (r->>'pricingPlan')::text as pricing_plan,
                        (r->>'avatarUrl')::text as avatar_url
                    FROM get_user_profile(auth.uid()) r
                ) r
        )
    );

SELECT results_eq(
        $$
        SELECT (r->>'displayName')::text as display_name,
            (r->>'organizationName')::text as org_name,
            (r->>'pricingPlan')::text as pricing_plan,
            (r->>'avatarUrl')::text as avatar_url
        FROM get_user_profile(auth.uid()) r $$,
            $$
        VALUES (
                'Test User One'::text,
                'Test Org'::text,
                'free'::text,
                'https://example.com/avatar1.jpg'::text
            ) $$,
            'Should return complete profile with metadata for test.user.1'
    );

-- Test 2: User with minimal metadata
SELECT diag('Test 2: Fetching profile with minimal metadata');

SELECT tests.authenticate_as('test.user.2');

SELECT results_eq(
        $$
        SELECT (r->>'organizationName')::text as org_name,
            (r->>'pricingPlan')::text as pricing_plan,
            (r->>'avatarUrl')::text as avatar_url
        FROM get_user_profile(auth.uid()) r $$,
            $$
        VALUES (
                'Other Org'::text,
                'free'::text,
                '/placeholder.svg'::text
            ) $$,
            'Should return profile with default values for test.user.2'
    );

-- Test 3: Attempting to access another user's profile (should fail)
SELECT diag(
        'Test 3: Attempting to access another user''s profile'
    );

SELECT tests.authenticate_as('test.user.1');

SELECT throws_matching(
        $$
        SELECT get_user_profile(
                (
                    SELECT id
                    FROM auth.users
                    WHERE email = 'test.user.2@test.com'
                )
            ) $$,
            'permission denied for table users',
            'Should not allow accessing another user''s profile'
    );

-- Test 4: Unauthenticated access (should fail)
SELECT diag('Test 4: Attempting unauthenticated access');

SELECT tests.clear_authentication();

SELECT throws_matching(
        $$
        SELECT get_user_profile(
                (
                    SELECT id
                    FROM auth.users
                    WHERE email = 'test.user.1@test.com'
                )
            ) $$,
            'permission denied for table users',
            'Should not allow unauthenticated access'
    );

SELECT *
FROM finish();

ROLLBACK;