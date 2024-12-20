import { SupabaseClient } from "@supabase/supabase-js";

export type User = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  organizationName?: string;
};

export async function getCurrentUserInfo({
  supabase,
  includeOrgInfo = false,
}: {
  supabase: SupabaseClient;
  includeOrgInfo?: boolean;
}): Promise<User> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not found");

  const userData: User = {
    id: user.id,
    email: user.email ?? "",
    displayName:
      user.user_metadata.display_name || user.email?.split("@")[0] || "User",
    avatarUrl: user.user_metadata.avatar_url || "/placeholder.svg",
  };

  if (includeOrgInfo) {
    const { data: orgData, error } = await supabase
      .from("profiles")
      .select(
        `
        organizations (
          name
        )
      `
      )
      .eq("id", user.id)
      .single();

    if (error) throw new Error("Failed to fetch organization info");

    // When "single()" is used, the data is returned as an object, not an array but the type is still an array
    // @ts-ignore 
    userData.organizationName = orgData?.organizations?.name;
  }

  console.log(userData);
  return userData;
}
