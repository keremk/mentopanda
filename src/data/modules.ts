import { handleError } from "./utils";
import { SupabaseClient } from "@supabase/supabase-js";

export type Character = {
  name: string;
  prompt: string;
};

export type ModulePrompt = {
  scenario: string;
  assessment: string;
  moderator: string | null;
  characters: Character[];
};

export type Module = {
  id: number;
  trainingId: number;
  title: string;
  instructions: string | null;
  ordinal: number;
  modulePrompt: ModulePrompt;
  videoUrl: string | null;
  audioUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ModuleSummary = {
  id: number;
  title: string;
  trainingId: number;
  createdAt: string;
  updatedAt: string;
};

export async function getModuleById(
  supabase: SupabaseClient,
  moduleId: string
): Promise<Module | null> {
  const { data: module, error } = await supabase
    .from("modules")
    .select("*")
    .eq("id", moduleId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    handleError(error);
  }

  if (!module) return null;

  const characters: Character[] = convertFieldsToCharacters(module);

  const modulePrompt: ModulePrompt = {
    scenario: module.scenario_prompt,
    assessment: module.assessment_prompt,
    moderator: module.moderator_prompt,
    characters: characters,
  };

  return {
    id: module.id,
    trainingId: module.training_id,
    title: module.title,
    instructions: module.instructions,
    ordinal: module.ordinal,
    modulePrompt: modulePrompt,
    videoUrl: module.video_url,
    audioUrl: module.audio_url,
    createdAt: module.created_at,
    updatedAt: module.updated_at,
  };
}

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
      createdAt: module.created_at,
      updatedAt: module.updated_at,
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
  videoUrl: string | null;
  audioUrl: string | null;
};

export async function updateModule(
  supabase: SupabaseClient,
  module: UpdateModuleInput
): Promise<Module> {
  const characterFields = convertCharactersToFields(module.modulePrompt.characters);

  const { data, error } = await supabase
    .from("modules")
    .update({
      title: module.title,
      instructions: module.instructions,
      scenario_prompt: module.modulePrompt.scenario,
      assessment_prompt: module.modulePrompt.assessment,
      moderator_prompt: module.modulePrompt.moderator,
      ...characterFields,
      video_url: module.videoUrl,
      audio_url: module.audioUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", module.id)
    .select();

  if (error) handleError(error);
  if (!data || data.length === 0) throw new Error("Module not found");

  const modulePrompt: ModulePrompt = {
    scenario: data[0].scenario_prompt,
    assessment: data[0].assessment_prompt,
    moderator: data[0].moderator_prompt,
    characters: convertFieldsToCharacters(data[0]),
  };

  return {
    id: data[0].id,
    title: data[0].title,
    trainingId: data[0].training_id,
    instructions: data[0].instructions,
    ordinal: data[0].ordinal,
    modulePrompt: modulePrompt,
    videoUrl: data[0].video_url,
    audioUrl: data[0].audio_url,
    createdAt: data[0].created_at,
    updatedAt: data[0].updated_at,
  };
}

export async function createModule(
  supabase: SupabaseClient,
  trainingId: number,
  module: Omit<UpdateModuleInput, "id" | "trainingId">
): Promise<Module> {
  const characterFields = convertCharactersToFields(module.modulePrompt.characters);

  const { data, error } = await supabase
    .from("modules")
    .insert({
      training_id: trainingId,
      title: module.title,
      instructions: module.instructions,
      scenario_prompt: module.modulePrompt.scenario,
      assessment_prompt: module.modulePrompt.assessment,
      moderator_prompt: module.modulePrompt.moderator,
      ...characterFields,
      video_url: module.videoUrl,
      audio_url: module.audioUrl,
    })
    .select()
    .single();

  if (error) handleError(error);
  if (!data) throw new Error("Failed to create module");

   const modulePrompt: ModulePrompt = {
     scenario: data.scenario_prompt,
     assessment: data.assessment_prompt,
     moderator: data.moderator_prompt,
     characters: convertFieldsToCharacters(data),
   };
  
  return {
    id: data.id,
    trainingId: data.training_id,
    title: data.title,
    instructions: data.instructions,
    ordinal: data.ordinal,
    modulePrompt: modulePrompt,
    videoUrl: data.video_url,
    audioUrl: data.audio_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
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

export function convertCharactersToFields(characters: Character[]) {
  return Array.from({ length: 3 }, (_, i) => i + 1).reduce(
    (acc, i) => ({
      ...acc,
      [`character_name${i}`]: characters[i - 1]?.name ?? null,
      [`character_prompt${i}`]: characters[i - 1]?.prompt ?? null,
    }),
    {} as Record<string, string | null>
  );
}

export function convertFieldsToCharacters(
  fields: Record<string, any>
): Character[] {
  return Array.from({ length: 3 }, (_, i) => i + 1)
    .map((i) => ({
      name: fields[`character_name${i}`] as string,
      prompt: fields[`character_prompt${i}`] as string,
    }))
    .filter((char) => char.name && char.prompt);
}
