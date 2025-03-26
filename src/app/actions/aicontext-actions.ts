"use server";

import { getAIContextDataForCharacter, getAIContextDataForTraining } from "@/data/ai-context";
import { CharacterContextForAI } from "@/data/characters";
import { createClient } from "@/utils/supabase/server";

export async function getAIContextDataForTrainingAction(trainingId: number, moduleId: number) {
  const supabase = await createClient();
  return await getAIContextDataForTraining(supabase, trainingId, moduleId);
}

export async function getAIContextDataForCharacterAction(characterId: number) : Promise<CharacterContextForAI | null> {
  const supabase = await createClient();
  return await getAIContextDataForCharacter(supabase, characterId);
}
