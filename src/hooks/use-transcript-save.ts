import { useCallback, useEffect, useRef } from "react";
import { updateHistoryEntryAction } from "@/app/(app)/historyActions";

type TranscriptEntry = {
  participantName: string;
  text: string;
};

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
  const lastSavedTranscript = useRef<string>("");

  const formatTranscript = useCallback((buffer: TranscriptEntry[]) => {
    return buffer
      .map((entry) => `${entry.participantName}: ${entry.text}`)
      .join("\n");
  }, []);

  const saveTranscript = useCallback(
    async (isComplete = false) => {
      if (!historyEntryId || transcriptBuffer.length === 0) return;

      const formattedTranscript = formatTranscript(transcriptBuffer);

      // Only save if transcript has changed
      if (formattedTranscript === lastSavedTranscript.current) return;
      try {
        await updateHistoryEntryAction({
          id: historyEntryId,
          transcript: formattedTranscript,
          ...(isComplete ? { completedAt: new Date() } : {}),
        });
        lastSavedTranscript.current = formattedTranscript;
      } catch (error) {
        console.error("Failed to save transcript:", error);
      }
    },
    [historyEntryId, transcriptBuffer, formatTranscript]
  );

  // Set up periodic saving
  useEffect(() => {
    const intervalId = setInterval(() => {
      saveTranscript(false);
    }, saveInterval);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [saveTranscript, saveInterval]);

  // Save when component unmounts
  useEffect(() => {
    return () => {
      saveTranscript(false).catch(console.error);
    };
  }, [saveTranscript]);

  return {
    saveTranscript,
    saveAndComplete: useCallback(() => saveTranscript(true), [saveTranscript]),
  };
}
