import { NextResponse } from "next/server";
import { generateAiContent } from "@/lib/ai/aiProvider";
import { CURRICULUM_TEMPLATES } from "@/lib/engine/remedialEngine";
import type { RemedialPlan, RemedialStep, SubjectCode } from "@/lib/types";

export interface GeneratedRemedialPlan {
  learningObjective: string;
  identifiedKnowledgeGap: string;
  shortExplanation: string;
  steps: RemedialStep[];
  lowCostMaterials: string[];
  practiceQuestions: {
    questionNumber: number;
    question: string;
    answer: string;
    explanation: string;
  }[];
  suggestedDurationMinutes: number;
  reassessmentMethod: string;
  masteryCriteria: string;
  teacherInstructions: string;
  language: "en" | "gu";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      studentId = "std-demo",
      studentName = "Student",
      conceptId = "c-div-01",
      conceptName = "Division Basics",
      subjectCode = "MATH",
      grade = 4,
      latestPercentage = 35,
      gapReason = "Struggling with equal sharing and division concepts",
      language = "en",
    } = body;

    const isGujarati = language === "gu";

    const systemInstruction = `You are StudySaathi AI Remedial Plan Generator for Gujarat Primary Schools (Grades 1 to 5).
Generate a comprehensive, actionable remedial teaching plan tailored to a primary student struggling with a foundational concept.
The plan MUST include:
1. Learning Objective: Specific, measurable pedagogical goal.
2. Identified Knowledge Gap: Clear articulation of the conceptual roadblock.
3. Short Explanation: Child-friendly explanation of the concept using everyday analogies.
4. Five (5) Step-by-Step Remedial Teaching Activities: Each with stepNumber (1 to 5), title, practical classroom description, durationMinutes, and activityType (concrete, pictorial, guided, independent, exit_check).
5. Low-Cost Classroom Materials: Inexpensive materials readily available in Gujarat government schools (e.g. bottle caps, seeds, pebbles, matchsticks, chalk, graph paper).
6. Practice Questions: Three progressive practice questions with answers and step-by-step solutions.
7. Suggested Teaching Duration: Total session minutes (e.g. 20 to 25 mins).
8. Reassessment Method: Concrete evaluation strategy.
9. Criteria for Mastery: Explicit threshold and condition for certifying the student has mastered the concept (e.g. 80% on 5-question parallel assessment).
10. Teacher Instructions: Specific pedagogical guidance for the teacher.

${isGujarati ? "CRITICAL: The entire remedial plan content MUST be generated in natural Gujarati (ગુજરાતી) script for primary teachers in Gujarat." : "Provide the content in clear, practical English."}

You MUST return valid JSON matching this schema:
{
  "learningObjective": "...",
  "identifiedKnowledgeGap": "...",
  "shortExplanation": "...",
  "steps": [
    {"stepNumber": 1, "title": "...", "description": "...", "durationMinutes": 4, "activityType": "concrete"},
    {"stepNumber": 2, "title": "...", "description": "...", "durationMinutes": 5, "activityType": "pictorial"},
    {"stepNumber": 3, "title": "...", "description": "...", "durationMinutes": 5, "activityType": "guided"},
    {"stepNumber": 4, "title": "...", "description": "...", "durationMinutes": 5, "activityType": "independent"},
    {"stepNumber": 5, "title": "...", "description": "...", "durationMinutes": 3, "activityType": "exit_check"}
  ],
  "lowCostMaterials": ["Pebbles or bottle caps", "Chalk & slate", "Paper cups"],
  "practiceQuestions": [
    {"questionNumber": 1, "question": "...", "answer": "...", "explanation": "..."}
  ],
  "suggestedDurationMinutes": 22,
  "reassessmentMethod": "...",
  "masteryCriteria": "...",
  "teacherInstructions": "..."
}`;

    const prompt = `Student Assessment Profile:
- Student: ${studentName} (Grade ${grade})
- Subject: ${subjectCode}
- Concept: ${conceptName}
- Recent Score: ${latestPercentage}% (Below mastery threshold)
- Identified Evidence/Reason: "${gapReason}"
- Language: ${isGujarati ? "Gujarati (ગુજરાતી)" : "English"}

Generate the targeted 5-step AI Remedial Teaching Plan.`;

    // Built-in offline fallback based on Gujarat curriculum templates
    const fallbackGenerator = () => {
      const template = CURRICULUM_TEMPLATES[conceptId] || CURRICULUM_TEMPLATES["c-div-01"];

      let planData: GeneratedRemedialPlan;

      if (isGujarati) {
        planData = {
          learningObjective: `${conceptName} માં પાયાની સંકલ્પનાત્મક સમજ કેળવવી અને સમાન વહેંચણી દ્વારા ભાગાકાર કરતા શીખવું.`,
          identifiedKnowledgeGap: `વિદ્યાર્થી હાલમાં ${latestPercentage}% ગુણ ધરાવે છે. સમાન જૂથો બનાવવા અને ભાગાકારની પ્રક્રિયામાં સહાયની જરૂર છે.`,
          shortExplanation: "ભાગાકાર એટલે વસ્તુઓને સરખા ભાગે વહેંચવી અથવા વારંવાર એક જ સંખ્યા બાદ કરવી.",
          steps: [
            {
              stepNumber: 1,
              title: "પૂર્વજ્ઞાન અને ઘડિયા પુનરાવર્તન",
              description: "૨, ૩, ૪ અને ૫ ના ઘડિયાનું મૌખિક પુનરાવર્તન કરાવો. ગુણાકાર અને ભાગાકારનો પરસ્પર સંબંધ દર્શાવો.",
              durationMinutes: 4,
              activityType: "discussion",
            },
            {
              stepNumber: 2,
              title: "પ્રત્યક્ષ મૂર્ત વહેંચણી (કાંકરા/ઢાંકણાં)",
              description: "વિદ્યાર્થીને ૧૨ કે ૧૫ કાંકરા આપી ૩ કપમાં સરખે ભાગે વહેંચવા કહો. દરેક કપમાં આવતી સંખ્યા ગણાવો.",
              durationMinutes: 5,
              activityType: "hands_on",
            },
            {
              stepNumber: 3,
              title: "ચિત્રકામ અને જૂથ નિર્માણ",
              description: "નોટબુકમાં ગોળ કુંડાળા દોરી તેમાં ટપકાં સમાન વહેંચીને ગણતરી કરવાની પદ્ધતિ શીખવો.",
              durationMinutes: 5,
              activityType: "guided_practice",
            },
            {
              stepNumber: 4,
              title: "વ્યક્તિગત મહાવરો (વર્કશીટ)",
              description: "વિદ્યાર્થી જાતે ૩ થી ૪ સરળ ભાગાકારના દાખલા ચિત્રની મદદથી ગણે.",
              durationMinutes: 5,
              activityType: "independent_practice",
            },
            {
              stepNumber: 5,
              title: "મિનિ ડાયગ્નોસ્ટિક ચેક (એક્ઝિટ ટિકિટ)",
              description: "૨ મૌખિક પ્રશ્નો પૂછીને આજની સમજણની ઝડપી ખાતરી કરો.",
              durationMinutes: 3,
              activityType: "check_for_understanding",
            },
          ],
          lowCostMaterials: [
            "૨૦ કાંકરા, બીજ અથવા બોટલના પ્લાસ્ટિક ઢાંકણાં",
            "૩ થી ૪ કાગળના કપ અથવા જમીન પર દોરેલા કુંડાળા",
            "સ્લેટ-પેન અથવા નોટબુક-પેન્સિલ",
          ],
          practiceQuestions: [
            {
              questionNumber: 1,
              question: "૧૫ ચોકલેટ ૩ બાળકો વચ્ચે સરખે ભાગે વહેંચતા દરેકને કેટલી ચોકલેટ મળે?",
              answer: "૫ ચોકલેટ",
              explanation: "૧૫ ÷ ૩ = ૫ કારણ કે ૩ × ૫ = ૧૫ થાય છે.",
            },
            {
              questionNumber: 2,
              question: "૧૮ પાનાંની પુસ્તિકા ૬ દિવસમાં સરખા પાનાં વાંચી પૂરી કરવી હોય તો રોજના કેટલા પાનાં વાંચવા પડે?",
              answer: "૩ પાનાં",
              explanation: "૧૮ ÷ ૬ = ૩ પાનાં પ્રતિ દિન.",
            },
            {
              questionNumber: 3,
              question: "૨૪ પેન્સિલ ૪ પેકેટમાં સરખી મૂકતાં દરેક પેકેટમાં કેટલી પેન્સિલ આવે?",
              answer: "૬ પેન્સિલ",
              explanation: "૨૪ ÷ ૪ = ૬ પેન્સિલ.",
            },
          ],
          suggestedDurationMinutes: 22,
          reassessmentMethod: "૫ પ્રશ્નોનું સમાંતર લેખિત અથવા પ્રત્યક્ષ સાધનો સાથેનું મૂલ્યાંકન",
          masteryCriteria: "વિદ્યાર્થી સ્વતંત્ર રીતે કોઈપણ સંકેત વિના ઓછામાં ઓછા ૮૦% (૫ માંથી ૪ પ્રશ્નો) સાચા ગણે.",
          teacherInstructions: "બાળક પર દબાણ ન કરો. લાંબી ભાગાકાર પદ્ધતિ કરતાં સમાન વહેંચણીના ખ્યાલ પર ભાર મૂકો.",
          language: "gu",
        };
      } else {
        planData = {
          learningObjective: template.learningObjective,
          identifiedKnowledgeGap: `Student currently scoring ${latestPercentage}%. Needs Support in connecting equal sharing to division facts.`,
          shortExplanation: "Division means fair sharing into equal groups or finding how many groups can be formed from a total.",
          steps: template.steps,
          lowCostMaterials: template.materials,
          practiceQuestions: [
            {
              questionNumber: 1,
              question: "If 15 laddus are shared equally among 3 friends, how many does each friend receive?",
              answer: "5 laddus",
              explanation: "15 ÷ 3 = 5 (since 3 × 5 = 15).",
            },
            {
              questionNumber: 2,
              question: "A teacher has 18 pencils and gives an equal amount to 6 students. How many pencils per student?",
              answer: "3 pencils",
              explanation: "18 ÷ 6 = 3.",
            },
            {
              questionNumber: 3,
              question: "Pack 24 biscuits into boxes with 4 biscuits each. How many boxes are needed?",
              answer: "6 boxes",
              explanation: "24 ÷ 4 = 6.",
            },
          ],
          suggestedDurationMinutes: template.estimatedMinutes,
          reassessmentMethod: "5-question parallel assessment using visual grouping diagrams",
          masteryCriteria: template.reassessmentCriteria,
          teacherInstructions: template.teacherInstructions,
          language: "en",
        };
      }

      return {
        content: JSON.stringify(planData),
        data: planData,
      };
    };

    const aiResult = await generateAiContent<GeneratedRemedialPlan>(
      {
        prompt,
        systemInstruction,
        temperature: 0.3,
        responseFormat: "json",
      },
      fallbackGenerator
    );

    const generated = aiResult.data || JSON.parse(aiResult.content);

    // Ensure exactly 5 steps are present
    let rawSteps: RemedialStep[] = Array.isArray(generated.steps) ? generated.steps : [];
    if (rawSteps.length < 5) {
      const template = CURRICULUM_TEMPLATES[conceptId] || CURRICULUM_TEMPLATES["c-div-01"];
      rawSteps = template.steps;
    }

    const fiveSteps = rawSteps.slice(0, 5).map((s, idx) => ({
      stepNumber: idx + 1,
      title: s.title || `STEP ${idx + 1}`,
      description: s.description || `Classroom activity description for step ${idx + 1}`,
      durationMinutes: s.durationMinutes || 4,
      activityType: s.activityType || (idx === 0 ? "discussion" : idx === 1 ? "hands_on" : idx === 2 ? "guided_practice" : idx === 3 ? "independent_practice" : "reassessment"),
      learningObjective: s.learningObjective || `${generated.learningObjective} - Phase ${idx + 1}`,
      teacherInstructions: s.teacherInstructions || generated.teacherInstructions || "Guide the student through the activity step-by-step.",
      studentInstructions: s.studentInstructions || "Follow teacher guidance and solve exercises carefully.",
      requiredMaterials: s.requiredMaterials || generated.lowCostMaterials || ["Notebook", "Pencil"],
      questionsOrExercises: s.questionsOrExercises || [],
      expectedResult: s.expectedResult || "Demonstrated evidence of learning",
      completed: false,
    }));

    // Generate 5 structured reassessment questions
    const templateRef = CURRICULUM_TEMPLATES[conceptId] || CURRICULUM_TEMPLATES["c-div-01"];
    const reassessmentQuestions = (generated.practiceQuestions && generated.practiceQuestions.length >= 3)
      ? generated.practiceQuestions.map((q: any, i: number) => ({
          questionNumber: i + 1,
          question: q.question,
          options: q.options || undefined,
          correctAnswer: q.answer || q.correctAnswer || "Correct Answer",
          explanation: q.explanation || "Step-by-step reasoning",
          marks: 1,
          skillTarget: `${conceptName} Application Q${i + 1}`,
        }))
      : (templateRef.reassessmentQuestions || []);

    // Build complete RemedialPlan object ready for storage or preview
    const fullPlan: RemedialPlan = {
      id: `rp-ai-${Date.now()}`,
      studentId,
      studentName,
      studentClass: grade,
      studentSection: "A",
      conceptId,
      conceptName,
      subjectCode: subjectCode as SubjectCode,
      learningObjective: generated.learningObjective,
      recommendationReason: generated.identifiedKnowledgeGap,
      status: "Suggested",
      estimatedMinutes: generated.suggestedDurationMinutes || 20,
      difficulty: "Beginner",
      requiredMaterials: generated.lowCostMaterials || templateRef.materials || [],
      steps: fiveSteps,
      practiceQuestionsSummary: generated.practiceQuestions
        ? generated.practiceQuestions.map((q: any) => `Q${q.questionNumber || 1}: ${q.question} (Ans: ${q.answer})`).join("; ")
        : `${fiveSteps.length} structured remedial steps with exit reassessment.`,
      reassessmentCriteria: generated.masteryCriteria || "Achieve >= 80% on parallel reassessment",
      teacherInstructions: generated.teacherInstructions || "Reinforce concrete manipulatives first.",
      createdAt: new Date().toISOString(),
      baselineScore: latestPercentage,
      baselineEvidence: gapReason,
      knownMisconceptions: generated.shortExplanation || gapReason,
      confirmedOrInferred: "confirmed",
      expectedSkill: generated.learningObjective,
      masteryBenchmark: 80,
      reassessmentQuestions,
      worksheet: {
        worksheetTitle: `${conceptName} - Remedial Practice Worksheet`,
        schoolName: "Model Primary School, Gandhinagar",
        grade,
        subject: subjectCode,
        concept: conceptName,
        difficulty: "Beginner",
        language,
        instructions: isGujarati ? "બધા પ્રશ્નો ધ્યાનથી ગણો." : "Solve each question carefully.",
        totalMarks: reassessmentQuestions.length * 2,
        estimatedMinutes: 15,
        questions: reassessmentQuestions.map((q: any, idx: number) => ({
          questionNumber: idx + 1,
          questionText: q.question,
          questionType: q.options ? "mcq" : "open",
          options: q.options,
          marks: 2,
          answerKey: q.correctAnswer,
          stepExplanation: q.explanation,
        })),
      },
    };

    return NextResponse.json({
      success: true,
      plan: fullPlan,
      rawGenerated: generated,
      isAiGenerated: aiResult.isAiGenerated,
      provider: aiResult.provider,
      modelUsed: aiResult.modelUsed,
      note: aiResult.note,
    });
  } catch (error: any) {
    console.error("API POST /api/ai/remedial error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate AI remedial plan" },
      { status: 500 }
    );
  }
}
