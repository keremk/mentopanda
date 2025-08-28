import { LanguageModelUsage } from "ai";
import { logger } from "@/lib/logger";

/**
 * Aggregates multiple LanguageModelUsage objects into a single one
 */
export function aggregateUsageData(usageArray: (LanguageModelUsage | undefined)[]): LanguageModelUsage {
  const validUsages = usageArray.filter((usage): usage is LanguageModelUsage => !!usage);
  
  if (validUsages.length === 0) {
    return {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      cachedInputTokens: 0,
    };
  }

  const aggregated = validUsages.reduce((acc, usage) => ({
    inputTokens: (acc.inputTokens || 0) + (usage.inputTokens || 0),
    outputTokens: (acc.outputTokens || 0) + (usage.outputTokens || 0),
    totalTokens: (acc.totalTokens || 0) + (usage.totalTokens || 0),
    cachedInputTokens: (acc.cachedInputTokens || 0) + (usage.cachedInputTokens || 0),
  }), {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    cachedInputTokens: 0,
  });

  logger.info("Aggregated usage data:", {
    individualUsages: validUsages.length,
    aggregatedInputTokens: aggregated.inputTokens,
    aggregatedOutputTokens: aggregated.outputTokens,
    aggregatedTotalTokens: aggregated.totalTokens,
    aggregatedCachedTokens: aggregated.cachedInputTokens,
  });

  return aggregated;
}

/**
 * Maps AI SDK 5.0 usage data to our internal usage format
 */
export function mapUsageData(modelName: string, usage: LanguageModelUsage) {
  // In AI SDK 5.0, cached tokens are now part of the LanguageModelUsage object
  const cachedPromptTokens = usage.cachedInputTokens || 0;
  const totalInputTokens = usage.inputTokens || 0;
  const notCachedPromptTokens = Math.max(0, totalInputTokens - cachedPromptTokens);

  // Log usage details
  logger.info("Usage mapping details:", {
    totalTokens: usage.totalTokens,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    cachedPromptTokens,
    notCachedPromptTokens,
  });

  // Map AI SDK 5.0 usage to our internal format
  return {
    modelName,
    promptTokens: {
      text: {
        cached: cachedPromptTokens,
        notCached: notCachedPromptTokens,
      },
    },
    outputTokens: usage.outputTokens || 0,
    totalTokens: usage.totalTokens || 0,
  };
}

/**
 * Maps AI SDK 5.0 usage data and tracks it using the provided tracking function
 */
export async function trackUsage<T>(
  modelName: string,
  usage: LanguageModelUsage,
  trackingFunction: (data: T) => Promise<unknown>,
  context: string = "usage"
): Promise<void> {
  try {
    const usageData = mapUsageData(modelName, usage) as T;
    
    logger.info(`Tracking ${context} data:`, usageData);
    await trackingFunction(usageData);
    logger.info(`Usage tracked successfully for ${context}`);
  } catch (error) {
    logger.error(`Failed to track ${context} usage:`, error);
    logger.error("Error details:", {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    // Don't throw - we don't want to fail the request if usage tracking fails
  }
}

/**
 * Aggregates multiple usage data objects and tracks them with a single database call
 */
export async function trackAggregatedUsage<T>(
  modelName: string,
  usageArray: (LanguageModelUsage | undefined)[],
  trackingFunction: (data: T) => Promise<unknown>,
  context: string = "aggregated usage"
): Promise<void> {
  try {
    // Aggregate all usage data into a single object
    const aggregatedUsage = aggregateUsageData(usageArray);
    
    // Map and track the aggregated usage with a single database call
    const usageData = mapUsageData(modelName, aggregatedUsage) as T;
    
    logger.info(`Tracking ${context} data (aggregated from ${usageArray.filter(u => !!u).length} operations):`, usageData);
    await trackingFunction(usageData);
    logger.info(`Aggregated usage tracked successfully for ${context}`);
  } catch (error) {
    logger.error(`Failed to track ${context}:`, error);
    logger.error("Error details:", {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    // Don't throw - we don't want to fail the request if usage tracking fails
  }
}