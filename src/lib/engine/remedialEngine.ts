import type {
  RemedialPlan,
  RemedialStep,
  SubjectCode,
} from "../types";
import type { GapDetectionResult } from "./gapDetection";

export interface ConceptCurriculumTemplate {
  conceptId: string;
  conceptName: string;
  subjectCode: SubjectCode;
  grade: number;
  learningObjective: string;
  materials: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedMinutes: number;
  steps: RemedialStep[];
  teacherInstructions: string;
  reassessmentCriteria: string;
}

// Built-in deterministic pedagogical templates aligned with Gujarat primary curriculum.
// Every template provides a structured, 5-step concrete sequence.
export const CURRICULUM_TEMPLATES: Record<string, ConceptCurriculumTemplate> = {
  "c-div-01": {
    conceptId: "c-div-01",
    conceptName: "Division Basics & Equal Sharing",
    subjectCode: "MATH",
    grade: 4,
    learningObjective:
      "Understand division as equal grouping, sharing, and the inverse of multiplication, solving single-digit divisor problems with confidence.",
    materials: [
      "20 physical counting tokens, bottle caps, or tamarind seeds",
      "Equal grouping circular mats or paper plates",
      "Multiplication table 1-10 reference card",
      "Targeted division practice worksheet",
    ],
    difficulty: "Beginner",
    estimatedMinutes: 20,
    steps: [
      {
        stepNumber: 1,
        title: "Review Multiplication Link & Prerequisite Facts",
        description:
          "Review 2, 3, 4, and 5 times tables aloud. Demonstrate that multiplication and division are inverse operations (e.g., 4 × 3 = 12 means 12 ÷ 3 = 4).",
        durationMinutes: 4,
        activityType: "discussion",
        learningObjective: "Recall times tables and connect multiplication to division inverse facts.",
        materials: ["Multiplication table 1-10 reference card"],
        checkUnderstanding: "Ask: If 5 × 4 = 20, what is 20 ÷ 4 and 20 ÷ 5?",
        completed: false,
      },
      {
        stepNumber: 2,
        title: "Concrete Equal Sharing Demonstration",
        description:
          "Provide student with 12 counters. Ask them to physically distribute them equally into 3 bowls or circles until none remain.",
        durationMinutes: 5,
        activityType: "hands_on",
        learningObjective: "Model equal distribution physically using concrete counters.",
        materials: ["12 counting tokens", "3 paper plates or bowls"],
        checkUnderstanding: "Observe whether student distributes one by one or recognizes groups of 4.",
        completed: false,
      },
      {
        stepNumber: 3,
        title: "Guided Problem Solving with Grouping Mats",
        description:
          "Solve 3 word problems together on the blackboard/notebook (e.g. sharing 15 laddus among 5 children), drawing circles to represent groups.",
        durationMinutes: 4,
        activityType: "guided_practice",
        learningObjective: "Bridge tactile manipulation to drawn pictorial grouping diagrams.",
        materials: ["Notebook", "Pencil", "Circular grouping template"],
        checkUnderstanding: "Have student explain why 15 divided by 5 equals 3 circles of 5.",
        completed: false,
      },
      {
        stepNumber: 4,
        title: "Targeted Independent Practice Worksheet",
        description:
          "Student independently completes 5 division questions using visual grouping diagrams and repeated subtraction.",
        durationMinutes: 5,
        activityType: "independent_practice",
        learningObjective: "Independently calculate single-digit division quotients without teacher prompting.",
        materials: ["Division practice worksheet", "Pencil and eraser"],
        checkUnderstanding: "Verify student correctly answers at least 4 out of 5 worksheet problems.",
        completed: false,
      },
      {
        stepNumber: 5,
        title: "Mini Formative Diagnostic Exit Check",
        description:
          "Quick 2-question exit ticket to verify understanding and determine readiness to cross the 80% mastery threshold.",
        durationMinutes: 2,
        activityType: "check_for_understanding",
        learningObjective: "Demonstrate independent mastery on an exit ticket check.",
        materials: ["Exit slip slip of paper"],
        checkUnderstanding: "Ask student to solve 18 ÷ 3 and 16 ÷ 4 aloud with reasoning.",
        completed: false,
      },
    ],
    teacherInstructions:
      "Avoid jumping to abstract long division algorithms immediately. Reinforce equal grouping and real-world sharing (e.g. sharing sweets or pencils).",
    reassessmentCriteria:
      "Student must achieve at least 80% on a 5-question parallel assessment without teacher hints.",
  },

  "c-mult-01": {
    conceptId: "c-mult-01",
    conceptName: "Multiplication Tables (2 to 9)",
    subjectCode: "MATH",
    grade: 3,
    learningObjective:
      "Recall multiplication facts accurately and recognize multiplication as repeated addition and rectangular arrays.",
    materials: [
      "10x10 multiplication grid chart",
      "Flashcard deck for 6, 7, and 8 times tables",
      "Grid graph paper and colored markers",
    ],
    difficulty: "Intermediate",
    estimatedMinutes: 18,
    steps: [
      {
        stepNumber: 1,
        title: "Pattern Recognition & Skip Counting",
        description:
          "Identify patterns on the 10x10 grid (e.g., skip counting by 3s and 4s, even number patterns in 6s and 8s).",
        durationMinutes: 3,
        activityType: "discussion",
        learningObjective: "Identify skip counting sequences and numerical patterns on a multiplication grid.",
        materials: ["10x10 multiplication grid chart"],
        checkUnderstanding: "Prompt the student to skip count aloud by 6s up to 36.",
        completed: false,
      },
      {
        stepNumber: 2,
        title: "Array Visualization with Concrete Dots",
        description:
          "Draw rectangular arrays on grid paper to represent products (e.g., 3 rows of 4 dots) and rotate to demonstrate commutative property (3×4 = 4×3).",
        durationMinutes: 4,
        activityType: "hands_on",
        learningObjective: "Understand multiplication geometrically as rows and columns.",
        materials: ["Grid paper", "Colored sketch pens"],
        checkUnderstanding: "Ask student to draw an array representing 4 × 5.",
        completed: false,
      },
      {
        stepNumber: 3,
        title: "Commutative Matching Drill",
        description:
          "Pair multiplication equations that share answers (e.g. 6×7 and 7×6 = 42) to cut the memorization load in half.",
        durationMinutes: 4,
        activityType: "interactive_drill",
        learningObjective: "Apply the commutative property to halve memorization effort.",
        materials: ["Equation matching cards"],
        checkUnderstanding: "Ask: If you know 8 × 7 = 56, what is 7 × 8?",
        completed: false,
      },
      {
        stepNumber: 4,
        title: "Targeted Flashcard Recall Practice",
        description:
          "Rapid response flashcards focusing on frequently missed facts (7×8, 6×7, 8×6, 9×6) with encouraging immediate feedback.",
        durationMinutes: 4,
        activityType: "independent_practice",
        learningObjective: "Achieve fast, accurate recall of challenging multiplication facts.",
        materials: ["Multiplication flashcards"],
        checkUnderstanding: "Record whether student answers within 4 seconds without finger counting.",
        completed: false,
      },
      {
        stepNumber: 5,
        title: "Speed Exit Verification Check",
        description:
          "Quick 5-question oral or written check to verify fact fluency and retention.",
        durationMinutes: 3,
        activityType: "check_for_understanding",
        learningObjective: "Score >= 80% on timed single-digit multiplication prompts.",
        materials: ["Short 5-question exit slip"],
        checkUnderstanding: "Student solves 5 random multiplication prompts under 90 seconds.",
        completed: false,
      },
    ],
    teacherInstructions:
      "Focus heavily on the commutative property (knowing 4×7 means you also know 7×4) to reduce anxiety and memory burden.",
    reassessmentCriteria:
      "Correctly answer 8 out of 10 random single-digit multiplication prompts within 2 minutes.",
  },

  "c-place-01": {
    conceptId: "c-place-01",
    conceptName: "Place Value & 3-Digit Addition",
    subjectCode: "MATH",
    grade: 3,
    learningObjective:
      "Decompose 3-digit numbers into Hundreds, Tens, and Ones, and execute addition with regrouping accurately.",
    materials: [
      "Base-10 block representations (Flats, Rods, Units)",
      "Place value column chart (H-T-O)",
      "Colored sketch pens for carry-over marks",
    ],
    difficulty: "Beginner",
    estimatedMinutes: 20,
    steps: [
      {
        stepNumber: 1,
        title: "Place Value Column Decomposition",
        description:
          "Decompose numbers like 248 into 2 Hundreds (200), 4 Tens (40), and 8 Ones (8) using H-T-O column chart.",
        durationMinutes: 4,
        activityType: "instructional",
        learningObjective: "Deconstruct 3-digit numbers into Hundreds, Tens, and Ones.",
        materials: ["Place value chart", "Slate or paper"],
        checkUnderstanding: "Ask student: In 357, what is the value of the digit 5?",
        completed: false,
      },
      {
        stepNumber: 2,
        title: "Physical Regrouping with Base-10 Blocks",
        description:
          "Physically trade 10 Ones units for 1 Ten rod, and 10 Tens rods for 1 Hundred flat to establish the regrouping rule.",
        durationMinutes: 5,
        activityType: "hands_on",
        learningObjective: "Experience regrouping physically by trading 10 smaller units for 1 larger unit.",
        materials: ["Base-10 blocks or bundles of 10 sticks"],
        checkUnderstanding: "Have student demonstrate trading 12 ones for 1 ten and 2 ones.",
        completed: false,
      },
      {
        stepNumber: 3,
        title: "Guided Vertical Addition with Carry-Over",
        description:
          "Solve 2 three-digit addition problems together on the board with carry-over marks highlighted in bright colored ink.",
        durationMinutes: 4,
        activityType: "guided_practice",
        learningObjective: "Correctly record the carried-over digit in the tens or hundreds column.",
        materials: ["Colored pencils", "Grid paper"],
        checkUnderstanding: "Ensure student starts adding strictly from the rightmost (Ones) column.",
        completed: false,
      },
      {
        stepNumber: 4,
        title: "Scaffolded Independent Addition Problems",
        description:
          "Student solves 4 three-digit regrouping problems independently at their own pace with column guides.",
        durationMinutes: 4,
        activityType: "independent_practice",
        learningObjective: "Independently execute 3-digit addition problems with regrouping.",
        materials: ["Worksheet with column alignment guides"],
        checkUnderstanding: "Check if student remembers to add the carried-over digit in tens column.",
        completed: false,
      },
      {
        stepNumber: 5,
        title: "Verbal Step-by-Step Explanation & Exit Check",
        description:
          "Student explains one completed problem aloud to the teacher, demonstrating full conceptual understanding.",
        durationMinutes: 3,
        activityType: "check_for_understanding",
        learningObjective: "Articulate the mathematical justification for regrouping.",
        materials: ["Exit slip"],
        checkUnderstanding: "Student solves 1 fresh problem (e.g. 278 + 145) and explains each regroup step.",
        completed: false,
      },
    ],
    teacherInstructions:
      "Watch for students adding left-to-right or forgetting to add the carried-over digit. Emphasize place alignment.",
    reassessmentCriteria:
      "Accurately calculate 4 out of 5 three-digit addition problems with regrouping.",
  },

  "c-frac-01": {
    conceptId: "c-frac-01",
    conceptName: "Fractions Introduction (Half, Quarter)",
    subjectCode: "MATH",
    grade: 4,
    learningObjective:
      "Understand fractions as equal parts of a whole shape or set, identifying 1/2, 1/4, and 3/4 visually and notationally.",
    materials: [
      "Circular and rectangular paper cutouts for folding",
      "Scissors and colored crayons",
      "Fraction strips chart",
    ],
    difficulty: "Beginner",
    estimatedMinutes: 20,
    steps: [
      {
        stepNumber: 1,
        title: "Concept of Equal Parts vs Unequal Parts",
        description:
          "Show shapes cut equally vs unequally. Establish that a fraction requires every single piece to be the exact same size.",
        durationMinutes: 4,
        activityType: "discussion",
        learningObjective: "Distinguish between equal partition and unequal partition.",
        materials: ["Pre-cut paper shapes"],
        checkUnderstanding: "Show 2 shapes and ask: Which one shows fair, equal sharing?",
        completed: false,
      },
      {
        stepNumber: 2,
        title: "Paper Folding Tactile Exploration",
        description:
          "Student folds paper circles and strips in half (1/2), then folds again to create four equal quarters (1/4).",
        durationMinutes: 5,
        activityType: "hands_on",
        learningObjective: "Create halves and fourths through physical paper folding.",
        materials: ["Color paper strips", "Crayons"],
        checkUnderstanding: "Ask: How many quarters make one whole circle?",
        completed: false,
      },
      {
        stepNumber: 3,
        title: "Numerator & Denominator Representation",
        description:
          "Explain the top number (how many parts we take) and bottom number (total equal parts). Shade 1/2, 1/4, and 3/4.",
        durationMinutes: 4,
        activityType: "guided_practice",
        learningObjective: "Write fraction notation (1/2, 1/4, 3/4) corresponding to shaded regions.",
        materials: ["Fraction diagram sheet"],
        checkUnderstanding: "Have student shade 3 out of 4 segments on a rectangle and write 3/4.",
        completed: false,
      },
      {
        stepNumber: 4,
        title: "Real-World Set Partitioning Worksheet",
        description:
          "Student solves 4 problems finding half of 8 rotis or a quarter of 12 marbles.",
        durationMinutes: 4,
        activityType: "independent_practice",
        learningObjective: "Calculate fractions of small discrete collections.",
        materials: ["Fractions worksheet"],
        checkUnderstanding: "Verify student correctly calculates 1/2 of 10 and 1/4 of 8.",
        completed: false,
      },
      {
        stepNumber: 5,
        title: "Exit Ticket & Fraction Recognition",
        description:
          "Quick 2-question exit ticket to verify fraction reading and pictorial matching.",
        durationMinutes: 3,
        activityType: "check_for_understanding",
        learningObjective: "Demonstrate accurate fraction naming on an exit slip.",
        materials: ["Exit slip"],
        checkUnderstanding: "Ask student to draw a circle, shade 1/4, and write the fraction.",
        completed: false,
      },
    ],
    teacherInstructions:
      "Emphasize real-world contexts like sharing a roti, paratha, or chocolate bar equally among family members.",
    reassessmentCriteria:
      "Identify and shade correct fractions on 4 out of 5 novel shapes and collection questions.",
  },

  "c-eng-blend-01": {
    conceptId: "c-eng-blend-01",
    conceptName: "Phonetic Blends (ch, sh, th, wh)",
    subjectCode: "ENG",
    grade: 2,
    learningObjective:
      "Identify, articulate, and decode consonant digraphs /ch/, /sh/, /th/, and /wh/ in spoken and written words.",
    materials: [
      "Phonics flashcards with illustrated picture cues",
      "Small slate or whiteboard with chalk/marker",
      "Digraph sound sorting mat",
    ],
    difficulty: "Beginner",
    estimatedMinutes: 16,
    steps: [
      {
        stepNumber: 1,
        title: "Mouth Position & Sound Articulation",
        description:
          "Demonstrate mouth positions: 'sh' (quiet finger on lips), 'ch' (train puff sound), 'th' (tongue between teeth).",
        durationMinutes: 3,
        activityType: "phonics_drill",
        learningObjective: "Produce the distinct articulatory sounds for target consonant digraphs.",
        materials: ["Mirror or hand in front of mouth"],
        checkUnderstanding: "Have student make each sound in response to teacher gesture.",
        completed: false,
      },
      {
        stepNumber: 2,
        title: "Hands-on Picture Sorting Game",
        description:
          "Student sorts picture cards (ship, chair, thumb, whale, shoe, cheese) onto the correct sound mat.",
        durationMinutes: 4,
        activityType: "matching_game",
        learningObjective: "Associate phonemes with their written digraph symbols.",
        materials: ["12 picture cards", "4 digraph sorting bins/mats"],
        checkUnderstanding: "Watch student sort 'ship' into /sh/ and 'chair' into /ch/.",
        completed: false,
      },
      {
        stepNumber: 3,
        title: "Guided Blending and Reading Aloud",
        description:
          "Blend sounds smoothly: sh-i-p -> ship; ch-i-n -> chin; th-i-n -> thin. Read 4 decodable sentences together.",
        durationMinutes: 3,
        activityType: "guided_practice",
        learningObjective: "Blend individual sounds to read CVC words with digraphs.",
        materials: ["Sentence reading card"],
        checkUnderstanding: "Listen for clean blending without pausing between digraph and vowel.",
        completed: false,
      },
      {
        stepNumber: 4,
        title: "Slate Dictation & Word Building",
        description:
          "Teacher speaks 4 simple words (shop, chop, that, whip) and student writes the initial blend and word on slate.",
        durationMinutes: 3,
        activityType: "independent_practice",
        learningObjective: "Encode spoken digraph words onto slate.",
        materials: ["Slate and chalk"],
        checkUnderstanding: "Check correct spelling of digraphs on student slate.",
        completed: false,
      },
      {
        stepNumber: 5,
        title: "Speed Sound & Word Exit Check",
        description:
          "Flash 5 word cards for quick 3-second reading to verify instant decoding.",
        durationMinutes: 3,
        activityType: "check_for_understanding",
        learningObjective: "Read 5 digraph words accurately without hesitation.",
        materials: ["5 exit word cards"],
        checkUnderstanding: "Student reads at least 4 out of 5 words correctly.",
        completed: false,
      },
    ],
    teacherInstructions:
      "Keep sessions playful. Encourage exaggerated pronunciation and physical gestures for auditory memory.",
    reassessmentCriteria:
      "Student correctly reads 8 out of 10 novel words containing the target digraphs.",
  },

  "c-eng-comp-01": {
    conceptId: "c-eng-comp-01",
    conceptName: "Short Passage Reading Comprehension",
    subjectCode: "ENG",
    grade: 4,
    learningObjective:
      "Read an age-appropriate 60-word passage and locate explicit text evidence to answer Who, What, and Where questions accurately.",
    materials: [
      "Illustrated 60-word reading passage card",
      "Highlighter pen or color pencil",
      "Question-and-answer prompt sheet",
    ],
    difficulty: "Intermediate",
    estimatedMinutes: 20,
    steps: [
      {
        stepNumber: 1,
        title: "Pre-Reading Picture Walk & Prediction",
        description:
          "Look at the illustration and title together. Ask student what they think the story will be about to activate prior knowledge.",
        durationMinutes: 3,
        activityType: "pre_reading",
        learningObjective: "Make text predictions using title and visual cues.",
        materials: ["Passage illustration"],
        checkUnderstanding: "Student makes 1 reasonable prediction about the story character.",
        completed: false,
      },
      {
        stepNumber: 2,
        title: "Choral & Echo Reading with Pacing",
        description:
          "Read the passage once together aloud, modeling expression, phrasing, and pausing at periods and commas.",
        durationMinutes: 4,
        activityType: "guided_reading",
        learningObjective: "Read with adequate phrasing and decoding fluency.",
        materials: ["Passage text sheet"],
        checkUnderstanding: "Check whether student tracks text with finger smoothly.",
        completed: false,
      },
      {
        stepNumber: 3,
        title: "Text Evidence Hunting (Color Underlining)",
        description:
          "Teach the 'text-lookback' technique: underline the exact sentence in the passage that answers 'Who' (green) and 'Where' (blue).",
        durationMinutes: 5,
        activityType: "comprehension_exercise",
        learningObjective: "Locate explicit factual evidence in the text.",
        materials: ["Highlighter / colored pencils"],
        checkUnderstanding: "Verify student points to the exact sentence before writing.",
        completed: false,
      },
      {
        stepNumber: 4,
        title: "Independent Complete Sentence Writing",
        description:
          "Student writes answers in full complete sentences (e.g. 'Raju lives in Rajkot') instead of single-word fragments.",
        durationMinutes: 5,
        activityType: "independent_practice",
        learningObjective: "Construct grammatically complete answer sentences.",
        materials: ["Answer sheet", "Pencil"],
        checkUnderstanding: "Verify answers begin with a capital letter and end with a full stop.",
        completed: false,
      },
      {
        stepNumber: 5,
        title: "Exit Comprehension Check",
        description:
          "Ask 1 unwritten inferential question (e.g. 'Why was the puppy happy at the end?') to verify conceptual understanding.",
        durationMinutes: 3,
        activityType: "check_for_understanding",
        learningObjective: "Answer an inferential question based on story events.",
        materials: ["Oral prompt"],
        checkUnderstanding: "Student provides a logical explanation connected to the story.",
        completed: false,
      },
    ],
    teacherInstructions:
      "Always guide students to verify answers by pointing to the text rather than guessing from memory.",
    reassessmentCriteria:
      "Correctly answer 3 out of 3 factual questions on a new short passage.",
  },

  "c-eng-verb-01": {
    conceptId: "c-eng-verb-01",
    conceptName: "Subject-Verb Agreement",
    subjectCode: "ENG",
    grade: 4,
    learningObjective:
      "Apply correct singular and plural verb forms with pronouns and nouns (e.g., He plays vs They play; She is vs We are).",
    materials: [
      "Pronoun and verb flashcards (He, She, It, They, We)",
      "Sentence strip builders",
      "Practice fill-in-the-blank sheet",
    ],
    difficulty: "Intermediate",
    estimatedMinutes: 18,
    steps: [
      {
        stepNumber: 1,
        title: "Singular vs Plural Subject Identification",
        description:
          "Review subject pronouns. Establish the rule: Singular subjects (He/She/It/Ravi) take verbs ending in -s/-es; Plural subjects (They/We/Boys) do not.",
        durationMinutes: 4,
        activityType: "instructional",
        learningObjective: "Distinguish singular from plural subjects.",
        materials: ["Pronoun chart"],
        checkUnderstanding: "Ask: Is 'The children' singular or plural?",
        completed: false,
      },
      {
        stepNumber: 2,
        title: "Hands-on Sentence Strip Pairing",
        description:
          "Student physically connects subject strips to verb strips (e.g., [The cat] + [runs], [The dogs] + [bark]).",
        durationMinutes: 4,
        activityType: "hands_on",
        learningObjective: "Physically match matching subjects and verbs.",
        materials: ["Cut-out sentence puzzle strips"],
        checkUnderstanding: "Student correctly pairs 4 puzzle pieces without mismatched -s endings.",
        completed: false,
      },
      {
        stepNumber: 3,
        title: "Guided Error Spotting in Sentences",
        description:
          "Read 4 sentences aloud with deliberate mistakes (e.g. 'She play football'). Student rings the bell or claps and corrects the error.",
        durationMinutes: 4,
        activityType: "guided_practice",
        learningObjective: "Detect and correct subject-verb mismatch auditorily.",
        materials: ["Blackboard or sentence cards"],
        checkUnderstanding: "Student identifies the missing 's' and states the corrected sentence.",
        completed: false,
      },
      {
        stepNumber: 4,
        title: "Independent Sentence Completion Worksheet",
        description:
          "Complete 6 fill-in-the-blank sentences choosing between singular and plural verbs (e.g., is/are, has/have, runs/run).",
        durationMinutes: 4,
        activityType: "independent_practice",
        learningObjective: "Apply subject-verb agreement rules in written sentences.",
        materials: ["Worksheet", "Pencil"],
        checkUnderstanding: "Verify student scores at least 5 out of 6 correct.",
        completed: false,
      },
      {
        stepNumber: 5,
        title: "Exit Sentence Creation Check",
        description:
          "Student creates 2 original sentences: 1 with a singular subject and 1 with a plural subject.",
        durationMinutes: 2,
        activityType: "check_for_understanding",
        learningObjective: "Produce original sentences with accurate subject-verb concord.",
        materials: ["Exit slip"],
        checkUnderstanding: "Confirm verb inflections align with the chosen subjects.",
        completed: false,
      },
    ],
    teacherInstructions:
      "Point out that verbs do the opposite of nouns: nouns add 's' for plural, but verbs add 's' for singular (He eats / They eat).",
    reassessmentCriteria:
      "Achieve >= 80% on a 10-question subject-verb agreement diagnostic quiz.",
  },

  "c-guj-matra-01": {
    conceptId: "c-guj-matra-01",
    conceptName: "કાનો-માત્રા અને દીર્ઘ-હ્રસ્વ સ્વર ચિહ્નો (Gujarati Matras)",
    subjectCode: "GUJ",
    grade: 3,
    learningObjective:
      "કાનો (ા), હ્રસ્વ ઇ (િ), દીર્ઘ ઈ (ી), અને માત્રા (ે) ના સાચા ઉચ્ચારણ અને લેખનનું જ્ઞાન મેળવી ભૂલરહિત શબ્દો વાંચવા-લખવા.",
    materials: [
      "ગુજરાતી બાળપોથી ચાર્ટ",
      "માત્રા ફ્લેશકાર્ડ્સ (ા, િ, ી, ે)",
      "સ્લેટ અને ચોક અથવા નોટબુક",
    ],
    difficulty: "Beginner",
    estimatedMinutes: 18,
    steps: [
      {
        stepNumber: 1,
        title: "માત્રા ઉચ્ચારણ અને સ્વર ભેદ પરિચય",
        description:
          "ક + ા = કા, ક + િ = કિ, ક + ી = કી નો સ્પષ્ટ ઉચ્ચારણ ભેદ લંબાઈ સાથે બોલીને સમજાવવો.",
        durationMinutes: 4,
        activityType: "pronunciation",
        learningObjective: "હ્રસ્વ અને દીર્ઘ સ્વરના ઉચ્ચારણનો સમયગાળો અને ભેદ સમજવો.",
        materials: ["બાળપોથી ચાર્ટ"],
        checkUnderstanding: "વિદ્યાર્થી પાસે 'દિન' (દિવસ) અને 'દીન' (ગરીબ) નો ઉચ્ચારણ ભેદ બોલાવવો.",
        completed: false,
      },
      {
        stepNumber: 2,
        title: "મૂર્ત માત્રા કાર્ડ જોડાણ રમત",
        description:
          "મૂળાક્ષર કાર્ડ સાથે માત્રા કાર્ડ જોડી નવો શબ્દ બનાવવો (દા.ત. ત + ા + ર + ા = તારા).",
        durationMinutes: 4,
        activityType: "hands_on",
        learningObjective: "મૂળાક્ષર અને માત્રાના સંયોજનથી સાચા શબ્દોનું નિર્માણ કરવું.",
        materials: ["મૂળાક્ષર અને માત્રા કાર્ડ્સ"],
        checkUnderstanding: "વિદ્યાર્થી કાર્ડ જોડી 'દીવો' શબ્દ બનાવી બતાવે.",
        completed: false,
      },
      {
        stepNumber: 3,
        title: "માર્ગદર્શિત વાંચન અને માત્રા શોધ",
        description:
          "ટૂંકી બાળવાર્તામાંથી કાનો અને દીર્ઘ ઈ વાળા શબ્દો શોધી નીચે લીટી દોરાવવી.",
        durationMinutes: 4,
        activityType: "guided_practice",
        learningObjective: "વાક્યમાંથી ચોક્કસ માત્રા વાળા શબ્દો ઓળખવા.",
        materials: ["વાર્તા પત્રક", "કલર પેન્સિલ"],
        checkUnderstanding: "વિદ્યાર્થી ૩ કાના વાળા શબ્દો ઓળખી મોટેથી વાંચે.",
        completed: false,
      },
      {
        stepNumber: 4,
        title: "ખાલી જગ્યા પૂરો અને શ્રુતલેખન",
        description:
          "વિદ્યાર્થી ૫ અધૂરા શબ્દોમાં સાચી માત્રા મૂકે (દા.ત. ક_તર -> કાતર, દ_વ_ -> દીવો).",
        durationMinutes: 4,
        activityType: "independent_practice",
        learningObjective: "શબ્દોમાં યોગ્ય માત્રા મૂકી સાચું લેખન કરવું.",
        materials: ["વર્કશીટ"],
        checkUnderstanding: "૫ માંથી ઓછામાં ઓછા ૪ શબ્દો સાચા લખાયા છે કે નહીં તે ચકાસવું.",
        completed: false,
      },
      {
        stepNumber: 5,
        title: "ઝડપી એક્ઝિટ ચેક (સ્લેટ પર લખાણ)",
        description:
          "શિક્ષક ૨ સરળ શબ્દો બોલે અને વિદ્યાર્થી સ્લેટ પર સાચી માત્રા સાથે તરત લખી બતાવે.",
        durationMinutes: 2,
        activityType: "check_for_understanding",
        learningObjective: "શ્રુતલેખન દ્વારા માત્રાનું સાચું આકલન દર્શાવવું.",
        materials: ["સ્લેટ અને ચોક"],
        checkUnderstanding: "વિદ્યાર્થી 'મીઠું' અને 'કેળું' સાચી માત્રા સાથે લખે.",
        completed: false,
      },
    ],
    teacherInstructions:
      "હ્રસ્વ અને દીર્ઘ વચ્ચેનો સમય લંબાઈનો ભેદ બોલીને બતાવો. બાળકને ભૂલો પર ડરાવવાને બદલે પ્રોત્સાહિત કરો.",
    reassessmentCriteria:
      "વિદ્યાર્થી ૧૦ શબ્દોમાંથી ૮ શબ્દોમાં યોગ્ય માત્રા લખી અને વાંચી શકે.",
  },

  "c-guj-conj-01": {
    conceptId: "c-guj-conj-01",
    conceptName: "જોડાક્ષર શબ્દોનું વાંચન-લેખન (Gujarati Conjuncts)",
    subjectCode: "GUJ",
    grade: 4,
    learningObjective:
      "બે કે તેથી વધુ વ્યંજનોના જોડાણવાળા જોડાક્ષર શબ્દો (જેમ કે સત્ય, પપ્પા, ચિઠ્ઠી, મિત્ર) ઓળખી શુદ્ધ ઉચ્ચારણ સાથે વાંચવા અને લખવા.",
    materials: [
      "જોડાક્ષર શબ્દ ચાર્ટ",
      "ફ્લેશકાર્ડ્સ (ત્ત, પ્પ, ટ્ઠ, ત્ર, ક્ષ, જ્ઞ)",
      "નોટબુક અને પેન્સિલ",
    ],
    difficulty: "Intermediate",
    estimatedMinutes: 20,
    steps: [
      {
        stepNumber: 1,
        title: "જોડાક્ષર નિર્માણ પરિચય (અડધો અક્ષર)",
        description:
          "અડધો અક્ષર પૂરા અક્ષર સાથે કેવી રીતે જોડાય છે તે બ્લેકબોર્ડ પર સ્પષ્ટ સમજાવવું (ત + ય = ત્ય, પ + પ = પ્પ).",
        durationMinutes: 4,
        activityType: "instructional",
        learningObjective: "અડધા અક્ષર અને જોડાક્ષરની રચના સમજવી.",
        materials: ["બ્લેકબોર્ડ અને રંગીન ચોક"],
        checkUnderstanding: "પૂછો: 'પપ્પા' માં કયો અક્ષર બે વાર જોડાયો છે?",
        completed: false,
      },
      {
        stepNumber: 2,
        title: "મૂર્ત શબ્દ પઝલ જોડાણ",
        description:
          "વિદ્યાર્થી શબ્દ ટુકડા (સ + ત્ય = સત્ય, પુ + સ્તક = પુસ્તક) જોડીને સંપૂર્ણ શબ્દ બનાવે.",
        durationMinutes: 5,
        activityType: "hands_on",
        learningObjective: "જોડાક્ષર ટુકડાઓને જોડી અર્થપૂર્ણ શબ્દ બનાવવો.",
        materials: ["જોડાક્ષર પઝલ કાર્ડ્સ"],
        checkUnderstanding: "વિદ્યાર્થી ૪ જોડાક્ષર શબ્દો સાચી રીતે જોડે.",
        completed: false,
      },
      {
        stepNumber: 3,
        title: "સહિયારું મોટેથી વાંચન (ચોખ્ખો ઉચ્ચાર)",
        description:
          "જોડાક્ષર ધરાવતા ૫ વાક્યો શિક્ષક અને વિદ્યાર્થી સાથે વાંચે, જોડાક્ષર પર યોગ્ય ભાર આપવો.",
        durationMinutes: 4,
        activityType: "guided_practice",
        learningObjective: "વાક્યોમાં જોડાક્ષર શબ્દોનો શુદ્ધ ઉચ્ચાર કરવો.",
        materials: ["વાક્ય પત્રક"],
        checkUnderstanding: "વાંચતી વખતે અક્ષર લોપ ન થાય તેનું ધ્યાન રાખવું.",
        completed: false,
      },
      {
        stepNumber: 4,
        title: "સ્વતંત્ર લેખન અને વાક્ય પ્રયોગ",
        description:
          "વિદ્યાર્થી આપેલા ૩ જોડાક્ષર શબ્દો (મિત્ર, સત્ય, શાળા) નો ઉપયોગ કરીને પોતાના વાક્યો બનાવે.",
        durationMinutes: 4,
        activityType: "independent_practice",
        learningObjective: "જોડાક્ષર શબ્દોનો સ્વતંત્ર વાક્યપ્રયોગ કરવો.",
        materials: ["નોટબુક"],
        checkUnderstanding: "ચકાસો કે જોડાક્ષરનું લેખન મરોડદાર અને સાચું છે.",
        completed: false,
      },
      {
        stepNumber: 5,
        title: "એક્ઝિટ શ્રુતલેખન ચકાસણી",
        description:
          "૩ અજાણ્યા જોડાક્ષર શબ્દોનું શ્રુતલેખન કરાવી તાત્કાલિક સમજણની ખાતરી કરવી.",
        durationMinutes: 3,
        activityType: "check_for_understanding",
        learningObjective: "અજાણ્યા જોડાક્ષર શબ્દોનું સાચું શ્રુતલેખન કરવું.",
        materials: ["એક્ઝિટ સ્લિપ"],
        checkUnderstanding: "વિદ્યાર્થી ૩ માંથી ઓછામાં ઓછા ૨ શબ્દો સંપૂર્ણ સાચા લખે.",
        completed: false,
      },
    ],
    teacherInstructions:
      "જોડાક્ષરના ઉચ્ચારણમાં જીભનું સ્થાન અને વજન સ્પષ્ટ કરાવો. મુશ્કેલ શબ્દોનું વારંવાર અનુકરણ કરાવો.",
    reassessmentCriteria:
      "વિદ્યાર્થી ૧૦ જોડાક્ષર શબ્દોમાંથી ૮ શબ્દોનું સાચું વાંચન અને લેખન કરી શકે.",
  },

  "c-evs-water-01": {
    conceptId: "c-evs-water-01",
    conceptName: "Water Cycle & Conservation",
    subjectCode: "EVS",
    grade: 4,
    learningObjective:
      "Understand evaporation, condensation, precipitation, and identify 3 concrete daily water-saving habits at school and home.",
    materials: [
      "Water cycle cyclical diagram chart",
      "Clear plastic cup, warm water, and ice cubes on lid for demonstration",
      "Water conservation pledge card",
    ],
    difficulty: "Beginner",
    estimatedMinutes: 20,
    steps: [
      {
        stepNumber: 1,
        title: "Mini Cloud in a Cup Tactile Experiment",
        description:
          "Place warm water in a clear cup with an ice-filled lid. Observe water vapor rising (evaporation) and forming droplets on the lid underside (condensation).",
        durationMinutes: 5,
        activityType: "hands_on",
        learningObjective: "Observe evaporation and condensation directly with a simple classroom apparatus.",
        materials: ["Clear plastic cup", "Warm water", "Ice cubes on plastic lid"],
        checkUnderstanding: "Ask: Where did the water droplets under the lid come from?",
        completed: false,
      },
      {
        stepNumber: 2,
        title: "Cyclical Diagram Sequential Labeling",
        description:
          "Label the 4 stages on a large circular diagram: 1. Evaporation (Sun heat), 2. Condensation (Clouds), 3. Precipitation (Rain), 4. Collection (Rivers/Lakes).",
        durationMinutes: 4,
        activityType: "diagram_practice",
        learningObjective: "Sequence the continuous cycle of water through the environment.",
        materials: ["Blank cyclical diagram sheet", "Colored crayons"],
        checkUnderstanding: "Ask student: What makes lake water evaporate into the air?",
        completed: false,
      },
      {
        stepNumber: 3,
        title: "School Water Audit & Conservation Discussion",
        description:
          "Walk to the school drinking water stand. Identify any leaking taps and list 3 practical ways students can conserve water daily.",
        durationMinutes: 4,
        activityType: "discussion",
        learningObjective: "Identify real-world water wastage points and actionable solutions.",
        materials: ["Checklist clipboard"],
        checkUnderstanding: "Ask: What should you do if you see a tap dripping at school?",
        completed: false,
      },
      {
        stepNumber: 4,
        title: "Water Cycle Stage Matching Worksheet",
        description:
          "Student independently completes a worksheet matching definitions and diagrams for evaporation, condensation, and precipitation.",
        durationMinutes: 4,
        activityType: "independent_practice",
        learningObjective: "Match scientific terms to their environmental descriptions.",
        materials: ["Worksheet", "Pencil"],
        checkUnderstanding: "Verify student correctly matches all 4 cycle terms.",
        completed: false,
      },
      {
        stepNumber: 5,
        title: "Personal Water Conservation Pledge & Exit Check",
        description:
          "Student writes 1 concrete personal water saving pledge and answers 2 true/false exit questions.",
        durationMinutes: 3,
        activityType: "check_for_understanding",
        learningObjective: "Articulate a personal conservation commitment and summarize water cycle stages.",
        materials: ["Exit pledge slip"],
        checkUnderstanding: "Student states the 3 key stages of the water cycle correctly aloud.",
        completed: false,
      },
    ],
    teacherInstructions:
      "Connect science concepts directly to the child's village or city context, summer pond drying, and monsoon rainwater harvesting.",
    reassessmentCriteria:
      "Accurately explain 3 stages of the water cycle and score >= 80% on the concept quiz.",
  },

  "c-evs-plant-01": {
    conceptId: "c-evs-plant-01",
    conceptName: "Parts of Plants & Their Functions",
    subjectCode: "EVS",
    grade: 3,
    learningObjective:
      "Identify roots, stem, leaves, flower, and fruits, and explain how roots absorb water and leaves produce food.",
    materials: [
      "Live uprooted small weed/plant with intact roots and leaves",
      "Magnifying hand lens or ruler",
      "Plant diagram labeling sheet",
    ],
    difficulty: "Beginner",
    estimatedMinutes: 18,
    steps: [
      {
        stepNumber: 1,
        title: "Live Plant Tactile Examination",
        description:
          "Hold a small live plant with roots. Let student touch the coarse roots, upright stem, and veins on the green leaves.",
        durationMinutes: 4,
        activityType: "hands_on",
        learningObjective: "Examine physical structures of a real plant specimen.",
        materials: ["Small live weed specimen", "Magnifying lens"],
        checkUnderstanding: "Ask: Why are roots hidden under the soil?",
        completed: false,
      },
      {
        stepNumber: 2,
        title: "Function Story: The Plant's Kitchen and Straw",
        description:
          "Explain the stem as a drinking straw carrying water, roots as anchors drinking from soil, and green leaves as the kitchen making food with sunlight.",
        durationMinutes: 4,
        activityType: "instructional",
        learningObjective: "Relate plant parts to their vital biological functions using analogies.",
        materials: ["Illustrated plant function chart"],
        checkUnderstanding: "Ask: Which part of the plant prepares food using sunlight?",
        completed: false,
      },
      {
        stepNumber: 3,
        title: "Guided Plant Sketch & Anatomical Labeling",
        description:
          "Student sketches a plant in their notebook and draws arrows pointing to Root, Stem, Leaf, Flower, and Fruit with teacher guidance.",
        durationMinutes: 4,
        activityType: "guided_practice",
        learningObjective: "Accurately sketch and label the five principal plant organs.",
        materials: ["Drawing notebook", "Colored pencils"],
        checkUnderstanding: "Check proper labeling alignment and spelling.",
        completed: false,
      },
      {
        stepNumber: 4,
        title: "Matching Plant Parts to Vital Jobs Worksheet",
        description:
          "Complete a matching worksheet pairing each part (Roots, Stem, Leaves, Flower, Seed) to its job.",
        durationMinutes: 3,
        activityType: "independent_practice",
        learningObjective: "Consolidate functional knowledge through structured matching.",
        materials: ["Matching worksheet"],
        checkUnderstanding: "Verify student scores 100% on the 5-item organ-function pairing.",
        completed: false,
      },
      {
        stepNumber: 5,
        title: "Exit Mystery Question",
        description:
          "Teacher asks: 'If a hungry caterpillar eats all the leaves off a plant, what happens to the plant and why?'",
        durationMinutes: 3,
        activityType: "check_for_understanding",
        learningObjective: "Demonstrate cause-and-effect reasoning regarding leaf function.",
        materials: ["Exit slip"],
        checkUnderstanding: "Student explains that without leaves, the plant cannot prepare food to survive.",
        completed: false,
      },
    ],
    teacherInstructions:
      "Use plants found in the school compound. Encourage students to touch leaves, feel stem textures, and smell flowers.",
    reassessmentCriteria:
      "Correctly label 5 plant parts and describe at least 3 functions on a formative evaluation.",
  },
};

/**
 * Subject- and Grade-aware fallback template generator.
 * Produces a complete 5-step concrete remedial sequence for any competency.
 */
function createFallbackTemplate(
  conceptId: string,
  conceptName: string,
  subjectCode: SubjectCode,
  grade: number = 3,
  latestPercentage: number = 40
): ConceptCurriculumTemplate {
  const isMath = subjectCode === "MATH";
  const isEng = subjectCode === "ENG";
  const isGuj = subjectCode === "GUJ";

  const materials = isMath
    ? [
        "20 physical counting counters, bottle caps, or pebbles",
        "Place-value grid or circular grouping mats",
        "Targeted practice worksheet and pencils",
      ]
    : isEng
    ? [
        "Phonics and word flashcards",
        "Sentence builder strips",
        "Small slate and chalk or practice worksheet",
      ]
    : isGuj
    ? [
        "ગુજરાતી બાળપોથી ચાર્ટ અને ફ્લેશકાર્ડ્સ",
        "સ્લેટ-પેન અથવા નોટબુક-પેન્સિલ",
        "સહિયારા વાંચન માટેનું પત્રક",
      ]
    : [
        "Classroom observation chart and diagrams",
        "Real-world specimen or physical model",
        "Interactive reflection sheet",
      ];

  const steps: RemedialStep[] = [
    {
      stepNumber: 1,
      title: "Diagnostic Assessment & Prerequisite Review",
      description: `Review foundational concepts and identify specific misunderstandings in ${conceptName}. Revisit earlier grade prerequisites.`,
      durationMinutes: 4,
      activityType: "discussion",
      learningObjective: `Identify baseline gaps and recall prerequisite skills for ${conceptName}.`,
      materials: [materials[0]],
      checkUnderstanding: `Ask 2 targeted diagnostic questions on prerequisite knowledge for ${conceptName}.`,
      completed: false,
    },
    {
      stepNumber: 2,
      title: "Concrete Manipulatives & Tactile Demonstration",
      description: `Use hands-on physical objects or visual demonstrations to explain the core mechanics of ${conceptName} concretely.`,
      durationMinutes: 5,
      activityType: "hands_on",
      learningObjective: `Model and manipulate concrete physical materials to ground conceptual understanding.`,
      materials: [materials[0], materials[1]],
      checkUnderstanding: `Observe whether student can replicate the physical demonstration independently.`,
      completed: false,
    },
    {
      stepNumber: 3,
      title: "Representational Diagrams & Guided Practice",
      description: `Transition from concrete objects to drawn diagrams or written models. Work through 2 examples together with supportive teacher cues.`,
      durationMinutes: 4,
      activityType: "guided_practice",
      learningObjective: `Connect concrete tactile experience to pictorial and semi-abstract representations.`,
      materials: [materials[1]],
      checkUnderstanding: `Student explains the reasoning behind each step of a guided problem aloud.`,
      completed: false,
    },
    {
      stepNumber: 4,
      title: "Scaffolded Independent Student Practice",
      description: `Student independently completes 4 to 5 targeted practice exercises tailored to their current skill level without teacher hints.`,
      durationMinutes: 5,
      activityType: "independent_practice",
      learningObjective: `Independently execute tasks for ${conceptName} with minimum 80% accuracy.`,
      materials: [materials[2] || "Practice worksheet"],
      checkUnderstanding: `Check worksheet accuracy immediately and guide any required self-corrections.`,
      completed: false,
    },
    {
      stepNumber: 5,
      title: "Formative Reassessment & Exit Verification Check",
      description: `Conduct a quick 2-to-3 question exit ticket check to verify concept retention and readiness to cross the mastery threshold.`,
      durationMinutes: 3,
      activityType: "check_for_understanding",
      learningObjective: `Demonstrate mastery retention on an exit ticket check without teacher intervention.`,
      materials: ["Exit slip or slate"],
      checkUnderstanding: `Student achieves full marks on the exit check, certifying foundational recovery.`,
      completed: false,
    },
  ];

  return {
    conceptId,
    conceptName,
    subjectCode,
    grade,
    learningObjective: `Build solid conceptual understanding and procedural fluency in ${conceptName} through structured 5-step concrete intervention.`,
    materials,
    difficulty: latestPercentage < 45 ? "Beginner" : "Intermediate",
    estimatedMinutes: steps.reduce((sum, s) => sum + s.durationMinutes, 0),
    steps,
    teacherInstructions: `Focus specifically on why the student missed questions during previous assessments (${latestPercentage}%). Provide supportive, patient encouragement and avoid abstract shortcuts before concrete mastery.`,
    reassessmentCriteria: `Student must achieve at least 80% on a parallel formative reassessment for ${conceptName}.`,
  };
}

export interface GeneratePlanOptions {
  studentCode?: string;
  classroomId?: string;
  grade?: number;
  subjectName?: string;
  learningGapId?: string;
  triggeringAssessmentId?: string;
  forceRecreate?: boolean;
}

/**
 * Generates a targeted, actionable 5-Step Remedial Plan for an identified student gap.
 * Works completely offline without paid API keys.
 */
export function generateRemedialPlan(
  studentId: string,
  studentName: string,
  conceptId: string,
  conceptName: string,
  subjectCode: SubjectCode,
  gapDetection: GapDetectionResult,
  customNotes?: string,
  options?: GeneratePlanOptions
): RemedialPlan {
  const grade = options?.grade || 3;
  const rawTemplate =
    CURRICULUM_TEMPLATES[conceptId] ||
    createFallbackTemplate(conceptId, conceptName, subjectCode, grade, gapDetection.latestPercentage);

  // Deep copy the 5 steps so every generated plan has its own completion state
  const steps: RemedialStep[] = rawTemplate.steps.map((s, idx) => ({
    stepNumber: s.stepNumber || idx + 1,
    title: s.title,
    description: s.description,
    durationMinutes: s.durationMinutes,
    activityType: s.activityType || "guided_practice",
    learningObjective:
      s.learningObjective || `Master step ${idx + 1} for ${conceptName}`,
    materials: s.materials && s.materials.length > 0 ? [...s.materials] : [...rawTemplate.materials],
    checkUnderstanding:
      s.checkUnderstanding || `Verify understanding of step ${idx + 1} with a quick prompt.`,
    completed: false,
  }));

  const totalMinutes = steps.reduce((acc, step) => acc + (step.durationMinutes || 0), 0);
  const id = `plan-${studentId}-${conceptId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  // Review date 7 days from now
  const reviewDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return {
    id,
    studentId,
    studentName,
    studentCode: options?.studentCode,
    classroomId: options?.classroomId,
    grade,
    conceptId,
    conceptName,
    subjectCode,
    subjectName: options?.subjectName,
    learningGapId: options?.learningGapId,
    triggeringAssessmentId: options?.triggeringAssessmentId,
    baselineScore: gapDetection.latestPercentage,
    learningObjective: rawTemplate.learningObjective,
    recommendationReason: gapDetection.reason,
    status: "Suggested",
    estimatedMinutes: totalMinutes || rawTemplate.estimatedMinutes || 20,
    difficulty: rawTemplate.difficulty,
    requiredMaterials: [...rawTemplate.materials],
    steps,
    completedStepsCount: 0,
    progressPercentage: 0,
    practiceQuestionsSummary: `${steps.length} structured remedial steps with targeted practice exercises.`,
    reassessmentCriteria: rawTemplate.reassessmentCriteria,
    teacherInstructions: rawTemplate.teacherInstructions,
    teacherNotes: customNotes || "",
    createdAt: now,
    updatedAt: now,
    reviewDate,
  };
}
