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

export type OnboardingStatus = "not_started" | "complete";

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
  onboarding: OnboardingStatus;
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
    onboarding: profileData.onboarding || "not_started",
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

export async function updateUserOnboardingStatus(
  supabase: SupabaseClient,
  onboardingStatus: OnboardingStatus
): Promise<User> {
  const userId = await getUserId(supabase);
  const { error } = await supabase
    .from("profiles")
    .update({ onboarding: onboardingStatus })
    .eq("id", userId);

  if (error) handleError(error);

  // Force session refresh to update JWT claims with new onboarding status
  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    logger.error(
      "Failed to refresh session after onboarding update:",
      refreshError
    );
  }

  return await getCurrentUserInfo(supabase);
}

/**
 * Check the onboarding status of a user
 */
export async function checkOnboardingStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<OnboardingStatus | null> {
  try {
    // Get user profile to check onboarding status
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("onboarding")
      .eq("id", userId)
      .single();

    if (error) {
      logger.debug(`Profile not found or error for user ${userId}`);
      return null;
    }

    return profile.onboarding as OnboardingStatus;
  } catch (error) {
    logger.error(`Error checking onboarding status for user ${userId}:`, error);
    return null;
  }
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
