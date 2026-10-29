import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = db.getStudentById(id);

    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    const results = db.getResults(id);
    const gaps = db.getLearningGaps(id);
    const remedialPlans = db.getRemedialPlans(id);
    const attempts = db.getAttempts(id);

    return NextResponse.json({
      success: true,
      student,
      results,
      gaps,
      remedialPlans,
      attempts,
    });
  } catch (error) {
    console.error("API GET /api/students/[id] error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = db.getStudentById(id);
    if (!student) {
      return NextResponse.json({ success: false, error: `Student with id '${id}' not found` }, { status: 404 });
    }

    const updates = await request.json();
    const updated = db.updateStudent(id, updates);

    return NextResponse.json({ success: true, student: updated });
  } catch (error: any) {
    console.error("API PUT /api/students/[id] error:", error);
    const isConflict = error.message?.includes("already in use") || error.message?.includes("already exists");
    return NextResponse.json(
      { success: false, error: error.message || "Update failed" },
      { status: isConflict ? 409 : 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = db.getStudentById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: `Student with id '${id}' not found` }, { status: 404 });
    }

    const deleted = db.deleteStudent(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Failed to delete student" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Student '${existing.displayName}' (${existing.studentCode}) removed successfully`,
    });
  } catch (error: any) {
    console.error("API DELETE /api/students/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message || "Delete failed" }, { status: 500 });
  }
}
