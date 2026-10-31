import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";
import { hashPassword } from "@/lib/auth/password";
import {
  SESSION_COOKIE_NAME,
  signSession,
  getSessionCookieOptions,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, password, confirmPassword, linkingCode, preferredLanguage } = body;

    // 1. Input Validation
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

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Passwords do not match. Please re-enter." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Prevent duplicate accounts
    const existing = await db.getUserByEmailAsync(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email already exists. Please sign in instead.",
          existing: true,
        },
        { status: 409 }
      );
    }

    // 3. Hash password securely (PBKDF2-SHA256)
    const passwordHash = hashPassword(password);

    // 4. Create User with enforced 'parent' role (never allow client-chosen role)
    const newUser = await db.createUserAsync({
      name: name.trim(),
      email: normalizedEmail,
      role: "parent",
      schoolId: "sch-gn-01",
      provider: "local",
      passwordHash,
      status: "active",
    });

    // 5. Create Parent Profile
    const parentProfile = await db.createParentProfileAsync({
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: phone ? String(phone).trim() : undefined,
      preferredLanguage: preferredLanguage || "gu",
      relationship: "guardian",
      studentIds: [],
    });

    // 6. Optional: If a child linking code was provided during registration, redeem it
    let linkedStudentId: string | undefined;
    if (linkingCode && typeof linkingCode === "string" && linkingCode.trim()) {
      const redeemRes = await db.redeemLinkingCodeAsync(
        linkingCode.trim(),
        newUser.id,
        parentProfile.id
      );
      if (redeemRes.success && redeemRes.studentId) {
        linkedStudentId = redeemRes.studentId;
        parentProfile.studentIds = [redeemRes.studentId];
      }
    }

    // 7. Establish secure session token & cookie
    const sessionToken = await signSession({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: "parent",
      schoolId: newUser.schoolId,
      provider: "local",
    });

    const sanitizedUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: "parent" as const,
      schoolId: newUser.schoolId,
      provider: "local" as const,
      status: "active" as const,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    const response = NextResponse.json({
      success: true,
      message: "Parent account registered successfully.",
      user: sanitizedUser,
      parentProfile,
      linkedStudentId,
    });

    response.cookies.set(
      SESSION_COOKIE_NAME,
      sessionToken,
      getSessionCookieOptions()
    );

    return response;
  } catch (err: any) {
    console.error("[Register Parent Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to register parent account." },
      { status: 500 }
    );
  }
}

