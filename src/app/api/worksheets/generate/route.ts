import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";
import { IntelligentWorksheetGenerator } from "@/lib/engine/worksheetGenerator";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      grade = 4,
      subjectCode = "MATH",
      conceptId,
      worksheetType = "practice",
      difficulty = "Medium",
      questionCount = 5,
      language = "en",
      studentId,
      studentName,
      section = "A",
      isThreeTier = false,
      studentPreviousScore,
      activeGapConceptId,
    } = body;

    let targetStudentName = studentName;
    let targetPreviousScore = studentPreviousScore;
    let targetActiveGap = activeGapConceptId;

    if (studentId && !targetStudentName) {
      const student = db.getStudentById(studentId);
      if (student) {
        targetStudentName = student.displayName;
        const gaps = db.getLearningGaps(studentId);
        if (gaps.length > 0) {
          targetActiveGap = gaps[0].conceptId;
          targetPreviousScore = gaps[0].latestPercentage;
        }
      }
    }

    if (isThreeTier) {
      const bundle = IntelligentWorksheetGenerator.generateThreeTierClassroomBundle({
        grade: Number(grade),
        subjectCode,
        conceptId,
        worksheetType,
        questionCount: Number(questionCount),
        language,
        studentId,
        studentName: targetStudentName,
        section,
        studentPreviousScore: targetPreviousScore,
        activeGapConceptId: targetActiveGap,
      });

      // Save all 3 to database
      db.saveWorksheet(bundle.supportTier);
      db.saveWorksheet(bundle.developingTier);
      db.saveWorksheet(bundle.advancedTier);

      return NextResponse.json({
        success: true,
        isBundle: true,
        bundle,
      });
    }

    const worksheet = IntelligentWorksheetGenerator.generateWorksheet({
      grade: Number(grade),
      subjectCode,
      conceptId,
      worksheetType,
      difficulty,
      questionCount: Number(questionCount),
      language,
      studentId,
      studentName: targetStudentName,
      section,
      studentPreviousScore: targetPreviousScore,
      activeGapConceptId: targetActiveGap,
    });

    db.saveWorksheet(worksheet);

    return NextResponse.json({
      success: true,
      worksheet,
    });
  } catch (error: any) {
    console.error("API POST /api/worksheets/generate error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate worksheet" },
      { status: 500 }
    );
  }
}
