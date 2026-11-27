import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";
import { hashPassword } from "@/lib/auth/password";
import {
  SESSION_COOKIE_NAME,
  signSession,
  getSessionCookieOptions,
} from "@/lib/auth/session";
import { validateUsername, validateEmail, validatePassword } from "@/lib/auth/validation";
import { rateLimiter, getClientIp } from "@/lib/auth/rateLimiter";
import { securityAudit } from "@/lib/auth/auditLog";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    // Rate limit registration by IP: maximum 5 registrations per hour
    const regLimit = rateLimiter.consume(`signup:ip:${ip}`, 5, 3600);
    if (!regLimit.allowed) {
      securityAudit.record({
        eventType: "SIGNUP_FAILED",
        identifier: ip,
        ip,
        status: "failure",
        details: { reason: "rate_limit_exceeded" },
      });
      return NextResponse.json(
        {
          success: false,
          error: `Too many account creation requests from this IP address. Please wait ${regLimit.resetSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { name, email, password, schoolId, role } = body;

    // 1. Strict Username Validation (only alphabetic letters A-Z, a-z, and Unicode alphabetic letters)
    const nameValidation = validateUsername(name);
    if (!nameValidation.isValid) {
      return NextResponse.json(
        { success: false, error: nameValidation.error, field: "name" },
        { status: 400 }
      );
    }

    // 2. Strict Email Validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { success: false, error: emailValidation.error, field: "email" },
        { status: 400 }
      );
    }
    const normalizedEmail = emailValidation.data!;

    // 3. Strict Password Validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.error, field: "password" },
        { status: 400 }
      );
    }

    // 4. Role Escalation Prevention: reject unauthorized admin role registration
    if (role && (role === "admin" || role === "principal")) {
      securityAudit.record({
        eventType: "ROLE_ESCALATION_BLOCKED",
        identifier: normalizedEmail,
        ip,
        status: "failure",
        details: { requestedRole: role },
      });
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Administrator accounts cannot be created through public registration.",
        },
        { status: 403 }
      );
    }

    // 5. Existing account check
    const existing = await db.getUserByEmailAsync(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email address already exists. Please sign in instead.",
          existing: true,
        },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);

    const newUser = await db.createUserAsync({
      name: nameValidation.data!,
      email: normalizedEmail,
      role: role === "parent" ? "parent" : "teacher",
      schoolId: schoolId || "sch-gn-01",
      provider: "local",
      passwordHash,
      status: "active",
    });

    securityAudit.record({
      eventType: "SIGNUP_SUCCESS",
      identifier: normalizedEmail,
      ip,
      role: newUser.role,
      status: "success",
    });

    const autoLogin = body.autoLogin === true || body.createSession === true;

    const sanitizedUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      schoolId: newUser.schoolId,
      avatarUrl: newUser.avatarUrl,
      provider: newUser.provider || "local",
      status: newUser.status || "active",
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully. Please log in to continue.",
      user: sanitizedUser,
    });

    // Only establish session if explicitly requested (e.g. headless integration tests)
    // Website registration flow strictly requires manual login on the Login page
    if (autoLogin) {
      const sessionToken = await signSession({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        schoolId: newUser.schoolId,
        provider: "local",
      });

      response.cookies.set(
        SESSION_COOKIE_NAME,
        sessionToken,
        getSessionCookieOptions()
      );
    }

    return response;
  } catch (err: any) {
    console.error("[Register Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create account." },
      { status: 500 }
    );
  }
}
