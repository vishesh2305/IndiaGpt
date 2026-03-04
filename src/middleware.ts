import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// NextAuth v5 cookie names (different from v4)
const SECURE_COOKIE = "__Secure-authjs.session-token"; // HTTPS (production)
const DEV_COOKIE = "authjs.session-token"; // HTTP (development)

/**
 * Lightweight auth middleware that checks for a valid JWT session
 * without importing the full auth config (which pulls in MongoDB
 * and is incompatible with the Edge runtime).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ["/login", "/register"];
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));
  const isAuthApi = pathname.startsWith("/api/auth");
  const isHealthApi = pathname.startsWith("/api/health");

  // Always allow auth API and health check
  if (isAuthApi || isHealthApi) {
    return NextResponse.next();
  }

  // Determine which cookie name is in use
  const isSecure = request.url.startsWith("https://");
  const cookieName = isSecure ? SECURE_COOKIE : DEV_COOKIE;

  // Check for JWT token using the correct v5 cookie name
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  let isLoggedIn = false;
  try {
    const token = await getToken({ req: request, secret, cookieName });
    isLoggedIn = !!token;
  } catch {
    // If getToken fails (e.g. secret mismatch), fall back to cookie check.
    // The cookie existing means the auth callback set it; real verification
    // happens in API routes via auth().
    const cookie =
      request.cookies.get(SECURE_COOKIE)?.value ||
      request.cookies.get(DEV_COOKIE)?.value;
    isLoggedIn = !!cookie;
  }

  // Redirect authenticated users away from login/register
  if (isLoggedIn && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect unauthenticated users to login for protected routes
  if (!isLoggedIn && !isPublicPath) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|icons|images|fonts|manifest).*)",
  ],
};
