"use server";

import { revalidateTag } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getCharacters } from "@/data/characters";
import { getCharacterDetails } from "@/data/characters";
import { updateCharacter, type UpdateCharacterInput } from "@/data/characters";
import { z } from "zod";
import { updateCharacterAvatar } from "@/data/characters";
import { createCharacter, type CreateCharacterInput } from "@/data/characters";
import { deleteCharacter } from "@/data/characters";
import {
  addCharacterToModule,
  type ModuleCharacterInput,
} from "@/data/characters";
import {
  removeCharacterFromModule,
  type RemoveCharacterFromModuleInput,
} from "@/data/characters";

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

const createCharacterSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export async function createCharacterAction(data: CreateCharacterInput) {
  try {
    // Validate input
    const validated = createCharacterSchema.parse(data);

    const supabase = createClient();
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
    const supabase = createClient();
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

const addCharacterToModuleSchema = z.object({
  moduleId: z.number(),
  characterId: z.number(),
  ordinal: z.number(),
  prompt: z.string().nullable().optional(),
});

export async function addCharacterToModuleAction(data: ModuleCharacterInput) {
  try {
    // Validate input
    const validated = addCharacterToModuleSchema.parse(data);

    const supabase = createClient();
    await addCharacterToModule(supabase, validated);

    // Revalidate the module data
    revalidateTag(`module-${data.moduleId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid input data" };
    }
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to add character to module",
    };
  }
}

const removeCharacterFromModuleSchema = z.object({
  moduleId: z.number(),
  characterId: z.number(),
});

export async function removeCharacterFromModuleAction(
  data: RemoveCharacterFromModuleInput
) {
  try {
    // Validate input
    const validated = removeCharacterFromModuleSchema.parse(data);

    const supabase = createClient();
    await removeCharacterFromModule(supabase, validated);

    // Revalidate the module data
    revalidateTag(`module-${data.moduleId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid input data" };
    }
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to remove character from module",
    };
  }
}
