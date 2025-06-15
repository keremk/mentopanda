import { redirect } from "next/navigation";
import { getProjectsAction } from "@/app/actions/project-actions";
import { OnboardingFlow } from "./onboarding-flow";
import { getCurrentUserActionCached } from "@/app/actions/user-actions";

export default async function OnboardPage() {
  const [projects, user] = await Promise.all([
    getProjectsAction(),
    getCurrentUserActionCached(),
  ]);

  if (!user) redirect("/login");

  // If user already has projects other than the public one, redirect to dashboard
  if (projects.length > 1) redirect("/home");

  return <OnboardingFlow user={user} />;
}
