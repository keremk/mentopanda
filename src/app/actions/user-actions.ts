"use server";

import { createClient } from "@/utils/supabase/server";
import { getCurrentUserInfo } from "@/data/user";

export async function getCurrentUserAction() {
  const supabase = createClient();
  return await getCurrentUserInfo({ supabase });
}
