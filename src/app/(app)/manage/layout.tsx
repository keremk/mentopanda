import { getCurrentUserActionCached } from "@/app/actions/user-actions";
import { notFound } from "next/navigation";
import { ManageTabs } from "./manage-tabs";

export default async function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserActionCached();

  if (!user || !user.permissions.includes("trials.manage")) {
    notFound();
  }

  return (
    <div>
      <div className="border-b">
        <div className="container flex h-16 items-center">
          <ManageTabs />
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
