/**
 * StudySaathi AI — Intelligent Curriculum Worksheet Generator & Evaluation Engine
 * 
 * Strict Standards:
 * 1. Gujarat State Board curriculum aligned for Standards 1 to 8.
 * 2. Separate question banks for all applicable subjects (MATH, ENG, GUJ, EVS, SCI, SST, HIN).
 * 3. Standard-wise question differentiation (Class 1 counting vs Class 4 division vs Class 8 algebra).
 * 4. 12 Worksheet types: Practice, Chapter, Topic, Revision, Diagnostic, Remedial, Assessment,
 *    Challenge, Homework, Mixed Practice, Exam Preparation, Mastery.
 * 5. 3 Difficulty levels (Easy, Medium, Hard, Mixed).
 * 6. Diverse question formats: MCQs, Fill-in-blanks, True/False, Short answers, Word problems, Matching.
 * 7. AI Adaptive prioritization based on student's actual test history and active learning gaps.
 * 8. Separate Teacher Answer Key with step-by-step pedagogical explanations and marking guidelines.
 * 9. 3-Version Differentiated Classroom generation (Support, Developing, Advanced).
 */

import { calculatePercentage, calculatePercentagePointDelta } from "./calculations";

export type WorksheetType =
  | "practice"
  | "chapter"
  | "topic"
  | "revision"
  | "diagnostic"
  | "remedial"
  | "assessment"
  | "challenge"
  | "homework"
  | "mixed_practice"
  | "exam_prep"
  | "mastery";

export type WorksheetDifficulty = "Easy" | "Medium" | "Hard" | "Mixed";

export interface WorksheetQuestionItem {
  id: string;
  questionNumber: number;
  questionText: string;
  questionTextGujarati: string;
  type: "mcq" | "fill_in_the_blank" | "true_false" | "short_answer" | "word_problem" | "matching" | "calculation";
  options?: string[];
  optionsGujarati?: string[];
  correctAnswer: string | number | boolean;
  explanation: string;
  explanationGujarati: string;
  marks: number;
  difficulty: "Easy" | "Medium" | "Hard";
  conceptId: string;
  conceptName: string;
  conceptNameGujarati: string;
  diagramOrVisual?: string;
  markingGuide?: string;
}

export interface GeneratedWorksheetModel {
  id: string;
  title: string;
  titleGujarati: string;
  worksheetType: WorksheetType;
  schoolName: string;
  schoolNameGujarati: string;
  academicYear: string;
  grade: number;
  section: string;
  subjectCode: string;
  subjectName: string;
  subjectNameGujarati: string;
  chapter: string;
  chapterGujarati: string;
  topic: string;
  topicGujarati: string;
  difficulty: WorksheetDifficulty;
  language: "en" | "gu";
  targetStudentId?: string;
  targetStudentName?: string;
  totalMarks: number;
  estimatedMinutes: number;
  instructions: string;
  instructionsGujarati: string;
  questions: WorksheetQuestionItem[];
  teacherAnswerKey: {
    totalQuestions: number;
    totalMarks: number;
    guidelines: string;
    guidelinesGujarati: string;
    answers: Array<{
      questionNumber: number;
      correctAnswer: string | number | boolean;
      stepExplanation: string;
      stepExplanationGujarati: string;
      marks: number;
      rubricCriteria?: string;
    }>;
  };
  adaptiveMetadata?: {
    isAdaptive: boolean;
    studentPrioritizedConcept?: string;
    studentPreviousScore?: number;
    remedialFocusArea?: string;
    distributionDescription?: string;
  };
  versionTier?: "Support" | "Developing" | "Advanced";
  createdAt: string;
}

export interface WorksheetSubmission {
  id: string;
  worksheetId: string;
  studentId: string;
  studentName: string;
  answers: Record<number, string | number | boolean>;
  scoresPerQuestion: Record<number, number>;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  incorrectQuestions: number[];
  teacherComments?: string;
  evaluatedAt: string;
  timeSpentMinutes?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE CURRICULUM QUESTION BANK (STD 1 TO 8)
// ─────────────────────────────────────────────────────────────────────────────

interface QuestionTemplate {
  conceptId: string;
  grade: number;
  subjectCode: string;
  chapter: string;
  chapterGujarati: string;
  topic: string;
  topicGujarati: string;
  difficulty: "Easy" | "Medium" | "Hard";
  type: WorksheetQuestionItem["type"];
  textEn: string;
  textGu: string;
  optionsEn?: string[];
  optionsGu?: string[];
  answer: string | number | boolean;
  explanationEn: string;
  explanationGu: string;
  marks: number;
  diagramOrVisual?: string;
  markingGuide?: string;
}

export const CURRICULUM_QUESTION_BANK: QuestionTemplate[] = [
  // ─── CLASS 1: MATHEMATICS (Counting, Number Recognition 1-100) ───
  {
    conceptId: "c-math-count-1",
    grade: 1,
    subjectCode: "MATH",
    chapter: "Chapter 1: Numbers & Counting",
    chapterGujarati: "પ્રકરણ ૧: સંખ્યાઓ અને ગણતરી",
    topic: "Counting Objects",
    topicGujarati: "વસ્તુઓની ગણતરી",
    difficulty: "Easy",
    type: "mcq",
    textEn: "Count the apples: 🍎 🍎 🍎 🍎 🍎. How many apples are there?",
    textGu: "સફરજન ગણો: 🍎 🍎 🍎 🍎 🍎. કુલ કેટલા સફરજન છે?",
    optionsEn: ["4", "5", "6", "7"],
    optionsGu: ["૪", "૫", "૬", "૭"],
    answer: "5",
    explanationEn: "Counting each apple gives: 1, 2, 3, 4, 5. Total is 5.",
    explanationGu: "દરેક સફરજન ગણતાં: ૧, ૨, ૩, ૪, ૫. કુલ ૫ સફરજન છે.",
    marks: 1,
  },
  {
    conceptId: "c-math-count-1",
    grade: 1,
    subjectCode: "MATH",
    chapter: "Chapter 1: Numbers & Counting",
    chapterGujarati: "પ્રકરણ ૧: સંખ્યાઓ અને ગણતરી",
    topic: "Number Sequences",
    topicGujarati: "સંખ્યા ક્રમ",
    difficulty: "Medium",
    type: "fill_in_the_blank",
    textEn: "Fill in the missing number: 12, 13, ___, 15, 16.",
    textGu: "ખૂટતી સંખ્યા લખો: ૧૨, ૧૩, ___, ૧૫, ૧૬.",
    answer: "14",
    explanationEn: "14 comes after 13 and before 15 in counting order.",
    explanationGu: "ગણતરીના ક્રમમાં ૧૩ પછી અને ૧૫ પહેલાં ૧૪ આવે છે.",
    marks: 2,
  },
  {
    conceptId: "c-math-count-1",
    grade: 1,
    subjectCode: "MATH",
    chapter: "Chapter 1: Numbers & Counting",
    chapterGujarati: "પ્રકરણ ૧: સંખ્યાઓ અને ગણતરી",
    topic: "Comparing Quantities",
    topicGujarati: "જથ્થાની સરખામણી",
    difficulty: "Hard",
    type: "short_answer",
    textEn: "Kavita has 7 marbles and Rahul has 4 marbles. Who has more marbles, and by how many?",
    textGu: "કવિતા પાસે ૭ લખોટી અને રાહુલ પાસે ૪ લખોટી છે. કોની પાસે વધારે છે અને કેટલી વધારે?",
    answer: "Kavita by 3",
    explanationEn: "7 - 4 = 3. Kavita has 3 more marbles than Rahul.",
    explanationGu: "૭ - ૪ = ૩. કવિતા પાસે રાહુલ કરતાં ૩ લખોટી વધારે છે.",
    marks: 3,
  },

  // ─── CLASS 2: MATHEMATICS (2-Digit Addition & Subtraction) ───
  {
    conceptId: "c-math-addsub-2",
    grade: 2,
    subjectCode: "MATH",
    chapter: "Chapter 2: Addition & Subtraction",
    chapterGujarati: "પ્રકરણ ૨: સરવાળો અને બાદબાકી",
    topic: "2-Digit Addition without Regrouping",
    topicGujarati: "વદ્દી વગરનો ૨-અંકનો સરવાળો",
    difficulty: "Easy",
    type: "calculation",
    textEn: "Solve: 24 + 13 = ?",
    textGu: "ઉકેલો: ૨૪ + ૧૩ = ?",
    answer: "37",
    explanationEn: "Add units: 4 + 3 = 7. Add tens: 2 + 1 = 3. Result = 37.",
    explanationGu: "એકમનો સરવાળો: ૪ + ૩ = ૭. દશકનો સરવાળો: ૨ + ૧ = ૩. જવાબ = ૩૭.",
    marks: 2,
  },
  {
    conceptId: "c-math-addsub-2",
    grade: 2,
    subjectCode: "MATH",
    chapter: "Chapter 2: Addition & Subtraction",
    chapterGujarati: "પ્રકરણ ૨: સરવાળો અને બાદબાકી",
    topic: "2-Digit Subtraction with Regrouping",
    topicGujarati: "દસકાવાળી બાદબાકી",
    difficulty: "Medium",
    type: "word_problem",
    textEn: "A fruit seller had 45 bananas. He sold 28 bananas in the morning. How many bananas are left?",
    textGu: "એક ફળવાળા પાસે ૪૫ કેળાં હતાં. સવારે તેણે ૨૮ કેળાં વેચ્યાં. હવે તેની પાસે કેટલાં કેળાં બાકી રહ્યા?",
    answer: "17",
    explanationEn: "45 - 28 = 17 bananas remaining.",
    explanationGu: "૪૫ - ૨૮ = ૧૭ કેળાં બાકી રહે.",
    marks: 3,
  },
  {
    conceptId: "c-math-addsub-2",
    grade: 2,
    subjectCode: "MATH",
    chapter: "Chapter 2: Addition & Subtraction",
    chapterGujarati: "પ્રકરણ ૨: સરવાળો અને બાદબાકી",
    topic: "Multi-Step Balance Problem",
    topicGujarati: "બે તબક્કાની સમસ્યા",
    difficulty: "Hard",
    type: "word_problem",
    textEn: "Dev has 36 stamps. Priya gives him 19 more. He then gives 15 stamps to his sister. How many stamps does Dev have now?",
    textGu: "દેવ પાસે ૩૬ ટિકિટ છે. પ્રિયા તેને બીજી ૧૯ ટિકિટ આપે છે. પછી તે ૧૫ ટિકિટ તેની બહેનને આપે છે. હવે દેવ પાસે કેટલી ટિકિટ છે?",
    answer: "40",
    explanationEn: "36 + 19 = 55. Then 55 - 15 = 40 stamps.",
    explanationGu: "૩૬ + ૧૯ = ૫૫. પછી ૫૫ - ૧૫ = ૪૦ ટિકિટ રહે.",
    marks: 3,
  },

  // ─── CLASS 3: MATHEMATICS (Multiplication Tables 2-9 & Place Value) ───
  {
    conceptId: "c-mult-01",
    grade: 3,
    subjectCode: "MATH",
    chapter: "Chapter 4: Multiplication",
    chapterGujarati: "પ્રકરણ ૪: ગુણાકાર",
    topic: "Repeated Addition & Tables",
    topicGujarati: "પુનરાવર્તિત સરવાળો અને ઘડિયા",
    difficulty: "Easy",
    type: "mcq",
    textEn: "Which multiplication fact represents: 4 + 4 + 4 + 4 + 4 + 4?",
    textGu: "૪ + ૪ + ૪ + ૪ + ૪ + ૪ ને ગુણાકાર સ્વરૂપે કઈ રીતે લખાય?",
    optionsEn: ["4 × 5", "4 × 6", "6 × 6", "4 × 7"],
    optionsGu: ["૪ × ૫", "૪ × ૬", "૬ × ૬", "૪ × ૭"],
    answer: "4 × 6",
    explanationEn: "Adding 4 six times is 4 × 6 = 24.",
    explanationGu: "૪ નો ૬ વખત સરવાળો એટલે ૪ × ૬ = ૨૪.",
    marks: 2,
  },
  {
    conceptId: "c-mult-01",
    grade: 3,
    subjectCode: "MATH",
    chapter: "Chapter 4: Multiplication",
    chapterGujarati: "પ્રકરણ ૪: ગુણાકાર",
    topic: "Real-Life Multiplication",
    topicGujarati: "રોજિંદા જીવનમાં ગુણાકાર",
    difficulty: "Medium",
    type: "word_problem",
    textEn: "There are 7 boxes. Each box contains 8 colored pencils. How many colored pencils are there in total?",
    textGu: "વર્ગખંડમાં ૭ બોક્સ છે. દરેક બોક્સમાં ૮ રંગીન પેન્સિલ છે. કુલ કેટલી પેન્સિલ થાય?",
    answer: "56",
    explanationEn: "7 boxes × 8 pencils = 56 pencils.",
    explanationGu: "૭ બોક્સ × ૮ પેન્સિલ = ૫૬ પેન્સિલ.",
    marks: 3,
  },
  {
    conceptId: "c-place-01",
    grade: 3,
    subjectCode: "MATH",
    chapter: "Chapter 3: Place Value",
    chapterGujarati: "પ્રકરણ ૩: સ્થાનકિંમત",
    topic: "3-Digit Place Value & Face Value",
    topicGujarati: "સ્થાનકિંમત અને દાર્શનિક કિંમત",
    difficulty: "Medium",
    type: "short_answer",
    textEn: "In the number 648, what is the place value of digit 4, and what is its face value?",
    textGu: "સંખ્યા ૬૪૮ માં અંક ૪ ની સ્થાનકિંમત કેટલી છે અને તેની મૂળ દાર્શનિક કિંમત કેટલી છે?",
    answer: "Place value is 40, face value is 4",
    explanationEn: "4 is in the tens place, so place value is 4 × 10 = 40. Face value is simply 4.",
    explanationGu: "૪ દશકના સ્થાને હોવાથી સ્થાનકિંમત ૪ × ૧૦ = ૪૦ થાય. દાર્શનિક કિંમત ૪ જ રહે.",
    marks: 2,
  },

  // ─── CLASS 4: MATHEMATICS (Division Basics, Fractions) ───
  {
    conceptId: "c-div-01",
    grade: 4,
    subjectCode: "MATH",
    chapter: "Chapter 5: Division & Equal Sharing",
    chapterGujarati: "પ્રકરણ ૫: ભાગાકાર અને સરખી વહેંચણી",
    topic: "Equal Sharing Basics",
    topicGujarati: "સરખી વહેંચણી",
    difficulty: "Easy",
    type: "mcq",
    textEn: "16 sweets are shared equally among 4 children. How many sweets does each child get?",
    textGu: "૧૬ મીઠાઈ ૪ બાળકો વચ્ચે સરખે ભાગે વહેંચવામાં આવે છે. દરેક બાળકને કેટલી મીઠાઈ મળે?",
    optionsEn: ["3", "4", "5", "6"],
    optionsGu: ["૩", "૪", "૫", "૬"],
    answer: "4",
    explanationEn: "16 divided by 4 = 4 sweets per child.",
    explanationGu: "૧૬ ÷ ૪ = ૪ મીઠાઈ દરેકને મળે.",
    marks: 2,
    diagramOrVisual: "[🍬🍬🍬🍬] [🍬🍬🍬🍬] [🍬🍬🍬🍬] [🍬🍬🍬🍬]",
  },
  {
    conceptId: "c-div-01",
    grade: 4,
    subjectCode: "MATH",
    chapter: "Chapter 5: Division & Equal Sharing",
    chapterGujarati: "પ્રકરણ ૫: ભાગાકાર અને સરખી વહેંચણી",
    topic: "Division with Remainder",
    topicGujarati: "શેષવાળો ભાગાકાર",
    difficulty: "Medium",
    type: "word_problem",
    textEn: "A teacher has 38 notebooks. She wants to distribute them equally among 5 groups of students. How many notebooks does each group receive, and how many are left over?",
    textGu: "શિક્ષક પાસે ૩૮ નોટબુક છે. તેઓ ૫ જૂથોમાં સરખે ભાગે વહેંચવા માંગે છે. દરેક જૂથને કેટલી નોટબુક મળશે અને કેટલી બાકી વધશે?",
    answer: "7 notebooks each, 3 left over",
    explanationEn: "38 ÷ 5 = 7 with a remainder of 3 (5 × 7 = 35; 38 - 35 = 3).",
    explanationGu: "૩૮ ÷ ૫ = ૭ ભાગફળ અને ૩ શેષ (૫ × ૭ = ૩૫; ૩૮ - ૩૫ = ૩).",
    marks: 3,
  },
  {
    conceptId: "c-div-01",
    grade: 4,
    subjectCode: "MATH",
    chapter: "Chapter 5: Division & Equal Sharing",
    chapterGujarati: "પ્રકરણ ૫: ભાગાકાર અને સરખી વહેંચણી",
    topic: "Real-Life Problem Solving (Aarav Key Remedial Case)",
    topicGujarati: "શાબ્દિક કૂટપ્રશ્ન ઉકેલ",
    difficulty: "Hard",
    type: "word_problem",
    textEn: "A school bus has 48 seats. If 4 students sit in each row, how many rows are there in the bus? If 3 rows are empty, how many students are on the bus?",
    textGu: "એક સ્કૂલ બસમાં ૪૮ બેઠકો છે. જો દરેક હરોળમાં ૪ વિદ્યાર્થી બેસે, તો બસમાં કુલ કેટલી હરોળ છે? જો ૩ હરોળ ખાલી હોય, તો બસમાં કેટલા વિદ્યાર્થીઓ છે?",
    answer: "12 rows, 36 students",
    explanationEn: "Total rows = 48 ÷ 4 = 12 rows. Empty rows = 3, so filled rows = 12 - 3 = 9. Students = 9 × 4 = 36 students.",
    explanationGu: "કુલ હરોળ = ૪૮ ÷ ૪ = ૧૨ હરોળ. ખાલી હરોળ = ૩, ભરેલી હરોળ = ૧૨ - ૩ = ૯. કુલ વિદ્યાર્થીઓ = ૯ × ૪ = ૩૬.",
    marks: 5,
    markingGuide: "2 marks for finding total rows (12), 3 marks for calculating seated students (36).",
  },
  {
    conceptId: "c-frac-01",
    grade: 4,
    subjectCode: "MATH",
    chapter: "Chapter 6: Halves & Quarters",
    chapterGujarati: "પ્રકરણ ૬: અડધો અને પા ભાગ (અપૂર્ણાંક)",
    topic: "Representing Fractions",
    topicGujarati: "અપૂર્ણાંક નિરૂપણ",
    difficulty: "Easy",
    type: "mcq",
    textEn: "A roti is cut into 4 equal slices. Riya eats 1 slice. What fraction of the roti did Riya eat?",
    textGu: "એક રોટલીના ૪ સરખા ભાગ કરવામાં આવ્યા છે. રિયા ૧ ભાગ ખાય છે. રિયાએ રોટલીનો કેટલામો ભાગ ખાધો?",
    optionsEn: ["1/2", "1/4", "3/4", "2/4"],
    optionsGu: ["૧/૨", "૧/૪", "૩/૪", "૨/૪"],
    answer: "1/4",
    explanationEn: "1 slice out of 4 equal parts is 1/4 (one quarter).",
    explanationGu: "૪ સરખા ભાગમાંથી ૧ ભાગ એટલે ૧/૪ (પા ભાગ).",
    marks: 2,
  },

  // ─── CLASS 5: MATHEMATICS (Decimals & Word Problems) ───
  {
    conceptId: "c-math-dec-5",
    grade: 5,
    subjectCode: "MATH",
    chapter: "Chapter 7: Decimals & Money",
    chapterGujarati: "પ્રકરણ ૭: દશાંશ સંખ્યા અને નાણું",
    topic: "Addition of Decimals",
    topicGujarati: "દશાંશ સરવાળો",
    difficulty: "Medium",
    type: "calculation",
    textEn: "Solve: ₹ 45.75 + ₹ 28.50 = ?",
    textGu: "ઉકેલો: ₹ ૪૫.૭૫ + ₹ ૨૮.૫૦ = ?",
    answer: "74.25",
    explanationEn: "45.75 + 28.50 = 74.25 rupees.",
    explanationGu: "૪૫.૭૫ + ૨૮.૫૦ = ૭૪.૨૫ રૂપિયા.",
    marks: 2,
  },
  {
    conceptId: "c-math-dec-5",
    grade: 5,
    subjectCode: "MATH",
    chapter: "Chapter 7: Decimals & Money",
    chapterGujarati: "પ્રકરણ ૭: દશાંશ સંખ્યા અને નાણું",
    topic: "Decimals Word Problem",
    topicGujarati: "દશાંશ આધારિત વ્યવહારિક દાખલો",
    difficulty: "Hard",
    type: "word_problem",
    textEn: "A wire of length 15.6 meters is cut into two pieces. One piece is 7.85 meters long. What is the length of the other piece?",
    textGu: "૧૫.૬ મીટર લાંબા વાયરના બે ટુકડા કરવામાં આવ્યા. એક ટુકડો ૭.૮૫ મીટર લાંબો છે. બીજા ટુકડાની લંબાઈ કેટલી હશે?",
    answer: "7.75 meters",
    explanationEn: "15.60 - 7.85 = 7.75 meters.",
    explanationGu: "૧૫.૬૦ - ૭.૮૫ = ૭.૭૫ મીટર.",
    marks: 3,
  },

  // ─── CLASS 6: MATHEMATICS (Integers & Number Line) ───
  {
    conceptId: "c-math-int-6",
    grade: 6,
    subjectCode: "MATH",
    chapter: "Chapter 3: Integers",
    chapterGujarati: "પ્રકરણ ૩: પૂર્ણાંક સંખ્યાઓ",
    topic: "Addition of Integers",
    topicGujarati: "પૂર્ણાંકોનો સરવાળો",
    difficulty: "Medium",
    type: "calculation",
    textEn: "Evaluate: (-12) + (+18) = ?",
    textGu: "ગણતરી કરો: (-૧૨) + (+૧૮) = ?",
    answer: "6",
    explanationEn: "18 - 12 = +6.",
    explanationGu: "૧૮ - ૧૨ = +૬.",
    marks: 2,
  },

  // ─── CLASS 7: MATHEMATICS (Simple Equations) ───
  {
    conceptId: "c-math-alg-7",
    grade: 7,
    subjectCode: "MATH",
    chapter: "Chapter 4: Simple Equations",
    chapterGujarati: "પ્રકરણ ૪: સાદા સમીકરણ",
    topic: "Linear Equation in One Variable",
    topicGujarati: "એક ચલ સમીકરણ",
    difficulty: "Hard",
    type: "calculation",
    textEn: "Solve for x: 3x + 7 = 25",
    textGu: "x ની કિંમત શોધો: 3x + 7 = 25",
    answer: "6",
    explanationEn: "3x = 25 - 7 = 18; x = 18 / 3 = 6.",
    explanationGu: "૩x = ૨૫ - ૭ = ૧૮; x = ૧૮ / ૩ = ૬.",
    marks: 3,
  },

  // ─── CLASS 8: MATHEMATICS (Linear Equations & Geometry) ───
  {
    conceptId: "c-math-geo-8",
    grade: 8,
    subjectCode: "MATH",
    chapter: "Chapter 6: Geometry & Angles",
    chapterGujarati: "પ્રકરણ ૬: ભૂમિતિ અને ખૂણાઓ",
    topic: "Angle Sum Property of Triangle",
    topicGujarati: "ત્રિકોણના ત્રણેય ખૂણાઓનો સરવાળો",
    difficulty: "Medium",
    type: "short_answer",
    textEn: "In triangle ABC, angle A = 50° and angle B = 65°. Find the measure of angle C.",
    textGu: "ત્રિકોણ ABC માં ખૂણો A = ૫૦° અને ખૂણો B = ૬૫° છે. ખૂણા C નું માપ શોધો.",
    answer: "65°",
    explanationEn: "Sum of angles in a triangle = 180°. Angle C = 180° - (50° + 65°) = 180° - 115° = 65°.",
    explanationGu: "ત્રિકોણના ત્રણેય ખૂણાઓનો સરવાળો ૧૮૦° થાય. ખૂણો C = ૧૮૦° - (૫૦° + ૬૫°) = ૬૫°.",
    marks: 3,
  },

  // ─── CLASS 1: ENGLISH (Alphabet & Phonics) ───
  {
    conceptId: "c-eng-alpha-1",
    grade: 1,
    subjectCode: "ENG",
    chapter: "Unit 1: The Alphabet World",
    chapterGujarati: "એકમ ૧: મૂળાક્ષરો",
    topic: "Letter Sounds",
    topicGujarati: "મૂળાક્ષર ઉચ્ચાર",
    difficulty: "Easy",
    type: "mcq",
    textEn: "Which letter does the word 'Sun' start with?",
    textGu: "'Sun' (સૂર્ય) શબ્દ કયા અક્ષરથી શરૂ થાય છે?",
    optionsEn: ["S", "T", "M", "P"],
    optionsGu: ["S", "T", "M", "P"],
    answer: "S",
    explanationEn: "'Sun' begins with the sound /s/, letter S.",
    explanationGu: "'Sun' શબ્દનો પ્રારંભિક અક્ષર S છે.",
    marks: 1,
  },

  // ─── CLASS 2: ENGLISH (Word Formation & CVC Words) ───
  {
    conceptId: "c-eng-word-2",
    grade: 2,
    subjectCode: "ENG",
    chapter: "Unit 2: Word Making",
    chapterGujarati: "એકમ ૨: શબ્દ નિર્માણ",
    topic: "CVC Rhyming Words",
    topicGujarati: "પ્રાસવાળા શબ્દો",
    difficulty: "Easy",
    type: "fill_in_the_blank",
    textEn: "Write a rhyming word for 'Cat' that begins with letter B: B ___ ___.",
    textGu: "'Cat' સાથે પ્રાસ મેળવતો અને B થી શરૂ થતો શબ્દ લખો: B ___ ___.",
    answer: "Bat",
    explanationEn: "Bat rhymes with Cat.",
    explanationGu: "Cat સાથે Bat શબ્દ પ્રાસ ધરાવે છે.",
    marks: 2,
  },

  // ─── CLASS 4: ENGLISH (Comprehension & Verbs) ───
  {
    conceptId: "c-eng-comp-01",
    grade: 4,
    subjectCode: "ENG",
    chapter: "Unit 4: Reading Stories",
    chapterGujarati: "એકમ ૪: વાર્તા વાંચન",
    topic: "Reading Comprehension",
    topicGujarati: "વાંચન સમજ",
    difficulty: "Medium",
    type: "mcq",
    textEn: "Read: 'Miku the squirrel collected five nuts and hid them under a green leaf.' Where did Miku hide the nuts?",
    textGu: "વાંચો: 'મીકુ ખિસકોલીએ પાંચ અખરોટ ભેગા કર્યા અને લીલા પાંદડા નીચે સંતાડ્યા.' મીકુએ અખરોટ ક્યાં સંતાડ્યા?",
    optionsEn: ["In a hole", "Under a green leaf", "Inside the nest", "Near the pond"],
    optionsGu: ["કાણામાં", "લીલા પાંદડા નીચે", "માળામાં", "તળાવ પાસે"],
    answer: "Under a green leaf",
    explanationEn: "The passage directly says Miku hid them 'under a green leaf'.",
    explanationGu: "વાર્તામાં સ્પષ્ટ કહ્યું છે કે પાંદડા નીચે સંતાડ્યા.",
    marks: 2,
  },
  {
    conceptId: "c-eng-verb-01",
    grade: 4,
    subjectCode: "ENG",
    chapter: "Unit 5: Action Words",
    chapterGujarati: "એકમ ૫: ક્રિયાપદ",
    topic: "Past Tense Verbs",
    topicGujarati: "ભૂતકાળના ક્રિયાપદો",
    difficulty: "Medium",
    type: "fill_in_the_blank",
    textEn: "Complete the sentence with past tense of 'play': Yesterday, the children ________ in the garden.",
    textGu: "'play' નું ભૂતકાળ રૂપ મૂકી વાક્ય પૂરું કરો: Yesterday, the children ________ in the garden.",
    answer: "played",
    explanationEn: "The past tense of the regular verb 'play' is 'played'.",
    explanationGu: "'play' નું ભૂતકાળનું રૂપ 'played' થાય.",
    marks: 2,
  },

  // ─── CLASS 1: GUJARATI (સ્વર અને વ્યંજન ઓળખ) ───
  {
    conceptId: "c-guj-svar-1",
    grade: 1,
    subjectCode: "GUJ",
    chapter: "પ્રકરણ ૧: સ્વર અને વ્યંજન",
    chapterGujarati: "પ્રકરણ ૧: સ્વર અને વ્યંજન",
    topic: "સ્વર ઓળખ",
    topicGujarati: "સ્વર ઓળખ",
    difficulty: "Easy",
    type: "mcq",
    textEn: "Which of the following is the first Gujarati vowel?",
    textGu: "નીચેનામાંથી કયો અક્ષર ગુજરાતીનો પ્રથમ સ્વર છે?",
    optionsEn: ["અ", "ક", "ખ", "આ"],
    optionsGu: ["અ", "ક", "ખ", "આ"],
    answer: "અ",
    explanationEn: "'અ' is the first vowel in Gujarati.",
    explanationGu: "ગુજરાતી મૂળાક્ષરોમાં 'અ' એ પ્રથમ સ્વર છે.",
    marks: 1,
  },

  // ─── CLASS 4: GUJARATI (જોડાક્ષર શબ્દોનું વાંચન-લેખન) ───
  {
    conceptId: "c-guj-conj-01",
    grade: 4,
    subjectCode: "GUJ",
    chapter: "પ્રકરણ ૪: જોડાક્ષર શબ્દો",
    chapterGujarati: "પ્રકરણ ૪: જોડાક્ષર શબ્દો",
    topic: "જોડાક્ષર ઓળખ અને જોડણી",
    topicGujarati: "જોડાક્ષર ઓળખ અને જોડણી",
    difficulty: "Medium",
    type: "fill_in_the_blank",
    textEn: "Complete the word: 'સ ___ ય' (meaning Truth): સ _ ય.",
    textGu: "સાચી જોડણી પૂર્ણ કરો: 'સ ___ ય' (જેનો અર્થ સાચું થાય છે).",
    answer: "સત્ય",
    explanationEn: "'સત્ય' is formed by combining ત + ય = ત્ય.",
    explanationGu: "ત + ય = ત્ય જોડાક્ષરથી 'સત્ય' શબ્દ બને છે.",
    marks: 2,
  },

  // ─── CLASS 4: EVS (Water Cycle & Conservation) ───
  {
    conceptId: "c-evs-water-01",
    grade: 4,
    subjectCode: "EVS",
    chapter: "Chapter 3: Water, A Precious Gift",
    chapterGujarati: "પ્રકરણ ૩: પાણી એ અમૂલ્ય સંપત્તિ",
    topic: "Water Cycle Stages",
    topicGujarati: "જળચક્રના તબક્કા",
    difficulty: "Easy",
    type: "mcq",
    textEn: "The process by which liquid water turns into water vapor due to heat from the sun is called:",
    textGu: "સૂર્યની ગરમીથી પાણી વરાળ બની આકાશમાં ચડે તે પ્રક્રિયાને શું કહે છે?",
    optionsEn: ["Evaporation", "Condensation", "Precipitation", "Freezing"],
    optionsGu: ["બાષ્પીભવન (વરાળ બનવું)", "ઘનીભવન", "વરસાદ", "ઠારણ"],
    answer: "Evaporation",
    explanationEn: "Evaporation is the turning of liquid water into gas/vapor by sun heat.",
    explanationGu: "સૂર્યના તાપથી પાણીનું વરાળમાં રૂપાંતર થવું તેને બાષ્પીભવન કહે છે.",
    marks: 2,
  },
  {
    conceptId: "c-evs-water-01",
    grade: 4,
    subjectCode: "EVS",
    chapter: "Chapter 3: Water, A Precious Gift",
    chapterGujarati: "પ્રકરણ ૩: પાણી એ અમૂલ્ય સંપત્તિ",
    topic: "Water Conservation Habits",
    topicGujarati: "જળસંચયની ટેવો",
    difficulty: "Hard",
    type: "short_answer",
    textEn: "Write two simple daily habits you and your family can practice at home to save clean drinking water.",
    textGu: "ઘરમાં પીવાના શુદ્ધ પાણીનો બગાડ અટકાવવા તમે અપનાવી શકો તેવી બે સારી ટેવો જણાવો.",
    answer: "Turn off running taps and reuse vegetable wash water for plants",
    explanationEn: "Turning off leaking or open taps and reusing graywater saves significant water daily.",
    explanationGu: "બ્રશ કરતી વખતે નળ બંધ રાખવો અને શાકભાજી ધોયેલું પાણી કુંડામાં રેડવું એ ઉત્તમ ટેવ છે.",
    marks: 3,
  },

  // ─── CLASS 6: SCIENCE (Living Organisms & Habitat) ───
  {
    conceptId: "c-sci-organ-6",
    grade: 6,
    subjectCode: "SCI",
    chapter: "Chapter 5: Living Organisms & Surroundings",
    chapterGujarati: "પ્રકરણ ૫: સજીવો અને તેમની આસપાસ",
    topic: "Plant Adaptations in Desert",
    topicGujarati: "રણપ્રદેશની વનસ્પતિનું અનુકૂલન",
    difficulty: "Medium",
    type: "mcq",
    textEn: "Why do cactus plants in deserts have spines instead of broad leaves?",
    textGu: "રણપ્રદેશમાં થોર (કેક્ટસ) ને પહોળા પાંદડાને બદલે કાંટા કેમ હોય છે?",
    optionsEn: ["To prevent water loss", "To attract insects", "To grow faster", "To make more flowers"],
    optionsGu: ["પાણીનો વ્યય અટકાવવા", "જીવજંતુઓને આકર્ષવા", "ઝડપથી વધવા", "વધારે ફૂલ આપવા"],
    answer: "To prevent water loss",
    explanationEn: "Spines reduce transpiration, minimizing water loss in hot arid climates.",
    explanationGu: "કાંટા બાષ્પોત્સર્જન ઘટાડે છે જેથી પાણીનો વ્યય અટકે છે.",
    marks: 2,
  },

  // ─── CLASS 7: SOCIAL SCIENCE (Our Environment & Panchayati Raj) ───
  {
    conceptId: "c-sst-panch-7",
    grade: 7,
    subjectCode: "SST",
    chapter: "Chapter 2: Local Self-Government",
    chapterGujarati: "પ્રકરણ ૨: સ્થાનિક સ્વરાજ્યની સંસ્થાઓ",
    topic: "Gram Panchayat Functions",
    topicGujarati: "ગ્રામ પંચાયતના કાર્યો",
    difficulty: "Medium",
    type: "short_answer",
    textEn: "Who is the elected head of a Gram Panchayat in a Gujarat village?",
    textGu: "ગુજરાતના ગામડામાં ગ્રામ પંચાયતના ચૂંટાયેલા વડાને શું કહેવાય છે?",
    answer: "Sarpanch",
    explanationEn: "The Sarpanch is the directly elected leader of the Gram Panchayat.",
    explanationGu: "ગ્રામ પંચાયતના પ્રમુખને 'સરપંચ' કહેવાય છે.",
    marks: 2,
  },

  // ─── CLASS 3: HINDI (वर्णमाला एवं सरल शब्द) ───
  {
    conceptId: "c-hin-varn-3",
    grade: 3,
    subjectCode: "HIN",
    chapter: "पाठ १: हमारी वर्णमाला",
    chapterGujarati: "પાઠ ૧: હિન્દી વર્ણમાળા",
    topic: "स्वर पहचान",
    topicGujarati: "સ્વર ઓળખ",
    difficulty: "Easy",
    type: "mcq",
    textEn: "Which of the following is the first vowel in Hindi?",
    textGu: "નીચેનામાંથી હિન્દીનો પ્રથમ સ્વર કયો છે?",
    optionsEn: ["अ", "क", "ख", "म"],
    optionsGu: ["अ", "क", "ख", "म"],
    answer: "अ",
    explanationEn: "'अ' is the first vowel in Hindi Devnagari script.",
    explanationGu: "હિન્દી દેવનાગરી લિપિમાં 'अ' પ્રથમ સ્વર છે.",
    marks: 1,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// WORKSHEET GENERATOR IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateWorksheetParams {
  grade?: number;
  subjectCode?: string;
  conceptId?: string;
  worksheetType?: WorksheetType;
  difficulty?: WorksheetDifficulty;
  questionCount?: number;
  language?: "en" | "gu";
  studentId?: string;
  studentName?: string;
  section?: string;
  studentPreviousScore?: number;
  activeGapConceptId?: string;
  versionTier?: "Support" | "Developing" | "Advanced";
}

export class IntelligentWorksheetGenerator {
  /**
   * Generates a fully formatted, pedagogically sound classroom worksheet.
   */
  public static generateWorksheet(params: GenerateWorksheetParams): GeneratedWorksheetModel {
    const grade = Number(params.grade) || 4;
    const subjectCode = params.subjectCode || "MATH";
    const language = params.language || "en";
    const isGu = language === "gu";
    const worksheetType = params.worksheetType || "practice";
    const difficulty = params.difficulty || "Medium";
    const count = Math.min(20, Math.max(3, Number(params.questionCount) || 5));
    const section = params.section || "A";

    // Filter available pool matching grade and subject
    let pool = CURRICULUM_QUESTION_BANK.filter(
      (q) => q.grade === grade && q.subjectCode === subjectCode
    );

    // Fallback: If no exact grade+subject match in base template, use nearest grade or same subject
    if (pool.length === 0) {
      pool = CURRICULUM_QUESTION_BANK.filter((q) => q.subjectCode === subjectCode);
    }
    if (pool.length === 0) {
      pool = CURRICULUM_QUESTION_BANK.filter((q) => q.grade === grade);
    }
    if (pool.length === 0) {
      pool = CURRICULUM_QUESTION_BANK;
    }

    // Concept-specific filtering if requested
    if (params.conceptId) {
      const conceptPool = pool.filter((q) => q.conceptId === params.conceptId);
      if (conceptPool.length > 0) {
        pool = conceptPool;
      }
    }

    // Adaptive Prioritization Logic (Section 10)
    // If student has an active learning gap (e.g. Aarav Patel Division 35%), prioritize weak concept
    let adaptiveMetadata: GeneratedWorksheetModel["adaptiveMetadata"] | undefined;
    if (params.activeGapConceptId || (params.studentPreviousScore !== undefined && params.studentPreviousScore < 60)) {
      const gapPool = pool.filter((q) => q.conceptId === params.activeGapConceptId);
      if (gapPool.length > 0) {
        // Place gap questions first
        const nonGapPool = pool.filter((q) => q.conceptId !== params.activeGapConceptId);
        pool = [...gapPool, ...nonGapPool];
        adaptiveMetadata = {
          isAdaptive: true,
          studentPrioritizedConcept: params.activeGapConceptId,
          studentPreviousScore: params.studentPreviousScore,
          remedialFocusArea: gapPool[0]?.topic || "Reinforcement Focus",
          distributionDescription: `Prioritized ${gapPool.length} diagnostic questions targeting ${gapPool[0]?.topic}.`,
        };
      }
    }

    // Difficulty filtering
    if (difficulty !== "Mixed") {
      const diffPool = pool.filter((q) => q.difficulty === difficulty);
      if (diffPool.length >= 3) {
        pool = diffPool;
      }
    }

    // Differentiated 3-Version Classroom Adjustment (Support / Developing / Advanced)
    if (params.versionTier === "Support") {
      pool = [...pool.filter((q) => q.difficulty === "Easy"), ...pool.filter((q) => q.difficulty === "Medium")];
    } else if (params.versionTier === "Advanced") {
      pool = [...pool.filter((q) => q.difficulty === "Hard"), ...pool.filter((q) => q.difficulty === "Medium")];
    }

    // Select questions up to target count
    const selectedQuestions: WorksheetQuestionItem[] = [];
    let qNum = 1;
    let totalMarks = 0;

    for (let i = 0; i < count; i++) {
      const template = pool[i % pool.length];
      const marks = template.marks || 2;
      totalMarks += marks;

      selectedQuestions.push({
        id: `wq-${Date.now()}-${qNum}`,
        questionNumber: qNum,
        questionText: template.textEn,
        questionTextGujarati: template.textGu,
        type: template.type,
        options: template.optionsEn,
        optionsGujarati: template.optionsGu,
        correctAnswer: template.answer,
        explanation: template.explanationEn,
        explanationGujarati: template.explanationGu,
        marks,
        difficulty: template.difficulty,
        conceptId: template.conceptId,
        conceptName: template.chapter,
        conceptNameGujarati: template.chapterGujarati,
        diagramOrVisual: template.diagramOrVisual,
      });
      qNum++;
    }

    // Metadata & titles
    const representative = pool[0] || CURRICULUM_QUESTION_BANK[0];
    const typeLabelEn = worksheetType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const typeLabelGu =
      worksheetType === "remedial"
        ? "ઉપચાર કાર્યપત્રક"
        : worksheetType === "assessment"
        ? "મૂલ્યાંકન કાર્યપત્રક"
        : worksheetType === "challenge"
        ? "પડકારરૂપ કાર્યપત્રક"
        : "અભ્યાસ કાર્યપત્રક";

    const titleEn = `Class ${grade} ${representative.subjectCode} — ${typeLabelEn} Worksheet`;
    const titleGu = `ધોરણ ${grade} ${representative.subjectCode} — ${typeLabelGu}`;

    // Teacher Answer Key
    const teacherAnswerKey = {
      totalQuestions: selectedQuestions.length,
      totalMarks,
      guidelines:
        "Check steps for word problems and calculations. Award partial marks for correct reasoning steps as indicated.",
      guidelinesGujarati:
        "શાબ્દિક દાખલા અને ગણતરીમાં પદ્ધતિ તપાસો. સાચા તાર્કિક પગલાં માટે દર્શાવ્યા મુજબ આંશિક ગુણ ફાળવો.",
      answers: selectedQuestions.map((q) => ({
        questionNumber: q.questionNumber,
        correctAnswer: q.correctAnswer,
        stepExplanation: q.explanation,
        stepExplanationGujarati: q.explanationGujarati,
        marks: q.marks,
        rubricCriteria:
          q.type === "word_problem"
            ? "1 mark for formula/approach, remaining for accurate final calculation."
            : "Direct objective accuracy.",
      })),
    };

    const instructionsEn =
      "Read all questions carefully. Write your answers neatly in the space provided. Show all rough calculations.";
    const instructionsGu =
      "બધા પ્રશ્નો ધ્યાનપૂર્વક વાંચો. આપેલી જગ્યામાં સ્પષ્ટ અક્ષરે જવાબ લખો. જરૂરી ગણતરી દર્શાવો.";

    return {
      id: `ws-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: titleEn,
      titleGujarati: titleGu,
      worksheetType,
      schoolName: "Model Primary School, Gandhinagar",
      schoolNameGujarati: "મોડેલ પ્રાથમિક શાળા, ગાંધીનગર",
      academicYear: "2026–27",
      grade,
      section,
      subjectCode,
      subjectName: representative.subjectCode === "MATH" ? "Mathematics" : representative.subjectCode,
      subjectNameGujarati: representative.subjectCode === "MATH" ? "ગણિત" : representative.subjectCode,
      chapter: representative.chapter,
      chapterGujarati: representative.chapterGujarati,
      topic: representative.topic,
      topicGujarati: representative.topicGujarati,
      difficulty,
      language,
      targetStudentId: params.studentId,
      targetStudentName: params.studentName,
      totalMarks,
      estimatedMinutes: Math.max(15, count * 3),
      instructions: instructionsEn,
      instructionsGujarati: instructionsGu,
      questions: selectedQuestions,
      teacherAnswerKey,
      adaptiveMetadata,
      versionTier: params.versionTier,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Generates a 3-Version Differentiated set for a mixed-ability classroom
   */
  public static generateThreeTierClassroomBundle(params: GenerateWorksheetParams): {
    supportTier: GeneratedWorksheetModel;
    developingTier: GeneratedWorksheetModel;
    advancedTier: GeneratedWorksheetModel;
  } {
    const supportTier = this.generateWorksheet({
      ...params,
      difficulty: "Easy",
      versionTier: "Support",
    });
    const developingTier = this.generateWorksheet({
      ...params,
      difficulty: "Medium",
      versionTier: "Developing",
    });
    const advancedTier = this.generateWorksheet({
      ...params,
      difficulty: "Hard",
      versionTier: "Advanced",
    });

    supportTier.title += " (Tier A: Scaffolded Support)";
    developingTier.title += " (Tier B: Standard Practice)";
    advancedTier.title += " (Tier C: Advanced Challenge)";

    return { supportTier, developingTier, advancedTier };
  }
}
