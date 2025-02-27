-- Types
create type "public"."app_permission" as enum(
	'training.manage',
	'enrollment.manage',
	'project.manage',
	'project.member.manage',
	'training.history',
	'basic.access'
);

create type "public"."user_role" as enum('admin', 'manager', 'member', 'super_admin');

create type "public"."pricing_plan" as enum('free', 'pro', 'team', 'enterprise');

-- Tables
create table if not exists "projects" (
	"id" bigserial primary key not null,
	"name" text,
	"is_public" boolean default false not null,
	"created_by" uuid default auth.uid(),
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

create table if not exists "profiles" (
	"id" uuid primary key not null references auth.users (id) on delete cascade on update cascade,
	"current_project_id" bigint DEFAULT 1,
	"pricing_plan" "pricing_plan" default 'free' not null,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "profiles"
ADD CONSTRAINT "profiles_current_project_id_fkey" FOREIGN KEY ("current_project_id") REFERENCES "projects" ("id") ON DELETE
SET DEFAULT;

ALTER TABLE "projects"
ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles" ("id") ON DELETE
SET NULL;

create table if not exists "projects_profiles" (
	"project_id" bigint references projects (id) on delete cascade,
	"profile_id" uuid references profiles (id) on delete cascade,
	"role" "user_role" not null,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	constraint "projects_profiles_project_id_profile_id_pk" primary key ("project_id", "profile_id")
);

create table if not exists "role_permissions" (
	"role" "user_role" not null,
	"permission" "app_permission" not null,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	constraint "role_permissions_role_permission_pk" primary key ("role", "permission")
);

create table if not exists "trainings" (
	"id" bigserial primary key not null,
	"title" text not null,
	"tagline" text,
	"description" text,
	"image_url" text,
	"preview_url" text,
	"created_by" uuid default auth.uid() references profiles (id) on delete
	set null,
		"project_id" bigint not null references projects (id) on delete cascade,
		"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

create table if not exists "modules" (
	"id" bigserial primary key not null,
	"training_id" bigint not null references trainings (id) on delete cascade,
	"title" text not null,
	"instructions" text,
	"ordinal" integer not null default 0,
	"ai_model" text,
	"scenario_prompt" text,
	"assessment_prompt" text,
	"moderator_prompt" text,
	"video_url" text,
	"audio_url" text,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

create table if not exists "characters" (
	"id" bigserial primary key not null,
	"name" text not null,
	"voice" text,
	"ai_description" text,
	"ai_model" text,
	"description" text,
	"avatar_url" text,
	"project_id" bigint not null references projects (id) on delete cascade,
	"created_by" uuid default auth.uid() references profiles (id) on delete
	set null,
		"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

create table if not exists "modules_characters" (
	"module_id" bigint not null references modules (id) on delete cascade,
	"character_id" bigint not null references characters (id) on delete cascade,
	"ordinal" integer not null default 0,
	"prompt" text,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	constraint "modules_characters_module_id_character_id_pk" primary key ("module_id", "character_id")
);

-- https://x.com/dshukertjr/status/1851231477671079952 Sensible default for user_id
create table if not exists "enrollments" (
	"id" bigserial primary key not null,
	"training_id" bigint not null references trainings (id) on delete cascade,
	"user_id" uuid default auth.uid() not null references profiles (id) on delete cascade,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

create table if not exists "history" (
	"id" bigserial primary key not null,
	"module_id" bigint references modules (id) on delete
	set null,
		"user_id" uuid default auth.uid() not null references profiles (id) on delete cascade,
		"transcript_text" text,
		"transcript_json" jsonb,
		"recording_url" text,
		"assessment_created" boolean default false not null,
		"assessment_text" text,
		"practice_no" integer default 1 not null,
		"started_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		"completed_at" TIMESTAMP WITH TIME ZONE,
		CONSTRAINT unique_practice UNIQUE(user_id, module_id, practice_no)
);

-- Indexes
-- Enrollments (composite index for looking up user's enrollments)
create index if not exists "enrollments_user_id_created_at_idx" on "enrollments" ("user_id", "created_at");

create index if not exists "enrollments_training_id_idx" on "enrollments" ("training_id");

-- Modules
create index if not exists "modules_training_id_idx" on "modules" ("training_id");

-- History
create index if not exists "history_user_id_idx" on "history" ("user_id");

-- Row Level Security
alter table trainings enable row level security;

alter table enrollments enable row level security;

alter table projects enable row level security;

alter table projects_profiles enable row level security;

alter table profiles enable row level security;

alter table role_permissions enable row level security;

alter table modules enable row level security;

alter table history enable row level security;

alter table characters enable row level security;

alter table modules_characters enable row level security;