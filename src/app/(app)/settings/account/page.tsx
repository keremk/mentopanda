import { getCurrentUserActionCached } from "@/app/actions/user-actions";
import { AccountForm } from "./account-form";
import { Metadata } from "next";
import { getCurrentUsageAction } from "@/app/actions/usage-actions";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function AccountSettingsPage() {
  const user = await getCurrentUserActionCached();

  let usage = null;
  try {
    usage = await getCurrentUsageAction();
  } catch (error) {
    console.error("Failed to fetch usage data:", error);
    // Continue without usage data - the UI will handle null gracefully
  }

  return (
    <div className="border-t py-2 px-6 ">
      <AccountForm user={user} usage={usage} />
    </div>
  );
}
