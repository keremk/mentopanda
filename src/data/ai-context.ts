import { handleError } from "./utils";
import { SupabaseClient } from "@supabase/supabase-js";
import { TrainingDetailsContextForAI } from "./trainings";
import { CharacterContextForAI } from "./characters";
import { ModuleContextForAI } from "./modules";

export type TrainingContextData = {
  training: TrainingDetailsContextForAI;
  module: ModuleContextForAI;
  characters: CharacterContextForAI[];
};

type DBTraining = {
  title: string;
  tagline: string | null;
  description: string | null;
  modules: Array<{
    title: string;
    instructions: string | null;
    scenario_prompt: string;
    assessment_prompt: string;
    moderator_prompt: string | null;
    modules_characters: Array<{
      characters: {
        id: number;
        name: string;
        description: string | null;
        ai_description: string | null;
      };
    }>;
  }>;
};

export async function getAIContextDataForTraining(
  supabase: SupabaseClient,
  trainingId: number,
  moduleId?: number
): Promise<TrainingContextData | null> {
  const query = supabase
    .from("trainings")
    .select(
      `
      title,
      tagline,
      description,
      modules!inner (
        title,
        instructions,
        scenario_prompt,
        assessment_prompt,
        moderator_prompt,
        modules_characters!inner (
          characters (
            id, 
            name,
            description,
            ai_description
          )
        )
      )
      `
    )
    .eq("id", trainingId)
  
  if (moduleId) {
    query.eq("modules.id", moduleId);
  }

  const { data: training, error: trainingError } = await query.single();

  if (trainingError) {
    if (trainingError.code === "PGRST116") {
      // Training not found or user doesn't have access
      return null;
    }
    handleError(trainingError);
  }

  if (!training) {
    return null;
  }

  const typedTraining = training as unknown as DBTraining;

  return {
    training: {
      title: typedTraining.title,
      tagline: typedTraining.tagline ?? "",
      description: typedTraining.description ?? "",
    },
    module: {
      title: typedTraining.modules[0].title,
      instructions: typedTraining.modules[0].instructions,
      scenario: typedTraining.modules[0].scenario_prompt,
      assessment: typedTraining.modules[0].assessment_prompt,
      moderator: typedTraining.modules[0].moderator_prompt,
    },
    characters: typedTraining.modules[0].modules_characters.map((mc) => ({
      name: mc.characters.name,
      description: mc.characters.description,
      aiDescription: mc.characters.ai_description,
    })),
  };
}

export async function getAIContextDataForCharacter(
  supabase: SupabaseClient,
  characterId: number
): Promise<CharacterContextForAI | null> {
  const query = supabase
    .from("characters")
    .select(
      `
      name,
      description,
      ai_description
      `
    )
    .eq("id", characterId);

  const { data: character, error: characterError } = await query.single();

  if (characterError) {
    handleError(characterError);
  }

  if (!character) {
    return null;
  }

  return {
    name: character.name,
    description: character.description,
    aiDescription: character.ai_description,
  };
}
