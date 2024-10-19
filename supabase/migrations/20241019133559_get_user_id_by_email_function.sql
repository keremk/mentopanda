create
or replace function get_user_id_by_email (email text) returns table (id uuid) security definer as $$
BEGIN
  RETURN QUERY SELECT au.id FROM auth.users au WHERE au.email = $1;
END;
$$ language plpgsql;