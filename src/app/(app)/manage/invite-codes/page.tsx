import { getCurrentUserActionCached } from "@/app/actions/user-actions";
import { getInviteCodesAction } from "@/app/actions/invite-code-actions";
import { notFound } from "next/navigation";
import { InviteCodesManager } from "@/components/invite-codes-manager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Invite Codes",
};

export default async function ManageInviteCodesPage() {
  const user = await getCurrentUserActionCached();

  if (!user || !user.permissions.includes("trials.manage")) {
    notFound();
  }

  const inviteCodes = await getInviteCodesAction();

  return (
    <div className="container py-6 max-w-6xl">
      <InviteCodesManager initialInviteCodes={inviteCodes} />
    </div>
  );
}
