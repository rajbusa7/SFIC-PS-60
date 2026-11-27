import { NextResponse } from "next/server";
import { emailOtpService } from "@/lib/auth/emailOtpService";
import {
  SESSION_COOKIE_NAME,
  signSession,
  getSessionCookieOptions,
} from "@/lib/auth/session";
import { getClientIp } from "@/lib/auth/rateLimiter";
import { db } from "@/lib/db/database";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    const body = await request.json().catch(() => ({}));
    const { tempToken, otp } = body;

    if (!tempToken || typeof tempToken !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid temporary verification token." },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 6-digit verification code." },
        { status: 400 }
      );
    }

    // Verify through cryptographically secure EmailOtpService
    const verifyResult = await emailOtpService.verifyLoginOtp({
      tempToken,
      otp: otp.trim(),
      ip,
    });

    const user = verifyResult.user;

    // Issue signed HMAC-SHA256 session token
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
      preferredLanguage: user.preferredLanguage || "en",
      preferredScript: user.preferredScript || undefined,
      status: user.status || "active",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    let assignments = user.role === "teacher"
      ? await db.getTeacherAssignmentsAsync(user.id)
      : user.role === "admin"
      ? await db.getTeacherAssignmentsAsync()
      : [];
    if (user.role === "teacher" && assignments.length === 0 && user.email) {
      assignments = await db.getTeacherAssignmentsAsync(user.email);
    }

    const redirectUrl = user.role === "parent" ? "/parent/dashboard" : "/dashboard";

    const response = NextResponse.json({
      success: true,
      message: "Two-factor authentication successful.",
      user: sanitizedUser,
      assignments,
      redirectUrl,
    });

    // Set secure HTTP-only cookie
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());

    return response;
  } catch (err: any) {
    const message = err.message || "Verification code validation failed.";
    const isExceeded = message.includes("Too many incorrect");
    const isExpired = message.includes("expired");

    return NextResponse.json(
      {
        success: false,
        error: message,
        code: isExceeded ? "ATTEMPTS_EXCEEDED" : isExpired ? "OTP_EXPIRED" : "INVALID_OTP",
      },
      { status: 401 }
    );
  }
}
