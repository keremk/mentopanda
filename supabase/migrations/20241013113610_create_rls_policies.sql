-- Trainings policies
create policy "Public trainings are viewable by everyone" on trainings for
select
  using (is_public = true);

create policy "Private trainings are viewable by organization members" on trainings for
select
  to authenticated using (
    not is_public
    and exists (
      select
        1
      from
        profiles
      where
        profiles.organization_id = trainings.organization_id
        and profiles.id = auth.uid ()
    )
  );

create policy "Trainings are insertable by users with training.manage permission" on trainings for insert to authenticated
with
  check (
    authorize ('training.manage')
    and exists (
      select
        1
      from
        profiles
      where
        profiles.organization_id = trainings.organization_id
        and profiles.id = auth.uid ()
    )
  );

create policy "Trainings are updatable by users with training.manage permission" on trainings
for update
  to authenticated using (
    authorize ('training.manage')
    and exists (
      select
        1
      from
        profiles
      where
        profiles.organization_id = trainings.organization_id
        and profiles.id = auth.uid ()
    )
  );

create policy "Trainings are deletable by users with training.manage permission" on trainings for delete to authenticated using (
  authorize ('training.manage')
  and exists (
    select
      1
    from
      profiles
    where
      profiles.organization_id = trainings.organization_id
      and profiles.id = auth.uid ()
  )
);

create policy "Public trainings can be made private by users with training.manage permission" on trainings
for update
  to authenticated using (
    is_public
    and authorize ('training.manage')
  )
with
  check (not is_public);

create policy "Private trainings can be made public by users with training.make.public permission" on trainings
for update
  to authenticated using (
    not is_public
    and authorize ('training.make.public')
  )
with
  check (is_public);

-- Modules policies
create policy "Public modules are viewable by everyone" on modules for
select
  using (
    exists (
      select
        1
      from
        trainings
      where
        trainings.id = modules.training_id
        and trainings.is_public = true
    )
  );

create policy "Private modules are viewable by organization members" on modules for
select
  to authenticated using (
    exists (
      select
        1
      from
        trainings
        join profiles on profiles.organization_id = trainings.organization_id
      where
        trainings.id = modules.training_id
        and profiles.id = auth.uid ()
        and not trainings.is_public
    )
  );

create policy "Modules are manageable by users with training.manage permission" on modules for all to authenticated using (
  authorize ('training.manage')
  and exists (
    select
      1
    from
      trainings
      join profiles on profiles.organization_id = trainings.organization_id
    where
      trainings.id = modules.training_id
      and profiles.id = auth.uid ()
  )
);

-- Enrollments policies
create policy "Members can view their own enrollments" on enrollments for
select
  to authenticated using (
    auth.uid () = user_id
    or (
      authorize ('enrollment.manage')
      and exists (
        select
          1
        from
          profiles p1
          join profiles p2 on p1.organization_id = p2.organization_id
        where
          p1.id = auth.uid ()
          and p2.id = enrollments.user_id
      )
    )
  );

create policy "Members can enroll themselves" on enrollments for insert to authenticated
with
  check (
    auth.uid () = user_id
    or (
      authorize ('enrollment.manage')
      and exists (
        select
          1
        from
          profiles p1
          join profiles p2 on p1.organization_id = p2.organization_id
        where
          p1.id = auth.uid ()
          and p2.id = enrollments.user_id
      )
    )
  );

create policy "Members can remove their own enrollments" on enrollments for delete to authenticated using (
  auth.uid () = user_id
  or (
    authorize ('enrollment.manage')
    and exists (
      select
        1
      from
        profiles p1
        join profiles p2 on p1.organization_id = p2.organization_id
      where
        p1.id = auth.uid ()
        and p2.id = enrollments.user_id
    )
  )
);

-- Organizations policies
create policy "Organizations are viewable by members" on organizations for
select
  to authenticated using (
    exists (
      select
        1
      from
        profiles
      where
        profiles.organization_id = organizations.id
        and profiles.id = auth.uid ()
    )
  );

-- Profiles policies
create policy "Users can view their own profile" on profiles for
select
  to authenticated using (id = auth.uid ());

create policy "Users can update their own profile" on profiles
for update
  to authenticated using (id = auth.uid ());

-- User Roles policies
create policy "Users can view user roles within their organization" on user_roles for
select
  to authenticated using (
    exists (
      select
        1
      from
        profiles p1
        join profiles p2 on p1.organization_id = p2.organization_id
      where
        p1.id = auth.uid ()
        and p2.id = user_roles.user_id
    )
  );

create policy "Users with user.admin permission can manage user roles within their organization" on user_roles for all to authenticated using (
  authorize ('user.admin')
  or current_role = 'supabase_admin'
  and exists (
    select
      1
    from
      profiles p1
      join profiles p2 on p1.organization_id = p2.organization_id
    where
      p1.id = auth.uid ()
      and p2.id = user_roles.user_id
  )
);

-- Role Permissions policies
create policy "Role permissions are viewable by authenticated users" on role_permissions for
select
  to authenticated using (true);

-- Explicitly deny insert, update, and delete operations
create policy "Prevent insert on role_permissions" on role_permissions for insert
with
  check (false);

create policy "Prevent update on role_permissions" on role_permissions
for update
  using (false);

create policy "Prevent delete on role_permissions" on role_permissions for delete using (false);

-- Allow insertion of initial 'member' role
create policy "Allow insertion of initial member role" on user_roles for insert to authenticated
with
  check (role = 'member'::user_role);