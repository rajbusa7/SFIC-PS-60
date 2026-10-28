import { NextResponse } from "next/server";
import { generateAiContent, AiResponse } from "@/lib/ai/aiProvider";

export interface TutorResponseData {
  topic: string;
  simpleExplanation: string;
  classroomExample: string;
  stepByStepActivity: {
    stepNumber: number;
    title: string;
    instruction: string;
    durationMinutes: number;
  }[];
  practiceQuestions: {
    questionNumber: number;
    question: string;
    options?: string[];
    answer: string;
    explanation: string;
  }[];
  teacherPedagogyTip: string;
  language: "en" | "gu";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, language = "en", grade = 4, subject = "Mathematics" } = body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { success: false, error: "Teacher query is required." },
        { status: 400 }
      );
    }

    const isGujarati = language === "gu";

    const systemInstruction = `You are StudySaathi AI Tutor, an expert primary education pedagogical specialist for schools in Gujarat, India (Grades 1 to 5).
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

    // Offline deterministic fallback generator tailored to the prompt
    const fallbackGenerator = () => {
      const qLower = query.toLowerCase();
      const isDiv = qLower.includes("divis") || qLower.includes("equal") || qLower.includes("shar") || qLower.includes("ભાગ");
      const isMult = qLower.includes("mult") || qLower.includes("table") || qLower.includes("ગુણા");
      const isFraction = qLower.includes("fract") || qLower.includes("half") || qLower.includes("અપૂર્ણાંક");

      let fallbackData: TutorResponseData;

      if (isGujarati) {
        if (isDiv) {
          fallbackData = {
            topic: "ભાગાકાર અને સમાન વહેંચણી (Division & Equal Sharing)",
            simpleExplanation: "ભાગાકાર એટલે વસ્તુઓની સમાન જૂથોમાં વહેંચણી કરવી અથવા વારંવાર એક જ સંખ્યા બાદ કરવી. જેમ કે ૧૨ લખોટી ૩ બાળકોમાં સરખે ભાગે વહેંચવી.",
            classroomExample: "વર્ગખંડમાં ૧૨ કાંકરા અથવા બોટલના ઢાંકણાં લો. ૩ વિદ્યાર્થીઓને આગળ બોલાવી દરેકને એક-એક આપતા જાઓ. અંતે દરેક પાસે ૪ કાંકરા આવશે (૧૨ ÷ ૩ = ૪).",
            stepByStepActivity: [
              { stepNumber: 1, title: "પ્રત્યક્ષ વહેંચણી (મૂર્ત અનુભવ)", instruction: "દરેક જોડીને ૧૫ બીજ કે કાંકરા આપો અને ૩-૩ ના જૂથ બનાવવા કહો.", durationMinutes: 5 },
              { stepNumber: 2, title: "ગુણાકાર સાથે સંબંધ", instruction: "બતાવો કે ૩ × ૪ = ૧૨ થાય છે, માટે ૧૨ ÷ ૩ = ૪ થાય છે.", durationMinutes: 5 },
              { stepNumber: 3, title: "નોટબુક ચિત્રકામ", instruction: "બાળકો નોટબુકમાં ગોળ દોરી તેમાં ટપકાં સમાન વહેંચીને ભાગાકાર દર્શાવે.", durationMinutes: 6 },
              { stepNumber: 4, title: "ઝડપી પુનરાવર્તન", instruction: "બાળકોને ૧૦ ÷ ૨ અને ૧૫ ÷ ૫ જેવા સાદા મૌખિક પ્રશ્નો પૂછો.", durationMinutes: 4 },
            ],
            practiceQuestions: [
              { questionNumber: 1, question: "રાજુ પાસે ૧૫ ચોકલેટ છે. તે તેના ૫ મિત્રોમાં સરખે ભાગે વહેંચે છે. દરેક મિત્રને કેટલી ચોકલેટ મળશે?", options: ["A) ૨", "B) ૩", "C) ૪", "D) ૫"], answer: "B) ૩ ચોકલેટ", explanation: "૧૫ ÷ ૫ = ૩ કારણ કે ૫ × ૩ = ૧૫." },
              { questionNumber: 2, question: "૧૮ પેન્સિલને ૬ પેકેટમાં સરખી રીતે મૂકવી હોય તો એક પેકેટમાં કેટલી પેન્સિલ આવશે?", options: ["A) ૩", "B) ૪", "C) ૨", "D) ૬"], answer: "A) ૩ પેન્સિલ", explanation: "૧૮ ÷ ૬ = ૩ કારણ કે ૬ × ૩ = ૧૮." },
              { questionNumber: 3, question: "૨૦ લાડુ ૪ થાળીમાં સરખા મૂકતાં દરેક થાળીમાં કેટલા લાડુ રહેશે?", options: ["A) ૪", "B) ૫", "C) ૬", "D) ૧૦"], answer: "B) ૫ લાડુ", explanation: "૨૦ ÷ ૪ = ૫." },
            ],
            teacherPedagogyTip: "શરૂઆતમાં સીધું ઊભું ભાગાકારનું સૂત્ર ન શીખવો. પહેલાં સમાન વહેંચણીની પ્રક્રિયા અને વારંવાર થતી બાદબાકીનો ખ્યાલ પાકો કરાવો.",
            language: "gu",
          };
        } else {
          fallbackData = {
            topic: `સંકલ્પના શિક્ષણ સહાય: Class ${grade} ${subject}`,
            simpleExplanation: "કોઈપણ નવી સંકલ્પના શીખવતી વખતે બાળકના રોજિંદા જીવન સાથે સંકળાયેલા ઉદાહરણોથી શરૂઆત કરવી સૌથી અસરકારક રહે છે.",
            classroomExample: "વર્ગખંડમાં ઉપલબ્ધ સાધનો જેમ કે ચોક, પથ્થર, પુસ્તકો અથવા આંગળીઓનો ઉપયોગ કરીને પ્રત્યક્ષ નિદર્શન કરો.",
            stepByStepActivity: [
              { stepNumber: 1, title: "પૂર્વજ્ઞાન ચકાસણી", instruction: "બાળકો આ સંકલ્પના વિશે અગાઉ શું જાણે છે તેની રસપ્રદ ચર્ચા કરો.", durationMinutes: 5 },
              { stepNumber: 2, title: "મૂર્ત સાધનોથી સમજ", instruction: "ચિત્રો અને વસ્તુઓ દ્વારા સંકલ્પના સમજાવો.", durationMinutes: 8 },
              { stepNumber: 3, title: "જોડીમાં કાર્ય", instruction: "બાળકો જોડીમાં એકબીજાને પ્રશ્નો પૂછીને શીખે તેવું વાતાવરણ બનાવો.", durationMinutes: 7 },
            ],
            practiceQuestions: [
              { questionNumber: 1, question: "આ સંકલ્પના આધારિત પાયાનો પ્રશ્ન ૧:", options: ["A) વિકલ્પ ૧", "B) સાચો વિકલ્પ", "C) વિકલ્પ ૩", "D) વિકલ્પ ૪"], answer: "B) સાચો વિકલ્પ", explanation: "સંકલ્પના નિયમ અનુસાર આ સાચો ઉત્તર છે." },
              { questionNumber: 2, question: "આ સંકલ્પના આધારિત પ્રશ્ન ૨:", options: ["A) વિકલ્પ ૧", "B) વિકલ્પ ૨", "C) સાચો જવાબ", "D) વિકલ્પ ૪"], answer: "C) સાચો જવાબ", explanation: "વિસ્તૃત શૈક્ષણિક તર્ક." },
              { questionNumber: 3, question: "વ્યવહારુ કોયડો ૩:", options: ["A) સાચો ઉત્તર", "B) વિકલ્પ ૨", "C) વિકલ્પ ૩", "D) વિકલ્પ ૪"], answer: "A) સાચો ઉત્તર", explanation: "પાયાની ગણતરી અને તર્ક." },
            ],
            teacherPedagogyTip: "બાળકો ભૂલ કરે ત્યારે તેને સુધારવાની તક ગણી સકારાત્મક પ્રોત્સાહન આપો.",
            language: "gu",
          };
        }
      } else {
        if (isDiv) {
          fallbackData = {
            topic: "Division as Equal Sharing & Repeated Subtraction",
            simpleExplanation: "Division simply means sharing a total amount equally among groups, or finding how many equal groups can be made from a total. It is the direct opposite of multiplication.",
            classroomExample: "Take 12 counting tokens or bottle caps. Call 3 students to the front and share the tokens one-by-one. Each child ends up with exactly 4 tokens, demonstrating that 12 ÷ 3 = 4.",
            stepByStepActivity: [
              { stepNumber: 1, title: "Concrete Distribution", instruction: "Give pairs of students 15 tamarind seeds/pebbles and 3 paper bowls. Ask them to distribute the seeds evenly into the bowls.", durationMinutes: 5 },
              { stepNumber: 2, title: "Connecting with Multiplication", instruction: "Write 3 × 5 = 15 on the board. Then show that 15 ÷ 3 = 5 and 15 ÷ 5 = 3. Emphasize that division 'unpacks' multiplication.", durationMinutes: 5 },
              { stepNumber: 3, title: "Repeated Subtraction Model", instruction: "Start with 12 on a number line, jump back by 3s until reaching 0. Count that 4 jumps of 3 were made.", durationMinutes: 6 },
              { stepNumber: 4, title: "Pair Story Problems", instruction: "Have students invent sharing stories (e.g. 'I had 16 marbles shared among 4 friends') and solve them.", durationMinutes: 4 },
            ],
            practiceQuestions: [
              { questionNumber: 1, question: "Raju has 15 laddus. He packs them equally into 3 boxes. How many laddus are in each box?", options: ["A) 3", "B) 4", "C) 5", "D) 6"], answer: "C) 5 laddus", explanation: "15 shared equally into 3 boxes = 15 ÷ 3 = 5 (since 3 × 5 = 15)." },
              { questionNumber: 2, question: "A teacher has 18 crayons and distributes them equally to 6 students. How many crayons does each student receive?", options: ["A) 2", "B) 3", "C) 4", "D) 6"], answer: "B) 3 crayons", explanation: "18 ÷ 6 = 3 because 6 groups of 3 make 18." },
              { questionNumber: 3, question: "Grandmother has 24 stickers. If she gives 4 stickers to each grandchild, how many grandchildren receive stickers?", options: ["A) 4", "B) 5", "C) 6", "D) 8"], answer: "C) 6 grandchildren", explanation: "24 ÷ 4 = 6. Making groups of 4 gives 6 groups." },
            ],
            teacherPedagogyTip: "Never rush into the standard long division algorithm too quickly. Ensure students firmly grasp the concept of fair sharing using physical items first.",
            language: "en",
          };
        } else if (isMult) {
          fallbackData = {
            topic: "Multiplication as Repeated Addition & Array Models",
            simpleExplanation: "Multiplication is a fast way of adding equal groups. When we say 4 × 3, it means 4 groups of 3, or 3 + 3 + 3 + 3.",
            classroomExample: "Draw an array of dots: 3 rows with 4 dots in each row. Count by rows: 4, 8, 12! The children immediately see that 3 rows of 4 equals 12.",
            stepByStepActivity: [
              { stepNumber: 1, title: "Array Building", instruction: "Students use grid paper to color rectangles representing times tables (e.g., 3 across, 4 down).", durationMinutes: 6 },
              { stepNumber: 2, title: "Skip Counting Claps", instruction: "Rhythmic clapping while skip counting by 3s or 4s to build auditory memory.", durationMinutes: 5 },
              { stepNumber: 3, title: "Flashcard Challenge", instruction: "Partner drill using visual flashcards with prompt arrays.", durationMinutes: 5 },
            ],
            practiceQuestions: [
              { questionNumber: 1, question: "Which addition sentence means the same as 4 × 5?", options: ["A) 4 + 5", "B) 5 + 5 + 5 + 5", "C) 4 + 4 + 4", "D) 5 × 5"], answer: "B) 5 + 5 + 5 + 5", explanation: "4 groups of 5 added together equals 20." },
              { questionNumber: 2, question: "There are 6 egg cartons. Each carton holds 4 eggs. How many eggs in total?", options: ["A) 10", "B) 20", "C) 24", "D) 28"], answer: "C) 24 eggs", explanation: "6 × 4 = 24 eggs." },
              { questionNumber: 3, question: "What is 7 × 3?", options: ["A) 21", "B) 24", "C) 18", "D) 27"], answer: "A) 21", explanation: "7 groups of 3 = 21." },
            ],
            teacherPedagogyTip: "Encourage students to derive unknown facts from known facts (e.g. if they know 5 × 4 = 20, 6 × 4 is just 20 + 4 = 24).",
            language: "en",
          };
        } else {
          fallbackData = {
            topic: `Pedagogical Guide: Class ${grade} ${subject}`,
            simpleExplanation: "Build from concrete hands-on models to pictorial representations, and finally to abstract symbols (CPA approach).",
            classroomExample: "Use physical classroom props, student volunteers, or local story contexts to make the concept relatable.",
            stepByStepActivity: [
              { stepNumber: 1, title: "Warm-up & Prior Knowledge", instruction: "Engage students with a relatable 3-minute story linking to the topic.", durationMinutes: 4 },
              { stepNumber: 2, title: "Guided Demonstration", instruction: "Demonstrate the core skill with student volunteers participating actively.", durationMinutes: 6 },
              { stepNumber: 3, title: "Peer Practice", instruction: "Students work in pairs to solve practice exercises on small slates or notebooks.", durationMinutes: 6 },
              { stepNumber: 4, title: "Exit Ticket Check", instruction: "Ask 2 quick questions to verify retention before wrapping up.", durationMinutes: 4 },
            ],
            practiceQuestions: [
              { questionNumber: 1, question: "Foundational Practice Question 1 for Class " + grade + ":", options: ["A) Option A", "B) Correct Option", "C) Option C", "D) Option D"], answer: "B) Correct Option", explanation: "Direct application of foundational competency." },
              { questionNumber: 2, question: "Application Question 2:", options: ["A) Option A", "B) Option B", "C) Correct Answer", "D) Option D"], answer: "C) Correct Answer", explanation: "Applies the concept to a practical everyday problem." },
              { questionNumber: 3, question: "Reasoning Question 3:", options: ["A) Correct Solution", "B) Option B", "C) Option C", "D) Option D"], answer: "A) Correct Solution", explanation: "Encourages student reflection and conceptual articulation." },
            ],
            teacherPedagogyTip: "Praise effort and specific problem-solving strategies rather than only speed or raw correctness.",
            language: "en",
          };
        }
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

    return NextResponse.json({
      success: true,
      tutorResponse: aiResult.data || JSON.parse(aiResult.content),
      isAiGenerated: aiResult.isAiGenerated,
      provider: aiResult.provider,
      modelUsed: aiResult.modelUsed,
      note: aiResult.note,
    });
  } catch (error: any) {
    console.error("API POST /api/ai/tutor error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate AI tutor response" },
      { status: 500 }
    );
  }
}
