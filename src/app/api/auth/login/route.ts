import { NextResponse } from "next/server";
import { authService } from "@backend/services/authService";
import { validateLogin } from "@shared/schemas/validation";
import {
  SESSION_COOKIE_NAME,
  signSession,
  getSessionCookieOptions,
} from "@/lib/auth/session";
import { db } from "@/lib/db/database";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateLogin(body);
    if (!validation.isValid) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 });
    }

    const user = await authService.login(
      validation.data!.email,
      validation.data!.password,
      validation.data!.role
    );

    // Sign session token and set HTTP-only cookie
    const token = await signSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      provider: user.provider || "local",
    });

    const sanitizedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      avatarUrl: user.avatarUrl,
      provider: user.provider || "local",
      status: user.status || "active",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    let assignments = user.role === "teacher"
      ? db.getTeacherAssignments(user.id)
      : user.role === "admin"
      ? db.getTeacherAssignments()
      : [];
    if (user.role === "teacher" && assignments.length === 0 && user.email) {
      assignments = db.getTeacherAssignments(user.email);
    }

    const response = NextResponse.json({
      success: true,
      user: sanitizedUser,
      assignments,
    });
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());

    return response;
  } catch (error: any) {
    const isClientError =
      !error.message ||
      error.message.includes("No account") ||
      error.message.includes("password") ||
      error.message.includes("disabled") ||
      error.message.includes("portal") ||
      error.message.includes("Teacher") ||
      error.message.includes("staff") ||
      error.message.includes("Parent") ||
      error.message.includes("role") ||
      error.message.includes("account");
    return NextResponse.json(
      { success: false, error: error.message || "Login failed" },
      { status: isClientError ? 401 : 500 }
    );
  }
}
