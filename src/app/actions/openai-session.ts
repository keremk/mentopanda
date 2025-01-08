"use server";

import { AI_MODELS } from "@/types/models";

type GetSpeechTokenParams = {
  apiKey?: string;
  voice?: string;
};

export async function getSpeechToken({ apiKey, voice }: GetSpeechTokenParams) {
  try {
    const finalApiKey = apiKey || process.env.OPENAI_API_KEY;

    if (!finalApiKey) throw new Error("OpenAI API key is required");

    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${finalApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: AI_MODELS.OPENAI_REALTIME,
          voice,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to get speech token");
    }

    const token = await response.json();
    return { token };
  } catch (error) {
    console.error("Error getting OpenAI speech token:", error);
    throw new Error("Failed to get speech token");
  }
}
