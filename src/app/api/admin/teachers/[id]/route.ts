import { NextResponse } from "next/server";
import { authorizeAdminOnly } from "@/lib/auth/authorization";
import { db } from "@/lib/db/database";
import { hashPassword } from "@/lib/auth/password";
import type { SubjectCode } from "@shared/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/teachers/[id]
 * Retrieves specific teacher profile and their subject/class assignments.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminOnly(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const cleanId = id.trim();

  const teacher =
    (await db.getUserByIdAsync(cleanId)) ||
    (await db.getUserByEmailAsync(cleanId)) ||
    db.getUserById(cleanId) ||
    db.getUserByEmail(cleanId);

  if (!teacher || teacher.role !== "teacher") {
    return NextResponse.json({ success: false, error: "Teacher not found." }, { status: 404 });
  }

  const assignments = db.getTeacherAssignments(teacher.id);

  return NextResponse.json({
    success: true,
    teacher: {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || null,
      role: teacher.role,
      status: teacher.status || "active",
      teacherType: teacher.teacherType || (assignments.some((a) => a.isClassTeacher) ? "class" : "subject"),
      schoolId: teacher.schoolId,
      assignments,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
    },
  });
}

/**
 * PATCH / PUT /api/admin/teachers/[id]
 * Updates teacher details, activation status, or credentials.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, params);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, params);
}

async function handleUpdate(
  request: Request,
  paramsPromise: Promise<{ id: string }>
) {
  const auth = await authorizeAdminOnly(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await paramsPromise;
  const cleanId = id.trim();

  const teacher =
    (await db.getUserByIdAsync(cleanId)) ||
    (await db.getUserByEmailAsync(cleanId)) ||
    db.getUserById(cleanId) ||
    db.getUserByEmail(cleanId);

  if (!teacher || teacher.role !== "teacher") {
    return NextResponse.json({ success: false, error: "Teacher not found." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { name, email, status, teacherType, password, assignedSubjects, assignedClasses } = body;

    const updates: any = {};
    if (name && typeof name === "string" && name.trim()) {
      updates.name = name.trim();
    }
    if (email && typeof email === "string" && email.includes("@")) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== teacher.email.toLowerCase()) {
        const existing = await db.getUserByEmailAsync(normalizedEmail);
        if (existing && existing.id !== teacher.id) {
          return NextResponse.json({ success: false, error: "Email is already taken by another account." }, { status: 409 });
        }
        updates.email = normalizedEmail;
      }
    }
    if (status && (status === "active" || status === "disabled" || status === "pending")) {
      updates.status = status;
    }
    if (teacherType && (teacherType === "subject" || teacherType === "class")) {
      updates.teacherType = teacherType;
      updates.isClassTeacher = teacherType === "class";
    }
    if (password && typeof password === "string" && password.trim()) {
      updates.passwordHash = hashPassword(password.trim());
    }

    const updatedUser = await db.updateUserAsync(teacher.id, updates);
    if (!updatedUser) {
      return NextResponse.json({ success: false, error: "Failed to update teacher in database." }, { status: 500 });
    }

    // Update assignments if subjects were provided
    if (Array.isArray(assignedSubjects)) {
      const parsedGrades = Array.isArray(assignedClasses)
        ? assignedClasses.map(Number).filter((g) => g >= 1 && g <= 5)
        : [1, 2, 3, 4, 5];

      // Remove previous assignments if requested
      db.deleteTeacherAssignmentsByTeacherId(teacher.id);

      for (const sub of assignedSubjects) {
        const normSub = String(sub).trim().toUpperCase() as SubjectCode;
        db.setTeacherAssignment({
          teacherId: teacher.id,
          teacherName: updatedUser.name,
          teacherEmail: updatedUser.email,
          schoolId: updatedUser.schoolId,
          subjectCode: normSub,
          classroomIds: parsedGrades.map((g) => `cls-${g}a`),
          grades: parsedGrades,
          classes: parsedGrades.map((g) => `Class ${g}`),
          isClassTeacher: updates.isClassTeacher ?? teacher.isClassTeacher,
        });
      }
    }

    // Record audit log
    db.recordAuditLog({
      teacherId: teacher.id,
      teacherName: updatedUser.name,
      studentId: "system",
      studentName: "Teacher Directory",
      subjectCode: "MATH",
      assessmentId: "admin",
      previousMarks: 0,
      updatedMarks: 1,
      action: `UPDATE_TEACHER_${teacher.id}_STATUS_${updatedUser.status}`,
    });

    const refreshedAssignments = db.getTeacherAssignments(teacher.id);

    return NextResponse.json({
      success: true,
      message: "Teacher account updated successfully.",
      teacher: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status || "active",
        teacherType: updatedUser.teacherType || "subject",
        schoolId: updatedUser.schoolId,
        assignments: refreshedAssignments,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update teacher." }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/teachers/[id]
 * Deletes teacher account and safely cascade-deletes related assignments.
 * Student assessment results remain safely stored in the database.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminOnly(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const cleanId = id.trim();

  const teacher =
    (await db.getUserByIdAsync(cleanId)) ||
    (await db.getUserByEmailAsync(cleanId)) ||
    db.getUserById(cleanId) ||
    db.getUserByEmail(cleanId);

  if (!teacher || teacher.role !== "teacher") {
    return NextResponse.json({ success: false, error: "Teacher not found." }, { status: 404 });
  }

  try {
    // 1. Cascade-remove assignments for this teacher
    const assignmentsRemoved = db.deleteTeacherAssignmentsByTeacherId(teacher.id);

    // 2. Remove teacher account from DB
    await db.deleteUserAsync(teacher.id);

    // 3. Record audit log
    db.recordAuditLog({
      teacherId: teacher.id,
      teacherName: teacher.name,
      studentId: "system",
      studentName: "Teacher Directory",
      subjectCode: "MATH",
      assessmentId: "admin",
      previousMarks: assignmentsRemoved,
      updatedMarks: 0,
      action: `DELETE_TEACHER_${teacher.id}`,
    });

    return NextResponse.json({
      success: true,
      message: `Teacher '${teacher.name}' and ${assignmentsRemoved} subject assignments were removed successfully.`,
      cascadedAssignmentsRemoved: true,
      assignmentsCountRemoved: assignmentsRemoved,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to delete teacher." }, { status: 500 });
  }
}
