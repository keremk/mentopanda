import { getOrganizationId, getUserId, handleError } from "./utils";
import { SupabaseClient } from "@supabase/supabase-js";
export interface Training {
  id: number;
  title: string;
  tagline: string;
  description: string;
  imageUrl: string;
  isPublic: boolean;
  organizationId: string | null;
  previewUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getTrainings(
  supabase: SupabaseClient
): Promise<Training[]> {
  const organizationId = await getOrganizationId(supabase);

  let query = supabase.from("trainings").select("*").or("is_public.eq.true");

  // Add organization filter only if organizationId is not null
  if (organizationId !== null) {
    query = query.or(`organization_id.eq.${organizationId}`);
  }

  const { data: userTrainings, error: trainingsError } = await query;

  if (trainingsError) {
    handleError(trainingsError);
  }

  return (
    userTrainings?.map((training) => ({
      id: training.id,
      title: training.title,
      tagline: training.tagline,
      description: training.description,
      imageUrl: training.image_url,
      isPublic: training.is_public,
      organizationId: training.organization_id,
      previewUrl: training.preview_url,
      createdAt: training.created_at,
      updatedAt: training.updated_at,
    })) ?? []
  );
}

export async function getTrainingById(
  supabase: SupabaseClient,
  trainingId: string
): Promise<Training | null> {
  const organizationId = await getOrganizationId(supabase);

  // Query the specific training
  let query = supabase
    .from("trainings")
    .select("*")
    .eq("id", trainingId)
    .or("is_public.eq.true");

  // Add organization filter only if organizationId is not null
  if (organizationId !== null) {
    query = query.or(`organization_id.eq.${organizationId}`);
  }

  const { data: training, error: trainingError } = await query.single();

  if (trainingError) {
    if (trainingError.code === "PGRST116") {
      // Training not found or user doesn't have access
      return null;
    }
    handleError(trainingError);
  }

  return {
    id: training.id,
    title: training.title,
    tagline: training.tagline,
    description: training.description,
    imageUrl: training.image_url,
    isPublic: training.is_public,
    organizationId: training.organization_id,
    previewUrl: training.preview_url,
    createdAt: training.created_at,
    updatedAt: training.updated_at,
  };
}
