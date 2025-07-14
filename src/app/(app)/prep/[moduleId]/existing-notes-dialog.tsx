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

type ExistingNotesDialogProps = {
  isOpen: boolean;
  onContinueToTraining: () => void;
  onCreateNewNotes: () => void;
  moduleTitle: string;
};

export function ExistingNotesDialog({
  isOpen,
  onContinueToTraining,
  onCreateNewNotes,
  moduleTitle,
}: ExistingNotesDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleAction(action: () => void) {
    try {
      setIsLoading(true);
      action();
    } catch (error) {
      logger.error("Failed to execute action:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Existing Training Notes Found</DialogTitle>
          <DialogDescription>
            You already have training notes for <strong>{moduleTitle}</strong>.
            Would you like to continue to the training simulation or create new
            notes?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button
            variant="brand"
            onClick={() => handleAction(onContinueToTraining)}
            disabled={isLoading}
          >
            Continue to Training
          </Button>
          <Button
            variant="ghost-brand"
            onClick={() => handleAction(onCreateNewNotes)}
            disabled={isLoading}
          >
            Create New Notes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
