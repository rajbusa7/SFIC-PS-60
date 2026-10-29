import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

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

    if (!title || !String(title).trim()) {
      return NextResponse.json(
        { success: false, error: "Assessment title is required" },
        { status: 400 }
      );
    }

    if (!classroomId || !String(classroomId).trim()) {
      return NextResponse.json(
        { success: false, error: "Classroom ID is required" },
        { status: 400 }
      );
    }

    if (!subjectId || !String(subjectId).trim()) {
      return NextResponse.json(
        { success: false, error: "Subject is required" },
        { status: 400 }
      );
    }

    const numMax = Number(maxMarks);
    if (isNaN(numMax) || numMax <= 0) {
      return NextResponse.json(
        { success: false, error: "Maximum marks must be a number greater than zero" },
        { status: 400 }
      );
    }

    if (!conceptIds || !Array.isArray(conceptIds) || conceptIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one target concept is required" },
        { status: 400 }
      );
    }

    if (scores && Array.isArray(scores)) {
      for (const s of scores) {
        const marks = Number(s.marksObtained);
        if (isNaN(marks) || marks < 0) {
          return NextResponse.json(
            { success: false, error: `Marks obtained for student cannot be negative` },
            { status: 400 }
          );
        }
        if (marks > numMax) {
          return NextResponse.json(
            { success: false, error: `Marks obtained (${marks}) cannot exceed maximum marks (${numMax})` },
            { status: 400 }
          );
        }
      }
    }

    const initialResults = (scores || []).map((s: any) => ({
      studentId: s.studentId,
      conceptId: s.conceptId || conceptIds[0],
      marksObtained: Number(s.marksObtained),
      maximumMarks: numMax,
      notes: s.notes || "",
      recordedAt: assessmentDate || new Date().toISOString(),
    }));

    const assessment = db.createAssessment(
      {
        classroomId,
        subjectId,
        subjectCode: subjectCode || "MATH",
        title: String(title).trim(),
        assessmentDate: assessmentDate || new Date().toISOString().split("T")[0],
        status: status || "published",
        maxMarks: numMax,
        conceptIds,
      },
      initialResults
    );

    return NextResponse.json({ success: true, assessment }, { status: 201 });
  } catch (error: any) {
    console.error("API POST /api/assessments error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create assessment" },
      { status: 400 }
    );
  }
}
