import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, conceptId, preTestAssessmentId, postTestAssessmentId } = body;

    if (!studentId || !conceptId) {
      return NextResponse.json(
        { success: false, error: "studentId and conceptId are required." },
        { status: 400 }
      );
    }

    const student = db.getStudentById(studentId);
    if (!student) {
      return NextResponse.json(
        { success: false, error: `Student '${studentId}' not found.` },
        { status: 404 }
      );
    }

    const comparison = db.compareAssessments(
      studentId,
      conceptId,
      preTestAssessmentId,
      postTestAssessmentId
    );

    return NextResponse.json({
      success: true,
      comparison,
    });
  } catch (error: any) {
    console.error("API POST /api/improvements/compare error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to compare assessments." },
      { status: 400 }
    );
  }
}
