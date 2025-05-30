"use client";

import { useState } from "react";
import { InviteCodesTable } from "@/components/invite-codes-table";
import { GenerateInviteCodesDialog } from "@/components/generate-invite-codes-dialog";
import { type InviteCode } from "@/data/invite-codes";
import { getInviteCodesAction } from "@/app/actions/invite-code-actions";

type InviteCodesManagerProps = {
  initialInviteCodes: InviteCode[];
};

export function InviteCodesManager({
  initialInviteCodes,
}: InviteCodesManagerProps) {
  const [inviteCodes, setInviteCodes] =
    useState<InviteCode[]>(initialInviteCodes);

  const refreshInviteCodes = async () => {
    const updatedInviteCodes = await getInviteCodesAction();
    setInviteCodes(updatedInviteCodes);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invite Codes</h1>
        <GenerateInviteCodesDialog onCodesGenerated={refreshInviteCodes} />
      </div>

      <InviteCodesTable
        inviteCodes={inviteCodes}
        onInviteCodeChange={refreshInviteCodes}
      />
    </div>
  );
}
