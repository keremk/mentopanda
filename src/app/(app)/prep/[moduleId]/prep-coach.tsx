"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MentorChat } from "@/components/mentor-chat";
import { VoicePrompt } from "@/types/realtime";
import { generateNotesFromDraftAction } from "@/app/actions/training-notes-actions";
import { getPrepCoachVoicePrompt } from "@/prompts/prep-coach-voice-prompt";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { logger } from "@/lib/logger";
import { toast } from "@/hooks/use-toast";

type PrepCoachProps = {
  moduleId: string;
  prepCoachPrompt: string;
  userName: string;
};

export function PrepCoach({ moduleId, prepCoachPrompt, userName }: PrepCoachProps) {
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const router = useRouter();

  const voicePromptFactory = async (): Promise<VoicePrompt> => {
    return getPrepCoachVoicePrompt(moduleId, prepCoachPrompt);
  };

  const handleEndSession = () => {
    setShowEndDialog(true);
  };

  const handleContinueWithoutNotes = () => {
    setShowEndDialog(false);
    router.push(`/simulation/${moduleId}`);
  };

  const handleGenerateNotesAndContinue = async () => {
    setIsGeneratingNotes(true);
    try {
      await generateNotesFromDraftAction(parseInt(moduleId));
      logger.info("Notes generated successfully from draft");
      toast({
        title: "Notes generated successfully",
        description: "Your training notes have been created from your session.",
      });
      setShowEndDialog(false);
      router.push(`/simulation/${moduleId}`);
    } catch (error) {
      logger.error("Failed to generate notes from draft:", error);
      toast({
        title: "Failed to generate notes",
        description: "Please try again or continue without notes.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  return (
    <>
      <MentorChat 
        voicePromptFactory={voicePromptFactory} 
        endButtonText="End Session & Continue"
        onEndClick={handleEndSession}
        userName={userName}
      />

      {/* End Session Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Prep Session</DialogTitle>
            <DialogDescription>
              Choose how you would like to proceed to the training simulation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={handleGenerateNotesAndContinue}
              disabled={isGeneratingNotes}
              variant="brand"
            >
              {isGeneratingNotes ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Generating Notes...
                </>
              ) : (
                "Generate Notes & Continue"
              )}
            </Button>
            <Button
              onClick={handleContinueWithoutNotes}
              disabled={isGeneratingNotes}
              variant="ghost-brand"
            >
              Continue Without Notes
            </Button>
            <Button
              onClick={() => setShowEndDialog(false)}
              disabled={isGeneratingNotes}
              variant="ghost-brand"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
