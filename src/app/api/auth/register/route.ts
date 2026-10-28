import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";
import {
  SESSION_COOKIE_NAME,
  signSession,
  getSessionCookieOptions,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, schoolId } = body;

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

    const newUser = await db.createUserAsync({
      name: name.trim(),
      email: normalizedEmail,
      role: "teacher",
      schoolId: schoolId || "sch-gn-01",
      provider: "local",
    });

    const sessionToken = await signSession({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      schoolId: newUser.schoolId,
      provider: "local",
    });

    const response = NextResponse.json({
      success: true,
      message: "Teacher account created successfully.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        schoolId: newUser.schoolId,
        provider: "local",
      },
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
