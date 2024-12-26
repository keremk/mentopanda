import { SupabaseClient } from "@supabase/supabase-js";
import { handleError } from "./utils";

export type CharacterSummary = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export async function getCharacters(
  supabase: SupabaseClient
): Promise<CharacterSummary[]> {
  const { data, error } = await supabase
    .from("characters")
    .select("id, name, avatar_url")
    .order("name");

  if (error) handleError(error);

  if (!data) return [];

  return data.map((character) => ({
    id: character.id,
    name: character.name,
    avatarUrl: character.avatar_url,
  }));
}
