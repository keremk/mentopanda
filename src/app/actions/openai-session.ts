"use server";

import { CURRENT_MODEL_NAMES, DEFAULT_VOICE } from "@/types/models";
import { logger } from "@/lib/logger";
import { checkUserHasCredits } from "./credit-check";

type CreateOpenAISessionParams = {
  apiKey?: string;
  voice?: string;
  instructions?: string;
};

export async function createOpenAISession({
  apiKey,
  voice,
  instructions,
}: CreateOpenAISessionParams) {
  try {
    // Check if user has sufficient credits before proceeding
    const creditCheck = await checkUserHasCredits();
    if (!creditCheck.hasCredits) {
      logger.warn(
        "OpenAI session creation blocked due to insufficient credits"
      );
      throw new Error(creditCheck.error || "No credits available");
    }

    const finalApiKey = apiKey || process.env.OPENAI_API_KEY;

    if (!finalApiKey) throw new Error("OpenAI API key is required");

    const finalVoice = (voice || DEFAULT_VOICE).toLowerCase();
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${finalApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: CURRENT_MODEL_NAMES.OPENAI,
          voice: finalVoice,
          input_audio_transcription: {
            model: "whisper-1",
          },
          instructions,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || "Failed to create OpenAI session with token"
      );
    }

    const session = await response.json();
    return { session };
  } catch (error) {
    logger.error("Error creating OpenAI session:", error);

    // Preserve credit-related errors
    if (error instanceof Error && error.message === "No credits available") {
      throw error;
    }

    // For other errors, throw a generic message
    throw new Error("Failed to create OpenAI session");
  }
}
