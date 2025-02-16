"use server";

import { createClient } from "@/utils/supabase/server";
import { createProject } from "@/data/projects";
import { revalidatePath } from "next/cache";
import { updateCurrentProject } from "@/data/user";

export async function createProjectAction(name: string) {
  const supabase = await createClient();
  const project = await createProject(supabase, name);

  revalidatePath("/settings/account");
  return project;
}

export async function switchToProjectAction(projectId: number) {
  const supabase = await createClient();

  // First update the user's current project
  const { currentProjectId } = await updateCurrentProject(
    supabase,
    projectId
  );

  // Verify the update was successful
  if (currentProjectId !== projectId)
    throw new Error("Project ID update verification failed");

  // Get current session
  const {
    data: { session: currentSession },
  } = await supabase.auth.getSession();
  if (!currentSession) throw new Error("No active session");

  // Refresh the session to get new JWT with updated project role
  // Using server client ensures cookies are handled properly
  const {
    data: { session: newSession },
    error: refreshError,
  } = await supabase.auth.refreshSession(currentSession);

  if (refreshError) throw refreshError;
  if (!newSession) throw new Error("Failed to refresh session");

  // Revalidate all routes since project context affects the entire app
  revalidatePath("/");
}
