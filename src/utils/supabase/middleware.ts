import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/logger";
export async function updateSession(
  request: NextRequest,
  isProtectedRoute: boolean
) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getSession(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Handle protected routes
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Handle auth routes when user is already logged in
  if (
    user &&
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname.startsWith("/auth"))
  ) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  if (user && isProtectedRoute) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      const decodedToken = JSON.parse(
        Buffer.from(session.access_token.split(".")[1], "base64").toString()
      );

      // Access the custom claims
      const currentProjectId = decodedToken.current_project_id;
      const projectRole = decodedToken.project_role;

      if (currentProjectId && currentProjectId == 1) {
        // Onboarding is not completed unless it is the super admin (which is the admin for the first project - starter project)
        if (
          projectRole !== "admin" &&
          projectRole !== "super_admin" &&
          request.nextUrl.pathname !== "/onboard"
        ) {
          // Add your logic here
          return NextResponse.redirect(new URL("/onboard", request.url));
        }
      }
    } else {
      logger.error("No session found!");
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
