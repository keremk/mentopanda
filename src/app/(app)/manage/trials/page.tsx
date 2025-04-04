import { getCurrentUserActionCached } from "@/app/actions/user-actions";
import { getTrialInvitationsAction } from "@/app/actions/invitation-actions";
import { notFound } from "next/navigation";
import { TrialInvitationsManager } from "@/components/trial-invitations-manager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Trial Invitations",
};

export default async function ManageTrialsPage() {
  const user = await getCurrentUserActionCached();

  if (!user || !user.permissions.includes("trials.manage")) {
    notFound();
  }

  const invitations = await getTrialInvitationsAction();

  return (
    <div className="container py-6 max-w-6xl">
      <TrialInvitationsManager initialInvitations={invitations} />
    </div>
  );
}
