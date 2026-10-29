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

    // Fetch persistent parent activity completions from PostgreSQL and database store
    const completions = await db.getParentActivityCompletionsAsync(studentId);
    const completedActivityIds = new Set(completions.map((c: any) => c.activityId));
    const allActivities = db.getActivities();

    // Formulate practical, parent-friendly home activities corresponding to active learning gaps
    const homeActivities = learningGaps
      .filter((gap: any) => gap.status === "Active" || gap.status === "active" || gap.masteryStatus === "Needs Support")
      .map((gap: any) => {
        const matchingActivity = allActivities.find((a) => a.conceptId === gap.conceptId);
        const matchingPlan = remedialPlans.find(
          (p: any) => p.conceptId === gap.conceptId || (p as any).gapId === gap.id
        );

        const activityId = matchingActivity?.id || `home-act-${gap.id}`;
        const isCompleted = completedActivityIds.has(activityId) || completedActivityIds.has(gap.id);

        let titleEn = matchingActivity?.title || `${gap.conceptName} Home Activity`;
        let titleGu = matchingActivity?.titleGujarati || `${gap.conceptName} ઘરે મહાવરો`;
        let materialsEn = ["Paper & pencil", "10-20 small household items (coins, buttons, or matchsticks)"];
        let materialsGu = ["કાગળ અને પેન્સિલ", "૧૦-૨૦ રોજિંદી વસ્તુઓ (સિક્કા, બટન અથવા દિવાસળી)"];
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
          gap.conceptName?.toLowerCase().includes("division")
        ) {
          titleEn = "Equal Sharing with Household Objects";
          titleGu = "રોજિંદી વસ્તુઓ દ્વારા સરખા ભાગ કરવાની રમત";
          materialsEn = ["12-15 coins, tamarind seeds, or bottle caps", "3 small bowls or paper plates"];
          materialsGu = ["૧૨-૧૫ સિક્કા, કાચુકા અથવા ઢાંકણા", "૩ નાની વાટકીઓ અથવા કાગળની ડીશ"];
          steps = [
            {
              stepNumber: 1,
              instructionEn: "Place 12 items on the table and 3 small bowls in front of your child.",
              instructionGu: "ટેબલ પર ૧૨ વસ્તુઓ અને ૩ નાની વાટકીઓ બાળક સામે મૂકો.",
            },
            {
              stepNumber: 2,
              instructionEn: "Ask your child to distribute the 12 items equally into the 3 bowls one by one.",
              instructionGu: "બાળકને કહો કે એક પછી એક વસ્તુ વાટકીઓમાં સરખે ભાગે વહેંચે.",
            },
            {
              stepNumber: 3,
              instructionEn: "Count how many items are in each bowl (4 items) and explain that 12 ÷ 3 = 4.",
              instructionGu: "દરેક વાટકીમાં કેટલી વસ્તુઓ આવી (૪ વસ્તુઓ) તે ગણાવો અને સમજાવો કે ૧૨ ÷ ૩ = ૪ થાય.",
            },
          ];
        } else if (
          gap.conceptId === "c-mult-01" ||
          gap.conceptName?.toLowerCase().includes("multiplication")
        ) {
          titleEn = "Repeated Addition with Egg Trays or Ice Trays";
          titleGu = "આઈસ ટ્રે અથવા ગ્રીડ દ્વારા પુનરાવર્તિત સરવાળો";
          materialsEn = ["Ice cube tray or drawn grid", "Beans or small pebbles"];
          materialsGu = ["આઈસ ટ્રે અથવા કાગળ પર દોરેલા ખાના", "કઠોળના દાણા અથવા કાંકરીઓ"];
          steps = [
            {
              stepNumber: 1,
              instructionEn: "Place 3 beans in 4 different ice tray slots.",
              instructionGu: "આઈસ ટ્રેના ૪ ખાનામાં ૩-૩ કઠોળના દાણા મૂકો.",
            },
            {
              stepNumber: 2,
              instructionEn: "Help your child see that 3 + 3 + 3 + 3 = 12 is the same as 3 × 4 = 12.",
              instructionGu: "બાળકને ગણાવો કે ૩ + ૩ + ૩ + ૩ = ૧૨ એ જ ૩ × ૪ = ૧૨ થાય છે.",
            },
          ];
        } else if (matchingPlan && matchingPlan.steps && matchingPlan.steps.length > 0) {
          steps = matchingPlan.steps.slice(0, 3).map((st: any, idx: number) => ({
            stepNumber: idx + 1,
            instructionEn: st.description || st.title || `Remedial Step ${idx + 1}`,
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
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Parent Student Detail API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve student records" },
      { status: 500 }
    );
  }
}
