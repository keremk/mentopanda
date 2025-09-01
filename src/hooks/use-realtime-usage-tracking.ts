import { useCallback, useRef } from "react";
import { logger } from "@/lib/logger";
import { MODEL_NAMES } from "@/types/models";
import {
  updateConversationUsageAction,
  updateTranscriptionUsageAction,
} from "@/app/actions/usage-actions";
import { TranscriptEntry } from "@/types/chat-types";
import { Usage } from "../hooks/use-openai-realtime";

export type UseRealtimeUsageTrackingProps = {
  transcriptionModel: string | null;
  transcriptEntries: TranscriptEntry[];
};

export function useRealtimeUsageTracking({
  transcriptionModel,
  transcriptEntries,
}: UseRealtimeUsageTrackingProps) {
  const sessionStartTimeRef = useRef<number | null>(null);

  const startSession = useCallback(() => {
    sessionStartTimeRef.current = Date.now();
  }, []);

  const logUsageMetrics = useCallback(
    async (usage: Usage | null) => {
      logger.info("[logUsageMetrics] Attempting to log usage metrics.");
      
      if (sessionStartTimeRef.current === null) {
        logger.warn(
          "[logUsageMetrics] Session start time is null. Skipping metrics logging."
        );
        return;
      }

      const endTime = Date.now();
      const elapsedTimeInSeconds = (endTime - sessionStartTimeRef.current) / 1000;

      // Calculate character counts from transcript
      let totalUserChars = 0;
      let totalAgentChars = 0;

      transcriptEntries.forEach((entry) => {
        if (entry.role === "user" && entry.text) {
          totalUserChars += entry.text.length;
        } else if (entry.role === "agent" && entry.text) {
          totalAgentChars += entry.text.length;
        }
      });

      // Track conversation usage (tokens) if available
      if (usage) {
        try {
          await updateConversationUsageAction({
            modelName: MODEL_NAMES.OPENAI_REALTIME,
            promptTokens: {
              text: {
                cached: usage.inputTokenDetails.cachedTokens,
                notCached: Math.max(0, usage.inputTokens - usage.inputTokenDetails.cachedTokens),
              },
              audio: {
                cached: usage.inputTokenDetails.cachedTokensDetails.audioTokens,
                notCached: usage.inputTokenDetails.audioTokens,
              },
            },
            outputTokens: {
              text: usage.outputTokenDetails.textTokens,
              audio: usage.outputTokenDetails.audioTokens,
            },
            totalTokens: usage.totalTokens,
            totalSessionLength: elapsedTimeInSeconds,
          });
          logger.info("Conversation usage tracked successfully");
        } catch (error) {
          logger.error(`Failed to track conversation usage: ${error}`);
        }
      }

      // Track transcription usage (characters)
      if (totalUserChars > 0 || totalAgentChars > 0) {
        try {
          await updateTranscriptionUsageAction({
            modelName: transcriptionModel || MODEL_NAMES.OPENAI_TRANSCRIBE,
            totalSessionLength: elapsedTimeInSeconds,
            userChars: totalUserChars,
            agentChars: totalAgentChars,
          });
          logger.info("Transcription usage tracked successfully");
        } catch (error) {
          logger.error(`Failed to track transcription usage: ${error}`);
        }
      }

      sessionStartTimeRef.current = null;
    },
    [transcriptionModel, transcriptEntries]
  );

  return {
    startSession,
    logUsageMetrics,
  };
}