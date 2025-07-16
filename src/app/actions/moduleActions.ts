"use server";

import { revalidateTag } from "next/cache";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
  updateModule,
  createModule,
  deleteModule,
  UpdateModuleInput,
  getModuleById2,
  Module,
  getRandomModuleRecommendation,
  getModuleByTitle,
  getModulesForCurrentProject,
} from "@/data/modules";
import { findOrCreateSideQuestsTraining } from "@/data/trainings";
import { createClient } from "@/utils/supabase/server";
import { AI_MODELS, MODEL_NAMES, VOICES } from "@/types/models";
import { updatePromptHelperUsageAction } from "@/app/actions/usage-actions";
import { logger } from "@/lib/logger";
import modulePrompts from "@/prompts/module-prompts";
import { checkUserHasCredits } from "./credit-check";

// Hardcoded module title for onboarding recommendation
const ONBOARDING_MODULE_TITLE = "Understanding Feedback Fundamentals";

// Default onboarding recommendation fallback
const DEFAULT_ONBOARDING_RECOMMENDATION = {
  moduleId: "1", // This will be overridden if found
  moduleTitle: "Welcome Training",
  moduleDescription:
    "A simple introduction to communication skills training to get you started on your learning journey.",
};

// Helper function to calculate and track token usage from multiple generation results
async function calculateAndTrackUsage(
  results: Array<{
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
    providerMetadata?: {
      openai?: {
        cachedPromptTokens?:
          | number
          | string
          | boolean
          | Record<string, unknown>;
      };
    };
  }>,
  operationName: string
): Promise<void> {
  // Calculate total usage across all results
  const totalUsage = {
    promptTokens: results.reduce(
      (sum, result) => sum + (result.usage?.promptTokens || 0),
      0
    ),
    completionTokens: results.reduce(
      (sum, result) => sum + (result.usage?.completionTokens || 0),
      0
    ),
    totalTokens: results.reduce(
      (sum, result) => sum + (result.usage?.totalTokens || 0),
      0
    ),
  };

  // Calculate cached tokens from all results
  const totalCachedTokens = results.reduce((sum, result) => {
    const cachedTokens =
      typeof result.providerMetadata?.openai?.cachedPromptTokens === "number"
        ? result.providerMetadata.openai.cachedPromptTokens
        : 0;
    return sum + cachedTokens;
  }, 0);

  const totalNotCachedTokens = Math.max(
    0,
    totalUsage.promptTokens - totalCachedTokens
  );

  // Track usage in database
  try {
    await updatePromptHelperUsageAction({
      modelName: MODEL_NAMES.OPENAI_GPT4O,
      promptTokens: {
        text: {
          cached: totalCachedTokens,
          notCached: totalNotCachedTokens,
        },
      },
      outputTokens: totalUsage.completionTokens,
      totalTokens: totalUsage.totalTokens,
    });
    logger.info(`Usage tracked successfully for ${operationName}`);
  } catch (error) {
    logger.error(`Failed to track ${operationName} usage: ${error}`);
    // Don't fail the request if usage tracking fails
  }

  logger.info(
    `${operationName} completed successfully. Total tokens used: ${totalUsage.totalTokens}`
  );
}

export async function updateModuleAction(module: UpdateModuleInput) {
  const supabase = await createClient();
  const result = await updateModule(supabase, module);

  // Revalidate training cache since module changes affect training data
  revalidateTag(`training-${module.trainingId}`);

  return result;
}

export async function createModuleAction(
  trainingId: number,
  module: Omit<UpdateModuleInput, "id" | "trainingId">
) {
  const supabase = await createClient();
  const result = await createModule(supabase, trainingId, module);

  // Revalidate training cache since new module affects training data
  revalidateTag(`training-${trainingId}`);

  return result;
}

export async function deleteModuleAction(moduleId: number, trainingId: number) {
  const supabase = await createClient();
  const result = await deleteModule(supabase, moduleId, trainingId);

  // Revalidate training cache since module deletion affects training data
  revalidateTag(`training-${trainingId}`);

  return result;
}

export async function getModuleByIdAction2(
  moduleId: number
): Promise<Module | null> {
  const supabase = await createClient();
  return await getModuleById2(supabase, moduleId);
}

export async function getRandomModuleRecommendationAction() {
  const supabase = await createClient();
  return await getRandomModuleRecommendation(supabase);
}

export async function getModuleByTitleAction(moduleTitle: string) {
  const supabase = await createClient();
  return await getModuleByTitle(supabase, moduleTitle);
}

export async function getOnboardingModuleRecommendationAction(): Promise<{
  moduleId: string;
  moduleTitle: string;
  moduleDescription: string;
  requiresModuleCreation?: boolean;
}> {
  const supabase = await createClient();

  // First check if user has any modules at all
  const moduleIds = await getModulesForCurrentProject(supabase);

  if (moduleIds.length === 0) {
    // No modules exist - user needs to create their first module
    return {
      moduleId: "create-first-module", // Special indicator
      moduleTitle: "Create Your First Training Module",
      moduleDescription:
        "It looks like you don't have any training modules yet. Let's create your first one together!",
      requiresModuleCreation: true, // Special flag
    };
  }

  // Try to find the specific onboarding module
  const onboardingModule = await getModuleByTitle(
    supabase,
    ONBOARDING_MODULE_TITLE
  );

  if (onboardingModule) {
    return onboardingModule;
  }

  // Fallback to random recommendation if onboarding module not found
  const randomRecommendation = await getRandomModuleRecommendation(supabase);

  if (randomRecommendation) {
    return randomRecommendation;
  }

  // This shouldn't happen since we checked moduleIds.length > 0 above
  // But keeping as final fallback
  return DEFAULT_ONBOARDING_RECOMMENDATION;
}

export async function createSideQuestModuleAction(
  title?: string,
  instructions?: string,
  scenarioPrompt?: string,
  assessmentPrompt?: string
): Promise<Module> {
  const supabase = await createClient();

  // Find or create the Side Quests training
  const trainingId = await findOrCreateSideQuestsTraining(supabase);

  // Create the module using the existing createModuleAction
  const result = await createModuleAction(trainingId, {
    title: title || "New Module",
    instructions: instructions || null,
    ordinal: 1, // Default ordinal
    modulePrompt: {
      aiModel: AI_MODELS.OPENAI,
      scenario: scenarioPrompt || "",
      assessment: assessmentPrompt || "",
      moderator: null,
      prepCoach: null,
      characters: [],
    },
  });

  return result;
}

export async function generateModulePrompts(
  scenario: string,
  character: string,
  assessment: string
): Promise<{
  scenarioPrompt: string;
  characterPrompt: string;
  assessmentPrompt: string;
  prepCoachPrompt: string;
}> {
  // Check if user has sufficient credits before proceeding
  const creditCheck = await checkUserHasCredits();
  if (!creditCheck.hasCredits) {
    logger.warn(
      "Module prompts generation blocked due to insufficient credits"
    );
    throw new Error(creditCheck.error || "No credits available");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured");
  }

  // Create a configured OpenAI client instance
  const openai = createOpenAI({
    apiKey,
    compatibility: "strict", // Enable strict compatibility mode for proper token counting
  });

  // Prepare the prompts for each generation
  const scenarioPrompt = `${modulePrompts.generateScenario.metaPrompt}\n\nUser Input: ${scenario}`;
  const characterPrompt = `${modulePrompts.generateCharacterPrompt.metaPrompt}\n\nUser Input: ${character}`;
  const assessmentPrompt = `${modulePrompts.generateAssessment.metaPrompt}\n\nUser Input: ${assessment}`;

  try {
    // Generate all prompts in parallel
    const [scenarioResult, characterResult, assessmentResult] =
      await Promise.all([
        generateText({
          model: openai.chat(MODEL_NAMES.OPENAI_GPT4O),
          prompt: scenarioPrompt,
          temperature: 0.3,
        }),
        generateText({
          model: openai.chat(MODEL_NAMES.OPENAI_GPT4O),
          prompt: characterPrompt,
          temperature: 0.3,
        }),
        generateText({
          model: openai.chat(MODEL_NAMES.OPENAI_GPT4O),
          prompt: assessmentPrompt,
          temperature: 0.3,
        }),
      ]);

    const prepCoachPrompt = `${modulePrompts.generatePrepCoach.metaPrompt}\n\n## Scenario:\n${scenario}\n## Character Description:\n${character}`;

    const prepCoachResult = await generateText({
      model: openai.chat(MODEL_NAMES.OPENAI_GPT4O),
      prompt: prepCoachPrompt,
      temperature: 0.3,
    });

    // Track usage for all three generations
    await calculateAndTrackUsage(
      [scenarioResult, characterResult, assessmentResult, prepCoachResult],
      "module prompts generation"
    );

    return {
      scenarioPrompt: scenarioResult.text,
      characterPrompt: characterResult.text,
      assessmentPrompt: assessmentResult.text,
      prepCoachPrompt: prepCoachResult.text,
    };
  } catch (error) {
    logger.error(`Failed to generate module prompts: ${error}`);
    throw new Error(`Failed to generate module prompts: ${error}`);
  }
}

export async function generateModuleFieldsFromScenario(
  scenarioPrompt: string
): Promise<{
  title: string;
  instructions: string;
}> {
  // Check if user has sufficient credits before proceeding
  const creditCheck = await checkUserHasCredits();
  if (!creditCheck.hasCredits) {
    logger.warn("Module fields generation blocked due to insufficient credits");
    throw new Error(creditCheck.error || "No credits available");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured");
  }

  // Create a configured OpenAI client instance
  const openai = createOpenAI({
    apiKey,
    compatibility: "strict", // Enable strict compatibility mode for proper token counting
  });

  // Prepare the prompts for each generation
  const titlePrompt = `${modulePrompts.generateModuleTitle.metaPrompt}\n\nUser Input: ${scenarioPrompt}`;
  const instructionsPrompt = `${modulePrompts.generateModuleInstructions.metaPrompt}\n\nUser Input: ${scenarioPrompt}`;

  try {
    // Generate title and instructions in parallel
    const [titleResult, instructionsResult] = await Promise.all([
      generateText({
        model: openai.chat(MODEL_NAMES.OPENAI_GPT4O),
        prompt: titlePrompt,
        temperature: 0.3,
      }),
      generateText({
        model: openai.chat(MODEL_NAMES.OPENAI_GPT4O),
        prompt: instructionsPrompt,
        temperature: 0.3,
      }),
    ]);

    // Track usage for both generations
    await calculateAndTrackUsage(
      [titleResult, instructionsResult],
      "module fields generation from scenario"
    );

    return {
      title: titleResult.text,
      instructions: instructionsResult.text,
    };
  } catch (error) {
    logger.error(`Failed to generate module fields from scenario: ${error}`);
    throw new Error(`Failed to generate module fields from scenario: ${error}`);
  }
}

export async function generatePrepCoachAction(
  moduleId: number,
  scenario: string,
  characterPrompts: string[]
): Promise<string> {
  // Check if user has sufficient credits before proceeding
  const creditCheck = await checkUserHasCredits();
  if (!creditCheck.hasCredits) {
    logger.warn("Prep coach generation blocked due to insufficient credits");
    throw new Error(creditCheck.error || "No credits available");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured");
  }

  // Build character description from prompts
  const characterDescription =
    characterPrompts.length > 0
      ? characterPrompts.join("\n\n")
      : "A helpful character to practice with";

  // Create a configured OpenAI client instance
  const openai = createOpenAI({
    apiKey,
    compatibility: "strict", // Enable strict compatibility mode for proper token counting
  });

  // Generate the prepCoach prompt
  const prepCoachPrompt = `${modulePrompts.generatePrepCoach.metaPrompt}\n\n## Scenario:\n${scenario}\n## Character Description:\n${characterDescription}`;

  try {
    const prepCoachResult = await generateText({
      model: openai.chat(MODEL_NAMES.OPENAI_GPT4O),
      prompt: prepCoachPrompt,
      temperature: 0.3,
    });

    // Track usage
    await calculateAndTrackUsage([prepCoachResult], "prep coach generation");

    // Update the module with the generated prepCoach
    const supabase = await createClient();
    const currentModule = await getModuleById2(supabase, moduleId);

    if (!currentModule) {
      throw new Error("Module not found");
    }

    await updateModule(supabase, {
      id: currentModule.id,
      trainingId: currentModule.trainingId,
      title: currentModule.title,
      instructions: currentModule.instructions,
      ordinal: currentModule.ordinal,
      modulePrompt: {
        ...currentModule.modulePrompt,
        prepCoach: prepCoachResult.text,
      },
    });

    // Revalidate the module cache
    revalidateTag(`module-${moduleId}`);

    return prepCoachResult.text;
  } catch (error) {
    logger.error(`Failed to generate prep coach: ${error}`);
    throw new Error(`Failed to generate prep coach: ${error}`);
  }
}

export async function generateSideQuestCharacter(): Promise<{
  name: string;
  voice: string;
  avatarUrl: string;
}> {
  // Select random voice from OpenAI voices
  const openAiVoices = VOICES[AI_MODELS.OPENAI];
  const randomVoice =
    openAiVoices[Math.floor(Math.random() * openAiVoices.length)];

  return {
    name: randomVoice.name,
    voice: randomVoice.voice,
    avatarUrl:
      randomVoice.avatarUrl ||
      "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/avatars/sidequest-avatars/verse.png",
  };
}
