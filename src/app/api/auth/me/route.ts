import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySession, getClearCookieOptions } from "@/lib/auth/session";
import { db } from "@/lib/db/database";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
  const token = match ? decodeURIComponent(match[1]) : null;

  if (!token) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }

  const session = await verifySession(token);
  if (!session) {
    const res = NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    res.cookies.set(SESSION_COOKIE_NAME, "", getClearCookieOptions());
    return res;
  }

  // Retrieve authoritative live user record from persistent database if available
  const liveUser = (await db.getUserByIdAsync(session.id)) || (await db.getUserByEmailAsync(session.email));
  if (liveUser && liveUser.status === "disabled") {
    const res = NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    res.cookies.set(SESSION_COOKIE_NAME, "", getClearCookieOptions());
    return res;
  }

  const effectiveUser = liveUser || session;

  return NextResponse.json({
    authenticated: true,
    user: {
      id: effectiveUser.id,
      name: effectiveUser.name,
      email: effectiveUser.email,
      role: effectiveUser.role,
      schoolId: effectiveUser.schoolId,
      googleId: effectiveUser.googleId,
      avatarUrl: effectiveUser.avatarUrl,
      provider: effectiveUser.provider,
      status: (effectiveUser as any).status || "active",
      createdAt: (effectiveUser as any).createdAt,
      updatedAt: (effectiveUser as any).updatedAt,
    },
  });
}
