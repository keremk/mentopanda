import { getCurrentUserAction } from "@/app/actions/user-actions";
import { AccountForm } from "./account-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings",
};

export default async function AccountSettingsPage() {
  const user = await getCurrentUserAction();

  return (
    <div className="border-t py-2 px-6 ">
      <AccountForm user={user} />
    </div>
  );
}
