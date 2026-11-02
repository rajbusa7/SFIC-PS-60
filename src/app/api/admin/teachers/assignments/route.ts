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
  const allUsers = (await db.getUsersAsync().catch(() => null)) || db.getUsers();
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  const enriched = rawAssignments.map((a) => {
    const userObj = userMap.get(a.teacherId) || db.getUserById(a.teacherId);
    const resolvedName = userObj?.name || a.teacherName || a.teacherId;
    const resolvedEmail = userObj?.email || a.teacherEmail || "";
    const resolvedGrades = Array.isArray(a.grades) && a.grades.length > 0
      ? a.grades
      : [1, 2, 3, 4, 5];
    const resolvedClasses = a.classes && a.classes.length > 0
      ? a.classes
      : resolvedGrades.map((g) => `Class ${g}`);

    return {
      ...a,
      grades: resolvedGrades,
      classes: resolvedClasses,
      teacherName: resolvedName,
      teacherEmail: resolvedEmail,
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
    const { teacherId, teacherEmail, teacherName, subjectCode, classroomIds, grades, isClassTeacher } = body;

    if (!teacherId || typeof teacherId !== "string" || !teacherId.trim()) {
      return NextResponse.json({ success: false, error: "Teacher ID is required." }, { status: 400 });
    }

    if (!subjectCode || typeof subjectCode !== "string" || !subjectCode.trim()) {
      return NextResponse.json({ success: false, error: "Subject code is required." }, { status: 400 });
    }

    const cleanTeacherId = teacherId.trim();
    const cleanTeacherEmail = typeof teacherEmail === "string" ? teacherEmail.trim().toLowerCase() : "";
    const cleanTeacherName = typeof teacherName === "string" ? teacherName.trim().toLowerCase() : "";

    // Fix for "Teacher not found" bug:
    // Comprehensive omnidirectional lookup across async DB, local store, ID, Email, and Name
    let teacher =
      (await db.getUserByIdAsync(cleanTeacherId).catch(() => null)) ||
      (await db.getUserByEmailAsync(cleanTeacherId).catch(() => null)) ||
      (cleanTeacherEmail ? await db.getUserByEmailAsync(cleanTeacherEmail).catch(() => null) : null) ||
      db.getUserById(cleanTeacherId) ||
      db.getUserByEmail(cleanTeacherId) ||
      (cleanTeacherEmail ? db.getUserByEmail(cleanTeacherEmail) : null);

    if (!teacher) {
      const allUsers = (await db.getUsersAsync().catch(() => null)) || db.getUsers();
      teacher = allUsers.find(
        (u) =>
          u.id.toLowerCase() === cleanTeacherId.toLowerCase() ||
          u.email.toLowerCase() === cleanTeacherId.toLowerCase() ||
          (cleanTeacherEmail && u.email.toLowerCase() === cleanTeacherEmail) ||
          u.name.toLowerCase() === cleanTeacherId.toLowerCase() ||
          (cleanTeacherName && u.name.toLowerCase() === cleanTeacherName)
      ) || null;
    }

    if (!teacher) {
      return NextResponse.json(
        {
          success: false,
          error: "Teacher not found.",
        },
        { status: 404 }
      );
    }

    // Role check: allow teacher accounts and school admin accounts
    if (teacher.role !== "teacher" && teacher.role !== "admin") {
      return NextResponse.json({ success: false, error: "Selected user is not a teacher account." }, { status: 400 });
    }

    const canonicalTeacherId = teacher.id;
    const normalizedSubject = subjectCode.trim().toUpperCase() as SubjectCode;
    const parsedGrades = Array.isArray(grades)
      ? Array.from(new Set(grades.map(Number))).filter((g) => g >= 1 && g <= 5).sort((a, b) => a - b)
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
