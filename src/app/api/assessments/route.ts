import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get("classroomId") || undefined;
    const assessments = db.getAssessments(classroomId);
    const classrooms = db.getClassrooms();
    const subjects = db.getSubjects();
    const concepts = db.getConcepts();

    return NextResponse.json({
      success: true,
      assessments,
      classrooms,
      subjects,
      concepts,
    });
  } catch (error) {
    console.error("API GET /api/assessments error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch assessments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      classroomId,
      subjectId,
      subjectCode,
      title,
      assessmentDate,
      status,
      maxMarks,
      conceptIds,
      scores, // Optional array of { studentId, conceptId, marksObtained, notes }
    } = body;

    if (!classroomId || !subjectId || !title || !assessmentDate || !maxMarks || !conceptIds?.length) {
      return NextResponse.json(
        { success: false, error: "Missing required assessment parameters" },
        { status: 400 }
      );
    }

    const initialResults = (scores || []).map((s: any) => ({
      studentId: s.studentId,
      conceptId: s.conceptId,
      marksObtained: Number(s.marksObtained),
      maximumMarks: Number(maxMarks),
      percentage: Math.round((Number(s.marksObtained) / Number(maxMarks)) * 100),
      notes: s.notes || "",
      recordedAt: assessmentDate,
    }));

    const assessment = db.createAssessment(
      {
        classroomId,
        subjectId,
        subjectCode: subjectCode || "MATH",
        title,
        assessmentDate,
        status: status || "published",
        maxMarks: Number(maxMarks),
        conceptIds,
      },
      initialResults
    );

    return NextResponse.json({ success: true, assessment });
  } catch (error) {
    console.error("API POST /api/assessments error:", error);
    return NextResponse.json({ success: false, error: "Failed to create assessment" }, { status: 500 });
  }
}
