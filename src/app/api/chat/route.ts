import { type CoreMessage, streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
  ContextType,
  ContextData,
  SelectedOption,
} from "@/contexts/ai-pane-context";
import characterPrompts from "@/prompts/character-prompts";
import modulePrompts from "@/prompts/module-prompts";
import trainingPrompts from "@/prompts/training-prompts";
import {
  getAIContextDataForCharacterAction,
  getAIContextDataForTrainingAction,
} from "@/app/actions/aicontext-actions";
import { updatePromptHelperUsageAction } from "@/app/actions/usage-actions";
import { TrainingContextData } from "@/data/ai-context";
import { CharacterContextForAI } from "@/data/characters";
import { logger } from "@/lib/logger";
import { checkUserHasCredits } from "@/app/actions/credit-check";

const generateMetaCharacterPrompts = (
  selectedOption: SelectedOption,
  characterContext: CharacterContextForAI | null
) => {
  const basePrompt = "You are tasked with generating character information";

  const characterPrompt = `
# Instructions:
${characterPrompts[selectedOption.id].metaPrompt || basePrompt}

# Currently available character information:
Character Name: ${characterContext?.name}
Character Description: ${characterContext?.description}
Character AI Meta Prompt: ${characterContext?.aiDescription}
  `;

  return characterPrompt;
};

const generateMetaModulePrompts = (
  selectedOption: SelectedOption,
  trainingContext: TrainingContextData | null
) => {
  const basePrompt = "You are tasked with generating module information";

  const modulePrompt = `
# Instructions:
${modulePrompts[selectedOption.id].metaPrompt || basePrompt}

# Currently available module information:
Training Title: ${trainingContext?.training.title}
Module Title: ${trainingContext?.module.title}
Module Instructions: ${trainingContext?.module.instructions}
Module Scenario: ${trainingContext?.module.scenario}
Module Assessment: ${trainingContext?.module.assessment}
Module Moderator: ${trainingContext?.module.moderator}
Module CharacterPrompts: ${trainingContext?.characters.map((character) => `Character Name: ${character.name}\nCharacter Description: ${character.description}\nCharacter AI Meta Prompt: ${character.aiDescription} \n`).join("\n")}  
  `;

  return modulePrompt;
};

const generateMetaTrainingPrompts = (
  selectedOption: SelectedOption,
  trainingContext: TrainingContextData | null
) => {
  const basePrompt = "You are tasked with generating training information";

  const trainingPrompt = `
# Instructions:
${trainingPrompts[selectedOption.id].metaPrompt || basePrompt}

# Currently available training information:
Training Title: ${trainingContext?.training.title}
Training Tagline: ${trainingContext?.training.tagline}
Training Description: ${trainingContext?.training.description}

  `;

  return trainingPrompt;
};

// Generate system prompt based on context and selected option
async function generateSystemPrompt(
  characterContext: CharacterContextForAI | null,
  trainingContext: TrainingContextData | null,
  contextType?: ContextType,
  selectedOption?: SelectedOption
): Promise<string> {
  const basePrompt = "You are a helpful assistant.";

  if (!selectedOption) return basePrompt;

  const generalInstructions = `
You are an expert prompt engineer. You will be given some specific instructions and some context (if exists) to generate the most effective prompt. The prompt will be directly copied and pasted so do not include any extra text at the beginning or end of it, otherwise user will have to manually strip them out and that is very bad. Follow the instructions carefully and generate the most effective prompt.  
  `;

  switch (contextType) {
    case "character":
      return `${generalInstructions}\n${generateMetaCharacterPrompts(
        selectedOption,
        characterContext
      )}`;
    case "module":
      return `${generalInstructions}\n${generateMetaModulePrompts(
        selectedOption,
        trainingContext
      )}`;
    case "training":
      return `${generalInstructions}\n${generateMetaTrainingPrompts(
        selectedOption,
        trainingContext
      )}`;
    default:
      return basePrompt;
  }
}

export async function POST(req: Request) {
  // Check if user has sufficient credits before proceeding
  const creditCheck = await checkUserHasCredits();
  if (!creditCheck.hasCredits) {
    logger.warn("Chat request blocked due to insufficient credits");
    return new Response(
      JSON.stringify({ error: creditCheck.error || "No credits available" }),
      {
        status: 402, // Payment Required
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const {
    messages,
    contextType,
    contextData,
    selectedOption,
    apiKey,
  }: {
    messages: CoreMessage[];
    contextType?: ContextType;
    contextData?: ContextData;
    selectedOption?: SelectedOption;
    apiKey?: string;
  } = await req.json();

  const finalApiKey = apiKey || process.env.OPENAI_API_KEY;

  let characterContext: CharacterContextForAI | null = null;
  let trainingContext: TrainingContextData | null = null;

  if (contextType && contextType === "character") {
    const characterId = contextData?.characterId
      ? parseInt(contextData.characterId)
      : null;
    characterContext = characterId
      ? await getAIContextDataForCharacterAction(characterId)
      : null;
  } else {
    const trainingId = contextData?.trainingId
      ? parseInt(contextData.trainingId)
      : null;
    const moduleId = contextData?.moduleId
      ? parseInt(contextData.moduleId)
      : undefined;
    trainingContext = trainingId
      ? await getAIContextDataForTrainingAction(trainingId, moduleId)
      : null;
  }

  const systemPrompt = await generateSystemPrompt(
    characterContext,
    trainingContext,
    contextType,
    selectedOption
  );

  // Create a configured OpenAI client instance
  const openai = createOpenAI({
    apiKey: finalApiKey,
    compatibility: "strict", // Enable strict compatibility mode for proper token counting in streams
  });

  const lastMessageContent =
    messages.length > 0 ? messages[messages.length - 1].content : undefined;
  const isLastMessageAnEmptyString =
    typeof lastMessageContent === "string" && lastMessageContent.trim() === "";

  if (messages.length === 0 || isLastMessageAnEmptyString) {
    messages.push({
      role: "user",
      content:
        "Please use the relevant context in the system prompt and generate a response.",
    });
  }

  logger.debug(`Messages:`, JSON.stringify(messages, null, 2));
  logger.debug(`System Prompt:`, JSON.stringify(systemPrompt, null, 2));

  const result = streamText({
    model: openai.chat("gpt-4o"),
    system: systemPrompt,
    messages,
    temperature: 0.3,
    onError: (error) => {
      logger.error(`Stream error: ${error}`);
    },
    onFinish: async ({ usage, finishReason, text, providerMetadata }) => {
      // Log usage data when available
      if (usage) {
        logger.info(`Usage:`, usage.totalTokens);
        logger.info(`Prompt tokens:`, usage.promptTokens);
        logger.info(`Completion tokens:`, usage.completionTokens);

        // Log cached token information if available
        const cachedPromptTokens =
          typeof providerMetadata?.openai?.cachedPromptTokens === "number"
            ? providerMetadata.openai.cachedPromptTokens
            : 0;
        const notCachedPromptTokens = Math.max(
          0,
          (usage.promptTokens || 0) - cachedPromptTokens
        );
        logger.info(`Cached prompt tokens:`, cachedPromptTokens);
        logger.info(`Non-cached prompt tokens:`, notCachedPromptTokens);

        // Track usage in database
        try {
          await updatePromptHelperUsageAction({
            modelName: "gpt-4o",
            promptTokens: {
              text: {
                cached: cachedPromptTokens,
                notCached: notCachedPromptTokens,
              },
            },
            outputTokens: usage.completionTokens || 0,
            totalTokens: usage.totalTokens || 0,
          });
          logger.info(`Usage tracked successfully for prompt helper`);
        } catch (error) {
          logger.error(`Failed to track prompt helper usage: ${error}`);
          // Don't fail the request if usage tracking fails
        }
      } else {
        logger.warn(
          "Usage is null in onFinish callback - this indicates an issue"
        );
      }
      logger.info(`Finish reason:`, finishReason);
      logger.info(`Text length:`, text.length);
    },
  });

  return result.toDataStreamResponse({
    getErrorMessage: (error: unknown) => {
      logger.error(`Stream error: ${error}`);
      return `${error}`;
    },
  });
}
