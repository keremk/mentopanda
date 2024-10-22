import { SupabaseClient, PostgrestError } from "@supabase/supabase-js";

export async function getUserId(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("User is not authenticated");
  return user.id;
}

export async function getOrganizationId(supabase: SupabaseClient): Promise<number | null> {
  const userId = await getUserId(supabase);
  const { data: userData, error: userError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .single();

  if (userError) {
    throw new Error(`Failed to fetch user data: ${userError.message}`);
  }

  return userData.organization_id;
}

export function handleError(error: PostgrestError) {
  // Postgres error codes: https://docs.postgrest.org/en/v12/references/errors.html

  if (error.code === "42501") {
    throw new Error("Access denied. Please check your permissions.");
  } else if (error.code === "PGRST301") {
    throw new Error("Row-level security policy violation.");
  } else {
    throw new Error(`Failed to fetch data: ${error.message}`);
  }
}
