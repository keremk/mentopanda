"use client";

import React, {
  createContext,
  useContext,
  useState,
  PropsWithChildren,
} from "react";
import { TranscriptEntry } from "@/types/chat-types";

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
};

const TranscriptContext = createContext<TranscriptContextValue | undefined>(
  undefined
);

export const TranscriptProvider = ({ children }: PropsWithChildren) => {
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);

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
    setTranscriptEntries((prev) => {
      if (prev.some((log) => log.id === entryId)) {
        console.warn(
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

      return [...prev, newItem];
    });
  };

  const updateTranscriptMessage: TranscriptContextValue["updateTranscriptMessage"] =
    (entryId, newText, append = false) => {
      setTranscriptEntries((prev) =>
        prev.map((item) => {
          if (item.id === entryId) {
            return {
              ...item,
              text: append ? (item.text ?? "") + newText : newText,
            };
          }
          return item;
        })
      );
    };

  const updateTranscriptEntryStatus: TranscriptContextValue["updateTranscriptEntryStatus"] =
    (entryId, newStatus) => {
      setTranscriptEntries((prev) =>
        prev.map((item) =>
          item.id === entryId ? { ...item, status: newStatus } : item
        )
      );
    };

  const clearTranscript = () => {
    setTranscriptEntries([]);
  };

  return (
    <TranscriptContext.Provider
      value={{
        transcriptEntries,
        addTranscriptMessage,
        updateTranscriptMessage,
        updateTranscriptEntryStatus,
        clearTranscript,
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
