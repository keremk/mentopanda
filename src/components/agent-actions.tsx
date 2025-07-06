"use client";

import React, { useEffect, useRef } from "react";
import {
  useAgentActions,
  type StatusStep,
} from "@/contexts/agent-actions-context";
import { MemoizedMarkdown } from "@/components/memoized-markdown";

// Status icon component
function StatusIcon({ status }: { status: StatusStep["status"] }) {
  switch (status) {
    case "pending":
      return <span className="text-gray-400">⏳</span>;
    case "in_progress":
      return <span className="text-blue-500 animate-spin">⏳</span>;
    case "completed":
      return <span className="text-green-500">✅</span>;
    case "error":
      return <span className="text-red-500">❌</span>;
    default:
      return <span className="text-gray-400">⏳</span>;
  }
}

export function AgentActions() {
  const { steps } = useAgentActions();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [steps.length]);

  return (
    <div className="w-full max-h-48 overflow-y-auto border rounded-md p-3 bg-muted/40">
      {steps.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-4">
          No active operations
        </div>
      ) : (
        <ul className="space-y-2">
          {steps.map((step) => (
            <li key={step.id} className="flex items-start gap-2 text-sm">
              <StatusIcon status={step.status} />
              <div className="flex-1 min-w-0">
                <div className="leading-tight">{step.label}</div>
                {step.message && (
                  <div className="text-xs text-muted-foreground mt-1">
                    <MemoizedMarkdown content={step.message} />
                  </div>
                )}
                {step.timestamp && (
                  <div className="text-xs text-muted-foreground">
                    {step.timestamp.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </li>
          ))}
          <div ref={endRef} />
        </ul>
      )}
    </div>
  );
}
