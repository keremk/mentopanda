import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getProjects } from "@/data/projects";
import { OnboardingFlow } from "./onboarding-flow";

export default async function OnboardPage() {
  const supabase = await createClient();
  const projects = await getProjects(supabase);
  
  // If user already has projects other than the public one, redirect to dashboard
  if (projects.length > 1) redirect("/home");

  return <OnboardingFlow />;
}
