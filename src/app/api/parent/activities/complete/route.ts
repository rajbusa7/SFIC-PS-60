import { NextResponse } from "next/server";
import { verifySession, extractSessionToken } from "@/lib/auth/session";
import { db } from "@/lib/db/database";

export async function POST(request: Request) {
  try {
    const sessionToken = await extractSessionToken(request);

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Please sign in as a parent." },
        { status: 401 }
      );
    }

    const session = await verifySession(sessionToken);
    if (!session || (session.role !== "parent" && session.role !== "teacher" && session.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Access denied. Valid role required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentId, activityId, conceptId, completed = true } = body;

    if (!studentId || typeof studentId !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid studentId is required." },
        { status: 400 }
      );
    }

    if (!activityId || typeof activityId !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid activityId is required." },
        { status: 400 }
      );
    }

    let parentId = "par-001";
    if (session.role === "parent") {
      const parentProfile = await db.getParentByUserIdAsync(session.id);
      if (!parentProfile) {
        return NextResponse.json(
          { success: false, error: "Parent profile not found." },
          { status: 404 }
        );
      }

      // STRICT RBAC CHECK: The parent must be authorized for this student
      const isAuthorized = (parentProfile.studentIds || []).includes(studentId);
      if (!isAuthorized) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You are not authorized for this student." },
          { status: 403 }
        );
      }
      parentId = parentProfile.id;
    }

    const result = await db.recordParentActivityCompletionAsync(
      parentId,
      studentId,
      activityId,
      conceptId,
      Boolean(completed)
    );

    return NextResponse.json({
      success: true,
      message: completed
        ? "Home activity marked as completed and saved to persistent database."
        : "Home activity marked as incomplete.",
      completion: result.completion,
    });
  } catch (error: any) {
    console.error("[Record Activity Completion API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save activity completion." },
      { status: 500 }
    );
  }
}

