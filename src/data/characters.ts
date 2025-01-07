import { SupabaseClient } from "@supabase/supabase-js";
import { handleError } from "./utils";
import { getUserId, getOrganizationId } from "./utils";
import { AIModel, AI_MODELS, aiModelSchema } from "@/types/models";

export type Voice = {
  name: string;
  sampleUrl: string | null;
};

export const voices: Record<AIModel, Voice[]> = {
  [AI_MODELS.OPENAI_REALTIME]: [
    { name: "Alloy", sampleUrl: null },
    { name: "Ash", sampleUrl: null },
    { name: "Ballad", sampleUrl: null },
    { name: "Coral", sampleUrl: null },
    { name: "Echo", sampleUrl: null },
    { name: "Sage", sampleUrl: null },
    { name: "Shimmer", sampleUrl: null },
    { name: "Verse", sampleUrl: null },
  ],
  [AI_MODELS.GEMINI_FLASH]: [
    { name: "Aoede", sampleUrl: "/voices/Aoede.wav" },
    { name: "Fenrir", sampleUrl: "/voices/Fenrir.wav" },
    { name: "Kore", sampleUrl: "/voices/Kore.wav" },
    { name: "Charon", sampleUrl: "/voices/Charon.wav" },
    { name: "Puck", sampleUrl: "/voices/Puck.wav" },
  ],
};

export type CharacterSummary = {
  id: number;
  name: string;
  avatarUrl: string | null;
  aiModel: AIModel;
};

export async function getCharacters(
  supabase: SupabaseClient
): Promise<CharacterSummary[]> {
  const { data, error } = await supabase
    .from("characters")
    .select("id, name, avatar_url, ai_model")
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
  organizationId: number;
  isPublic: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
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
      organization_id,
      is_public,
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
    organizationId: data.organization_id,
    isPublic: data.is_public,
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
  isPublic?: boolean;
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
      is_public: data.isPublic,
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
      organization_id,
      is_public,
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
    organizationId: updatedData.organization_id,
    isPublic: updatedData.is_public,
    createdBy: updatedData.created_by,
    createdAt: new Date(updatedData.created_at),
    updatedAt: new Date(updatedData.updated_at),
  };
}

export async function updateCharacterAvatar({
  supabase,
  characterId,
  avatarUrl,
}: {
  supabase: SupabaseClient;
  characterId: number;
  avatarUrl: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from("characters")
    .update({
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", characterId)
    .select("avatar_url")
    .single();

  if (error) handleError(error);
  if (!data) throw new Error("Failed to update character avatar");

  return data.avatar_url;
}

export type CreateCharacterInput = {
  name: string;
};

export async function createCharacter(
  supabase: SupabaseClient,
  data: CreateCharacterInput
): Promise<CharacterDetails> {
  const userId = await getUserId(supabase);
  const organizationId = await getOrganizationId(supabase);

  if (!organizationId)
    throw new Error("User must belong to an organization to create characters");

  const { data: newCharacter, error } = await supabase
    .from("characters")
    .insert({
      name: data.name,
      organization_id: organizationId,
      ai_model: AI_MODELS.OPENAI_REALTIME, // default to gpt-4o-realtime for now
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
      organization_id,
      is_public,
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
    organizationId: newCharacter.organization_id,
    isPublic: newCharacter.is_public,
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
