"use server";

import { revalidateTag } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getCharacters } from "@/data/characters";
import { getCharacterDetails } from "@/data/characters";
import { updateCharacter, type UpdateCharacterInput } from "@/data/characters";
import { z } from 'zod/v3';
import { createCharacter, type CreateCharacterInput } from "@/data/characters";
import { deleteCharacter } from "@/data/characters";
import { cache } from "react";
import { insertModuleCharacterAction } from "@/app/actions/modules-characters-actions";

export const getCharactersActionCached = cache(async (projectId: number) => {
  const supabase = await createClient();
  return await getCharacters(supabase, projectId);
});

export async function getCharactersAction(projectId: number) {
  const supabase = await createClient();
  return await getCharacters(supabase, projectId);
}

export async function getCharacterDetailsAction(characterId: string) {
  const supabase = await createClient();
  return await getCharacterDetails(supabase, characterId);
}

export async function updateCharacterAction(
  characterId: number,
  data: UpdateCharacterInput
) {
  const supabase = await createClient();
  const result = await updateCharacter(supabase, characterId, data);

  // Revalidate only the affected data
  revalidateTag("characters");
  revalidateTag(`character-${characterId}`);

  return result;
}

const createCharacterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  voice: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export async function createCharacterAction(data: CreateCharacterInput) {
  try {
    // Validate input
    const validated = createCharacterSchema.parse(data);

    const supabase = await createClient();
    const character = await createCharacter(supabase, validated);

    // Revalidate the characters list
    revalidateTag("characters");

    return { success: true, data: character };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid character data" };
    }
    return { success: false, error: "Failed to create character" };
  }
}

export async function deleteCharacterAction(characterId: number) {
  try {
    const supabase = await createClient();
    await deleteCharacter(supabase, characterId);

    // Revalidate the characters list
    revalidateTag("characters");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete character",
    };
  }
}

export async function createAndAddCharacterAction(
  moduleId: number,
  characterData: { name: string; voice: string; avatarUrl: string },
  prompt?: string | null,
) {
  try {
    // Create the character
    const characterResult = await createCharacterAction(characterData);

    if (!characterResult.success || !characterResult.data) {
      return characterResult;
    }

    // Add the character to the module
    const insertResult = await insertModuleCharacterAction({
      moduleId,
      characterId: characterResult.data.id,
      ordinal: 0,
      prompt: prompt,
    });

    if (!insertResult.success) {
      return insertResult;
    }

    return { success: true, data: characterResult.data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create and add character",
    };
  }
}
