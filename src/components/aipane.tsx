"use client";

import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { AIPanePromptBox } from "./aipane-prompt-box";
import { AIPaneResponses } from "./aipane-responses";
import { cn } from "@/lib/utils";

type AIPaneProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AIPane({ isOpen, onClose }: AIPaneProps) {
  return (
    <div
      className={cn(
        "fixed top-16 right-0 bottom-0 w-1/3 flex flex-col border-l border-border/30 bg-background/50 backdrop-blur-sm transform transition-transform duration-300 ease-in-out z-50",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-border/20">
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
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <AIPaneResponses />
        </div>
        <div className="shrink-0">
          <AIPanePromptBox />
        </div>
      </div>
    </div>
  );
}

export default AIPane;
