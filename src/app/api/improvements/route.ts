import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";
import { validateAssessmentMarks } from "@/lib/engine/calculations";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || undefined;
    const conceptId = searchParams.get("conceptId") || undefined;
    const classroomId = searchParams.get("classroomId") || undefined;
    const status = searchParams.get("status") || undefined;

    const improvements = db.getImprovements({
      studentId,
      conceptId,
      classroomId,
      status,
    });

    return NextResponse.json({
      success: true,
      count: improvements.length,
      improvements,
    });
  } catch (error: any) {
    console.error("API GET /api/improvements error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch improvements" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      studentId,
      conceptId,
      assessmentId,
      marksObtained,
      maximumMarks,
      notes,
      assessmentDate,
      remedialPlanId,
    } = body;

    if (!studentId || !conceptId || !assessmentId || marksObtained === undefined || maximumMarks === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameters: studentId, conceptId, assessmentId, marksObtained, and maximumMarks are mandatory.",
        },
        { status: 400 }
      );
    }

    const marksNum = Number(marksObtained);
    const maxNum = Number(maximumMarks);

    const val = validateAssessmentMarks(marksNum, maxNum);
    if (!val.isValid) {
      return NextResponse.json(
        { success: false, error: val.error || "Invalid assessment marks." },
        { status: 400 }
      );
    }

    // Verify student exists
    const student = db.getStudentById(studentId);
    if (!student) {
      return NextResponse.json(
        { success: false, error: `Student with ID '${studentId}' not found.` },
        { status: 404 }
      );
    }

    // Record follow-up assessment and evaluate improvement
    const { result, improvement } = db.recordFollowUpAssessment({
      studentId,
      conceptId,
      assessmentId,
      marksObtained: marksNum,
      maximumMarks: maxNum,
      notes,
      assessmentDate,
      remedialPlanId,
    });

    return NextResponse.json({
      success: true,
      result,
      improvement,
    });
  } catch (error: any) {
    console.error("API POST /api/improvements error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record follow-up assessment." },
      { status: 500 }
    );
  }
}
