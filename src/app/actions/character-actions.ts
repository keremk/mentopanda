"use server";

import { revalidateTag } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getCharacters } from "@/data/characters";
import { getCharacterDetails } from "@/data/characters";
import { updateCharacter, type UpdateCharacterInput } from "@/data/characters";

export async function getCharactersAction() {
  const supabase = createClient();
  return await getCharacters(supabase);
}

export async function getCharacterDetailsAction(characterId: string) {
  const supabase = createClient();
  return await getCharacterDetails(supabase, characterId);
}

export async function updateCharacterAction(
  characterId: number,
  data: UpdateCharacterInput
) {
  const supabase = createClient();
  const result = await updateCharacter(supabase, characterId, data);

  // Revalidate only the affected data
  revalidateTag("characters");
  revalidateTag(`character-${characterId}`);

  return result;
}
