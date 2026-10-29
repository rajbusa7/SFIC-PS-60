import { NextResponse } from "next/server";
import { generateRemedialPlan } from "@/lib/engine/remedialEngine";
import { detectLearningGap } from "@/lib/engine/gapDetection";
import { generateAiContent } from "@/lib/ai/aiProvider";
import type { SubjectCode } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      studentId,
      studentName,
      conceptId,
      conceptName,
      subjectCode = "MATH",
      scoresHistory,
      language = "en",
    } = body;

    if (!conceptId || !conceptName || !scoresHistory) {
      return NextResponse.json(
        { success: false, error: "conceptId, conceptName, and scoresHistory are required" },
        { status: 400 }
      );
    }

    // 1. Deterministic gap evaluation
    const gap = detectLearningGap(
      conceptId,
      conceptName,
      scoresHistory.map((s: any) => ({
        marksObtained: Number(s.marksObtained),
        maximumMarks: Number(s.maximumMarks),
        recordedAt: s.recordedAt || new Date().toISOString(),
      }))
    );

    // 2. Built-in offline deterministic fallback
    const fallbackGenerator = () => {
      const plan = generateRemedialPlan(
        studentId || "student",
        studentName || "Student",
        conceptId,
        conceptName,
        (subjectCode as SubjectCode) || "MATH",
        gap
      );
      return {
        content: JSON.stringify(plan),
        data: plan,
      };
    };

    const isGujarati = language === "gu";
    const prompt = `Student Remedial Assessment Profile:
- Student: ${studentName || "Student"} (ID: ${studentId || "student"})
- Subject: ${subjectCode}
- Concept: ${conceptName} (ID: ${conceptId})
- Recent Score: ${gap.latestPercentage}% (${gap.masteryStatus}, ${gap.priority} Priority)
- Reason: "${gap.reason}"
- Language: ${isGujarati ? "Gujarati (ગુજરાતી)" : "English"}

Generate a targeted 5-step remedial plan adhering to Gujarat primary curriculum standards.`;

    const systemInstruction = `You are ShikshaSetu AI Remedial Plan Generator for Gujarat Primary Schools.
Generate a comprehensive remedial curriculum with learning objective, 5 step-by-step activities with durations, low-cost materials, practice questions, and reassessment criteria.
${isGujarati ? "All pedagogical content MUST be in authentic Gujarati script." : "Use clear, practical primary English."}
Return valid JSON adhering to the RemedialPlan schema.`;

    const aiResult = await generateAiContent(
      {
        prompt,
        systemInstruction,
        temperature: 0.3,
        responseFormat: "json",
      },
      fallbackGenerator
    );

    const plan = aiResult.data || JSON.parse(aiResult.content);

    return NextResponse.json({
      success: true,
      plan,
      isAiGenerated: aiResult.isAiGenerated,
      provider: aiResult.provider,
      modelUsed: aiResult.modelUsed,
      note: aiResult.note,
    });
  } catch (error: any) {
    console.error("API POST /api/ai-remedial error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate remedial plan" },
      { status: 500 }
    );
  }
}
