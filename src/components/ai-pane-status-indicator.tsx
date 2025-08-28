"use client";

import { useAIPane } from "@/contexts/ai-pane-context";
import { cn } from "@/lib/utils";

export function AIPaneStatusIndicator() {
  const { status, error, messages } = useAIPane();

  // Show loading only when a request is active AND the last message was from the user
  const showLoading =
    status === "streaming" &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "user";
  const showError = error !== undefined;

  if (!showLoading && !showError) {
    return null; // Render nothing if idle and no error
  }

  return (
    <div className="px-3 py-2 border-t border-border/20">
      {showLoading && (
        <div className="text-xs text-muted-foreground flex items-center">
          <span>Generating</span>
          <span className="ml-1 inline-flex">
            <span className="animate-[bounce_1s_infinite_0ms]">.</span>
            <span className="animate-[bounce_1s_infinite_200ms]">.</span>
            <span className="animate-[bounce_1s_infinite_400ms]">.</span>
          </span>
        </div>
      )}
      {showError && (
        <div
          className={cn(
            "bg-danger/10 text-danger border border-danger/20 rounded-md p-2 text-xs"
          )}
        >
          <p className="font-medium">Error:</p>
          <p>{error.message || "An unexpected error occurred."}</p>
        </div>
      )}
    </div>
  );
}
