import { getOrganizationId, getUserId, handleError } from "./utils";
import { SupabaseClient } from "@supabase/supabase-js";

export type Training = {
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

export type Module = {
  id: number;
  title: string;
  instructions: string | null;
  prompt: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
}

export type ModuleProgress = {
  id: number;
  title: string;
  instructions: string | null;
  prompt: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  completed: boolean;
  attempts: number;
  lastScore: number | null;
}

export type TrainingWithProgress = {
  id: number;
  title: string;
  tagline: string;
  description: string;
  imageUrl: string;
  previewUrl: string | null;
  isPublic: boolean;
  organizationId: number | null;
  modules: ModuleProgress[];
}

export type TrainingWithEnrollment = Training & {
  isEnrolled: boolean;
};

type DbModule = {
  id: number
  training_id: number
  title: string
  instructions: string | null
  prompt: string | null
  video_url: string | null
  audio_url: string | null
  history: DbHistory[] | null
}

type DbHistory = {
  assessment_score: number | null
  completed_at: string | null
}

type DbTraining = {
  id: number
  title: string
  tagline: string
  description: string
  image_url: string
  preview_url: string | null
  is_public: boolean
  organization_id: number | null
  modules: DbModule[]
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

export async function getTrainingWithProgress(
  supabase: SupabaseClient,
  trainingId?: string
): Promise<TrainingWithProgress[]> {
  const userId = await getUserId(supabase)

  let query = supabase
    .from('trainings')
    .select(`
      *,
      modules (
        *,
        history (
          assessment_score,
          completed_at
        )
      ),
      enrollments!inner (
        user_id
      )
    `)
    .eq('enrollments.user_id', userId)

  // Add training filter if specified
  if (trainingId) {
    query = query.eq('id', trainingId)
  }

  const { data: trainings, error } = await query

  if (error) handleError(error)

  return (trainings as DbTraining[])?.map(training => ({
    id: training.id,
    title: training.title,
    tagline: training.tagline,
    description: training.description,
    imageUrl: training.image_url,
    previewUrl: training.preview_url,
    isPublic: training.is_public,
    organizationId: training.organization_id,
    modules: training.modules.map((module: DbModule) => {
      const history = module.history?.filter(h => h.completed_at !== null) || []
      const lastAttempt = history[history.length - 1]
      
      return {
        id: module.id,
        title: module.title,
        instructions: module.instructions,
        prompt: module.prompt,
        videoUrl: module.video_url,
        audioUrl: module.audio_url,
        completed: history.some(h => (h.assessment_score ?? 0) >= 70), // Handle null assessment_score
        attempts: history.length,
        lastScore: lastAttempt?.assessment_score || null
      }
    })
  })) || []
}

export async function getTrainingsWithEnrollment(
  supabase: SupabaseClient
): Promise<TrainingWithEnrollment[]> {
  const userId = await getUserId(supabase);
  const organizationId = await getOrganizationId(supabase);

  let query = supabase
    .from('trainings')
    .select(`
      *,
      enrollments!left (
        user_id
      )
    `)
    .or('is_public.eq.true');

  if (organizationId !== null) {
    query = query.or(`organization_id.eq.${organizationId}`);
  }

  const { data: trainings, error } = await query;

  if (error) handleError(error);

  return trainings?.map(training => ({
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
    isEnrolled: training.enrollments?.some(e => e.user_id === userId) ?? false
  })) ?? [];
}
