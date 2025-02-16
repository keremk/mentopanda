

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_tle";






CREATE EXTENSION IF NOT EXISTS "supabase-dbdev" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






CREATE SCHEMA IF NOT EXISTS "test_overrides";


ALTER SCHEMA "test_overrides" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "tests";


ALTER SCHEMA "tests" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_permission" AS ENUM (
    'training.manage',
    'enrollment.manage',
    'project.manage',
    'project.member.manage',
    'basic.access'
);


ALTER TYPE "public"."app_permission" OWNER TO "postgres";


CREATE TYPE "public"."pricing_plan" AS ENUM (
    'free',
    'pro',
    'team',
    'enterprise'
);


ALTER TYPE "public"."pricing_plan" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'manager',
    'member',
    'super_admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."authorize"("requested_permission" "public"."app_permission") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ BEGIN RETURN requested_permission = ANY(
    ARRAY(
      SELECT jsonb_array_elements_text((auth.jwt()->'permissions')::jsonb)
    )::public.app_permission []
  );

END;

$$;


ALTER FUNCTION "public"."authorize"("requested_permission" "public"."app_permission") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_practice_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    next_practice_no integer;
    current_max integer;
BEGIN
    -- Get the current max practice number
    SELECT MAX(practice_no) 
    INTO current_max
    FROM history
    WHERE user_id = NEW.user_id
      AND module_id = NEW.module_id;
      
    -- -- Log the values for debugging
    -- RAISE NOTICE 'Current max practice_no: %, User ID: %, Module ID: %', 
    --     current_max, NEW.user_id, NEW.module_id;

    -- Calculate next practice number
    next_practice_no := COALESCE(current_max, 0) + 1;
    
    -- RAISE NOTICE 'Setting next practice_no to: %', next_practice_no;

    -- Set the new practice_no
    NEW.practice_no := next_practice_no;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_practice_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_project"("project_name" "text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE new_project_id bigint;

BEGIN -- Check if user is authenticated
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated';

END IF;

BEGIN -- Create new project (always private)
INSERT INTO public.projects (name, is_public, created_by)
VALUES (project_name, false, auth.uid())
RETURNING id INTO new_project_id;

INSERT INTO public.projects_profiles (project_id, profile_id, role)
VALUES (
        new_project_id,
        auth.uid(),
        'admin'::public.user_role
    );

RETURN new_project_id;

EXCEPTION
WHEN OTHERS THEN -- Roll back both inserts if either fails
RAISE;

END;

END;

$$;


ALTER FUNCTION "public"."create_project"("project_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."custom_access_token_hook"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE user_id uuid;

current_project_id bigint;

project_role public.user_role;

user_permissions public.app_permission [];

is_public boolean;

BEGIN -- Get user ID from event
user_id := (event->>'user_id')::uuid;

SELECT p.current_project_id,
  pr.is_public,
  pp.role INTO current_project_id,
  is_public,
  project_role
FROM public.profiles p
  JOIN public.projects pr ON pr.id = p.current_project_id
  LEFT JOIN public.projects_profiles pp ON pp.project_id = p.current_project_id
  AND pp.profile_id = user_id;

IF is_public
AND project_role IS NULL THEN project_role := 'member'::public.user_role;

END IF;

SELECT array_agg(permission) INTO user_permissions
FROM public.role_permissions
WHERE role = COALESCE(project_role, 'member'::public.user_role);

event := jsonb_set(
  event,
  '{claims}',
  jsonb_build_object(
    'current_project_id',
    current_project_id,
    'project_role',
    COALESCE(project_role, 'member'),
    'permissions',
    COALESCE(
      user_permissions,
      ARRAY []::public.app_permission []
    )
  )
);

RETURN event;

END;

$$;


ALTER FUNCTION "public"."custom_access_token_hook"("event" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_id_by_email"("email" "text") RETURNS TABLE("id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  RETURN QUERY SELECT au.id FROM auth.users au WHERE au.email = $1;
END;
$_$;


ALTER FUNCTION "public"."get_user_id_by_email"("email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_profile"("user_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare result json;

begin -- Check if the requesting user is the same as the requested profile
if auth.uid() != user_id then raise exception 'Permission denied' using hint = 'Users can only access their own profiles';

end if;

select json_build_object(
    'id',
    au.id,
    'email',
    au.email,
    'displayName',
    COALESCE(
      (au.raw_user_meta_data->>'display_name')::text,
      split_part(au.email, '@', 1),
      'User'
    ),
    'avatarUrl',
    COALESCE(
      (au.raw_user_meta_data->>'avatar_url')::text,
      '/placeholder.svg'
    ),
    'pricingPlan',
    p.pricing_plan,
    'currentProject',
    json_build_object(
      'id',
      proj.id,
      'name',
      proj.name,
      'isPublic',
      proj.is_public
    ),
    -- Permissions are now handled by JWT claims
    'permissions',
    (auth.jwt()->>'permissions')::app_permission [],
    'projectRole',
    (auth.jwt()->>'project_role')::user_role
  ) into result
from auth.users au
  join public.profiles p on p.id = au.id
  join public.projects proj on proj.id = p.current_project_id
where au.id = user_id;

return result;

end;

$$;


ALTER FUNCTION "public"."get_user_profile"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (id)
  values (new.id);
  
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_project_member"("project_id" bigint) RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $_$
select exists (
        select 1
        from projects_profiles
        where project_id = $1
            and profile_id = auth.uid()
    );

$_$;


ALTER FUNCTION "public"."is_project_member"("project_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_project_owner"("project_id" bigint) RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
select exists (
        select 1
        from projects
        where id = project_id
            and created_by = auth.uid()
    );

$$;


ALTER FUNCTION "public"."is_project_owner"("project_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "test_overrides"."now"() RETURNS timestamp with time zone
    LANGUAGE "plpgsql"
    AS $$ BEGIN -- check if a frozen time is set
IF nullif(current_setting('tests.frozen_time'), '') IS NOT NULL THEN RETURN current_setting('tests.frozen_time')::timestamptz;

END IF;

RETURN pg_catalog.now();

END $$;


ALTER FUNCTION "test_overrides"."now"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "tests"."authenticate_as"("identifier" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE user_data json;

original_auth_data text;

current_project_id bigint;

project_role user_role;

user_permissions app_permission [];

is_public boolean;

BEGIN -- store the request.jwt.claims in a variable in case we need it
original_auth_data := current_setting('request.jwt.claims', true);

user_data := tests.get_supabase_user(identifier);

SELECT p.current_project_id,
    pr.is_public,
    pp.role INTO current_project_id,
    is_public,
    project_role
FROM profiles p
    JOIN projects pr ON pr.id = p.current_project_id
    LEFT JOIN projects_profiles pp ON pp.project_id = p.current_project_id
    AND pp.profile_id = (user_data->>'id')::uuid;

IF is_public
AND project_role IS NULL THEN project_role := 'member'::user_role;

END IF;

SELECT array_agg(permission) INTO user_permissions
FROM role_permissions
WHERE role = COALESCE(project_role, 'member'::user_role);

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

END $$;


ALTER FUNCTION "tests"."authenticate_as"("identifier" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "tests"."authenticate_as_service_role"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$ BEGIN perform set_config('role', 'service_role', true);

perform set_config('request.jwt.claims', null, true);

END $$;


ALTER FUNCTION "tests"."authenticate_as_service_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "tests"."clear_authentication"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$ BEGIN perform set_config('role', 'anon', true);

perform set_config('request.jwt.claims', null, true);

END $$;


ALTER FUNCTION "tests"."clear_authentication"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "tests"."create_supabase_user"("identifier" "text", "project_id" bigint DEFAULT 1, "email" "text" DEFAULT NULL::"text", "phone" "text" DEFAULT NULL::"text", "metadata" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'auth', 'pg_temp'
    AS $$
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

UPDATE public.profiles
SET id = user_id,
    current_project_id = create_supabase_user.project_id
WHERE id = user_id;

RETURN user_id;

END;

$$;


ALTER FUNCTION "tests"."create_supabase_user"("identifier" "text", "project_id" bigint, "email" "text", "phone" "text", "metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "tests"."freeze_time"("frozen_time" timestamp with time zone) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$ BEGIN -- Add test_overrides to search path if needed
    IF current_setting('search_path') NOT LIKE 'test_overrides,%' THEN -- store search path for later
    PERFORM set_config(
        'tests.original_search_path',
        current_setting('search_path'),
        true
    );

PERFORM set_config(
    'search_path',
    'test_overrides,' || current_setting('tests.original_search_path') || ',pg_catalog',
    true
);

END IF;

PERFORM set_config('tests.frozen_time', frozen_time::text, true);

END $$;


ALTER FUNCTION "tests"."freeze_time"("frozen_time" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "tests"."get_supabase_uid"("identifier" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'auth', 'pg_temp'
    AS $$
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

$$;


ALTER FUNCTION "tests"."get_supabase_uid"("identifier" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "tests"."get_supabase_user"("identifier" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'auth', 'pg_temp'
    AS $$
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

$$;


ALTER FUNCTION "tests"."get_supabase_user"("identifier" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "tests"."rls_enabled"("testing_schema" "text") RETURNS "text"
    LANGUAGE "sql"
    AS $$
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

$$;


ALTER FUNCTION "tests"."rls_enabled"("testing_schema" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "tests"."rls_enabled"("testing_schema" "text", "testing_table" "text") RETURNS "text"
    LANGUAGE "sql"
    AS $$
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

$$;


ALTER FUNCTION "tests"."rls_enabled"("testing_schema" "text", "testing_table" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "tests"."switch_to_project"("identifier" "text", "project_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE user_id uuid;

BEGIN -- Get the user's ID
SELECT id INTO user_id
FROM auth.users
WHERE raw_user_meta_data->>'test_identifier' = identifier;

IF user_id IS NULL THEN RAISE EXCEPTION 'User with identifier % not found',
identifier;

END IF;

IF NOT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = project_id
) THEN RAISE EXCEPTION 'Project with ID % not found',
project_id;

END IF;

UPDATE public.profiles
SET current_project_id = project_id
WHERE id = user_id;

PERFORM tests.authenticate_as(identifier);

END;

$$;


ALTER FUNCTION "tests"."switch_to_project"("identifier" "text", "project_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "tests"."unfreeze_time"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$ BEGIN -- restore the original now function
    PERFORM set_config('tests.frozen_time', null, true);

PERFORM set_config(
    'search_path',
    current_setting('tests.original_search_path'),
    true
);

END $$;


ALTER FUNCTION "tests"."unfreeze_time"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."characters" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "voice" "text",
    "ai_description" "text",
    "ai_model" "text",
    "description" "text",
    "avatar_url" "text",
    "project_id" bigint,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."characters" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."characters_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."characters_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."characters_id_seq" OWNED BY "public"."characters"."id";



CREATE TABLE IF NOT EXISTS "public"."enrollments" (
    "id" bigint NOT NULL,
    "training_id" bigint NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."enrollments" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."enrollments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."enrollments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."enrollments_id_seq" OWNED BY "public"."enrollments"."id";



CREATE TABLE IF NOT EXISTS "public"."history" (
    "id" bigint NOT NULL,
    "module_id" bigint,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "transcript_text" "text",
    "transcript_json" "jsonb",
    "recording_url" "text",
    "assessment_created" boolean DEFAULT false NOT NULL,
    "assessment_text" "text",
    "practice_no" integer DEFAULT 1 NOT NULL,
    "started_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."history" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."history_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."history_id_seq" OWNED BY "public"."history"."id";



CREATE TABLE IF NOT EXISTS "public"."modules" (
    "id" bigint NOT NULL,
    "training_id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "instructions" "text",
    "ordinal" integer DEFAULT 0 NOT NULL,
    "ai_model" "text",
    "scenario_prompt" "text",
    "assessment_prompt" "text",
    "moderator_prompt" "text",
    "video_url" "text",
    "audio_url" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."modules_characters" (
    "module_id" bigint NOT NULL,
    "character_id" bigint NOT NULL,
    "ordinal" integer DEFAULT 0 NOT NULL,
    "prompt" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."modules_characters" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."modules_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."modules_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."modules_id_seq" OWNED BY "public"."modules"."id";



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "current_project_id" bigint DEFAULT 1,
    "pricing_plan" "public"."pricing_plan" DEFAULT 'free'::"public"."pricing_plan" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" bigint NOT NULL,
    "name" "text",
    "is_public" boolean DEFAULT false NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."projects_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."projects_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."projects_id_seq" OWNED BY "public"."projects"."id";



CREATE TABLE IF NOT EXISTS "public"."projects_profiles" (
    "project_id" bigint NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "role" "public"."user_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."projects_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "role" "public"."user_role" NOT NULL,
    "permission" "public"."app_permission" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trainings" (
    "id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "tagline" "text",
    "description" "text",
    "image_url" "text",
    "preview_url" "text",
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "project_id" bigint,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."trainings" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."trainings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."trainings_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."trainings_id_seq" OWNED BY "public"."trainings"."id";



ALTER TABLE ONLY "public"."characters" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."characters_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."enrollments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."enrollments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."history_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."modules" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."modules_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."projects" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."projects_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."trainings" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."trainings_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."history"
    ADD CONSTRAINT "history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modules_characters"
    ADD CONSTRAINT "modules_characters_module_id_character_id_pk" PRIMARY KEY ("module_id", "character_id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects_profiles"
    ADD CONSTRAINT "projects_profiles_project_id_profile_id_pk" PRIMARY KEY ("project_id", "profile_id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_permission_pk" PRIMARY KEY ("role", "permission");



ALTER TABLE ONLY "public"."trainings"
    ADD CONSTRAINT "trainings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."history"
    ADD CONSTRAINT "unique_practice" UNIQUE ("user_id", "module_id", "practice_no");



CREATE INDEX "enrollments_training_id_idx" ON "public"."enrollments" USING "btree" ("training_id");



CREATE INDEX "enrollments_user_id_created_at_idx" ON "public"."enrollments" USING "btree" ("user_id", "created_at");



CREATE INDEX "history_user_id_idx" ON "public"."history" USING "btree" ("user_id");



CREATE INDEX "modules_training_id_idx" ON "public"."modules" USING "btree" ("training_id");



CREATE OR REPLACE TRIGGER "set_practice_number" BEFORE INSERT ON "public"."history" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_practice_number"();



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."history"
    ADD CONSTRAINT "history_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."history"
    ADD CONSTRAINT "history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."modules_characters"
    ADD CONSTRAINT "modules_characters_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."modules_characters"
    ADD CONSTRAINT "modules_characters_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_current_project_id_fkey" FOREIGN KEY ("current_project_id") REFERENCES "public"."projects"("id") ON DELETE SET DEFAULT;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects_profiles"
    ADD CONSTRAINT "projects_profiles_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects_profiles"
    ADD CONSTRAINT "projects_profiles_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trainings"
    ADD CONSTRAINT "trainings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trainings"
    ADD CONSTRAINT "trainings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



CREATE POLICY "Allow handle_new_user owner (supabase_admin) full access to pro" ON "public"."profiles" TO "supabase_admin" USING (true) WITH CHECK (true);



CREATE POLICY "Allow supabase_auth_admin to read profiles" ON "public"."profiles" FOR SELECT TO "supabase_auth_admin" USING (true);



CREATE POLICY "Allow supabase_auth_admin to read projects" ON "public"."projects" FOR SELECT TO "supabase_auth_admin" USING (true);



CREATE POLICY "Allow supabase_auth_admin to read projects_profiles" ON "public"."projects_profiles" FOR SELECT TO "supabase_auth_admin" USING (true);



CREATE POLICY "Any member can view role permissions" ON "public"."role_permissions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Characters are manageable by users with training.manage permiss" ON "public"."characters" TO "authenticated" USING (("public"."authorize"('training.manage'::"public"."app_permission") AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."current_project_id" = "characters"."project_id")))))) WITH CHECK (("public"."authorize"('training.manage'::"public"."app_permission") AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."current_project_id" = "characters"."project_id"))))));



CREATE POLICY "Characters are viewable by project members or if project is pub" ON "public"."characters" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     LEFT JOIN "public"."projects_profiles" "pp" ON ((("pp"."project_id" = "p"."id") AND ("pp"."profile_id" = "auth"."uid"()))))
  WHERE (("p"."id" = "characters"."project_id") AND (("p"."is_public" = true) OR ("pp"."profile_id" IS NOT NULL))))));



CREATE POLICY "Modules are manageable by users with training.manage permission" ON "public"."modules" TO "authenticated" USING (("public"."authorize"('training.manage'::"public"."app_permission") AND (EXISTS ( SELECT 1
   FROM ("public"."trainings"
     JOIN "public"."profiles" ON (("profiles"."current_project_id" = "trainings"."project_id")))
  WHERE (("trainings"."id" = "modules"."training_id") AND ("profiles"."id" = "auth"."uid"())))))) WITH CHECK (("public"."authorize"('training.manage'::"public"."app_permission") AND (EXISTS ( SELECT 1
   FROM ("public"."trainings"
     JOIN "public"."profiles" ON (("profiles"."current_project_id" = "trainings"."project_id")))
  WHERE (("trainings"."id" = "modules"."training_id") AND ("profiles"."id" = "auth"."uid"()))))));



CREATE POLICY "Modules are viewable by project members or if project is public" ON "public"."modules" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."trainings" "t"
     JOIN "public"."projects" "p" ON (("p"."id" = "t"."project_id")))
     LEFT JOIN "public"."projects_profiles" "pp" ON ((("pp"."project_id" = "p"."id") AND ("pp"."profile_id" = "auth"."uid"()))))
  WHERE (("t"."id" = "modules"."training_id") AND (("p"."is_public" = true) OR ("pp"."profile_id" IS NOT NULL))))));



CREATE POLICY "Modules-characters associations are manageable by users with tr" ON "public"."modules_characters" TO "authenticated" USING (("public"."authorize"('training.manage'::"public"."app_permission") AND (EXISTS ( SELECT 1
   FROM ("public"."modules" "m"
     JOIN "public"."trainings" "t" ON (("t"."id" = "m"."training_id")))
  WHERE (("m"."id" = "modules_characters"."module_id") AND ("t"."project_id" = ( SELECT "profiles"."current_project_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"())))))))) WITH CHECK (("public"."authorize"('training.manage'::"public"."app_permission") AND (EXISTS ( SELECT 1
   FROM ("public"."modules" "m"
     JOIN "public"."trainings" "t" ON (("t"."id" = "m"."training_id")))
  WHERE (("m"."id" = "modules_characters"."module_id") AND ("t"."project_id" = ( SELECT "profiles"."current_project_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))))))));



CREATE POLICY "Modules-characters associations are viewable by project members" ON "public"."modules_characters" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ((("public"."modules" "m"
     JOIN "public"."trainings" "t" ON (("t"."id" = "m"."training_id")))
     JOIN "public"."projects" "p" ON (("p"."id" = "t"."project_id")))
     LEFT JOIN "public"."projects_profiles" "pp" ON ((("pp"."project_id" = "p"."id") AND ("pp"."profile_id" = "auth"."uid"()))))
  WHERE (("m"."id" = "modules_characters"."module_id") AND (("p"."is_public" = true) OR ("pp"."profile_id" IS NOT NULL))))));



CREATE POLICY "Project creators can manage members" ON "public"."projects_profiles" TO "authenticated" USING ("public"."is_project_owner"("project_id")) WITH CHECK ("public"."is_project_owner"("project_id"));



CREATE POLICY "Training managers can manage other users' enrollments in their " ON "public"."enrollments" TO "authenticated" USING (("public"."authorize"('enrollment.manage'::"public"."app_permission") AND (EXISTS ( SELECT 1
   FROM "public"."trainings" "t"
  WHERE (("t"."id" = "enrollments"."training_id") AND ("t"."project_id" = ( SELECT "profiles"."current_project_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"())))))))) WITH CHECK (("public"."authorize"('enrollment.manage'::"public"."app_permission") AND (EXISTS ( SELECT 1
   FROM "public"."trainings" "t"
  WHERE (("t"."id" = "enrollments"."training_id") AND ("t"."project_id" = ( SELECT "profiles"."current_project_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))))))));



CREATE POLICY "Trainings are manageable by users with training.manage permissi" ON "public"."trainings" TO "authenticated" USING (("public"."authorize"('training.manage'::"public"."app_permission") AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."current_project_id" = "trainings"."project_id")))))) WITH CHECK (("public"."authorize"('training.manage'::"public"."app_permission") AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."current_project_id" = "trainings"."project_id"))))));



CREATE POLICY "Trainings are viewable by project members or if project is publ" ON "public"."trainings" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     LEFT JOIN "public"."projects_profiles" "pp" ON ((("pp"."project_id" = "p"."id") AND ("pp"."profile_id" = "auth"."uid"()))))
  WHERE (("p"."id" = "trainings"."project_id") AND (("p"."is_public" = true) OR ("pp"."profile_id" IS NOT NULL))))));



CREATE POLICY "Users can create projects" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can manage project members" ON "public"."projects_profiles" TO "authenticated" USING (("public"."is_project_member"("project_id") AND "public"."authorize"('project.member.manage'::"public"."app_permission"))) WITH CHECK (("public"."is_project_member"("project_id") AND "public"."authorize"('project.member.manage'::"public"."app_permission")));



CREATE POLICY "Users can manage projects with permission" ON "public"."projects" TO "authenticated" USING ("public"."authorize"('project.manage'::"public"."app_permission")) WITH CHECK ("public"."authorize"('project.manage'::"public"."app_permission"));



CREATE POLICY "Users can manage their own enrollments" ON "public"."enrollments" TO "authenticated" USING ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM (("public"."trainings" "t"
     JOIN "public"."projects" "p" ON (("p"."id" = "t"."project_id")))
     LEFT JOIN "public"."projects_profiles" "pp" ON ((("pp"."project_id" = "p"."id") AND ("pp"."profile_id" = "auth"."uid"()))))
  WHERE (("t"."id" = "enrollments"."training_id") AND (("p"."is_public" = true) OR ("pp"."profile_id" IS NOT NULL))))))) WITH CHECK ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM (("public"."trainings" "t"
     JOIN "public"."projects" "p" ON (("p"."id" = "t"."project_id")))
     LEFT JOIN "public"."projects_profiles" "pp" ON ((("pp"."project_id" = "p"."id") AND ("pp"."profile_id" = "auth"."uid"()))))
  WHERE (("t"."id" = "enrollments"."training_id") AND (("p"."is_public" = true) OR ("pp"."profile_id" IS NOT NULL)))))));



CREATE POLICY "Users can manage their own history" ON "public"."history" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can view profiles of users in shared projects" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."projects_profiles" "pp1"
     JOIN "public"."projects_profiles" "pp2" ON (("pp1"."project_id" = "pp2"."project_id")))
  WHERE (("pp1"."profile_id" = "auth"."uid"()) AND ("pp2"."profile_id" = "profiles"."id")))));



CREATE POLICY "Users can view project members" ON "public"."projects_profiles" FOR SELECT TO "authenticated" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can view their projects" ON "public"."projects" FOR SELECT TO "authenticated" USING ((("is_public" = true) OR ("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."projects_profiles"
  WHERE (("projects_profiles"."project_id" = "projects"."id") AND ("projects_profiles"."profile_id" = "auth"."uid"()))))));



ALTER TABLE "public"."characters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."modules_characters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trainings" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";
GRANT USAGE ON SCHEMA "public" TO "supabase_admin";






GRANT USAGE ON SCHEMA "test_overrides" TO "anon";
GRANT USAGE ON SCHEMA "test_overrides" TO "authenticated";
GRANT USAGE ON SCHEMA "test_overrides" TO "service_role";



GRANT USAGE ON SCHEMA "tests" TO "anon";
GRANT USAGE ON SCHEMA "tests" TO "authenticated";
GRANT USAGE ON SCHEMA "tests" TO "service_role";



















































































































































































































































GRANT ALL ON FUNCTION "public"."authorize"("requested_permission" "public"."app_permission") TO "anon";
GRANT ALL ON FUNCTION "public"."authorize"("requested_permission" "public"."app_permission") TO "authenticated";
GRANT ALL ON FUNCTION "public"."authorize"("requested_permission" "public"."app_permission") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_practice_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_practice_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_practice_number"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_project"("project_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_project"("project_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_project"("project_name" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."get_user_id_by_email"("email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_id_by_email"("email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_id_by_email"("email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_profile"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_profile"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_profile"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_project_member"("project_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."is_project_member"("project_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_project_member"("project_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_project_owner"("project_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."is_project_owner"("project_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_project_owner"("project_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "test_overrides"."now"() TO "anon";
GRANT ALL ON FUNCTION "test_overrides"."now"() TO "authenticated";
GRANT ALL ON FUNCTION "test_overrides"."now"() TO "service_role";



GRANT ALL ON FUNCTION "tests"."authenticate_as"("identifier" "text") TO "anon";
GRANT ALL ON FUNCTION "tests"."authenticate_as"("identifier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "tests"."authenticate_as"("identifier" "text") TO "service_role";



GRANT ALL ON FUNCTION "tests"."authenticate_as_service_role"() TO "anon";
GRANT ALL ON FUNCTION "tests"."authenticate_as_service_role"() TO "authenticated";
GRANT ALL ON FUNCTION "tests"."authenticate_as_service_role"() TO "service_role";



GRANT ALL ON FUNCTION "tests"."clear_authentication"() TO "anon";
GRANT ALL ON FUNCTION "tests"."clear_authentication"() TO "authenticated";
GRANT ALL ON FUNCTION "tests"."clear_authentication"() TO "service_role";



GRANT ALL ON FUNCTION "tests"."create_supabase_user"("identifier" "text", "project_id" bigint, "email" "text", "phone" "text", "metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "tests"."create_supabase_user"("identifier" "text", "project_id" bigint, "email" "text", "phone" "text", "metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "tests"."create_supabase_user"("identifier" "text", "project_id" bigint, "email" "text", "phone" "text", "metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "tests"."freeze_time"("frozen_time" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "tests"."freeze_time"("frozen_time" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "tests"."freeze_time"("frozen_time" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "tests"."get_supabase_uid"("identifier" "text") TO "anon";
GRANT ALL ON FUNCTION "tests"."get_supabase_uid"("identifier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "tests"."get_supabase_uid"("identifier" "text") TO "service_role";



GRANT ALL ON FUNCTION "tests"."get_supabase_user"("identifier" "text") TO "anon";
GRANT ALL ON FUNCTION "tests"."get_supabase_user"("identifier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "tests"."get_supabase_user"("identifier" "text") TO "service_role";



GRANT ALL ON FUNCTION "tests"."rls_enabled"("testing_schema" "text") TO "anon";
GRANT ALL ON FUNCTION "tests"."rls_enabled"("testing_schema" "text") TO "authenticated";
GRANT ALL ON FUNCTION "tests"."rls_enabled"("testing_schema" "text") TO "service_role";



GRANT ALL ON FUNCTION "tests"."rls_enabled"("testing_schema" "text", "testing_table" "text") TO "anon";
GRANT ALL ON FUNCTION "tests"."rls_enabled"("testing_schema" "text", "testing_table" "text") TO "authenticated";
GRANT ALL ON FUNCTION "tests"."rls_enabled"("testing_schema" "text", "testing_table" "text") TO "service_role";



GRANT ALL ON FUNCTION "tests"."switch_to_project"("identifier" "text", "project_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "tests"."switch_to_project"("identifier" "text", "project_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "tests"."switch_to_project"("identifier" "text", "project_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "tests"."unfreeze_time"() TO "anon";
GRANT ALL ON FUNCTION "tests"."unfreeze_time"() TO "authenticated";
GRANT ALL ON FUNCTION "tests"."unfreeze_time"() TO "service_role";


















GRANT ALL ON TABLE "public"."characters" TO "anon";
GRANT ALL ON TABLE "public"."characters" TO "authenticated";
GRANT ALL ON TABLE "public"."characters" TO "service_role";



GRANT ALL ON SEQUENCE "public"."characters_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."characters_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."characters_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."enrollments" TO "anon";
GRANT ALL ON TABLE "public"."enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."enrollments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."enrollments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."enrollments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."enrollments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."history" TO "anon";
GRANT ALL ON TABLE "public"."history" TO "authenticated";
GRANT ALL ON TABLE "public"."history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."history_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."modules" TO "anon";
GRANT ALL ON TABLE "public"."modules" TO "authenticated";
GRANT ALL ON TABLE "public"."modules" TO "service_role";



GRANT ALL ON TABLE "public"."modules_characters" TO "anon";
GRANT ALL ON TABLE "public"."modules_characters" TO "authenticated";
GRANT ALL ON TABLE "public"."modules_characters" TO "service_role";



GRANT ALL ON SEQUENCE "public"."modules_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."modules_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."modules_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT SELECT ON TABLE "public"."profiles" TO "supabase_auth_admin";
GRANT ALL ON TABLE "public"."profiles" TO "supabase_admin";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";
GRANT SELECT ON TABLE "public"."projects" TO "supabase_auth_admin";



GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."projects_profiles" TO "anon";
GRANT ALL ON TABLE "public"."projects_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."projects_profiles" TO "service_role";
GRANT SELECT ON TABLE "public"."projects_profiles" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."trainings" TO "anon";
GRANT ALL ON TABLE "public"."trainings" TO "authenticated";
GRANT ALL ON TABLE "public"."trainings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."trainings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."trainings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."trainings_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "test_overrides" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "test_overrides" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "test_overrides" GRANT ALL ON FUNCTIONS  TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "tests" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "tests" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "tests" GRANT ALL ON FUNCTIONS  TO "service_role";



























RESET ALL;
