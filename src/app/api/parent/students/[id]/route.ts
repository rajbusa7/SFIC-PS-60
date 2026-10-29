import { NextResponse } from "next/server";
import { verifySession, extractSessionToken } from "@/lib/auth/session";
import { db } from "@/lib/db/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;

    const sessionToken = await extractSessionToken(request);

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const session = await verifySession(sessionToken);
    if (!session || session.role !== "parent") {
      return NextResponse.json(
        { success: false, error: "Access denied. Parent role required." },
        { status: 403 }
      );
    }

    // Retrieve parent profile
    const parentProfile = await db.getParentByUserIdAsync(session.id);
    if (!parentProfile) {
      return NextResponse.json(
        { success: false, error: "Parent profile not found." },
        { status: 404 }
      );
    }

    // STRICT RBAC CHECK: The requested studentId must belong to this parent's authorized students
    const isAuthorized = (parentProfile.studentIds || []).includes(studentId);
    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: You are not authorized to access records for this student.",
        },
        { status: 403 }
      );
    }

    // Fetch real student information from persistent database
    const student = await db.getStudentByIdAsync(studentId);
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student record not found." },
        { status: 404 }
      );
    }

    // Fetch real assessment results
    const results = db.getResults(studentId);

    // Fetch real learning gaps
    const learningGaps = db.getLearningGaps(studentId);

    // Fetch real remedial plans
    const remedialPlans = db.getRemedialPlans(studentId);

    // Fetch school notices targeted to this student's grade or all students
    const allNotices = db.getNotices();
    const studentNotices = allNotices.filter((n) => {
      if (n.targetAudience === "all") return true;
      if (n.targetClassGrade && n.targetClassGrade === student.grade) return true;
      if (n.studentIds && n.studentIds.includes(studentId)) return true;
      return false;
    });

    // Subject breakdown calculation
    const subjectMap: Record<string, { totalScore: number; count: number; name: string }> = {};
    const subjects = db.getSubjects();
    const concepts = db.getConcepts();

    results.forEach((r: any) => {
      const concept = concepts.find((c) => c.id === r.conceptId);
      const subject = subjects.find((s) => s.id === concept?.subjectId);
      const subjectKey = subject ? subject.name : "General";

      if (!subjectMap[subjectKey]) {
        subjectMap[subjectKey] = { totalScore: 0, count: 0, name: subjectKey };
      }
      subjectMap[subjectKey].totalScore += r.percentage;
      subjectMap[subjectKey].count += 1;
    });

    const subjectBreakdown = Object.values(subjectMap).map((s) => ({
      subject: s.name,
      averagePercentage: Math.round(s.totalScore / s.count),
      assessmentsCount: s.count,
    }));

    // Fetch persistent parent activity completions
    const completions = await db.getParentActivityCompletionsAsync(studentId);
    const completedActivityIds = new Set(completions.map((c: any) => c.activityId));
    const allActivities = db.getActivities();

    // Formulate practical, parent-friendly home activities corresponding to active learning gaps
    const homeActivities = learningGaps
      .filter((gap: any) => gap.status === "Active" || gap.status === "active")
      .map((gap: any) => {
        const matchingActivity = allActivities.find((a) => a.conceptId === gap.conceptId);
        const matchingPlan = remedialPlans.find(
          (p: any) => p.conceptId === gap.conceptId || p.gapId === gap.id
        );

        const activityId = matchingActivity?.id || `home-act-${gap.id}`;
        const isCompleted = completedActivityIds.has(activityId) || completedActivityIds.has(gap.id);

        let titleEn = matchingActivity?.title || `${gap.conceptName} Home Activity`;
        let titleGu = matchingActivity?.titleGujarati || `${gap.conceptName} ઘરે મહાવરો`;
        let materialsEn = ["Paper & pencil", "Small household objects"];
        let materialsGu = ["કાગળ અને પેન્સિલ", "ઘરમાં રહેલી રોજિંદી વસ્તુઓ"];
        let steps = [
          {
            stepNumber: 1,
            instructionEn: "Sit together with your child in a quiet space for 10 minutes.",
            instructionGu: "તમારા બાળક સાથે શાંત જગ્યાએ ૧૦ મિનિટ પ્રેમપૂર્વક બેસો.",
          },
          {
            stepNumber: 2,
            instructionEn: `Discuss the core idea of ${gap.conceptName} with simple day-to-day examples.`,
            instructionGu: `રોજિંદા જીવનના સરળ ઉદાહરણોથી ${gap.conceptName} નો મૂળ વિચાર સમજાવો.`,
          },
          {
            stepNumber: 3,
            instructionEn: "Encourage your child to try 2 small practice questions on paper with your guidance.",
            instructionGu: "બાળકનો ઉત્સાહ વધારતા કાગળ પર ૨ નાના પ્રશ્નો જાતે કરાવડાવો અને શાબાશી આપો.",
          },
        ];

        if (
          gap.conceptId === "c-div-01" ||
          gap.conceptName.toLowerCase().includes("division") ||
          gap.conceptName.includes("ભાગાકાર")
        ) {
          titleEn = "Equal Sharing with Spoons & Pebbles (Division with Remainders)";
          titleGu = "સરખા ભાગ અને ચમચી/કાંકરાની રમત (ભાગાકાર અને શેષ)";
          materialsEn = ["12 spoons or pebbles", "3 small bowls or cups"];
          materialsGu = ["૧૨ ચમચી અથવા કાંકરા", "૩ નાની વાટકી"];
          steps = [
            {
              stepNumber: 1,
              instructionEn: "Give your child 12 spoons and ask to share them equally into 3 bowls (4 in each bowl).",
              instructionGu: "બાળકને ૧૨ ચમચી આપો અને ૩ વાટકીમાં સરખા ભાગે વહેંચવા કહો (દરેકમાં ૪ ચમચી).",
            },
            {
              stepNumber: 2,
              instructionEn: "Now add 1 spoon (total 13 spoons) and share into 3 bowls. Ask what happens to the 1 extra spoon.",
              instructionGu: "હવે ૧ વધારાની ચમચી (કુલ ૧૩) આપો અને ફરી ૩ વાટકીમાં વહેંચવા કહો. ૧ ચમચી વધશે.",
            },
            {
              stepNumber: 3,
              instructionEn: "Explain that the 1 leftover spoon is called the 'Remainder' (શેષ). 13 ÷ 3 = 4 with remainder 1.",
              instructionGu: "સમજાવો કે જે ચમચી બાકી વધી તેને 'શેષ' (Remainder) કહેવાય. ૧૩ ÷ ૩ = ૪ અને શેષ ૧.",
            },
          ];
        } else if (
          gap.conceptName.toLowerCase().includes("multiplication") ||
          gap.conceptName.includes("ગુણાકાર")
        ) {
          titleEn = "Grouping Buttons or Coins (Multiplication Tables)";
          titleGu = "સિક્કા કે બટનના જૂથ (ગુણાકાર ઘડિયા રમત)";
          materialsEn = ["15 coins or buttons", "Notebook paper"];
          materialsGu = ["૧૫ સિક્કા કે બટન", "નોટબુક કાગળ"];
          steps = [
            {
              stepNumber: 1,
              instructionEn: "Arrange 3 coins in 4 rows on the table. Ask child to count total coins (12).",
              instructionGu: "ટેબલ પર ૩ સિક્કાની ૪ હાર બનાવો. બાળકને કુલ સિક્કા ગણવા કહો (૧૨ સિક્કા).",
            },
            {
              stepNumber: 2,
              instructionEn: "Demonstrate that 4 groups of 3 is 4 × 3 = 12. Multiplication is repeated addition (3 + 3 + 3 + 3).",
              instructionGu: "સમજાવો કે ૪ વાર ૩ એટલે ૪ × ૩ = ૧૨. ગુણાકાર એ વારંવાર થતો સરવાળો છે.",
            },
            {
              stepNumber: 3,
              instructionEn: "Ask child to make 5 groups of 2 coins and say the multiplication sentence out loud.",
              instructionGu: "બાળકને ૨ સિક્કાના ૫ જૂથ બનાવવા કહો અને '૫ × ૨ = ૧૦' મોટેથી બોલાવો.",
            },
          ];
        } else if (
          gap.conceptName.toLowerCase().includes("vowel") ||
          gap.conceptName.includes("જોડાક્ષર") ||
          gap.conceptName.toLowerCase().includes("reading")
        ) {
          titleEn = "Paired Story Sentence Reading (Gujarati Vowel Blends)";
          titleGu = "વાર્તા વાંચન અને જોડાક્ષર ઓળખ (ગુજરાતી જોડાક્ષર)";
          materialsEn = ["Gujarati storybook or textbook", "Color pencil"];
          materialsGu = ["ગુજરાતી વાર્તાની ચોપડી અથવા પાઠ્યપુસ્તક", "રંગબેરંગી પેન્સિલ"];
          steps = [
            {
              stepNumber: 1,
              instructionEn: "Read one short paragraph aloud together slowly, pointing finger at each word.",
              instructionGu: "એક નાનો ફકરો બાળકની સાથે આંગળી મૂકીને ધીમેથી મોટેથી વાંચો.",
            },
            {
              stepNumber: 2,
              instructionEn: "Find 3 compound words (જોડાક્ષર) in the paragraph and circle them with a color pencil.",
              instructionGu: "ફકરામાંથી ૩ જોડાક્ષર વાળા શબ્દો શોધીને તેના પર પેન્સિલથી ગોળ કરાવો.",
            },
            {
              stepNumber: 3,
              instructionEn: "Ask your child to pronounce the circled words aloud twice with encouragement.",
              instructionGu: "બાળકને ગોળ કરેલા શબ્દો ૨ વાર સ્પષ્ટ ઉચ્ચાર સાથે બોલવા કહો અને શાબાશી આપો.",
            },
          ];
        } else if (matchingPlan && matchingPlan.steps && matchingPlan.steps.length > 0) {
          steps = matchingPlan.steps.slice(0, 3).map((st: any, idx: number) => ({
            stepNumber: idx + 1,
            instructionEn: st.description || st.title,
            instructionGu: st.title || `પગલું ${idx + 1}`,
          }));
        }

        return {
          id: activityId,
          gapId: gap.id,
          conceptId: gap.conceptId,
          conceptName: gap.conceptName,
          subjectCode: gap.subjectCode,
          title: titleEn,
          titleGujarati: titleGu,
          whyNeededEn: `Recent assessment score was ${gap.latestPercentage || gap.scoreRecorded || 35}%, which is below the 60% developing threshold.`,
          whyNeededGu: `છેલ્લા મૂલ્યાંકનમાં સ્કોર ${gap.latestPercentage || gap.scoreRecorded || 35}% હતો, જેથી ૬૦% મર્યાદા સુધી પહોંચવા ઘરે થોડી વધુ મદદ જરૂરી છે.`,
          estimatedMinutes: matchingActivity?.estimatedMinutes || 10,
          materialsEn,
          materialsGu,
          steps,
          completed: isCompleted,
          completedAt: completions.find((c: any) => c.activityId === activityId)?.completedAt || null,
        };
      });

    return NextResponse.json({
      success: true,
      student,
      results,
      learningGaps,
      remedialPlans,
      homeActivities,
      activityCompletions: completions,
      notices: studentNotices,
      subjectBreakdown,
      school: db.getSchool(),
    });
  } catch (error: any) {
    console.error("[Parent Student Detail API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve student records" },
      { status: 500 }
    );
  }
}
