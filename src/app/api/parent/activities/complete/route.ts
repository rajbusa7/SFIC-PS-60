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
    if (!session || session.role !== "parent") {
      return NextResponse.json(
        { success: false, error: "Access denied. Parent role required." },
        { status: 403 }
      );
    }

    const parentProfile = await db.getParentByUserIdAsync(session.id);
    if (!parentProfile) {
      return NextResponse.json(
        { success: false, error: "Parent profile not found." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { studentId, activityId, conceptId, completed = true } = body;

    if (!studentId || typeof studentId !== "string") {
      return NextResponse.json(
        { success: false, error: "Student ID is required." },
        { status: 400 }
      );
    }

    if (!activityId || typeof activityId !== "string") {
      return NextResponse.json(
        { success: false, error: "Activity ID is required." },
        { status: 400 }
      );
    }

    // STRICT RBAC: Verify parent is authorized for this student
    const isAuthorized = (parentProfile.studentIds || []).includes(studentId);
    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: You are not authorized to record activity for this student.",
        },
        { status: 403 }
      );
    }

    // Record the activity completion persistently in database
    const result = await db.recordParentActivityCompletionAsync(
      parentProfile.id,
      studentId,
      activityId,
      conceptId,
      completed
    );

    return NextResponse.json({
      success: true,
      message: completed
        ? "Home activity marked as completed successfully!"
        : "Home activity marked as pending.",
      completion: result.completion,
    });
  } catch (error: any) {
    console.error("[Parent Activity Complete API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record activity completion" },
      { status: 500 }
    );
  }
}
