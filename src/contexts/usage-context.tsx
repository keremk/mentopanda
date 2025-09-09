"use client";

import React, { createContext, useContext, useCallback, useRef, ReactNode } from "react";
import { logger } from "@/lib/logger";
import { MODEL_NAMES } from "@/types/models";
import {
  updateConversationUsageAction,
  updateTranscriptionUsageAction,
} from "@/app/actions/usage-actions";
import { RealtimeUsage, TranscriptionUsage } from "@/types/realtime";
import { useTranscript } from "@/contexts/transcript";

interface UsageContextValue {
  startSession: () => void;
  logUsageMetrics: (usage: RealtimeUsage | null, transcriptionUsage: TranscriptionUsage | null, transcriptionModel?: string | null) => Promise<void>;
}

const UsageContext = createContext<UsageContextValue | undefined>(undefined);

interface UsageProviderProps {
  children: ReactNode;
}

export function UsageProvider({ children }: UsageProviderProps) {
  // Automatically get transcript entries from context
  const { transcriptEntries } = useTranscript();
  const sessionStartTimeRef = useRef<number | null>(null);

  const startSession = useCallback(() => {
    sessionStartTimeRef.current = Date.now();
    logger.info("[UsageProvider] Session started");
  }, []);

  const logUsageMetrics = useCallback(
    async (usage: RealtimeUsage | null, transcriptionUsage: TranscriptionUsage | null, transcriptionModel: string | null = null) => {
      logger.info("[UsageProvider] Attempting to log usage metrics:", { 
        usage,
        transcriptionUsage, 
        transcriptionModel, 
        sessionStartTime: sessionStartTimeRef.current,
        transcriptEntriesCount: transcriptEntries.length 
      });
      
      if (sessionStartTimeRef.current === null) {
        logger.warn(
          "[UsageProvider] Session start time is null. Skipping metrics logging."
        );
        return;
      }

      const endTime = Date.now();
      const elapsedTimeInSeconds = (endTime - sessionStartTimeRef.current) / 1000;

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
          logger.info("[UsageProvider] Conversation usage tracked successfully");
        } catch (error) {
          logger.error(`[UsageProvider] Failed to track conversation usage: ${error}`);
        }
      }

      // Track transcription usage (tokens)
      if (transcriptionUsage) {
        try {
          await updateTranscriptionUsageAction({
            modelName: transcriptionModel || MODEL_NAMES.OPENAI_TRANSCRIBE,
            totalSessionLength: elapsedTimeInSeconds,
            inputTokens: transcriptionUsage.inputTokens,
            outputTokens: transcriptionUsage.outputTokens,
            totalTokens: transcriptionUsage.totalTokens,
            inputTextTokens: transcriptionUsage.inputTokenDetails.textTokens,
            inputAudioTokens: transcriptionUsage.inputTokenDetails.audioTokens,
          });
          logger.info("[UsageProvider] Transcription usage tracked successfully");
        } catch (error) {
          logger.error(`[UsageProvider] Failed to track transcription usage: ${error}`);
        }
      }

      sessionStartTimeRef.current = null;
    },
    [transcriptEntries]
  );

  const value: UsageContextValue = {
    startSession,
    logUsageMetrics,
  };

  return (
    <UsageContext.Provider value={value}>
      {children}
    </UsageContext.Provider>
  );
}

export function useUsage(): UsageContextValue {
  const context = useContext(UsageContext);
  if (context === undefined) {
    throw new Error("useUsage must be used within a UsageProvider");
  }
  return context;
}