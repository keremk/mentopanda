import { MemberList } from "@/components/member-list";
import { getProjectMembersAction } from "@/app/actions/project-actions";
import { getCurrentUserAction } from "@/app/actions/user-actions";

// Create a shared data fetching function that will be cached
async function getSharedData() {
  const user = await getCurrentUserAction();
  const members = await getProjectMembersAction(user.currentProject.id);
  const canManageMembers = user.permissions.includes("project.member.manage");

  return { user, members, canManageMembers };
}

export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This call will be cached and shared with the page component
  const { members, canManageMembers } = await getSharedData();

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

// Export the shared data function for use in child pages
export { getSharedData };
