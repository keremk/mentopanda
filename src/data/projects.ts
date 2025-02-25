import { SupabaseClient } from "@supabase/supabase-js";
import { handleError } from "./utils";
import { getUserId, UserRole } from "./user";

export type ProjectSummary = {
  id: number;
  name: string;
};

export type ProjectMemberSummary = {
  id: string;
  role: UserRole;
};

export type ProjectMember = ProjectMemberSummary & {
  name: string;
  email: string;
  avatar_url: string;
};

export async function createProject(
  supabase: SupabaseClient,
  name: string
): Promise<ProjectSummary> {
  const { data: projectId, error } = await supabase.rpc("create_project", {
    project_name: name,
  });

  console.log(`Project ID: ${projectId}`);
  if (error) handleError(error);
  if (!projectId) throw new Error("Failed to create project");

  console.log(`Created project with name: ${name} and id: ${projectId}`);
  return {
    id: projectId,
    name: name,
  };
}

export async function getProjects(
  supabase: SupabaseClient
): Promise<ProjectSummary[]> {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      name,
      projects_profiles!inner (
        profile_id
      )
    `
    )
    .eq("projects_profiles.profile_id", userId);

  if (error) handleError(error);
  if (!data) throw new Error("Failed to list projects");

  return data.map((project) => ({
    id: project.id,
    name: project.name,
  }));
}

export async function copyPublicTrainings(
  supabase: SupabaseClient,
  projectId: number,
  userId: string
) {
  console.log(
    `Copying public trainings to project ${projectId} for user ${userId}`
  );
  const { error } = await supabase.rpc("deep_copy_project", {
    source_project_id: 1, // Public project ID
    target_project_id: projectId,
    target_user_id: userId,
  });

  if (error) throw error;
}

export async function getProjectMembers(
  supabase: SupabaseClient,
  projectId: number
): Promise<ProjectMember[]> {
  const { data, error } = await supabase.rpc("get_project_members", {
    p_project_id: projectId,
  });

  if (error) handleError(error);
  if (!data) throw new Error("Failed to get project members");
  if (data.status === "error") throw new Error(data.message);

  // The function returns { status: 'success', data: [...members] }
  const members = data.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return members.map((member: any) => ({
    id: member.user_id,
    name: member.displayname,
    email: member.email,
    role: member.role,
    avatar_url: member.avatar_url || "",
  }));
  // eslint-enable @typescript-eslint/no-explicit-any
}

export async function getProjectMemberInfo(
  supabase: SupabaseClient,
  projectId: number,
  userId: string
): Promise<ProjectMember | null> {
  const { data, error } = await supabase.rpc("get_project_member_info", {
    p_project_id: projectId,
    p_user_id: userId,
  });

  if (error) handleError(error);
  if (!data) throw new Error("Failed to get project member info");
  if (data.status === "error") throw new Error(data.message);

  // The function returns { status: 'success', data: memberInfo }
  const memberInfo = data.data;

  // Return null if no member was found
  if (!memberInfo) return null;

  return {
    id: memberInfo.user_id,
    name: memberInfo.displayname,
    email: memberInfo.email,
    role: memberInfo.role,
    avatar_url: memberInfo.avatar_url || "",
  };
}

export async function updateProjectMemberRole(
  supabase: SupabaseClient,
  projectId: number,
  userId: string,
  role: UserRole
): Promise<ProjectMemberSummary> {
  const { data, error } = await supabase
    .from("projects_profiles")
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq("project_id", projectId)
    .eq("profile_id", userId)
    .select("profile_id, role")
    .single();

  if (error) handleError(error);
  if (!data) throw new Error("Failed to update project member role");

  return {
    id: data.profile_id,
    role: data.role,
  };
}

export async function addProjectMember(
  supabase: SupabaseClient,
  projectId: number,
  userId: string,
  role: UserRole
): Promise<ProjectMemberSummary> {
  console.log(
    `Adding project member ${userId} to project ${projectId} with role ${role}`
  );
  const { data, error } = await supabase.from("projects_profiles").insert({
    project_id: projectId,
    profile_id: userId,
    role: role,
  }).select(`profile_id, role`).single();

  if (error) handleError(error);
  if (!data) throw new Error("Failed to add project member");

  return {
    id: data.profile_id,
    role: data.role,
  };
}
