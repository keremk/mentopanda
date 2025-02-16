-- complain if script is sourced in psql, rather than via CREATE EXTENSION
-- \echo Use "CREATE EXTENSION supabase_test_helpers" to load this file. \quit
-- We want to store all of this in the tests schema to keep it
-- separate from any application data

-- Ensure pgTAP extension is installed (this creates its objects including __tresults_seq)
CREATE EXTENSION IF NOT EXISTS pgtap;

-- -- Switch temporarily to the pgTAP owner to reassign the __tresults_seq to service_role
-- SET SESSION AUTHORIZATION supabase_admin;
-- ALTER SEQUENCE __tresults_seq OWNER TO service_role;
-- RESET SESSION AUTHORIZATION;

CREATE SCHEMA if NOT EXISTS tests;

--- Create a specific schema for override functions so we don't have to worry about
--- anything else be adding to the tests schema
CREATE SCHEMA if NOT EXISTS test_overrides;

-- anon, authenticated, and service_role should have access to tests schema
GRANT usage ON schema tests TO anon,
    authenticated,
    service_role;

-- Don't allow public to execute any functions in the tests schema
ALTER DEFAULT PRIVILEGES IN schema tests REVOKE EXECUTE ON functions
FROM public;

-- Grant execute to anon, authenticated, and service_role for testing purposes
ALTER DEFAULT PRIVILEGES IN schema tests
GRANT EXECUTE ON functions TO anon,
    authenticated,
    service_role;

-- anon, authenticated, and service_role should have access to test_overrides schema
GRANT usage ON schema test_overrides TO anon,
    authenticated,
    service_role;

-- Don't allow public to execute any functions in the test_overrides schema
ALTER DEFAULT PRIVILEGES IN schema test_overrides REVOKE EXECUTE ON functions
FROM public;

-- Grant execute to anon, authenticated, and service_role for testing purposes
ALTER DEFAULT PRIVILEGES IN schema test_overrides
GRANT EXECUTE ON functions TO anon,
    authenticated,
    service_role;

/**
 * ### tests.create_supabase_user(identifier text, email text, phone text)
 *
 * Creates a new user in the `auth.users` table.
 * You can recall a user's info by using `tests.get_supabase_user(identifier text)`.
 *
 * Parameters:
 * - `identifier` - A unique identifier for the user. We recommend you keep it memorable like "test_owner" or "test_member"
 * - `email` - (Optional) The email address of the user
 * - `phone` - (Optional) The phone number of the user
 * - `metadata` - (Optional) Additional metadata to be added to the user
 *
 * Returns:
 * - `user_id` - The UUID of the user in the `auth.users` table
 *
 * Example:
 * ```sql
 *   SELECT tests.create_supabase_user('test_owner');
 *   SELECT tests.create_supabase_user('test_member', 'member@test.com', '555-555-5555');
 *   SELECT tests.create_supabase_user('test_member', 'member@test.com', '555-555-5555', '{"key": "value"}'::jsonb);
 * ```
 */
CREATE OR REPLACE function tests.create_supabase_user (
        identifier text,
        project_id bigint DEFAULT 1,
        email text DEFAULT NULL,
        phone text DEFAULT NULL,
        metadata jsonb DEFAULT NULL
    ) returns UUID security definer
SET search_path = auth,
    pg_temp AS $$
DECLARE user_id uuid;

BEGIN -- create the user
user_id := extensions.uuid_generate_v4();

INSERT INTO auth.users (
        id,
        email,
        phone,
        raw_user_meta_data,
        raw_app_meta_data,
        created_at,
        updated_at
    )
VALUES (
        user_id,
        coalesce(email, concat(user_id, '@test.com')),
        phone,
        jsonb_build_object('test_identifier', identifier) || coalesce(metadata, '{}'::jsonb),
        '{}'::jsonb,
        now(),
        now()
    )
RETURNING id INTO user_id;

-- Insert the profile
UPDATE public.profiles
SET id = user_id,
    current_project_id = create_supabase_user.project_id
WHERE id = user_id;

RETURN user_id;

END;

$$ language plpgsql;

/**
 * ### tests.get_supabase_user(identifier text)
 *
 * Returns the user info for a user created with `tests.create_supabase_user`.
 *
 * Parameters:
 * - `identifier` - The unique identifier for the user
 *
 * Returns:
 * - `user_id` - The UUID of the user in the `auth.users` table
 *
 * Example:
 * ```sql
 *   SELECT posts where posts.user_id = tests.get_supabase_user('test_owner') -> 'id';
 * ```
 */
CREATE OR REPLACE function tests.get_supabase_user (identifier text) returns json security definer
SET search_path = auth,
    pg_temp AS $$
DECLARE supabase_user json;

BEGIN
SELECT json_build_object(
        'id',
        id,
        'email',
        email,
        'phone',
        phone,
        'raw_user_meta_data',
        raw_user_meta_data,
        'raw_app_meta_data',
        raw_app_meta_data
    ) into supabase_user
FROM auth.users
WHERE raw_user_meta_data->>'test_identifier' = identifier
limit 1;

if supabase_user is null
OR supabase_user->'id' IS NULL then RAISE EXCEPTION 'User with identifier % not found',
identifier;

end if;

RETURN supabase_user;

END;

$$ language plpgsql;

/**
 * ### tests.get_supabase_uid(identifier text)
 *
 * Returns the user UUID for a user created with `tests.create_supabase_user`.
 *
 * Parameters:
 * - `identifier` - The unique identifier for the user
 *
 * Returns:
 * - `user_id` - The UUID of the user in the `auth.users` table
 *
 * Example:
 * ```sql
 *   SELECT posts where posts.user_id = tests.get_supabase_uid('test_owner') -> 'id';
 * ```
 */
CREATE OR REPLACE function tests.get_supabase_uid (identifier text) returns UUID security definer
SET search_path = auth,
    pg_temp AS $$
DECLARE supabase_user uuid;

BEGIN
SELECT id into supabase_user
FROM auth.users
WHERE raw_user_meta_data->>'test_identifier' = identifier
limit 1;

if supabase_user is null then RAISE EXCEPTION 'User with identifier % not found',
identifier;

end if;

RETURN supabase_user;

END;

$$ language plpgsql;

/**
 * ### tests.authenticate_as(identifier text)
 *   Authenticates as a user created with `tests.create_supabase_user`.
 *
 * Parameters:
 * - `identifier` - The unique identifier for the user
 *
 * Returns:
 * - `void`
 *
 * Example:
 * ```sql
 *   SELECT tests.create_supabase_user('test_owner');
 *   SELECT tests.authenticate_as('test_owner');
 * ```
 */
CREATE OR REPLACE function tests.authenticate_as(identifier text) returns void AS $$
DECLARE user_data json;

original_auth_data text;

current_project_id bigint;

project_role user_role;

user_permissions app_permission [];

is_public boolean;

BEGIN -- store the request.jwt.claims in a variable in case we need it
original_auth_data := current_setting('request.jwt.claims', true);

user_data := tests.get_supabase_user(identifier);

-- Get current project info and role
SELECT p.current_project_id,
    pr.is_public,
    pp.role INTO current_project_id,
    is_public,
    project_role
FROM profiles p
    JOIN projects pr ON pr.id = p.current_project_id
    LEFT JOIN projects_profiles pp ON pp.project_id = p.current_project_id
    AND pp.profile_id = (user_data->>'id')::uuid;

-- If project is public and user has no explicit role, treat as member
IF is_public
AND project_role IS NULL THEN project_role := 'member'::user_role;

END IF;

-- Get permissions for the role
SELECT array_agg(permission) INTO user_permissions
FROM role_permissions
WHERE role = COALESCE(project_role, 'member'::user_role);

-- Build JWT claims
perform set_config('role', 'authenticated', true);

perform set_config(
    'request.jwt.claims',
    json_build_object(
        'sub',
        user_data->>'id',
        'email',
        user_data->>'email',
        'phone',
        user_data->>'phone',
        'user_metadata',
        user_data->'raw_user_meta_data',
        'app_metadata',
        user_data->'raw_app_meta_data',
        'current_project_id',
        current_project_id,
        'project_role',
        COALESCE(project_role, 'member'),
        'permissions',
        COALESCE(user_permissions, ARRAY []::app_permission [])
    )::text,
    true
);

EXCEPTION -- revert back to original auth data
WHEN OTHERS THEN RAISE NOTICE 'Error occurred: %',
SQLERRM;

perform set_config('role', 'authenticated', true);

perform set_config('request.jwt.claims', original_auth_data, true);

RAISE;

END $$ language plpgsql;

/**
 * ### tests.switch_to_project(identifier text, project_id bigint)
 *
 * Switches a test user's current project and refreshes their authentication.
 *
 * Parameters:
 * - `identifier` - The unique identifier for the user created with `tests.create_supabase_user`
 * - `project_id` - The ID of the project to switch to
 *
 * Returns:
 * - void
 *
 * Example:
 * ```sql
 *   SELECT tests.create_supabase_user('test_user');
 *   SELECT tests.switch_to_project('test_user', 2);
 * ```
 */
CREATE OR REPLACE function tests.switch_to_project(identifier text, project_id bigint) returns void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE user_id uuid;

BEGIN -- Get the user's ID
SELECT id INTO user_id
FROM auth.users
WHERE raw_user_meta_data->>'test_identifier' = identifier;

IF user_id IS NULL THEN RAISE EXCEPTION 'User with identifier % not found',
identifier;

END IF;

-- Check if project exists
IF NOT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = project_id
) THEN RAISE EXCEPTION 'Project with ID % not found',
project_id;

END IF;

-- Update the user's current project
UPDATE public.profiles
SET current_project_id = project_id
WHERE id = user_id;

-- Refresh authentication to get new JWT claims
PERFORM tests.authenticate_as(identifier);

END;

$$;

/**
 * ### tests.authenticate_as_service_role()
 *   Clears authentication object and sets role to service_role.
 *
 * Returns:
 * - `void`
 *
 * Example:
 * ```sql
 *   SELECT tests.authenticate_as_service_role();
 * ```
 */
CREATE OR REPLACE function tests.authenticate_as_service_role () returns void AS $$ BEGIN perform set_config('role', 'service_role', true);

perform set_config('request.jwt.claims', null, true);

END $$ language plpgsql;

/**
 * ### tests.clear_authentication()
 *   Clears out the authentication and sets role to anon
 *
 * Returns:
 * - `void`
 *
 * Example:
 * ```sql
 *   SELECT tests.create_supabase_user('test_owner');
 *   SELECT tests.authenticate_as('test_owner');
 *   SELECT tests.clear_authentication();
 * ```
 */
CREATE OR REPLACE function tests.clear_authentication () returns void AS $$ BEGIN perform set_config('role', 'anon', true);

perform set_config('request.jwt.claims', null, true);

END $$ language plpgsql;

/**
 * ### tests.rls_enabled(testing_schema text)
 * pgTAP function to check if RLS is enabled on all tables in a provided schema
 *
 * Parameters:
 * - schema_name text - The name of the schema to check
 *
 * Example:
 * ```sql
 *   BEGIN;
 *       select plan(1);
 *       select tests.rls_enabled('public');
 *       SELECT * FROM finish();
 *   ROLLBACK;
 * ```
 */
CREATE OR REPLACE function tests.rls_enabled (testing_schema text) returns text AS $$
select is(
        (
            select count(pc.relname)::integer
            from pg_class pc
                join pg_namespace pn on pn.oid = pc.relnamespace
                and pn.nspname = rls_enabled.testing_schema
                join pg_type pt on pt.oid = pc.reltype
            where relrowsecurity = FALSE
        ),
        0,
        'All tables in the' || testing_schema || ' schema should have row level security enabled'
    );

$$ language sql;

/**
 * ### tests.rls_enabled(testing_schema text, testing_table text)
 * pgTAP function to check if RLS is enabled on a specific table
 *
 * Parameters:
 * - schema_name text - The name of the schema to check
 * - testing_table text - The name of the table to check
 *
 * Example:
 * ```sql
 *    BEGIN;
 *        select plan(1);
 *        select tests.rls_enabled('public', 'accounts');
 *        SELECT * FROM finish();
 *    ROLLBACK;
 * ```
 */
CREATE OR REPLACE function tests.rls_enabled (testing_schema text, testing_table text) returns text AS $$
select is(
        (
            select count(*)::integer
            from pg_class pc
                join pg_namespace pn on pn.oid = pc.relnamespace
                and pn.nspname = rls_enabled.testing_schema
                and pc.relname = rls_enabled.testing_table
                join pg_type pt on pt.oid = pc.reltype
            where relrowsecurity = TRUE
        ),
        1,
        testing_table || 'table in the' || testing_schema || ' schema should have row level security enabled'
    );

$$ language sql;

--
--  Generated now() function used to replace pg_catalog.now() for the purpose
--  of freezing time in tests. This should not be used directly.
--
CREATE
OR REPLACE function test_overrides.now () returns TIMESTAMP WITH TIME ZONE AS $$ BEGIN -- check if a frozen time is set
IF nullif(current_setting('tests.frozen_time'), '') IS NOT NULL THEN RETURN current_setting('tests.frozen_time')::timestamptz;

END IF;

RETURN pg_catalog.now();

END $$ language plpgsql;

/**
 * ### tests.freeze_time(frozen_time timestamp with time zone)
 *
 * Overwrites the current time from now() to the provided time.
 *
 * Works out of the box for any normal usage of now(), if you have a function that sets its own search path, such as security definers, then you will need to alter the function to set the search path to include test_overrides BEFORE pg_catalog. 
 * **ONLY do this inside of a pgtap test transaction.**
 * Example: 
 *
 * ```sql
 * ALTER FUNCTION auth.your_function() SET search_path = test_overrides, public, pg_temp, pg_catalog;
 * ```
 * View a test example in 05-frozen-time.sql: https://github.com/usebasejump/supabase-test-helpers/blob/main/supabase/tests/05-frozen-time.sql
 *
 * Parameters:
 * - `frozen_time` - The time to freeze to. Supports timestamp with time zone, without time zone, date or any other value that can be coerced into a timestamp with time zone.
 *
 * Returns:
 * - void
 *
 * Example:
 * ```sql
 *   SELECT tests.freeze_time('2020-01-01 00:00:00');
 * ```
 */
CREATE OR REPLACE function tests.freeze_time (frozen_time TIMESTAMP WITH TIME ZONE) returns void AS $$ BEGIN -- Add test_overrides to search path if needed
    IF current_setting('search_path') NOT LIKE 'test_overrides,%' THEN -- store search path for later
    PERFORM set_config(
        'tests.original_search_path',
        current_setting('search_path'),
        true
    );

-- add tests schema to start of search path
PERFORM set_config(
    'search_path',
    'test_overrides,' || current_setting('tests.original_search_path') || ',pg_catalog',
    true
);

END IF;

-- create an overwriting now function
PERFORM set_config('tests.frozen_time', frozen_time::text, true);

END $$ language plpgsql;

/**
 * ### tests.unfreeze_time()
 *
 * Unfreezes the time and restores the original now() function.
 *
 * Returns:
 * - void
 *
 * Example:
 * ```sql
 *   SELECT tests.unfreeze_time();
 * ```
 */
CREATE OR REPLACE function tests.unfreeze_time () returns void AS $$ BEGIN -- restore the original now function
    PERFORM set_config('tests.frozen_time', null, true);

-- restore the original search path
PERFORM set_config(
    'search_path',
    current_setting('tests.original_search_path'),
    true
);

END $$ language plpgsql;

BEGIN;

SELECT plan (7);

SELECT function_returns (
        'tests',
        'create_supabase_user',
        ARRAY ['text', 'bigint', 'text', 'text', 'jsonb'],
        'uuid'
    );

SELECT function_returns (
        'tests',
        'get_supabase_uid',
        ARRAY ['text'],
        'uuid'
    );

SELECT function_returns (
        'tests',
        'get_supabase_user',
        ARRAY ['text'],
        'json'
    );

SELECT function_returns (
        'tests',
        'authenticate_as',
        ARRAY ['text'],
        'void'
    );

SELECT function_returns (
        'tests',
        'clear_authentication',
        ARRAY [NULL],
        'void'
    );

SELECT function_returns (
        'tests',
        'rls_enabled',
        ARRAY ['text', 'text'],
        'text'
    );

SELECT function_returns ('tests', 'rls_enabled', ARRAY ['text'], 'text');

SELECT *
FROM finish ();

END;