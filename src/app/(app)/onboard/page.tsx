import { redirect } from "next/navigation";
import { getProjectsAction } from "@/app/actions/project-actions";
import { OnboardingFlow } from "./onboarding-flow";
import { getCurrentUserAction } from "@/app/actions/user-actions";
import { getInvitationsForUserAction } from "@/app/actions/invitation-actions";
export default async function OnboardPage() {
  const [projects, user] = await Promise.all([
    getProjectsAction(),
    getCurrentUserAction(),
  ]);

  if (!user) redirect("/login");

  // If user already has projects other than the public one, redirect to dashboard
  if (projects.length > 1) redirect("/home");

  const invitations = await getInvitationsForUserAction(user);
  console.log(`Invitations: ${JSON.stringify(invitations)}`);
  return <OnboardingFlow user={user} invitations={invitations} />;
}
