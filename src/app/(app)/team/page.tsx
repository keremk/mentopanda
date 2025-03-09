import { redirect } from "next/navigation";
import { getSharedData } from "./layout";

export default async function TeamPage() {
  // Reuse the cached data from the layout
  const { members } = await getSharedData();

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
