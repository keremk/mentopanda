import { HistorySummary } from "./history";
import { handleError } from "./utils";
import { SupabaseClient } from "@supabase/supabase-js";

export type Character = {
  name: string;
  prompt: string;
  voice: string;
};

export type ModulePrompt = {
  scenario: string;
  assessment: string;
  moderator: string | null;
  characters: Character[];
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
  practiceCount: number;
  lastScore: number | null;
  history: HistorySummary[];
};

export type ModuleCharacter = {
  id: number;
  name: string;
  voice: string | null;
  aiDescription: string | null;
  aiModel: string | null;
  description: string | null;
  avatarUrl: string | null;
  prompt: string | null;
  ordinal: number;
};

export type Module2 = Omit<ModuleSummary, "trainingId"> & {
  trainingId: number;
  instructions: string | null;
  ordinal: number;
  scenarioPrompt: string | null;
  assessmentPrompt: string | null;
  moderatorPrompt: string | null;
  characters: ModuleCharacter[];
};

export async function getModuleById(
  supabase: SupabaseClient,
  moduleId: number
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
    createdAt: new Date(module.created_at),
    updatedAt: new Date(module.updated_at),
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
  const characterFields = convertCharactersToFields(
    module.modulePrompt.characters
  );

  const { data, error } = await supabase
    .from("modules")
    .update({
      title: module.title,
      instructions: module.instructions,
      scenario_prompt: module.modulePrompt.scenario,
      assessment_prompt: module.modulePrompt.assessment,
      moderator_prompt: module.modulePrompt.moderator,
      ...characterFields,
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
    createdAt: new Date(data[0].created_at),
    updatedAt: new Date(data[0].updated_at),
  };
}

export async function createModule(
  supabase: SupabaseClient,
  trainingId: number,
  module: Omit<UpdateModuleInput, "id" | "trainingId">
): Promise<Module> {
  const characterFields = convertCharactersToFields(
    module.modulePrompt.characters
  );

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

export function convertCharactersToFields(characters: Character[]) {
  return Array.from({ length: 3 }, (_, i) => i + 1).reduce(
    (acc, i) => ({
      ...acc,
      [`character_name${i}`]: characters[i - 1]?.name ?? null,
      [`character_voice${i}`]: characters[i - 1]?.voice ?? null,
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
      voice: fields[`character_voice${i}`] as string,
      prompt: fields[`character_prompt${i}`] as string,
    }))
    .filter((char) => char.name && char.prompt);
}

export async function getModuleById2(
  supabase: SupabaseClient,
  moduleId: number
): Promise<Module2 | null> {
  const { data: module, error } = await supabase
    .from("modules")
    .select(
      `
      *,
      modules_characters!inner (
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
    if (error.code === "PGRST116") return null;
    handleError(error);
  }

  if (!module) return null;

  const characters: ModuleCharacter[] = module.modules_characters
    .map((mc: any) => ({
      id: mc.characters.id,
      name: mc.characters.name,
      voice: mc.characters.voice,
      aiDescription: mc.characters.ai_description,
      aiModel: mc.characters.ai_model,
      description: mc.characters.description,
      avatarUrl: mc.characters.avatar_url,
      prompt: mc.prompt,
      ordinal: mc.ordinal,
    }))
    .sort((a: ModuleCharacter, b: ModuleCharacter) => a.ordinal - b.ordinal);

  return {
    id: module.id,
    title: module.title,
    trainingId: module.training_id,
    instructions: module.instructions,
    ordinal: module.ordinal,
    scenarioPrompt: module.scenario_prompt,
    assessmentPrompt: module.assessment_prompt,
    moderatorPrompt: module.moderator_prompt,
    characters,
    createdAt: new Date(module.created_at),
    updatedAt: new Date(module.updated_at),
  };
}
