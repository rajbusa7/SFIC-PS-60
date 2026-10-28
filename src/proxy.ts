import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySession,
} from "@/lib/auth/session";

// Restricted application paths requiring an active authenticated session
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/students",
  "/assessments",
  "/learning-gaps",
  "/remedial-plans",
  "/reports",
  "/notices",
  "/ai",
  "/settings",
  "/activities",
];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Skip static assets, internal Next.js paths, and public media
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|mp3|wav|ogg)$/)
  ) {
    return NextResponse.next();
  }

  // 2. Check for active session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionUser = sessionCookie ? await verifySession(sessionCookie) : null;
  const isAuthenticated = Boolean(sessionUser);

  // 3. If accessing /login while already authenticated, redirect to /dashboard
  if (pathname === "/login") {
    if (isAuthenticated) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  // 4. Check if the current route is protected
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const middleware = proxy;
export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
