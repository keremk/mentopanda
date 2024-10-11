-- Enable Row Level Security on all tables
alter table trainings enable row level security;
alter table enrollments enable row level security;
alter table sessions enable row level security;
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table role_permissions enable row level security;

-- Trainings policies
create policy "Public trainings are viewable by everyone"
on trainings for select
using (is_public = true);

create policy "Private trainings are viewable by organization members"
on trainings for select
to authenticated
using (
  not is_public and
  exists (
    select 1 from profiles
    where profiles.organization_id = trainings.organization_id
    and profiles.id = auth.uid()
  )
);

create policy "Public trainings are insertable by users with training.create.public permission"
on trainings for insert
to authenticated
with check (is_public and authorize('training.create.public'));

create policy "Private trainings are insertable by users with training.create.private permission"
on trainings for insert
to authenticated
with check (
  not is_public and
  authorize('training.create.private') and
  exists (
    select 1 from profiles
    where profiles.organization_id = trainings.organization_id
    and profiles.id = auth.uid()
  )
);

create policy "Public trainings are updatable by users with training.update.public permission"
on trainings for update
to authenticated
using (is_public and authorize('training.update.public'));

create policy "Private trainings are updatable by users with training.update.private permission"
on trainings for update
to authenticated
using (
  not is_public and
  authorize('training.update.private') and
  exists (
    select 1 from profiles
    where profiles.organization_id = trainings.organization_id
    and profiles.id = auth.uid()
  )
);

create policy "Public trainings are deletable by users with training.delete.public permission"
on trainings for delete
to authenticated
using (is_public and authorize('training.delete.public'));

create policy "Private trainings are deletable by users with training.delete.private permission"
on trainings for delete
to authenticated
using (
  not is_public and
  authorize('training.delete.private') and
  exists (
    select 1 from profiles
    where profiles.organization_id = trainings.organization_id
    and profiles.id = auth.uid()
  )
);

-- Enrollments policies
create policy "Members can view their own enrollments"
on enrollments for select
to authenticated
using (
  auth.uid() = user_id
  or
  (authorize('enrollment.manage') and 
   exists (
     select 1 from profiles p1
     join profiles p2 on p1.organization_id = p2.organization_id
     where p1.id = auth.uid() and p2.id = enrollments.user_id
   ))
);

create policy "Members can enroll themselves"
on enrollments for insert
to authenticated
with check (
  auth.uid() = user_id
  or
  (authorize('enrollment.manage') and 
   exists (
     select 1 from profiles p1
     join profiles p2 on p1.organization_id = p2.organization_id
     where p1.id = auth.uid() and p2.id = enrollments.user_id
   ))
);

create policy "Members can remove their own enrollments"
on enrollments for delete
to authenticated
using (
  auth.uid() = user_id
  or
  (authorize('enrollment.manage') and 
   exists (
     select 1 from profiles p1
     join profiles p2 on p1.organization_id = p2.organization_id
     where p1.id = auth.uid() and p2.id = enrollments.user_id
   ))
);

-- Sessions policies
create policy "Members can view their own sessions"
on sessions for select
to authenticated
using (
  auth.uid() = user_id
  or
  (authorize('session.manage') and 
   exists (
     select 1 from profiles p1
     join profiles p2 on p1.organization_id = p2.organization_id
     where p1.id = auth.uid() and p2.id = sessions.user_id
   ))
);

create policy "Members can create their own sessions"
on sessions for insert
to authenticated
with check (
  auth.uid() = user_id
  or
  (authorize('session.manage') and 
   exists (
     select 1 from profiles p1
     join profiles p2 on p1.organization_id = p2.organization_id
     where p1.id = auth.uid() and p2.id = sessions.user_id
   ))
);

create policy "Members can remove their own sessions"
on sessions for delete
to authenticated
using (
  auth.uid() = user_id
  or
  (authorize('session.manage') and 
   exists (
     select 1 from profiles p1
     join profiles p2 on p1.organization_id = p2.organization_id
     where p1.id = auth.uid() and p2.id = sessions.user_id
   ))
);

-- Organizations policies
create policy "Organizations are viewable by members"
on organizations for select
to authenticated
using (
  exists (
    select 1 from profiles
    where profiles.organization_id = organizations.id
    and profiles.id = auth.uid()
  )
);

-- Profiles policies
create policy "Users can view their own profile"
on profiles for select
to authenticated
using (id = auth.uid());

create policy "Users can update their own profile"
on profiles for update
to authenticated
using (id = auth.uid());