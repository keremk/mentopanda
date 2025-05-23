import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getModuleByIdAction2 } from "@/app/actions/moduleActions";
import { getHistoryEntryAction } from "@/app/actions/history-actions";
import { updateAssessmentUsageAction } from "@/app/actions/usage-actions";
import { logger } from "@/lib/logger";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
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
    You are an expert in assessing human communication skills. Below you will find the specific instructions for this assessment:\n
    ${assessmentPrompt}\n
    Create a very detailed assessment properly formatted in markdown with clearly defined sections when you are presented the transcript of the conversation. Do not provide a score, only the assessment.
  `;
  const result = streamText({
    model: openai("gpt-4o"),
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
            modelName: "gpt-4o",
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
