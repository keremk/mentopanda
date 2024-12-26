"use server";

import { createClient } from "@/utils/supabase/server";
import { getCharacters } from "@/data/characters";

export async function getCharactersAction() {
  const supabase = createClient();
  return await getCharacters(supabase);
}
