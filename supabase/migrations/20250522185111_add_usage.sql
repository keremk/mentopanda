-- Add usage table for tracking user consumption across different services
create table if not exists "usage" (
  "id" bigserial primary key not null,
  "user_id" uuid not null references profiles (id) on delete cascade,
  "period_start" date not null,
  "images" jsonb default '{}'::jsonb not null,
  "assessment" jsonb default '{}'::jsonb not null,
  "prompt_helper" jsonb default '{}'::jsonb not null,
  "conversation" jsonb default '{}'::jsonb not null,
  "transcription" jsonb default '{}'::jsonb not null,
  "calculated_usage" numeric(10,2) default 0 not null,
  "created_at" timestamp with time zone default current_timestamp not null,
  "updated_at" timestamp with time zone default current_timestamp not null,
  
  -- Ensure one usage record per user per period
  constraint "usage_user_id_period_start_unique" unique ("user_id", "period_start")
);

-- Indexes for efficient querying
create index if not exists "usage_user_id_idx" on "usage" ("user_id");
create index if not exists "usage_period_start_idx" on "usage" ("period_start");
create index if not exists "usage_user_period_idx" on "usage" ("user_id", "period_start");

-- Enable RLS
alter table usage enable row level security;

-- Helper function to get current billing period start for a user
-- Follows industry standard (Stripe-style) billing cycle logic
--
-- Examples:
-- User created May 31st, today is June 15th → returns June 30th (current period)
-- User created May 31st, today is June 25th → returns June 30th (current period) 
-- User created May 31st, today is July 15th → returns July 31st (current period)
-- User created May 15th, today is June 10th → returns May 15th (previous period)
-- User created May 15th, today is June 20th → returns June 15th (current period)
create or replace function get_current_period_start(target_user_id uuid)
returns date
language plpgsql
security definer
as $$
declare
  user_created_at timestamp with time zone;
  target_day integer;
  current_month_start date;
  current_billing_day date;
  prev_month_start date;
  prev_billing_day date;
begin
  -- Get user creation date
  select created_at into user_created_at
  from profiles
  where id = target_user_id;
  
  if user_created_at is null then
    raise exception 'User not found';
  end if;
  
  -- Get the target billing day from user creation
  target_day := extract(day from user_created_at::date)::integer;
  
  -- Get first day of current month
  current_month_start := date_trunc('month', current_date)::date;
  
  -- Calculate current month's billing day (handle month overflow)
  current_billing_day := least(
    current_month_start + (target_day - 1),
    (current_month_start + interval '1 month' - interval '1 day')::date
  );
  
  -- If we haven't reached this month's billing day yet, use previous month
  if current_date < current_billing_day then
    prev_month_start := (current_month_start - interval '1 month')::date;
    prev_billing_day := least(
      prev_month_start + (target_day - 1),
      (prev_month_start + interval '1 month' - interval '1 day')::date
    );
    return prev_billing_day;
  else
    return current_billing_day;
  end if;
end;
$$;

-- Helper function to initialize or get usage record for current period
create or replace function get_or_create_current_usage(target_user_id uuid)
returns bigint
language plpgsql
security definer
as $$
declare
  current_period date;
  usage_id bigint;
begin
  current_period := get_current_period_start(target_user_id);
  
  -- Try to get existing usage record
  select id into usage_id
  from usage
  where user_id = target_user_id and period_start = current_period;
  
  -- Create new record if it doesn't exist
  if usage_id is null then
    insert into usage (user_id, period_start)
    values (target_user_id, current_period)
    returning id into usage_id;
  end if;
  
  return usage_id;
end;
$$;
