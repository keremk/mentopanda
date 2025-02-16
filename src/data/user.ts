import { SupabaseClient } from "@supabase/supabase-js";
import { handleError } from "./utils";
export type PricingPlan = "free" | "pro" | "team" | "enterprise";

export type AppPermission =
  | "training.manage"
  | "enrollment.manage"
  | "project.manage"
  | "project.member.manage"
  | "basic.access";

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
  const userId = await getUserId(supabase);

  const { data, error } = await supabase.rpc("get_user_profile", {
    user_id: userId,
  });

  if (error) throw new Error(`Failed to fetch user profile, with error ${error}`);

  const userData: User = {
    id: data.id,
    email: data.email,
    displayName: data.displayName,
    avatarUrl: data.avatarUrl,
    pricingPlan: data.pricingPlan,
    currentProject: data.currentProject,
    projectRole: data.projectRole,
    permissions: data.permissions || [],
  };

  return userData;
}

export async function updateUserProfile(
  supabase: SupabaseClient,
  displayName: string
): Promise<User> {
  const { error: updateAuthError } = await supabase.auth.updateUser({
    data: { display_name: displayName },
  });

  if (updateAuthError) throw new Error("Failed to update display name");

  return await getCurrentUserInfo(supabase);
}

export async function updateUserAvatar(
  supabase: SupabaseClient,
  avatarUrl: string
): Promise<User> {
  const { error: updateAuthError } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  });

  if (updateAuthError) throw new Error("Failed to update avatar");

  // Return updated user info
  return await getCurrentUserInfo(supabase);
}

export async function updateCurrentProject(
  supabase: SupabaseClient,
  projectId: number
): Promise<{ id: string; currentProjectId: number }> {
  const userId = await getUserId(supabase);
  const { data,error } = await supabase
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
  }
}

export async function hasPermission({
  supabase,
  permission,
  user,
}: {
  supabase: SupabaseClient;
  permission: AppPermission;
  user?: User;
}): Promise<boolean> {
  // If user is provided and has permissions array, check locally
  if (user?.permissions) {
    return user.permissions.includes(permission);
  }

  // Fallback to RPC call if no cached permissions
  const { data: hasPermission, error } = await supabase.rpc("authorize", {
    requested_permission: permission,
  });

  if (error) throw new Error(`Permission check failed: ${error.message}`);

  return hasPermission;
}
