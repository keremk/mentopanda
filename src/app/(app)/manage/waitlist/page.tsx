import { getCurrentUserActionCached } from "@/app/actions/user-actions";
import { getWaitingListEntriesAction } from "@/app/actions/waiting-list-actions";
import { notFound } from "next/navigation";
import { WaitlistManager } from "@/components/waitlist-manager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Waiting List",
};

export default async function ManageWaitlistPage() {
  const user = await getCurrentUserActionCached();

  if (!user || !user.permissions.includes("trials.manage")) {
    notFound();
  }

  const waitlistEntries = await getWaitingListEntriesAction();

  return (
    <div className="container py-6 max-w-6xl">
      <WaitlistManager initialWaitlistEntries={waitlistEntries} />
    </div>
  );
}
