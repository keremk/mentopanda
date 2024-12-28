import { SupabaseClient } from "@supabase/supabase-js";
import { handleError } from "./utils";

export type AIModel = "gpt-4o-realtime" | "gemini-2.0-flash-exp";
export type Voice = {
  name: string;
  sampleUrl: string | null;
};

export const voices: Record<AIModel, Voice[]> = {
  "gpt-4o-realtime": [
    { name: "Alloy", sampleUrl: null },
    { name: "Ash", sampleUrl: null },
    { name: "Ballad", sampleUrl: null },
    { name: "Coral", sampleUrl: null },
    { name: "Echo", sampleUrl: null },
    { name: "Sage", sampleUrl: null },
    { name: "Shimmer", sampleUrl: null },
    { name: "Verse", sampleUrl: null },
  ],
  "gemini-2.0-flash-exp": [
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
};

export async function getCharacters(
  supabase: SupabaseClient
): Promise<CharacterSummary[]> {
  const { data, error } = await supabase
    .from("characters")
    .select("id, name, avatar_url")
    .order("name");

  if (error) handleError(error);
  if (!data) return [];

  return data.map((character) => ({
    id: character.id,
    name: character.name,
    avatarUrl: character.avatar_url,
  }));
}

export type CharacterDetails = CharacterSummary & {
  voice: string | null;
  aiDescription: string | null;
  aiModel: string | null;
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

  return {
    id: data.id,
    name: data.name,
    voice: data.voice,
    aiDescription: data.ai_description,
    aiModel: data.ai_model,
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
  aiModel?: string | null;
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

  return {
    id: updatedData.id,
    name: updatedData.name,
    voice: updatedData.voice,
    aiDescription: updatedData.ai_description,
    aiModel: updatedData.ai_model,
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
