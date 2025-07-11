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
  getModulesForCurrentProject,
  getRandomModuleRecommendation,
  findOrCreateSideQuestsTraining,
} from "@/data/modules";
import { createClient } from "@/utils/supabase/server";
import { AI_MODELS, MODEL_NAMES, VOICES } from "@/types/models";
import { updatePromptHelperUsageAction } from "@/app/actions/usage-actions";
import { logger } from "@/lib/logger";
import modulePrompts from "@/prompts/module-prompts";

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

export async function getModulesForCurrentProjectAction() {
  const supabase = await createClient();
  return await getModulesForCurrentProject(supabase);
}

export async function getRandomModuleRecommendationAction() {
  const supabase = await createClient();
  return await getRandomModuleRecommendation(supabase);
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
}> {
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

    // Track usage for all three generations
    await calculateAndTrackUsage(
      [scenarioResult, characterResult, assessmentResult],
      "module prompts generation"
    );

    return {
      scenarioPrompt: scenarioResult.text,
      characterPrompt: characterResult.text,
      assessmentPrompt: assessmentResult.text,
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
