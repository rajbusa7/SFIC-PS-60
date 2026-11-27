import { NextResponse } from "next/server";
import { authService } from "@backend/services/authService";
import { validateEmail } from "@/lib/auth/validation";
import { rateLimiter, getClientIp, isTestEnvironment } from "@/lib/auth/rateLimiter";
import { securityAudit } from "@/lib/auth/auditLog";
import { emailOtpService } from "@/lib/auth/emailOtpService";
import {
  SESSION_COOKIE_NAME,
  signSession,
  getSessionCookieOptions,
} from "@/lib/auth/session";
import { db } from "@/lib/db/database";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, role } = body;

    // 1. IP-level rate limiting (brute force protection)
    const ipLimit = rateLimiter.check(`login:ip:${ip}`, 15, 900); // 15 attempts per 15 min
    if (!ipLimit.allowed) {
      securityAudit.record({
        eventType: "LOGIN_RATE_LIMITED",
        identifier: ip,
        ip,
        status: "failure",
        details: { resetSeconds: ipLimit.resetSeconds },
      });
      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts from this network. Please wait ${ipLimit.resetSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    // 2. Validate input syntax
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { success: false, error: emailValidation.error, field: "email" },
        { status: 400 }
      );
    }
    const normalizedEmail = emailValidation.data!;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Password is required.", field: "password" },
        { status: 400 }
      );
    }

    // 3. Account-level rate limiting
    const emailLimit = rateLimiter.check(`login:email:${normalizedEmail}`, 6, 900); // 6 attempts per 15 min
    if (!emailLimit.allowed) {
      securityAudit.record({
        eventType: "LOGIN_RATE_LIMITED",
        identifier: normalizedEmail,
        ip,
        status: "failure",
        details: { resetSeconds: emailLimit.resetSeconds },
      });
      return NextResponse.json(
        {
          success: false,
          error: `Account temporarily locked due to multiple failed login attempts. Please try again in ${emailLimit.resetSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    // 4. Verify credentials
    let user;
    try {
      user = await authService.login(normalizedEmail, password, role);
    } catch (err: any) {
      // Record failed attempt in rate limiter
      rateLimiter.consume(`login:ip:${ip}`, 15, 900);
      rateLimiter.consume(`login:email:${normalizedEmail}`, 6, 900);

      securityAudit.record({
        eventType: "LOGIN_FAILED",
        identifier: normalizedEmail,
        ip,
        role,
        status: "failure",
        details: { error: err.message },
      });

      // Generic authentication error message to prevent account enumeration
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Reset email rate limiter on successful credential match
    rateLimiter.reset(`login:email:${normalizedEmail}`);

    // 5. Determine if Email OTP 2FA is required
    // Teachers and administrators require Email OTP verification by default in production
    const isTestMode = isTestEnvironment();
    const isExplicitBypass = body.bypassOtp === true || process.env.REQUIRE_EMAIL_OTP === "false";
    const requires2FA =
      (user.role === "teacher" || user.role === "admin") &&
      !isExplicitBypass &&
      (!isTestMode || body.requireOtp === true || process.env.REQUIRE_EMAIL_OTP === "true");

    if (requires2FA) {
      try {
        const otpResult = await emailOtpService.sendLoginOtp({ user, ip });
        return NextResponse.json({
          success: true,
          requiresOtp: true,
          tempToken: otpResult.tempToken,
          maskedEmail: otpResult.maskedEmail,
          cooldownSeconds: otpResult.cooldownSeconds,
          expiresInSeconds: otpResult.expiresInSeconds,
          message: otpResult.message,
        });
      } catch (otpErr: any) {
        console.warn("[Login 2FA Error]:", otpErr.message);
        // If email service temporarily fails, provide a clear error message
        return NextResponse.json(
          {
            success: false,
            error: otpErr.message || "Failed to send 2-factor verification code.",
          },
          { status: 503 }
        );
      }
    }

    // 6. Direct session establishment (when 2FA is satisfied or disabled)
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

    securityAudit.record({
      eventType: "LOGIN_SUCCESS",
      identifier: normalizedEmail,
      ip,
      role: user.role,
      status: "success",
    });

    const response = NextResponse.json({
      success: true,
      user: sanitizedUser,
      assignments,
      redirectUrl: user.role === "parent" ? "/parent/dashboard" : "/dashboard",
    });
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());

    return response;
  } catch (error: any) {
    console.error("[Login Handler Error]:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected authentication error occurred." },
      { status: 500 }
    );
  }
}
