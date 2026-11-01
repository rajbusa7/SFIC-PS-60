import { NextResponse } from "next/server";
import { authorizeAdminOnly } from "@/lib/auth/authorization";
import { db } from "@/lib/db/database";
import { hashPassword } from "@/lib/auth/password";
import type { SubjectCode } from "@shared/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/teachers
 * Retrieves all registered teachers and their active subject/class assignments.
 * Restricted strictly to authenticated School Administrators.
 */
export async function GET(request: Request) {
  const auth = await authorizeAdminOnly(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const allUsers = await db.getUsersAsync();
    const rawTeachers = allUsers.filter((u) => u.role === "teacher");
    const allAssignments = db.getTeacherAssignments();

    const teachers = rawTeachers.map((t) => {
      const teacherAssignments = allAssignments.filter((a) => a.teacherId === t.id);
      return {
        id: t.id,
        name: t.name,
        email: t.email,
        phone: t.phone || null,
        role: t.role,
        status: t.status || "active",
        teacherType: t.teacherType || (teacherAssignments.some((a) => a.isClassTeacher) ? "class" : "subject"),
        schoolId: t.schoolId,
        avatarUrl: t.avatarUrl || null,
        provider: t.provider || "local",
        assignments: teacherAssignments.map((a) => ({
          id: a.id,
          subjectCode: a.subjectCode,
          classroomIds: a.classroomIds || [],
          grades: a.grades || [],
          classes: a.grades ? a.grades.map((g) => `Class ${g}`) : [],
          isClassTeacher: Boolean(a.isClassTeacher),
        })),
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      count: teachers.length,
      teachers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve teachers." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/teachers
 * Registers a new teacher account and optionally establishes initial subject/class assignments.
 * Password hashes are NEVER returned in the API response.
 */
export async function POST(request: Request) {
  const auth = await authorizeAdminOnly(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      teacherType = "subject",
      status = "active",
      assignedSubjects,
      assignedClasses,
      schoolId = "sch-gn-01",
    } = body;

    // 1. Validation
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ success: false, error: "Teacher full name is required." }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "A valid email address is required." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Prevent duplicate accounts
    const existing = await db.getUserByEmailAsync(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: `A user account with email '${normalizedEmail}' is already registered and exists.` },
        { status: 409 }
      );
    }

    // 3. Secure password hashing
    const rawPassword = password && typeof password === "string" && password.trim() ? password.trim() : "Teacher@123";
    const passwordHash = hashPassword(rawPassword);

    // 4. Stable Teacher ID generation
    const customTeacherId = `usr-teacher-${Date.now().toString().slice(-6)}`;

    // 5. Store in persistent database
    const created = await db.createUserAsync({
      name: name.trim(),
      email: normalizedEmail,
      role: "teacher",
      schoolId,
      provider: "local",
      passwordHash,
      status: status === "disabled" || status === "pending" ? status : "active",
      teacherType: teacherType === "class" ? "class" : "subject",
      isClassTeacher: teacherType === "class",
    });

    const teacherId = created.id || customTeacherId;

    // 6. Handle initial subject and class assignments if provided
    const initialAssignments = [];
    if (Array.isArray(body.initialAssignments) && body.initialAssignments.length > 0) {
      for (const item of body.initialAssignments) {
        const normSub = String(item.subjectCode || "MATH").trim().toUpperCase() as SubjectCode;
        const parsedGrades = Array.isArray(item.grades)
          ? item.grades.map(Number).filter((g: number) => g >= 1 && g <= 5)
          : [1, 2, 3, 4, 5];
        const asg = db.setTeacherAssignment({
          teacherId,
          teacherName: created.name,
          teacherEmail: created.email,
          schoolId,
          subjectCode: normSub,
          classroomIds: parsedGrades.map((g: number) => `cls-${g}a`),
          grades: parsedGrades,
          classes: parsedGrades.map((g: number) => `Class ${g}`),
          isClassTeacher: teacherType === "class",
        });
        initialAssignments.push(asg);
      }
    } else if (Array.isArray(assignedSubjects) && assignedSubjects.length > 0) {
      const parsedGrades = Array.isArray(assignedClasses)
        ? assignedClasses.map(Number).filter((g) => g >= 1 && g <= 5)
        : [1, 2, 3, 4, 5];

      for (const sub of assignedSubjects) {
        const normSub = String(sub).trim().toUpperCase() as SubjectCode;
        const asg = db.setTeacherAssignment({
          teacherId,
          teacherName: created.name,
          teacherEmail: created.email,
          schoolId,
          subjectCode: normSub,
          classroomIds: parsedGrades.map((g) => `cls-${g}a`),
          grades: parsedGrades,
          classes: parsedGrades.map((g) => `Class ${g}`),
          isClassTeacher: teacherType === "class",
        });
        initialAssignments.push(asg);
      }
    }

    // 7. Record administrative audit log
    db.recordAuditLog({
      teacherId,
      teacherName: created.name,
      studentId: "system",
      studentName: "Teacher Directory",
      subjectCode: (assignedSubjects && assignedSubjects[0]) ? (assignedSubjects[0] as SubjectCode) : "MATH",
      assessmentId: "admin",
      previousMarks: 0,
      updatedMarks: 1,
      action: `CREATE_TEACHER_${teacherId}_STATUS_${created.status}`,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Teacher account created successfully.",
        teacher: {
          id: teacherId,
          name: created.name,
          email: created.email,
          role: created.role,
          status: created.status || "active",
          teacherType: created.teacherType || "subject",
          schoolId: created.schoolId,
          assignments: initialAssignments,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create teacher." },
      { status: 500 }
    );
  }
}
