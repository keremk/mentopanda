import { getProjectMembersAction } from "@/app/actions/project-actions";
import { getCurrentUserAction } from "@/app/actions/user-actions";
import { MemberList } from "@/components/member-list";

export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserAction();
  const members = await getProjectMembersAction(user.currentProject.id);

  const canManageMembers = user.permissions.includes("project.member.manage");

  return (
    <div className="flex flex-col h-full py-2">
      <div className="flex flex-1 border-t">
        <MemberList
          key={canManageMembers ? "manager" : "viewer"}
          members={members}
          canManageMembers={canManageMembers}
        />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
