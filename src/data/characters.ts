import { SupabaseClient } from "@supabase/supabase-js";
import { handleError } from "./utils";

export type CharacterSummary = {
  id: string;
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
