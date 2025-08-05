import { ModuleProgress, ModuleSummary, Module, deleteModule } from "./modules";
import { handleError } from "./utils";
import { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentUserInfo, getUserId, hasPermission } from "./user";
import { getPathFromStorageUrl } from "@/lib/utils";
import { parseSkillsFromDb, parseTraitsFromDb } from "@/types/character-attributes";
import { copyStorageFileWithAdminPrivileges } from "./storage-utils";
import { logger } from "@/lib/logger";

export type TrainingSummary = {
  id: number;
  title: string;
  tagline: string;
  imageUrl: string;
  projectId: number;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  forkCount: number;
  originId: number | null;
  forkedAt: Date | null;
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
    isPublic: training.is_public,
    forkCount: training.fork_count,
    originId: training.origin_id,
    forkedAt: training.forked_at ? new Date(training.forked_at) : null,
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
          traits,
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
    isPublic: training.is_public,
    forkCount: training.fork_count,
    originId: training.origin_id,
    forkedAt: training.forked_at ? new Date(training.forked_at) : null,
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
          skills: parseSkillsFromDb(mc.skills),
          traits: parseTraitsFromDb(mc.traits),
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
    isPublic: training.is_public,
    forkCount: training.fork_count,
    originId: training.origin_id,
    forkedAt: training.forked_at ? new Date(training.forked_at) : null,
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
      is_public,
      fork_count,
      origin_id,
      forked_at,
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
      isPublic: training.is_public,
      forkCount: training.fork_count,
      originId: training.origin_id,
      forkedAt: training.forked_at ? new Date(training.forked_at) : null,
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
    isPublic: data[0].is_public,
    forkCount: data[0].fork_count,
    originId: data[0].origin_id,
    forkedAt: data[0].forked_at ? new Date(data[0].forked_at) : null,
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
    isPublic: data.is_public,
    forkCount: data.fork_count,
    originId: data.origin_id,
    forkedAt: data.forked_at ? new Date(data.forked_at) : null,
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

// Toggle public status of a training
export async function toggleTrainingPublicStatus(
  supabase: SupabaseClient,
  trainingId: number,
  isPublic: boolean
): Promise<TrainingSummary> {
  const { data, error } = await supabase
    .from("trainings")
    .update({
      is_public: isPublic,
      updated_at: new Date().toISOString(),
    })
    .eq("id", trainingId)
    .select()
    .single();

  if (error) handleError(error);
  if (!data) throw new Error("Failed to update training public status");

  return {
    id: data.id,
    title: data.title,
    tagline: data.tagline,
    imageUrl: data.image_url,
    projectId: data.project_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    isPublic: data.is_public,
    forkCount: data.fork_count,
    originId: data.origin_id,
    forkedAt: data.forked_at ? new Date(data.forked_at) : null,
  };
}

// Get public trainings (for unauthenticated and authenticated users)
export async function getPublicTrainings(
  supabase: SupabaseClient,
  limit: number = 20,
  offset: number = 0
): Promise<TrainingWithEnrollment[]> {
  const query = supabase
    .from("trainings")
    .select(`
      id,
      title,
      tagline,
      image_url,
      project_id,
      created_at,
      updated_at,
      is_public,
      fork_count,
      origin_id,
      forked_at,
      created_by,
      profiles!trainings_created_by_fkey (
        id
      )
    `)
    .eq("is_public", true)
    .order("fork_count", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

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
      isPublic: training.is_public,
      forkCount: training.fork_count,
      originId: training.origin_id,
      forkedAt: training.forked_at ? new Date(training.forked_at) : null,
      isEnrolled: false, // Public view - no enrollment check
    })) ?? []
  );
}

// Copy a public training to user's project using the deep copy function
export async function copyPublicTrainingToProject(
  supabase: SupabaseClient,
  sourceTrainingId: number
): Promise<{ trainingId: number; characterMapping: Record<string, number>; moduleMapping: Record<string, number> }> {
  const user = await getCurrentUserInfo(supabase);

  // Check if user has training.manage permission on their current project
  const canManageTrainings = await hasPermission({
    supabase,
    permission: "training.manage",
    user,
  });

  if (!canManageTrainings) {
    throw new Error("Insufficient permissions to copy trainings to this project");
  }

  // First check if the training is public and accessible
  const { data: sourceTraining, error: checkError } = await supabase
    .from("trainings")
    .select("is_public")
    .eq("id", sourceTrainingId)
    .single();

  if (checkError) {
    if (checkError.code === "PGRST116") {
      throw new Error("Training not found or access denied");
    }
    handleError(checkError);
  }

  if (!sourceTraining?.is_public) {
    throw new Error("Can only copy public trainings");
  }

  // Call the database deep copy function
  const { data: result, error } = await supabase.rpc("deep_copy_training", {
    source_training_id: sourceTrainingId,
    target_project_id: user.currentProject.id,
    target_user_id: user.id,
  });

  if (error) handleError(error);
  if (!result) throw new Error("Deep copy function returned no result");

  const trainingId = result.training_id;
  const characterMapping = result.character_mapping || {};
  const moduleMapping = result.module_mapping || {};

  // Now implement storage copying for training images and character avatars
  logger.debug(
    `[copyPublicTrainingToProject] Copying storage assets for training ${sourceTrainingId} -> ${trainingId}`
  );

  // First, get the source training data with image URLs
  const { data: sourceData, error: sourceError } = await supabase
    .from("trainings")
    .select(`
      id,
      image_url
    `)
    .eq("id", sourceTrainingId)
    .single();

  // Get characters that were copied using the character mapping from deep_copy_training
  // This avoids RLS issues since we already have the mapping
  logger.debug(`[copyPublicTrainingToProject] Using character mapping from deep copy:`, characterMapping);
  
  let charactersData = null;
  let charactersError = null;

  if (Object.keys(characterMapping).length > 0) {
    // Get source characters using the original character IDs from the mapping
    const sourceCharacterIds = Object.keys(characterMapping).map(id => parseInt(id));
    logger.debug(`[copyPublicTrainingToProject] Looking for source characters:`, sourceCharacterIds);
    
    const { data: chars, error: charsError } = await supabase
      .from("characters")
      .select(`
        id,
        avatar_url
      `)
      .in("id", sourceCharacterIds);
    
    logger.debug(`[copyPublicTrainingToProject] Found source characters: ${chars}, Error: ${charsError}`);
    charactersData = chars;
    charactersError = charsError;
  } else {
    logger.debug(`[copyPublicTrainingToProject] No characters to copy (empty character mapping)`);
  }

  if (sourceError) {
    logger.error("[copyPublicTrainingToProject] Failed to fetch source training data for storage copying:", sourceError);
    // Don't throw - storage copying is not critical, return the successful database copy
  } else if (charactersError) {
    logger.error("[copyPublicTrainingToProject] Failed to fetch source characters data for storage copying:", charactersError);
    // Don't throw - storage copying is not critical, return the successful database copy  
  } else if (sourceData) {
    logger.debug(`[copyPublicTrainingToProject] Source data retrieved:`, sourceData);
    logger.debug(`[copyPublicTrainingToProject] Characters data retrieved:`, charactersData);
    const storageUpdatePromises: Promise<void>[] = [];

    // Copy training cover image
    if (sourceData.image_url) {
      logger.debug(`[copyPublicTrainingToProject] Copying training image: ${sourceData.image_url}`);
      const copyPromise = copyStorageFileWithAdminPrivileges(
        sourceData.image_url,
        "trainings",
        `trainings/${trainingId}/cover.jpg`
      ).then(async (newUrl) => {
        logger.debug(`[copyPublicTrainingToProject] Training image copy result: ${newUrl}`);
        if (newUrl && newUrl !== sourceData.image_url) {
          const { data, error } = await supabase
            .from("trainings")
            .update({ image_url: newUrl })
            .eq("id", trainingId)
            .select();
          
          if (error) {
            logger.error(`[copyPublicTrainingToProject] Failed to update training ${trainingId} image URL:`, error);
          } else {
            logger.debug(`[copyPublicTrainingToProject] Successfully updated training ${trainingId} with new image URL: ${newUrl}`, data);
          }
        } else {
          logger.warn(`[copyPublicTrainingToProject] Training image copy failed - keeping original URL: ${sourceData.image_url}`);
        }
      });
      storageUpdatePromises.push(copyPromise);
    } else {
      logger.debug(`[copyPublicTrainingToProject] No training image to copy`);
    }

    // Copy character avatars using the character mapping
    const sourceCharacters = charactersData || [];
    logger.debug(`[copyPublicTrainingToProject] Found ${sourceCharacters.length} source characters`);
    
    for (const sourceChar of sourceCharacters) {
      const newCharacterId = characterMapping[sourceChar.id.toString()];
      logger.debug(`[copyPublicTrainingToProject] Processing character ${sourceChar.id} -> ${newCharacterId}, avatar: ${sourceChar?.avatar_url}`);
      
      if (sourceChar?.avatar_url && newCharacterId) {
        logger.debug(`[copyPublicTrainingToProject] Copying character avatar: ${sourceChar.avatar_url} -> character-avatars/${newCharacterId}/avatar.jpg`);
        const copyPromise = copyStorageFileWithAdminPrivileges(
          sourceChar.avatar_url,
          "avatars",
          `character-avatars/${newCharacterId}/avatar.jpg`
        ).then(async (newUrl) => {
          logger.debug(`[copyPublicTrainingToProject] Character avatar copy result for ${newCharacterId}: ${newUrl}`);
          if (newUrl && newUrl !== sourceChar.avatar_url) {
            // First check if the character exists and get its project_id
            const { data: charCheck } = await supabase
              .from("characters")
              .select("id, project_id, avatar_url")
              .eq("id", newCharacterId)
              .single();
            
            logger.debug(`[copyPublicTrainingToProject] Character ${newCharacterId} check:`, charCheck);
            
            const { data, error } = await supabase
              .from("characters")
              .update({ avatar_url: newUrl })
              .eq("id", newCharacterId)
              .select();
            
            if (error) {
              logger.error(`[copyPublicTrainingToProject] Failed to update character ${newCharacterId} avatar URL:`, error);
            } else if (!data || data.length === 0) {
              logger.error(`[copyPublicTrainingToProject] Update returned 0 rows for character ${newCharacterId} - possible RLS issue`);
            } else {
              logger.debug(`[copyPublicTrainingToProject] Successfully updated character ${newCharacterId} with new avatar URL: ${newUrl}`, data);
            }
          } else {
            logger.warn(`[copyPublicTrainingToProject] Character avatar copy failed for ${newCharacterId} - keeping original URL: ${sourceChar.avatar_url}`);
          }
        });
        storageUpdatePromises.push(copyPromise);
      } else {
        logger.debug(`[copyPublicTrainingToProject] Skipping character ${sourceChar.id} - no avatar or no mapping`);
      }
    }

    // Wait for all storage operations to complete
    const results = await Promise.allSettled(storageUpdatePromises);
    
    // Log any failures but don't throw
    const failures = results.filter(result => result.status === "rejected");
    if (failures.length > 0) {
      logger.error(`[copyPublicTrainingToProject] ${failures.length} storage copy operations failed during training copy`);
    } else {
      logger.debug("[copyPublicTrainingToProject] All storage assets copied successfully");
    }
  }

  return {
    trainingId,
    characterMapping,
    moduleMapping,
  };
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
