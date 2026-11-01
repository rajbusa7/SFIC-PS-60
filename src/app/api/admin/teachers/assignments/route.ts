import { NextResponse } from "next/server";
import { authorizeAdminOnly } from "@/lib/auth/authorization";
import { db } from "@/lib/db/database";
import type { SubjectCode } from "@shared/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await authorizeAdminOnly(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get("teacherId")?.trim() || undefined;

  const rawAssignments = db.getTeacherAssignments(teacherId);
  const allUsers = await db.getUsersAsync();
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  const enriched = rawAssignments.map((a) => {
    const userObj = userMap.get(a.teacherId) || db.getUserById(a.teacherId);
    return {
      ...a,
      teacherName: userObj?.name || a.teacherName || a.teacherId,
      teacherEmail: userObj?.email || a.teacherEmail || "",
      classes: a.grades ? a.grades.map((g) => `Class ${g}`) : [],
    };
  });

  return NextResponse.json({ success: true, assignments: enriched });
}

export async function POST(request: Request) {
  const auth = await authorizeAdminOnly(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { teacherId, subjectCode, classroomIds, grades, isClassTeacher } = body;

    if (!teacherId || typeof teacherId !== "string" || !teacherId.trim()) {
      return NextResponse.json({ success: false, error: "Teacher ID is required." }, { status: 400 });
    }

    if (!subjectCode || typeof subjectCode !== "string" || !subjectCode.trim()) {
      return NextResponse.json({ success: false, error: "Subject code is required." }, { status: 400 });
    }

    const cleanTeacherId = teacherId.trim();

    // Fix for "Teacher not found" bug:
    // Resolve teacher by ID or Email (handles cases where frontend passes ID or email, or async DB record)
    const teacher =
      (await db.getUserByIdAsync(cleanTeacherId)) ||
      (await db.getUserByEmailAsync(cleanTeacherId)) ||
      db.getUserById(cleanTeacherId) ||
      db.getUserByEmail(cleanTeacherId);

    if (!teacher) {
      return NextResponse.json(
        {
          success: false,
          error: `Teacher with identifier '${cleanTeacherId}' not found. Please ensure the teacher account exists.`,
        },
        { status: 404 }
      );
    }

    if (teacher.role !== "teacher") {
      return NextResponse.json({ success: false, error: "Selected user is not a teacher account." }, { status: 400 });
    }

    const canonicalTeacherId = teacher.id;
    const normalizedSubject = subjectCode.trim().toUpperCase() as SubjectCode;
    const parsedGrades = Array.isArray(grades)
      ? grades.map(Number).filter((g) => g >= 1 && g <= 5)
      : [1, 2, 3, 4, 5];
    const computedClassroomIds = Array.isArray(classroomIds) && classroomIds.length > 0
      ? classroomIds
      : parsedGrades.map((g) => `cls-${g}a`);

    const assigned = db.setTeacherAssignment({
      teacherId: canonicalTeacherId,
      teacherName: teacher.name,
      teacherEmail: teacher.email,
      schoolId: teacher.schoolId,
      subjectCode: normalizedSubject,
      classroomIds: computedClassroomIds,
      grades: parsedGrades,
      classes: parsedGrades.map((g) => `Class ${g}`),
      isClassTeacher: Boolean(isClassTeacher),
    });

    db.recordAuditLog({
      teacherId: canonicalTeacherId,
      teacherName: teacher.name,
      studentId: "system",
      studentName: "Teacher Assignment",
      subjectCode: normalizedSubject,
      assessmentId: "mgmt",
      previousMarks: 0,
      updatedMarks: parsedGrades.length,
      action: `ASSIGN_SUBJECT_${normalizedSubject}_CLASSES_${parsedGrades.join(",")}`,
    });

    return NextResponse.json({ success: true, assignment: assigned }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to create assignment." }, { status: 500 });
  }
}
