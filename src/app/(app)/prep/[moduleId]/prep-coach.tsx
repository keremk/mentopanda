"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MentorAgent } from "@/components/mentor-agent";
import { getPrepCoachAgent } from "@/prompts/prep-coach-agent";
import { generateNotesFromDraftAction } from "@/app/actions/training-notes-actions";
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
};

export function PrepCoach({ moduleId, prepCoachPrompt }: PrepCoachProps) {
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const router = useRouter();

  const agentFactory = async () => {
    // Use your existing function with fallbacks
    return getPrepCoachAgent(moduleId, prepCoachPrompt);
  };

  const handleEndSession = () => {
    setShowEndDialog(true);
  };

  const handleContinueWithoutNotes = () => {
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
      <MentorAgent agentFactory={agentFactory} />

      {/* Session End Options */}
      <div className="mt-6 flex justify-center">
        <Button onClick={handleEndSession} variant="brand" className="px-8">
          End Session & Continue
        </Button>
      </div>

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
