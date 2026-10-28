import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth/session";
import { db } from "@/lib/db/database";
import { hashPassword } from "@/lib/auth/password";
import type { UserRole, UserStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/admin/users
 * Returns list of all registered users from the persistent database.
 * Strictly restricted to authorized administrators.
 * Passwords, password hashes, and security secrets are NEVER returned.
 */
export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
    const token = match ? decodeURIComponent(match[1]) : null;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required to access administrative records." },
        { status: 401 }
      );
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session invalid or expired." },
        { status: 401 }
      );
    }

    // Role-based Access Control: Only admins can view user records
    if (session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied: Administrative privileges required." },
        { status: 403 }
      );
    }

    // Fetch authoritative user list from persistent database
    const users = await db.getUsersAsync();

    // Sanitize user records to prevent exposure of sensitive security data
    const sanitizedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      schoolId: u.schoolId,
      googleId: u.googleId || null,
      avatarUrl: u.avatarUrl || null,
      provider: u.provider || "local",
      status: u.status || "active",
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      count: sanitizedUsers.length,
      users: sanitizedUsers,
    });
  } catch (error: any) {
    console.error("[Admin Users GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve users." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Allows an administrator to create or invite a user account.
 */
export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
    const token = match ? decodeURIComponent(match[1]) : null;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const session = await verifySession(token);
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied: Administrative privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, role, schoolId, password, status } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ success: false, error: "Full name is required." }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Valid email is required." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db.getUserByEmailAsync(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists." },
        { status: 409 }
      );
    }

    const userRole: UserRole = role === "admin" || role === "parent" ? role : "teacher";
    const userStatus: UserStatus = status === "disabled" || status === "pending" ? status : "active";
    const passwordHash = password ? hashPassword(password) : undefined;

    const created = await db.createUserAsync({
      name: name.trim(),
      email: normalizedEmail,
      role: userRole,
      schoolId: schoolId || "sch-gn-01",
      provider: "local",
      passwordHash,
      status: userStatus,
    });

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully.",
        user: {
          id: created.id,
          name: created.name,
          email: created.email,
          role: created.role,
          schoolId: created.schoolId,
          provider: created.provider,
          status: created.status || "active",
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Admin Users POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create user." },
      { status: 500 }
    );
  }
}

