import { createBrowserClient } from "@supabase/ssr";

export function setupTestClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const testClient = createBrowserClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return testClient;
}
