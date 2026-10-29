import { NextResponse } from "next/server";
import { generateAiContent } from "@/lib/ai/aiProvider";
import { db } from "@/lib/db/database";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      message,
      history = [],
      language = "en",
      userRole = "teacher",
    } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "Message is required." },
        { status: 400 }
      );
    }

    const isGujarati = language === "gu";

    // Prepare safe aggregate contextual data from the school database
    // Only pedagogical summaries, strictly preserving child privacy
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
You assist primary teachers and school administrators with:
1. Teaching foundational literacy and numeracy (FLN / NIPUN Bharat aligned).
2. Remedial teaching methods and multisensory / manipulative strategies.
3. Engaging, low-cost classroom activities using local materials (seeds, bottle caps, chalk, paper folds).
4. Formative assessment design and diagnostic evaluation rubrics.
5. Worksheet design and differentiated questions for diverse learner paces.
6. Actionable interventions for students scoring in 'Needs Support' (< 60%).
7. Authorized classroom summary insights based on real-time school telemetry.

PRIVACY & SAFETY DIRECTIVES:
- Only authorized teachers and school administrators can access classroom data.
- NEVER invent or disclose sensitive personal data (biometrics, medical diagnoses, family details).
- Maintain an encouraging, evidence-driven, and supportive pedagogical tone.
${isGujarati ? "CRITICAL: Please respond in fluent, grammatically sound Gujarati (ગુજરાતી) script." : "Respond in clear, professional, warm English suitable for Indian primary education."}

CURRENT AUTHORIZED CLASSROOM TELEMETRY:
- Total Enrolled Students: ${students.length}
- Active Learning Gaps: ${activeGapsCount}
- Active Remedial Plans: ${remedialPlans.length}
- Students Requiring High-Priority Support:
${highPrioritySummary || "All current concepts are within developing or mastered thresholds."}`;

    // Format chat history context
    const recentHistory = Array.isArray(history)
      ? history.slice(-4).map((h: any) => `${h.role === "user" ? "Teacher" : "Assistant"}: ${h.content}`).join("\n")
      : "";

    const prompt = `${recentHistory ? `Previous Conversation:\n${recentHistory}\n\n` : ""}Teacher Question: "${message.trim()}"`;

    const fallbackGenerator = () => {
      const qLower = message.toLowerCase();
      let reply = "";

      if (isGujarati) {
        if (qLower.includes("gap") || qLower.includes("વિદ્યાર્થી") || qLower.includes("ત્રુટિ") || qLower.includes("સહાય") || qLower.includes("summary")) {
          reply = `નમસ્તે! વર્ગખંડના વર્તમાન મૂલ્યાંકન મુજબ:\n\n• કુલ વિદ્યાર્થીઓ: ${students.length}\n• સક્રિય શિક્ષણ ત્રુટિઓ: ${activeGapsCount}\n• તાત્કાલિક ધ્યાનની જરૂર હોય તેવા મુખ્ય મુદ્દા: ધોરણ ૪ ના વિદ્યાર્થીઓમાં **ભાગાકાર (Division Basics)** સંકલ્પનામાં મુશ્કેલી જોવા મળી છે.\n\nઆરવ પટેલ માટે મૂર્ત સાધનો (કાંકરા અને કપ) સાથેની ૫-પગલાંની ઉપચારાત્મક યોજના સફળ રહી છે અને પુનઃમૂલ્યાંકનમાં +૫૦ પોઇન્ટનો સુધારો નોંધાયો છે.\n\nશું આપ કોઈ ચોક્કસ વિષય કે સંકલ્પના માટે વર્કશીટ અથવા ઉપચાર યોજના બનાવવા માંગો છો?`;
        } else if (qLower.includes("divis") || qLower.includes("ભાગ") || qLower.includes("ગણિત")) {
          reply = `પ્રાથમિક વર્ગખંડમાં ભાગાકાર શીખવવા માટે આ ૩ પગલાં સૌથી અસરકારક રહે છે:\n\n૧. **મૂર્ત વહેંચણી:** ૧૨ કાંકરા કે ઢાંકણાં ૩ બાળકોમાં એક-એક વહેંચાવીને સમાન જૂથ બનાવો (૧૨ ÷ ૩ = ૪).\n૨. **ગુણાકાર સાથે જોડાણ:** ઘડિયા યાદ કરાવો: ૩ × ૪ = ૧૨ માટે ૧૨ ÷ ૩ = ૪ થાય.\n૩. **સંખ્યા રેખા:** પાછળ તરફ કુદકા મરાવી પુનરાવર્તિત બાદબાકી સમજાવો.\n\nઆપ 'AI વર્કશીટ જનરેટર' નો ઉપયોગ કરીને આના આધારિત પ્રેક્ટિસ પેપર પણ પ્રિન્ટ કરી શકો છો.`;
        } else {
          reply = `નમસ્તે! હું શિક્ષાસેતુ શિક્ષક સહાયક છું. હું આપને આ મુજબ સહાય કરી શકું છું:\n\n• પાયાની સંકલ્પનાઓ શીખવવાની સરળ રીતો\n• ઓછા ખર્ચે બનતાં શૈક્ષણિક સાધનો (TLM) ની માહિતી\n• નબળા વિદ્યાર્થીઓ માટે ઉપચારાત્મક પ્રવૃત્તિઓ\n• વર્કશીટ્સ અને મૂલ્યાંકન પેપર્સનું નિર્માણ\n\nઆપે કયા ધોરણ અને વિષય પર માર્ગદર્શન જોઈએ છે તે જણાવશો?`;
        }
      } else {
        if (qLower.includes("gap") || qLower.includes("student") || qLower.includes("summary") || qLower.includes("aarav") || qLower.includes("support")) {
          reply = `Hello! Based on the current authorized classroom assessment data:\n\n• **Total Enrolled Students:** ${students.length}\n• **Active Learning Gaps Flagged:** ${activeGapsCount}\n• **Key Priority Concept:** Class 4 Mathematics - *Division Basics & Equal Sharing* has the highest support need.\n• **Intervention Status:** Aarav Patel's remedial intervention using manipulative tokens successfully demonstrated a +50 percentage-point gain (improving from 35% to 85% on reassessment).\n\nWould you like me to generate a personalized practice worksheet or suggest concrete classroom TLM for any specific group?`;
        } else if (qLower.includes("divis") || qLower.includes("math") || qLower.includes("fraction") || qLower.includes("teach")) {
          reply = `Here is a proven 3-phase pedagogical sequence for primary mathematics:\n\n1. **Concrete Manipulation (5 mins):** Use 12 to 15 bottle caps or tamarind seeds. Let students physically distribute them into equal paper bowls.\n2. **Pictorial / Array Representation (5 mins):** Have students sketch dot arrays or jumps on a chalk-drawn number line.\n3. **Symbolic Fact Family Linking (5 mins):** Connect the division fact directly to its multiplication inverse (e.g., 3 × 4 = 12 ↔ 12 ÷ 3 = 4).\n\nYou can also launch our interactive **AI Worksheet Generator** to immediately print parallel practice problems!`;
        } else {
          reply = `Hello! I am your ShikshaSetu Teacher AI Assistant. I can assist you with:\n\n• **Foundational Learning Strategies:** NCERT/GCERT aligned pedagogical methods for Grades 1–5.\n• **Remedial Teaching:** Manipulative-based activities for students struggling with basic math, language, and EVS.\n• **Classroom Insights:** Summarizing your class's latest assessment scores and flagged learning gaps.\n• **Diagnostic Assessments & Worksheets:** Formulating clear practice sets and exit tickets.\n\nHow can I support your classroom today?`;
        }
      }

      return {
        content: reply,
      };
    };

    const aiResult = await generateAiContent(
      {
        prompt,
        systemInstruction,
        temperature: 0.4,
        responseFormat: "text",
      },
      fallbackGenerator
    );

    return NextResponse.json({
      success: true,
      message: aiResult.content,
      isAiGenerated: aiResult.isAiGenerated,
      provider: aiResult.provider,
      modelUsed: aiResult.modelUsed,
      note: aiResult.note,
    });
  } catch (error: any) {
    console.error("API POST /api/ai/assistant error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate AI assistant response" },
      { status: 500 }
    );
  }
}
