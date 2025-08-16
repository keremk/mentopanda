import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Get the current pathname
  const pathname = request.nextUrl.pathname;

  // Define public routes that don't require authentication
  const publicRoutes = ["/login", "/auth", "/about", "/forgot-password", "/trainings", "/docs", "/blog"];
  // Exact match for homepage
  const isHomePage = pathname === "/";
  // Check if path matches any public routes
  const isPublicRoute =
    isHomePage || publicRoutes.some((route) => pathname.startsWith(route));

  // All other routes should be protected
  const isProtectedRoute = !isPublicRoute;

  return await updateSession(request, isProtectedRoute);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
