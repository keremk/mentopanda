"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PrepCoach } from "./prep-coach";
import { PrepCoachGenerator } from "./prep-coach-generator";
import { ExistingNotesDialog } from "@/app/(app)/prep/[moduleId]/existing-notes-dialog";
import { resetDraftAction } from "@/app/actions/training-notes-actions";
import { logger } from "@/lib/logger";
import { toast } from "@/hooks/use-toast";

type PrepPageClientProps = {
  moduleId: number;
  moduleTitle: string;
  hasExistingNotes: boolean;
  prepCoachPrompt: string | null;
  scenario: string;
  characterPrompts: string[];
};

export function PrepPageClient({
  moduleId,
  moduleTitle,
  hasExistingNotes,
  prepCoachPrompt,
  scenario,
  characterPrompts,
}: PrepPageClientProps) {
  const [showExistingNotesDialog, setShowExistingNotesDialog] = useState(false);
  const [isCreatingNewSession, setIsCreatingNewSession] = useState(false);
  const [showMentor, setShowMentor] = useState(false);
  const router = useRouter();

  const handleContinueToTraining = () => {
    // Navigate directly to simulation
    router.push(`/simulation/${moduleId}`);
  };

  const handleCreateNewNotes = useCallback(async () => {
    setShowExistingNotesDialog(false);
    setIsCreatingNewSession(true);

    try {
      // Reset draft notes (clear any existing draft content)
      await resetDraftAction(moduleId);
      logger.info("Draft notes cleared for new session");

      // Show mentor interface
      setShowMentor(true);
    } catch (error) {
      logger.error("Failed to reset draft notes:", error);
      toast({
        title: "Failed to start new session",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingNewSession(false);
    }
  }, [moduleId]);

  // Check for existing notes on mount
  useEffect(() => {
    if (hasExistingNotes) {
      setShowExistingNotesDialog(true);
    } else {
      // No existing notes, start new session
      handleCreateNewNotes();
    }
  }, [hasExistingNotes, handleCreateNewNotes]);

  // If we're still checking or setting up, show loading
  if (hasExistingNotes && showExistingNotesDialog) {
    return (
      <ExistingNotesDialog
        isOpen={showExistingNotesDialog}
        onContinueToTraining={handleContinueToTraining}
        onCreateNewNotes={handleCreateNewNotes}
        moduleTitle={moduleTitle}
      />
    );
  }

  // If we're creating a new session, show loading
  if (isCreatingNewSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-brand mb-2">
            Starting new session...
          </h2>
          <p className="text-muted-foreground">
            Preparing your training environment.
          </p>
        </div>
      </div>
    );
  }

  // Show mentor interface
  if (showMentor) {
    return (
      <>
        {prepCoachPrompt ? (
          <PrepCoach
            moduleId={moduleId.toString()}
            prepCoachPrompt={prepCoachPrompt}
          />
        ) : (
          <PrepCoachGenerator
            moduleId={moduleId}
            scenario={scenario}
            characterPrompts={characterPrompts}
          />
        )}
      </>
    );
  }

  // Fallback - should not reach here
  return null;
}
