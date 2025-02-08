"use server";

import { CURRENT_MODEL_NAMES, DEFAULT_VOICE } from "@/types/models";

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
    console.error("Error creating OpenAI session:", error);
    throw new Error("Failed to create OpenAI session");
  }
}
