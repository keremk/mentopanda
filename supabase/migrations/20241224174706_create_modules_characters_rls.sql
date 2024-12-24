-- Create policies for modules_characters table
create policy "Users with training.manage can manage modules_characters" on modules_characters for all to authenticated using (
    exists (
        select 1
        from profiles p
            inner join role_permissions rp on p.user_role = rp.role
        where p.id = auth.uid()
            and rp.permission = 'training.manage'
    )
) with check (
    exists (
        select 1
        from profiles p
            inner join role_permissions rp on p.user_role = rp.role
        where p.id = auth.uid()
            and rp.permission = 'training.manage'
    )
);

-- Anyone can view associations for public trainings
create policy "Anyone can view public training module-character associations" on modules_characters for
select using (
        exists (
            select 1
            from modules m
                join trainings t on m.training_id = t.id
            where m.id = modules_characters.module_id
                and t.is_public = true
        )
    );

-- Authenticated users can view private training associations from their org
create policy "Organization members can view their private training module-character associations" on modules_characters for
select to authenticated using (
        exists (
            select 1
            from modules m
                join trainings t on m.training_id = t.id
                join profiles p on p.id = auth.uid()
                and p.organization_id = t.organization_id
            where m.id = modules_characters.module_id
                and t.is_public = false
        )
    );