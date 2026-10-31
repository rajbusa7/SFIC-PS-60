import type {
  RemedialPlan,
  RemedialStep,
  ReassessmentQuestion,
  SubjectCode,
} from "../types";
import type { GapDetectionResult } from "./gapDetection";

export interface ConceptCurriculumTemplate {
  conceptId: string;
  conceptName: string;
  subjectCode: SubjectCode;
  grade: number;
  learningObjective: string;
  expectedSkill: string;
  likelyMisconception: string;
  materials: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedMinutes: number;
  steps: RemedialStep[];
  teacherInstructions: string;
  studentInstructions?: string;
  reassessmentCriteria: string;
  masteryBenchmark: number;
  reassessmentQuestions: ReassessmentQuestion[];
  worksheetQuestions?: any[];
  gujarati?: {
    conceptName: string;
    learningObjective: string;
    expectedSkill: string;
    likelyMisconception: string;
    materials: string[];
    teacherInstructions: string;
    reassessmentCriteria: string;
    steps: RemedialStep[];
    reassessmentQuestions: ReassessmentQuestion[];
  };
}

export interface RemedialPlanGenerationOptions {
  studentClass?: number | string;
  studentSection?: string;
  baselineScore?: number;
  baselineEvidence?: string;
  knownMisconceptions?: string;
  conceptualErrors?: string[];
  confirmedOrInferred?: "confirmed" | "inferred";
  priorRemedialHistory?: string;
  masteryBenchmark?: number;
  isFollowUp?: boolean;
  parentPlanId?: string;
  language?: "en" | "gu";
  startDate?: string;
  targetDate?: string;
  reviewDate?: string;
}

// Built-in deterministic pedagogical templates aligned with Gujarat primary curriculum
// Every newly generated template contains EXACTLY 5 logically ordered steps:
// Step 1: Concept Review
// Step 2: Concrete Demonstration
// Step 3: Guided Practice
// Step 4: Independent Targeted Practice
// Step 5: Reassessment
export const CURRICULUM_TEMPLATES: Record<string, ConceptCurriculumTemplate> = {
  "c-div-01": {
    conceptId: "c-div-01",
    conceptName: "Division Basics & Equal Sharing",
    subjectCode: "MATH",
    grade: 4,
    learningObjective:
      "The student will correctly divide objects into equal groups, identify the quotient and remainder, and articulate division as the inverse of multiplication and repeated subtraction.",
    expectedSkill:
      "Demonstrate fluent ability to divide 2-digit numbers by 1-digit divisors using equal grouping diagrams with 80%+ accuracy without teacher assistance.",
    likelyMisconception:
      "Treating division as random subtraction or confusing divisor with dividend, and failing to distribute remainders into equal sets.",
    materials: [
      "20 physical counting tokens, pebbles, or bottle caps",
      "Equal grouping circular mats or drawing sheet",
      "Multiplication table 1-10 reference card",
      "Targeted division practice worksheet",
    ],
    difficulty: "Beginner",
    estimatedMinutes: 20,
    masteryBenchmark: 80,
    steps: [
      {
        stepNumber: 1,
        title: "STEP 1 — Concept Review: Multiplication Link & Equal Groups",
        description:
          "Review multiplication tables (2, 3, 4, 5) and clarify the inverse relationship: explain that if 3 × 4 = 12, then 12 ÷ 3 = 4 and 12 ÷ 4 = 3.",
        learningObjective: "Review prerequisite multiplication facts and understand division as inverse multiplication.",
        teacherInstructions:
          "Ask: 'If 3 friends share 12 laddus equally, how many does each get?' Write 3 × ? = 12 alongside 12 ÷ 3 = 4 on the chalkboard.",
        studentInstructions: "Recall multiplication tables 2, 3, 4, and 5. State aloud how many equal shares can be made.",
        requiredMaterials: ["Multiplication 1-10 table reference card", "Slate or notebook"],
        durationMinutes: 4,
        activityType: "discussion",
        questionsOrExercises: ["What is 4 × 3?", "If 15 ÷ 3 = 5, what multiplication fact confirms this?"],
        expectedResult: "Student verbally connects division facts to inverse multiplication without hesitation.",
        completed: false,
      },
      {
        stepNumber: 2,
        title: "STEP 2 — Concrete Demonstration: Physical Object Grouping",
        description:
          "Physically distribute 12 and 15 counting pebbles/bottle caps into 3 and 4 equal circular cups, observing fair sharing and leftovers.",
        learningObjective: "Model fair sharing and equal grouping using hands-on physical manipulatives.",
        teacherInstructions:
          "Place 12 pebbles on the desk. Direct student: 'Take 3 cups. Place 1 pebble in each cup at a time until all 12 are shared.' Note that each cup holds exactly 4 pebbles.",
        studentInstructions: "Pick up the counters and place them one-by-one into the cups so each cup has the exact same count.",
        requiredMaterials: ["15-20 counting tokens or bottle caps", "3-4 paper cups or drawn chalk circles"],
        durationMinutes: 5,
        activityType: "hands_on",
        questionsOrExercises: [
          "Share 12 tokens into 3 cups. How many in each cup?",
          "Share 14 tokens into 3 cups. How many in each cup, and how many are left over?",
        ],
        expectedResult: "Student places exactly 4 tokens per cup for 12, and identifies remainder 2 for 14 tokens.",
        completed: false,
      },
      {
        stepNumber: 3,
        title: "STEP 3 — Guided Practice: Co-Solving Equal Sharing Problems",
        description:
          "Teacher and student together solve 3 division word scenarios on paper using drawn grouping circles and step-by-step reasoning.",
        learningObjective: "Transition from concrete physical objects to semi-concrete visual grouping sketches.",
        teacherInstructions:
          "Guide the student through drawing circles for groups and tally marks for objects. Prompt: 'What is our total? How many groups must we draw?'",
        studentInstructions: "Draw the circles on paper, share the tally marks equally, and write the division number sentence.",
        requiredMaterials: ["Graph paper or notebook", "Colored pencils or crayons"],
        durationMinutes: 4,
        activityType: "guided_practice",
        questionsOrExercises: [
          "Share 16 pencils among 4 students (16 ÷ 4).",
          "Pack 18 mangoes into boxes of 6 (18 ÷ 6).",
          "Distribute 20 notebooks among 5 classrooms (20 ÷ 5).",
        ],
        expectedResult: "Student sketches visual groupings correctly and writes correct quotient for each guided problem.",
        completed: false,
      },
      {
        stepNumber: 4,
        title: "STEP 4 — Independent Targeted Practice: Structured Exercises",
        description:
          "Student independently solves 5 graded division questions using drawn representations without teacher prompting.",
        learningObjective: "Apply division concepts independently to achieve computational and conceptual fluency.",
        teacherInstructions:
          "Hand out practice sheet. Step back and observe without interrupting. Note any persistent error patterns or hesitations.",
        studentInstructions: "Read each question carefully. Draw groups if helpful, calculate your answer, and check your work.",
        requiredMaterials: ["Targeted 5-question practice worksheet", "Pencil and eraser"],
        durationMinutes: 5,
        activityType: "independent_practice",
        questionsOrExercises: [
          "Calculate 15 ÷ 3.",
          "Calculate 24 ÷ 4.",
          "Calculate 18 ÷ 2.",
          "If 20 apples are divided into 4 bags, how many in each bag?",
          "Calculate 21 ÷ 3 and verify by multiplication.",
        ],
        expectedResult: "Student independently answers at least 4 out of 5 questions accurately.",
        completed: false,
      },
      {
        stepNumber: 5,
        title: "STEP 5 — Reassessment: Formative Competency Check",
        description:
          "Administer a structured 5-question reassessment to certify independent mastery against the 80% benchmark target.",
        learningObjective: "Evaluate independent mastery of division and measure percentage-point gain from baseline.",
        teacherInstructions:
          "Administer the 5 parallel assessment questions. Record student score and verify if the student meets or exceeds the 80% mastery benchmark.",
        studentInstructions: "Answer all 5 reassessment questions independently on your worksheet.",
        requiredMaterials: ["5-question Formative Reassessment Sheet", "Teacher scoring rubric"],
        durationMinutes: 4,
        activityType: "reassessment",
        questionsOrExercises: [
          "Q1: 15 ÷ 3 = ?",
          "Q2: If 18 kites are shared equally by 6 children, how many does each get?",
          "Q3: 24 ÷ 4 = ?",
          "Q4: Which multiplication fact shows that 20 ÷ 5 = 4?",
          "Q5: Divide 16 marbles into 2 equal bowls. How many in each bowl?",
        ],
        expectedResult: "Student scores ≥ 80% (at least 4/5 questions correct) to demonstrate concept mastery.",
        completed: false,
      },
    ],
    teacherInstructions:
      "Avoid rushing to long-division algorithms immediately. Reinforce equal grouping and real-world sharing (e.g. sharing 15 laddus among 5 friends). If the student struggles, use alternative visual bar models.",
    reassessmentCriteria:
      "Student must achieve at least 80% (4 out of 5 questions correct) on the independent reassessment without teacher hints.",
    reassessmentQuestions: [
      {
        questionNumber: 1,
        question: "Divide 15 candies equally among 3 children. How many candies does each child receive?",
        options: ["3 candies", "4 candies", "5 candies", "6 candies"],
        correctAnswer: "5 candies",
        explanation: "15 ÷ 3 = 5 candies per child, because 3 × 5 = 15.",
        marks: 1,
        skillTarget: "Equal sharing with single-digit divisor",
      },
      {
        questionNumber: 2,
        question: "A teacher has 18 kites and gives an equal number to 6 students. How many kites does each student get?",
        options: ["2 kites", "3 kites", "4 kites", "5 kites"],
        correctAnswer: "3 kites",
        explanation: "18 ÷ 6 = 3 kites, because 6 × 3 = 18.",
        marks: 1,
        skillTarget: "Word problem division interpretation",
      },
      {
        questionNumber: 3,
        question: "What is 24 ÷ 4?",
        options: ["4", "5", "6", "8"],
        correctAnswer: "6",
        explanation: "24 ÷ 4 = 6, since 4 × 6 = 24.",
        marks: 1,
        skillTarget: "Direct arithmetic division fact recall",
      },
      {
        questionNumber: 4,
        question: "Which multiplication equation proves that 20 ÷ 5 = 4?",
        options: ["5 + 4 = 9", "5 × 4 = 20", "20 - 5 = 15", "20 × 4 = 80"],
        correctAnswer: "5 × 4 = 20",
        explanation: "Multiplication is the inverse of division: 5 groups of 4 equals 20.",
        marks: 1,
        skillTarget: "Multiplication-division inverse relationship",
      },
      {
        questionNumber: 5,
        question: "If 16 marbles are placed into 2 equal bowls, how many marbles are in each bowl?",
        options: ["6 marbles", "7 marbles", "8 marbles", "9 marbles"],
        correctAnswer: "8 marbles",
        explanation: "16 ÷ 2 = 8 marbles in each bowl.",
        marks: 1,
        skillTarget: "Partitioning into equal halves",
      },
    ],
    gujarati: {
      conceptName: "ભાગાકારની પાયાની સમજ અને સમાન વહેંચણી",
      learningObjective:
        "વિદ્યાર્થી વસ્તુઓની સમાન વહેંચણી દ્વારા ભાગાકાર કરતા શીખશે, ગુણાકાર અને ભાગાકાર વચ્ચેનો વ્યસ્ત સંબંધ સમજશે અને ૮૦% ગુણ સાથે નિપુણતા મેળવશે.",
      expectedSkill:
        "વિદ્યાર્થી ૧-અંકના ભાજક વડે ૨-અંકની સંખ્યાનો ભાગાકાર ચિત્રો કે મૂર્ત સાધનોથી ૮૦%+ ચોકસાઈ સાથે જાતે ઉકેલી શકે.",
      likelyMisconception:
        "ભાગાકારને સાદી બાદબાકી સમજવી અથવા ભાજ્ય અને ભાજકની અદલાબદલી કરવી.",
      materials: [
        "૧૫-૨૦ કાંકરા, બીજ અથવા બોટલના પ્લાસ્ટિક ઢાંકણાં",
        "૩-૪ કાગળના વાટકા અથવા ગોળ કુંડાળા દોરેલો ચાર્ટ",
        "૧ થી ૧૦ ના ઘડિયાનું સંદર્ભ કાર્ડ",
        "ભાગાકાર મહાવરો કાર્યપત્રક",
      ],
      teacherInstructions:
        "પ્રથમ મૂર્ત સાધનોથી સમાન વહેંચણી કરાવો. લાંબી ભાગાકાર પદ્ધતિ પર સીધા ન જાવ. બાળકને સહાનુભૂતિપૂર્વક શીખવો.",
      reassessmentCriteria:
        "વિદ્યાર્થી સ્વતંત્ર રીતે પુનઃમૂલ્યાંકન કસોટીમાં ઓછામાં ઓછા ૮૦% (૫ માંથી ૪ પ્રશ્નો) સાચા ગણે.",
      steps: [
        {
          stepNumber: 1,
          title: "પગલું ૧ — સંકલ્પના પુનરાવર્તન: ગુણાકાર અને ભાગાકારનો સંબંધ",
          description: "૨, ૩, ૪ અને ૫ ના ઘડિયા મૌખિક પુનરાવર્તિત કરાવો. ૩ × ૪ = ૧૨ હોય તો ૧૨ ÷ ૩ = ૪ થાય તે સમજાવો.",
          learningObjective: "ગુણાકાર અને ભાગાકાર વચ્ચેનો વ્યસ્ત સંબંધ યાદ કરવો.",
          teacherInstructions: "બાળકને પૂછો: 'જો ૩ મિત્રો વચ્ચે ૧૨ લાડુ સરખે ભાગે વહેંચીએ તો દરેકને કેટલા મળે?'",
          studentInstructions: "૨ થી ૫ ના ઘડિયા યાદ કરો અને ગુણાકાર પરથી ભાગાકાર બોલો.",
          requiredMaterials: ["ઘડિયા ચાર્ટ", "સ્લેટ અથવા નોટબુક"],
          durationMinutes: 4,
          activityType: "discussion",
          questionsOrExercises: ["૩ × ૫ = ?", "જો ૧૫ ÷ ૩ = ૫ થાય તો કયો ઘડિયો વપરાયો?"],
          expectedResult: "વિદ્યાર્થી ગુણાકાર અને ભાગાકારનો સંબંધ સ્પષ્ટ બોલી શકે.",
          completed: false,
        },
        {
          stepNumber: 2,
          title: "પગલું ૨ — પ્રત્યક્ષ મૂર્ત સાધનોથી સમજ: કાંકરા/ઢાંકણાંની વહેંચણી",
          description: "૧૨ અને ૧૫ કાંકરા ૩ અથવા ૪ વાટકીઓમાં સરખા ભાગે વહેંચવાનો પ્રત્યક્ષ મહાવરો કરાવો.",
          learningObjective: "મૂર્ત સાધનો દ્વારા સમાન વહેંચણીનો ખ્યાલ સ્પષ્ટ કરવો.",
          teacherInstructions: "ટેબલ પર ૧૨ કાંકરા મૂકો. ૩ વાટકીઓમાં ૧-૧ કાંકરો વારાફરતી મૂકવા કહો.",
          studentInstructions: "વાટકીઓમાં ૧-૧ કાંકરો મૂકીને દરેક વાટકીમાં કેટલા આવ્યા તે ગણો.",
          requiredMaterials: ["૧૫ કાંકરા કે પ્લાસ્ટિક ઢાંકણાં", "૩ કાગળના વાટકા"],
          durationMinutes: 5,
          activityType: "hands_on",
          questionsOrExercises: ["૧૨ કાંકરા ૩ વાટકીમાં સરખા વહેંચો.", "૧૪ કાંકરા ૩ વાટકીમાં વહેંચતા કેટલા વધે?"],
          expectedResult: "વિદ્યાર્થી ૧૨ માંથી ૪-૪ કાંકરા ગોઠવે અને ૧૪ માં શેષ ૨ ઓળખે.",
          completed: false,
        },
        {
          stepNumber: 3,
          title: "પગલું ૩ — માર્ગદર્શિત મહાવરો: નોટબુકમાં ચિત્ર દોરી ઉકેલ",
          description: "શિક્ષક અને વિદ્યાર્થી સાથે મળીને નોટબુકમાં કુંડાળા દોરી ટપકાં સમાન વહેંચીને દાખલા ગણે.",
          learningObjective: "મૂર્ત સાધનમાંથી ચિત્રાત્મક રજૂઆત તરફ પ્રગતિ કરવી.",
          teacherInstructions: "નોટબુકમાં ૩ ગોળ કુંડાળા દોરાવો અને ૧૫ ટપકાં સરખા ભાગે મૂકાવો.",
          studentInstructions: "કુંડાળા દોરી તેમાં ટપકાં સમાન ગણીને મૂકો અને ભાગાકારનું સમીકરણ લખો.",
          requiredMaterials: ["નોટબુક", "પેન્સિલ"],
          durationMinutes: 4,
          activityType: "guided_practice",
          questionsOrExercises: ["૧૬ પેન્સિલ ૪ બાળકોને આપવી (૧૬ ÷ ૪)", "૧૮ કેરી ૬ બોક્સમાં મૂકવી (૧૮ ÷ ૬)"],
          expectedResult: "વિદ્યાર્થી સાચા ચિત્રો દોરી સાચો ભાગાકાર લખે.",
          completed: false,
        },
        {
          stepNumber: 4,
          title: "પગલું ૪ — સ્વતંત્ર લક્ષિત મહાવરો: કાર્યપત્રક ઉકેલ",
          description: "વિદ્યાર્થી શિક્ષકની મદદ વિના જાતે કાર્યપત્રકના ૫ પ્રશ્નો ચિત્ર દોરી ઉકેલે.",
          learningObjective: "સ્વતંત્ર રીતે ભાગાકારના દાખલા ગણવાની ક્ષમતા કેળવવી.",
          teacherInstructions: "કાર્યપત્રક આપો અને વિદ્યાર્થી જાતે પ્રયત્ન કરે તેનું અવલોકન કરો.",
          studentInstructions: "પ્રશ્નો વાંચો, જરૂર પડે ત્યાં ચિત્ર દોરો અને જવાબ લખો.",
          requiredMaterials: ["૫-પ્રશ્નોનું કાર્યપત્રક", "પેન્સિલ"],
          durationMinutes: 5,
          activityType: "independent_practice",
          questionsOrExercises: ["૧૫ ÷ ૩", "૨૪ ÷ ૪", "૧૮ ÷ ૨", "૨૦ ÷ ૫", "૨૧ ÷ ૩"],
          expectedResult: "વિદ્યાર્થી ૫ માંથી ઓછામાં ઓછા ૪ પ્રશ્નો જાતે સાચા ગણે.",
          completed: false,
        },
        {
          stepNumber: 5,
          title: "પગલું ૫ — પુનઃમૂલ્યાંકન: સંકલ્પના નિપુણતા ચકાસણી",
          description: "૫-પ્રશ્નોની રચનાત્મક કસોટી દ્વારા ૮૦% બેન્ચમાર્ક સિદ્ધિનું મૂલ્યાંકન.",
          learningObjective: "ભાગાકારની સ્વતંત્ર નિપુણતા અને પ્રગતિ ચકાસવી.",
          teacherInstructions: "પુનઃકસોટીના ગુણ નોંધી સુધારો (+pp) ગણો.",
          studentInstructions: "બધા ૫ પ્રશ્નો ધ્યાનથી વાંચી સાચો જવાબ પસંદ કરો.",
          requiredMaterials: ["૫-પ્રશ્નોની પુનઃમૂલ્યાંકન પત્રિકા"],
          durationMinutes: 4,
          activityType: "reassessment",
          questionsOrExercises: ["પ્રશ્ન ૧ થી ૫ પુનઃમૂલ્યાંકન કસોટી"],
          expectedResult: "વિદ્યાર્થી ૮૦% કે તેથી વધુ ગુણ મેળવે.",
          completed: false,
        },
      ],
      reassessmentQuestions: [
        {
          questionNumber: 1,
          question: "૧૫ ચોકલેટ ૩ બાળકો વચ્ચે સરખે ભાગે વહેંચતા દરેકને કેટલી ચોકલેટ મળે?",
          options: ["૩ ચોકલેટ", "૪ ચોકલેટ", "૫ ચોકલેટ", "૬ ચોકલેટ"],
          correctAnswer: "૫ ચોકલેટ",
          explanation: "૧૫ ÷ ૩ = ૫ કારણ કે ૩ × ૫ = ૧૫ થાય છે.",
          marks: 1,
          skillTarget: "સમાન વહેંચણી",
        },
        {
          questionNumber: 2,
          question: "શિક્ષક પાસે ૧૮ પતંગ છે અને ૬ બાળકોને સરખી આપે છે. દરેક બાળકને કેટલી પતંગ મળે?",
          options: ["૨ પતંગ", "૩ પતંગ", "૪ પતંગ", "૫ પતંગ"],
          correctAnswer: "૩ પતંગ",
          explanation: "૧૮ ÷ ૬ = ૩ કારણ કે ૬ × ૩ = ૧૮.",
          marks: 1,
          skillTarget: "વ્યવહારુ કોયડો",
        },
        {
          questionNumber: 3,
          question: "૨૪ ÷ ૪ ની કિંમત કેટલી થાય?",
          options: ["૪", "૫", "૬", "૮"],
          correctAnswer: "૬",
          explanation: "૨૪ ÷ ૪ = ૬ કારણ કે ૪ × ૬ = ૨૪.",
          marks: 1,
          skillTarget: "સીધો ભાગાકાર",
        },
        {
          questionNumber: 4,
          question: "૨૦ ÷ ૫ = ૪ સાબિત કરતો ગુણાકાર કયો છે?",
          options: ["૫ + ૪ = ૯", "૫ × ૪ = ૨૦", "૨૦ - ૫ = ૧૫", "૨૦ × ૪ = ૮૦"],
          correctAnswer: "૫ × ૪ = ૨૦",
          explanation: "ભાગાકાર એ ગુણાકારની ઉલટી પ્રક્રિયા છે: ૫ × ૪ = ૨૦.",
          marks: 1,
          skillTarget: "વ્યસ્ત સંબંધ",
        },
        {
          questionNumber: 5,
          question: "૧૬ લખોટી ૨ વાટકીમાં સરખી મૂકતાં દરેક વાટકીમાં કેટલી લખોટી આવે?",
          options: ["૬ લખોટી", "૭ લખોટી", "૮ લખોટી", "૯ લખોટી"],
          correctAnswer: "૮ લખોટી",
          explanation: "૧૬ ÷ ૨ = ૮ લખોટી પ્રતિ વાટકી.",
          marks: 1,
          skillTarget: "અડધા ભાગ કરવા",
        },
      ],
    },
  },

  "c-mult-01": {
    conceptId: "c-mult-01",
    conceptName: "Multiplication Tables (2 to 9)",
    subjectCode: "MATH",
    grade: 3,
    learningObjective:
      "Recall multiplication facts accurately, recognize multiplication as repeated addition, and apply commutative patterns (a × b = b × a) to solve problems.",
    expectedSkill:
      "Rapid and accurate recall of multiplication facts for tables 6, 7, and 8 with at least 80% accuracy.",
    likelyMisconception:
      "Treating multiplication as isolated memorization without understanding repeated addition, or getting confused on facts like 7 × 8.",
    materials: [
      "Multiplication grid chart (10x10)",
      "Flashcards for 6, 7, and 8 times tables",
      "Grid graph paper",
      "Counters or square tiles",
    ],
    difficulty: "Intermediate",
    estimatedMinutes: 20,
    masteryBenchmark: 80,
    steps: [
      {
        stepNumber: 1,
        title: "STEP 1 — Concept Review: Repeated Addition & Grid Patterns",
        description:
          "Review multiplication as repeated addition (e.g., 4 × 3 = 3 + 3 + 3 + 3 = 12) and inspect patterns on a 10×10 grid.",
        learningObjective: "Understand multiplication as repeated addition and identify symmetry on multiplication grid.",
        teacherInstructions:
          "Show 10×10 grid chart. Point out skip counting by 5s and explain commutative property: 6 × 7 = 7 × 6 = 42.",
        studentInstructions: "Look at the 10x10 grid. Trace how numbers grow by repeated addition.",
        requiredMaterials: ["10x10 multiplication grid chart"],
        durationMinutes: 4,
        activityType: "discussion",
        questionsOrExercises: ["Show 3 × 4 as repeated addition.", "If 4 × 7 = 28, what is 7 × 4?"],
        expectedResult: "Student explains repeated addition clearly and uses commutative property.",
        completed: false,
      },
      {
        stepNumber: 2,
        title: "STEP 2 — Concrete Demonstration: Array Visualization on Grid Paper",
        description:
          "Draw rectangular arrays on grid graph paper using colored pens to represent multiplication products as rows and columns.",
        learningObjective: "Represent products using rectangular arrays (e.g. 3 rows of 6 dots = 18 dots).",
        teacherInstructions:
          "Model drawing 3 rows of 6 squares on grid paper. Count total squares together: 6, 12, 18.",
        studentInstructions: "Draw a rectangular box of 4 rows and 5 columns on grid paper and count the total boxes.",
        requiredMaterials: ["Grid paper", "Colored sketch pens"],
        durationMinutes: 4,
        activityType: "hands_on",
        questionsOrExercises: ["Draw an array for 3 × 7.", "Draw an array for 4 × 6."],
        expectedResult: "Student draws exact row-by-column arrays and determines total product accurately.",
        completed: false,
      },
      {
        stepNumber: 3,
        title: "STEP 3 — Guided Practice: Interactive Flashcard Problem Solving",
        description:
          "Teacher and student practice rapid response flashcards focusing on frequently missed facts (6×7, 7×8, 8×6, 9×6) with verbal reasoning.",
        learningObjective: "Reinforce recall speed and self-correction strategies for challenging times table facts.",
        teacherInstructions:
          "Present flashcard. If student hesitates, prompt: 'Think of 7×7 = 49, so 7×8 is 49 + 7 = 56.'",
        studentInstructions: "State the product. If unsure, use anchor facts (like 5× or 10×) to calculate quickly.",
        requiredMaterials: ["Times table flashcards"],
        durationMinutes: 4,
        activityType: "guided_practice",
        questionsOrExercises: ["7 × 8 = ?", "6 × 7 = ?", "8 × 9 = ?"],
        expectedResult: "Student solves flashcards within 5 seconds using anchor strategies.",
        completed: false,
      },
      {
        stepNumber: 4,
        title: "STEP 4 — Independent Targeted Practice: Timed Practice Sheet",
        description:
          "Student independently completes 8 times table multiplication problems on practice sheet at their own pace.",
        learningObjective: "Achieve independent calculation fluency and accuracy across single-digit multiplication.",
        teacherInstructions:
          "Observe student working. Check that they do not rely on finger-counting for every basic fact.",
        studentInstructions: "Solve all 8 problems on the worksheet carefully and check each answer.",
        requiredMaterials: ["8-problem practice sheet", "Pencil"],
        durationMinutes: 4,
        activityType: "independent_practice",
        questionsOrExercises: ["6 × 4", "7 × 3", "8 × 5", "6 × 8", "7 × 7", "9 × 4", "8 × 7", "6 × 9"],
        expectedResult: "Student completes practice with at least 80% accuracy.",
        completed: false,
      },
      {
        stepNumber: 5,
        title: "STEP 5 — Reassessment: Formative Multiplication Mastery Check",
        description:
          "Administer a structured 5-question parallel assessment to verify facts recall and certify benchmark achievement.",
        learningObjective: "Validate student mastery of multiplication facts against 80% benchmark.",
        teacherInstructions:
          "Score the 5 questions, record percentage, and determine whether student has achieved mastery.",
        studentInstructions: "Answer all 5 questions on the exit ticket.",
        requiredMaterials: ["5-question Multiplication Exit Ticket"],
        durationMinutes: 4,
        activityType: "reassessment",
        questionsOrExercises: ["Q1: 6 × 7", "Q2: 7 × 8", "Q3: 8 × 4", "Q4: Word problem", "Q5: Commutative check"],
        expectedResult: "Student achieves ≥ 80% (at least 4/5 correct).",
        completed: false,
      },
    ],
    teacherInstructions:
      "Focus on commutative property (e.g. knowing 4×7 means you also know 7×4) to reduce memory burden. Celebrate incremental improvements.",
    reassessmentCriteria:
      "Correctly answer at least 4 out of 5 single-digit multiplication questions (≥80%) within 3 minutes.",
    reassessmentQuestions: [
      {
        questionNumber: 1,
        question: "What is 7 × 8?",
        options: ["54", "56", "58", "64"],
        correctAnswer: "56",
        explanation: "7 × 8 = 56.",
        marks: 1,
        skillTarget: "Recall of 7 and 8 multiplication facts",
      },
      {
        questionNumber: 2,
        question: "What is 6 × 7?",
        options: ["36", "40", "42", "48"],
        correctAnswer: "42",
        explanation: "6 × 7 = 42.",
        marks: 1,
        skillTarget: "Recall of 6 times table",
      },
      {
        questionNumber: 3,
        question: "If a spider has 8 legs, how many legs do 4 spiders have altogether?",
        options: ["24 legs", "28 legs", "32 legs", "36 legs"],
        correctAnswer: "32 legs",
        explanation: "4 × 8 = 32 legs.",
        marks: 1,
        skillTarget: "Multiplication word problem application",
      },
      {
        questionNumber: 4,
        question: "If 8 × 6 = 48, what is 6 × 8?",
        options: ["42", "46", "48", "54"],
        correctAnswer: "48",
        explanation: "By the commutative property of multiplication, 6 × 8 = 8 × 6 = 48.",
        marks: 1,
        skillTarget: "Commutative property understanding",
      },
      {
        questionNumber: 5,
        question: "What is 9 × 5?",
        options: ["40", "45", "50", "55"],
        correctAnswer: "45",
        explanation: "9 × 5 = 45.",
        marks: 1,
        skillTarget: "Multiplication by 5 and 9 facts",
      },
    ],
  },

  "c-place-01": {
    conceptId: "c-place-01",
    conceptName: "Place Value & 3-Digit Addition",
    subjectCode: "MATH",
    grade: 3,
    learningObjective:
      "Decompose 3-digit numbers into Hundreds, Tens, and Ones, and execute addition with regrouping accurately.",
    expectedSkill:
      "Accurately calculate 3-digit addition with carrying/regrouping over tens and hundreds with ≥80% accuracy.",
    likelyMisconception:
      "Adding columns from left to right or forgetting to add the carried-over ten or hundred into the next column.",
    materials: [
      "Base-10 block representations or bundle sticks",
      "Place value H-T-O chart",
      "Colored sketch pens for carry marks",
    ],
    difficulty: "Beginner",
    estimatedMinutes: 20,
    masteryBenchmark: 80,
    steps: [
      {
        stepNumber: 1,
        title: "STEP 1 — Concept Review: Place Value Column Structure (H-T-O)",
        description: "Review Hundreds, Tens, and Ones place value columns and decomposition of numbers like 248.",
        learningObjective: "Deconstruct 3-digit numbers into Hundreds, Tens, and Ones.",
        teacherInstructions: "Draw H-T-O columns. Demonstrate that 10 Ones regroup into 1 Ten, and 10 Tens regroup into 1 Hundred.",
        studentInstructions: "Say the value of each digit in 357 (3 hundreds, 5 tens, 7 ones).",
        requiredMaterials: ["Place value chart", "Chalkboard"],
        durationMinutes: 4,
        activityType: "instructional",
        questionsOrExercises: ["In 482, what is the place value of 8?", "How many tens are in 60?"],
        expectedResult: "Student identifies place values correctly.",
        completed: false,
      },
      {
        stepNumber: 2,
        title: "STEP 2 — Concrete Demonstration: Regrouping with Base-10 Blocks",
        description: "Model 2-digit and 3-digit addition using physical bundle sticks or base-10 block models.",
        learningObjective: "Physically execute trading 10 ones for 1 ten block.",
        teacherInstructions: "Combine 7 ones and 5 ones = 12 ones. Trade 10 ones for 1 ten block, leaving 2 ones in the ones place.",
        studentInstructions: "Hold the blocks, count to 10 ones, and swap them with the teacher for 1 ten bar.",
        requiredMaterials: ["Base-10 blocks or bundled matchsticks"],
        durationMinutes: 5,
        activityType: "hands_on",
        questionsOrExercises: ["Combine 8 ones and 6 ones. What do you trade?"],
        expectedResult: "Student executes trade physically and places 1 ten in tens column.",
        completed: false,
      },
      {
        stepNumber: 3,
        title: "STEP 3 — Guided Practice: Co-Solving with Colored Carry Marks",
        description: "Work through 2 examples on paper with explicit carry-over marks in colored ink.",
        learningObjective: "Record regrouping notation accurately above the tens and hundreds columns.",
        teacherInstructions: "Solve 248 + 175 together. Use green ink for carried-over digits: 8 + 5 = 13 (write 3, carry 1).",
        studentInstructions: "Write the problem in columns and circle the carry-over digit in color.",
        requiredMaterials: ["Notebook", "Colored pens"],
        durationMinutes: 4,
        activityType: "guided_practice",
        questionsOrExercises: ["Solve 156 + 128 together.", "Solve 247 + 135 together."],
        expectedResult: "Student remembers to add the carried-over digit to the tens column.",
        completed: false,
      },
      {
        stepNumber: 4,
        title: "STEP 4 — Independent Targeted Practice: 4 Practice Problems",
        description: "Student completes 4 regrouping problems independently at their own pace.",
        learningObjective: "Independently execute addition with regrouping across columns.",
        teacherInstructions: "Monitor column alignment and ensure student starts adding from right (Ones column) to left.",
        studentInstructions: "Start from the Ones column, carry over when sum is 10 or more, and check your work.",
        requiredMaterials: ["Practice worksheet"],
        durationMinutes: 4,
        activityType: "independent_practice",
        questionsOrExercises: ["238 + 145", "364 + 219", "457 + 238", "183 + 249"],
        expectedResult: "Student solves at least 3 of 4 problems accurately.",
        completed: false,
      },
      {
        stepNumber: 5,
        title: "STEP 5 — Reassessment: Formative 3-Digit Addition Check",
        description: "Administer 5-question formative assessment to certify place value addition mastery.",
        learningObjective: "Demonstrate ≥80% accuracy on 3-digit regrouping assessment.",
        teacherInstructions: "Score the 5 problems and record mastery status.",
        studentInstructions: "Calculate all 5 problems carefully on your test paper.",
        requiredMaterials: ["5-question assessment sheet"],
        durationMinutes: 3,
        activityType: "reassessment",
        questionsOrExercises: ["5-question addition diagnostic"],
        expectedResult: "Student achieves ≥ 80% (4 out of 5 correct).",
        completed: false,
      },
    ],
    teacherInstructions:
      "Watch for students adding left-to-right or forgetting to add the carried-over digit. Use colored pens to make carry marks prominent.",
    reassessmentCriteria:
      "Accurately calculate at least 4 out of 5 three-digit addition problems with regrouping (≥80%).",
    reassessmentQuestions: [
      {
        questionNumber: 1,
        question: "Calculate: 248 + 135",
        options: ["373", "383", "382", "375"],
        correctAnswer: "383",
        explanation: "8 + 5 = 13 (write 3, carry 1). 1 + 4 + 3 = 8. 2 + 1 = 3. Total: 383.",
        marks: 1,
        skillTarget: "Regrouping ones to tens",
      },
      {
        questionNumber: 2,
        question: "Calculate: 167 + 252",
        options: ["419", "418", "429", "409"],
        correctAnswer: "419",
        explanation: "7 + 2 = 9. 6 + 5 = 11 (write 1, carry 1). 1 + 1 + 2 = 4. Total: 419.",
        marks: 1,
        skillTarget: "Regrouping tens to hundreds",
      },
      {
        questionNumber: 3,
        question: "What is the place value of the digit 7 in the number 472?",
        options: ["7", "70", "700", "7000"],
        correctAnswer: "70",
        explanation: "In 472, the digit 7 is in the Tens place, so its value is 7 × 10 = 70.",
        marks: 1,
        skillTarget: "Place value identification",
      },
      {
        questionNumber: 4,
        question: "A village library has 328 Gujarati books and 147 English books. How many books in total?",
        options: ["465 books", "475 books", "476 books", "485 books"],
        correctAnswer: "475 books",
        explanation: "328 + 147 = 475 books (8+7=15, carry 1; 1+2+4=7; 3+1=4).",
        marks: 1,
        skillTarget: "Addition word problem with regrouping",
      },
      {
        questionNumber: 5,
        question: "Calculate: 356 + 189",
        options: ["535", "545", "546", "555"],
        correctAnswer: "545",
        explanation: "6 + 9 = 15 (write 5, carry 1). 1 + 5 + 8 = 14 (write 4, carry 1). 1 + 3 + 1 = 5. Total: 545.",
        marks: 1,
        skillTarget: "Double regrouping across tens and hundreds",
      },
    ],
  },

  "c-eng-blend-01": {
    conceptId: "c-eng-blend-01",
    conceptName: "Phonetic Blends (ch, sh, th, wh)",
    subjectCode: "ENG",
    grade: 2,
    learningObjective:
      "Identify, articulate, and decode consonant digraphs /ch/, /sh/, /th/, and /wh/ in spoken and written words.",
    expectedSkill:
      "Accurately read and spell words containing target digraphs with ≥80% accuracy.",
    likelyMisconception:
      "Sounding out letters individually (e.g. pronouncing /s/ and /h/ separately) rather than blending into a single digraph sound.",
    materials: ["Phonics flashcards with pictures", "Small whiteboard or slate", "Word blend cards"],
    difficulty: "Beginner",
    estimatedMinutes: 20,
    masteryBenchmark: 80,
    steps: [
      {
        stepNumber: 1,
        title: "STEP 1 — Concept Review: Digraph Sound Association",
        description: "Demonstrate mouth positions for 'sh' (quiet finger over lips) and 'ch' (train chug sound).",
        learningObjective: "Recognize that two letters combine to make one distinct sound.",
        teacherInstructions: "Demonstrate mouth position exaggeratedly. Say /sh/ like calming a baby, /ch/ like a train.",
        studentInstructions: "Put finger to lips and make the /sh/ sound, then mimic train /ch-ch-ch/ sound.",
        requiredMaterials: ["Phonics sound chart"],
        durationMinutes: 4,
        activityType: "phonics_drill",
        questionsOrExercises: ["Which letters make the quiet /sh/ sound?", "Which letters make the /ch/ sound?"],
        expectedResult: "Student articulates /sh/ and /ch/ correctly without letter separation.",
        completed: false,
      },
      {
        stepNumber: 2,
        title: "STEP 2 — Concrete Demonstration: Picture-to-Blend Matching",
        description: "Physically match picture cards (ship, chair, thumb, whale) to corresponding blend cards.",
        learningObjective: "Associate visual objects with target starting digraph sounds.",
        teacherInstructions: "Lay out pictures of ship, chair, thumb, whale. Student places the correct blend card onto each picture.",
        studentInstructions: "Pick up the blend card 'sh' and place it on the picture of the ship.",
        requiredMaterials: ["Picture cards: ship, chair, thumb, whale, fish, bench"],
        durationMinutes: 4,
        activityType: "matching_game",
        questionsOrExercises: ["Match 'ch' to chair.", "Match 'th' to thumb."],
        expectedResult: "Student matches all 4 blends to correct pictures.",
        completed: false,
      },
      {
        stepNumber: 3,
        title: "STEP 3 — Guided Practice: Choral Reading and Sentence Framing",
        description: "Teacher and student read aloud 5 decodable sentences containing target blends together.",
        learningObjective: "Decode words containing target blends inside contextual sentences.",
        teacherInstructions: "Read sentence pointing to each word. Emphasize target blend: 'The *sh*ip has a *ch*air.'",
        studentInstructions: "Follow teacher's finger and read aloud with clear pronunciation.",
        requiredMaterials: ["Decodable sentence strips"],
        durationMinutes: 4,
        activityType: "guided_reading",
        questionsOrExercises: ["Read: 'The fish is in the dish.'", "Read: 'Chad has a thick book.'"],
        expectedResult: "Student reads decodable sentences with correct phoneme articulation.",
        completed: false,
      },
      {
        stepNumber: 4,
        title: "STEP 4 — Independent Targeted Practice: Slate Dictation & Reading",
        description: "Dictate 5 simple words for student to spell on their slate independently.",
        learningObjective: "Encode spoken digraphs into accurate written spelling.",
        teacherInstructions: "Pronounce words clearly: 'shop', 'chin', 'that', 'whip', 'bath'. Check spelling.",
        studentInstructions: "Listen carefully, isolate the digraph sound, and write the word on your slate.",
        requiredMaterials: ["Slate and chalk or notebook"],
        durationMinutes: 4,
        activityType: "independent_practice",
        questionsOrExercises: ["Spell: shop", "Spell: chin", "Spell: that"],
        expectedResult: "Student spells at least 4 out of 5 words accurately.",
        completed: false,
      },
      {
        stepNumber: 5,
        title: "STEP 5 — Reassessment: Digraph Reading and Recognition Check",
        description: "Administer a 5-question formative assessment to certify digraph decoding mastery.",
        learningObjective: "Verify ≥80% accuracy on reading and identifying target blends.",
        teacherInstructions: "Score the 5-item exit test and record score gain.",
        studentInstructions: "Choose the correct blend and read the target words.",
        requiredMaterials: ["5-item Digraph Reassessment sheet"],
        durationMinutes: 4,
        activityType: "reassessment",
        questionsOrExercises: ["5-item formative digraph assessment"],
        expectedResult: "Student achieves ≥ 80% (at least 4/5 correct).",
        completed: false,
      },
    ],
    teacherInstructions:
      "Keep sessions lively and playful. Encourage exaggerated phonetic pronunciation. Reinforce the difference between /sh/ and /ch/.",
    reassessmentCriteria:
      "Student correctly reads and identifies at least 4 out of 5 words (≥80%) containing the target digraphs.",
    reassessmentQuestions: [
      {
        questionNumber: 1,
        question: "Which blend completes the word for an object you sit on: '___air'?",
        options: ["sh", "ch", "th", "wh"],
        correctAnswer: "ch",
        explanation: "'ch' + 'air' = 'chair'.",
        marks: 1,
        skillTarget: "Initial /ch/ blend identification",
      },
      {
        questionNumber: 2,
        question: "Which blend completes the word for a sea vessel: '___ip'?",
        options: ["ch", "sh", "th", "wh"],
        correctAnswer: "sh",
        explanation: "'sh' + 'ip' = 'ship'.",
        marks: 1,
        skillTarget: "Initial /sh/ blend identification",
      },
      {
        questionNumber: 3,
        question: "Which word ends with the /th/ sound?",
        options: ["bath", "back", "bell", "bank"],
        correctAnswer: "bath",
        explanation: "'bath' ends with the /th/ sound.",
        marks: 1,
        skillTarget: "Ending /th/ blend recognition",
      },
      {
        questionNumber: 4,
        question: "What sound does the word 'whale' start with?",
        options: ["/sh/", "/ch/", "/wh/", "/th/"],
        correctAnswer: "/wh/",
        explanation: "'whale' starts with the /wh/ digraph.",
        marks: 1,
        skillTarget: "Initial /wh/ digraph sound recognition",
      },
      {
        questionNumber: 5,
        question: "Read the sentence: 'She put the dish on the shelf.' How many words start with or contain 'sh'?",
        options: ["1 word", "2 words", "3 words", "4 words"],
        correctAnswer: "3 words",
        explanation: "There are 3 words: 'She', 'dish', and 'shelf'.",
        marks: 1,
        skillTarget: "Digraph word identification in context",
      },
    ],
  },

  "c-eng-comp-01": {
    conceptId: "c-eng-comp-01",
    conceptName: "Short Passage Reading Comprehension",
    subjectCode: "ENG",
    grade: 4,
    learningObjective:
      "Read an age-appropriate 60-word passage and locate explicit text evidence to accurately answer Who, What, Where, and Why questions.",
    expectedSkill:
      "Demonstrate reading comprehension by citing text evidence and answering factual questions with ≥80% accuracy.",
    likelyMisconception:
      "Guessing answers based on personal experience without looking back at the provided passage for explicit evidence.",
    materials: ["Illustrated short passage sheet", "Highlighter pen or color crayon", "Question strip"],
    difficulty: "Intermediate",
    estimatedMinutes: 20,
    masteryBenchmark: 80,
    steps: [
      {
        stepNumber: 1,
        title: "STEP 1 — Concept Review: Guided Pre-Reading & Text Lookback",
        description: "Teach the 'text-lookback' strategy: show that the text always holds the secret clues to the questions.",
        learningObjective: "Understand that comprehension questions are answered directly using clues in the text.",
        teacherInstructions: "Read title and inspect picture together. Ask: 'What do you think will happen in this story?'",
        studentInstructions: "Look at the picture and predict what the passage is about.",
        requiredMaterials: ["Illustrated short passage"],
        durationMinutes: 4,
        activityType: "pre_reading",
        questionsOrExercises: ["Who is shown in the picture?", "What place is this?"],
        expectedResult: "Student identifies character and setting predictions accurately.",
        completed: false,
      },
      {
        stepNumber: 2,
        title: "STEP 2 — Concrete Demonstration: Text Evidence Highlighting",
        description: "Teacher models highlighting keywords in the story that directly answer the 'Where' and 'Who' questions.",
        learningObjective: "Locate and highlight explicit keywords in a short passage.",
        teacherInstructions: "Read aloud: 'Aarav went to the river at 5 o'clock.' Highlight 'river' with a yellow crayon.",
        studentInstructions: "Use your crayon to underline where Aarav went.",
        requiredMaterials: ["Highlighter crayon", "Passage text"],
        durationMinutes: 4,
        activityType: "hands_on",
        questionsOrExercises: ["Highlight where the dog was sleeping.", "Highlight who found the red ball."],
        expectedResult: "Student underlines the exact sentence containing the factual clue.",
        completed: false,
      },
      {
        stepNumber: 3,
        title: "STEP 3 — Guided Practice: Question-to-Clue Matching",
        description: "Teacher and student together solve 2 comprehension questions by matching question words to passage text.",
        learningObjective: "Match question keywords ('Who', 'Where', 'What') to text evidence.",
        teacherInstructions: "Ask: 'Where did the cat climb?' Guide student to locate 'climbed up the mango tree' in the text.",
        studentInstructions: "Point your finger to the word in the story before writing your answer.",
        requiredMaterials: ["Passage worksheet"],
        durationMinutes: 4,
        activityType: "guided_practice",
        questionsOrExercises: ["Where did the cat climb?", "What color was the kite?"],
        expectedResult: "Student writes short, accurate factual answers based on evidence.",
        completed: false,
      },
      {
        stepNumber: 4,
        title: "STEP 4 — Independent Targeted Practice: 3 Comprehension Questions",
        description: "Student independently reads a fresh 40-word paragraph and answers 3 factual questions.",
        learningObjective: "Independently extract information from text to answer factual questions.",
        teacherInstructions: "Encourage student to read the story twice before writing answers.",
        studentInstructions: "Read the story carefully, underline your evidence, and write your answers.",
        requiredMaterials: ["Independent practice passage sheet"],
        durationMinutes: 4,
        activityType: "independent_practice",
        questionsOrExercises: ["Who visited the village?", "What did they bring?", "Where did they sit?"],
        expectedResult: "Student answers all 3 questions correctly using text clues.",
        completed: false,
      },
      {
        stepNumber: 5,
        title: "STEP 5 — Reassessment: 5-Question Reading Comprehension Check",
        description: "Administer a 5-question parallel assessment on a new short passage to certify mastery.",
        learningObjective: "Achieve ≥80% on factual and inference comprehension questions.",
        teacherInstructions: "Score the 5 questions, record percentage gain, and determine benchmark status.",
        studentInstructions: "Read the final passage and answer the 5 questions.",
        requiredMaterials: ["5-question Formative Comprehension Sheet"],
        durationMinutes: 4,
        activityType: "reassessment",
        questionsOrExercises: ["5 comprehension questions"],
        expectedResult: "Student scores ≥ 80% (at least 4/5 correct).",
        completed: false,
      },
    ],
    teacherInstructions:
      "Teach the 'text-lookback' strategy so students understand they can refer back to the story instead of guessing.",
    reassessmentCriteria:
      "Correctly answer at least 4 out of 5 factual and vocabulary questions (≥80%) on a short parallel passage.",
    reassessmentQuestions: [
      {
        questionNumber: 1,
        question: "Read the passage: 'Meera has a little white rabbit named Moti. Every morning, Meera feeds Moti fresh green carrots in the garden.' Who is Moti?",
        options: ["A little white rabbit", "A puppy", "A brown kitten", "A bird"],
        correctAnswer: "A little white rabbit",
        explanation: "The text explicitly states: 'Moti is a little white rabbit'.",
        marks: 1,
        skillTarget: "Explicit factual identification (Who)",
      },
      {
        questionNumber: 2,
        question: "What does Meera feed Moti every morning?",
        options: ["Dry biscuits", "Fresh green carrots", "Warm milk", "Ripe bananas"],
        correctAnswer: "Fresh green carrots",
        explanation: "The passage states she feeds Moti 'fresh green carrots'.",
        marks: 1,
        skillTarget: "Explicit factual detail (What)",
      },
      {
        questionNumber: 3,
        question: "Where does Meera feed Moti?",
        options: ["On the roof", "Inside the kitchen", "In the garden", "At the school"],
        correctAnswer: "In the garden",
        explanation: "The text says 'in the garden'.",
        marks: 1,
        skillTarget: "Setting identification (Where)",
      },
      {
        questionNumber: 4,
        question: "When does Meera feed Moti?",
        options: ["Every morning", "Only on Sundays", "At midnight", "In the afternoon"],
        correctAnswer: "Every morning",
        explanation: "The text says 'Every morning, Meera feeds Moti'.",
        marks: 1,
        skillTarget: "Time identification (When)",
      },
      {
        questionNumber: 5,
        question: "Which word in the passage means 'not stale or old'?",
        options: ["Little", "White", "Fresh", "Green"],
        correctAnswer: "Fresh",
        explanation: "'Fresh' means newly harvested, not stale.",
        marks: 1,
        skillTarget: "Contextual vocabulary understanding",
      },
    ],
  },

  "c-guj-matra-01": {
    conceptId: "c-guj-matra-01",
    conceptName: "ગુજરાતી કાનો-માત્રા અને દીર્ઘ-હ્રસ્વ સ્વર ચિહ્નો (Gujarati Matras)",
    subjectCode: "GUJ",
    grade: 3,
    learningObjective:
      "કાનો (ા), હ્રસ્વ ઇ (િ), દીર્ઘ ઈ (ી), અને માત્રા (ે) ના સાચા ઉચ્ચારણ, ઓળખ અને લેખનનું જ્ઞાન મેળવવું.",
    expectedSkill:
      "વિદ્યાર્થી શબ્દોમાં યોગ્ય માત્રા ઓળખી, ઉચ્ચારી અને ૮૦%+ શુદ્ધતા સાથે લખી શકે.",
    likelyMisconception:
      "હ્રસ્વ (િ) અને દીર્ઘ (ી) વચ્ચેનો ઉચ્ચારણ ભેદ ન સમજવો અથવા લેખનમાં ઊલટી માત્રા કરવી.",
    materials: ["ગુજરાતી બાળપોથી ચાર્ટ", "માત્રા કાર્ડ્સ (ા, િ, ી, ે)", "નોટબુક અને પેન્સિલ", "શબ્દ નિર્માણ સ્લેટ"],
    difficulty: "Beginner",
    estimatedMinutes: 20,
    masteryBenchmark: 80,
    steps: [
      {
        stepNumber: 1,
        title: "પગલું ૧ — સંકલ્પના પુનરાવર્તન: માત્રા ઉચ્ચારણ પરિચય",
        description: "ક + ા = કા, ક + િ = કિ, ક + ી = કી, ક + ે = કે વચ્ચેનો સ્પષ્ટ ઉચ્ચારણ ભેદ સમજાવવો.",
        learningObjective: "હ્રસ્વ અને દીર્ઘ માત્રાના ઉચ્ચારણનો સમય લંબાઈ ભેદ સમજવો.",
        teacherInstructions: "મોટેથી ઉચ્ચારણ કરી બતાવો: 'કિ' ટૂંકું બોલાય છે, જ્યારે 'કી' લંબાવીને બોલાય છે.",
        studentInstructions: "શિક્ષક સાથે 'કિ' અને 'કી' નું મોટેથી ઉચ્ચારણ કરો.",
        requiredMaterials: ["માત્રા ઉચ્ચારણ ચાર્ટ"],
        durationMinutes: 4,
        activityType: "pronunciation",
        questionsOrExercises: ["ક + ા શું બને?", "દ + ી શું બને?"],
        expectedResult: "વિદ્યાર્થી હ્રસ્વ અને દીર્ઘનો ઉચ્ચારણ ભેદ બતાવે.",
        completed: false,
      },
      {
        stepNumber: 2,
        title: "પગલું ૨ — પ્રત્યક્ષ મૂર્ત સાધનોથી સમજ: માત્રા કાર્ડ્સ જોડાણ",
        description: "ભૌતિક માત્રા કાર્ડ્સ (ા, િ, ી, ે) ને મૂળાક્ષર કાર્ડ્સ સાથે જોડી શબ્દો બનાવવાની રમત.",
        learningObjective: "મૂળાક્ષર સાથે ભૌતિક માત્રા કાર્ડ જોડી સાચો શબ્દ બનાવવો.",
        teacherInstructions: "વિદ્યાર્થીને 'દ' અને 'વ' આપો. 'ી' અને 'ો' કાર્ડ મૂકી 'દીવો' શબ્દ બનાવડાવો.",
        studentInstructions: "કાર્ડ જોડીને 'કાતર' અને 'દીવો' શબ્દ બનાવો.",
        requiredMaterials: ["લાકડાના કે પૂંઠાના માત્રા કાર્ડ્સ"],
        durationMinutes: 4,
        activityType: "hands_on",
        questionsOrExercises: ["'મ' ને કાનો લગાવો.", "'ગ' ને દીર્ઘ ઈ લગાવો."],
        expectedResult: "વિદ્યાર્થી સાચા કાર્ડ જોડી શબ્દ નિર્માણ કરે.",
        completed: false,
      },
      {
        stepNumber: 3,
        title: "પગલું ૩ — માર્ગદર્શિત મહાવરો: ખાલી જગ્યામાં સાચી માત્રા પૂરવી",
        description: "શિક્ષક અને વિદ્યાર્થી સાથે મળીને ૫ શબ્દોમાં ખૂટતી માત્રા મૂકીને સાચા શબ્દો બનાવે.",
        learningObjective: "શબ્દ સંદર્ભ પ્રમાણે સાચી માત્રા પસંદ કરવી.",
        teacherInstructions: "બોર્ડ પર 'દ_વ_' લખો. પૂછો: 'દીવો લખવા કઈ માત્રા જોઈએ?'",
        studentInstructions: "ખાલી જગ્યામાં સાચી માત્રા મૂકી શબ્દ મોટેથી વાંચો.",
        requiredMaterials: ["નોટબુક", "પેન્સિલ"],
        durationMinutes: 4,
        activityType: "guided_practice",
        questionsOrExercises: ["ક_તર (કાતર)", "ક_ળું (કેળું)"],
        expectedResult: "વિદ્યાર્થી યોગ્ય માત્રા ઓળખીને લખે.",
        completed: false,
      },
      {
        stepNumber: 4,
        title: "પગલું ૪ — સ્વતંત્ર લક્ષિત મહાવરો: શબ્દ લેખન અને વાચન",
        description: "વિદ્યાર્થી સ્વતંત્ર રીતે ૫ નવા શબ્દોમાં સાચી માત્રા ઓળખી નોટબુકમાં લખે.",
        learningObjective: "સ્વતંત્ર રીતે માત્રા વાળા શબ્દો વાંચવા અને લખવા.",
        teacherInstructions: "વિદ્યાર્થીની નોટબુકમાં ધ્યાન આપો કે હ્રસ્વ કે દીર્ઘમાં ભૂલ ન થાય.",
        studentInstructions: "૫ શબ્દો સુંદર અક્ષરે લખો અને શિક્ષકને વાંચી સંભળાવો.",
        requiredMaterials: ["કાર્યપત્રક"],
        durationMinutes: 4,
        activityType: "independent_practice",
        questionsOrExercises: ["કાતર, પાણી, કેરી, ચકલી, ખિસકોલી"],
        expectedResult: "વિદ્યાર્થી ૫ માંથી ઓછામાં ઓછા ૪ શબ્દો સાચા લખે.",
        completed: false,
      },
      {
        stepNumber: 5,
        title: "પગલું ૫ — પુનઃમૂલ્યાંકન: ૫-પ્રશ્નોની માત્રા કસોટી",
        description: "૫-પ્રશ્નોની સ્વતંત્ર કસોટી દ્વારા ૮૦% બેન્ચમાર્ક સિદ્ધિનું મૂલ્યાંકન.",
        learningObjective: "ગુજરાતી માત્રા જ્ઞાનમાં ૮૦% નિપુણતા પ્રમાણિત કરવી.",
        teacherInstructions: "૫ પ્રશ્નો ચકાસી પરિણામ નોંધો.",
        studentInstructions: "પ્રશ્નો ધ્યાનથી વાંચી સાચો વિકલ્પ પસંદ કરો.",
        requiredMaterials: ["૫-પ્રશ્નોની મૂલ્યાંકન પત્રિકા"],
        durationMinutes: 4,
        activityType: "reassessment",
        questionsOrExercises: ["૫ પ્રશ્નોની પુનઃકસોટી"],
        expectedResult: "વિદ્યાર્થી ૮૦% (૪/૫) ગુણ મેળવે.",
        completed: false,
      },
    ],
    teacherInstructions:
      "હ્રસ્વ અને દીર્ઘ વચ્ચેનો સમય લંબાઈનો ભેદ બોલીને બતાવો. બાળકને ભૂલો પર ડરાવવાને બદલે પ્રોત્સાહિત કરો.",
    reassessmentCriteria:
      "વિદ્યાર્થી ૫ પ્રશ્નોમાંથી ઓછામાં ઓછા ૪ પ્રશ્નોમાં (≥૮૦%) યોગ્ય માત્રા લખી અને વાંચી શકે.",
    reassessmentQuestions: [
      {
        questionNumber: 1,
        question: "'પાણી' શબ્દમાં 'ણ' ને કઈ માત્રા લાગેલી છે?",
        options: ["કાનો (ા)", "હ્રસ્વ ઇ (િ)", "દીર્ઘ ઈ (ી)", "એક માત્ર (ે)"],
        correctAnswer: "દીર્ઘ ઈ (ી)",
        explanation: "'પાણી' માં 'ણ' સાથે દીર્ઘ ઈ (ી) વપરાય છે.",
        marks: 1,
        skillTarget: "દીર્ઘ ઈ માત્રા ઓળખ",
      },
      {
        questionNumber: 2,
        question: "'કેળું' શબ્દમાં 'ક' પર કઈ માત્રા આવે છે?",
        options: ["કાનો (ા)", "એક માત્ર (ે)", "હ્રસ્વ ઇ (િ)", "અનુસ્વાર"],
        correctAnswer: "એક માત્ર (ે)",
        explanation: "'ક' પર એક માત્રા (ે) મૂકવાથી 'કે' બને છે.",
        marks: 1,
        skillTarget: "એક માત્રા ઓળખ",
      },
      {
        questionNumber: 3,
        question: "નીચેનામાંથી કયો શબ્દ સાચી જોડણીવાળો છે?",
        options: ["દિવાળી", "દિવાળિ", "દીવાળી", "દિવળી"],
        correctAnswer: "દિવાળી",
        explanation: "'દિવાળી' માં દ ને હ્રસ્વ ઇ અને ળ ને દીર્ઘ ઈ લાગે છે.",
        marks: 1,
        skillTarget: "સાચી જોડણી ઓળખ",
      },
      {
        questionNumber: 4,
        question: "કાપડ કાપવા માટે વપરાતા સાધનનું નામ શું છે?",
        options: ["કાતર", "કતર", "કીતર", "કેતર"],
        correctAnswer: "કાતર",
        explanation: "'ક' ને કાનો લગાડતાં 'કાતર' સાચો શબ્દ બને છે.",
        marks: 1,
        skillTarget: "કાનો માત્રા ઉપયોગ",
      },
      {
        questionNumber: 5,
        question: "'ચકલી' શબ્દનું બહુવચન શું થાય?",
        options: ["ચકલા", "ચકલીઓ", "ચકલીએ", "ચકલાઓ"],
        correctAnswer: "ચકલીઓ",
        explanation: "'ચકલી' નું બહુવચન 'ચકલીઓ' થાય.",
        marks: 1,
        skillTarget: "શબ્દ રૂપ અને માત્રા",
      },
    ],
  },

  "c-evs-water-01": {
    conceptId: "c-evs-water-01",
    conceptName: "Water Cycle & Conservation",
    subjectCode: "EVS",
    grade: 4,
    learningObjective:
      "Explain the key stages of the water cycle (evaporation, condensation, precipitation) and identify 3 daily water conservation actions.",
    expectedSkill:
      "Explain the continuous movement of water on Earth and score ≥80% on the water cycle and conservation assessment.",
    likelyMisconception:
      "Believing that water simply disappears when it dries up, rather than turning into invisible water vapor.",
    materials: [
      "Water cycle diagram chart",
      "Clear plastic cup with warm water and ice cubes on lid",
      "Paper and colored markers",
    ],
    difficulty: "Beginner",
    estimatedMinutes: 20,
    masteryBenchmark: 80,
    steps: [
      {
        stepNumber: 1,
        title: "STEP 1 — Concept Review: Sun's Heat & Evaporation",
        description: "Review what happens when wet clothes dry in the sun: heat turns liquid water into water vapor.",
        learningObjective: "Understand that heat causes evaporation of water into the air.",
        teacherInstructions: "Ask: 'Where does the water from a wet puddle go when the hot sun shines?' Explain evaporation.",
        studentInstructions: "Recall drying wet clothes in the sun and describe how liquid becomes vapor.",
        requiredMaterials: ["Chalkboard sketch"],
        durationMinutes: 4,
        activityType: "discussion",
        questionsOrExercises: ["What happens to water in a hot pan?", "What is evaporation?"],
        expectedResult: "Student explains that water turns into vapor when heated.",
        completed: false,
      },
      {
        stepNumber: 2,
        title: "STEP 2 — Concrete Demonstration: Mini Cloud in a Cup",
        description: "Observe droplets forming under a cold lid over warm water to demonstrate condensation and rain.",
        learningObjective: "Observe condensation physically in a safe classroom demonstration.",
        teacherInstructions: "Pour warm water into a clear cup. Place a lid with ice cubes on top. Show tiny droplets forming under the lid.",
        studentInstructions: "Look closely at the underside of the lid. Watch the droplets get heavy and drop like rain.",
        requiredMaterials: ["Clear plastic cup", "Warm water", "Plastic lid", "3 ice cubes"],
        durationMinutes: 4,
        activityType: "demonstration",
        questionsOrExercises: ["Where did the droplets under the lid come from?", "What does this represent in nature?"],
        expectedResult: "Student identifies the droplets as clouds/rain forming through condensation.",
        completed: false,
      },
      {
        stepNumber: 3,
        title: "STEP 3 — Guided Practice: Water Cycle Diagram Labeling",
        description: "Teacher and student together label Sun, Evaporation, Cloud Formation, and Rain on a cycle diagram.",
        learningObjective: "Map the cyclical stages of water from Earth to sky and back to Earth.",
        teacherInstructions: "Guide student to draw arrows forming a complete loop: Lake → Evaporation → Clouds → Rain → Lake.",
        studentInstructions: "Draw arrows and write labels for the 4 stages.",
        requiredMaterials: ["Water cycle diagram worksheet"],
        durationMinutes: 4,
        activityType: "guided_practice",
        questionsOrExercises: ["Label Evaporation arrow.", "Label Rain/Precipitation arrow."],
        expectedResult: "Student labels all stages in correct sequence.",
        completed: false,
      },
      {
        stepNumber: 4,
        title: "STEP 4 — Independent Targeted Practice: Water Conservation Habits",
        description: "Student lists 3 everyday ways to save water at home/school and writes 1 personal action pledge.",
        learningObjective: "Identify real-world conservation practices to prevent water wastage.",
        teacherInstructions: "Encourage actionable ideas: turning off tap while brushing, reusing vegetable wash water for plants.",
        studentInstructions: "Write 3 practical ways your family can save water every day.",
        requiredMaterials: ["Notebook", "Pencil"],
        durationMinutes: 4,
        activityType: "independent_practice",
        questionsOrExercises: ["How can we save water while brushing?", "How can school save tap water?"],
        expectedResult: "Student lists 3 valid, practical water-saving actions.",
        completed: false,
      },
      {
        stepNumber: 5,
        title: "STEP 5 — Reassessment: 5-Question Water Cycle Mastery Check",
        description: "Administer a 5-question formative quiz to certify water cycle and conservation mastery.",
        learningObjective: "Achieve ≥80% score on water cycle concepts and conservation awareness.",
        teacherInstructions: "Score the 5 questions, record score gain, and verify benchmark.",
        studentInstructions: "Answer all 5 questions on the assessment sheet.",
        requiredMaterials: ["5-question Water Cycle assessment sheet"],
        durationMinutes: 4,
        activityType: "reassessment",
        questionsOrExercises: ["5-question assessment"],
        expectedResult: "Student scores ≥ 80% (at least 4/5 correct).",
        completed: false,
      },
    ],
    teacherInstructions:
      "Connect science concepts directly to the child's village or city context and monsoon experiences.",
    reassessmentCriteria:
      "Accurately answer at least 4 out of 5 questions (≥80%) covering evaporation, clouds, precipitation, and conservation.",
    reassessmentQuestions: [
      {
        questionNumber: 1,
        question: "When the sun warms water in lakes and rivers, liquid water turns into invisible gas. What is this process called?",
        options: ["Freezing", "Evaporation", "Melting", "Precipitation"],
        correctAnswer: "Evaporation",
        explanation: "Evaporation is the process where liquid water turns into water vapor due to heat.",
        marks: 1,
        skillTarget: "Evaporation concept recall",
      },
      {
        questionNumber: 2,
        question: "What happens when warm water vapor rises high in the sky and cools down?",
        options: ["It disappears forever", "It forms clouds through condensation", "It turns into fire", "It becomes soil"],
        correctAnswer: "It forms clouds through condensation",
        explanation: "Water vapor cools and condenses into tiny water droplets that form clouds.",
        marks: 1,
        skillTarget: "Condensation and cloud formation",
      },
      {
        questionNumber: 3,
        question: "What is water falling from clouds as rain called?",
        options: ["Precipitation", "Evaporation", "Photosynthesis", "Filtration"],
        correctAnswer: "Precipitation",
        explanation: "Rain, snow, or hail falling from clouds is called precipitation.",
        marks: 1,
        skillTarget: "Precipitation identification",
      },
      {
        questionNumber: 4,
        question: "Which of the following is a good way to save water at home?",
        options: [
          "Leaving the tap running while brushing teeth",
          "Fixing leaking taps promptly",
          "Washing one shirt at a time with a hose",
          "Throwing clean drinking water away",
        ],
        correctAnswer: "Fixing leaking taps promptly",
        explanation: "Fixing leaking taps prevents liters of clean water from being wasted every day.",
        marks: 1,
        skillTarget: "Water conservation practice",
      },
      {
        questionNumber: 5,
        question: "Why is the water cycle called a 'cycle'?",
        options: [
          "Because you need a bicycle to study it",
          "Because water moves in a continuous loop that never ends",
          "Because it only happens once a year",
          "Because water only moves in straight lines",
        ],
        correctAnswer: "Because water moves in a continuous loop that never ends",
        explanation: "It is called a cycle because water continually evaporates, forms clouds, rains, and returns to rivers/seas.",
        marks: 1,
        skillTarget: "Cyclical nature of Earth's water systems",
      },
    ],
  },
};

/**
 * Creates a default 5-step fallback template for any concept not explicitly in the dictionary.
 * Guaranteed to have exactly 5 logically ordered steps.
 */
function createDefault5StepTemplate(
  conceptId: string,
  conceptName: string,
  subjectCode: SubjectCode,
  gapDetection: GapDetectionResult,
  language: "en" | "gu" = "en"
): ConceptCurriculumTemplate {
  const isGujarati = language === "gu";

  if (isGujarati) {
    return {
      conceptId,
      conceptName,
      subjectCode,
      grade: 3,
      learningObjective: `'${conceptName}' માં પાયાની સંકલ્પનાત્મક સમજ કેળવવી અને ૮૦% કરતાં વધુ ગુણ સાથે સ્વતંત્ર નિપુણતા મેળવવી.`,
      expectedSkill: `વિદ્યાર્થી '${conceptName}' ના પ્રશ્નો ૮૦%+ ચોકસાઈ સાથે સ્વતંત્ર રીતે ઉકેલી શકે.`,
      likelyMisconception: `સંકલ્પનાના મૂળભૂત નિયમો અને પગલાંની યોગ્ય સમજનો અભાવ.`,
      materials: ["વર્ગખંડ નોટબુક અને પેન્સિલ", "મૂર્ત સાધનો અથવા કાર્ડ્સ", "લક્ષિત કાર્યપત્રક"],
      difficulty: gapDetection.latestPercentage < 45 ? "Beginner" : "Intermediate",
      estimatedMinutes: 20,
      masteryBenchmark: 80,
      steps: [
        {
          stepNumber: 1,
          title: "પગલું ૧ — પૂર્વજ્ઞાન અને સંકલ્પના પરિચય",
          description: `'${conceptName}' ના મૂળભૂત નિયમો અને વ્યાખ્યાઓનું સાદી ભાષામાં પુનરાવર્તન.`,
          learningObjective: "પાયાના પૂર્વજ્ઞાનનું દ્રઢીકરણ.",
          teacherInstructions: "સરળ ઉદાહરણો આપી પૂર્વજ્ઞાન ચકાસો.",
          studentInstructions: "નિયમો ધ્યાનથી સમજો.",
          requiredMaterials: ["નોટબુક"],
          durationMinutes: 4,
          activityType: "discussion",
          questionsOrExercises: ["પાયાના ખ્યાલ પર ૨ પ્રશ્નો"],
          expectedResult: "વિદ્યાર્થી પાયાનો અર્થ સમજે.",
          completed: false,
        },
        {
          stepNumber: 2,
          title: "પગલું ૨ — પ્રત્યક્ષ મૂર્ત સાધનોથી નિદર્શન",
          description: `મૂર્ત સાધનો, ચિત્રો અથવા વાસ્તવિક ઉદાહરણો દ્વારા સંકલ્પનાનું પ્રત્યક્ષ નિદર્શન.`,
          learningObjective: "વાસ્તવિક વસ્તુઓથી સંકલ્પના સમજવી.",
          teacherInstructions: "સાધનો દ્વારા ૨ ઉદાહરણો પ્રત્યક્ષ બતાવો.",
          studentInstructions: "સાધનો હાથમાં લઈ જાતે તપાસો.",
          requiredMaterials: ["મૂર્ત સાધનો"],
          durationMinutes: 5,
          activityType: "hands_on",
          questionsOrExercises: ["પ્રત્યક્ષ પ્રવૃત્તિ"],
          expectedResult: "વિદ્યાર્થી સાધનથી સાચો જવાબ બનાવે.",
          completed: false,
        },
        {
          stepNumber: 3,
          title: "પગલું ૩ — માર્ગદર્શિત મહાવરો",
          description: `શિક્ષક અને વિદ્યાર્થી સાથે મળીને ૩ ક્રમબદ્ધ ઉદાહરણો ઉકેલે.`,
          learningObjective: "પદ્ધતિસરના પગલાં સાથે ગણતરી.",
          teacherInstructions: "વિદ્યાર્થી સાથે દાખલા ગણો અને જ્યાં અટકે ત્યાં માર્ગદર્શન આપો.",
          studentInstructions: "પગલાં બોલીને નોટબુકમાં લખો.",
          requiredMaterials: ["નોટબુક"],
          durationMinutes: 4,
          activityType: "guided_practice",
          questionsOrExercises: ["૨ માર્ગદર્શિત દાખલા"],
          expectedResult: "વિદ્યાર્થી યોગ્ય પદ્ધતિ અનુસરે.",
          completed: false,
        },
        {
          stepNumber: 4,
          title: "પગલું ૪ — સ્વતંત્ર લક્ષિત મહાવરો",
          description: `વિદ્યાર્થી જાતે ૪ થી ૫ અભ્યાસ પ્રશ્નો ઉકેલે.`,
          learningObjective: "સ્વતંત્ર સમસ્યા ઉકેલ ક્ષમતા.",
          teacherInstructions: "વિદ્યાર્થીને જાતે પ્રયત્ન કરવા દો.",
          studentInstructions: "પ્રશ્નો ધ્યાનથી ગણો.",
          requiredMaterials: ["કાર્યપત્રક"],
          durationMinutes: 4,
          activityType: "independent_practice",
          questionsOrExercises: ["૪ સ્વતંત્ર પ્રશ્નો"],
          expectedResult: "વિદ્યાર્થી મોટાભાગના પ્રશ્નો સાચા ગણે.",
          completed: false,
        },
        {
          stepNumber: 5,
          title: "પગલું ૫ — પુનઃમૂલ્યાંકન",
          description: `૫-પ્રશ્નોની રચનાત્મક કસોટી દ્વારા ૮૦% બેન્ચમાર્ક સિદ્ધિનું મૂલ્યાંકન.`,
          learningObjective: "સ્વતંત્ર નિપુણતા પ્રમાણિત કરવી.",
          teacherInstructions: "૫ પ્રશ્નો ચકાસી સ્કોર નોંધી સુધારો ગણો.",
          studentInstructions: "બધા ૫ પ્રશ્નોના ઉત્તર આપો.",
          requiredMaterials: ["કસોટી પત્રિકા"],
          durationMinutes: 3,
          activityType: "reassessment",
          questionsOrExercises: ["૫ પુનઃમૂલ્યાંકન પ્રશ્નો"],
          expectedResult: "વિદ્યાર્થી ૮૦%+ ગુણ મેળવે.",
          completed: false,
        },
      ],
      teacherInstructions: `વિદ્યાર્થીએ અગાઉના મૂલ્યાંકનમાં (${gapDetection.latestPercentage}%) શા માટે ભૂલ કરી હતી તેના પર ધ્યાન કેન્દ્રિત કરો. પ્રોત્સાહક વાતાવરણ પૂરું પાડો.`,
      reassessmentCriteria: `વિદ્યાર્થી '${conceptName}' ની પુનઃમૂલ્યાંકન કસોટીમાં ઓછામાં ઓછા ૮૦% ગુણ મેળવે.`,
      reassessmentQuestions: [
        {
          questionNumber: 1,
          question: `'${conceptName}' નો પાયાનો નિયમ દર્શાવતો સાચો વિકલ્પ કયો છે?`,
          options: ["વિકલ્પ A: પાયાની સાચી વ્યાખ્યા", "વિકલ્પ B: અયોગ્ય વ્યાખ્યા", "વિકલ્પ C: વિરુદ્ધ અર્થ", "વિકલ્પ D: કોઈ નહીં"],
          correctAnswer: "વિકલ્પ A: પાયાની સાચી વ્યાખ્યા",
          explanation: "સંકલ્પનાનો સાચો નિયમ વિકલ્પ A માં દર્શાવેલ છે.",
          marks: 1,
          skillTarget: "પાયાની સંકલ્પના વ્યાખ્યા",
        },
        {
          questionNumber: 2,
          question: `'${conceptName}' સંબંધિત વ્યવહારુ ઉદાહરણનો સાચો જવાબ શોધો.`,
          options: ["જવાબ ૧ (સાચો)", "જવાબ ૨", "જવાબ ૩", "જવાબ ૪"],
          correctAnswer: "જવાબ ૧ (સાચો)",
          explanation: "નિયમ મુજબ ગણતરી કરતાં જવાબ ૧ સાચો બને છે.",
          marks: 1,
          skillTarget: "વ્યવહારુ ઉપયોગ",
        },
        {
          questionNumber: 3,
          question: `'${conceptName}' ના દાખલામાં પ્રથમ પગલું શું હોય છે?`,
          options: ["પ્રથમ નિયમ લાગુ કરવો", "અંતિમ જવાબ લખવો", "રકમ બદલવી", "કંઈ ન કરવું"],
          correctAnswer: "પ્રથમ નિયમ લાગુ કરવો",
          explanation: "પ્રથમ તબક્કે સંકલ્પનાનો નિયમ લાગુ કરવો પડે છે.",
          marks: 1,
          skillTarget: "પદ્ધતિસરના પગલાં",
        },
        {
          questionNumber: 4,
          question: `નીચેનામાંથી કઈ ભૂલ સામાન્ય રીતે '${conceptName}' માં જોવા મળે છે?`,
          options: ["ઉતાવળમાં નિયમ ભૂલવો", "સ્પષ્ટ અક્ષરે લખવું", "ચકાસણી કરવી", "કોઈ ભૂલ ન થવી"],
          correctAnswer: "ઉતાવળમાં નિયમ ભૂલવો",
          explanation: "વિદ્યાર્થી ઘણીવાર નિયમ ભૂલીને અંદાજ લગાવે છે.",
          marks: 1,
          skillTarget: "સામાન્ય ભૂલ સુધારણા",
        },
        {
          questionNumber: 5,
          question: `'${conceptName}' નો ઉપયોગ કરીને આપેલ ઉદાહરણ ઉકેલો.`,
          options: ["સાચો ઉકેલ", "ખોટો ઉકેલ ૧", "ખોટો ઉકેલ ૨", "ખોટો ઉકેલ ૩"],
          correctAnswer: "સાચો ઉકેલ",
          explanation: "પગલાં મુજબ ઉકેલ મેળવવો.",
          marks: 1,
          skillTarget: "સ્વતંત્ર સમસ્યા ઉકેલ",
        },
      ],
    };
  }

  return {
    conceptId,
    conceptName,
    subjectCode,
    grade: 3,
    learningObjective: `Strengthen conceptual understanding and foundational mastery of ${conceptName} through structured 5-step concrete intervention.`,
    expectedSkill: `Independently apply foundational rules and methods of ${conceptName} to solve problems with at least 80% accuracy.`,
    likelyMisconception: `Incomplete grasp of prerequisite foundational principles or inconsistent application of problem-solving steps.`,
    materials: ["Classroom notebook", "Pencil and eraser", "Concept worksheet", "Physical counters or sketch models"],
    difficulty: gapDetection.latestPercentage < 45 ? "Beginner" : "Intermediate",
    estimatedMinutes: 20,
    masteryBenchmark: 80,
    steps: [
      {
        stepNumber: 1,
        title: "STEP 1 — Concept Review: Prerequisite Diagnostic Clarification",
        description: `Review the prerequisite concepts, core definitions, and foundational vocabulary of ${conceptName}.`,
        learningObjective: `Review and recall prerequisite knowledge necessary for ${conceptName}.`,
        teacherInstructions: `Explain the foundational idea using simple everyday language and interactive questions.`,
        studentInstructions: `Listen, repeat the core rule in your own words, and ask questions if anything is unclear.`,
        requiredMaterials: ["Notebook or slate"],
        durationMinutes: 4,
        activityType: "discussion",
        questionsOrExercises: ["State the core definition.", "Give one simple example."],
        expectedResult: "Student verbally articulates the prerequisite concept accurately.",
        completed: false,
      },
      {
        stepNumber: 2,
        title: "STEP 2 — Concrete Demonstration: Visual & Manipulative Modeling",
        description: `Use physical objects, manipulatives, diagrams, visual examples, or real-life situations to model ${conceptName}.`,
        learningObjective: `Experience ${conceptName} through concrete physical or visual representations.`,
        teacherInstructions: `Demonstrate 2 clear examples using tactile objects or structured diagrams on the board.`,
        studentInstructions: `Observe the demonstration carefully and replicate the model using your own materials.`,
        requiredMaterials: ["Visual aids or counting manipulatives"],
        durationMinutes: 5,
        activityType: "hands_on",
        questionsOrExercises: ["Follow the teacher's model to build the demonstration."],
        expectedResult: "Student accurately replicates the physical or visual demonstration.",
        completed: false,
      },
      {
        stepNumber: 3,
        title: "STEP 3 — Guided Practice: Step-by-Step Co-Solving",
        description: `Teacher and student solve 2 to 3 representative examples together with step-by-step reasoning.`,
        learningObjective: `Apply correct procedural steps with gentle, immediate teacher feedback.`,
        teacherInstructions: `Guide the student through each step, asking guiding questions rather than simply giving the answer.`,
        studentInstructions: `Write each step down and explain your reasoning aloud as you solve.`,
        requiredMaterials: ["Practice notebook"],
        durationMinutes: 4,
        activityType: "guided_practice",
        questionsOrExercises: ["Solve example 1 together.", "Solve example 2 together."],
        expectedResult: "Student correctly follows the sequential procedure with teacher prompts.",
        completed: false,
      },
      {
        stepNumber: 4,
        title: "STEP 4 — Independent Targeted Practice: Graded Exercises",
        description: `Student independently completes 4 exercises with difficulty calibrated to their demonstrated ability.`,
        learningObjective: `Achieve procedural fluency and confidence working without assistance.`,
        teacherInstructions: `Step back and observe. Intervene only after the student completes their attempt.`,
        studentInstructions: `Work through all exercises independently. Check your calculations or answers carefully.`,
        requiredMaterials: ["Targeted practice worksheet"],
        durationMinutes: 4,
        activityType: "independent_practice",
        questionsOrExercises: ["Exercise 1", "Exercise 2", "Exercise 3", "Exercise 4"],
        expectedResult: "Student completes at least 3 out of 4 exercises accurately.",
        completed: false,
      },
      {
        stepNumber: 5,
        title: "STEP 5 — Reassessment: Formative Exit Assessment",
        description: `Administer a 5-question formative assessment to verify if the student crosses the 80% mastery benchmark.`,
        learningObjective: `Verify independent mastery and calculate percentage-point growth over baseline.`,
        teacherInstructions: `Administer the 5 questions independently. Score marks and record improvement in percentage points.`,
        studentInstructions: `Complete all 5 questions on the reassessment sheet independently.`,
        requiredMaterials: ["5-question Reassessment Sheet"],
        durationMinutes: 3,
        activityType: "reassessment",
        questionsOrExercises: ["5 reassessment questions"],
        expectedResult: "Student achieves ≥ 80% (at least 4 out of 5 correct).",
        completed: false,
      },
    ],
    teacherInstructions: `Focus on the specific reasons the student struggled during baseline assessment (${gapDetection.latestPercentage}%). Provide patient encouragement and clear explanations.`,
    reassessmentCriteria: `Student must achieve at least 80% on the 5-question reassessment for ${conceptName} without teacher hints.`,
    reassessmentQuestions: [
      {
        questionNumber: 1,
        question: `Which statement correctly describes the foundational rule of ${conceptName}?`,
        options: ["Statement A (Correct foundational rule)", "Statement B (Incorrect)", "Statement C (Incorrect)", "Statement D (Incorrect)"],
        correctAnswer: "Statement A (Correct foundational rule)",
        explanation: `Statement A expresses the accurate core principle of ${conceptName}.`,
        marks: 1,
        skillTarget: "Core rule identification",
      },
      {
        questionNumber: 2,
        question: `Apply the rule of ${conceptName} to find the correct result for basic problem #1:`,
        options: ["Result A (Correct)", "Result B", "Result C", "Result D"],
        correctAnswer: "Result A (Correct)",
        explanation: `Applying the rule step-by-step gives Result A.`,
        marks: 1,
        skillTarget: "Direct concept application",
      },
      {
        questionNumber: 3,
        question: `What is the first step when solving a standard problem in ${conceptName}?`,
        options: ["Identify the key given values and applicable rule", "Guess an approximate number", "Skip to the final answer", "None of these"],
        correctAnswer: "Identify the key given values and applicable rule",
        explanation: "Problem-solving requires identifying given data and the governing rule first.",
        marks: 1,
        skillTarget: "Methodological procedure",
      },
      {
        questionNumber: 4,
        question: `In a real-life situation involving ${conceptName}, which outcome is correct?`,
        options: ["Scenario Outcome 1 (Correct)", "Scenario Outcome 2", "Scenario Outcome 3", "Scenario Outcome 4"],
        correctAnswer: "Scenario Outcome 1 (Correct)",
        explanation: "Scenario Outcome 1 correctly mirrors real-world application.",
        marks: 1,
        skillTarget: "Contextual word problem reasoning",
      },
      {
        questionNumber: 5,
        question: `Verify your understanding of ${conceptName} by identifying which statement is TRUE:`,
        options: ["True Principle Statement", "False Statement 1", "False Statement 2", "False Statement 3"],
        correctAnswer: "True Principle Statement",
        explanation: "The true principle statement accurately reflects the concept definition.",
        marks: 1,
        skillTarget: "Conceptual distinction and verification",
      },
    ],
  };
}

/**
 * Generates a targeted, actionable 5-step Remedial Plan for an identified student gap.
 * Works completely offline without paid API keys.
 * Aligned with the Gujarat primary curriculum standards and user requirements.
 */
export function generateRemedialPlan(
  studentId: string,
  studentName: string,
  conceptId: string,
  conceptName: string,
  subjectCode: SubjectCode,
  gapDetection: GapDetectionResult,
  customNotes?: string,
  options?: RemedialPlanGenerationOptions
): RemedialPlan {
  const language = options?.language || "en";
  const isGujarati = language === "gu";

  // Fetch or construct curriculum template
  const rawTemplate = CURRICULUM_TEMPLATES[conceptId] ||
    createDefault5StepTemplate(conceptId, conceptName, subjectCode, gapDetection, language);

  // If Gujarati requested and template has Gujarati specialization, use it
  const template = isGujarati && rawTemplate.gujarati
    ? {
        ...rawTemplate,
        conceptName: rawTemplate.gujarati.conceptName || conceptName,
        learningObjective: rawTemplate.gujarati.learningObjective,
        expectedSkill: rawTemplate.gujarati.expectedSkill,
        likelyMisconception: rawTemplate.gujarati.likelyMisconception,
        materials: rawTemplate.gujarati.materials,
        teacherInstructions: rawTemplate.gujarati.teacherInstructions,
        reassessmentCriteria: rawTemplate.gujarati.reassessmentCriteria,
        steps: rawTemplate.gujarati.steps,
        reassessmentQuestions: rawTemplate.gujarati.reassessmentQuestions,
      }
    : rawTemplate;

  // Guarantee EXACTLY 5 steps (pad or normalize if an existing template had fewer)
  let steps: RemedialStep[] = (template.steps || []).map((s, idx) => ({
    ...s,
    stepNumber: idx + 1,
    completed: false,
  }));

  if (steps.length < 5) {
    const fallbackTemplate = createDefault5StepTemplate(conceptId, conceptName, subjectCode, gapDetection, language);
    steps = fallbackTemplate.steps;
  } else if (steps.length > 5) {
    steps = steps.slice(0, 5);
  }

  // Ensure each step has the required attributes
  steps = steps.map((s, idx) => {
    const num = idx + 1;
    return {
      stepNumber: num,
      title: s.title || `STEP ${num}`,
      description: s.description || `Activity description for Step ${num}`,
      durationMinutes: s.durationMinutes || 4,
      activityType: s.activityType || (num === 1 ? "discussion" : num === 2 ? "hands_on" : num === 3 ? "guided_practice" : num === 4 ? "independent_practice" : "reassessment"),
      learningObjective: s.learningObjective || `Learning objective for Step ${num}`,
      teacherInstructions: s.teacherInstructions || `Teacher instructions for Step ${num}`,
      studentInstructions: s.studentInstructions || `Student instructions for Step ${num}`,
      requiredMaterials: s.requiredMaterials || template.materials || ["Notebook", "Pencil"],
      questionsOrExercises: s.questionsOrExercises || [],
      expectedResult: s.expectedResult || "Demonstrated evidence of learning",
      completed: false,
    };
  });

  // If this is a follow-up plan for a student who previously struggled, adapt step 2 & 3 teaching methods!
  if (options?.isFollowUp) {
    steps[1].title = isGujarati
      ? "પગલું ૨ — વૈકલ્પિક મૂર્ત સાધનોથી પુનઃનિદર્શન (અનુકૂલિત પદ્ધતિ)"
      : "STEP 2 — Concrete Demonstration: Alternative Multi-Sensory Method";
    steps[1].description = isGujarati
      ? `વિદ્યાર્થીની અગાઉની મુશ્કેલીને ધ્યાને રાખી અલગ પ્રકારના દ્રશ્ય મોડેલ્સ અને નવી શિક્ષણ પદ્ધતિથી સમજ આપવી.`
      : `Adapted teaching approach: Replace standard counters with visual area bar models and tactile grouping cards to overcome previous misconception.`;
    steps[2].teacherInstructions = isGujarati
      ? `અગાઉ જે ભૂલ થઈ હતી તેનું કારણ તપાસી વધારાના ઉદાહરણો સાથે ધીરજપૂર્વક માર્ગદર્શન આપો.`
      : `Focus specifically on the remaining error patterns from the previous reassessment. Provide guided scaffolding before independent work.`;
  }

  // Generate targeted practice worksheet data compatible with Worksheet Generator
  const worksheet = {
    worksheetTitle: isGujarati
      ? `${template.conceptName} - ૫-પગલાં લક્ષિત મહાવરો કાર્યપત્રક`
      : `${conceptName} - Targeted Remedial Practice Worksheet`,
    schoolName: "Model Primary School, Gandhinagar",
    grade: Number(options?.studentClass) || template.grade || 4,
    subject: String(subjectCode),
    concept: template.conceptName,
    difficulty: template.difficulty,
    language,
    instructions: isGujarati
      ? "દરેક પ્રશ્ન ધ્યાનપૂર્વક વાંચો. ગણતરી માટે જગ્યાનો ઉપયોગ કરો અને સાચો ઉત્તર લખો."
      : "Read each question carefully. Show your work in the space provided.",
    totalMarks: (template.reassessmentQuestions || []).length * 2,
    estimatedMinutes: 15,
    personalizedStudentNote: `Personalized intervention worksheet for ${studentName}`,
    questions: (template.reassessmentQuestions || []).map((q, idx) => ({
      questionNumber: idx + 1,
      questionText: q.question,
      questionType: q.options && q.options.length > 0 ? "mcq" : "open",
      options: q.options,
      marks: q.marks || 2,
      answerKey: q.correctAnswer,
      stepExplanation: q.explanation || "Step-by-step reasoning",
    })),
  };

  const id = options?.isFollowUp
    ? `plan-followup-${studentId}-${conceptId}-${Date.now()}`
    : `plan-${studentId}-${conceptId}-${Date.now()}`;
  const now = new Date().toISOString();
  const reviewDate = options?.reviewDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const baselineScore = options?.baselineScore ?? gapDetection.latestPercentage ?? 35;
  const confirmedOrInferred = options?.confirmedOrInferred ||
    (gapDetection.attemptsCount > 1 ? "confirmed" : "inferred");

  return {
    id,
    studentId,
    studentName,
    studentClass: options?.studentClass || template.grade || 4,
    studentSection: options?.studentSection || "A",
    conceptId,
    conceptName: template.conceptName,
    subjectCode,
    learningObjective: template.learningObjective,
    recommendationReason: gapDetection.reason || `Assessment performance (${baselineScore}%) indicates foundational support required.`,
    status: "Suggested",
    estimatedMinutes: template.estimatedMinutes || 20,
    difficulty: template.difficulty,
    requiredMaterials: template.materials,
    steps,
    practiceQuestionsSummary: `${steps.length} structured remedial steps with 5 targeted exit reassessment exercises.`,
    reassessmentCriteria: template.reassessmentCriteria,
    teacherInstructions: template.teacherInstructions,
    teacherNotes: customNotes || "",
    completedSteps: [],
    createdAt: now,
    reviewDate,
    // Upgraded attributes
    baselineScore,
    baselineEvidence: options?.baselineEvidence || `Scored ${baselineScore}% on baseline diagnostic assessment.`,
    knownMisconceptions: options?.knownMisconceptions || template.likelyMisconception,
    conceptualErrors: options?.conceptualErrors || [template.likelyMisconception],
    confirmedOrInferred,
    expectedSkill: template.expectedSkill,
    masteryBenchmark: options?.masteryBenchmark || template.masteryBenchmark || 80,
    reassessmentQuestions: template.reassessmentQuestions,
    parentPlanId: options?.parentPlanId,
    isFollowUp: Boolean(options?.isFollowUp),
    worksheet,
    startDate: options?.startDate || now.split("T")[0],
    targetDate: options?.targetDate || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    teacherObservations: customNotes || "",
  };
}
