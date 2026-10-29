import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assessment = db.getAssessmentById(id);

    if (!assessment) {
      return NextResponse.json(
        { success: false, error: `Assessment with id '${id}' not found` },
        { status: 404 }
      );
    }

    const results = db.getResults(undefined, undefined, id);
    const students = db.getStudents(assessment.classroomId);
    const concepts = db.getConcepts();

    return NextResponse.json({
      success: true,
      assessment,
      results,
      students,
      concepts,
    });
  } catch (error: any) {
    console.error("API GET /api/assessments/[id] error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existing = db.getAssessmentById(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: `Assessment with id '${id}' not found` },
        { status: 404 }
      );
    }

    const {
      title,
      assessmentDate,
      status,
      maxMarks,
      conceptIds,
      scores, // Optional updated scores array
    } = body;

    const updated = db.updateAssessment(
      id,
      {
        title: title ? String(title).trim() : existing.title,
        assessmentDate: assessmentDate || existing.assessmentDate,
        status: status || existing.status,
        maxMarks: maxMarks !== undefined ? Number(maxMarks) : existing.maxMarks,
        conceptIds: conceptIds || existing.conceptIds,
      },
      scores
    );

    return NextResponse.json({ success: true, assessment: updated });
  } catch (error: any) {
    console.error("API PUT /api/assessments/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update assessment" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = db.getAssessmentById(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: `Assessment with id '${id}' not found` },
        { status: 404 }
      );
    }

    const deleted = db.deleteAssessment(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Failed to delete assessment" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Assessment '${existing.title}' deleted successfully`,
    });
  } catch (error: any) {
    console.error("API DELETE /api/assessments/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message || "Delete failed" }, { status: 500 });
  }
}
