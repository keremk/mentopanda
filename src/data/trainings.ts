import { ModuleProgress, ModuleSummary } from "./modules";
import { handleError } from "./utils";
import { SupabaseClient } from "@supabase/supabase-js";
import { hasPermission, getCurrentUserInfo, getUserId } from "./user";

export type TrainingSummary = {
  id: number;
  title: string;
  tagline: string;
  imageUrl: string;
  projectId: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Training = TrainingSummary & {
  description: string;
  createdBy: string | null;
  previewUrl: string | null;
  modules: ModuleSummary[];
};

export type TrainingWithProgress = TrainingSummary & {
  description: string;
  previewUrl: string | null;
  modules: ModuleProgress[];
};

export type TrainingWithEnrollment = TrainingSummary & {
  isEnrolled: boolean;
};

export async function getTrainingById(
  supabase: SupabaseClient,
  trainingId: number
): Promise<Training | null> {
  const query = supabase
    .from("trainings")
    .select(
      `
      *,
      modules (
        title,
        id,
        created_at,
        updated_at
      )
      `
    )
    .eq("id", trainingId);

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
    createdBy: training.created_by,
    projectId: training.project_id,
    previewUrl: training.preview_url,
    createdAt: new Date(training.created_at),
    updatedAt: new Date(training.updated_at),
    modules: training.modules,
  };
}

export async function getTrainingWithProgress(
  supabase: SupabaseClient,
  trainingId: number
): Promise<TrainingWithProgress> {
  const userId = await getUserId(supabase);

  const query = supabase
    .from("trainings")
    .select(
      `
      *,
      modules (
        *,
        history (
          id,
          practice_no,
          started_at,
          completed_at
        )
      ),
      enrollments!inner (
        user_id
      )
    `
    )
    .eq("enrollments.user_id", userId)
    .eq("id", trainingId)
    .single();

  const { data: training, error } = await query;

  if (error) handleError(error);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  return {
    id: training.id,
    title: training.title,
    tagline: training.tagline,
    description: training.description,
    imageUrl: training.image_url,
    previewUrl: training.preview_url,
    projectId: training.project_id,
    createdAt: new Date(training.created_at),
    updatedAt: new Date(training.updated_at),
    modules: training.modules.map((module: any) => {
      const history =
        module.history?.filter((h: any) => h.completed_at !== null) || [];

      return {
        id: module.id,
        title: module.title,
        practiceCount: history.length,
        history: history.map((h: any) => ({
          id: h.id,
          practiceNumber: h.practice_no,
          startedAt: h.started_at,
          completedAt: h.completed_at,
        })),
      };
    }),
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export async function getTrainingsWithEnrollment(
  supabase: SupabaseClient
): Promise<TrainingWithEnrollment[]> {
  const { id: userId, currentProject } = await getCurrentUserInfo(supabase);

  const query = supabase
    .from("trainings")
    .select(
      `
      id,
      title,
      tagline,
      image_url,
      project_id,
      created_at,
      updated_at,
      enrollments!left (
        id,
        user_id
      )
    `
    )
    .eq("project_id", currentProject.id);

  const { data: trainings, error } = await query;

  if (error) handleError(error);

  return (
    trainings?.map((training) => ({
      id: training.id,
      title: training.title,
      tagline: training.tagline,
      imageUrl: training.image_url,
      projectId: training.project_id,
      createdAt: new Date(training.created_at),
      updatedAt: new Date(training.updated_at),
      isEnrolled:
        training.enrollments?.some(
          (e: { user_id: string }) => e.user_id === userId
        ) ?? false,
    })) ?? []
  );
}

export type BaseTrainingInput = {
  title: string;
  tagline: string;
  description: string;
  imageUrl: string;
  previewUrl: string | null;
};

export type UpdateTrainingInput = BaseTrainingInput & {
  id: number;
};

export async function updateTraining(
  supabase: SupabaseClient,
  training: UpdateTrainingInput
): Promise<Training> {
  // First verify the user has access to this training
  const { data: existingTraining, error: verifyError } = await supabase
    .from("trainings")
    .select("*")
    .eq("id", training.id)
    .single();

  if (verifyError) handleError(verifyError);
  if (!existingTraining) throw new Error("Training not found");

  // Check if user has training.manage permission
  const canManageTraining = await hasPermission({
    supabase,
    permission: "training.manage",
  });

  if (!canManageTraining) {
    throw new Error("You don't have permission to manage trainings");
  }

  // Now perform the update
  const { data, error } = await supabase
    .from("trainings")
    .update({
      title: training.title,
      tagline: training.tagline,
      description: training.description,
      image_url: training.imageUrl,
      preview_url: training.previewUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", training.id)
    .select();

  if (error) handleError(error);
  if (!data || data.length === 0) throw new Error("Failed to update training");

  return {
    id: data[0].id,
    title: data[0].title,
    tagline: data[0].tagline,
    description: data[0].description,
    imageUrl: data[0].image_url,
    projectId: data[0].project_id,
    previewUrl: data[0].preview_url,
    createdAt: new Date(data[0].created_at),
    updatedAt: new Date(data[0].updated_at),
    createdBy: data[0].created_by,
    modules: data[0].modules,
  };
}

export async function createTraining(
  supabase: SupabaseClient,
  training: BaseTrainingInput
): Promise<Training> {
  const { id: userId, currentProject } = await getCurrentUserInfo(supabase);

  const { data, error } = await supabase
    .from("trainings")
    .insert({
      title: training.title,
      tagline: training.tagline,
      description: training.description,
      image_url: training.imageUrl,
      preview_url: training.previewUrl,
      created_by: userId,
      project_id: currentProject.id,
    })
    .select()
    .single();

  if (error) handleError(error);
  if (!data) throw new Error("Failed to create training");

  return {
    id: data.id,
    title: data.title,
    tagline: data.tagline,
    description: data.description,
    imageUrl: data.image_url,
    projectId: data.project_id,
    previewUrl: data.preview_url,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    createdBy: data.created_by,
    modules: [],
  };
}

export async function deleteTraining(
  supabase: SupabaseClient,
  trainingId: number
): Promise<void> {
  // First verify the user has access to this training
  const userId = await getUserId(supabase);
  const { data: training } = await supabase
    .from("trainings")
    .select("created_by")
    .eq("id", trainingId)
    .single();

  if (!training || training.created_by !== userId) {
    throw new Error("You can only delete your own trainings");
  }

  const { error } = await supabase
    .from("trainings")
    .delete()
    .eq("id", trainingId);

  if (error) handleError(error);
}
