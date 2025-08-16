"use client";

import { TranscriptEntry } from "@/types/chat-types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";

type TranscriptDisplayProps = {
  transcriptEntries: TranscriptEntry[];
};

export function TranscriptDisplay({
  transcriptEntries,
}: TranscriptDisplayProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcriptEntries]);

  return (
    <div className="h-full relative">
      <ScrollArea className="h-full">
        <div className="space-y-4 p-4">
          {transcriptEntries.length === 0 ? (
            <div className="flex items-center justify-center text-muted-foreground text-sm">
              <p>No messages yet.</p>
            </div>
          ) : (
            <>
              {transcriptEntries.map((entry, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    entry.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 max-w-[80%] shadow-xs",
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
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
