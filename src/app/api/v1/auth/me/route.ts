import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth/session";
import { db } from "@/lib/db/database";
import { authService } from "@backend/services/authService";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
    const token = match ? decodeURIComponent(match[1]) : null;

    if (token) {
      const session = await verifySession(token);
      if (session) {
        const liveUser = (await db.getUserByIdAsync(session.id)) || (await db.getUserByEmailAsync(session.email));
        if (liveUser && liveUser.status !== "disabled") {
          return NextResponse.json({
            success: true,
            user: {
              id: liveUser.id,
              name: liveUser.name,
              email: liveUser.email,
              role: liveUser.role,
              schoolId: liveUser.schoolId,
              avatarUrl: liveUser.avatarUrl,
              provider: liveUser.provider,
              status: liveUser.status || "active",
              createdAt: liveUser.createdAt,
              updatedAt: liveUser.updatedAt,
            },
          });
        }
      }
    }

    const authHeader = request.headers.get("authorization") || undefined;
    const user = await authService.getCurrentUser(authHeader);
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
        status: user.status || "active",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
