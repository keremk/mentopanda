import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getModuleByIdAction2 } from "@/app/actions/moduleActions";
import { getHistoryEntryAction } from "@/app/actions/history-actions";
import { updateAssessmentUsageAction } from "@/app/actions/usage-actions";
import { logger } from "@/lib/logger";
import { checkUserHasCredits } from "@/app/actions/credit-check";
import { MODEL_NAMES } from "@/types/models";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  // Check if user has sufficient credits before proceeding
  const creditCheck = await checkUserHasCredits();
  if (!creditCheck.hasCredits) {
    logger.warn("Completion request blocked due to insufficient credits");
    return new Response(
      JSON.stringify({ error: creditCheck.error || "No credits available" }),
      {
        status: 402, // Payment Required
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const {
    moduleId,
    entryId,
    apiKey,
  }: { moduleId: number; entryId: number; apiKey?: string } = await req.json();

  const finalApiKey = apiKey || process.env.OPENAI_API_KEY;

  if (!finalApiKey) {
    logger.error("No API key provided");
    return new Response(JSON.stringify({ error: "No API key provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const [module, historyEntry] = await Promise.all([
    getModuleByIdAction2(moduleId),
    getHistoryEntryAction(entryId),
  ]);

  if (!module) {
    logger.error(`Module not found for moduleId: ${moduleId}`);
    return new Response(JSON.stringify({ error: "Module not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!historyEntry) {
    logger.error(`History entry not found for entryId: ${entryId}`);
    return new Response(JSON.stringify({ error: "History entry not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const assessmentPrompt = module.modulePrompt.assessment;

  const openai = createOpenAI({
    apiKey: finalApiKey,
    compatibility: "strict", // Enable strict compatibility mode for proper token counting in streams
  });

  const systemPrompt = `
  You are an expert in assessing the user's performance based on the criteria provided. You will be given a transcript of the conversation and you will need to evaluate the user's performance on each criterion. Be as thorough as possible in your assessment.
  <assessment_criteria>
  ${assessmentPrompt}\n
  </assessment_criteria>
  Make sure to provide a summary of the assessment criteria at the end. For each criterion, always provide examples of supporting evidence, a rating based on the guidelines and evidence, and a suggestion on how to improve the user's performance based on the examples from the transcript. Always use one of the 3 ratings for each criterion. (Excellent, Good, Needs Improvement).
  Create a very detailed assessment report properly formatted in markdown with clearly defined sections as instructed above. 
  `;

  logger.info(`System prompt:`, systemPrompt);

  const result = streamText({
    model: openai(MODEL_NAMES.OPENAI_GPT4O),
    system: systemPrompt,
    prompt: `Transcript:\n
     ${historyEntry.transcriptText}
     `,
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
          await updateAssessmentUsageAction({
            modelName: MODEL_NAMES.OPENAI_GPT4O,
            promptTokens: {
              text: {
                cached: cachedPromptTokens,
                notCached: notCachedPromptTokens,
              },
            },
            outputTokens: usage.completionTokens || 0,
            totalTokens: usage.totalTokens || 0,
          });
          logger.info(`Usage tracked successfully for assessment`);
        } catch (error) {
          logger.error(`Failed to track usage: ${error}`);
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
