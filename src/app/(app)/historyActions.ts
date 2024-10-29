"use server";

import { createClient } from "@/utils/supabase/server";
import { getTrainingHistory } from "@/data/history";

export async function getTrainingHistoryAction(limit: number, completedOnly: boolean = false) {
  const supabase = createClient();
  return await getTrainingHistory(supabase, limit, completedOnly);
}
