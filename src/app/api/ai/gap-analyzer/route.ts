import { NextResponse } from "next/server";
import { calculatePercentage } from "@/lib/engine/calculations";
import { generateAiContent } from "@/lib/ai/aiProvider";

export interface GapAnalysisResponse {
  deterministicMetrics: {
    marksObtained: number;
    maximumMarks: number;
    calculatedPercentage: number;
    masteryStatus: "Needs Support" | "Developing" | "Mastered";
    operationalThresholdApplied: string;
    requiresRemediation: boolean;
    priority: "High" | "Medium" | "Low";
  };
  aiPedagogicalDiagnosis: {
    evidenceSummary: string;
    underlyingMisconception: string;
    prerequisiteGapsIdentified: string[];
    recommendedRemedialActivities: {
      activityTitle: string;
      description: string;
      concreteMaterials: string;
    }[];
    suggestedReassessmentMethod: {
      format: string;
      timelineDays: number;
      masteryCriterion: string;
    };
    ethicalSafetyDisclosure: string;
  };
  isAiGenerated: boolean;
  provider: string;
  modelUsed: string;
  note?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      studentId = "std-custom",
      studentName = "Student",
      studentClass = 4,
      subject = "MATH",
      conceptName = "Division Basics",
      marksObtained = 0,
      maximumMarks = 20,
      competencyItems = [],
      teacherObservations = "",
      language = "en",
    } = body;

    const numMarks = Number(marksObtained);
    const numMax = Number(maximumMarks);

    if (numMax <= 0 || isNaN(numMax)) {
      return NextResponse.json(
        { success: false, error: "Maximum marks must be a positive number greater than 0." },
        { status: 400 }
      );
    }

    if (numMarks < 0 || numMarks > numMax) {
      return NextResponse.json(
        { success: false, error: `Marks obtained must be between 0 and ${numMax}.` },
        { status: 400 }
      );
    }

    // 1. DETERMINISTIC CALCULATION (Completely separate from AI generative logic)
    const calculatedPercentage = calculatePercentage(numMarks, numMax);
    let masteryStatus: "Needs Support" | "Developing" | "Mastered";
    let priority: "High" | "Medium" | "Low";

    if (calculatedPercentage >= 80) {
      masteryStatus = "Mastered";
      priority = "Low";
    } else if (calculatedPercentage >= 60) {
      masteryStatus = "Developing";
      priority = "Medium";
    } else {
      masteryStatus = "Needs Support";
      priority = "High";
    }

    const requiresRemediation = calculatedPercentage < 80;
    const isGujarati = language === "gu";

    // 2. AI PEDAGOGICAL DIAGNOSIS PROMPT (Evidence-based only, strictly no medical claims)
    const systemInstruction = `You are StudySaathi AI Pedagogical Diagnostic Specialist for Gujarat primary schools.
Analyze student assessment results based STRICTLY ON THE PROVIDED EMPIRICAL EVIDENCE.
RULES:
1. NEVER diagnose clinical, medical, or psychological conditions (e.g., ADHD, Dyscalculia, cognitive impairment).
2. Base all explanations solely on observable mathematical/linguistic conceptual misunderstandings, prerequisite knowledge gaps, or procedural confusion.
3. Keep deterministic scores separate and focus on pedagogical reasoning.
4. Recommend low-cost, hands-on classroom activities suitable for primary teachers in Gujarat.
${isGujarati ? "CRITICAL: The entire diagnosis output MUST be in high-quality Gujarati (ગુજરાતી) script." : "Output in clear, professional English."}

Return valid JSON with this exact schema:
{
  "evidenceSummary": "Concise summary of empirical performance evidence without subjective bias",
  "underlyingMisconception": "Likely mathematical or conceptual misunderstanding causing errors",
  "prerequisiteGapsIdentified": ["prerequisite concept 1", "prerequisite concept 2"],
  "recommendedRemedialActivities": [
    {
      "activityTitle": "Activity Name",
      "description": "Concrete step-by-step classroom action",
      "concreteMaterials": "Materials needed (e.g. pebbles, flashcards, bottle caps)"
    }
  ],
  "suggestedReassessmentMethod": {
    "format": "e.g. 5-question parallel assessment or one-on-one manipulative check",
    "timelineDays": 3,
    "masteryCriterion": "e.g. 80% (4 out of 5 correct without hints)"
  },
  "ethicalSafetyDisclosure": "Evidence-based pedagogical diagnosis. Clinical or cognitive conditions are not assessed."
}`;

    const formattedCompetencies = Array.isArray(competencyItems) && competencyItems.length > 0
      ? competencyItems.map((c: any, i: number) => `Q${i + 1}: ${c.questionText || "Question"} | Answer: ${c.studentAnswer || "N/A"} | Status: ${c.isCorrect ? "Correct" : "Incorrect"}`).join("\n")
      : "No per-question competency breakdown provided.";

    const prompt = `Student Evaluation Data:
- Grade: Class ${studentClass}
- Subject: ${subject}
- Concept Evaluated: ${conceptName}
- Score: ${numMarks} out of ${numMax} (${calculatedPercentage}%)
- Operational Mastery Status: ${masteryStatus}
- Teacher Observations: "${teacherObservations || "None recorded"}"
- Specific Competency Evidence:
${formattedCompetencies}

Generate the evidence-based pedagogical gap diagnosis JSON.`;

    const fallbackGenerator = () => {
      let fallbackDiagnosis: any;

      if (isGujarati) {
        fallbackDiagnosis = {
          evidenceSummary: `વિદ્યાર્થીએ ${conceptName} માં ${numMax} માંથી ${numMarks} ગુણ (${calculatedPercentage}%) મેળવ્યા છે. સંસ્થાકીય નિયમ મુજબ વિદ્યાર્થી '${masteryStatus === "Needs Support" ? "સહાયની જરૂર" : masteryStatus === "Developing" ? "વિકાસશીલ" : "નિપુણ"}' શ્રેણીમાં આવે છે.`,
          underlyingMisconception: calculatedPercentage < 60
            ? "સમાન વહેંચણીની પ્રક્રિયા અને ગુણાકાર-ભાગાકારના સંબંધમાં પાયાની ગૂંચવણ જણાય છે. સંખ્યાત્મક સંકેતો કરતાં પહેલાં મૂર્ત સાધનોથી પુનરાવર્તિત બાદબાકી સમજવી જરૂરી છે."
            : "સંકલ્પનાની સામાન્ય સમજ છે પરંતુ વ્યવહારુ કોયડાઓ ઉકેલતી વખતે પગલાંવાર ગણતરીમાં થોડી અનિશ્ચિતતા જોવા મળે છે.",
          prerequisiteGapsIdentified: [
            "સમાન જૂથો બનાવવાની સમજ",
            "મૂળભૂત ઘડિયા (૨ થી ૫) નું સ્મરણ",
          ],
          recommendedRemedialActivities: [
            {
              activityTitle: "મૂર્ત સાધનોથી સમાન વહેંચણી",
              description: "૧૨ કે ૧૫ કાંકરા આપી ૩ કે ૪ ભાગમાં સમાન વહેંચવાનો પ્રત્યક્ષ અનુભવ કરાવો.",
              concreteMaterials: "કાંકરા, બીજ અથવા પ્લાસ્ટિકના ઢાંકણાં",
            },
            {
              activityTitle: "સંખ્યા રેખા પર કુદકા (પુનરાવર્તિત બાદબાકી)",
              description: "સંખ્યા રેખા પર પાછળ કુદકા મારીને ભાગાકારની સમજ આપો.",
              concreteMaterials: "ચાક અને જમીન પર દોરેલી સંખ્યા રેખા",
            },
          ],
          suggestedReassessmentMethod: {
            format: "૫ પ્રશ્નોનું સરળ સમાંતર મૂલ્યાંકન",
            timelineDays: 4,
            masteryCriterion: "૫ માંથી ૪ સાચા ઉત્તર (૮૦% ગુણ)",
          },
          ethicalSafetyDisclosure: "આ મૂલ્યાંકન માત્ર વર્ગખંડના શૈક્ષણિક પુરાવા પર આધારિત છે. કોઈપણ તબીબી કે માનસિક નિદાન કરવામાં આવેલ નથી.",
        };
      } else {
        fallbackDiagnosis = {
          evidenceSummary: `The student scored ${numMarks}/${numMax} (${calculatedPercentage}%) on ${conceptName}, placing them in the '${masteryStatus}' tier under standard operational thresholds.`,
          underlyingMisconception: calculatedPercentage < 60
            ? "Difficulty with equal partitioning and connecting division to known multiplication facts. The student appears to treat division as an arbitrary algorithm rather than concrete sharing or repeated subtraction."
            : "Developing foundational understanding; minor calculation or interpretation slips in word problem contexts.",
          prerequisiteGapsIdentified: [
            "Equal grouping and one-to-one correspondence",
            "Multiplication fact families (2 to 5)",
          ],
          recommendedRemedialActivities: [
            {
              activityTitle: "Physical Equal-Sharing Cups",
              description: "Provide counters and cups. Have the student physically distribute tokens one-by-one to visualize the quotient.",
              concreteMaterials: "15-20 pebbles or bottle caps, 3-4 paper cups",
            },
            {
              activityTitle: "Fact Family Triangle Cards",
              description: "Use 3-corner cards showing multiplication and division links (e.g. 3, 4, 12).",
              concreteMaterials: "Cardboard triangles and marker",
            },
          ],
          suggestedReassessmentMethod: {
            format: "5-question parallel assessment using visual grouping models",
            timelineDays: 4,
            masteryCriterion: "80% (at least 4 out of 5 correct without teacher prompts)",
          },
          ethicalSafetyDisclosure: "Evidence-based pedagogical diagnosis. Clinical, medical, or developmental conditions are not evaluated.",
        };
      }

      return {
        content: JSON.stringify(fallbackDiagnosis),
        data: fallbackDiagnosis,
      };
    };

    const aiResult = await generateAiContent(
      {
        prompt,
        systemInstruction,
        temperature: 0.2,
        responseFormat: "json",
      },
      fallbackGenerator
    );

    const diagnosis = aiResult.data || JSON.parse(aiResult.content);

    const fullResponse: GapAnalysisResponse = {
      deterministicMetrics: {
        marksObtained: numMarks,
        maximumMarks: numMax,
        calculatedPercentage,
        masteryStatus,
        operationalThresholdApplied: "Mastered >= 80% | Developing 60–79% | Needs Support < 60%",
        requiresRemediation,
        priority,
      },
      aiPedagogicalDiagnosis: diagnosis,
      isAiGenerated: aiResult.isAiGenerated,
      provider: aiResult.provider,
      modelUsed: aiResult.modelUsed,
      note: aiResult.note,
    };

    return NextResponse.json({
      success: true,
      analysis: fullResponse,
    });
  } catch (error: any) {
    console.error("API POST /api/ai/gap-analyzer error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to analyze student learning gap" },
      { status: 500 }
    );
  }
}
