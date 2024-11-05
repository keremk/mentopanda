-- Simplify handle_new_user to only insert id
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id)
  values (new.id);
  
  return new;
end;
$$;

-- trigger remains the same
create trigger on_auth_user_created
after insert on auth.users for each row
execute procedure public.handle_new_user();
