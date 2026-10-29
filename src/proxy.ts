import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySession,
} from "@/lib/auth/session";

// Teacher application paths requiring an active teacher/admin session
const TEACHER_PROTECTED_PREFIXES = [
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

// Parent application paths requiring an active parent session
const PARENT_PROTECTED_PREFIXES = [
  "/parent/dashboard",
  "/parent/children",
  "/parent/progress",
  "/parent/learning-gaps",
  "/parent/settings",
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
  const userRole = sessionUser?.role;

  // 3. Handle Login & Registration Pages Redirection for Authenticated Users
  if (pathname === "/login") {
    if (isAuthenticated) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = userRole === "parent" ? "/parent/dashboard" : "/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  if (pathname === "/parent/login" || pathname === "/parent/register") {
    if (isAuthenticated) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = userRole === "parent" ? "/parent/dashboard" : "/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  // 4. Role-Based Route Protection: Parent Routes
  const isParentProtected = PARENT_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isParentProtected) {
    if (!isAuthenticated) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/parent/login";
      loginUrl.searchParams.set("redirect", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    // If teacher tries to access parent dashboard, redirect to teacher dashboard
    if (userRole !== "parent") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  // 5. Role-Based Route Protection: Teacher Routes
  const isTeacherProtected = TEACHER_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isTeacherProtected) {
    if (!isAuthenticated) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    // If parent tries to access teacher dashboard/management, redirect to parent dashboard
    if (userRole === "parent") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/parent/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
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
