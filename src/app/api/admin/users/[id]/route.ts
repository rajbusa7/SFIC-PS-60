import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth/session";
import { db } from "@/lib/db/database";
import { hashPassword } from "@/lib/auth/password";
import type { UserRole, UserStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/users/[id]
 * Updates permitted user fields (name, role, schoolId, status, password).
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
    const token = match ? decodeURIComponent(match[1]) : null;

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const session = await verifySession(token);
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied: Administrative privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates: any = {};

    if (body.name && typeof body.name === "string") updates.name = body.name.trim();
    if (body.schoolId && typeof body.schoolId === "string") updates.schoolId = body.schoolId.trim();
    if (body.role && ["teacher", "admin", "parent"].includes(body.role)) updates.role = body.role as UserRole;
    if (body.status && ["active", "pending", "disabled"].includes(body.status)) updates.status = body.status as UserStatus;
    if (body.password && typeof body.password === "string" && body.password.length >= 6) {
      updates.passwordHash = hashPassword(body.password);
    }

    const updated = await db.updateUserAsync(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "User profile updated successfully.",
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        schoolId: updated.schoolId,
        avatarUrl: updated.avatarUrl,
        provider: updated.provider,
        status: updated.status || "active",
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update user." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Deletes a user account from the persistent database.
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
    const token = match ? decodeURIComponent(match[1]) : null;

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const session = await verifySession(token);
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied: Administrative privileges required." },
        { status: 403 }
      );
    }

    // Prevent administrator from deleting their own account (prevents lockout)
    if (session.id === id) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own active administrator account." },
        { status: 400 }
      );
    }

    const deleted = await db.deleteUserAsync(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "User account deleted successfully from the persistent database.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete user." },
      { status: 500 }
    );
  }
}
