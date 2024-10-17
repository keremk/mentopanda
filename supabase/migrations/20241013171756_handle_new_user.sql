-- inserts a row into public.profiles
create function public.handle_new_user () returns trigger language plpgsql security definer
set
  search_path = '' as $$
begin
  insert into public.profiles (id)
  values (new.id);

  -- Assign 'member' role to the new user
  insert into public.user_roles (user_id, role)
  values (new.id, 'member');

  return new;
end;
$$;

-- trigger the function every time a user is created
create trigger on_auth_user_created
after insert on auth.users for each row
execute procedure public.handle_new_user ();
