import { ModuleSummary } from "./modules";
import { getOrganizationId, getUserId, handleError } from "./utils";
import { SupabaseClient } from "@supabase/supabase-js";

export type Training = {
  id: number;
  title: string;
  tagline: string;
  description: string;
  imageUrl: string;
  isPublic: boolean;
  createdBy: string | null;
  organizationId: string | null;
  previewUrl: string | null;
  createdAt: string;
  updatedAt: string;
  modules: ModuleSummary[];
};

export type TrainingSummary = {
  id: number;
  enrollmentId: number | null;
  title: string;
  tagline: string;
  imageUrl: string;
  createdAt: string;
};

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
};

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
};

export type TrainingWithEnrollment = Training & {
  isEnrolled: boolean;
};

type DbModule = {
  id: number;
  training_id: number;
  title: string;
  instructions: string | null;
  prompt: string | null;
  video_url: string | null;
  audio_url: string | null;
  history: DbHistory[] | null;
};

type DbHistory = {
  assessment_score: number | null;
  completed_at: string | null;
};

type DbTraining = {
  id: number;
  title: string;
  tagline: string;
  description: string;
  image_url: string;
  preview_url: string | null;
  is_public: boolean;
  organization_id: number | null;
  modules: DbModule[];
};

export async function getTrainingById(
  supabase: SupabaseClient,
  trainingId: number
): Promise<Training | null> {
  const organizationId = await getOrganizationId(supabase);

  // Query the specific training
  let query = supabase
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
    isPublic: training.is_public,
    createdBy: training.created_by,
    organizationId: training.organization_id,
    previewUrl: training.preview_url,
    createdAt: training.created_at,
    updatedAt: training.updated_at,
    modules: training.modules,
  };
}

export async function getEnrolledTrainings(
  supabase: SupabaseClient
): Promise<TrainingSummary[]> {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from("enrollments")
    .select(
      `
      id,
      trainings (id, title, tagline, image_url),
      created_at
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) handleError(error);

  if (!data) return [];

  /* 
    Why am I using "any" type?
    It's clear now that there's a mismatch between what TypeScript infers from the Supabase client and what's actually returned at runtime. 
Given that trainings is indeed an object and not an array at runtime, we'll need to update our type definitions and the way we handle the data.
  */

  return data.map((enrollment: any) => ({
    id: enrollment.trainings?.id,
    enrollmentId: enrollment.id,
    title: enrollment.trainings?.title ?? "",
    tagline: enrollment.trainings?.tagline ?? "",
    imageUrl: enrollment.trainings?.image_url ?? "",
    createdAt: enrollment.created_at,
  }));
}

export async function getTrainingWithProgress(
  supabase: SupabaseClient,
  trainingId?: string
): Promise<TrainingWithProgress[]> {
  const userId = await getUserId(supabase);

  let query = supabase
    .from("trainings")
    .select(
      `
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
    `
    )
    .eq("enrollments.user_id", userId);

  // Add training filter if specified
  if (trainingId) {
    query = query.eq("id", trainingId);
  }

  const { data: trainings, error } = await query;

  if (error) handleError(error);

  return (
    (trainings as DbTraining[])?.map((training) => ({
      id: training.id,
      title: training.title,
      tagline: training.tagline,
      description: training.description,
      imageUrl: training.image_url,
      previewUrl: training.preview_url,
      isPublic: training.is_public,
      organizationId: training.organization_id,
      modules: training.modules.map((module: DbModule) => {
        const history =
          module.history?.filter((h) => h.completed_at !== null) || [];
        const lastAttempt = history[history.length - 1];

        return {
          id: module.id,
          title: module.title,
          instructions: module.instructions,
          prompt: module.prompt,
          videoUrl: module.video_url,
          audioUrl: module.audio_url,
          completed: history.some((h) => (h.assessment_score ?? 0) >= 70), // Handle null assessment_score
          attempts: history.length,
          lastScore: lastAttempt?.assessment_score || null,
        };
      }),
    })) || []
  );
}

export async function getTrainingsWithEnrollment(
  supabase: SupabaseClient
): Promise<TrainingWithEnrollment[]> {
  const userId = await getUserId(supabase);
  const organizationId = await getOrganizationId(supabase);

  let query = supabase
    .from("trainings")
    .select(
      `
      *,
      enrollments!left (
        user_id
      )
    `
    )
    .or("is_public.eq.true");

  if (organizationId && organizationId !== 1) {
    query = query.or(`organization_id.eq.${organizationId}`);
  }

  const { data: trainings, error } = await query;

  if (error) handleError(error);

  return (
    trainings?.map((training) => ({
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
      isEnrolled:
        training.enrollments?.some(
          (e: { user_id: string }) => e.user_id === userId
        ) ?? false,
    })) ?? []
  );
}

export type UpdateTrainingInput = {
  id: number;
  title: string;
  tagline: string;
  description: string;
  imageUrl: string;
  previewUrl: string | null;
  isPublic: boolean;
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

  console.log(training.tagline);

  // Check user's organization and training's organization
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", await getUserId(supabase))
    .single();

  const { data: trainingData } = await supabase
    .from("trainings")
    .select("organization_id")
    .eq("id", training.id)
    .single();

  console.log("Debug info:", {
    userOrgId: userProfile?.organization_id,
    trainingOrgId: trainingData?.organization_id,
  });

  // Check if user has training.manage permission
  const { data: permissions } = await supabase
    .from("role_permissions")
    .select("permission")
    .eq(
      "role",
      (
        await supabase.auth.getUser()
      ).data.user?.user_metadata?.user_role
    )
    .eq("permission", "training.manage");

  console.log("Permission check:", {
    userRole: (await supabase.auth.getUser()).data.user?.user_metadata
      ?.user_role,
    hasTrainingManage: permissions && permissions.length > 0,
  });

  // Test authorize function directly
  const { data: hasPermission, error: authorizeError } = await supabase.rpc(
    "authorize",
    {
      requested_permission: "training.manage",
    }
  );

  console.log("Authorize check:", {
    hasPermission,
    authorizeError,
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  console.log("JWT payload:", {
    jwt: session?.access_token,
    decodedJWT: session && JSON.parse(atob(session.access_token.split(".")[1])),
  });

  // Now perform the update
  const { data, error, statusText } = await supabase
    .from("trainings")
    .update({
      title: training.title,
      tagline: training.tagline,
      description: training.description,
      image_url: training.imageUrl,
      preview_url: training.previewUrl,
      is_public: training.isPublic,
      updated_at: new Date().toISOString(),
    })
    .eq("id", training.id)
    .select();

  console.log(data);
  console.log(statusText);
  console.log(error);

  if (error) handleError(error);
  if (!data || data.length === 0) throw new Error("Failed to update training");

  return {
    id: data[0].id,
    title: data[0].title,
    tagline: data[0].tagline,
    description: data[0].description,
    imageUrl: data[0].image_url,
    isPublic: data[0].is_public,
    organizationId: data[0].organization_id,
    previewUrl: data[0].preview_url,
    createdAt: data[0].created_at,
    updatedAt: data[0].updated_at,
  };
}
