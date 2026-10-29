import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";
import { calculatePercentagePointDelta, calculateAverage } from "@/lib/engine/calculations";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || undefined;
    const classroomId = searchParams.get("classroomId") || undefined;

    const students = db.getStudents(classroomId);
    const targetStudents = studentId ? students.filter((s) => s.id === studentId) : students;
    const concepts = db.getConcepts();
    const subjects = db.getSubjects();
    const allResults = db.getResults();
    const allGaps = db.getLearningGaps();
    const allPlans = db.getRemedialPlans();

    // Calculate before-and-after improvements for students with multiple assessments
    const conceptProgressItems: any[] = [];
    let totalImprovementPoints = 0;
    let improvingCount = 0;

    for (const student of targetStudents) {
      const studentResults = allResults.filter((r) => r.studentId === student.id);
      const studentConcepts = Array.from(new Set(studentResults.map((r) => r.conceptId)));

      for (const cId of studentConcepts) {
        const cResults = studentResults
          .filter((r) => r.conceptId === cId)
          .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

        const concept = concepts.find((c) => c.id === cId);
        if (!concept) continue;

        const initialScore = cResults[0]?.percentage || 0;
        const latestScore = cResults[cResults.length - 1]?.percentage || 0;
        const delta = calculatePercentagePointDelta(latestScore, initialScore);

        if (cResults.length >= 2) {
          if (delta > 0) improvingCount++;
          totalImprovementPoints += delta;
        }

        conceptProgressItems.push({
          studentId: student.id,
          studentName: student.displayName,
          grade: student.grade,
          conceptId: cId,
          conceptName: concept.name,
          subjectCode: concept.subjectCode,
          attemptsCount: cResults.length,
          initialPercentage: initialScore,
          latestPercentage: latestScore,
          deltaPercentagePoints: cResults.length >= 2 ? delta : null,
          hasSufficientEvidence: cResults.length >= 2,
          history: cResults.map((r) => ({
            date: r.recordedAt,
            score: r.percentage,
            marks: `${r.marksObtained}/${r.maximumMarks}`,
          })),
        });
      }
    }

    // Subject averages
    const subjectAverages = subjects.map((sub) => {
      const subConcepts = concepts.filter((c) => c.subjectId === sub.id).map((c) => c.id);
      const subResults = allResults.filter((r) => subConcepts.includes(r.conceptId));
      const avg = calculateAverage(subResults.map((r) => r.percentage));
      return {
        subjectId: sub.id,
        subjectName: sub.name,
        code: sub.code,
        averageScore: avg,
        totalAssessments: subResults.length,
      };
    });

    return NextResponse.json({
      success: true,
      progressItems: conceptProgressItems,
      subjectAverages,
      improvingCount,
      totalGaps: allGaps.length,
      activeGapsCount: allGaps.filter((g) => g.status === "Active").length,
      resolvedGapsCount: allGaps.filter((g) => g.status === "Resolved").length,
      completedPlansCount: allPlans.filter((p) => p.status === "Completed").length,
    });
  } catch (error) {
    console.error("API GET /api/progress error:", error);
    return NextResponse.json({ success: false, error: "Failed to calculate progress" }, { status: 500 });
  }
}
