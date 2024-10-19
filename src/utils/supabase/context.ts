import { createBrowserClient } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type SupabaseClientType = ReturnType<typeof createBrowserClient> | ReturnType<typeof createServerClient>;

const SupabaseContext = {
  client: null as SupabaseClientType | null,

  getClient() {
    if (!this.client) {
      if (typeof window === "undefined") {
        // Server-side
        const cookieStore = cookies();
        this.client = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return cookieStore.getAll();
              },
              setAll(cookiesToSet) {
                try {
                  cookiesToSet.forEach(({ name, value, options }) =>
                    cookieStore.set(name, value, options)
                  );
                } catch {
                  // The `setAll` method was called from a Server Component.
                  // This can be ignored if you have middleware refreshing
                  // user sessions.
                }
              },
            },
          }
        );
      } else {
        // Client-side
        this.client = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
      }
    }
    return this.client;
  },

  setClient(client: SupabaseClientType) {
    this.client = client;
  },
};

export default SupabaseContext;
