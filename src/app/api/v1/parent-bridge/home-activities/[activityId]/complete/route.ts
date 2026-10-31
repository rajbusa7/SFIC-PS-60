import { NextResponse } from "next/server";
import { verifySession, extractSessionToken } from "@/lib/auth/session";
import { db } from "@/lib/db/database";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const { activityId } = await params;
    const sessionToken = await extractSessionToken(request);

    let sessionUser: any = null;
    if (sessionToken) {
      sessionUser = await verifySession(sessionToken);
    }

    const body = await request.json().catch(() => ({}));
    const { studentId, conceptId, completed = true, feedback = "" } = body;

    if (!studentId || typeof studentId !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid studentId is required." },
        { status: 400 }
      );
    }

    let parentId = "par-001";
    if (sessionUser && sessionUser.role === "parent") {
      const parentProfile = await db.getParentByUserIdAsync(sessionUser.id);
      if (!parentProfile) {
        return NextResponse.json(
          { success: false, error: "Parent profile not found." },
          { status: 404 }
        );
      }

      if (!(parentProfile.studentIds || []).includes(studentId)) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You are not authorized for this student." },
          { status: 403 }
        );
      }
      parentId = parentProfile.id;
    } else {
      const parents = db.getParentsByStudentId(studentId);
      if (parents.length > 0) {
        parentId = parents[0].id;
      }
    }

    const result = await db.recordParentActivityCompletionAsync(
      parentId,
      studentId,
      activityId,
      conceptId,
      Boolean(completed)
    );

    // If feedback provided, store on completion record
    if (feedback && result.completion) {
      result.completion.feedback = feedback;
    }

    return NextResponse.json({
      success: true,
      message: completed
        ? "Home activity marked as completed. Teacher has been notified."
        : "Home activity marked as pending.",
      data: result.completion,
    });
  } catch (error: any) {
    console.error("[Home Activity Complete Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record activity completion" },
      { status: 500 }
    );
  }
}

