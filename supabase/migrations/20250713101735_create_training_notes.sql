-- Create training_notes table
create table if not exists "training_notes" (
	"module_id" bigint not null references modules (id) on delete cascade,
	"user_id" uuid not null references profiles (id) on delete cascade,
	"notes" text,
	"draft" text,
	"created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	constraint "training_notes_module_id_user_id_pk" primary key ("module_id", "user_id")
);

-- Create indexes for efficient querying
create index if not exists "training_notes_module_id_idx" on "training_notes" ("module_id");
create index if not exists "training_notes_user_id_idx" on "training_notes" ("user_id");

-- Enable RLS (Row Level Security)
alter table training_notes enable row level security;
