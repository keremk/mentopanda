"use server";

import { revalidateTag } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getCharacters } from "@/data/characters";
import { getCharacterDetails } from "@/data/characters";
import { updateCharacter, type UpdateCharacterInput } from "@/data/characters";
import { z } from "zod";
import { updateCharacterAvatar } from "@/data/characters";

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

const updateAvatarSchema = z.object({
  avatarUrl: z.string().url(),
});

export async function updateCharacterAvatarAction(
  characterId: number,
  data: { avatarUrl: string }
) {
  try {
    // Validate input
    const validated = updateAvatarSchema.parse(data);

    const supabase = createClient();
    const avatarUrl = await updateCharacterAvatar({
      supabase,
      characterId,
      avatarUrl: validated.avatarUrl,
    });

    // Revalidate the character data
    revalidateTag("characters");
    revalidateTag(`character-${characterId}`);

    return { success: true, data: { avatarUrl } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid avatar URL" };
    }
    return { success: false, error: "Failed to update character avatar" };
  }
}
