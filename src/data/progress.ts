import { handleError } from "@/data/utils";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import { getUserId } from "@/data/user";

// Types for overall progress
export type OverallProgress = {
  id: number;
  profileId: string;
  assessmentText: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Types for module progress
export type ModuleProgress = {
  id: number;
  overallProgressId: number;
  moduleId: number;
  assessmentText: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Overall Progress Functions
export async function getOrCreateOverallProgress(
  supabase: SupabaseClient<Database>,
  profileId: string
): Promise<OverallProgress> {
  // First try to get existing progress
  const existing = await getOverallProgress(supabase, profileId);
  if (existing) {
    return existing;
  }

  // Create new progress if it doesn't exist
  const { data: result, error } = await supabase
    .from("progress_overall")
    .insert({
      profile_id: profileId,
      assessment_text: null,
    })
    .select("*")
    .single();

  if (error) handleError(error);
  if (!result) throw new Error("Failed to create overall progress entry");

  return {
    id: result.id,
    profileId: result.profile_id,
    assessmentText: result.assessment_text,
    createdAt: new Date(result.created_at!),
    updatedAt: new Date(result.updated_at!),
  };
}

export async function getOverallProgress(
  supabase: SupabaseClient<Database>,
  profileId: string
): Promise<OverallProgress | null> {
  const { data, error } = await supabase
    .from("progress_overall")
    .select("*")
    .eq("profile_id", profileId)
    .single();

  if (error && error.code !== "PGRST116") handleError(error);
  if (!data) return null;

  return {
    id: data.id,
    profileId: data.profile_id,
    assessmentText: data.assessment_text,
    createdAt: new Date(data.created_at!),
    updatedAt: new Date(data.updated_at!),
  };
}

export async function updateOverallProgress(
  supabase: SupabaseClient<Database>,
  profileId: string,
  assessmentText?: string | null
): Promise<void> {
  const userId = await getUserId(supabase);
  
  // Only allow users to update their own progress
  if (userId !== profileId) {
    throw new Error("Access denied. You can only update your own progress.");
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  
  if (assessmentText !== undefined) {
    updateData.assessment_text = assessmentText;
  }

  const { error } = await supabase
    .from("progress_overall")
    .update(updateData)
    .eq("profile_id", profileId);

  if (error) handleError(error);
}

export async function deleteOverallProgress(
  supabase: SupabaseClient<Database>,
  profileId: string
): Promise<void> {
  const userId = await getUserId(supabase);
  
  // Only allow users to delete their own progress
  if (userId !== profileId) {
    throw new Error("Access denied. You can only delete your own progress.");
  }
  
  const { error } = await supabase
    .from("progress_overall")
    .delete()
    .eq("profile_id", profileId);

  if (error) handleError(error);
}

// Module Progress Functions
export async function getOrCreateModuleProgress(
  supabase: SupabaseClient<Database>,
  profileId: string,
  moduleId: number
): Promise<ModuleProgress> {
  // First try to get existing module progress
  const existing = await getModuleProgress(supabase, profileId, moduleId);
  if (existing) {
    return existing;
  }

  // Ensure overall progress exists first
  const overallProgress = await getOrCreateOverallProgress(supabase, profileId);

  // Create new module progress
  const { data: result, error } = await supabase
    .from("progress_modules")
    .insert({
      progress_overall_id: overallProgress.id,
      module_id: moduleId,
      assessment_text: null,
    })
    .select("*")
    .single();

  if (error) handleError(error);
  if (!result) throw new Error("Failed to create module progress entry");

  return {
    id: result.id,
    overallProgressId: result.progress_overall_id,
    moduleId: result.module_id,
    assessmentText: result.assessment_text,
    createdAt: new Date(result.created_at!),
    updatedAt: new Date(result.updated_at!),
  };
}

export async function getModuleProgress(
  supabase: SupabaseClient<Database>,
  profileId: string,
  moduleId: number
): Promise<ModuleProgress | null> {
  const { data, error } = await supabase
    .from("progress_modules")
    .select(`
      *,
      progress_overall!inner (
        profile_id
      )
    `)
    .eq("module_id", moduleId)
    .eq("progress_overall.profile_id", profileId)
    .single();

  if (error && error.code !== "PGRST116") handleError(error);
  if (!data) return null;

  return {
    id: data.id,
    overallProgressId: data.progress_overall_id,
    moduleId: data.module_id,
    assessmentText: data.assessment_text,
    createdAt: new Date(data.created_at!),
    updatedAt: new Date(data.updated_at!),
  };
}

export async function getAllModuleProgress(
  supabase: SupabaseClient<Database>,
  profileId: string
): Promise<ModuleProgress[]> {
  const { data, error } = await supabase
    .from("progress_modules")
    .select(`
      *,
      progress_overall!inner (
        profile_id
      )
    `)
    .eq("progress_overall.profile_id", profileId)
    .order("created_at", { ascending: true });

  if (error) handleError(error);
  if (!data) return [];

  return data.map((item) => ({
    id: item.id,
    overallProgressId: item.progress_overall_id,
    moduleId: item.module_id,
    assessmentText: item.assessment_text,
    createdAt: new Date(item.created_at!),
    updatedAt: new Date(item.updated_at!),
  }));
}

export async function updateModuleProgress(
  supabase: SupabaseClient<Database>,
  profileId: string,
  moduleId: number,
  assessmentText?: string | null
): Promise<void> {
  const userId = await getUserId(supabase);
  
  // Only allow users to update their own progress
  if (userId !== profileId) {
    throw new Error("Access denied. You can only update your own progress.");
  }

  // Get the module progress to ensure it exists and user owns it
  const moduleProgress = await getModuleProgress(supabase, profileId, moduleId);
  if (!moduleProgress) {
    throw new Error("Module progress not found for this profile and module.");
  }
  
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  
  if (assessmentText !== undefined) {
    updateData.assessment_text = assessmentText;
  }

  const { error } = await supabase
    .from("progress_modules")
    .update(updateData)
    .eq("id", moduleProgress.id);

  if (error) handleError(error);
}

export async function deleteModuleProgress(
  supabase: SupabaseClient<Database>,
  profileId: string,
  moduleId: number
): Promise<void> {
  const userId = await getUserId(supabase);
  
  // Only allow users to delete their own progress
  if (userId !== profileId) {
    throw new Error("Access denied. You can only delete your own progress.");
  }

  // Get the module progress to ensure it exists and user owns it
  const moduleProgress = await getModuleProgress(supabase, profileId, moduleId);
  if (!moduleProgress) {
    throw new Error("Module progress not found for this profile and module.");
  }
  
  const { error } = await supabase
    .from("progress_modules")
    .delete()
    .eq("id", moduleProgress.id);

  if (error) handleError(error);
}