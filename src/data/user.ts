import { SupabaseClient } from "@supabase/supabase-js";
import { handleError } from "./utils";
import { logger } from "@/lib/logger";

export type PricingPlan = "free" | "pro" | "team" | "enterprise";

export type AppPermission =
  | "training.manage"
  | "enrollment.manage"
  | "project.manage"
  | "project.member.manage"
  | "basic.access"
  | "trials.manage";

export type UserRole = "admin" | "manager" | "member" | "super_admin";

export type User = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  pricingPlan: PricingPlan;
  currentProject: {
    id: number;
    name: string;
    isPublic: boolean;
  };
  projectRole: UserRole;
  permissions: AppPermission[];
  trialStartDate: Date | null;
  trialEndDate: Date | null;
  app_metadata?: {
    provider?: string;
    [key: string]: unknown;
  };
};

export async function getUserId(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("User is not authenticated");
  return user.id;
}

export async function getCurrentUserInfo(
  supabase: SupabaseClient
): Promise<User> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser)
    throw new Error(
      `User is not authenticated or error fetching auth user: ${authError?.message}`
    );

  const { data: profileData, error: profileError } = await supabase.rpc(
    "get_user_profile",
    {
      user_id: authUser.id,
    }
  );

  if (profileError)
    throw new Error(
      `Failed to fetch user profile, with error ${profileError.message}`
    );

  const userData: User = {
    id: authUser.id,
    email: profileData.email,
    displayName: profileData.display_name,
    avatarUrl: profileData.avatar_url,
    pricingPlan: profileData.pricing_plan,
    currentProject: profileData.current_project,
    projectRole: profileData.project_role,
    permissions: profileData.permissions || [],
    trialStartDate: profileData.trial_start
      ? new Date(profileData.trial_start)
      : null,
    trialEndDate: profileData.trial_end
      ? new Date(profileData.trial_end)
      : null,
    app_metadata: authUser.app_metadata,
  };

  return userData;
}

export async function updateUserProfile(
  supabase: SupabaseClient,
  displayName: string
): Promise<User> {
  const { error: updateAuthError } = await supabase.auth.updateUser({
    data: {
      display_name: displayName,
    },
  });

  if (updateAuthError)
    throw new Error(
      `Failed to update display name: ${updateAuthError.message}`
    );

  return await getCurrentUserInfo(supabase);
}

export async function updateUserAvatar(
  supabase: SupabaseClient,
  avatarUrl: string
): Promise<User> {
  const { error: updateAuthError } = await supabase.auth.updateUser({
    data: {
      avatar_url: avatarUrl,
    },
  });

  if (updateAuthError)
    throw new Error(`Failed to update avatar: ${updateAuthError.message}`);

  return await getCurrentUserInfo(supabase);
}

export async function updateCurrentProject(
  supabase: SupabaseClient,
  projectId: number
): Promise<{ id: string; currentProjectId: number }> {
  const userId = await getUserId(supabase);
  const { data, error } = await supabase
    .from("profiles")
    .update({
      current_project_id: projectId,
    })
    .eq("id", userId) 
    .select()
    .single();

  if (error) handleError(error);
  if (!data) throw new Error("Failed to update current project");

  return {
    id: data.id,
    currentProjectId: data.current_project_id,
  };
}

export async function updateUserTrial(
  supabase: SupabaseClient,
  startDate: Date,
  endDate: Date
) {
  const userId = await getUserId(supabase);
  const { error } = await supabase
    .from("profiles")
    .update({ trial_start: startDate, trial_end: endDate })
    .eq("id", userId);

  if (error) handleError(error);

  return await getCurrentUserInfo(supabase);
}

export async function isUserOnTrial(
  supabase: SupabaseClient
): Promise<boolean> {
  const user = await getCurrentUserInfo(supabase);

  if (!user.trialStartDate || !user.trialEndDate) return false;
  const now = new Date();
  return now >= user.trialStartDate && now <= user.trialEndDate;
}

export async function hasPermission({
  supabase,
  permission,
  user,
}: {
  supabase: SupabaseClient;
  permission: AppPermission;
  user: User;
}): Promise<boolean> {
  if (user.permissions) {
    return user.permissions.includes(permission);
  }

  if (!user.currentProject?.id) {
    return false;
  }

  try {
    const { data: hasPermission, error } = await supabase.rpc("authorize", {
      requested_permission: permission,
      project_id: user.currentProject.id,
    });

    if (error) {
      logger.error(`Permission check error: ${error.message}`);
      return false;
    }

    return !!hasPermission;
  } catch (error) {
    logger.error("Permission check failed:", error);
    return false;
  }
}
