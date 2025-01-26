import { ModuleProgress, ModuleSummary } from "./modules";
import { getOrganizationId, getUserId, handleError } from "./utils";
import { SupabaseClient } from "@supabase/supabase-js";

export type TrainingSummary = {
  id: number;
  title: string;
  tagline: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Training = TrainingSummary & {
  description: string;
  isPublic: boolean;
  createdBy: string | null;
  organizationId: string | null;
  previewUrl: string | null;
  modules: ModuleSummary[];
};

export type TrainingWithProgress = TrainingSummary & {
  description: string;
  previewUrl: string | null;
  isPublic: boolean;
  organizationId: number | null;
  modules: ModuleProgress[];
};

export type TrainingWithEnrollment = TrainingSummary & {
  isEnrolled: boolean;
};

export async function getTrainingById(
  supabase: SupabaseClient,
  trainingId: number
): Promise<Training | null> {
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
    createdAt: new Date(training.created_at),
    updatedAt: new Date(training.updated_at),
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
    title: enrollment.trainings?.title ?? "",
    tagline: enrollment.trainings?.tagline ?? "",
    imageUrl: enrollment.trainings?.image_url ?? "",
    createdAt: new Date(enrollment.trainings?.created_at),
    updatedAt: new Date(enrollment.trainings?.updated_at),
  }));
}

export async function getTrainingWithProgress(
  supabase: SupabaseClient,
  trainingId: number
): Promise<TrainingWithProgress> {
  const userId = await getUserId(supabase);

  let query = supabase
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

  return {
    id: training.id,
    title: training.title,
    tagline: training.tagline,
    description: training.description,
    imageUrl: training.image_url,
    previewUrl: training.preview_url,
    isPublic: training.is_public,
    organizationId: training.organization_id,
    createdAt: new Date(training.created_at),
    updatedAt: new Date(training.updated_at),
    modules: training.modules.map((module: any) => {
      const history =
        module.history?.filter((h: any) => h.completed_at !== null) || [];
      const lastPractice = history[history.length - 1];

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
}

export async function getTrainingsWithEnrollment(
  supabase: SupabaseClient
): Promise<TrainingWithEnrollment[]> {
  const userId = await getUserId(supabase);
  const organizationId = await getOrganizationId(supabase);

  let query = supabase.from("trainings").select(
    `
      id,
      title,
      tagline,
      image_url,
      is_public,
      organization_id,
      created_at,
      updated_at,
      enrollments!left (
        id,
        user_id
      )
    `
  );

  // Build filter conditions
  const conditions = ["is_public.eq.true"];
  if (organizationId && organizationId !== 1) {
    conditions.push(`organization_id.eq.${organizationId}`);
  }

  query.or(conditions.join(","));

  const { data: trainings, error } = await query;

  if (error) handleError(error);

  return (
    trainings?.map((training) => ({
      id: training.id,
      title: training.title,
      tagline: training.tagline,
      imageUrl: training.image_url,
      isPublic: training.is_public,
      organizationId: training.organization_id,
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
  isPublic: boolean;
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
  const userId = await getUserId(supabase);
  const organizationId = await getOrganizationId(supabase);

  const { data, error } = await supabase
    .from("trainings")
    .insert({
      title: training.title,
      tagline: training.tagline,
      description: training.description,
      image_url: training.imageUrl,
      preview_url: training.previewUrl,
      is_public: training.isPublic,
      created_by: userId,
      organization_id: organizationId,
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
    isPublic: data.is_public,
    organizationId: data.organization_id,
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
    throw new Error("Unauthorized to delete this training");
  }

  const { error } = await supabase
    .from("trainings")
    .delete()
    .eq("id", trainingId);

  if (error) handleError(error);
}
