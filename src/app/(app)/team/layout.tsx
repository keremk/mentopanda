import { MemberList } from "@/components/member-list";
import { getProjectMembersActionCached } from "@/app/actions/project-actions";
import { getCurrentUserActionCached } from "@/app/actions/user-actions";

export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserActionCached();
  const members = await getProjectMembersActionCached(
    user.currentProject.id,
    user.id
  );
  const canManageMembers = user.permissions.includes("project.member.manage");

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))]">
      <div className="flex h-full overflow-hidden border-t">
        <div className="h-full">
          <MemberList
            key={canManageMembers ? "manager" : "viewer"}
            members={members}
            canManageMembers={canManageMembers}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
