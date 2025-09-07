import { HistorySummary } from "./history";
import { handleError } from "./utils";
import { SupabaseClient } from "@supabase/supabase-js";
import { CharacterDetails } from "./characters";
import { AIModel, AI_MODELS, aiModelSchema } from "@/types/models";
import { logger } from "@/lib/logger";
import { getPathFromStorageUrl } from "@/lib/utils";
import { Skills, Traits, parseSkillsFromDb, parseTraitsFromDb } from "@/types/character-attributes";

export type ModuleCharacter = CharacterDetails & {
  prompt: string;
  ordinal: number;
  skills: Skills;
  traits: Traits;
};

export type ModulePrompt = {
  aiModel: AIModel;
  scenario: string;
  assessment: string;
  moderator: string | null;
  prepCoach: string | null;
  characters: ModuleCharacter[];
};

export type ModuleSummary = {
  id: number;
  title: string;
  trainingId: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Module = ModuleSummary & {
  instructions: string | null;
  ordinal: number;
  modulePrompt: ModulePrompt;
};

export type ModuleProgress = ModuleSummary & {
  instructions: string | null;
  characters: ModuleCharacter[];
  practiceCount: number;
  history: HistorySummary[];
};

export type ModuleContextForAI = {
  title: string;
  instructions: string | null;
  scenario: string;
  assessment: string;
  moderator: string | null;
  prepCoach: string | null;
};

// Add this new function to get modules for a training
export async function getModulesByTrainingId(
  supabase: SupabaseClient,
  trainingId: string
): Promise<ModuleSummary[]> {
  const { data, error } = await supabase
    .from("modules")
    .select("id, title, training_id, ordinal, created_at, updated_at")
    .eq("training_id", trainingId)
    .order("ordinal");

  if (error) handleError(error);

  return (
    data?.map((module) => ({
      id: module.id,
      title: module.title,
      trainingId: module.training_id,
      ordinal: module.ordinal,
      createdAt: new Date(module.created_at),
      updatedAt: new Date(module.updated_at),
    })) ?? []
  );
}

// Add function to search for modules by title within user's current project
export async function getModuleByTitle(
  supabase: SupabaseClient,
  moduleTitle: string
): Promise<{
  moduleId: string;
  moduleTitle: string;
  moduleDescription: string;
} | null> {
  // Get user's current project from their profile and search for module by title
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("modules")
    .select(
      `
      id,
      title,
      instructions,
      scenario_prompt,
      trainings!inner (
        project_id,
        profiles!inner (
          id
        )
      )
    `
    )
    .eq("trainings.profiles.id", user.id)
    .eq("title", moduleTitle)
    .single();

  if (error) {
    logger.warn(`Could not find module with title "${moduleTitle}":`, error);
    return null;
  }

  if (!data) {
    return null;
  }

  // Create a description from instructions or scenario
  const description =
    data.instructions ||
    data.scenario_prompt ||
    "A training module to help improve your communication skills.";

  return {
    moduleId: data.id.toString(),
    moduleTitle: data.title,
    moduleDescription: description,
  };
}

export type UpdateModuleInput = {
  id: number;
  trainingId: number;
  title: string;
  instructions: string | null;
  ordinal: number;
  modulePrompt: ModulePrompt;
};

export async function updateModule(
  supabase: SupabaseClient,
  module: UpdateModuleInput
): Promise<Module> {
  const aiModel = aiModelSchema.parse(
    module.modulePrompt.aiModel || AI_MODELS.OPENAI
  ) as AIModel;

  const { data, error } = await supabase
    .from("modules")
    .update({
      title: module.title,
      instructions: module.instructions,
      ai_model: aiModel,
      scenario_prompt: module.modulePrompt.scenario,
      assessment_prompt: module.modulePrompt.assessment,
      moderator_prompt: module.modulePrompt.moderator,
      prep_coach_prompt: module.modulePrompt.prepCoach,
      updated_at: new Date().toISOString(),
    })
    .eq("id", module.id)
    .select();

  if (error) handleError(error);
  if (!data || data.length === 0) throw new Error("Module not found");

  const newAiModel = aiModelSchema.parse(data[0].ai_model) as AIModel;

  const modulePrompt: ModulePrompt = {
    aiModel: newAiModel,
    scenario: data[0].scenario_prompt,
    assessment: data[0].assessment_prompt,
    moderator: data[0].moderator_prompt,
    prepCoach: data[0].prep_coach_prompt,
    characters: [],
  };

  return {
    id: data[0].id,
    title: data[0].title,
    trainingId: data[0].training_id,
    instructions: data[0].instructions,
    ordinal: data[0].ordinal,
    modulePrompt: modulePrompt,
    createdAt: new Date(data[0].created_at),
    updatedAt: new Date(data[0].updated_at),
  };
}

export async function createModule(
  supabase: SupabaseClient,
  trainingId: number,
  module: Omit<UpdateModuleInput, "id" | "trainingId">
): Promise<Module> {
  const aiModel = aiModelSchema.parse(
    module.modulePrompt.aiModel || AI_MODELS.OPENAI
  ) as AIModel;

  const { data, error } = await supabase
    .from("modules")
    .insert({
      training_id: trainingId,
      title: module.title,
      instructions: module.instructions,
      ai_model: aiModel,
      scenario_prompt: module.modulePrompt.scenario,
      assessment_prompt: module.modulePrompt.assessment,
      moderator_prompt: module.modulePrompt.moderator,
      prep_coach_prompt: module.modulePrompt.prepCoach,
    })
    .select()
    .single();

  if (error) handleError(error);
  if (!data) throw new Error("Failed to create module");

  const newAiModel = aiModelSchema.parse(data.ai_model) as AIModel;

  const modulePrompt: ModulePrompt = {
    aiModel: newAiModel,
    scenario: data.scenario_prompt,
    assessment: data.assessment_prompt,
    moderator: data.moderator_prompt,
    prepCoach: data.prep_coach_prompt,
    characters: [],
  };

  return {
    id: data.id,
    trainingId: data.training_id,
    title: data.title,
    instructions: data.instructions,
    ordinal: data.ordinal,
    modulePrompt: modulePrompt,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function deleteModule(
  supabase: SupabaseClient,
  moduleId: number,
  trainingId: number
): Promise<void> {
  // First, get all the data we need for cleanup before deleting
  const { data: moduleData, error: moduleError } = await supabase
    .from("modules")
    .select(
      `
      id,
      training_id,
      modules_characters (
        character_id,
        characters (
          id,
          avatar_url
        )
      )
    `
    )
    .eq("id", moduleId)
    .eq("training_id", trainingId)
    .single();

  if (moduleError) {
    if (moduleError.code === "PGRST116") {
      // Module not found - nothing to delete
      return;
    }
    handleError(moduleError);
  }

  if (!moduleData) {
    // No module data found
    return;
  }

  // Collect all character IDs and avatar URLs for cleanup
  const charactersToDelete: Array<{ id: number; avatarUrl: string | null }> =
    [];

  // Collect characters from the module
  /* eslint-disable @typescript-eslint/no-explicit-any */
  moduleData.modules_characters?.forEach((mc: any) => {
    if (mc.characters) {
      charactersToDelete.push({
        id: mc.characters.id,
        avatarUrl: mc.characters.avatar_url,
      });
      console.log(
        `Module ${moduleId}: Found character ${mc.characters.id} with avatar: ${mc.characters.avatar_url}`
      );
    }
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  console.log(
    `Module ${moduleId}: Collected ${charactersToDelete.length} characters for deletion`
  );

  // Delete the module (this will cascade delete module_character relationships)
  const { error: deleteError } = await supabase
    .from("modules")
    .delete()
    .eq("id", moduleId)
    .eq("training_id", trainingId);

  if (deleteError) handleError(deleteError);

  // Clean up characters (these are not cascade deleted)
  for (const character of charactersToDelete) {
    try {
      const { error: charDeleteError } = await supabase
        .from("characters")
        .delete()
        .eq("id", character.id);

      if (charDeleteError) {
        console.error(
          `Failed to delete character ${character.id}:`,
          charDeleteError
        );
        // Continue with other cleanup even if one character deletion fails
      }
    } catch (error) {
      console.error(`Error deleting character ${character.id}:`, error);
    }
  }

  // Clean up storage files (character avatars)
  // Use the robust storage deletion action for better error handling
  const storageCleanupPromises: Promise<void>[] = [];

  // Clean up character avatar images
  console.log(
    `Module ${moduleId}: Starting storage cleanup for ${charactersToDelete.length} characters`
  );

  for (const character of charactersToDelete) {
    if (character.avatarUrl) {
      console.log(
        `Module ${moduleId}: Processing avatar URL for character ${character.id}: ${character.avatarUrl}`
      );
      try {
        // Extract the storage path from the URL using utility function
        const storagePath = getPathFromStorageUrl(character.avatarUrl);
        console.log(
          `Module ${moduleId}: Extracted storage path for character ${character.id}: ${storagePath}`
        );
        if (storagePath) {
          // Import the storage action dynamically to avoid circular dependencies
          const storageCleanup = import("@/app/actions/storage-actions").then(
            async ({ deleteStorageObjectAction }) => {
              const result = await deleteStorageObjectAction({
                bucketName: "avatars",
                path: storagePath,
              });

              if (!result.success) {
                console.error(
                  `Failed to delete character avatar ${storagePath}: ${result.error}`
                );
              } else {
                console.log(
                  `Successfully deleted character avatar: ${storagePath}`
                );
              }
            }
          );

          storageCleanupPromises.push(storageCleanup);
        }
      } catch (error) {
        console.error(
          `Error processing character avatar URL ${character.avatarUrl}:`,
          error
        );
      }
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
        `${failedCleanups.length} storage cleanup operations failed during module deletion`
      );
    }
  });
}

export async function getModuleById2(
  supabase: SupabaseClient,
  moduleId: number
): Promise<Module | null> {
  const { data: module, error } = await supabase
    .from("modules")
    .select(
      `
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
          ai_description,
          ai_model,
          description,
          avatar_url
        )
      )
    `
    )
    .eq("id", moduleId)
    .single();

  if (error) {
    logger.error("Error getting module by id", error);
    if (error.code === "PGRST116") return null;
    handleError(error);
  }

  if (!module) return null;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const characters: ModuleCharacter[] = (module.modules_characters || [])
    .map((mc: any) => ({
      id: mc.characters.id,
      name: mc.characters.name,
      voice: mc.characters.voice,
      aiDescription: mc.characters.ai_description,
      aiModel: aiModelSchema.parse(mc.characters.ai_model) as AIModel,
      description: mc.characters.description,
      avatarUrl: mc.characters.avatar_url,
      prompt: mc.prompt,
      ordinal: mc.ordinal,
      skills: parseSkillsFromDb(mc.skills),
      traits: parseTraitsFromDb(mc.traits),
    }))
    .sort((a: ModuleCharacter, b: ModuleCharacter) => a.ordinal - b.ordinal);
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const aiModel = aiModelSchema.parse(
    module.ai_model || AI_MODELS.OPENAI
  ) as AIModel;

  const modulePrompt: ModulePrompt = {
    aiModel: aiModel,
    scenario: module.scenario_prompt,
    assessment: module.assessment_prompt,
    moderator: module.moderator_prompt,
    prepCoach: module.prep_coach_prompt,
    characters: characters,
  };

  return {
    id: module.id,
    title: module.title,
    trainingId: module.training_id,
    instructions: module.instructions,
    ordinal: module.ordinal,
    modulePrompt: modulePrompt,
    createdAt: new Date(module.created_at),
    updatedAt: new Date(module.updated_at),
  };
}
