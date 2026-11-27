import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";
import { extractSessionToken, verifySession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get("classroomId") || undefined;
    const gradeParam = searchParams.get("grade");
    const grade = gradeParam ? parseInt(gradeParam, 10) : undefined;
    const search = searchParams.get("search") || undefined;

    const token = await extractSessionToken(request);
    const session = token ? await verifySession(token) : null;

    if (session && session.role === "teacher") {
      const assignments = db.getTeacherAssignments(session.id);
      if (!assignments || assignments.length === 0) {
        return NextResponse.json(
          { success: false, error: "No subjects have been assigned to your account. Please contact your administrator." },
          { status: 403, headers: noCacheHeaders }
        );
      }

      const assignedClassroomIds = assignments.flatMap((a) => a.classroomIds || []);
      const assignedGrades = assignments.flatMap((a) => a.grades || []);

      if (classroomId && classroomId !== "all" && !assignedClassroomIds.includes(classroomId)) {
        return NextResponse.json(
          { success: false, error: `Forbidden: You are not authorized to view class '${classroomId}'.` },
          { status: 403, headers: noCacheHeaders }
        );
      }

      if (typeof grade === "number" && !assignedGrades.includes(grade)) {
        return NextResponse.json(
          { success: false, error: `Forbidden: You are not authorized to view Grade ${grade}.` },
          { status: 403, headers: noCacheHeaders }
        );
      }

      let students = await db.getStudentsAsync({ classroomId, grade, search });
      // Restrict to authorized classrooms/grades
      students = students.filter(
        (s) => assignedClassroomIds.includes(s.classroomId) || assignedGrades.includes(s.grade)
      );

      return NextResponse.json(
        { success: true, count: students.length, students },
        { headers: noCacheHeaders }
      );
    }

    const students = await db.getStudentsAsync({ classroomId, grade, search });
    return NextResponse.json(
      { success: true, count: students.length, students },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error("API /api/students error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch students" },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const { studentCode, displayName, classroomId, grade, section, enrollmentStatus, notes } = body;

    const trimmedName = typeof displayName === "string" ? displayName.trim() : "";
    const trimmedCode = typeof studentCode === "string" ? studentCode.trim() : "";
    const parsedGrade = Number(grade);
    const sec = typeof section === "string" && section.trim() ? section.trim().toUpperCase() : "A";

    if (!trimmedName || trimmedName.length < 2) {
      return NextResponse.json(
        { success: false, error: "Student full name is required (minimum 2 characters)" },
        { status: 400, headers: noCacheHeaders }
      );
    }

    if (!trimmedCode || trimmedCode.length < 2) {
      return NextResponse.json(
        { success: false, error: "Student code / roll number is required (minimum 2 characters)" },
        { status: 400, headers: noCacheHeaders }
      );
    }

    if (isNaN(parsedGrade) || parsedGrade < 1 || parsedGrade > 5) {
      return NextResponse.json(
        { success: false, error: "Grade must be an integer between 1 and 5 (Primary School)" },
        { status: 400, headers: noCacheHeaders }
      );
    }

    if (!["A", "B", "C"].includes(sec)) {
      return NextResponse.json(
        { success: false, error: "Section must be A, B, or C" },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const clsId = classroomId || `cls-${parsedGrade}${sec.toLowerCase()}`;

    const token = await extractSessionToken(request);
    const session = token ? await verifySession(token) : null;

    if (session && session.role === "teacher") {
      const assignments = db.getTeacherAssignments(session.id);
      if (!assignments || assignments.length === 0) {
        return NextResponse.json(
          { success: false, error: "No subjects have been assigned to your account. Please contact your administrator." },
          { status: 403, headers: noCacheHeaders }
        );
      }
      const assignedClassroomIds = assignments.flatMap((a) => a.classroomIds || []);
      const assignedGrades = assignments.flatMap((a) => a.grades || []);

      if (!assignedClassroomIds.includes(clsId) && !assignedGrades.includes(parsedGrade)) {
        return NextResponse.json(
          { success: false, error: `Forbidden: You are not authorized to enroll students in Grade ${parsedGrade} (${clsId}).` },
          { status: 403, headers: noCacheHeaders }
        );
      }
    }

    // Duplicate check on roll / student code
    const existingStudents = await db.getStudentsAsync();
    const isDuplicate = existingStudents.some(
      (s) => s.studentCode.trim().toLowerCase() === trimmedCode.toLowerCase()
    );
    if (isDuplicate) {
      return NextResponse.json(
        { success: false, error: `Student with code '${trimmedCode}' already exists.` },
        { status: 409, headers: noCacheHeaders }
      );
    }

    const newStudent = await db.addStudentAsync({
      studentCode: trimmedCode,
      displayName: trimmedName,
      classroomId: clsId,
      grade: parsedGrade,
      section: sec,
      enrollmentStatus: enrollmentStatus || "active",
      notes: typeof notes === "string" ? notes.trim() : "",
    });

    // Handle Parent Record Association
    let linkedParent: any = null;
    if (body.parentId) {
      await db.linkParentToStudentAsync(body.parentId, newStudent.id, body.parentRelationship || "guardian");
      linkedParent = await db.getParentByIdAsync(body.parentId);
    } else if (body.parentName && typeof body.parentName === "string" && body.parentName.trim().length >= 2) {
      const pName = body.parentName.trim();
      const pPhone = typeof body.parentPhone === "string" ? body.parentPhone.trim() : "";
      const pEmail = typeof body.parentEmail === "string" ? body.parentEmail.trim() : "";
      const pRel = ["father", "mother", "guardian"].includes(body.parentRelationship) ? body.parentRelationship : "guardian";

      let existingParent = pPhone ? db.getParentByPhone(pPhone) : undefined;
      if (!existingParent) {
        existingParent = db.getParents().find((p) => p.name.toLowerCase() === pName.toLowerCase());
      }

      if (existingParent) {
        await db.linkParentToStudentAsync(existingParent.id, newStudent.id, pRel);
        linkedParent = existingParent;
      } else {
        const genId = `par-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        linkedParent = await db.createParentProfileAsync({
          id: genId,
          userId: `usr-${genId}`,
          name: pName,
          phone: pPhone,
          email: pEmail,
          relationship: pRel,
          studentIds: [newStudent.id],
          preferredLanguage: "gu",
        });
      }
    }

    return NextResponse.json(
      { success: true, student: newStudent, parent: linkedParent },
      { status: 201, headers: noCacheHeaders }
    );
  } catch (error) {
    console.error("API POST /api/students error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add student" },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
