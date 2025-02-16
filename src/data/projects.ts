import { SupabaseClient } from "@supabase/supabase-js";
import { handleError } from "./utils";
import { getUserId } from "./user";
export type ProjectSummary = {
  id: number;
  name: string;
};

export async function createProject(
  supabase: SupabaseClient,
  name: string
): Promise<ProjectSummary> {
  const { data, error } = await supabase.rpc("create_project", {
    project_name: name,
  });

  if (error) handleError(error);
  if (!data) throw new Error("Failed to create project");

  return {
    id: data.id,
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


