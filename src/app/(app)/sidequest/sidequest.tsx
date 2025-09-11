"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MentorChat } from "@/components/mentor-chat";
import { getSideQuestCreatorPrompt } from "@/prompts/side-quest-creator-agent";
import { UserTrainingStatus } from "@/data/history";
import { VoicePrompt } from "@/types/realtime";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAgentActions } from "@/contexts/agent-actions-context";

type SidequestProps = {
  userStatus: UserTrainingStatus | null;
  isOnboarding?: boolean; // New prop to determine which prompt to use
  userName: string;
};

export function Sidequest({ isOnboarding = false, userName }: SidequestProps) {
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [actualStopFn, setActualStopFn] = useState<(() => Promise<void>) | null>(null);
  const router = useRouter();
  const { nextModuleId } = useAgentActions();

  const voicePromptFactory = async (): Promise<VoicePrompt> => {
    // Use the unified side quest creator prompt for both onboarding and existing users
    return getSideQuestCreatorPrompt(isOnboarding);
  };

  const handleEndConversation = useCallback((stopFn?: () => Promise<void>) => {
    setActualStopFn(() => stopFn || null);
    setShowEndDialog(true);
  }, []);

  const handleConfirmEnd = useCallback(async () => {
    // First call the actual stop function to disconnect voice chat
    if (actualStopFn) {
      await actualStopFn();
    }

    setShowEndDialog(false);

    // If a module was created during the conversation, navigate to the simulation
    if (nextModuleId) {
      router.push(`/simulation/${nextModuleId}`);
    }
    // If no module was created, just end the conversation
  }, [actualStopFn, nextModuleId, router]);

  const handleCancelEnd = useCallback(() => {
    setShowEndDialog(false);
  }, []);

  return (
    <>
      <MentorChat
        voicePromptFactory={voicePromptFactory}
        userName={userName}
        onEndClick={handleEndConversation}
      />

      {/* Simple End Conversation Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>End Conversation</DialogTitle>
            <DialogDescription>
              {nextModuleId
                ? "Great! Your side quest module has been created. Ready to start your training session?"
                : "Are you sure you want to end your conversation with the mentor?"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              onClick={handleConfirmEnd}
              variant={nextModuleId ? "brand" : "destructive"}
              className="flex-1"
            >
              {nextModuleId ? "Continue to Training" : "End Conversation"}
            </Button>
            <Button
              onClick={handleCancelEnd}
              variant="outline"
              className="flex-1"
            >
              Continue Chat
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
