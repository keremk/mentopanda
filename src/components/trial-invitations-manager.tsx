"use client";

import { useState } from "react";
import { TrialInvitationsTable } from "@/components/trial-invitations-table";
import { TrialInviteDialog } from "@/components/trial-invite-dialog";
import { Invitation } from "@/data/invitations";
import { getTrialInvitationsAction } from "@/app/actions/invitation-actions";

type TrialInvitationsManagerProps = {
  initialInvitations: Invitation[];
};

export function TrialInvitationsManager({
  initialInvitations,
}: TrialInvitationsManagerProps) {
  const [invitations, setInvitations] =
    useState<Invitation[]>(initialInvitations);

  const refreshInvitations = async () => {
    const updatedInvitations = await getTrialInvitationsAction();
    setInvitations(updatedInvitations);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trial Invitations</h1>
        <TrialInviteDialog onInvitationCreated={refreshInvitations} />
      </div>

      <TrialInvitationsTable
        invitations={invitations}
        onInvitationChange={refreshInvitations}
      />
    </div>
  );
}
