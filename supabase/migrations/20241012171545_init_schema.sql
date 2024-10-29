-- Types
create type "public"."app_permission" as enum(
	'training.manage',
	'training.make.public',
	'enrollment.manage',
	'user.admin'
);

create type "public"."user_role" as enum('admin', 'manager', 'member');

-- Tables
create table if not exists "organizations" (
	"id" serial primary key not null,
	"name" text,
	"domain" text not null,
	"created_at" timestamp default now() not null,
	"updated_at" timestamp default now() not null
);

create table if not exists "profiles" (
	"id" uuid primary key not null references auth.users (id) on delete cascade on update cascade,
	"organization_id" integer references organizations (id) on delete set null,
	"created_at" timestamp default now() not null,
	"updated_at" timestamp default now() not null
);

create table if not exists "role_permissions" (
	"role" "user_role" not null,
	"permission" "app_permission" not null,
	"created_at" timestamp default now() not null,
	constraint "role_permissions_role_permission_pk" primary key ("role", "permission")
);

create table if not exists "trainings" (
	"id" serial primary key not null,
	"title" text not null,
	"tagline" text,
	"description" text,
	"image_url" text,
	"preview_url" text,
	"is_public" boolean default true not null,
	"organization_id" integer references organizations (id) on delete cascade,
	"created_at" timestamp default now() not null,
	"updated_at" timestamp default now() not null
);

create table if not exists "modules" (
	"id" serial primary key not null,
	"training_id" integer not null references trainings (id) on delete cascade,
	"title" text not null,
	"instructions" text,
	"prompt" text,
	"video_url" text,
	"audio_url" text,
	"created_at" timestamp default now() not null,
	"updated_at" timestamp default now() not null
);

-- https://x.com/dshukertjr/status/1851231477671079952 Sensible default for user_id
create table if not exists "enrollments" (
	"id" serial primary key not null,
	"training_id" integer not null references trainings (id) on delete cascade,
	"user_id" uuid default auth.uid() not null references profiles (id) on delete cascade,
	"created_at" timestamp default now() not null
);

create table if not exists "history" (
	"id" serial primary key not null,
	"module_id" integer references modules (id) on delete set null,
	"user_id" uuid default auth.uid() not null references profiles (id) on delete cascade,
	"assessment_text" text,
	"assessment_score" integer,
	"started_at" timestamp default now() not null,
	"completed_at" timestamp
);

-- In this case user_roles will be managed by the admin, so the above default is not sensible
create table if not exists "user_roles" (
	"user_id" uuid not null references profiles (id) on delete cascade on update cascade,
	"role" "user_role" not null,
	"created_at" timestamp default now() not null,
	primary key ("user_id", "role")
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

alter table user_roles enable row level security;
