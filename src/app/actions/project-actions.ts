"use server";

import { createClient } from "@/utils/supabase/server";
import { createProject } from "@/data/projects";
import { revalidatePath } from "next/cache";
import { updateCurrentProject, getUserId } from "@/data/user";
export type ProjectSetupData = {
  projectName: string;
  copyStarterContent: boolean;
};
import {
  copyPublicTrainings,
  getProjects,
  getProjectMembers,
  getProjectMemberInfo,
  updateProjectMemberRole,
} from "@/data/projects";
import { UserRole } from "@/data/user";
import { cache } from "react";

export async function setupProjectAction(data: ProjectSetupData) {
  const supabase = await createClient();

  console.log("Creating project:", data.projectName);
  // Create the new project
  const project = await createProject(supabase, data.projectName);
  console.log("Created project with ID:", project.id);

  // Switch to the newly created project to get new JWT
  console.log("Switching to project:", project.id);
  await switchToProjectAction(project.id);
  console.log("Switched to project successfully");

  // Copy starter content if requested
  if (data.copyStarterContent) {
    console.log("Starting content copy for project:", project.id);
    const userId = await getUserId(supabase);
    if (!userId) throw new Error("No user found");

    await copyPublicTrainings(supabase, project.id, userId);
    console.log("Finished copying content");
  }

  revalidatePath("/");
  return project;
}

export async function createProjectAction(name: string) {
  const supabase = await createClient();
  const project = await createProject(supabase, name);

  revalidatePath("/settings/account");
  return project;
}

export async function switchToProjectAction(projectId: number) {
  console.log("switchToProjectAction called with ID:", projectId);
  const supabase = await createClient();

  // First update the user's current project
  const { currentProjectId } = await updateCurrentProject(supabase, projectId);

  // Verify the update was successful
  if (currentProjectId !== projectId) {
    console.error("Project ID mismatch:", {
      current: currentProjectId,
      expected: projectId,
    });
    throw new Error("Project ID update verification failed");
  }

  // Get current session
  const {
    data: { session: currentSession },
  } = await supabase.auth.getSession();
  if (!currentSession) throw new Error("No active session");

  // Refresh the session to get new JWT with updated project role
  const {
    data: { session: newSession },
    error: refreshError,
  } = await supabase.auth.refreshSession(currentSession);

  if (refreshError) throw refreshError;
  if (!newSession) throw new Error("Failed to refresh session");
  console.log("Successfully switched to project:", projectId);

  revalidatePath("/");
}

export async function getProjectsAction() {
  const supabase = await createClient();

  return await getProjects(supabase);
}

export async function getProjectMembersAction(projectId: number) {
  const supabase = await createClient();
  return await getProjectMembers(supabase, projectId);
}

export const getProjectMembersActionCached = cache(async (projectId: number) => {
  const supabase = await createClient();
  return await getProjectMembers(supabase, projectId);
});

export async function getProjectMemberInfoAction(
  projectId: number,
  userId: string
) {
  const supabase = await createClient();
  return await getProjectMemberInfo(supabase, projectId, userId);
}

export async function updateProjectMemberRoleAction(
  projectId: number,
  userId: string,
  role: UserRole
) {
  const supabase = await createClient();
  await updateProjectMemberRole(supabase, projectId, userId, role);
  revalidatePath(`/team/${userId}`); // Revalidate the member's page
  revalidatePath("/team"); // Revalidate the team list if it exists
}
