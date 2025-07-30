import { SupabaseClient } from "@supabase/supabase-js";
import { handleError } from "./utils";
import { Skills, Traits, createDefaultSkills, createDefaultTraits } from "@/types/character-attributes";

export type InsertModuleCharacterInput = {
  moduleId: number;
  characterId: number;
  ordinal?: number;
  prompt?: string | null;
  skills?: Skills;
  traits?: Traits;
};

export async function insertModuleCharacter(
  supabase: SupabaseClient,
  data: InsertModuleCharacterInput
): Promise<void> {
  const { error } = await supabase.from("modules_characters").insert({
    module_id: data.moduleId,
    character_id: data.characterId,
    ordinal: data.ordinal || 0,
    prompt: data.prompt || null,
    skills: data.skills || createDefaultSkills(),
    traits: data.traits || createDefaultTraits(),
  });
  if (error) handleError(error);
}

export type UpdateModuleCharacterPromptInput = {
  moduleId: number;
  characterId: number;
  prompt: string | null;
};

export type UpdateModuleCharacterAttributesInput = {
  moduleId: number;
  characterId: number;
  skills?: Skills;
  traits?: Traits;
};

export async function updateModuleCharacterPrompt(
  supabase: SupabaseClient,
  data: UpdateModuleCharacterPromptInput
): Promise<void> {
  const { error } = await supabase
    .from("modules_characters")
    .update({
      prompt: data.prompt,
      updated_at: new Date().toISOString(),
    })
    .match({
      module_id: data.moduleId,
      character_id: data.characterId,
    });

  if (error) handleError(error);
}

export async function updateModuleCharacterAttributes(
  supabase: SupabaseClient,
  data: UpdateModuleCharacterAttributesInput
): Promise<void> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.skills !== undefined) {
    updateData.skills = data.skills;
  }

  if (data.traits !== undefined) {
    updateData.traits = data.traits;
  }

  const { error } = await supabase
    .from("modules_characters")
    .update(updateData)
    .match({
      module_id: data.moduleId,
      character_id: data.characterId,
    });

  if (error) handleError(error);
}
