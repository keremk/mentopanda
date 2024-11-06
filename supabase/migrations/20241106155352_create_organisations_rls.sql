-- Allow users to view their own organization
create policy "Users can view their own organization"
  on organizations
  for select
  using (
    id in (
      select organization_id 
      from profiles 
      where id = auth.uid()
    )
  );

-- Allow organization admins to insert new organizations
create policy "Organization admins can create organizations"
  on organizations
  for insert
  with check (
    authorize('organization.admin')
  );

-- Allow organization admins to update organizations they belong to, except IDs 1
create policy "Organization admins can update their organizations"
  on organizations
  for update
  using (
    authorize('organization.admin')
    and id in (
      select organization_id 
      from profiles 
      where id = auth.uid()
    )
    and id not in (1)
  )
  with check (
    authorize('organization.admin')
  );

-- Allow organization admins to delete organizations they belong to, except IDs 1 and 2
create policy "Organization admins can delete their organizations"
  on organizations
  for delete
  using (
    authorize('organization.admin')
    and id in (
      select organization_id 
      from profiles 
      where id = auth.uid()
    )
    and id not in (1, 2)
  );
