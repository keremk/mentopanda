import { ModuleProgress, ModuleSummary, Module, deleteModule } from "./modules";
import { handleError } from "./utils";
import { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentUserInfo, getUserId } from "./user";
import { getPathFromStorageUrl } from "@/lib/utils";

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

export type TrainingEdit = TrainingSummary & {
  description: string;
  createdBy: string | null;
  previewUrl: string | null;
  modules: Module[];
};

export type TrainingDetailsContextForAI = {
  title: string;
  tagline: string;
  description: string;
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

export async function getTrainingByIdForEdit(
  supabase: SupabaseClient,
  trainingId: number
): Promise<TrainingEdit | null> {
  const query = supabase
    .from("trainings")
    .select(
      `
      *,
      modules (
        *,
        modules_characters (
          ordinal,
          prompt,
          skills,
          emotion,
          characters (
            id,
            name,
            voice,
            description,
            avatar_url
          )
        )
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

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const trainingEdit: TrainingEdit = {
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
    modules: training.modules.map((module: any) => ({
      id: module.id,
      title: module.title,
      instructions: module.instructions,
      trainingId: module.training_id,
      ordinal: module.ordinal,
      createdAt: new Date(module.created_at),
      updatedAt: new Date(module.updated_at),
      modulePrompt: {
        aiModel: module.ai_model,
        scenario: module.scenario_prompt,
        assessment: module.assessment_prompt,
        moderator: module.moderator_prompt,
        prepCoach: module.prep_coach_prompt,
        characters: module.modules_characters.map((mc: any) => ({
          id: mc.characters.id,
          name: mc.characters.name,
          voice: mc.characters.voice,
          description: mc.characters.description,
          avatarUrl: mc.characters.avatar_url,
          prompt: mc.prompt,
          ordinal: mc.ordinal,
          skills: mc.skills,
          emotion: mc.emotion,
        })),
      },
    })),
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return trainingEdit;
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
        modules_characters (
          *,
          characters (
            id,
            name,
            voice,
            description,
            avatar_url
          )
        ),
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
        instructions: module.instructions,
        characters: module.modules_characters.map((mc: any) => ({
          id: mc.characters.id,
          name: mc.characters.name,
          voice: mc.characters.voice,
          description: mc.characters.description,
          avatarUrl: mc.characters.avatar_url,
        })),
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
};

export type UpdateTrainingInput = BaseTrainingInput & {
  id: number;
  tagline: string;
  description: string;
  imageUrl: string;
  previewUrl: string | null;
};

export async function updateTraining(
  supabase: SupabaseClient,
  training: UpdateTrainingInput
): Promise<Training> {
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
  // First, get the training data and its modules
  const { data: trainingData, error: trainingError } = await supabase
    .from("trainings")
    .select(
      `
      id,
      image_url,
      preview_url,
      modules (
        id
      )
    `
    )
    .eq("id", trainingId)
    .single();

  if (trainingError) {
    if (trainingError.code === "PGRST116") {
      // Training not found - nothing to delete
      return;
    }
    handleError(trainingError);
  }

  if (!trainingData) {
    // No training data found
    return;
  }

  // Collect training images for cleanup
  const trainingImages: Array<string> = [];
  if (trainingData.image_url) {
    trainingImages.push(trainingData.image_url);
  }
  if (trainingData.preview_url) {
    trainingImages.push(trainingData.preview_url);
  }

  // Delete all modules (this will handle character and character avatar cleanup)
  const moduleDeletePromises =
    trainingData.modules?.map((module: { id: number }) =>
      deleteModule(supabase, module.id, trainingId)
    ) || [];

  // Wait for all modules to be deleted before deleting the training
  await Promise.all(moduleDeletePromises);

  // Delete the training (this will cascade delete enrollments and any remaining relationships)
  const { error: deleteError } = await supabase
    .from("trainings")
    .delete()
    .eq("id", trainingId);

  if (deleteError) handleError(deleteError);

  // Clean up training-specific storage files (training images)
  // Use the robust storage deletion action for better error handling
  const storageCleanupPromises: Promise<void>[] = [];

  // Clean up training images
  for (const imageUrl of trainingImages) {
    try {
      // Extract the storage path from the URL using utility function
      const storagePath = getPathFromStorageUrl(imageUrl);
      if (storagePath) {
        // Import the storage action dynamically to avoid circular dependencies
        const storageCleanup = import("@/app/actions/storage-actions").then(
          async ({ deleteStorageObjectAction }) => {
            const result = await deleteStorageObjectAction({
              bucketName: "trainings",
              path: storagePath,
            });

            if (!result.success) {
              console.error(
                `Failed to delete training image ${storagePath}: ${result.error}`
              );
            } else {
              console.log(
                `Successfully deleted training image: ${storagePath}`
              );
            }
          }
        );

        storageCleanupPromises.push(storageCleanup);
      }
    } catch (error) {
      console.error(`Error processing training image URL ${imageUrl}:`, error);
    }
  }

  // Execute all storage cleanup operations in parallel (but don't await them)
  // This ensures storage cleanup happens but doesn't block the main deletion
  Promise.allSettled(storageCleanupPromises).then((results) => {
    const failedCleanups = results.filter(
      (result) => result.status === "rejected"
    );
    if (failedCleanups.length > 0) {
      console.error(
        `${failedCleanups.length} storage cleanup operations failed during training deletion`
      );
    }
  });
}

// Function to find or create Side Quests training and return its ID
export async function findOrCreateSideQuestsTraining(
  supabase: SupabaseClient
): Promise<number> {
  // Get user info including current project
  const { id: userId, currentProject } = await getCurrentUserInfo(supabase);

  // Check if "Side Quests" training exists in the current project
  const { data: existingTraining, error: trainingError } = await supabase
    .from("trainings")
    .select("id")
    .eq("project_id", currentProject.id)
    .eq("title", "Side Quests")
    .single();

  if (trainingError && trainingError.code === "PGRST116") {
    // Training doesn't exist, create it
    const SIDE_QUESTS_DESCRIPTION =
      "A collection of miscellaneous training modules for various communication scenarios and skill-building exercises. These side quests help you practice different situations and improve your overall communication abilities. You can add new modules by just selecting `Go Panda` button on your home page and the MentoPanda will help you create new modules by asking you a few questions. ";

    const { data: newTraining, error: createError } = await supabase
      .from("trainings")
      .insert({
        title: "Side Quests",
        tagline: "For your impromptu training ideas",
        description: SIDE_QUESTS_DESCRIPTION,
        image_url:
          "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/trainings//sidequests.png",
        project_id: currentProject.id,
        created_by: userId,
      })
      .select("id")
      .single();

    if (createError) handleError(createError);
    if (!newTraining) throw new Error("Failed to create Side Quests training");

    return newTraining.id;
  } else if (trainingError) {
    handleError(trainingError);
    throw new Error("Failed to check for existing Side Quests training");
  } else {
    // Training exists, return its ID
    return existingTraining.id;
  }
}
