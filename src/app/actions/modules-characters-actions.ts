"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidateTag } from "next/cache";
import {
  updateModuleCharacterPrompt,
  type UpdateModuleCharacterPromptInput,
  insertModuleCharacter,
  type InsertModuleCharacterInput,
  updateModuleCharacterAttributes,
  type UpdateModuleCharacterAttributesInput,
} from "@/data/modules-characters";

export async function insertModuleCharacterAction(
  data: InsertModuleCharacterInput
) {
  try {
    const supabase = await createClient();
    await insertModuleCharacter(supabase, data);

    // Revalidate the module data
    revalidateTag(`module-${data.moduleId}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to insert character",
    };
  }
}

export async function updateModuleCharacterPromptAction(
  data: UpdateModuleCharacterPromptInput
) {
  try {
    const supabase = await createClient();
    await updateModuleCharacterPrompt(supabase, data);

    // Revalidate the module data
    revalidateTag(`module-${data.moduleId}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update prompt",
    };
  }
}

export async function updateModuleCharacterAttributesAction(
  data: UpdateModuleCharacterAttributesInput
) {
  try {
    const supabase = await createClient();
    await updateModuleCharacterAttributes(supabase, data);

    // Revalidate the module data
    revalidateTag(`module-${data.moduleId}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update character attributes",
    };
  }
}
