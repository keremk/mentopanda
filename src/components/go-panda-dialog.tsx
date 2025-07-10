"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MentorAgent } from "@/components/mentor-agent";
import { Button } from "@/components/ui/button";
import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useAgentActions,
  AgentActionsProvider,
} from "@/contexts/agent-actions-context";
import { createTrainingNavigatorAgentWithContext } from "@/prompts/training-navigator-agent";

export type GoPandaDialogProps = {
  /**
   * Element that should act as the dialog trigger – usually a Button.
   */
  children: ReactNode;
};

// Separate component that uses the context
function DialogContent_WithActions({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const router = useRouter();
  const { nextModuleId, setNextModuleId } = useAgentActions();

  // Clear moduleId when dialog closes
  useEffect(() => {
    if (!isOpen && nextModuleId) {
      setNextModuleId(null);
    }
  }, [isOpen, nextModuleId, setNextModuleId]);

  const handleGoClick = () => {
    if (nextModuleId) {
      // Navigate to the simulation page
      router.push(`/simulation/${nextModuleId}`);
      // Close the dialog
      setIsOpen(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-center w-full text-brand">
          Meet your Mentor Agent
        </DialogTitle>
      </DialogHeader>

      {/* Only render MentorAgent when dialog is open to ensure proper cleanup */}
      {isOpen && (
        <MentorAgent agentFactory={createTrainingNavigatorAgentWithContext} />
      )}

      <DialogFooter className="pt-6">
        <Button variant="ghost-brand" onClick={() => setIsOpen(false)}>
          Dismiss
        </Button>
        <Button
          variant="brand"
          onClick={handleGoClick}
          disabled={!nextModuleId}
        >
          Continue
        </Button>
      </DialogFooter>
    </>
  );
}

export function GoPandaDialog({ children }: GoPandaDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <AgentActionsProvider>
          <DialogContent_WithActions isOpen={isOpen} setIsOpen={setIsOpen} />
        </AgentActionsProvider>
      </DialogContent>
    </Dialog>
  );
}
