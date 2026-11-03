import { NextResponse } from "next/server";
import { authorizeAdminOnly } from "@/lib/auth/authorization";
import { db } from "@/lib/db/database";
import { broadcastAssignmentChange } from "@/lib/realtime/assignmentBroadcaster";
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
  const existing = (await db.getTeacherAssignmentByIdAsync(id)) || db.getTeacherAssignmentById(id);
  if (!existing) {
    return NextResponse.json({ success: false, error: "Teacher assignment not found." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { subjectCode, classroomIds, grades } = body;

    const normalizedSubject = (subjectCode ? subjectCode.toUpperCase() : existing.subjectCode) as SubjectCode;
    const parsedGrades = Array.isArray(grades)
      ? Array.from(new Set(grades.map(Number))).filter((g) => g >= 1 && g <= 5).sort((a, b) => a - b)
      : existing.grades;
    const computedClassroomIds = Array.isArray(classroomIds) && classroomIds.length > 0
      ? classroomIds
      : existing.classroomIds;

    const updated = await db.setTeacherAssignmentAsync({
      id,
      teacherId: existing.teacherId,
      teacherName: existing.teacherName,
      teacherEmail: existing.teacherEmail,
      schoolId: existing.schoolId,
      subjectCode: normalizedSubject,
      classroomIds: computedClassroomIds,
      grades: parsedGrades,
      classes: parsedGrades.map((g) => `Class ${g}`),
    });

    broadcastAssignmentChange({
      type: "ASSIGNMENT_SAVED",
      teacherId: existing.teacherId,
      teacherEmail: existing.teacherEmail,
      subjectCode: normalizedSubject,
      classroomIds: computedClassroomIds,
      grades: parsedGrades,
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
  const existing = (await db.getTeacherAssignmentByIdAsync(id)) || db.getTeacherAssignmentById(id);
  const deleted = await db.deleteTeacherAssignmentAsync(id);
  if (!deleted) {
    return NextResponse.json({ success: false, error: "Assignment not found." }, { status: 404 });
  }

  if (existing) {
    broadcastAssignmentChange({
      type: "ASSIGNMENT_REMOVED",
      teacherId: existing.teacherId,
      teacherEmail: existing.teacherEmail,
      subjectCode: existing.subjectCode,
    });
  }

  return NextResponse.json({ success: true, message: "Assignment deleted successfully." });
}
