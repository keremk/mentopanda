"use server";

import {
  CURRENT_MODEL_NAMES,
  DEFAULT_VOICE,
  MODEL_NAMES,
} from "@/types/models";
import { logger } from "@/lib/logger";
import { checkUserHasCredits } from "./credit-check";

type CreateOpenAISessionParams = {
  apiKey?: string;
  voice?: string;
  instructions?: string;
  forceEnglishTranscription?: boolean; // New optional parameter
};

type CreateOpenAISessionResult = {
  session: {
    client_secret: {
      value: string;
    };
    [key: string]: unknown; // Allow other properties
  };
  transcriptionModel: string; // Return the actual model used
};

export async function createOpenAISession({
  apiKey,
  voice,
  instructions,
  forceEnglishTranscription = true, // Default to true for better transcription
}: CreateOpenAISessionParams): Promise<CreateOpenAISessionResult> {
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

    // Enhanced transcription configuration to prevent language mixing
    const transcriptionConfig = forceEnglishTranscription
      ? {
          model: MODEL_NAMES.OPENAI_TRANSCRIBE, // Better than whisper-1
          language: "en", // Force English transcription
          prompt:
            "Transcribe this audio in English only. The speaker may have an accent, but always transcribe in English. Do not translate to other languages like Finnish, Spanish, or any other language.",
        }
      : {
          model: MODEL_NAMES.OPENAI_WHISPER, // Fallback to original
        };

    const transcriptionModel = transcriptionConfig.model;

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
          input_audio_transcription: transcriptionConfig,
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
    logger.info(`Realtime session established with ${JSON.stringify(session)}`)
    return { session, transcriptionModel };
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
