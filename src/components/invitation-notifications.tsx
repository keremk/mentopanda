"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { acceptInvitationAction, declineInvitationAction } from "@/app/actions/invitation-actions";
import { switchToProjectAction } from "@/app/actions/project-actions";
import type { Invitation } from "@/data/invitations";

type InvitationNotificationsProps = {
  invitations: Invitation[] | null;
};

export function InvitationNotifications({ invitations }: InvitationNotificationsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentInvitation, setCurrentInvitation] = useState<Invitation | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  if (invitations === null || invitations.length === 0) return null;

  async function handleAccept(invitation: Invitation) {
    setCurrentInvitation(invitation);
    setIsDialogOpen(true);
  }

  async function handleDecline(invitation: Invitation) {
    try {
      await declineInvitationAction(invitation);
      toast({
        title: "Success",
        description: "Invitation declined",
      });
      router.refresh();
    } catch (error) {
      console.error(`Failed to decline invitation: ${error}`);
      toast({
        title: "Error",
        description: "Failed to decline invitation",
        variant: "destructive",
      });
    }
  }

  async function handleAcceptAndSwitch() {
    if (!currentInvitation) return;

    try {
      await acceptInvitationAction(currentInvitation);
      await switchToProjectAction(currentInvitation.projectId);
      toast({
        title: "Success",
        description: "Invitation accepted and switched to new project",
      });
      setIsDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error(`Failed to accept invitation and switch to new project: ${error}`);
      toast({
        title: "Error",
        description: "Failed to accept invitation",
        variant: "destructive",
      });
    }
  }

  async function handleAcceptOnly() {
    if (!currentInvitation) return;

    try {
      await acceptInvitationAction(currentInvitation);
      toast({
        title: "Success",
        description: "Invitation accepted",
      });
      setIsDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error(`Failed to accept invitation: ${error}`);
      toast({
        title: "Error",
        description: "Failed to accept invitation",
        variant: "destructive",
      });
    }
  }

  return (
    <>
      <div className="w-full bg-muted/50 border-b">
        <div className="container mx-auto p-4 space-y-2">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between bg-background rounded-lg p-4 shadow-sm"
            >
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{invitation.inviterDisplayName}</span> invited
                  you as a <span className="font-medium">{invitation.role}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDecline(invitation)}
                >
                  Decline
                </Button>
                <Button size="sm" onClick={() => handleAccept(invitation)}>
                  Accept
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch to New Project?</DialogTitle>
            <DialogDescription>
              Would you like to switch to the new project now?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleAcceptOnly}>
              Accept Only
            </Button>
            <Button onClick={handleAcceptAndSwitch}>
              Accept and Switch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 