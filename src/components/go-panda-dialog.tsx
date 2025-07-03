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
import { ReactNode, useState } from "react";

export type GoPandaDialogProps = {
  /**
   * Element that should act as the dialog trigger – usually a Button.
   */
  children: ReactNode;
};

export function GoPandaDialog({ children }: GoPandaDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-center w-full">
            Meet your Mentor Agent
          </DialogTitle>
        </DialogHeader>

        {/* Only render MentorAgent when dialog is open to ensure proper cleanup */}
        {isOpen && <MentorAgent />}

        <DialogFooter className="pt-6">
          <Button variant="ghost-brand" onClick={() => setIsOpen(false)}>
            Dismiss
          </Button>
          <Button variant="brand">Go</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
