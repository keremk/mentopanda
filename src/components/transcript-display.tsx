"use client";

import { TranscriptEntry } from "@/types/chat-types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";
import { useTranscript } from "@/contexts/transcript";

type TranscriptDisplayProps = {
  transcriptEntries: TranscriptEntry[];
};

export function TranscriptDisplay({ transcriptEntries }: TranscriptDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // const { transcriptEntries } = useTranscript();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptEntries]);

  return (
    <div className="h-[400px] relative">
      <ScrollArea className="h-full absolute inset-0">
        <div className="space-y-4 p-4">
          {transcriptEntries.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
              <p>No messages yet.</p>
            </div>
          ) : (
            transcriptEntries.map((entry, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  entry.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 max-w-[80%] shadow-sm",
                    entry.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm leading-relaxed break-words">
                    {entry.text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
