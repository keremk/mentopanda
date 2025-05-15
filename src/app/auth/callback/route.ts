import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/home"; // Default redirect path

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    // --- If code exchange is successful ---
    if (!exchangeError) {
      // --- Get user to find out the provider ---
      const {
        data: { user },
        error: getUserError,
      } = await supabase.auth.getUser();

      if (getUserError || !user) {
        logger.error(
          "Auth Callback: Error getting user after session exchange:",
          getUserError
        );
        // Redirect to error page even if session exchange succeeded but user fetch failed
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
      }

      // Extract provider (default to 'email' if somehow missing, though unlikely for OAuth)
      const provider = user.app_metadata?.provider || "email";

      // --- Construct final redirect URL with provider ---
      const redirectUrl = new URL(next, origin);
      redirectUrl.searchParams.set("auth_provider", provider);
      const finalRedirectPath = `${redirectUrl.pathname}${redirectUrl.search}`;

      // --- Handle Redirect based on environment ---
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        // Local dev: Use origin directly
        return NextResponse.redirect(`${origin}${finalRedirectPath}`);
      } else if (forwardedHost) {
        // Production behind proxy: Use forwarded host
        return NextResponse.redirect(
          `https://${forwardedHost}${finalRedirectPath}`
        );
      } else {
        // Production without proxy (or fallback): Use origin
        return NextResponse.redirect(`${origin}${finalRedirectPath}`);
      }
    }
    // --- Log exchange error if it happened ---
    else {
      logger.error(
        "Auth Callback: Code exchange error:",
        exchangeError.message
      );
    }
  }
  // --- If no code or error occurred ---
  else {
    logger.warn("Auth Callback: No code parameter found in request URL.");
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
