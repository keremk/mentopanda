"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { logger } from "@/lib/logger";

type EndChatDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEndChat: () => Promise<void>;
  onEndAndSave: () => Promise<void>;
  isTimeout?: boolean;
};

export function EndChatDialog({
  isOpen,
  onOpenChange,
  onEndChat,
  onEndAndSave,
  isTimeout = false,
}: EndChatDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleAction(action: () => Promise<void>) {
    try {
      setIsLoading(true);
      await action();
    } catch (error) {
      logger.error("Failed to execute end chat action:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={isTimeout ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isTimeout ? "Time's Up!" : "End Conversation"}
          </DialogTitle>
          <DialogDescription>
            {isTimeout
              ? "Your conversation time has ended."
              : "Choose how you would like to end this conversation."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          {!isTimeout && (
            <Button variant="ghost-brand" onClick={() => onOpenChange(false)}>
              Cancel & Continue
            </Button>
          )}
          <Button
            variant="ghost-danger"
            onClick={() => handleAction(onEndChat)}
            disabled={isLoading}
          >
            End Without Saving
          </Button>
          <Button
            variant="brand"
            onClick={() => handleAction(onEndAndSave)}
            disabled={isLoading}
          >
            End & Save Assessment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
