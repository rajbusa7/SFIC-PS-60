import { NextResponse } from "next/server";
import { verifySession, extractSessionToken } from "@/lib/auth/session";
import { db } from "@/lib/db/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;

    const sessionToken = await extractSessionToken(request);

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const session = await verifySession(sessionToken);
    if (!session || session.role !== "parent") {
      return NextResponse.json(
        { success: false, error: "Access denied. Parent role required." },
        { status: 403 }
      );
    }

    // Retrieve parent profile
    const parentProfile = await db.getParentByUserIdAsync(session.id);
    if (!parentProfile) {
      return NextResponse.json(
        { success: false, error: "Parent profile not found." },
        { status: 404 }
      );
    }

    // STRICT RBAC CHECK: The requested studentId must belong to this parent's authorized students
    const isAuthorized = (parentProfile.studentIds || []).includes(studentId);
    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: You are not authorized to access records for this student.",
        },
        { status: 403 }
      );
    }

    // Fetch real student information from persistent database
    const student = await db.getStudentByIdAsync(studentId);
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student record not found." },
        { status: 404 }
      );
    }

    // Fetch real assessment results
    const results = db.getResults(studentId);

    // Fetch real learning gaps
    const learningGaps = db.getLearningGaps(studentId);

    // Fetch real remedial plans
    const remedialPlans = db.getRemedialPlans(studentId);

    // Fetch school notices targeted to this student's grade or all students
    const allNotices = db.getNotices();
    const studentNotices = allNotices.filter((n) => {
      if (n.targetAudience === "all") return true;
      if (n.targetClassGrade && n.targetClassGrade === student.grade) return true;
      if (n.studentIds && n.studentIds.includes(studentId)) return true;
      return false;
    });

    // Subject breakdown calculation
    const subjectMap: Record<string, { totalScore: number; count: number; name: string }> = {};
    const subjects = db.getSubjects();
    const concepts = db.getConcepts();

    results.forEach((r: any) => {
      const concept = concepts.find((c) => c.id === r.conceptId);
      const subject = subjects.find((s) => s.id === concept?.subjectId);
      const subjectKey = subject ? subject.name : "General";

      if (!subjectMap[subjectKey]) {
        subjectMap[subjectKey] = { totalScore: 0, count: 0, name: subjectKey };
      }
      subjectMap[subjectKey].totalScore += r.percentage;
      subjectMap[subjectKey].count += 1;
    });

    const subjectBreakdown = Object.values(subjectMap).map((s) => ({
      subject: s.name,
      averagePercentage: Math.round(s.totalScore / s.count),
      assessmentsCount: s.count,
    }));

    return NextResponse.json({
      success: true,
      student,
      results,
      learningGaps,
      remedialPlans,
      notices: studentNotices,
      subjectBreakdown,
      school: db.getSchool(),
    });
  } catch (error: any) {
    console.error("[Parent Student Detail API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve student records" },
      { status: 500 }
    );
  }
}
