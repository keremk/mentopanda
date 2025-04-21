

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






CREATE EXTENSION IF NOT EXISTS "pgsodium";






CREATE EXTENSION IF NOT EXISTS "hstore" WITH SCHEMA "public";






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
    'training.history',
    'basic.access',
    'trials.manage'
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


CREATE OR REPLACE FUNCTION "public"."accept_invitation"("invitation_id" bigint, "user_id" "uuid", "p_project_id" bigint DEFAULT NULL::bigint) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_invitation_project_id BIGINT; -- Project ID from the invitation record (can be NULL)
  v_target_project_id BIGINT; -- The final project ID to use
  v_role USER_ROLE;
  v_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO v_email FROM auth.users WHERE id = user_id;
  
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'User not found: %', user_id;
  END IF;
  
  -- Get the invitation details (role is required, project_id might be null)
  SELECT project_id, role 
  INTO v_invitation_project_id, v_role
  FROM invitations
  WHERE id = invitation_id
  AND invitee_email = v_email;
  
  -- Check if invitation exists and belongs to the user
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or not for this user (ID: %, Email: %)', invitation_id, v_email;
  END IF;

  -- Determine the target project ID
  IF p_project_id IS NOT NULL THEN
    v_target_project_id := p_project_id; -- Use provided project ID
  ELSE
    v_target_project_id := v_invitation_project_id; -- Fallback to invitation's project ID
  END IF;

  -- Ensure we have a project ID to proceed
  IF v_target_project_id IS NULL THEN
    RAISE EXCEPTION 'Project ID must be provided directly or exist in the invitation record (Invitation ID: %)', invitation_id;
  END IF;
  
  -- Add the user to the determined project
  INSERT INTO projects_profiles (project_id, profile_id, role)
  VALUES (v_target_project_id, user_id, v_role)
  ON CONFLICT (project_id, profile_id) DO UPDATE SET role = v_role;
  
  -- Delete the invitation
  DELETE FROM invitations WHERE id = invitation_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise the original exception to preserve details
    RAISE; 
END;
$$;


ALTER FUNCTION "public"."accept_invitation"("invitation_id" bigint, "user_id" "uuid", "p_project_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."accept_invitation"("invitation_id" bigint, "user_id" "uuid", "p_project_id" bigint) IS 'Securely accepts an invitation, adds a user to a project using provided project_id or fallback to invitation project_id - bypasses RLS';



CREATE OR REPLACE FUNCTION "public"."authorize"("requested_permission" "public"."app_permission", "project_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ 
DECLARE
  jwt_project_id bigint;
BEGIN
  -- Get the current project ID from JWT
  jwt_project_id := (auth.jwt()->'current_project_id')::bigint;
  
  -- Only authorize if the requested project matches the current project in JWT
  -- and the user has the requested permission
  RETURN 
    project_id = jwt_project_id AND
    requested_permission = ANY(
      ARRAY(
        SELECT jsonb_array_elements_text((auth.jwt()->'permissions')::jsonb)
      )::public.app_permission[]
    );
END;
$$;


ALTER FUNCTION "public"."authorize"("requested_permission" "public"."app_permission", "project_id" bigint) OWNER TO "postgres";


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
    AS $$
DECLARE
    claims jsonb;
    user_id uuid;
    current_project_id bigint;
    project_role public.user_role;
    user_permissions public.app_permission[];
    debug_profiles jsonb;
    debug_projects jsonb;
BEGIN
    -- RAISE LOG 'custom_access_token_hook called with event: %', event;

    claims := event->'claims';
    user_id := (event->>'user_id')::uuid;

    -- Debug the full profiles row
    SELECT row_to_json(p)::jsonb INTO debug_profiles
    FROM public.profiles p
    WHERE p.id = user_id;
    
    -- RAISE LOG 'Debug profiles row: %', debug_profiles;

    -- Get current project and explicit role if any
    SELECT p.current_project_id, pp.role 
    INTO current_project_id, project_role
    FROM public.profiles p
    LEFT JOIN public.projects_profiles pp ON pp.project_id = p.current_project_id AND pp.profile_id = user_id
    WHERE p.id = user_id;

    -- Debug the full projects row
    SELECT row_to_json(pr)::jsonb INTO debug_projects
    FROM public.projects pr
    WHERE pr.id = current_project_id;
    
    -- RAISE LOG 'Debug projects row: %', debug_projects;
    -- RAISE LOG 'Found project_id: %, role: %', current_project_id, project_role;

    -- Get permissions for the role
    SELECT array_agg(permission) INTO user_permissions
    FROM public.role_permissions
    WHERE role = COALESCE(project_role, 'member'::public.user_role);

    -- Set our custom claims
    claims := jsonb_set(claims, '{current_project_id}', to_jsonb(current_project_id));
    claims := jsonb_set(claims, '{project_role}', to_jsonb(COALESCE(project_role, 'member')));
    claims := jsonb_set(claims, '{permissions}', to_jsonb(COALESCE(user_permissions, ARRAY[]::public.app_permission[])));

    -- Update the claims in the event
    RETURN jsonb_set(event, '{claims}', claims);
END;
$$;


ALTER FUNCTION "public"."custom_access_token_hook"("event" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deep_copy_project"("source_project_id" bigint, "target_project_id" bigint, "target_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    source_training_id BIGINT;
    new_training_id BIGINT;
    character_id_map HSTORE := ''::HSTORE;
    old_character_id BIGINT;
    new_character_id BIGINT;
    module_rec RECORD;
BEGIN
    -- First, build a map of character IDs that will be needed
    FOR old_character_id IN
        SELECT DISTINCT characters.id
        FROM modules_characters
        JOIN modules ON modules.id = modules_characters.module_id
        JOIN trainings ON trainings.id = modules.training_id
        JOIN characters ON characters.id = modules_characters.character_id
        WHERE trainings.project_id = source_project_id
    LOOP
        -- Create new character
        INSERT INTO characters (
            name, voice, ai_description, ai_model,
            description, avatar_url, project_id, created_by
        )
        SELECT 
            name, voice, ai_description, ai_model,
            description, avatar_url, target_project_id, target_user_id
        FROM characters
        WHERE id = old_character_id
        RETURNING id INTO new_character_id;
        
        -- Store the mapping of old to new character IDs
        character_id_map := character_id_map || HSTORE(
            old_character_id::text,
            new_character_id::text
        );
    END LOOP;

    -- Create a temporary table to store module mappings
    CREATE TEMPORARY TABLE module_mapping (
        old_id BIGINT,
        new_id BIGINT,
        training_id BIGINT
    ) ON COMMIT DROP;

    -- Copy each training and its modules
    FOR source_training_id IN
        SELECT id FROM trainings WHERE project_id = source_project_id
    LOOP
        -- Copy the training
        INSERT INTO trainings (
            title, tagline, description, image_url, preview_url,
            created_by, project_id
        )
        SELECT 
            title, tagline, description, image_url, preview_url,
            target_user_id, target_project_id
        FROM trainings 
        WHERE id = source_training_id
        RETURNING id INTO new_training_id;
        
        -- Copy modules for this specific training
        FOR module_rec IN
            SELECT id, title, instructions, ordinal, ai_model, 
                   scenario_prompt, assessment_prompt, moderator_prompt, 
                   video_url, audio_url
            FROM modules
            WHERE training_id = source_training_id
        LOOP
            INSERT INTO modules (
                training_id, title, instructions, ordinal,
                ai_model, scenario_prompt, assessment_prompt,
                moderator_prompt, video_url, audio_url
            )
            VALUES (
                new_training_id, module_rec.title, module_rec.instructions, module_rec.ordinal,
                module_rec.ai_model, module_rec.scenario_prompt, module_rec.assessment_prompt,
                module_rec.moderator_prompt, module_rec.video_url, module_rec.audio_url
            )
            RETURNING id INTO new_character_id;
            
            -- Store the module mapping
            INSERT INTO module_mapping (old_id, new_id, training_id)
            VALUES (module_rec.id, new_character_id, new_training_id);
        END LOOP;
    END LOOP;
    
    -- Copy module_characters relationships using the mappings
    INSERT INTO modules_characters (
        module_id, character_id, ordinal, prompt
    )
    SELECT 
        mm.new_id,
        (character_id_map -> mc.character_id::text)::bigint,
        mc.ordinal,
        mc.prompt
    FROM modules_characters mc
    JOIN module_mapping mm ON mc.module_id = mm.old_id
    WHERE mc.character_id::text = ANY (akeys(character_id_map));
    
    -- Drop the temporary table
    DROP TABLE module_mapping;
END;
$$;


ALTER FUNCTION "public"."deep_copy_project"("source_project_id" bigint, "target_project_id" bigint, "target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_project_member_info"("p_project_id" bigint, "p_user_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    authorized boolean;
    member_info json;
BEGIN
    -- Check if the caller has 'project.member.manage' permission for this specific project
    authorized := public.authorize('project.member.manage'::public.app_permission, p_project_id);

    IF authorized THEN
        -- Retrieve single member's information for the specified project and user
        SELECT json_build_object(
            'user_id', pp.profile_id,
            'email', u.email,
            'display_name', u.raw_user_meta_data->>'display_name',
            'avatar_url', u.raw_user_meta_data->>'avatar_url',
            'role', pp.role
        )
        INTO member_info
        FROM public.projects_profiles pp
        JOIN auth.users u ON pp.profile_id = u.id
        WHERE pp.project_id = p_project_id 
        AND pp.profile_id = p_user_id;

        -- Return success with member data, null if member not found
        RETURN json_build_object(
            'status', 'success',
            'data', COALESCE(member_info, null)
        );
    ELSE
        -- Return error if user lacks permission
        RETURN json_build_object(
            'status', 'error',
            'message', 'Access denied'
        );
    END IF;
END;
$$;


ALTER FUNCTION "public"."get_project_member_info"("p_project_id" bigint, "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_project_members"("p_project_id" bigint) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    authorized boolean;
    members json;
BEGIN
    -- Check if the caller has 'project.member.manage' permission for this specific project
    authorized := public.authorize('project.member.manage'::public.app_permission, p_project_id);

    IF authorized THEN
        -- Retrieve members' information for the specified project
        SELECT json_agg(json_build_object(
            'user_id', pp.profile_id,
            'email', u.email,
            'display_name', u.raw_user_meta_data->>'display_name',
            'avatar_url', u.raw_user_meta_data->>'avatar_url',
            'role', pp.role
        ))
        INTO members
        FROM public.projects_profiles pp
        JOIN auth.users u ON pp.profile_id = u.id
        WHERE pp.project_id = p_project_id;

        -- Return success with members data, defaulting to empty array if no members
        RETURN json_build_object(
            'status', 'success',
            'data', COALESCE(members, '[]'::json)
        );
    ELSE
        -- Return error if user lacks permission
        RETURN json_build_object(
            'status', 'error',
            'message', 'Access denied'
        );
    END IF;
END;
$$;


ALTER FUNCTION "public"."get_project_members"("p_project_id" bigint) OWNER TO "postgres";


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
declare 
  result json;
  user_project_role user_role;

begin -- Check if the requesting user is the same as the requested profile
if auth.uid() != user_id then raise exception 'Permission denied' using hint = 'Users can only access their own profiles';
end if;

select pp.role into user_project_role
from profiles p
join projects_profiles pp on p.current_project_id = pp.project_id and p.id = pp.profile_id
where p.id = user_id;

select json_build_object(
    'id',
    au.id,
    'email',
    au.email,
    'display_name',
    COALESCE(
      (au.raw_user_meta_data->>'display_name')::text,
      split_part(au.email, '@', 1),
      'User'
    ),
    'avatar_url',
    (au.raw_user_meta_data->>'avatar_url')::text,
    'pricing_plan',
    p.pricing_plan,
    'trial_start',
    p.trial_start,
    'trial_end',
    p.trial_end,
    'current_project',
    json_build_object(
      'id',
      proj.id,
      'name',
      proj.name,
      'is_public',
      proj.is_public
    ),
    -- Get permissions directly from the database based on the user's role in their current project
    'permissions',
    array(
      select rp.permission
      from role_permissions rp
      where rp.role = user_project_role
    ),
    'project_role',
    user_project_role
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


CREATE OR REPLACE FUNCTION "public"."is_member_of_project"("project_id" bigint) RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
select exists (
    select 1
    from projects_profiles
    where project_id = $1
    and profile_id = auth.uid()
);
$_$;


ALTER FUNCTION "public"."is_member_of_project"("project_id" bigint) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."replace_module_character"("p_module_id" integer, "p_old_character_id" integer, "p_new_character_id" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_existing_ordinal int;
  v_existing_prompt text;
begin
  -- If trying to replace with the same character, do nothing
  if p_old_character_id = p_new_character_id then
    return;
  end if;

  -- Get the existing row's data (if it exists)
  select ordinal, prompt
  into v_existing_ordinal, v_existing_prompt
  from modules_characters
  where module_id = p_module_id and character_id = p_old_character_id;

  -- If the old character exists
  if found then
    -- Delete the old character
    delete from modules_characters
    where module_id = p_module_id and character_id = p_old_character_id;

    -- Insert or update the new character, preserving ordinal and prompt
    insert into modules_characters (module_id, character_id, ordinal, prompt, created_at, updated_at)
    values (
      p_module_id,
      p_new_character_id,
      coalesce(v_existing_ordinal, 0),
      v_existing_prompt,
      now(),
      now()
    )
    on conflict (module_id, character_id) 
    do update set
      ordinal = excluded.ordinal,
      prompt = excluded.prompt,
      updated_at = now();
  else
    -- If old character doesn't exist, just insert the new one
    insert into modules_characters (module_id, character_id, created_at, updated_at)
    values (p_module_id, p_new_character_id, now(), now())
    on conflict (module_id, character_id) do nothing;
  end if;
end;
$$;


ALTER FUNCTION "public"."replace_module_character"("p_module_id" integer, "p_old_character_id" integer, "p_new_character_id" integer) OWNER TO "postgres";

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
    "project_id" bigint NOT NULL,
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



CREATE TABLE IF NOT EXISTS "public"."invitations" (
    "id" bigint NOT NULL,
    "project_id" bigint,
    "inviter_id" "uuid" NOT NULL,
    "invitee_email" "text" NOT NULL,
    "inviter_display_name" "text" NOT NULL,
    "inviter_email" "text" NOT NULL,
    "role" "public"."user_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "is_trial" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."invitations" OWNER TO "postgres";


COMMENT ON TABLE "public"."invitations" IS 'Stores project invitation records';



COMMENT ON COLUMN "public"."invitations"."project_id" IS 'Project ID the invitation is for (nullable for system invitations)';



COMMENT ON COLUMN "public"."invitations"."is_trial" IS 'Indicates if the invitation is for a trial account';



CREATE SEQUENCE IF NOT EXISTS "public"."invitations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."invitations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."invitations_id_seq" OWNED BY "public"."invitations"."id";



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
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "trial_start" timestamp with time zone,
    "trial_end" timestamp with time zone
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."trial_start" IS 'The date when the user trial started';



COMMENT ON COLUMN "public"."profiles"."trial_end" IS 'The date when the user trial ends';



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
    "project_id" bigint NOT NULL,
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



ALTER TABLE ONLY "public"."invitations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."invitations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."modules" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."modules_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."projects" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."projects_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."trainings" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."trainings_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."history"
    ADD CONSTRAINT "history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");



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



CREATE INDEX "invitations_invitee_email_idx" ON "public"."invitations" USING "btree" ("invitee_email");



CREATE INDEX "invitations_project_id_idx" ON "public"."invitations" USING "btree" ("project_id");



CREATE UNIQUE INDEX "invitations_project_invitee_unique_idx" ON "public"."invitations" USING "btree" (COALESCE("project_id", (0)::bigint), "invitee_email");



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



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



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



CREATE POLICY "Any member can view role permissions" ON "public"."role_permissions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Characters are manageable by users with training.manage permiss" ON "public"."characters" TO "authenticated" USING ("public"."authorize"('training.manage'::"public"."app_permission", "project_id")) WITH CHECK ("public"."authorize"('training.manage'::"public"."app_permission", "project_id"));



CREATE POLICY "Characters are viewable by project members or if project is pub" ON "public"."characters" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "characters"."project_id") AND (("p"."is_public" = true) OR ("p"."id" = (("auth"."jwt"() ->> 'current_project_id'::"text"))::bigint))))));



CREATE POLICY "Invitations are manageable by users with project.member.manage " ON "public"."invitations" TO "authenticated" USING ("public"."authorize"('project.member.manage'::"public"."app_permission", "project_id")) WITH CHECK ("public"."authorize"('project.member.manage'::"public"."app_permission", "project_id"));



CREATE POLICY "Invitations are viewable by invitee" ON "public"."invitations" FOR SELECT TO "authenticated" USING (("invitee_email" = ("auth"."jwt"() ->> 'email'::"text")));



CREATE POLICY "Modules are manageable by users with training.manage permission" ON "public"."modules" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."trainings" "t"
  WHERE (("t"."id" = "modules"."training_id") AND "public"."authorize"('training.manage'::"public"."app_permission", "t"."project_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."trainings" "t"
  WHERE (("t"."id" = "modules"."training_id") AND "public"."authorize"('training.manage'::"public"."app_permission", "t"."project_id")))));



CREATE POLICY "Modules are viewable by project members or if project is public" ON "public"."modules" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."trainings" "t"
     JOIN "public"."projects" "p" ON (("p"."id" = "t"."project_id")))
  WHERE (("t"."id" = "modules"."training_id") AND (("p"."is_public" = true) OR ("p"."id" = (("auth"."jwt"() ->> 'current_project_id'::"text"))::bigint))))));



CREATE POLICY "Modules-characters associations are manageable by users with tr" ON "public"."modules_characters" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."modules" "m"
     JOIN "public"."trainings" "t" ON (("t"."id" = "m"."training_id")))
  WHERE (("m"."id" = "modules_characters"."module_id") AND "public"."authorize"('training.manage'::"public"."app_permission", "t"."project_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."modules" "m"
     JOIN "public"."trainings" "t" ON (("t"."id" = "m"."training_id")))
  WHERE (("m"."id" = "modules_characters"."module_id") AND "public"."authorize"('training.manage'::"public"."app_permission", "t"."project_id")))));



CREATE POLICY "Modules-characters associations are viewable by project members" ON "public"."modules_characters" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."modules" "m"
     JOIN "public"."trainings" "t" ON (("t"."id" = "m"."training_id")))
     JOIN "public"."projects" "p" ON (("p"."id" = "t"."project_id")))
  WHERE (("m"."id" = "modules_characters"."module_id") AND (("p"."is_public" = true) OR ("p"."id" = (("auth"."jwt"() ->> 'current_project_id'::"text"))::bigint))))));



CREATE POLICY "Project creators can manage members" ON "public"."projects_profiles" TO "authenticated" USING ("public"."is_project_owner"("project_id")) WITH CHECK ("public"."is_project_owner"("project_id"));



CREATE POLICY "Trainings are manageable by users with training.manage permissi" ON "public"."trainings" TO "authenticated" USING ("public"."authorize"('training.manage'::"public"."app_permission", "project_id")) WITH CHECK ("public"."authorize"('training.manage'::"public"."app_permission", "project_id"));



CREATE POLICY "Trainings are viewable by project members or if project is publ" ON "public"."trainings" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "trainings"."project_id") AND (("p"."is_public" = true) OR ("p"."id" = (("auth"."jwt"() ->> 'current_project_id'::"text"))::bigint))))));



CREATE POLICY "Trial invitations are manageable by users with trials.manage pe" ON "public"."invitations" TO "authenticated" USING ((("is_trial" = true) AND ('trials.manage'::"public"."app_permission" = ANY ((ARRAY( SELECT "jsonb_array_elements_text"(("auth"."jwt"() -> 'permissions'::"text")) AS "jsonb_array_elements_text"))::"public"."app_permission"[])))) WITH CHECK ((("is_trial" = true) AND ('trials.manage'::"public"."app_permission" = ANY ((ARRAY( SELECT "jsonb_array_elements_text"(("auth"."jwt"() -> 'permissions'::"text")) AS "jsonb_array_elements_text"))::"public"."app_permission"[]))));



CREATE POLICY "Users can create projects" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can delete their own history" ON "public"."history" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own history" ON "public"."history" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage projects with permission" ON "public"."projects" TO "authenticated" USING ("public"."authorize"('project.manage'::"public"."app_permission", "id")) WITH CHECK ("public"."authorize"('project.manage'::"public"."app_permission", "id"));



CREATE POLICY "Users can manage their own enrollments" ON "public"."enrollments" TO "authenticated" USING ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."trainings" "t"
     JOIN "public"."projects" "p" ON (("p"."id" = "t"."project_id")))
  WHERE (("t"."id" = "enrollments"."training_id") AND (("p"."is_public" = true) OR ("p"."id" = (("auth"."jwt"() ->> 'current_project_id'::"text"))::bigint))))))) WITH CHECK ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."trainings" "t"
     JOIN "public"."projects" "p" ON (("p"."id" = "t"."project_id")))
  WHERE (("t"."id" = "enrollments"."training_id") AND (("p"."is_public" = true) OR ("p"."id" = (("auth"."jwt"() ->> 'current_project_id'::"text"))::bigint)))))));



CREATE POLICY "Users can update their own history" ON "public"."history" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can view history they own or have permission to see" ON "public"."history" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM ("public"."modules" "m"
     JOIN "public"."trainings" "t" ON (("t"."id" = "m"."training_id")))
  WHERE (("m"."id" = "history"."module_id") AND "public"."authorize"('training.history'::"public"."app_permission", "t"."project_id"))))));



CREATE POLICY "Users can view profiles of users in shared projects" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."projects_profiles" "pp1"
     JOIN "public"."projects_profiles" "pp2" ON (("pp1"."project_id" = "pp2"."project_id")))
  WHERE (("pp1"."profile_id" = "auth"."uid"()) AND ("pp2"."profile_id" = "profiles"."id")))));



CREATE POLICY "Users can view project members" ON "public"."projects_profiles" FOR SELECT TO "authenticated" USING ((("profile_id" = "auth"."uid"()) OR ("project_id" = (("auth"."jwt"() ->> 'current_project_id'::"text"))::bigint) OR "public"."is_member_of_project"("project_id")));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can view their projects" ON "public"."projects" FOR SELECT TO "authenticated" USING ((("is_public" = true) OR ("created_by" = "auth"."uid"()) OR ("id" = (("auth"."jwt"() ->> 'current_project_id'::"text"))::bigint) OR (EXISTS ( SELECT 1
   FROM "public"."projects_profiles"
  WHERE (("projects_profiles"."project_id" = "projects"."id") AND ("projects_profiles"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "Users with enrollment.manage permission can manage other users'" ON "public"."enrollments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."trainings" "t"
  WHERE (("t"."id" = "enrollments"."training_id") AND "public"."authorize"('enrollment.manage'::"public"."app_permission", "t"."project_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."trainings" "t"
  WHERE (("t"."id" = "enrollments"."training_id") AND "public"."authorize"('enrollment.manage'::"public"."app_permission", "t"."project_id")))));



CREATE POLICY "Users with project.member.manage permission can manage project " ON "public"."projects_profiles" TO "authenticated" USING ("public"."authorize"('project.member.manage'::"public"."app_permission", "project_id")) WITH CHECK ("public"."authorize"('project.member.manage'::"public"."app_permission", "project_id"));



ALTER TABLE "public"."characters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;


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
GRANT USAGE ON SCHEMA "public" TO "supabase_admin";






GRANT ALL ON FUNCTION "public"."ghstore_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."ghstore_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."ghstore_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ghstore_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."ghstore_out"("public"."ghstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."ghstore_out"("public"."ghstore") TO "anon";
GRANT ALL ON FUNCTION "public"."ghstore_out"("public"."ghstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ghstore_out"("public"."ghstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore_out"("public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore_out"("public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore_out"("public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore_out"("public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore_recv"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore_recv"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore_recv"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore_recv"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore_send"("public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore_send"("public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore_send"("public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore_send"("public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore_subscript_handler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore_subscript_handler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore_subscript_handler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore_subscript_handler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore"("text"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore"("text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."hstore"("text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore"("text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore_to_json"("public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore_to_json"("public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore_to_json"("public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore_to_json"("public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore_to_jsonb"("public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore_to_jsonb"("public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore_to_jsonb"("public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore_to_jsonb"("public"."hstore") TO "service_role";



















































































































































































































































GRANT ALL ON FUNCTION "public"."accept_invitation"("invitation_id" bigint, "user_id" "uuid", "p_project_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."accept_invitation"("invitation_id" bigint, "user_id" "uuid", "p_project_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_invitation"("invitation_id" bigint, "user_id" "uuid", "p_project_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."akeys"("public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."akeys"("public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."akeys"("public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."akeys"("public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."authorize"("requested_permission" "public"."app_permission", "project_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."authorize"("requested_permission" "public"."app_permission", "project_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."authorize"("requested_permission" "public"."app_permission", "project_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."avals"("public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."avals"("public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."avals"("public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avals"("public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_practice_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_practice_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_practice_number"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_project"("project_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_project"("project_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_project"("project_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."deep_copy_project"("source_project_id" bigint, "target_project_id" bigint, "target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."deep_copy_project"("source_project_id" bigint, "target_project_id" bigint, "target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."deep_copy_project"("source_project_id" bigint, "target_project_id" bigint, "target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."defined"("public"."hstore", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."defined"("public"."hstore", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."defined"("public"."hstore", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."defined"("public"."hstore", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete"("public"."hstore", "text"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."delete"("public"."hstore", "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."delete"("public"."hstore", "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete"("public"."hstore", "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."delete"("public"."hstore", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."delete"("public"."hstore", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."delete"("public"."hstore", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete"("public"."hstore", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete"("public"."hstore", "public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."delete"("public"."hstore", "public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."delete"("public"."hstore", "public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete"("public"."hstore", "public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."each"("hs" "public"."hstore", OUT "key" "text", OUT "value" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."each"("hs" "public"."hstore", OUT "key" "text", OUT "value" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."each"("hs" "public"."hstore", OUT "key" "text", OUT "value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."each"("hs" "public"."hstore", OUT "key" "text", OUT "value" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."exist"("public"."hstore", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."exist"("public"."hstore", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."exist"("public"."hstore", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."exist"("public"."hstore", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."exists_all"("public"."hstore", "text"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."exists_all"("public"."hstore", "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."exists_all"("public"."hstore", "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."exists_all"("public"."hstore", "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."exists_any"("public"."hstore", "text"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."exists_any"("public"."hstore", "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."exists_any"("public"."hstore", "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."exists_any"("public"."hstore", "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."fetchval"("public"."hstore", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."fetchval"("public"."hstore", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."fetchval"("public"."hstore", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fetchval"("public"."hstore", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_project_member_info"("p_project_id" bigint, "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_project_member_info"("p_project_id" bigint, "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_project_member_info"("p_project_id" bigint, "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_project_members"("p_project_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_project_members"("p_project_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_project_members"("p_project_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_id_by_email"("email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_id_by_email"("email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_id_by_email"("email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_profile"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_profile"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_profile"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."ghstore_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ghstore_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ghstore_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ghstore_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ghstore_consistent"("internal", "public"."hstore", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ghstore_consistent"("internal", "public"."hstore", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ghstore_consistent"("internal", "public"."hstore", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ghstore_consistent"("internal", "public"."hstore", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ghstore_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ghstore_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ghstore_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ghstore_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ghstore_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ghstore_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ghstore_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ghstore_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ghstore_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ghstore_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ghstore_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ghstore_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ghstore_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ghstore_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ghstore_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ghstore_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ghstore_same"("public"."ghstore", "public"."ghstore", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ghstore_same"("public"."ghstore", "public"."ghstore", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ghstore_same"("public"."ghstore", "public"."ghstore", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ghstore_same"("public"."ghstore", "public"."ghstore", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ghstore_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ghstore_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ghstore_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ghstore_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_consistent_hstore"("internal", smallint, "public"."hstore", integer, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_consistent_hstore"("internal", smallint, "public"."hstore", integer, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_consistent_hstore"("internal", smallint, "public"."hstore", integer, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_consistent_hstore"("internal", smallint, "public"."hstore", integer, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_hstore"("public"."hstore", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_hstore"("public"."hstore", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_hstore"("public"."hstore", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_hstore"("public"."hstore", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_hstore_query"("public"."hstore", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_hstore_query"("public"."hstore", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_hstore_query"("public"."hstore", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_hstore_query"("public"."hstore", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hs_concat"("public"."hstore", "public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."hs_concat"("public"."hstore", "public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."hs_concat"("public"."hstore", "public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hs_concat"("public"."hstore", "public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."hs_contained"("public"."hstore", "public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."hs_contained"("public"."hstore", "public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."hs_contained"("public"."hstore", "public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hs_contained"("public"."hstore", "public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."hs_contains"("public"."hstore", "public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."hs_contains"("public"."hstore", "public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."hs_contains"("public"."hstore", "public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hs_contains"("public"."hstore", "public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore"("record") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore"("record") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore"("record") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore"("record") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore"("text"[], "text"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore"("text"[], "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."hstore"("text"[], "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore"("text"[], "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore_cmp"("public"."hstore", "public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore_cmp"("public"."hstore", "public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore_cmp"("public"."hstore", "public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore_cmp"("public"."hstore", "public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore_eq"("public"."hstore", "public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore_eq"("public"."hstore", "public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore_eq"("public"."hstore", "public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore_eq"("public"."hstore", "public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore_ge"("public"."hstore", "public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore_ge"("public"."hstore", "public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore_ge"("public"."hstore", "public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore_ge"("public"."hstore", "public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore_gt"("public"."hstore", "public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore_gt"("public"."hstore", "public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore_gt"("public"."hstore", "public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore_gt"("public"."hstore", "public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore_hash"("public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore_hash"("public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore_hash"("public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore_hash"("public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore_hash_extended"("public"."hstore", bigint) TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore_hash_extended"("public"."hstore", bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."hstore_hash_extended"("public"."hstore", bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore_hash_extended"("public"."hstore", bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore_le"("public"."hstore", "public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore_le"("public"."hstore", "public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore_le"("public"."hstore", "public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore_le"("public"."hstore", "public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore_lt"("public"."hstore", "public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore_lt"("public"."hstore", "public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore_lt"("public"."hstore", "public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore_lt"("public"."hstore", "public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore_ne"("public"."hstore", "public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore_ne"("public"."hstore", "public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore_ne"("public"."hstore", "public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore_ne"("public"."hstore", "public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore_to_array"("public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore_to_array"("public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore_to_array"("public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore_to_array"("public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore_to_json_loose"("public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore_to_json_loose"("public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore_to_json_loose"("public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore_to_json_loose"("public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore_to_jsonb_loose"("public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore_to_jsonb_loose"("public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore_to_jsonb_loose"("public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore_to_jsonb_loose"("public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore_to_matrix"("public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore_to_matrix"("public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore_to_matrix"("public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore_to_matrix"("public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."hstore_version_diag"("public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."hstore_version_diag"("public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."hstore_version_diag"("public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hstore_version_diag"("public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_member_of_project"("project_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."is_member_of_project"("project_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_member_of_project"("project_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_project_owner"("project_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."is_project_owner"("project_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_project_owner"("project_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."isdefined"("public"."hstore", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."isdefined"("public"."hstore", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."isdefined"("public"."hstore", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."isdefined"("public"."hstore", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."isexists"("public"."hstore", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."isexists"("public"."hstore", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."isexists"("public"."hstore", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."isexists"("public"."hstore", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_record"("anyelement", "public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."populate_record"("anyelement", "public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."populate_record"("anyelement", "public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_record"("anyelement", "public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."replace_module_character"("p_module_id" integer, "p_old_character_id" integer, "p_new_character_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."replace_module_character"("p_module_id" integer, "p_old_character_id" integer, "p_new_character_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."replace_module_character"("p_module_id" integer, "p_old_character_id" integer, "p_new_character_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."skeys"("public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."skeys"("public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."skeys"("public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."skeys"("public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."slice"("public"."hstore", "text"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."slice"("public"."hstore", "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."slice"("public"."hstore", "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."slice"("public"."hstore", "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."slice_array"("public"."hstore", "text"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."slice_array"("public"."hstore", "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."slice_array"("public"."hstore", "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."slice_array"("public"."hstore", "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."svals"("public"."hstore") TO "postgres";
GRANT ALL ON FUNCTION "public"."svals"("public"."hstore") TO "anon";
GRANT ALL ON FUNCTION "public"."svals"("public"."hstore") TO "authenticated";
GRANT ALL ON FUNCTION "public"."svals"("public"."hstore") TO "service_role";



GRANT ALL ON FUNCTION "public"."tconvert"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."tconvert"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."tconvert"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."tconvert"("text", "text") TO "service_role";


















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



GRANT ALL ON TABLE "public"."invitations" TO "anon";
GRANT ALL ON TABLE "public"."invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."invitations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."invitations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."invitations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."invitations_id_seq" TO "service_role";



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
GRANT ALL ON TABLE "public"."profiles" TO "supabase_admin";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."projects_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."projects_profiles" TO "anon";
GRANT ALL ON TABLE "public"."projects_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."projects_profiles" TO "service_role";



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






























RESET ALL;
