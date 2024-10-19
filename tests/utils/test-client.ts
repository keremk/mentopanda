import { createBrowserClient } from "@supabase/ssr";
import SupabaseContext from "@/utils/supabase/context";
import { vi } from "vitest";

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

  // Manually override the getUser method to return our test user
  // testClient.auth.getUser = vi.fn().mockResolvedValue({
  //   data: { user: { id: userId } },
  //   error: null,
  // });

  // Set the test client in the context
  SupabaseContext.setClient(testClient);

  return testClient;
}
