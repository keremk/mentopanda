import { SupabaseClient } from "@supabase/supabase-js";
import { handleError } from "./utils";

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

export type ReplaceModuleCharacterInput = {
  moduleId: number;
  oldCharacterId: number;
  newCharacterId: number;
};

export async function replaceModuleCharacter(
  supabase: SupabaseClient,
  data: ReplaceModuleCharacterInput
): Promise<void> {
  console.log(
    "Replacing module id ",
    data.moduleId,
    " character ",
    data.oldCharacterId,
    " with character ",
    data.newCharacterId
  );
  const { error } = await supabase.rpc("replace_module_character", {
    p_module_id: data.moduleId,
    p_old_character_id: data.oldCharacterId,
    p_new_character_id: data.newCharacterId,
  });

  if (error) handleError(error);
}
