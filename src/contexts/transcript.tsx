"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  PropsWithChildren,
} from "react";
import { TranscriptEntry } from "@/types/chat-types";
import { logger } from "@/lib/logger";
import {
  createHistoryEntryAction,
  updateHistoryEntryAction,
  deleteHistoryEntryAction,
} from "@/app/actions/history-actions";

type TranscriptContextValue = {
  transcriptEntries: TranscriptEntry[];
  addTranscriptMessage: (
    entryId: string,
    participantName: string,
    role: "user" | "agent",
    text: string,
    hidden?: boolean
  ) => void;
  updateTranscriptMessage: (
    entryId: string,
    text: string,
    isDelta: boolean
  ) => void;
  updateTranscriptEntryStatus: (
    entryId: string,
    newStatus: "IN_PROGRESS" | "DONE"
  ) => void;
  clearTranscript: () => void;
  // History and saving functionality
  historyEntryId?: number;
  initializeHistoryEntry: (moduleId: number) => Promise<number>;
  deleteHistoryEntry: () => Promise<void>;
  saveTranscript: () => Promise<void>;
  saveAndComplete: () => Promise<void>;
  isAutoSaving: boolean;
  lastSavedAt?: Date;
};

const TranscriptContext = createContext<TranscriptContextValue | undefined>(
  undefined
);

type TranscriptProviderProps = PropsWithChildren<{
  saveInterval?: number; // in milliseconds
}>;

export const TranscriptProvider = ({
  children,
  saveInterval = 20000, // default to 20 seconds
}: TranscriptProviderProps) => {
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>(
    []
  );
  const [historyEntryId, setHistoryEntryId] = useState<number>();
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date>();

  // Refs for tracking save state
  const lastSavedTranscriptRef = useRef<string>("");
  const transcriptBufferRef = useRef<TranscriptEntry[]>([]);

  function formattedTimestamp(): string {
    return new Date().toLocaleTimeString([], {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  const addTranscriptMessage: TranscriptContextValue["addTranscriptMessage"] = (
    entryId,
    participantName,
    role,
    text = "",
    isHidden = false
  ) => {
    // logger.debug(
    //   `[addTranscriptMessage] Adding entry ${entryId}, role=${role}, text="${text}"`
    // );
    setTranscriptEntries((prev) => {
      if (prev.some((log) => log.id === entryId)) {
        logger.warn(
          `[addTranscriptMessage] skipping; message already exists for entryId=${entryId}, role=${role}, text=${text}`
        );
        return prev;
      }

      const newItem: TranscriptEntry = {
        id: entryId,
        participantName,
        role,
        text,
        timestamp: formattedTimestamp(),
        createdAtMs: Date.now(),
        status: "IN_PROGRESS",
        isHidden,
      };

      const updated = [...prev, newItem];
      // logger.debug(
      //   `[addTranscriptMessage] Added entry. Total entries: ${updated.length}, IDs: [${updated.map((e) => e.id).join(", ")}]`
      // );
      return updated;
    });
  };

  const updateTranscriptMessage: TranscriptContextValue["updateTranscriptMessage"] =
    (entryId, newText, isDelta = false) => {
      // logger.debug(`[updateTranscriptMessage] entryId=${entryId}, newText="${newText}", isDelta=${isDelta}`);
      setTranscriptEntries((prev) => {
        // logger.debug(
        //   `[updateTranscriptMessage] Current entries: ${prev.length}, IDs: [${prev.map((e) => e.id).join(", ")}]`
        // );

        const targetEntry = prev.find((item) => item.id === entryId);
        if (!targetEntry) {
          logger.error(
            `[updateTranscriptMessage] Entry with ID ${entryId} not found! Available IDs: [${prev.map((e) => e.id).join(", ")}]`
          );
          return prev;
        }

        const updated = prev.map((item) => {
          if (item.id === entryId) {
            const updatedText = isDelta ? (item.text ?? "") + newText : newText;
            // logger.debug(
            //   `[updateTranscriptMessage] Updating entry ${entryId}: "${item.text}" -> "${updatedText}"`
            // );
            return {
              ...item,
              text: updatedText,
            };
          }
          return item;
        });
        // logger.debug(
        //   `[updateTranscriptMessage] Transcript entries updated: ${updated.length} total`
        // );
        return updated;
      });
    };

  const updateTranscriptEntryStatus: TranscriptContextValue["updateTranscriptEntryStatus"] =
    (entryId, newStatus) => {
      setTranscriptEntries((prev) =>
        prev.map((item) =>
          item.id === entryId ? { ...item, status: newStatus } : item
        )
      );
    };

  const clearTranscript = useCallback(() => {
    setTranscriptEntries([]);
    transcriptBufferRef.current = [];
    lastSavedTranscriptRef.current = "";
    setHistoryEntryId(undefined);
    setLastSavedAt(undefined);
  }, []);

  // Keep transcriptBufferRef updated with the latest transcriptEntries
  useEffect(() => {
    transcriptBufferRef.current = transcriptEntries;
  }, [transcriptEntries]);

  const formatTranscript = useCallback((buffer: TranscriptEntry[]) => {
    return buffer
      .map((entry) => `${entry.participantName}: ${entry.text}`)
      .join("\n");
  }, []);

  const initializeHistoryEntry = useCallback(
    async (moduleId: number): Promise<number> => {
      try {
        const entry = await createHistoryEntryAction(moduleId);
        setHistoryEntryId(entry);
        logger.info(`Created history entry with ID: ${entry}`);
        return entry;
      } catch (error) {
        logger.error("Failed to create history entry:", error);
        throw error;
      }
    },
    []
  );

  const deleteHistoryEntry = useCallback(async (): Promise<void> => {
    if (!historyEntryId) return;

    try {
      await deleteHistoryEntryAction(historyEntryId);
      setHistoryEntryId(undefined);
      logger.info(`Deleted history entry with ID: ${historyEntryId}`);
    } catch (error) {
      logger.error("Failed to delete history entry:", error);
      throw error;
    }
  }, [historyEntryId]);

  const saveTranscript = useCallback(
    async (isComplete = false): Promise<void> => {
      if (!historyEntryId) return;

      setIsAutoSaving(true);
      try {
        const currentBuffer = transcriptBufferRef.current;
        if (currentBuffer.length === 0 && !isComplete) return;

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
          setLastSavedAt(new Date());
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
        setLastSavedAt(new Date());

        logger.info(
          `Saved transcript for history entry ${historyEntryId}${isComplete ? " (completed)" : ""}`
        );
      } catch (error) {
        logger.error("Failed to save transcript:", error);
        throw error;
      } finally {
        setIsAutoSaving(false);
      }
    },
    [historyEntryId, formatTranscript]
  );

  const saveAndComplete = useCallback(async (): Promise<void> => {
    await saveTranscript(true);
  }, [saveTranscript]);

  // Set up periodic saving
  useEffect(() => {
    if (!historyEntryId) return;

    const intervalId = setInterval(() => {
      saveTranscript(false).catch((error) => {
        logger.error("Auto-save failed:", error);
      });
    }, saveInterval);

    // Clean up interval on unmount or when historyEntryId changes
    return () => clearInterval(intervalId);
  }, [saveTranscript, saveInterval, historyEntryId]);

  // Save when component unmounts
  useEffect(() => {
    return () => {
      // Ensure final save attempt on unmount if historyEntryId exists
      if (historyEntryId) {
        saveTranscript(false).catch((error) => {
          logger.error("Final save on unmount failed:", error);
        });
      }
    };
  }, [historyEntryId, saveTranscript]);

  return (
    <TranscriptContext.Provider
      value={{
        transcriptEntries,
        addTranscriptMessage,
        updateTranscriptMessage,
        updateTranscriptEntryStatus,
        clearTranscript,
        historyEntryId,
        initializeHistoryEntry,
        deleteHistoryEntry,
        saveTranscript,
        saveAndComplete,
        isAutoSaving,
        lastSavedAt,
      }}
    >
      {children}
    </TranscriptContext.Provider>
  );
};

export function useTranscript() {
  const context = useContext(TranscriptContext);
  if (!context) {
    throw new Error("useTranscript must be used within a TranscriptProvider");
  }
  return context;
}
