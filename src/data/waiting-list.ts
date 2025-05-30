import type { SupabaseClient } from "@supabase/supabase-js";

export type WaitingListEntry = {
  id: number;
  email: string;
  comment: string | null;
  date_requested: string;
};

export type CreateWaitingListParams = {
  email: string;
  comment?: string | null;
};

/**
 * Add someone to the waiting list (no authentication required)
 */
export async function addToWaitingList(
  supabase: SupabaseClient,
  params: CreateWaitingListParams
): Promise<WaitingListEntry> {
  const { data, error } = await supabase
    .from("waiting_list")
    .insert({
      email: params.email,
      comment: params.comment !== undefined ? params.comment : null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add to waiting list: ${error.message}`);
  }

  return data;
}

/**
 * Get all waiting list entries (no authentication required)
 */
export async function getWaitingListEntries(
  supabase: SupabaseClient
): Promise<WaitingListEntry[]> {
  const { data, error } = await supabase
    .from("waiting_list")
    .select("*")
    .order("date_requested", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch waiting list entries: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a specific waiting list entry by ID (no authentication required)
 */
export async function getWaitingListEntryById(
  supabase: SupabaseClient,
  id: number
): Promise<WaitingListEntry | null> {
  const { data, error } = await supabase
    .from("waiting_list")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to fetch waiting list entry: ${error.message}`);
  }

  return data;
}

/**
 * Delete a waiting list entry (requires authentication)
 */
export async function deleteWaitingListEntry(
  supabase: SupabaseClient,
  id: number
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase.from("waiting_list").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete waiting list entry: ${error.message}`);
  }
}

/**
 * Check if an email is already in the waiting list (no authentication required)
 */
export async function checkEmailInWaitingList(
  supabase: SupabaseClient,
  email: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("waiting_list")
    .select("id")
    .eq("email", email)
    .limit(1);

  if (error) {
    throw new Error(`Failed to check email in waiting list: ${error.message}`);
  }

  return (data?.length || 0) > 0;
}
