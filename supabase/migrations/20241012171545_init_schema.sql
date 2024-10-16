do $$ begin create type "public"."app_permission" as enum(
	'training.manage',
	'training.make.public',
	'enrollment.manage',
	'user.admin'
);

exception
when duplicate_object then null;

end $$;

--> statement-breakpoint
do $$ begin create type "public"."user_role" as enum('admin', 'manager', 'member');

exception
when duplicate_object then null;

end $$;

--> statement-breakpoint
create table if not exists "enrollments" (
	"id" serial primary key not null,
	"training_id" integer not null,
	"user_id" uuid not null,
	"created_at" timestamp default now() not null
);

--> statement-breakpoint
create table if not exists "organizations" (
	"id" serial primary key not null,
	"name" text,
	"domain" text not null,
	"created_at" timestamp default now() not null,
	"updated_at" timestamp default now() not null
);

--> statement-breakpoint
create table if not exists "profiles" (
	"id" uuid primary key not null,
	"organization_id" integer,
	"created_at" timestamp default now() not null,
	"updated_at" timestamp default now() not null
);

--> statement-breakpoint
create table if not exists "role_permissions" (
	"role" "user_role" not null,
	"permission" "app_permission" not null,
	"created_at" timestamp default now() not null,
	constraint "role_permissions_role_permission_pk" primary key ("role", "permission")
);

--> statement-breakpoint
create table if not exists "modules" (
	"id" serial primary key not null,
	"training_id" integer not null,
	"title" text not null,
	"description" text,
	"created_at" timestamp default now() not null,
	"updated_at" timestamp default now() not null
);

create table if not exists "activities" (
	"id" serial primary key not null,
	"module_id" integer not null,
	"user_id" uuid not null,
	"started_at" timestamp default now() not null,
	"completed_at" timestamp
);

--> statement-breakpoint
create table if not exists "trainings" (
	"id" serial primary key not null,
	"title" text not null,
	"tagline" text,
	"description" text,
	"image_url" text,
	"preview_url" text,
	"is_public" boolean default true not null,
	"organization_id" integer,
	"created_at" timestamp default now() not null,
	"updated_at" timestamp default now() not null
);

--> statement-breakpoint
create table if not exists "user_roles" (
	"user_id" uuid not null,
	"role" "user_role" not null,
	"created_at" timestamp default now() not null,
	constraint "user_roles_user_id_role_pk" primary key ("user_id", "role")
);

--> statement-breakpoint
do $$ begin
alter table
	"enrollments"
add
	constraint "enrollments_training_id_trainings_id_fk" foreign key ("training_id") references "public"."trainings"("id") on delete no action on update no action;

exception
when duplicate_object then null;

end $$;

--> statement-breakpoint
do $$ begin
alter table
	"enrollments"
add
	constraint "enrollments_user_id_profiles_id_fk" foreign key ("user_id") references "public"."profiles"("id") on delete no action on update no action;

exception
when duplicate_object then null;

end $$;

--> statement-breakpoint
do $$ begin
alter table
	"profiles"
add
	constraint "profiles_id_users_id_fk" foreign key ("id") references "auth"."users"("id") on delete no action on update no action;

exception
when duplicate_object then null;

end $$;

--> statement-breakpoint
do $$ begin
alter table
	"profiles"
add
	constraint "profiles_organization_id_organizations_id_fk" foreign key ("organization_id") references "public"."organizations"("id") on delete no action on update no action;

exception
when duplicate_object then null;

end $$;

--> statement-breakpoint
do $$ begin
alter table
	"modules"
add
	constraint "modules_training_id_trainings_id_fk" foreign key ("training_id") references "public"."trainings"("id") on delete no action on update no action;

exception
when duplicate_object then null;

end $$;

--> statement-breakpoint
do $$ begin
alter table
	"activities"
add
	constraint "activities_module_id_modules_id_fk" foreign key ("module_id") references "public"."modules"("id") on delete no action on update no action;

exception
when duplicate_object then null;

end $$;

--> statement-breakpoint
do $$ begin
alter table
	"activities"
add
	constraint "activities_user_id_profiles_id_fk" foreign key ("user_id") references "public"."profiles"("id") on delete no action on update no action;

exception
when duplicate_object then null;

end $$;

--> statement-breakpoint
do $$ begin
alter table
	"trainings"
add
	constraint "trainings_organization_id_organizations_id_fk" foreign key ("organization_id") references "public"."organizations"("id") on delete no action on update no action;

exception
when duplicate_object then null;

end $$;

--> statement-breakpoint
do $$ begin
alter table
	"user_roles"
add
	constraint "user_roles_user_id_profiles_id_fk" foreign key ("user_id") references "public"."profiles"("id") on delete no action on update no action;

exception
when duplicate_object then null;

end $$;

--> statement-breakpoint
create unique index if not exists "domain_idx" on "organizations" using btree ("domain");

--> statement-breakpoint
alter table trainings enable row level security;

alter table enrollments enable row level security;

alter table organizations enable row level security;

alter table profiles enable row level security;

alter table role_permissions enable row level security;

alter table modules enable row level security;

alter table activities enable row level security;

alter table user_roles enable row level security;
