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

export type StopConversationDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onStop: () => void;
  onStopAndSave?: () => void;
  isTimeout?: boolean;
};

export function StopConversationDialog({
  isOpen,
  onClose,
  onStop,
  onStopAndSave,
  isTimeout = false,
}: StopConversationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleAction(action: () => void) {
    try {
      setIsLoading(true);
      action();
    } catch (error) {
      logger.error("Failed to execute stop conversation action:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={isTimeout ? undefined : onClose}>
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
            <Button variant="ghost-brand" onClick={onClose}>
              Cancel & Continue
            </Button>
          )}
          <Button
            variant="ghost-danger"
            onClick={() => handleAction(onStop)}
            disabled={isLoading}
          >
            End Without Saving
          </Button>
          {onStopAndSave && (
            <Button
              variant="brand"
              onClick={() => handleAction(onStopAndSave)}
              disabled={isLoading}
            >
              End & Save Assessment
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}