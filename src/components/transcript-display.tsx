"use client";

import { TranscriptEntry } from "@/types/chat-types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";

type TranscriptDisplayProps = {
  transcript: TranscriptEntry[];
};

export function TranscriptDisplay({ transcript }: TranscriptDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="h-[400px] relative">
      <ScrollArea className="h-full absolute inset-0">
        <div className="space-y-4 p-4">
          {transcript.map((entry, index) => (
            <div
              key={index}
              className={cn(
                "flex",
                entry.role === "user"
                  ? "justify-end"
                  : "justify-start"
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
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
