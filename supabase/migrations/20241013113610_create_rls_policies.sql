-- Training policies
create policy "Anyone can view public trainings"
on trainings for select
to authenticated
using (is_public = true);

create policy "Organization members can view private trainings"
on trainings for select
to authenticated
using (
  exists (
    select 1
    from profiles
    where profiles.id = auth.uid()
    and profiles.organization_id = trainings.organization_id
  )
);

create policy "Users can view enrolled trainings"
on trainings for select
to authenticated
using (
  exists (
    select 1
    from enrollments
    where enrollments.training_id = trainings.id
    and enrollments.user_id = auth.uid()
  )
);

create policy "Trainings are manageable by users with training.manage permission"
on trainings for all
to authenticated
using (
  authorize('training.manage')
  and exists (
    select 1
    from profiles
    where profiles.id = auth.uid()
    and profiles.organization_id = trainings.organization_id
  )
);

-- Module policies
create policy "Anyone can view modules of public trainings"
on modules for select
to authenticated
using (
  exists (
    select 1
    from trainings
    where trainings.id = modules.training_id
    and trainings.is_public = true
  )
);

create policy "Organization members can view modules of private trainings"
on modules for select
to authenticated
using (
  exists (
    select 1
    from trainings
    join profiles on profiles.organization_id = trainings.organization_id
    where trainings.id = modules.training_id
    and profiles.id = auth.uid()
  )
);

create policy "Users can view modules of enrolled trainings"
on modules for select
to authenticated
using (
  exists (
    select 1
    from enrollments
    where enrollments.training_id = modules.training_id
    and enrollments.user_id = auth.uid()
  )
);

create policy "Modules are manageable by users with training.manage permission"
on modules for all
to authenticated
using (
  authorize('training.manage')
  and exists (
    select 1
    from trainings
    join profiles on profiles.organization_id = trainings.organization_id
    where trainings.id = modules.training_id
    and profiles.id = auth.uid()
  )
);

-- Profile policies
create policy "Users can view their own profile"
on profiles for select
to authenticated
using (id = auth.uid());

-- Allow users to view profiles in their organization
-- create policy "Users can view profiles in same organization"
-- on profiles for select
-- to authenticated
-- using (
--   organization_id = (
--     select organization_id 
--     from profiles 
--     where id = auth.uid()
--   )
-- );

create policy "Users can update their own non-role fields"
on profiles for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid() 
  and user_role = (select user_role from profiles where id = auth.uid())
);

create policy "Admins can update any profile in their organization"
on profiles for update
to authenticated
using (
  exists (
    select 1 
    from profiles admin_profile
    where admin_profile.id = auth.uid()
    and admin_profile.user_role = 'admin'
    and admin_profile.organization_id = profiles.organization_id
  )
);

-- Enrollment policies
create policy "Users can view their own enrollments"
on enrollments for select
to authenticated
using (user_id = auth.uid());

create policy "Users can enroll themselves in trainings"
on enrollments for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from trainings
    where trainings.id = enrollments.training_id
    and (
      trainings.is_public = true
      or exists (
        select 1
        from profiles
        where profiles.id = auth.uid()
        and profiles.organization_id = trainings.organization_id
      )
    )
  )
);

create policy "Users can remove their own enrollments"
on enrollments for delete
to authenticated
using (user_id = auth.uid());

-- Rest of your existing policies for enrollments, organizations, role_permissions, and history...
