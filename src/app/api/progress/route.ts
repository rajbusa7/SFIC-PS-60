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
    const studentIdParam = searchParams.get("studentId") || undefined;
    const classroomIdParam = searchParams.get("classroomId") || undefined;
    const gradeParam = searchParams.get("grade") || searchParams.get("standard") || undefined;
    const subjectParam = searchParams.get("subject") || undefined;
    const statusParam = searchParams.get("status") || undefined;
    const trendParam = searchParams.get("trend") || undefined;

    const allStudents = db.getStudents(classroomIdParam);
    const concepts = db.getConcepts();
    const subjects = db.getSubjects();
    const allResults = db.getResults();
    const allGaps = db.getLearningGaps();
    const allPlans = db.getRemedialPlans();
    const allAttempts = db.getAttempts();

    // Map concepts for quick lookup
    const conceptMap = new Map(concepts.map((c) => [c.id, c]));
    const subjectMap = new Map(subjects.map((s) => [s.code, s]));

    // Build conceptProgressItems for every student and tested concept
    const conceptProgressItems: any[] = [];
    let totalImprovementPoints = 0;
    let improvingCount = 0;
    let decliningCount = 0;
    let stableCount = 0;

    for (const student of allStudents) {
      const studentResults = allResults.filter((r) => r.studentId === student.id);
      const studentConcepts = Array.from(new Set(studentResults.map((r) => r.conceptId)));

      for (const cId of studentConcepts) {
        const cResults = studentResults
          .filter((r) => r.conceptId === cId)
          .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

        const concept = conceptMap.get(cId);
        if (!concept) continue;

        const initialScore = cResults[0]?.percentage ?? 0;
        const latestScore = cResults[cResults.length - 1]?.percentage ?? 0;
        const delta = calculatePercentagePointDelta(latestScore, initialScore);
        const hasSufficientEvidence = cResults.length >= 2;

        const relativeGrowth =
          hasSufficientEvidence && initialScore > 0
            ? Math.round(((latestScore - initialScore) / initialScore) * 1000) / 10
            : null;

        const highestScore = Math.max(...cResults.map((r) => r.percentage));
        const averageScore = calculateAverage(cResults.map((r) => r.percentage));

        const totalQuestions = cResults.reduce((sum, r) => sum + (r.questionCount || 0), 0);
        const correctQuestions = cResults.reduce((sum, r) => sum + (r.correctCount || 0), 0);
        const incorrectQuestions = Math.max(0, totalQuestions - correctQuestions);

        const masteryStatus =
          latestScore >= 80 ? "Mastered" : latestScore >= 60 ? "Developing" : "Needs Support";

        if (hasSufficientEvidence) {
          if (delta > 0) improvingCount++;
          else if (delta < 0) decliningCount++;
          else stableCount++;
          totalImprovementPoints += delta;
        }

        const lastAssessmentDate = cResults[cResults.length - 1]?.recordedAt || null;

        conceptProgressItems.push({
          studentId: student.id,
          studentName: student.displayName,
          rollNumber: student.studentCode || `S-${student.id.slice(-4)}`,
          grade: student.grade,
          section: student.section || "A",
          conceptId: cId,
          conceptName: concept.name,
          chapter: (concept as any).chapter || "Chapter 1",
          subjectCode: concept.subjectCode,
          subjectName: subjectMap.get(concept.subjectCode)?.name || concept.subjectCode,
          attemptsCount: cResults.length,
          initialPercentage: initialScore,
          latestPercentage: latestScore,
          deltaPercentagePoints: hasSufficientEvidence ? delta : null,
          relativeGrowth,
          highestScore,
          averageScore,
          masteryStatus,
          totalQuestions,
          correctQuestions,
          incorrectQuestions,
          hasSufficientEvidence,
          lastAssessmentDate,
          history: cResults.map((r) => ({
            id: r.id,
            assessmentId: r.assessmentId,
            date: r.recordedAt,
            score: r.percentage,
            marks: `${r.marksObtained}/${r.maximumMarks}`,
            marksObtained: r.marksObtained,
            maximumMarks: r.maximumMarks,
            questionCount: r.questionCount || 0,
            correctCount: r.correctCount || 0,
            notes: r.notes || "",
          })),
        });
      }
    }

    // Build comprehensive student summaries
    const studentRecords = allStudents.map((student) => {
      const studentResults = allResults
        .filter((r) => r.studentId === student.id)
        .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

      const studentGaps = allGaps.filter((g) => g.studentId === student.id);
      const studentPlans = allPlans.filter((p) => p.studentId === student.id);
      const studentAttempts = allAttempts.filter((a) => a.studentId === student.id);

      const studentConceptItems = conceptProgressItems.filter((i) => i.studentId === student.id);

      const assessmentsAttempted = studentResults.length;
      const initialScore = studentResults.length > 0 ? studentResults[0].percentage : null;
      const latestScore =
        studentResults.length > 0 ? studentResults[studentResults.length - 1].percentage : null;
      const highestScore =
        studentResults.length > 0 ? Math.max(...studentResults.map((r) => r.percentage)) : null;
      const averageScore =
        studentResults.length > 0 ? calculateAverage(studentResults.map((r) => r.percentage)) : null;

      const deltaPercentagePoints =
        initialScore !== null && latestScore !== null && studentResults.length >= 2
          ? calculatePercentagePointDelta(latestScore, initialScore)
          : null;

      const relativeGrowth =
        deltaPercentagePoints !== null && initialScore && initialScore > 0
          ? Math.round(((latestScore! - initialScore) / initialScore) * 1000) / 10
          : null;

      const scoresChronological = studentResults.map((r) => r.percentage);
      const trendResult = determineTrend(scoresChronological);

      const totalQuestions = studentResults.reduce((sum, r) => sum + (r.questionCount || 0), 0);
      const correctAnswers = studentResults.reduce((sum, r) => sum + (r.correctCount || 0), 0);
      const incorrectAnswers = Math.max(0, totalQuestions - correctAnswers);
      const accuracy =
        totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

      const activitiesAttempted = studentAttempts.length;
      const activitiesCompleted = studentAttempts.filter(
        (a) => (a.percentage ?? 0) >= 60
      ).length;
      const xpEarned = studentAttempts.reduce(
        (sum, a) => sum + ((a as any).xpEarned || (a.percentage >= 80 ? 50 : 30)),
        0
      );

      const remedialPlansAssigned = studentPlans.length;
      const remedialPlansCompleted = studentPlans.filter((p) => p.status === "Completed").length;
      const activeGapsCount = studentGaps.filter((g) => g.status === "Active").length;
      const resolvedGapsCount = studentGaps.filter((g) => g.status === "Resolved").length;

      const conceptsMasteredCount = studentConceptItems.filter(
        (c) => c.masteryStatus === "Mastered"
      ).length;
      const conceptsDevelopingCount = studentConceptItems.filter(
        (c) => c.masteryStatus === "Developing"
      ).length;
      const conceptsSupportCount = studentConceptItems.filter(
        (c) => c.masteryStatus === "Needs Support"
      ).length;

      const lastAssessmentDate =
        studentResults.length > 0
          ? studentResults[studentResults.length - 1].recordedAt
          : null;

      const daysSinceLastAssessment = lastAssessmentDate
        ? Math.floor(
            (new Date().getTime() - new Date(lastAssessmentDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null;

      // Subject breakdown for this student
      const studentSubjects = Array.from(new Set(studentConceptItems.map((c) => c.subjectCode)));
      const subjectBreakdown = studentSubjects.map((subCode) => {
        const subItems = studentConceptItems.filter((c) => c.subjectCode === subCode);
        const subScores = subItems.map((c) => c.latestPercentage);
        const avg = calculateAverage(subScores);
        return {
          subjectCode: subCode,
          subjectName: subjectMap.get(subCode)?.name || subCode,
          averageScore: avg,
          conceptsCount: subItems.length,
          masteryStatus: avg >= 80 ? "Mastered" : avg >= 60 ? "Developing" : "Needs Support",
        };
      });

      // Tailored teacher recommendation
      let recommendation = "";
      if (activeGapsCount > 0) {
        const highPriority = studentGaps.find((g) => g.priority === "High") || studentGaps[0];
        recommendation = `Targeted intervention recommended for ${highPriority.conceptName} (${highPriority.subjectCode}). Latest score is ${highPriority.latestPercentage}%. Assign interactive guided worksheets.`;
      } else if (trendResult.trend === "declining") {
        recommendation = `Performance declined by ${Math.abs(
          deltaPercentagePoints || 0
        )} pp. Review prerequisite concepts and provide one-on-one diagnostic support.`;
      } else if (conceptsMasteredCount > 0 && conceptsSupportCount === 0) {
        recommendation = `Excellent progress! Achieved mastery across ${conceptsMasteredCount} concept(s). Ready for advanced enrichment challenges.`;
      } else if (assessmentsAttempted === 0) {
        recommendation = `No recent diagnostic assessments recorded. Schedule a baseline assessment for accurate learning gap identification.`;
      } else {
        recommendation = `Continue regular curriculum practice. Monitor progress on developing concepts with formative quizzes.`;
      }

      return {
        id: student.id,
        displayName: student.displayName,
        rollNumber: student.studentCode || `S-${student.id.slice(-4)}`,
        grade: student.grade,
        section: student.section || "A",
        initialScore,
        latestScore,
        highestScore,
        averageScore,
        deltaPercentagePoints,
        relativeGrowth,
        trend: trendResult.trend,
        trendMessage: trendResult.message,
        assessmentsAttempted,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        accuracy,
        activitiesAttempted,
        activitiesCompleted,
        xpEarned,
        remedialPlansAssigned,
        remedialPlansCompleted,
        activeGapsCount,
        resolvedGapsCount,
        conceptsMasteredCount,
        conceptsDevelopingCount,
        conceptsSupportCount,
        lastAssessmentDate,
        daysSinceLastAssessment,
        subjectBreakdown,
        concepts: studentConceptItems,
        recommendation,
      };
    });

    // 14 Real Calculated KPIs
    const evaluatedStudents = studentRecords.filter((s) => s.assessmentsAttempted > 0);
    const studentsShowingGrowth = studentRecords.filter((s) => (s.deltaPercentagePoints ?? 0) > 0).length;
    const studentsShowingDecline = studentRecords.filter((s) => (s.deltaPercentagePoints ?? 0) < 0).length;
    const studentsMaintaining = studentRecords.filter(
      (s) => s.assessmentsAttempted >= 2 && s.deltaPercentagePoints === 0
    ).length;
    const studentsMastery = studentRecords.filter((s) => (s.latestScore ?? 0) >= 80).length;
    const studentsNeedingSupport = studentRecords.filter(
      (s) => s.assessmentsAttempted > 0 && (s.latestScore ?? 0) < 60
    ).length;
    const totalAssessmentsCompleted = allResults.length;
    const totalActivitiesCompleted = allAttempts.length;
    const interventionsCompleted = allPlans.filter((p) => p.status === "Completed").length;
    const activeInterventions =
      allGaps.filter((g) => g.status === "Active").length +
      allPlans.filter((p) => p.status === "In Progress" || p.status === "Approved").length;
    const gapsResolved = allGaps.filter((g) => g.status === "Resolved").length;

    const classAverage =
      evaluatedStudents.length > 0
        ? calculateAverage(evaluatedStudents.map((s) => s.latestScore!))
        : 0;

    const itemsWithDelta = conceptProgressItems.filter((i) => i.hasSufficientEvidence);
    const avgPercentagePointImprovement =
      itemsWithDelta.length > 0
        ? Math.round(
            (itemsWithDelta.reduce((sum, i) => sum + i.deltaPercentagePoints, 0) /
              itemsWithDelta.length) *
              10
          ) / 10
        : 0;

    const studentsWithoutRecentAssessments = studentRecords.filter(
      (s) => s.assessmentsAttempted === 0 || (s.daysSinceLastAssessment ?? 0) > 30
    ).length;

    const kpis = {
      totalStudentsTracked: allStudents.length,
      studentsShowingGrowth,
      studentsShowingDecline,
      studentsMaintaining,
      studentsMastery,
      studentsNeedingSupport,
      totalAssessmentsCompleted,
      totalActivitiesCompleted,
      interventionsCompleted,
      activeInterventions,
      gapsResolved,
      overallClassAverage: classAverage,
      avgPercentagePointImprovement,
      studentsWithoutRecentAssessments,
    };

    // Subject averages
    const subjectAverages = subjects.map((sub) => {
      const subConcepts = concepts.filter((c) => c.subjectId === sub.id).map((c) => c.id);
      const subResults = allResults.filter((r) => subConcepts.includes(r.conceptId));
      const avg = calculateAverage(subResults.map((r) => r.percentage));
      const distinctStudents = new Set(subResults.map((r) => r.studentId)).size;
      return {
        subjectId: sub.id,
        subjectName: sub.name,
        code: sub.code,
        averageScore: avg,
        totalAssessments: subResults.length,
        studentsCount: distinctStudents,
      };
    });

    // Actionable Teacher Alerts
    const teacherAlerts: any[] = [];
    studentRecords.forEach((s) => {
      if ((s.deltaPercentagePoints ?? 0) < 0) {
        teacherAlerts.push({
          type: "decline",
          priority: "High",
          studentId: s.id,
          studentName: s.displayName,
          grade: s.grade,
          message: `${s.displayName} showed a ${Math.abs(s.deltaPercentagePoints!)} pp decline (from ${s.initialScore}% to ${s.latestScore}%). Targeted remedial support required.`,
          action: "Assign Remedial Worksheet",
        });
      }
      if (s.activeGapsCount > 0) {
        teacherAlerts.push({
          type: "gap",
          priority: "High",
          studentId: s.id,
          studentName: s.displayName,
          grade: s.grade,
          message: `${s.displayName} has ${s.activeGapsCount} active learning gap(s) pending intervention.`,
          action: "Review Learning Gaps",
        });
      }
      if (s.assessmentsAttempted === 0 || (s.daysSinceLastAssessment ?? 0) > 30) {
        teacherAlerts.push({
          type: "inactive",
          priority: "Medium",
          studentId: s.id,
          studentName: s.displayName,
          grade: s.grade,
          message: `${s.displayName} has no evaluations recorded in over 30 days. Baseline assessment recommended.`,
          action: "Schedule Assessment",
        });
      }
    });

    // Apply filtering if query params are provided
    let filteredProgressItems = conceptProgressItems;
    let filteredStudentRecords = studentRecords;

    if (studentIdParam) {
      filteredProgressItems = filteredProgressItems.filter((i) => i.studentId === studentIdParam);
      filteredStudentRecords = filteredStudentRecords.filter((s) => s.id === studentIdParam);
    }

    if (gradeParam && gradeParam !== "all") {
      const gNum = parseInt(gradeParam, 10);
      filteredProgressItems = filteredProgressItems.filter((i) => i.grade === gNum);
      filteredStudentRecords = filteredStudentRecords.filter((s) => s.grade === gNum);
    }

    if (subjectParam && subjectParam !== "all") {
      filteredProgressItems = filteredProgressItems.filter((i) => i.subjectCode === subjectParam);
    }

    if (statusParam && statusParam !== "all") {
      filteredProgressItems = filteredProgressItems.filter(
        (i) => i.masteryStatus.toLowerCase().replace(/\s+/g, "") === statusParam.toLowerCase()
      );
    }

    if (trendParam && trendParam !== "all") {
      filteredStudentRecords = filteredStudentRecords.filter((s) => s.trend === trendParam);
    }

    return NextResponse.json({
      success: true,
      kpis,
      progressItems: filteredProgressItems,
      studentRecords: filteredStudentRecords,
      subjectAverages,
      teacherAlerts,
      // Backward compatibility fields
      improvingCount: kpis.studentsShowingGrowth,
      totalGaps: allGaps.length,
      activeGapsCount: kpis.activeInterventions,
      resolvedGapsCount: kpis.gapsResolved,
      completedPlansCount: kpis.interventionsCompleted,
    });
  } catch (error) {
    console.error("API GET /api/progress error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate progress" },
      { status: 500 }
    );
  }
}
