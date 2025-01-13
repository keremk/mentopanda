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

type EndChatDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEndChat: () => Promise<void>;
  onEndAndSave: () => Promise<void>;
};

export function EndChatDialog({
  isOpen,
  onOpenChange,
  onEndChat,
  onEndAndSave,
}: EndChatDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleAction(action: () => Promise<void>) {
    try {
      setIsLoading(true);
      await action();
    } catch (error) {
      console.error("Failed to execute end chat action:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>End Conversation</DialogTitle>
          <DialogDescription>
            Choose how you would like to end this conversation.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel & Continue
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleAction(onEndChat)}
            disabled={isLoading}
          >
            End Without Saving
          </Button>
          <Button
            variant="default"
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
