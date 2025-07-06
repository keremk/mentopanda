import { SupabaseClient } from "@supabase/supabase-js";
import { handleError } from "./utils";

export type InsertModuleCharacterInput = {
  moduleId: number;
  characterId: number;
  ordinal?: number;
  prompt?: string | null;
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
  });
  if (error) handleError(error);
}

export type UpdateModuleCharacterPromptInput = {
  moduleId: number;
  characterId: number;
  prompt: string | null;
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
