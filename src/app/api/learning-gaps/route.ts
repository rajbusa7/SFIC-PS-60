import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";
import { extractSessionToken, verifySession } from "@/lib/auth/session";
import type { SubjectCode } from "@shared/types";

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
    const studentId = searchParams.get("studentId") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const status = searchParams.get("status") || undefined;
    const rawSubject = searchParams.get("subjectCode") || searchParams.get("subject");
    const subjectParam = (rawSubject?.toUpperCase() as SubjectCode) || undefined;

    const token = await extractSessionToken(request);
    const session = token ? await verifySession(token) : null;

    if (session && session.role === "teacher") {
      let assignments = await db.getTeacherAssignmentsAsync(session.id);
      if ((!assignments || assignments.length === 0) && session.email) {
        assignments = await db.getTeacherAssignmentsAsync(session.email);
      }
      if (!assignments || assignments.length === 0) {
        return NextResponse.json(
          { success: false, error: "No subjects have been assigned to your account. Please contact your administrator." },
          { status: 403, headers: noCacheHeaders }
        );
      }

      const assignedSubjectCodes = assignments.map((a) => a.subjectCode);
      const assignedClassroomIds = assignments.flatMap((a) => a.classroomIds || []);
      const assignedGrades = assignments.flatMap((a) => a.grades || []);

      if (subjectParam && !assignedSubjectCodes.includes(subjectParam)) {
        return NextResponse.json(
          { success: false, error: `Forbidden: You are not authorized to view learning gaps for subject '${subjectParam}'.` },
          { status: 403, headers: noCacheHeaders }
        );
      }

      if (studentId) {
        const student = db.getStudentById(studentId);
        if (!student) {
          return NextResponse.json({ success: false, error: "Student not found." }, { status: 404, headers: noCacheHeaders });
        }
        const isAuthorizedStudent =
          assignedClassroomIds.includes(student.classroomId) || assignedGrades.includes(student.grade);
        if (!isAuthorizedStudent) {
          return NextResponse.json(
            { success: false, error: "Forbidden: You are not authorized to view learning gaps for this student." },
            { status: 403, headers: noCacheHeaders }
          );
        }
      }

      let gaps = db.getLearningGaps(studentId);

      // Filter gaps to match teacher's assigned subjects and classes
      gaps = gaps.filter((g) => {
        if (g.subjectCode && !assignedSubjectCodes.includes(g.subjectCode)) {
          return false;
        }
        if (subjectParam && g.subjectCode !== subjectParam) {
          return false;
        }
        if (typeof g.grade === "number" && !assignedGrades.includes(g.grade)) {
          return false;
        }
        return true;
      });

      if (priority) {
        gaps = gaps.filter((g) => g.priority === priority);
      }

      if (status) {
        gaps = gaps.filter((g) => g.status === status);
      }

      return NextResponse.json({ success: true, count: gaps.length, gaps }, { headers: noCacheHeaders });
    }

    let gaps = db.getLearningGaps(studentId);

    if (subjectParam) {
      gaps = gaps.filter((g) => g.subjectCode === subjectParam);
    }

    if (priority) {
      gaps = gaps.filter((g) => g.priority === priority);
    }

    if (status) {
      gaps = gaps.filter((g) => g.status === status);
    }

    return NextResponse.json({ success: true, count: gaps.length, gaps }, { headers: noCacheHeaders });
  } catch (error) {
    console.error("API GET /api/learning-gaps error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch learning gaps" },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: "studentId is required" },
        { status: 400, headers: noCacheHeaders }
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

      const student = db.getStudentById(studentId);
      if (!student) {
        return NextResponse.json({ success: false, error: "Student not found." }, { status: 404, headers: noCacheHeaders });
      }

      const isAuthorized =
        assignedClassroomIds.includes(student.classroomId) || assignedGrades.includes(student.grade);
      if (!isAuthorized) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You are not authorized to recalculate gaps for this student." },
          { status: 403, headers: noCacheHeaders }
        );
      }
    }

    const updatedGaps = db.recalculateLearningGapsForStudent(studentId);
    return NextResponse.json(
      { success: true, gaps: updatedGaps },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error("API POST /api/learning-gaps error:", error);
    return NextResponse.json(
      { success: false, error: "Recalculation failed" },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
