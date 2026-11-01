import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";
import { validateAssessmentMarks } from "@/lib/engine/calculations";
import { extractSessionToken, verifySession } from "@/lib/auth/session";
import type { SubjectCode } from "@shared/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const token = await extractSessionToken(request);
    const session = token ? await verifySession(token) : null;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || undefined;
    const conceptId = searchParams.get("conceptId") || undefined;
    const subjectParam = searchParams.get("subjectCode")?.toUpperCase() as SubjectCode | undefined;

    // Check teacher-level authorization if logged in as teacher
    if (session && session.role === "teacher") {
      const assignments = db.getTeacherAssignments(session.id);
      if (!assignments || assignments.length === 0) {
        return NextResponse.json(
          { success: false, error: "No subjects have been assigned to your account. Please contact your administrator." },
          { status: 403 }
        );
      }

      const assignedSubjectCodes = assignments.map((a) => a.subjectCode);
      const assignedClassroomIds = assignments.flatMap((a) => a.classroomIds || []);
      const assignedGrades = assignments.flatMap((a) => a.grades || []);

      if (subjectParam && !assignedSubjectCodes.includes(subjectParam)) {
        return NextResponse.json(
          { success: false, error: `Forbidden: You are not authorized to view results for subject '${subjectParam}'.` },
          { status: 403 }
        );
      }

      if (studentId) {
        const student = db.getStudentById(studentId);
        if (!student) {
          return NextResponse.json({ success: false, error: "Student not found." }, { status: 404 });
        }
        const isAuthorizedStudent =
          assignedClassroomIds.includes(student.classroomId) || assignedGrades.includes(student.grade);
        if (!isAuthorizedStudent) {
          return NextResponse.json(
            { success: false, error: "Forbidden: You are not authorized to access marks for this student." },
            { status: 403 }
          );
        }
      }

      if (conceptId) {
        const concept = db.getConceptById(conceptId);
        if (concept && !assignedSubjectCodes.includes(concept.subjectCode)) {
          return NextResponse.json(
            { success: false, error: `Forbidden: You are not authorized to access marks for subject '${concept.subjectCode}'.` },
            { status: 403 }
          );
        }
      }

      let results = db.getResults(studentId, conceptId);
      // Filter out records not belonging to teacher's authorized scope
      results = results.filter((r) => {
        const st = db.getStudentById(r.studentId);
        if (!st) return false;
        const matchesClass = assignedClassroomIds.includes(st.classroomId) || assignedGrades.includes(st.grade);
        if (!matchesClass) return false;

        if (subjectParam) {
          const cpt = db.getConceptById(r.conceptId);
          if (cpt && cpt.subjectCode !== subjectParam) return false;
        }
        return true;
      });

      return NextResponse.json({ success: true, count: results.length, results });
    }

    const results = db.getResults(studentId, conceptId);
    return NextResponse.json({ success: true, count: results.length, results });
  } catch (error) {
    console.error("API GET /api/assessments/results error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch results" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = await extractSessionToken(request);
    const session = token ? await verifySession(token) : null;

    const body = await request.json();
    const { results } = body;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { success: false, error: "Results array is required" },
        { status: 400 }
      );
    }

    // Validate marks for all results: non-negative and <= maximumMarks
    for (const r of results) {
      const marks = Number(r.marksObtained);
      const max = Number(r.maximumMarks);
      if (isNaN(marks) || isNaN(max) || marks < 0 || marks > max) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid assessment marks: Score (${marks}) must be between 0 and maximum marks (${max}).`,
          },
          { status: 400 }
        );
      }
      const val = validateAssessmentMarks(marks, max);
      if (!val.isValid) {
        return NextResponse.json(
          { success: false, error: val.error || "Invalid assessment marks" },
          { status: 400 }
        );
      }
    }

    // Role-based authorization if session is present
    if (session) {
      if (session.role === "teacher") {
        const assignments = db.getTeacherAssignments(session.id);
        if (!assignments || assignments.length === 0) {
          return NextResponse.json(
            { success: false, error: "No subjects have been assigned to your account. Please contact your administrator." },
            { status: 403 }
          );
        }

        for (const r of results) {
          const student = db.getStudentById(r.studentId);
          if (!student) {
            return NextResponse.json(
              { success: false, error: `Student not found: ${r.studentId}` },
              { status: 404 }
            );
          }

          let subjectCode = r.subjectCode as SubjectCode | undefined;
          if (!subjectCode && r.assessmentId) {
            const asm = db.getAssessmentById(r.assessmentId);
            if (asm) subjectCode = asm.subjectCode;
          }
          if (!subjectCode && r.conceptId) {
            const cpt = db.getConceptById(r.conceptId);
            if (cpt) subjectCode = cpt.subjectCode;
          }

          // Find assignment matching this subject
          const matchingAsg = assignments.find(
            (a) => !subjectCode || a.subjectCode === subjectCode
          );

          if (!matchingAsg) {
            return NextResponse.json(
              {
                success: false,
                error: `Forbidden: You are not authorized to update marks for subject '${subjectCode || "Unknown"}'.`,
              },
              { status: 403 }
            );
          }

          const isClassAuthorized =
            matchingAsg.classroomIds?.includes(student.classroomId) ||
            matchingAsg.grades?.includes(student.grade);

          if (!isClassAuthorized) {
            return NextResponse.json(
              {
                success: false,
                error: `Forbidden: You are not authorized to edit marks for Class ${student.grade} (${student.classroomId}).`,
              },
              { status: 403 }
            );
          }
        }
      }
    }

    // Record previous values for audit logging
    const previousEntries = results.map((r: any) => {
      const prev = db.getResults(r.studentId, r.conceptId);
      const student = db.getStudentById(r.studentId);
      let subjectCode = r.subjectCode as SubjectCode | undefined;
      if (!subjectCode && r.assessmentId) {
        const asm = db.getAssessmentById(r.assessmentId);
        if (asm) subjectCode = asm.subjectCode;
      }
      if (!subjectCode && r.conceptId) {
        const cpt = db.getConceptById(r.conceptId);
        if (cpt) subjectCode = cpt.subjectCode;
      }

      return {
        r,
        student,
        subjectCode: subjectCode || "MATH",
        previousMarks: prev.length > 0 ? prev[0].marksObtained : 0,
        isUpdate: prev.length > 0,
      };
    });

    const recorded = db.recordResults(
      results.map((r: any) => ({
        assessmentId: r.assessmentId || `asm-${Date.now()}`,
        studentId: r.studentId,
        conceptId: r.conceptId,
        marksObtained: Number(r.marksObtained),
        maximumMarks: Number(r.maximumMarks),
        percentage: Math.round((Number(r.marksObtained) / Number(r.maximumMarks)) * 100),
        notes: r.notes || "",
        recordedAt: r.recordedAt || new Date().toISOString(),
      }))
    );

    // Write audit logs
    if (session) {
      for (const entry of previousEntries) {
        db.recordAuditLog({
          teacherId: session.id,
          teacherName: session.name,
          studentId: entry.r.studentId,
          studentName: entry.student?.displayName || entry.r.studentId,
          subjectCode: entry.subjectCode as SubjectCode,
          assessmentId: entry.r.assessmentId || "asm-custom",
          previousMarks: entry.previousMarks,
          updatedMarks: Number(entry.r.marksObtained),
          action: entry.isUpdate ? "UPDATE_MARKS" : "ENTER_MARKS",
        });
      }
    }

    return NextResponse.json({ success: true, count: recorded.length, results: recorded });
  } catch (error) {
    console.error("API POST /api/assessments/results error:", error);
    return NextResponse.json({ success: false, error: "Failed to record results" }, { status: 500 });
  }
}
