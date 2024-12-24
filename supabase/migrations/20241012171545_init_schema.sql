-- Types
create type "public"."app_permission" as enum(
	'training.manage',
	'training.make.public',
	'enrollment.manage',
	'user.select',
	'user.admin',
	'organization.admin'
);

create type "public"."user_role" as enum('admin', 'manager', 'member', 'super_admin');

-- Tables
create table if not exists "organizations" (
	"id" bigserial primary key not null,
	"name" text,
	"domain" text not null,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

create table if not exists "profiles" (
	"id" uuid primary key not null references auth.users (id) on delete cascade on update cascade,
	"organization_id" bigint references organizations (id) on delete
	set default default 1 not null,
		"user_role" "user_role" default 'member' not null,
		"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
	"created_by" uuid references profiles (id) on delete
	set null,
		"is_public" boolean default true not null,
		"organization_id" bigint references organizations (id) on delete cascade,
		"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

create table if not exists "modules" (
	"id" bigserial primary key not null,
	"training_id" bigint not null references trainings (id) on delete cascade,
	"title" text not null,
	"instructions" text,
	"ordinal" integer not null default 0,
	"scenario_prompt" text,
	"assessment_prompt" text,
	"character_name1" text,
	"character_voice1" text,
	"character_prompt1" text,
	"character_name2" text,
	"character_voice2" text,
	"character_prompt2" text,
	"character_name3" text,
	"character_voice3" text,
	"character_prompt3" text,
	"moderator_prompt" text,
	"video_url" text,
	"audio_url" text,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

create table if not exists "characters" (
	"id" bigserial primary key not null,
	"name" text not null,
	"ai_description" text not null,
	"prompt" text,
	"avatar_url" text,
	"organization_id" bigint references organizations (id) on delete cascade,
	"is_public" boolean default true not null,
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
		"transcript" text,
		"recording_url" text,
		"assessment_created" boolean default false not null,
		"assessment_text" text,
		"practice_no" integer default 1 not null,
		"assessment_score" integer,
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

-- Organizations
create unique index if not exists "domain_idx" on "organizations" using btree ("domain");

-- Profiles
create index if not exists "profiles_organization_id_idx" on "profiles" ("organization_id");

-- Row Level Security
alter table trainings enable row level security;

alter table enrollments enable row level security;

alter table organizations enable row level security;

alter table profiles enable row level security;

alter table role_permissions enable row level security;

alter table modules enable row level security;

alter table history enable row level security;

alter table characters enable row level security;

alter table modules_characters enable row level security;