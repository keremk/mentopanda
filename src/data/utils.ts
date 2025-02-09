import { SupabaseClient, PostgrestError } from "@supabase/supabase-js";

export async function getUserId(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("User is not authenticated");
  return user.id;
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

