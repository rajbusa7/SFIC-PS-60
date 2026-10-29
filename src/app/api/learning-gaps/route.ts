import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";
import type { SubjectCode, GapPriority, GapStatus, MasteryStatus } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || undefined;
    const classroomId = searchParams.get("classroomId") || undefined;
    const gradeParam = searchParams.get("grade");
    const grade = gradeParam ? Number(gradeParam) : undefined;
    const subjectCode = (searchParams.get("subjectCode") as SubjectCode) || undefined;
    const conceptId = searchParams.get("conceptId") || undefined;
    const priority = (searchParams.get("priority") as GapPriority) || undefined;
    const status = (searchParams.get("status") as GapStatus) || undefined;
    const masteryStatus = (searchParams.get("masteryStatus") as MasteryStatus) || undefined;

    const gaps = db.getLearningGaps({
      studentId,
      classroomId,
      grade,
      subjectCode,
      conceptId,
      priority,
      status,
      masteryStatus,
    });

    return NextResponse.json({ success: true, gaps });
  } catch (error) {
    console.error("API GET /api/learning-gaps error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch learning gaps" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId } = body;

    if (!studentId || typeof studentId !== "string") {
      return NextResponse.json({ success: false, error: "Valid studentId is required" }, { status: 400 });
    }

    const student = db.getStudentById(studentId);
    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    const updatedGaps = db.recalculateLearningGapsForStudent(studentId);
    return NextResponse.json({ success: true, gaps: updatedGaps });
  } catch (error) {
    console.error("API POST /api/learning-gaps error:", error);
    return NextResponse.json({ success: false, error: "Recalculation failed" }, { status: 500 });
  }
}
