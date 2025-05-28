"use server";

import { checkCreditAvailabilityAction } from "./usage-actions";
import { logger } from "@/lib/logger";

// Minimum credits required to proceed with any OpenAI operation
const MINIMUM_CREDITS_REQUIRED = 1;

/**
 * Get the standard insufficient credits error message
 */
export async function getInsufficientCreditsError(): Promise<string> {
  return "No credits available";
}

/**
 * Check if user has sufficient credits for OpenAI operations
 * @returns Promise<{ hasCredits: boolean; error?: string }>
 */
export async function checkUserHasCredits(): Promise<{
  hasCredits: boolean;
  error?: string;
}> {
  try {
    const creditCheck = await checkCreditAvailabilityAction(
      MINIMUM_CREDITS_REQUIRED
    );

    if (!creditCheck.hasCredits) {
      logger.warn(
        `User has insufficient credits: Available ${creditCheck.totalAvailableCredits - creditCheck.totalUsedCredits}`
      );
      return {
        hasCredits: false,
        error: "No credits available",
      };
    }

    return { hasCredits: true };
  } catch (error) {
    logger.error("Error checking user credits:", error);
    return {
      hasCredits: false,
      error: "Failed to check credit availability",
    };
  }
}
