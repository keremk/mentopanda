import { SupabaseClient } from "@supabase/supabase-js";
import { handleError } from "./utils";

export type Project = {
  id: number;
  name: string;
  domain: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function createProject({
  supabase,
  name,
  domain,
}: {
  supabase: SupabaseClient;
  name: string;
  domain: string;
}): Promise<Project> {
  const { data, error } = await supabase
    .from("organizations")
    .insert({ name, domain })
    .select()
    .single();

  if (error) handleError(error);
  if (!data) throw new Error("Failed to create project");

  return {
    id: data.id,
    name: data.name,
    domain: data.domain,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function updateUserProject({
  supabase,
  userId,
  organizationId,
}: {
  supabase: SupabaseClient;
  userId: string;
  organizationId: number;
}): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ organization_id: organizationId })
    .eq("id", userId);

  if (error) handleError(error);
}
