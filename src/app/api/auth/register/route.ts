import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";
import { hashPassword } from "@/lib/auth/password";
import { emailOtpService } from "@/lib/auth/emailOtpService";
import {
  SESSION_COOKIE_NAME,
  signSession,
  getSessionCookieOptions,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, schoolId, otp, code, otpCode } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Please enter your full name." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
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

    // Verify OTP if submitted during registration or check if pre-verified
    const submittedOtp = otp || code || otpCode;
    const pendingVer = emailOtpService.getPendingVerification(normalizedEmail);
    let isEmailVerified = pendingVer?.status === "verified" || Boolean(body.emailVerified);

    if (submittedOtp && typeof submittedOtp === "string") {
      await emailOtpService.verifyOtp(normalizedEmail, submittedOtp.trim(), "teacher");
      isEmailVerified = true;
    }

    const passwordHash = hashPassword(password);
    const now = new Date().toISOString();

    const newUser = await db.createUserAsync({
      name: name.trim(),
      email: normalizedEmail,
      role: "teacher",
      schoolId: schoolId || "sch-gn-01",
      provider: "local",
      passwordHash,
      status: "active",
      emailVerified: isEmailVerified,
      emailVerifiedAt: isEmailVerified ? now : undefined,
    });

    const sessionToken = await signSession({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      schoolId: newUser.schoolId,
      provider: "local",
      emailVerified: isEmailVerified,
    });

    const sanitizedUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      schoolId: newUser.schoolId,
      avatarUrl: newUser.avatarUrl,
      provider: newUser.provider || "local",
      status: newUser.status || "active",
      emailVerified: isEmailVerified,
      emailVerifiedAt: isEmailVerified ? now : undefined,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    const response = NextResponse.json({
      success: true,
      message: "Teacher account created successfully.",
      user: sanitizedUser,
    });

    response.cookies.set(
      SESSION_COOKIE_NAME,
      sessionToken,
      getSessionCookieOptions()
    );

    return response;
  } catch (err: any) {
    console.error("[Register Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create teacher account." },
      { status: 500 }
    );
  }
}
