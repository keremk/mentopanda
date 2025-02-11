"use server";

import { createClient } from "@/utils/supabase/server";
import { createProject, updateUserProject } from "@/data/projects";
import { revalidatePath } from "next/cache";

export async function createProjectAction({
  name,
  domain,
}: {
  name: string;
  domain: string;
}) {
  const supabase = await createClient();
  
  const project = await createProject({ supabase, name, domain });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user?.id) throw new Error("User not found");
  
  await updateUserProject({
    supabase,
    userId: user.id,
    organizationId: project.id,
  });

  revalidatePath("/settings/account");
  return project;
}
