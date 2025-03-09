import { getProjectMembersAction } from "@/app/actions/project-actions";
import { getCurrentUserAction } from "@/app/actions/user-actions";
import { redirect } from "next/navigation";

export default async function TeamPage() {
  const user = await getCurrentUserAction();
  const members = await getProjectMembersAction(user.currentProject.id);

  // If members exist, redirect to the first member's page
  if (members.length > 0) {
    redirect(`/team/${members[0].id}`);
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <h1 className="text-2xl font-semibold mb-4">Team Management</h1>
      <p className="text-muted-foreground max-w-md">
        No team members found. Use the invite button to add members to your
        team.
      </p>
    </div>
  );
}
