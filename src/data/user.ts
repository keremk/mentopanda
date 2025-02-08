import { SupabaseClient } from "@supabase/supabase-js";

export type PricingPlan = "free" | "pro" | "team" | "enterprise";

export type User = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  pricingPlan: PricingPlan;
  organizationName?: string;
};

export async function getCurrentUserInfo(supabase: SupabaseClient): Promise<User> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not found");

  const { data, error } = await supabase.rpc("get_user_profile", {
    user_id: user.id,
  });

  if (error) throw new Error("Failed to fetch user profile");

  // The function returns all fields, even when includeOrgInfo is false
  // We can filter out org info if not requested
  const userData: User = {
    id: data.id,
    email: data.email,
    displayName: data.displayName,
    avatarUrl: data.avatarUrl,
    organizationName: data.organizationName,
    pricingPlan: data.pricingPlan || "free", // Providing a default value
  };

  return userData;
}

export async function updateUserProfile({
  supabase,
  displayName,
  organizationName,
}: {
  supabase: SupabaseClient;
  displayName: string;
  organizationName: string;
}): Promise<User> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not found");

  // Update display name in auth.users
  const { error: updateAuthError } = await supabase.auth.updateUser({
    data: { display_name: displayName },
  });

  if (updateAuthError) throw new Error("Failed to update display name");

  // Get user's organization ID from profiles
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (profileError) throw new Error("Failed to fetch profile");

  // Update organization name
  const { error: updateOrgError } = await supabase
    .from("organizations")
    .update({ name: organizationName })
    .eq("id", profileData.organization_id);

  if (updateOrgError) throw new Error("Failed to update organization name");

  // Return updated user info
  return await getCurrentUserInfo(supabase);
}

export async function updateUserAvatar({
  supabase,
  avatarUrl,
}: {
  supabase: SupabaseClient;
  avatarUrl: string;
}): Promise<User> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not found");

  // Update avatar URL in auth.users metadata
  const { error: updateAuthError } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  });

  if (updateAuthError) throw new Error("Failed to update avatar");

  // Return updated user info
  return await getCurrentUserInfo(supabase);
}
