import { SupabaseClient } from "@supabase/supabase-js";

export type User = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
};

export async function getCurrentUserInfo(
  supabase: SupabaseClient
): Promise<User> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not found");

  return {
    id: user.id,
    email: user.email ?? "",
    displayName:
      user.user_metadata.full_name || user.email?.split("@")[0] || "User",
    avatarUrl: user.user_metadata.avatar_url || "/placeholder.svg",
  };
}
