import { NextResponse } from "next/server";
import { generateAiContent } from "@/lib/ai/aiProvider";

export interface WorksheetQuestion {
  questionNumber: number;
  questionText: string;
  questionType: string;
  options?: string[];
  marks: number;
  answerKey: string;
  stepExplanation: string;
}

export interface GeneratedWorksheet {
  worksheetTitle: string;
  schoolName: string;
  grade: number;
  subject: string;
  concept: string;
  difficulty: "Easy" | "Medium" | "Challenging";
  language: "en" | "gu";
  instructions: string;
  totalMarks: number;
  estimatedMinutes: number;
  personalizedStudentNote?: string;
  questions: WorksheetQuestion[];
}

function validateWorksheet(ws: any): ws is GeneratedWorksheet {
  if (!ws || typeof ws !== "object") return false;
  if (!Array.isArray(ws.questions) || ws.questions.length === 0) return false;

  for (const q of ws.questions) {
    if (!q.questionText || typeof q.questionText !== "string") return false;
    if (!q.answerKey || typeof q.answerKey !== "string") return false;
    if (q.questionType === "mcq" && (!Array.isArray(q.options) || q.options.length < 2)) {
      return false;
    }
  }
  return true;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      grade = 4,
      subject = "MATH",
      concept = "Division Basics & Equal Sharing",
      difficulty = "Medium",
      questionCount = 5,
      language = "en",
      questionType = "mixed",
      studentName,
      studentGapContext,
    } = body;

    const count = Math.min(10, Math.max(3, Number(questionCount) || 5));
    const isGujarati = language === "gu";

    const systemInstruction = `You are ShikshaSetu AI Primary Worksheet Creator for Gujarat Government Schools (Grades 1 to 5).
Generate a pedagogically sound classroom worksheet suitable for Gujarat primary schools.
Key requirements:
1. Provide appropriate difficulty for Class ${grade} primary students.
2. If studentGapContext is provided, tailor the questions to address their specific conceptual hurdle.
3. Every question MUST have an accurate Answer Key and child-friendly Step-by-Step Explanation.
4. Total marks should correspond to 2 or 3 marks per question.
${isGujarati ? "CRITICAL: The entire worksheet (titles, instructions, questions, answer keys, explanations) MUST be in authentic Gujarati (ગુજરાતી) script." : "Use clear, standard primary English with Indian cultural contexts (e.g., laddus, pencils, kites, mangoes, rupees)."}

Return valid JSON adhering to this exact schema:
{
  "worksheetTitle": "...",
  "schoolName": "Model Primary School, Gandhinagar",
  "grade": ${grade},
  "subject": "${subject}",
  "concept": "${concept}",
  "difficulty": "${difficulty}",
  "language": "${language}",
  "instructions": "...",
  "totalMarks": ${count * 2},
  "estimatedMinutes": ${count * 4},
  ${studentName ? `"personalizedStudentNote": "Personalized intervention worksheet for ${studentName}",` : ""}
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "...",
      "questionType": "mcq",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "marks": 2,
      "answerKey": "B) ...",
      "stepExplanation": "..."
    }
  ]
}`;

    const prompt = `Specifications:
- Grade: Class ${grade}
- Subject: ${subject}
- Concept: ${concept}
- Difficulty Level: ${difficulty}
- Number of Questions: ${count}
- Question Type Preference: ${questionType} (if 'mixed', include a combination of word problem, short answer, and multiple choice)
- Language: ${isGujarati ? "Gujarati (ગુજરાતી)" : "English"}
${studentName ? `- Targeted Student: ${studentName}` : ""}
${studentGapContext ? `- Targeted Student Gap: "${studentGapContext}"` : ""}

Generate the complete validated worksheet JSON.`;

    const fallbackGenerator = () => {
      let fallbackWs: GeneratedWorksheet;

      if (isGujarati) {
        fallbackWs = {
          worksheetTitle: `પ્રાથમિક ગણિત કાર્યપત્રક: ${concept}`,
          schoolName: "મોડેલ પ્રાથમિક શાળા, ગાંધીનગર",
          grade: Number(grade),
          subject: String(subject),
          concept: String(concept),
          difficulty: difficulty as any,
          language: "gu",
          instructions: "બધા પ્રશ્નો ધ્યાનથી વાંચો અને નીચે આપેલી ખાલી જગ્યામાં ગણતરી દર્શાવી ઉત્તર લખો.",
          totalMarks: count * 2,
          estimatedMinutes: count * 4,
          personalizedStudentNote: studentName ? `${studentName} માટે ખાસ તૈયાર કરેલ ઉપચારાત્મક કાર્યપત્રક` : undefined,
          questions: [
            {
              questionNumber: 1,
              questionText: "૧૬ પતંગ ૪ બાળકો વચ્ચે સરખે ભાગે વહેંચતા દરેક બાળકને કેટલી પતંગ મળશે?",
              questionType: "mcq",
              options: ["A) ૨ પતંગ", "B) ૪ પતંગ", "C) ૬ પતંગ", "D) ૮ પતંગ"],
              marks: 2,
              answerKey: "B) ૪ પતંગ",
              stepExplanation: "૧૬ ÷ ૪ = ૪ કારણ કે ૪ × ૪ = ૧૬.",
            },
            {
              questionNumber: 2,
              questionText: "એક બોક્સમાં ૨૪ રંગીન પેન્સિલો છે. જો પ્રત્યેક પેકેટમાં ૬ પેન્સિલ મૂકવી હોય, તો કેટલા પેકેટ બનશે?",
              questionType: "short_answer",
              marks: 2,
              answerKey: "૪ પેકેટ",
              stepExplanation: "૨૪ પેન્સિલ ÷ ૬ પેન્સિલ પ્રતિ પેકેટ = ૪ પેકેટ.",
            },
            {
              questionNumber: 3,
              questionText: "ખાલી જગ્યા પૂરો: ૨૦ ÷ ૫ = ____",
              questionType: "fill_blanks",
              marks: 2,
              answerKey: "૪",
              stepExplanation: "૫ × ૪ = ૨૦, માટે ૨૦ ÷ ૫ = ૪.",
            },
            {
              questionNumber: 4,
              questionText: "મીના પાસે ૩૫ રૂપિયા છે. એક નોટબુકની કિંમત ૭ રૂપિયા હોય તો તે કેટલી નોટબુક ખરીદી શકે?",
              questionType: "word_problems",
              marks: 2,
              answerKey: "૫ નોટબુક",
              stepExplanation: "૩૫ ÷ ૭ = ૫ નોટબુક.",
            },
            {
              questionNumber: 5,
              questionText: "નીચેનામાંથી કયું વાક્ય ૧૮ ÷ ૩ = ૬ દર્શાવે છે?",
              questionType: "mcq",
              options: [
                "A) ૧૮ માંથી ૩ બાદ કરતાં ૬ વધે",
                "B) ૧૮ વસ્તુઓને ૩ સરખા ભાગમાં વહેંચતાં દરેક ભાગમાં ૬ આવે",
                "C) ૧૮ અને ૩ નો ગુણાકાર ૬ થાય",
                "D) ૧૮ માં ૩ ઉમેરતાં ૬ મળે",
              ],
              marks: 2,
              answerKey: "B) ૧૮ વસ્તુઓને ૩ સરખા ભાગમાં વહેંચતાં દરેક ભાગમાં ૬ આવે",
              stepExplanation: "ભાગાકાર એ સમાન વહેંચણી દર્શાવે છે.",
            },
          ].slice(0, count),
        };
      } else {
        fallbackWs = {
          worksheetTitle: `Primary Practice Worksheet: ${concept}`,
          schoolName: "Model Primary School, Gandhinagar",
          grade: Number(grade),
          subject: String(subject),
          concept: String(concept),
          difficulty: difficulty as any,
          language: "en",
          instructions: "Read each problem carefully and write your answers with neat step-by-step working.",
          totalMarks: count * 2,
          estimatedMinutes: count * 4,
          personalizedStudentNote: studentName ? `Personalized Remedial Practice for ${studentName}` : undefined,
          questions: [
            {
              questionNumber: 1,
              questionText: "There are 16 kites to be shared equally among 4 children. How many kites will each child receive?",
              questionType: "mcq",
              options: ["A) 2 kites", "B) 4 kites", "C) 6 kites", "D) 8 kites"],
              marks: 2,
              answerKey: "B) 4 kites",
              stepExplanation: "16 shared equally among 4 = 16 ÷ 4 = 4.",
            },
            {
              questionNumber: 2,
              questionText: "A baker has 24 mango cupcakes. He packs them into boxes of 6. How many boxes can he fill?",
              questionType: "short_answer",
              marks: 2,
              answerKey: "4 boxes",
              stepExplanation: "24 cupcakes ÷ 6 per box = 4 boxes.",
            },
            {
              questionNumber: 3,
              questionText: "Fill in the blank: 20 ÷ 5 = ____",
              questionType: "fill_blanks",
              marks: 2,
              answerKey: "4",
              stepExplanation: "5 × 4 = 20, so 20 ÷ 5 = 4.",
            },
            {
              questionNumber: 4,
              questionText: "Pooja has 35 rupees. Each ice cream costs 7 rupees. How many ice creams can she buy?",
              questionType: "word_problems",
              marks: 2,
              answerKey: "5 ice creams",
              stepExplanation: "35 ÷ 7 = 5 ice creams.",
            },
            {
              questionNumber: 5,
              questionText: "Which statement accurately represents 18 ÷ 3 = 6?",
              questionType: "mcq",
              options: [
                "A) 18 minus 3 is 6",
                "B) 18 objects shared equally into 3 groups gives 6 in each group",
                "C) 18 multiplied by 3 gives 6",
                "D) 3 objects added to 18 makes 6",
              ],
              marks: 2,
              answerKey: "B) 18 objects shared equally into 3 groups gives 6 in each group",
              stepExplanation: "Division represents equal sharing or grouping.",
            },
          ].slice(0, count),
        };
      }

      return {
        content: JSON.stringify(fallbackWs),
        data: fallbackWs,
      };
    };

    const aiResult = await generateAiContent<GeneratedWorksheet>(
      {
        prompt,
        systemInstruction,
        temperature: 0.25,
        responseFormat: "json",
      },
      fallbackGenerator
    );

    let worksheetData = aiResult.data || JSON.parse(aiResult.content);

    // Validate generated worksheet structure
    if (!validateWorksheet(worksheetData)) {
      console.warn("Generated worksheet failed validation, applying fallback template.");
      const fallback = fallbackGenerator();
      worksheetData = fallback.data;
    }

    return NextResponse.json({
      success: true,
      worksheet: worksheetData,
      isAiGenerated: aiResult.isAiGenerated,
      provider: aiResult.provider,
      modelUsed: aiResult.modelUsed,
      note: aiResult.note,
    });
  } catch (error: any) {
    console.error("API POST /api/ai/worksheet error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate worksheet" },
      { status: 500 }
    );
  }
}
