import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { cookies } from "next/headers";
import { checkOnboardingStatusAction } from "@/app/actions/user-actions";

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

      // --- INVITE CODE VALIDATION ---
      const onboardingStatus = await checkOnboardingStatusAction(user.id);

      // Log for monitoring/debugging purposes
      logger.debug(
        `User ${user.email} OAuth callback - onboarding status: ${onboardingStatus}`
      );

      // FAIL-SAFE LOGIC: Only require validation if we're CERTAIN the user is new
      // If onboarding status is null/undefined/error → ASSUME EXISTING USER (safer)
      // Only require validation if onboarding is explicitly NOT "complete"
      const isDefinitelyNewUser = onboardingStatus === "not_started";

      if (isDefinitelyNewUser) {
        const hasValidInvite = await checkInviteValidationCookie();

        if (!hasValidInvite) {
          // Delete user using admin client and redirect with error
          try {
            // Verify we have the service role key
            if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
              logger.error(
                "SUPABASE_SERVICE_ROLE_KEY not found - cannot delete user"
              );
            } else {
              // Create admin client with service role
              const adminClient = createServiceClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY,
                {
                  auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                  },
                }
              );

              const { error: deleteError } =
                await adminClient.auth.admin.deleteUser(user.id);

              if (deleteError) {
                logger.error(
                  `Failed to delete user ${user.email}:`,
                  deleteError.message
                );
              } else {
                logger.debug(
                  `Successfully deleted user ${user.email} - no valid invite code`
                );
              }
            }
          } catch (deleteError) {
            logger.error(
              `Error during user deletion for ${user.email}:`,
              deleteError
            );
          }

          return NextResponse.redirect(
            `${origin}/login?mode=signup&message=${encodeURIComponent(
              "Valid invite code required to create an account"
            )}`
          );
        }

        // Clear the invite validation cookie after successful use
        const cookieStore = await cookies();
        cookieStore.delete("inviteValidated");
        logger.debug(
          "Cleared invite validation cookie after successful signup"
        );
      } else {
        // User is either "complete" or status unknown - assume existing user login
        logger.debug(
          `User ${user.email} onboarding status: ${onboardingStatus} - treating as existing user login`
        );
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

/**
 * Check if the invite validation cookie is present
 */
async function checkInviteValidationCookie(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const inviteValidated = cookieStore.get("inviteValidated");

    return inviteValidated?.value === "true";
  } catch (error) {
    logger.error("Error checking invite validation cookie:", error);
    return false;
  }
}
