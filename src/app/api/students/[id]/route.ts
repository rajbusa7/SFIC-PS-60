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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = await db.getStudentByIdAsync(id);

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404, headers: noCacheHeaders }
      );
    }

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
      const assignedSubjectCodes = assignments.map((a) => a.subjectCode);

      const isClassAuthorized =
        assignedClassroomIds.includes(student.classroomId) || assignedGrades.includes(student.grade);

      if (!isClassAuthorized) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You are not authorized to view academic records for this student." },
          { status: 403, headers: noCacheHeaders }
        );
      }

      // Filter subject records for this teacher
      const allResults = db.getResults(id);
      const results = allResults.filter((r) => {
        const cpt = db.getConceptById(r.conceptId);
        return cpt && assignedSubjectCodes.includes(cpt.subjectCode);
      });

      const allGaps = db.getLearningGaps(id);
      const gaps = allGaps.filter(
        (g) => !g.subjectCode || assignedSubjectCodes.includes(g.subjectCode)
      );

      const remedialPlans = db.getRemedialPlans(id);
      const attempts = db.getAttempts(id);

      return NextResponse.json(
        {
          success: true,
          student,
          results,
          gaps,
          remedialPlans,
          attempts,
        },
        { headers: noCacheHeaders }
      );
    }

    const results = db.getResults(id);
    const gaps = db.getLearningGaps(id);
    const remedialPlans = db.getRemedialPlans(id);
    const attempts = db.getAttempts(id);

    return NextResponse.json(
      {
        success: true,
        student,
        results,
        gaps,
        remedialPlans,
        attempts,
      },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error("API GET /api/students/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.getStudentByIdAsync(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404, headers: noCacheHeaders }
      );
    }

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

      const isAuthorized =
        assignedClassroomIds.includes(existing.classroomId) || assignedGrades.includes(existing.grade);

      if (!isAuthorized) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You are not authorized to edit records for this student." },
          { status: 403, headers: noCacheHeaders }
        );
      }
    }

    const updates = await request.json();

    // Check duplicate roll code if changed
    if (updates.studentCode) {
      const all = await db.getStudentsAsync();
      const duplicate = all.find(
        (s) =>
          s.id !== id &&
          s.studentCode.trim().toLowerCase() === String(updates.studentCode).trim().toLowerCase()
      );
      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: `Student code '${updates.studentCode}' is already in use by ${duplicate.displayName}.`,
          },
          { status: 409, headers: noCacheHeaders }
        );
      }
    }

    if (updates.grade !== undefined || updates.section !== undefined) {
      const g = updates.grade !== undefined ? Number(updates.grade) : existing.grade;
      const s = updates.section !== undefined ? String(updates.section).trim().toUpperCase() : existing.section;
      updates.classroomId = `cls-${g}${s.toLowerCase()}`;
    }

    const updated = await db.updateStudentAsync(id, updates);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404, headers: noCacheHeaders }
      );
    }

    return NextResponse.json(
      { success: true, student: updated },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error("API PUT /api/students/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Update failed" },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const token = await extractSessionToken(request);
    const session = token ? await verifySession(token) : null;

    if (session && session.role === "teacher") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Administrative privileges required to delete student records." },
        { status: 403, headers: noCacheHeaders }
      );
    }

    const deleted = await db.deleteStudentAsync(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404, headers: noCacheHeaders }
      );
    }

    return NextResponse.json(
      { success: true, message: "Student removed successfully" },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error("API DELETE /api/students/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Delete failed" },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
