import { NextResponse } from "next/server";
import { authorizeAdminOnly } from "@/lib/auth/authorization";
import { db } from "@/lib/db/database";
import type { SubjectCode } from "@shared/types";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminOnly(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const existing = db.getTeacherAssignmentById(id);
  if (!existing) {
    return NextResponse.json({ success: false, error: "Teacher assignment not found." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { subjectCode, classroomIds, grades } = body;

    const updated = db.setTeacherAssignment({
      id,
      teacherId: existing.teacherId,
      subjectCode: (subjectCode ? subjectCode.toUpperCase() : existing.subjectCode) as SubjectCode,
      classroomIds: Array.isArray(classroomIds) ? classroomIds : existing.classroomIds,
      grades: Array.isArray(grades) ? grades.map(Number).filter((g) => g >= 1 && g <= 5) : existing.grades,
    });

    return NextResponse.json({ success: true, assignment: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update assignment." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminOnly(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const deleted = db.deleteTeacherAssignment(id);
  if (!deleted) {
    return NextResponse.json({ success: false, error: "Assignment not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Assignment deleted successfully." });
}

