import { generateAiContent } from "../../../../src/lib/ai/aiProvider";
import { db } from "../../../../src/lib/db/database";
import type { TutorResponseData, AiResponse } from "../../../../packages/shared/src/types";

export class AiService {
  async askTutor(
    query: string,
    grade: number = 4,
    subject: string = "Mathematics",
    language: "en" | "gu" = "en"
  ): Promise<{
    tutorResponse: TutorResponseData;
    isAiGenerated: boolean;
    provider: string;
    modelUsed: string;
    note?: string;
  }> {
    const isGujarati = language === "gu";

    const systemInstruction = `You are ShikshaSetu AI Tutor, an expert primary education pedagogical specialist for schools in Gujarat, India (Grades 1 to 5).
Your mission is to equip primary teachers with concrete, manipulative-based teaching strategies, simple language explanations, and low-cost classroom activities.
When asked how to teach a concept, or when given a student difficulty:
1. Provide a crystal-clear, intuitive explanation suitable for primary school students (using everyday analogies).
2. Give a practical classroom demonstration using low-cost or locally available items (e.g. pebbles, bottle caps, rotis, chalk, seeds, drawing charts).
3. Outline a 3-to-4 step classroom teaching activity with durations.
4. Supply exactly THREE (3) progressive practice questions appropriate for the specified grade level.
5. Provide detailed answers and step-by-step explanations for all 3 questions.
6. Provide a concise teacher pedagogical tip.
${isGujarati ? "CRITICAL: The entire response MUST be generated in high-quality, authentic Gujarati (ગુજરાતી) script for primary teachers in Gujarat." : "Provide the response in clear, encouraging English with Indian educational context (NCERT/GCERT aligned)."}

You MUST return valid JSON adhering exactly to this schema:
{
  "topic": "Concept Name",
  "simpleExplanation": "Explanation in simple terms for primary students",
  "classroomExample": "Real-world classroom concrete example",
  "stepByStepActivity": [
    {"stepNumber": 1, "title": "...", "instruction": "...", "durationMinutes": 5}
  ],
  "practiceQuestions": [
    {"questionNumber": 1, "question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "answer": "...", "explanation": "..."}
  ],
  "teacherPedagogyTip": "Actionable tip for the teacher"
}`;

    const prompt = `Grade Level: Class ${grade}
Subject: ${subject}
Teacher's Question: "${query.trim()}"
Language Requested: ${isGujarati ? "Gujarati (ગુજરાતી)" : "English"}

Generate the complete pedagogical lesson support JSON according to instructions.`;

    const fallbackGenerator = () => {
      const qLower = query.toLowerCase();
      const isDiv = qLower.includes("divis") || qLower.includes("equal") || qLower.includes("shar") || qLower.includes("ભાગ");

      let fallbackData: TutorResponseData;

      if (isGujarati) {
        fallbackData = {
          topic: isDiv ? "ભાગાકાર અને સમાન વહેંચણી (Division & Equal Sharing)" : `સંકલ્પના શિક્ષણ સહાય: Class ${grade} ${subject}`,
          simpleExplanation: isDiv
            ? "ભાગાકાર એટલે વસ્તુઓની સમાન જૂથોમાં વહેંચણી કરવી અથવા વારંવાર એક જ સંખ્યા બાદ કરવી. જેમ કે ૧૨ લખોટી ૩ બાળકોમાં સરખે ભાગે વહેંચવી."
            : "કોઈપણ નવી સંકલ્પના શીખવતી વખતે બાળકના રોજિંદા જીવન સાથે સંકળાયેલા ઉદાહરણોથી શરૂઆત કરવી સૌથી અસરકારક રહે છે.",
          classroomExample: isDiv
            ? "વર્ગખંડમાં ૧૨ કાંકરા અથવા બોટલના ઢાંકણાં લો. ૩ વિદ્યાર્થીઓને આગળ બોલાવી દરેકને એક-એક આપતા જાઓ. અંતે દરેક પાસે ૪ કાંકરા આવશે (૧૨ ÷ ૩ = ૪)."
            : "વર્ગખંડમાં ઉપલબ્ધ સાધનો જેમ કે ચોક, પથ્થર, પુસ્તકો અથવા આંગળીઓનો ઉપયોગ કરીને પ્રત્યક્ષ નિદર્શન કરો.",
          stepByStepActivity: [
            { stepNumber: 1, title: "પ્રત્યક્ષ વહેંચણી", instruction: "દરેક જોડીને ૧૫ બીજ કે કાંકરા આપો અને જૂથ બનાવવા કહો.", durationMinutes: 5 },
            { stepNumber: 2, title: "સંકલ્પના જોડાણ", instruction: "બાળકોને પ્રક્રિયાનું કારણ સમજાવો.", durationMinutes: 5 },
            { stepNumber: 3, title: "નોટબુક ચિત્રકામ", instruction: "ચિત્રો દ્વારા ગણતરી દર્શાવો.", durationMinutes: 6 },
          ],
          practiceQuestions: [
            { questionNumber: 1, question: "રાજુ પાસે ૧૫ ચોકલેટ છે. તે ૫ મિત્રોમાં સરખે ભાગે વહેંચે છે. દરેકને કેટલી મળે?", options: ["A) ૨", "B) ૩", "C) ૪", "D) ૫"], answer: "B) ૩ ચોકલેટ", explanation: "૧૫ ÷ ૫ = ૩." },
            { questionNumber: 2, question: "૧૮ પેન્સિલને ૬ પેકેટમાં સરખી મૂકતાં દરેક પેકેટમાં કેટલી પેન્સિલ આવે?", options: ["A) ૩", "B) ૪", "C) ૨", "D) ૬"], answer: "A) ૩ પેન્સિલ", explanation: "૧૮ ÷ ૬ = ૩." },
            { questionNumber: 3, question: "૨૦ લાડુ ૪ થાળીમાં સરખા મૂકતાં દરેક થાળીમાં કેટલા લાડુ રહેશે?", options: ["A) ૪", "B) ૫", "C) ૬", "D) ૧૦"], answer: "B) ૫ લાડુ", explanation: "૨૦ ÷ ૪ = ૫." },
          ],
          teacherPedagogyTip: "શરૂઆતમાં સીધું સૂત્ર ન શીખવો. પહેલાં સમાન વહેંચણીની પ્રક્રિયા પાકી કરાવો.",
          language: "gu",
        };
      } else {
        fallbackData = {
          topic: isDiv ? "Division as Equal Sharing & Repeated Subtraction" : `Pedagogical Guide: Class ${grade} ${subject}`,
          simpleExplanation: isDiv
            ? "Division simply means sharing a total amount equally among groups, or finding how many equal groups can be made from a total. It is the direct opposite of multiplication."
            : "Build from concrete hands-on models to pictorial representations, and finally to abstract symbols (CPA approach).",
          classroomExample: isDiv
            ? "Take 12 counting tokens or bottle caps. Call 3 students to the front and share the tokens one-by-one. Each child ends up with exactly 4 tokens, demonstrating that 12 ÷ 3 = 4."
            : "Use physical classroom props, student volunteers, or local story contexts to make the concept relatable.",
          stepByStepActivity: [
            { stepNumber: 1, title: "Concrete Distribution", instruction: "Give pairs of students 15 tamarind seeds and 3 paper bowls to share evenly.", durationMinutes: 5 },
            { stepNumber: 2, title: "Connecting with Multiplication", instruction: "Write 3 × 5 = 15 on board, show that 15 ÷ 3 = 5.", durationMinutes: 5 },
            { stepNumber: 3, title: "Repeated Subtraction Model", instruction: "Jump back on a number line by equal groups until 0.", durationMinutes: 6 },
          ],
          practiceQuestions: [
            { questionNumber: 1, question: "Raju has 15 laddus. He packs them equally into 3 boxes. How many laddus in each box?", options: ["A) 3", "B) 4", "C) 5", "D) 6"], answer: "C) 5 laddus", explanation: "15 shared into 3 boxes = 15 ÷ 3 = 5." },
            { questionNumber: 2, question: "A teacher has 18 crayons and distributes them equally to 6 students. How many crayons per student?", options: ["A) 2", "B) 3", "C) 4", "D) 6"], answer: "B) 3 crayons", explanation: "18 ÷ 6 = 3 because 6 × 3 = 18." },
            { questionNumber: 3, question: "Grandmother has 24 stickers. If she gives 4 stickers to each grandchild, how many grandchildren get stickers?", options: ["A) 4", "B) 5", "C) 6", "D) 8"], answer: "C) 6 grandchildren", explanation: "24 ÷ 4 = 6." },
          ],
          teacherPedagogyTip: "Never rush into the standard long division algorithm too quickly. Ensure students firmly grasp fair sharing using physical items first.",
          language: "en",
        };
      }

      return {
        content: JSON.stringify(fallbackData),
        data: fallbackData,
      };
    };

    const aiResult = await generateAiContent<TutorResponseData>(
      {
        prompt,
        systemInstruction,
        temperature: 0.3,
        responseFormat: "json",
      },
      fallbackGenerator
    );

    return {
      tutorResponse: (aiResult.data || JSON.parse(aiResult.content)) as TutorResponseData,
      isAiGenerated: aiResult.isAiGenerated,
      provider: aiResult.provider,
      modelUsed: aiResult.modelUsed,
      note: aiResult.note,
    };
  }

  async askAssistant(
    message: string,
    history: any[] = [],
    language: "en" | "gu" = "en",
    userRole: string = "teacher"
  ): Promise<{
    message: string;
    isAiGenerated: boolean;
    provider: string;
    modelUsed: string;
    note?: string;
  }> {
    const isGujarati = language === "gu";
    const learningGaps = db.getLearningGaps();
    const students = db.getStudents();
    const remedialPlans = db.getRemedialPlans();

    const activeGapsCount = learningGaps.filter((g) => g.status === "Active" || g.status === "Under Intervention").length;
    const highPriorityGaps = learningGaps.filter((g) => g.priority === "High" && g.status !== "Resolved");

    const highPrioritySummary = highPriorityGaps
      .slice(0, 5)
      .map((g) => `- ${g.studentName || "Student"} (Class ${g.grade || 4}): ${g.conceptName} (${g.latestPercentage}%, ${g.masteryStatus})`)
      .join("\n");

    const systemInstruction = `You are ShikshaSetu AI Teacher Assistant, an intelligent pedagogical companion for primary school educators in Gujarat, India (Grades 1 to 5).
${isGujarati ? "CRITICAL: Please respond in fluent, grammatically sound Gujarati (ગુજરાતી) script." : "Respond in clear, professional, warm English suitable for Indian primary education."}
Current telemetry: ${students.length} students, ${activeGapsCount} active learning gaps, ${remedialPlans.length} remedial plans.`;

    const fallbackGenerator = () => {
      let content = "";
      const msg = message.toLowerCase();

      if (isGujarati) {
        if (msg.includes("gap") || msg.includes("વિદ્યાર્થી") || msg.includes("ખામી") || msg.includes("summary")) {
          content = `નમસ્તે શિક્ષકશ્રી, શાળાના મૂલ્યાંકન ડેટા અનુસાર હાલમાં ધોરણ ૪ માં મુખ્યત્વે 'ભાગાકાર અને સમાન વહેંચણી' સંકલ્પનામાં શીખવાની ખામીઓ જોવા મળી છે. ${highPriorityGaps.length} વિદ્યાર્થીઓને તાત્કાલિક સહાયની જરૂર છે (જેમ કે આરવ પટેલ - ૩૫%). તેમના માટે ૫-તબક્કાની ઉપચારાત્મક યોજનાઓ અને મૂર્ત પ્રવૃત્તિઓ ઉપલબ્ધ છે.`;
        } else {
          content = `નમસ્તે! શિક્ષાસેતુ AI સહાયક તમારા વર્ગખંડ શિક્ષણ, પ્રવૃત્તિ આયોજન અને વિદ્યાર્થીઓની શીખવાની ખામીઓના નિવારણ માટે હંમેશા તૈયાર છે. તમે કોઈ ચોક્કસ વિષય કે વિદ્યાર્થીના ઉપચારાત્મક શિક્ષણ વિશે પ્રશ્ન પૂછી શકો છો.`;
        }
      } else {
        if (msg.includes("gap") || msg.includes("summar") || msg.includes("report") || msg.includes("class")) {
          content = `Hello Teacher! Based on current classroom telemetry across ${students.length} students, there are ${activeGapsCount} active learning gaps requiring support. The most urgent priority is Class 4 Mathematics: 'Division Basics & Equal Sharing' where students like Aarav Patel (35%) need concrete manipulative interventions. Structured 5-step remedial plans and printable worksheets are ready in your dashboard.`;
        } else {
          content = `Hello! I am your ShikshaSetu AI Pedagogical Assistant. I can help you design low-cost classroom activities, formulate step-by-step remedial plans for struggling learners, generate printable practice worksheets, and summarize real-time learning gap telemetry for your classroom. How can I support your teaching today?`;
        }
      }

      return { content, data: { text: content } };
    };

    const aiResult = await generateAiContent(
      {
        prompt: `Teacher Query: "${message}"\nRole: ${userRole}`,
        systemInstruction,
        temperature: 0.5,
      },
      fallbackGenerator
    );

    return {
      message: aiResult.content,
      isAiGenerated: aiResult.isAiGenerated,
      provider: aiResult.provider,
      modelUsed: aiResult.modelUsed,
      note: aiResult.note,
    };
  }
}

export const aiService = new AiService();
