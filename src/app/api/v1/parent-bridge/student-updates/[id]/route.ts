import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";
import { extractSessionToken, verifySession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    const sessionToken = await extractSessionToken(request);
    let sessionUser: any = null;

    if (sessionToken) {
      sessionUser = await verifySession(sessionToken);
      if (sessionUser && sessionUser.role === "parent") {
        const parentProfile = await db.getParentByUserIdAsync(sessionUser.id);
        if (!parentProfile || !(parentProfile.studentIds || []).includes(studentId)) {
          return NextResponse.json(
            { success: false, error: "Forbidden: You are not authorized to access records for this student." },
            { status: 403 }
          );
        }
      }
    }

    const student = await db.getStudentByIdAsync(studentId);
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found." },
        { status: 404 }
      );
    }

    const attendance = db.getStudentAttendance(studentId) || {
      studentId,
      attendanceRate: 93.0,
      totalDays: 110,
      presentDays: 102,
      absentDays: 8,
      lastUpdated: new Date().toISOString(),
      recentAbsences: [],
    };

    const results = db.getResults(studentId);
    const learningGaps = db.getLearningGaps(studentId);
    const remedialPlans = db.getRemedialPlans(studentId);
    const communications = db.getParentCommunications({ studentId });
    const completions = await db.getParentActivityCompletionsAsync(studentId);
    const parents = db.getParentsByStudentId(studentId);

    return NextResponse.json({
      success: true,
      data: {
        student,
        parents,
        attendance,
        results,
        learningGaps,
        remedialPlans,
        communications,
        completions,
      },
    });
  } catch (error: any) {
    console.error("[Student Updates API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch student updates" },
      { status: 500 }
    );
  }
}

