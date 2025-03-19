"use client";

import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { AIPanePromptBox } from "./aipane-prompt-box";
import { AIPaneResponses } from "./aipane-responses";
import { AIPaneProvider } from "./ai-pane-context";

type AIPaneProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AIPane({ isOpen, onClose }: AIPaneProps) {
  if (!isOpen) return null;

  return (
    <div className="w-1/3 flex flex-col border-l border-border/30">
      {/* Header - aligns with tabs */}
      <div className="h-12 flex items-center justify-between px-3 border-b border-border/20">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">AI Assistant</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 hover:bg-secondary/50"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Main content area */}
      <AIPaneProvider>
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <AIPaneResponses />
          </div>

          <div className="border-t border-border/20">
            <AIPanePromptBox />
          </div>
        </div>
      </AIPaneProvider>
    </div>
  );
}

export default AIPane;
