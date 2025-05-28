"use client";

import { Sparkles, Plus } from "lucide-react";
import { AIPanePromptBox } from "./aipane-prompt-box";
import { AIPaneResponses } from "./aipane-responses";
import { NoCreditsDialog } from "./no-credits-dialog";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { Button } from "./ui/button";
import { useAIPane } from "@/contexts/ai-pane-context";
import { AIPaneStatusIndicator } from "./ai-pane-status-indicator";

type AIPaneProps = {
  isOpen: boolean;
};

export function AIPane({ isOpen }: AIPaneProps) {
  const { clearMessages, showNoCreditsDialog, setShowNoCreditsDialog } =
    useAIPane();

  // When the pane opens, focus the first option
  useEffect(() => {
    if (isOpen) {
      // Use a small delay to ensure DOM is updated
      setTimeout(() => {
        // Select the first option button
        const firstButton = document.querySelector(".aipane-options button");
        if (firstButton) {
          (firstButton as HTMLButtonElement).click();
        }
      }, 100);
    }
  }, [isOpen]);

  const handleNewChat = () => {
    clearMessages();
  };

  return (
    <>
      <div
        className={cn(
          "fixed top-16 right-0 bottom-0 flex flex-col border-l border-border/30 bg-background/50 backdrop-blur-lg transform transition-all duration-300 ease-in-out z-50",
          isOpen ? "translate-x-0 w-[435px]" : "translate-x-full w-0"
        )}
      >
        {/* Header */}
        <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-border/20">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI Assistant</span>
          </div>
          <Button
            variant="ghost-brand"
            size="sm"
            className="h-7 px-3 rounded-full text-xs flex items-center gap-1"
            onClick={handleNewChat}
            title="New Chat"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Chat</span>
          </Button>
        </div>

        {/* Main content area */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <AIPaneResponses />
          </div>
          <div className="shrink-0">
            <AIPaneStatusIndicator />
            <AIPanePromptBox />
          </div>
        </div>
      </div>

      {/* NoCreditsDialog - render outside the sliding panel to ensure proper visibility */}
      <NoCreditsDialog
        isOpen={showNoCreditsDialog}
        onOpenChange={setShowNoCreditsDialog}
        title="No Credits Available"
        description="You don't have enough credits to use the AI assistant. Purchase additional credits to continue using AI features."
      />
    </>
  );
}

export default AIPane;
