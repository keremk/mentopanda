-- Create invitations table
create table if not exists "invitations" (
    "id" bigserial primary key not null,
    "project_id" bigint not null references projects (id) on delete cascade,
    "inviter_id" uuid not null references profiles (id) on delete cascade,
    "invitee_email" text not null,
    "inviter_display_name" text not null,
    "inviter_email" text not null,
    "role" "user_role" not null,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
-- Index for looking up invitations by project
create index if not exists "invitations_project_id_idx" on "invitations" ("project_id");
-- Index for looking up invitations by invitee email
create index if not exists "invitations_invitee_email_idx" on "invitations" ("invitee_email");
-- Composite index for project + invitee email to prevent duplicate invitations
create unique index if not exists "invitations_project_invitee_unique_idx" 
on "invitations" ("project_id", "invitee_email");

-- Enable RLS
alter table invitations enable row level security;

-- Add comment to table
comment on table "invitations" is 'Stores project invitation records';
