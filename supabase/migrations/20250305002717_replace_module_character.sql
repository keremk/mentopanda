-- Create function to replace a character in a module
create or replace function replace_module_character(
  p_module_id int,
  p_old_character_id int,
  p_new_character_id int
)
returns void
language plpgsql
security definer
as $$
declare
  v_existing_ordinal int;
  v_existing_prompt text;
begin
  -- If trying to replace with the same character, do nothing
  if p_old_character_id = p_new_character_id then
    return;
  end if;

  -- Get the existing row's data (if it exists)
  select ordinal, prompt
  into v_existing_ordinal, v_existing_prompt
  from modules_characters
  where module_id = p_module_id and character_id = p_old_character_id;

  -- If the old character exists
  if found then
    -- Delete the old character
    delete from modules_characters
    where module_id = p_module_id and character_id = p_old_character_id;

    -- Insert or update the new character, preserving ordinal and prompt
    insert into modules_characters (module_id, character_id, ordinal, prompt, created_at, updated_at)
    values (
      p_module_id,
      p_new_character_id,
      coalesce(v_existing_ordinal, 0),
      v_existing_prompt,
      now(),
      now()
    )
    on conflict (module_id, character_id) 
    do update set
      ordinal = excluded.ordinal,
      prompt = excluded.prompt,
      updated_at = now();
  else
    -- If old character doesn't exist, just insert the new one
    insert into modules_characters (module_id, character_id, created_at, updated_at)
    values (p_module_id, p_new_character_id, now(), now())
    on conflict (module_id, character_id) do nothing;
  end if;
end;
$$;
