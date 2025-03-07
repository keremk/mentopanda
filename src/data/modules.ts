import { HistorySummary } from "./history";
import { handleError } from "./utils";
import { SupabaseClient } from "@supabase/supabase-js";
import { CharacterDetails } from "./characters";
import { AIModel, AI_MODELS, aiModelSchema } from "@/types/models";

export type ModuleCharacter = CharacterDetails & {
  prompt: string;
  ordinal: number;
};

export type ModulePrompt = {
  aiModel: AIModel;
  scenario: string;
  assessment: string;
  moderator: string | null;
  characters: ModuleCharacter[];
};

export type ModuleSummary = {
  id: number;
  title: string;
  trainingId: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Module = ModuleSummary & {
  instructions: string | null;
  ordinal: number;
  modulePrompt: ModulePrompt;
};

export type ModuleProgress = ModuleSummary & {
  instructions: string | null;
  characters: ModuleCharacter[];
  practiceCount: number;
  history: HistorySummary[];
};

// Add this new function to get modules for a training
export async function getModulesByTrainingId(
  supabase: SupabaseClient,
  trainingId: string
): Promise<ModuleSummary[]> {
  const { data, error } = await supabase
    .from("modules")
    .select("id, title, training_id, ordinal, created_at, updated_at")
    .eq("training_id", trainingId)
    .order("ordinal");

  if (error) handleError(error);

  return (
    data?.map((module) => ({
      id: module.id,
      title: module.title,
      trainingId: module.training_id,
      ordinal: module.ordinal,
      createdAt: new Date(module.created_at),
      updatedAt: new Date(module.updated_at),
    })) ?? []
  );
}

export type UpdateModuleInput = {
  id: number;
  trainingId: number;
  title: string;
  instructions: string | null;
  ordinal: number;
  modulePrompt: ModulePrompt;
};

export async function updateModule(
  supabase: SupabaseClient,
  module: UpdateModuleInput
): Promise<Module> {
  const aiModel = aiModelSchema.parse(
    module.modulePrompt.aiModel || AI_MODELS.OPENAI
  ) as AIModel;

  const { data, error } = await supabase
    .from("modules")
    .update({
      title: module.title,
      instructions: module.instructions,
      ai_model: aiModel,
      scenario_prompt: module.modulePrompt.scenario,
      assessment_prompt: module.modulePrompt.assessment,
      moderator_prompt: module.modulePrompt.moderator,
      updated_at: new Date().toISOString(),
    })
    .eq("id", module.id)
    .select();

  if (error) handleError(error);
  if (!data || data.length === 0) throw new Error("Module not found");

  const newAiModel = aiModelSchema.parse(data[0].ai_model) as AIModel;

  const modulePrompt: ModulePrompt = {
    aiModel: newAiModel,
    scenario: data[0].scenario_prompt,
    assessment: data[0].assessment_prompt,
    moderator: data[0].moderator_prompt,
    characters: [],
  };

  return {
    id: data[0].id,
    title: data[0].title,
    trainingId: data[0].training_id,
    instructions: data[0].instructions,
    ordinal: data[0].ordinal,
    modulePrompt: modulePrompt,
    createdAt: new Date(data[0].created_at),
    updatedAt: new Date(data[0].updated_at),
  };
}

export async function createModule(
  supabase: SupabaseClient,
  trainingId: number,
  module: Omit<UpdateModuleInput, "id" | "trainingId">
): Promise<Module> {
  const aiModel = aiModelSchema.parse(
    module.modulePrompt.aiModel || AI_MODELS.OPENAI
  ) as AIModel;

  const { data, error } = await supabase
    .from("modules")
    .insert({
      training_id: trainingId,
      title: module.title,
      instructions: module.instructions,
      ai_model: aiModel,
      scenario_prompt: module.modulePrompt.scenario,
      assessment_prompt: module.modulePrompt.assessment,
      moderator_prompt: module.modulePrompt.moderator,
    })
    .select()
    .single();

  if (error) handleError(error);
  if (!data) throw new Error("Failed to create module");

  const newAiModel = aiModelSchema.parse(data.ai_model) as AIModel;

  const modulePrompt: ModulePrompt = {
    aiModel: newAiModel,
    scenario: data.scenario_prompt,
    assessment: data.assessment_prompt,
    moderator: data.moderator_prompt,
    characters: [],
  };

  return {
    id: data.id,
    trainingId: data.training_id,
    title: data.title,
    instructions: data.instructions,
    ordinal: data.ordinal,
    modulePrompt: modulePrompt,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function deleteModule(
  supabase: SupabaseClient,
  moduleId: number,
  trainingId: number
): Promise<void> {
  const { error } = await supabase
    .from("modules")
    .delete()
    .eq("id", moduleId)
    .eq("training_id", trainingId);

  if (error) handleError(error);
}

export async function getModuleById2(
  supabase: SupabaseClient,
  moduleId: number
): Promise<Module | null> {
  const { data: module, error } = await supabase
    .from("modules")
    .select(
      `
      *,
      modules_characters (
        ordinal,
        prompt,
        characters (
          id,
          name,
          voice,
          ai_description,
          ai_model,
          description,
          avatar_url
        )
      )
    `
    )
    .eq("id", moduleId)
    .single();

  if (error) {
    console.error("Error getting module by id", error);
    if (error.code === "PGRST116") return null;
    handleError(error);
  }

  if (!module) return null;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const characters: ModuleCharacter[] = (module.modules_characters || [])
    .map((mc: any) => ({
      id: mc.characters.id,
      name: mc.characters.name,
      voice: mc.characters.voice,
      aiDescription: mc.characters.ai_description,
      aiModel: aiModelSchema.parse(mc.characters.ai_model) as AIModel,
      description: mc.characters.description,
      avatarUrl: mc.characters.avatar_url,
      prompt: mc.prompt,
      ordinal: mc.ordinal,
    }))
    .sort((a: ModuleCharacter, b: ModuleCharacter) => a.ordinal - b.ordinal);
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const aiModel = aiModelSchema.parse(module.ai_model) as AIModel;

  const modulePrompt: ModulePrompt = {
    aiModel: aiModel,
    scenario: module.scenario_prompt,
    assessment: module.assessment_prompt,
    moderator: module.moderator_prompt,
    characters: characters,
  };

  return {
    id: module.id,
    title: module.title,
    trainingId: module.training_id,
    instructions: module.instructions,
    ordinal: module.ordinal,
    modulePrompt: modulePrompt,
    createdAt: new Date(module.created_at),
    updatedAt: new Date(module.updated_at),
  };
}
