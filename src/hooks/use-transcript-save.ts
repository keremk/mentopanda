import { useCallback, useEffect, useRef } from "react";
import { updateHistoryEntryAction } from "@/app/actions/history-actions";
import { TranscriptEntry } from "@/types/chat-types";
import { convertHistoryToTranscript, formatTranscriptToText } from "@/utils/transcript-utils";

type UseTranscriptSaveProps = {
  historyEntryId?: number;
  transcriptBuffer: TranscriptEntry[];
  saveInterval?: number; // in milliseconds
};

export function useTranscriptSave({
  historyEntryId,
  transcriptBuffer,
  saveInterval = 30000, // default to 30 seconds
}: UseTranscriptSaveProps) {
  const lastSavedTranscriptRef = useRef<string>("");
  const transcriptBufferRef = useRef<TranscriptEntry[]>(transcriptBuffer);

  // Keep transcriptBufferRef updated with the latest transcriptBuffer
  useEffect(() => {
    transcriptBufferRef.current = transcriptBuffer;
  }, [transcriptBuffer]);

  const formatTranscript = useCallback((buffer: TranscriptEntry[]) => {
    return buffer
      .map((entry) => `${entry.participantName}: ${entry.text}`)
      .join("\n");
  }, []);

  const saveTranscript = useCallback(
    async (isComplete = false) => {
      if (!historyEntryId) return;

      const currentBuffer = transcriptBufferRef.current;
      if (currentBuffer.length === 0 && !isComplete) return; // Don't save empty buffer unless completing

      const formattedTranscript = formatTranscript(currentBuffer);
      const currentTranscriptString = JSON.stringify(currentBuffer);

      // Only save if transcript has changed, using JSON.stringify for comparison
      if (
        currentTranscriptString === lastSavedTranscriptRef.current &&
        !isComplete
      ) {
        return; // Skip save if content is identical and not completing
      }

      // Always update completion status if isComplete is true
      if (
        currentTranscriptString === lastSavedTranscriptRef.current &&
        isComplete
      ) {
        await updateHistoryEntryAction({
          id: historyEntryId,
          completedAt: new Date(),
        });
        return; // Only update completion status
      }

      // Perform the update
      await updateHistoryEntryAction({
        id: historyEntryId,
        transcript: currentBuffer,
        transcriptText: formattedTranscript,
        ...(isComplete ? { completedAt: new Date() } : {}),
      });
      lastSavedTranscriptRef.current = currentTranscriptString;
    },
    // Dependencies: historyEntryId and formatTranscript. transcriptBufferRef is stable.
    [historyEntryId, formatTranscript]
  );

  // Set up periodic saving
  useEffect(() => {
    const intervalId = setInterval(() => {
      saveTranscript(false);
    }, saveInterval);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [saveTranscript, saveInterval]);

  // Save when component unmounts or historyEntryId changes (e.g., on first save)
  useEffect(() => {
    return () => {
      // Ensure final save attempt on unmount if historyEntryId exists
      if (historyEntryId) {
        saveTranscript(false).catch(console.error);
      }
    };
    // Run cleanup only when component unmounts or saveTranscript changes
  }, [saveTranscript, historyEntryId]);

  // Save final transcript from OpenAI session history
  const saveFinalTranscript = useCallback(
    async (finalHistory: unknown[]) => {
      if (!historyEntryId) return;

      // Convert OpenAI's session history to clean transcript entries
      const cleanTranscript = convertHistoryToTranscript(finalHistory);
      const formattedTranscript = formatTranscriptToText(cleanTranscript);

      // Always save the final, clean version (overwriting any intermediate saves)
      await updateHistoryEntryAction({
        id: historyEntryId,
        transcript: cleanTranscript,
        transcriptText: formattedTranscript,
        completedAt: new Date(),
      });

      lastSavedTranscriptRef.current = JSON.stringify(cleanTranscript);
    },
    [historyEntryId]
  );

  return {
    saveTranscript,
    saveAndComplete: useCallback(() => saveTranscript(true), [saveTranscript]),
    saveFinalTranscript,
  };
}
