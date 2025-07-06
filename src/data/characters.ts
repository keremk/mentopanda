import { SupabaseClient } from "@supabase/supabase-js";
import { handleError } from "./utils";
import { getCurrentUserInfo } from "./user";
import { AIModel, AI_MODELS, aiModelSchema } from "@/types/models";

export type CharacterSummary = {
  id: number;
  name: string;
  avatarUrl: string | null;
  aiModel: AIModel;
};

export async function getCharacters(
  supabase: SupabaseClient,
  projectId: number
): Promise<CharacterSummary[]> {  
  const { data, error } = await supabase
    .from("characters")
    .select("id, name, avatar_url, ai_model")
    .eq("project_id", projectId)
    .order("name");

  if (error) handleError(error);
  if (!data) return [];

  return data.map((character) => {
    const aiModel = aiModelSchema.parse(character.ai_model) as AIModel;

    return {
      id: character.id,
      name: character.name,
      avatarUrl: character.avatar_url,
      aiModel: aiModel,
    };
  });
}

export type CharacterDetails = CharacterSummary & {
  voice: string | null;
  aiDescription: string | null;
  description: string | null;
  projectId: number;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CharacterContextForAI = {
  name: string;
  aiDescription: string | null;
  description: string | null;
};

export async function getCharacterDetails(
  supabase: SupabaseClient,
  characterId: string
): Promise<CharacterDetails | null> {
  const { data, error } = await supabase
    .from("characters")
    .select(
      `
      id,
      name,
      voice,
      ai_description,
      ai_model,
      description,
      avatar_url,
      project_id,
      created_by,
      created_at,
      updated_at
    `
    )
    .eq("id", characterId)
    .single();

  if (error) handleError(error);

  if (!data) return null;

  const aiModel = aiModelSchema.parse(data.ai_model) as AIModel;

  return {
    id: data.id,
    name: data.name,
    voice: data.voice,
    aiDescription: data.ai_description,
    aiModel: aiModel,
    description: data.description,
    avatarUrl: data.avatar_url,
    projectId: data.project_id,
    createdBy: data.created_by,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export type UpdateCharacterInput = {
  name?: string;
  voice?: string | null;
  aiDescription?: string | null;
  aiModel: AIModel;
  description?: string | null;
  avatarUrl?: string | null;
};

export async function updateCharacter(
  supabase: SupabaseClient,
  characterId: number,
  data: UpdateCharacterInput
): Promise<CharacterDetails> {
  const { data: updatedData, error } = await supabase
    .from("characters")
    .update({
      name: data.name,
      voice: data.voice,
      ai_description: data.aiDescription,
      ai_model: data.aiModel,
      description: data.description,
      avatar_url: data.avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", characterId)
    .select(
      `
      id,
      name,
      voice,
      ai_description,
      ai_model,
      description,
      avatar_url,
      project_id,
      created_by,
      created_at,
      updated_at
    `
    )
    .single();

  if (error) handleError(error);
  if (!updatedData) throw new Error("Failed to update character");

  const aiModel = aiModelSchema.parse(updatedData.ai_model) as AIModel;

  return {
    id: updatedData.id,
    name: updatedData.name,
    voice: updatedData.voice,
    aiDescription: updatedData.ai_description,
    aiModel: aiModel,
    description: updatedData.description,
    avatarUrl: updatedData.avatar_url,
    projectId: updatedData.project_id,
    createdBy: updatedData.created_by,
    createdAt: new Date(updatedData.created_at),
    updatedAt: new Date(updatedData.updated_at),
  };
}

export type CreateCharacterInput = {
  name: string;
  voice?: string;
  avatarUrl?: string;
};

export async function createCharacter(
  supabase: SupabaseClient,
  data: CreateCharacterInput
): Promise<CharacterDetails> {
  const { id: userId, currentProject } = await getCurrentUserInfo(supabase);

  if (!currentProject)
    throw new Error("User must belong to a project to create characters");

  const { data: newCharacter, error } = await supabase
    .from("characters")
    .insert({
      name: data.name,
      voice: data.voice || null,
      avatar_url: data.avatarUrl || null,
      project_id: currentProject.id,
      ai_model: AI_MODELS.OPENAI, // default to OPENAI for now
      created_by: userId,
    })
    .select(
      `
      id,
      name,
      voice,
      ai_description,
      ai_model,
      description,
      avatar_url,
      project_id,
      created_by,
      created_at,
      updated_at
      `
    )
    .single();

  if (error) handleError(error);
  if (!newCharacter) throw new Error("Failed to create character");

  const aiModel = aiModelSchema.parse(newCharacter.ai_model) as AIModel;

  return {
    id: newCharacter.id,
    name: newCharacter.name,
    voice: newCharacter.voice,
    aiDescription: newCharacter.ai_description,
    aiModel: aiModel,
    description: newCharacter.description,
    avatarUrl: newCharacter.avatar_url,
    projectId: newCharacter.project_id,
    createdBy: newCharacter.created_by,
    createdAt: new Date(newCharacter.created_at),
    updatedAt: new Date(newCharacter.updated_at),
  };
}

export async function deleteCharacter(
  supabase: SupabaseClient,
  characterId: number
): Promise<void> {
  const { error } = await supabase
    .from("characters")
    .delete()
    .eq("id", characterId);

  if (error) handleError(error);
}

export type ModuleCharacterInput = {
  moduleId: number;
  characterId: number;
  ordinal: number;
  prompt?: string | null;
};

export async function addCharacterToModule(
  supabase: SupabaseClient,
  data: ModuleCharacterInput
): Promise<void> {
  const { error } = await supabase.from("modules_characters").insert({
    module_id: data.moduleId,
    character_id: data.characterId,
    ordinal: data.ordinal,
    prompt: data.prompt,
    updated_at: new Date().toISOString(),
  });

  if (error) handleError(error);
}

export type RemoveCharacterFromModuleInput = {
  moduleId: number;
  characterId: number;
};

export async function removeCharacterFromModule(
  supabase: SupabaseClient,
  data: RemoveCharacterFromModuleInput
): Promise<void> {
  const { error } = await supabase.from("modules_characters").delete().match({
    module_id: data.moduleId,
    character_id: data.characterId,
  });

  if (error) handleError(error);
}
