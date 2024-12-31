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
