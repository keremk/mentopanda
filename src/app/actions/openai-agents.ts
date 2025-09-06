"use server";

import { checkUserHasCredits } from "./credit-check";
import { logger } from "@/lib/logger";
import { CURRENT_MODEL_NAMES } from "@/types/models";

export async function getToken() {
  try {
    // Check if user has sufficient credits before proceeding
    const creditCheck = await checkUserHasCredits();
    if (!creditCheck.hasCredits) {
      logger.warn(
        "OpenAI agents session creation blocked due to insufficient user credits"
      );
      throw new Error(creditCheck.error || "No credits available");
    }

    // Just get an ephemeral token - session config will be done on client side
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: CURRENT_MODEL_NAMES.OPENAI,
          voice: "alloy", // Default voice, can be overridden on client
        }),
      }
    );

    logger.info(`Token fetch response status: ${response.status}`);
    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Session data:", JSON.stringify(data));
    return data.client_secret.value;
  } catch (error) {
    logger.error("Error creating OpenAI agents session:", error);

    // Preserve credit-related errors
    if (error instanceof Error && error.message === "No credits available") {
      throw error;
    }

    // For other errors, throw a generic message
    throw new Error("Failed to create OpenAI agents session");
  }
}
