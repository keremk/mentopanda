"use server";

import OpenAI from "openai";
import { checkUserHasCredits } from "./credit-check";
import { logger } from "@/lib/logger";
import { MODEL_NAMES } from "@/types/models";

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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const session = await openai.beta.realtime.sessions.create({
      model: MODEL_NAMES.OPENAI_REALTIME,
      // tracing: {
      //   workflow_name: "MentoPanda mentor agent",
      // },
    });

    return session.client_secret.value;
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
