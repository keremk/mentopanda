import {
  type UIMessage,
  streamText,
  convertToModelMessages,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
  ContextType,
  ContextData,
  SelectedOption,
} from "@/contexts/ai-pane-context";
import modulePrompts from "@/prompts/module-prompts";
import trainingPrompts from "@/prompts/training-prompts";
import {
  getAIContextDataForCharacterAction,
  getAIContextDataForTrainingAction,
} from "@/app/actions/aicontext-actions";
import { trackUsage } from "@/lib/usage/usage-mapper";
import { updatePromptHelperUsageAction } from "@/app/actions/usage-actions";
import { TrainingContextData } from "@/data/ai-context";
import { CharacterContextForAI } from "@/data/characters";
import { logger } from "@/lib/logger";
import { checkUserHasCredits } from "@/app/actions/credit-check";
import { MODEL_NAMES } from "@/types/models";

const generateMetaModulePrompts = (
  selectedOption: SelectedOption,
  trainingContext: TrainingContextData | null
) => {
  const basePrompt = "You are tasked with generating module information";

  const modulePrompt = `
# Instructions:
${modulePrompts[selectedOption.id]?.metaPrompt || basePrompt}

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
${trainingPrompts[selectedOption.id]?.metaPrompt || basePrompt}

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
      throw new Error(
        "Character context is not supported yet in this endpoint. Please use the training context instead."
      );
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
  logger.info("=== Chat API Request Started ===");

  // Check if user has sufficient credits before proceeding
  const creditCheck = await checkUserHasCredits();
  logger.info("Credit check result:", creditCheck);

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
    messages: UIMessage[];
    contextType?: ContextType;
    contextData?: ContextData;
    selectedOption?: SelectedOption;
    apiKey?: string;
  } = await req.json();

  logger.info("Request payload:", {
    messagesCount: messages?.length || 0,
    contextType,
    contextData,
    selectedOption,
    hasApiKey: !!apiKey,
  });

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

  logger.info("Generated system prompt length:", systemPrompt.length);
  logger.info("Context data loaded:", {
    hasCharacterContext: !!characterContext,
    hasTrainingContext: !!trainingContext,
  });

  // Create a configured OpenAI client instance
  const openai = createOpenAI({
    apiKey: finalApiKey,
  });

  // Check if the last message is empty (for UIMessages, check if text parts are empty)
  const lastMessage =
    messages.length > 0 ? messages[messages.length - 1] : null;
  const lastMessageText =
    lastMessage?.parts
      ?.filter((part) => part.type === "text")
      ?.map((part) => part.text)
      ?.join("") || "";
  const isLastMessageEmpty = lastMessageText.trim() === "";

  if (messages.length === 0 || isLastMessageEmpty) {
    messages.push({
      id: `system-${Date.now()}`,
      role: "user",
      parts: [
        {
          type: "text",
          text: "Please use the relevant context in the system prompt and generate a response.",
        },
      ],
    });
  }

  logger.info(
    "Final messages for AI:",
    messages.map((m) => ({
      role: m.role,
      partsCount: m.parts?.length || 0,
      textContent:
        m.parts?.find((p) => p.type === "text")?.text?.substring(0, 50) || "",
    }))
  );
  logger.debug(`System Prompt:`, JSON.stringify(systemPrompt, null, 2));

  const result = streamText({
    model: openai.chat(MODEL_NAMES.OPENAI_GPT4O),
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    temperature: 0.3,
    onError: (error) => {
      logger.error(`Stream error: ${error}`);
    },
  });

  logger.info("=== Returning AI Response Stream ===");

  return result.toUIMessageStreamResponse({
    messageMetadata: async ({ part }) => {
      // Handle usage tracking when generation is finished
      if (part.type === "finish") {
        logger.info("=== AI Response Complete ===");
        logger.info(`Finish reason:`, part.finishReason);

        // Track usage and wait for it to complete
        if (part.totalUsage) {
          await trackUsage(
            MODEL_NAMES.OPENAI_GPT4O,
            part.totalUsage,
            updatePromptHelperUsageAction,
            "prompt helper"
          );
        } else {
          logger.warn("Total usage is null - this indicates an issue");
        }
      }

      // Don't return any metadata to the client
      return undefined;
    },
    onError: (error: unknown) => {
      logger.error(`Stream response error:`, error);
      return `${error}`;
    },
  });
}
