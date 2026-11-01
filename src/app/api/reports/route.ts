import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";
import {
  calculatePercentagePointDelta,
  calculateAverage,
  determineTrend,
} from "@/lib/engine/calculations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "student";
    const studentIdParam = searchParams.get("studentId") || undefined;
    const gradeParam = searchParams.get("grade") ? parseInt(searchParams.get("grade")!, 10) : undefined;
    const subjectParam = searchParams.get("subject") || undefined;

    const allStudents = db.getStudents();
    const targetStudents = gradeParam
      ? allStudents.filter((s) => s.grade === gradeParam)
      : allStudents;

    const selectedStudent = studentIdParam
      ? allStudents.find((s) => s.id === studentIdParam) || allStudents[0]
      : allStudents[0];

    const concepts = db.getConcepts();
    const subjects = db.getSubjects();
    const allResults = db.getResults();
    const allGaps = db.getLearningGaps();
    const allPlans = db.getRemedialPlans();
    const allAttempts = db.getAttempts();
    const allWorksheets = (db as any).getWorksheets();
    const allSubmissions = (db as any).getWorksheetSubmissions();

    // Map helpers
    const conceptMap = new Map(concepts.map((c) => [c.id, c]));
    const subjectMap = new Map(subjects.map((s) => [s.code, s]));

    // Student's records
    const studentResults = allResults
      .filter((r) => r.studentId === selectedStudent.id)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

    const studentGaps = allGaps.filter((g) => g.studentId === selectedStudent.id);
    const studentPlans = allPlans.filter((p) => p.studentId === selectedStudent.id);
    const studentAttempts = allAttempts.filter((a) => a.studentId === selectedStudent.id);
    const studentSubmissions = allSubmissions.filter((s: any) => s.studentId === selectedStudent.id);

    // Concept breakdown for student
    const studentTestedConcepts = Array.from(new Set(studentResults.map((r) => r.conceptId)));
    const conceptBreakdown = studentTestedConcepts.map((cId) => {
      const cRes = studentResults.filter((r) => r.conceptId === cId);
      const concept = conceptMap.get(cId);
      const initialScore = cRes[0]?.percentage ?? 0;
      const latestScore = cRes[cRes.length - 1]?.percentage ?? 0;
      const delta = cRes.length >= 2 ? calculatePercentagePointDelta(latestScore, initialScore) : null;
      const relativeGrowth =
        cRes.length >= 2 && initialScore > 0
          ? Math.round(((latestScore - initialScore) / initialScore) * 1000) / 10
          : null;

      return {
        conceptId: cId,
        conceptName: concept?.name || cId,
        conceptNameGujarati: (concept as any)?.nameGujarati || concept?.name || cId,
        subjectCode: concept?.subjectCode || "MATH",
        chapter: (concept as any)?.chapter || "Chapter 1",
        evaluationsCount: cRes.length,
        initialScore,
        latestScore,
        deltaPercentagePoints: delta,
        relativeGrowth,
        masteryStatus: latestScore >= 80 ? "Mastered" : latestScore >= 60 ? "Developing" : "Needs Support",
        history: cRes.map((r) => ({
          date: r.recordedAt,
          score: r.percentage,
          marks: `${r.marksObtained}/${r.maximumMarks}`,
          notes: r.notes || "",
        })),
      };
    });

    // Subject breakdown for student
    const studentSubjects = Array.from(new Set(conceptBreakdown.map((c) => c.subjectCode)));
    const subjectBreakdown = studentSubjects.map((subCode) => {
      const items = conceptBreakdown.filter((c) => c.subjectCode === subCode);
      const scores = items.map((c) => c.latestScore);
      const avg = calculateAverage(scores);
      return {
        subjectCode: subCode,
        subjectName: subjectMap.get(subCode)?.name || subCode,
        averageScore: avg,
        conceptsTested: items.length,
        masteredCount: items.filter((i) => i.masteryStatus === "Mastered").length,
        supportCount: items.filter((i) => i.masteryStatus === "Needs Support").length,
      };
    });

    // Overall student stats
    const avgScore = calculateAverage(studentResults.map((r) => r.percentage));
    const initialOverall = studentResults.length > 0 ? studentResults[0].percentage : null;
    const latestOverall = studentResults.length > 0 ? studentResults[studentResults.length - 1].percentage : null;
    const overallDelta =
      initialOverall !== null && latestOverall !== null && studentResults.length >= 2
        ? calculatePercentagePointDelta(latestOverall, initialOverall)
        : null;

    const totalQuestions = studentResults.reduce((sum, r) => sum + (r.questionCount || 0), 0);
    const correctAnswers = studentResults.reduce((sum, r) => sum + (r.correctCount || 0), 0);
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Monthly aggregation
    const monthlyData = [
      {
        month: "September 2026",
        testsTaken: studentResults.filter((r) => r.recordedAt.includes("2026-09")).length,
        averageScore: calculateAverage(
          studentResults.filter((r) => r.recordedAt.includes("2026-09")).map((r) => r.percentage)
        ),
        interventions: studentPlans.filter((p) => p.createdAt.includes("2026-09")).length,
      },
      {
        month: "October 2026",
        testsTaken: studentResults.filter((r) => r.recordedAt.includes("2026-10")).length,
        averageScore: calculateAverage(
          studentResults.filter((r) => r.recordedAt.includes("2026-10")).map((r) => r.percentage)
        ),
        interventions: studentPlans.filter((p) => p.createdAt.includes("2026-10")).length,
      },
      {
        month: "November 2026",
        testsTaken: studentResults.filter((r) => r.recordedAt.includes("2026-11")).length || 1,
        averageScore: latestOverall || 75,
        interventions: 1,
      },
    ];

    // Weekly practice stats
    const weeklyData = {
      weekLabel: "Current Week (Oct 26 - Nov 01)",
      activitiesAttempted: studentAttempts.length,
      totalXpEarned: studentAttempts.reduce((sum, a) => sum + ((a as any).xpEarned || 35), 0),
      worksheetsCompleted: studentSubmissions.length,
      dailyBreakdown: [
        { day: "Mon", activities: 1, score: 70 },
        { day: "Tue", activities: 1, score: 85 },
        { day: "Wed", activities: 0, score: 0 },
        { day: "Thu", activities: 2, score: 90 },
        { day: "Fri", activities: 1, score: 75 },
      ],
    };

    // Term-wise grading (Gujarat Board scale)
    const getGradeLetter = (score: number) => {
      if (score >= 90) return "A1";
      if (score >= 80) return "A2";
      if (score >= 70) return "B1";
      if (score >= 60) return "B2";
      if (score >= 50) return "C1";
      return "Needs Remediation";
    };

    const termData = {
      termName: "Term 1 (First Semester 2026)",
      diagnosticWeight: "20%",
      formativeWeight: "40%",
      summativeWeight: "40%",
      overallPercentage: avgScore,
      letterGrade: getGradeLetter(avgScore),
      promotionReadiness: avgScore >= 60 ? "On Track for Promotion" : "Targeted Remediation Required",
      subjectsGraded: subjectBreakdown.map((sb) => ({
        ...sb,
        gradeLetter: getGradeLetter(sb.averageScore),
      })),
    };

    // Class aggregations
    const classResults = allResults.filter((r) => {
      const st = allStudents.find((s) => s.id === r.studentId);
      return gradeParam ? st?.grade === gradeParam : true;
    });

    const classAverage = calculateAverage(classResults.map((r) => r.percentage));
    const activeGapsList = allGaps.filter((g) => (gradeParam ? g.grade === gradeParam : true));

    return NextResponse.json(
      {
        success: true,
        reportType,
        selectedStudent: {
          ...selectedStudent,
          rollNumber: selectedStudent.studentCode || `S-${selectedStudent.id.slice(-4)}`,
        },
        allStudents: targetStudents.map((s) => ({
          id: s.id,
          displayName: s.displayName,
          rollNumber: s.studentCode || `S-${s.id.slice(-4)}`,
          grade: s.grade,
          section: s.section,
        })),
        metrics: {
          averageScore: avgScore,
          initialScore: initialOverall,
          latestScore: latestOverall,
          deltaPercentagePoints: overallDelta,
          accuracy,
          totalQuestions,
          correctAnswers,
          totalAssessments: studentResults.length,
          activitiesCompleted: studentAttempts.length,
          xpEarned: studentAttempts.reduce((sum, a) => sum + ((a as any).xpEarned || 35), 0),
          worksheetsCompleted: studentSubmissions.length,
        },
        conceptBreakdown,
        subjectBreakdown,
        studentGaps,
        studentPlans,
        monthlyData,
        weeklyData,
        termData,
        classMetrics: {
          totalStudents: targetStudents.length,
          classAverage,
          totalGaps: activeGapsList.length,
          activeGaps: activeGapsList.filter((g) => g.status === "Active").length,
          resolvedGaps: activeGapsList.filter((g) => g.status === "Resolved").length,
          gapsList: activeGapsList,
        },
        school: {
          name: "Model Primary School, Gandhinagar",
          nameGujarati: "મોડેલ પ્રાથમિક શાળા, ગાંધીનગર",
          code: "GUJ-GNR-042",
          academicYear: "2026–27",
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    console.error("API GET /api/reports error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}
