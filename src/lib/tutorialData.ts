export interface TourStep {
  id: string;
  titleKey: string;
  descKey: string;
  targetSelector?: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  ctaTextKey?: string;
  ctaAction?: string;
  badgeKey?: string;
}

export interface FAQItem {
  id: string;
  questionEn: string;
  questionGu: string;
  answerEn: string;
  answerGu: string;
  category: "threshold" | "offline" | "printing" | "gap" | "pedagogy";
  keywords: string[];
}

export interface GlossaryItem {
  id: string;
  termEn: string;
  termGu: string;
  defEn: string;
  defGu: string;
  exampleEn: string;
  exampleGu: string;
}

export interface LessonMockup {
  id: string;
  titleEn: string;
  titleGu: string;
  descEn: string;
  descGu: string;
  steps: {
    en: string;
    gu: string;
  }[];
  tag: string;
}

// 1. Dashboard Tour Steps (8 Steps as requested)
export const dashboardTourSteps: TourStep[] = [
  {
    id: "welcome",
    titleKey: "tutorial.tour.dashboard.step1.title",
    descKey: "tutorial.tour.dashboard.step1.desc",
    placement: "center",
    badgeKey: "tutorial.tour.welcomeBadge",
  },
  {
    id: "kpi-tiles",
    titleKey: "tutorial.tour.dashboard.step2.title",
    descKey: "tutorial.tour.dashboard.step2.desc",
    targetSelector: '[data-tour="kpi-tiles"]',
    placement: "bottom",
  },
  {
    id: "immediate-attention",
    titleKey: "tutorial.tour.dashboard.step3.title",
    descKey: "tutorial.tour.dashboard.step3.desc",
    targetSelector: '[data-tour="immediate-attention"]',
    placement: "top",
  },
  {
    id: "curriculum-chart",
    titleKey: "tutorial.tour.dashboard.step4.title",
    descKey: "tutorial.tour.dashboard.step4.desc",
    targetSelector: '[data-tour="curriculum-chart"]',
    placement: "left",
  },
  {
    id: "sidebar-nav",
    titleKey: "tutorial.tour.dashboard.step5.title",
    descKey: "tutorial.tour.dashboard.step5.desc",
    targetSelector: '[data-tour="sidebar-nav"]',
    placement: "right",
  },
  {
    id: "language-toggle",
    titleKey: "tutorial.tour.dashboard.step6.title",
    descKey: "tutorial.tour.dashboard.step6.desc",
    targetSelector: '[data-tour="language-toggle"]',
    placement: "bottom",
  },
  {
    id: "shikshabot-trigger",
    titleKey: "tutorial.tour.dashboard.step7.title",
    descKey: "tutorial.tour.dashboard.step7.desc",
    targetSelector: '[data-tour="shikshabot-trigger"]',
    placement: "left",
  },
  {
    id: "finish",
    titleKey: "tutorial.tour.dashboard.step8.title",
    descKey: "tutorial.tour.dashboard.step8.desc",
    placement: "center",
    ctaTextKey: "tutorial.tour.tryAaravCta",
    ctaAction: "/students/std-aarav",
    badgeKey: "tutorial.tour.finishBadge",
  },
];

// 2. Mini-Tour Steps for Other Key Pages
export const studentsTourSteps: TourStep[] = [
  {
    id: "students-search",
    titleKey: "tutorial.tour.students.searchTitle",
    descKey: "tutorial.tour.students.searchDesc",
    targetSelector: '[data-tour="students-search"]',
    placement: "bottom",
  },
  {
    id: "students-filter",
    titleKey: "tutorial.tour.students.filterTitle",
    descKey: "tutorial.tour.students.filterDesc",
    targetSelector: '[data-tour="students-filter"]',
    placement: "bottom",
  },
  {
    id: "students-table",
    titleKey: "tutorial.tour.students.tableTitle",
    descKey: "tutorial.tour.students.tableDesc",
    targetSelector: '[data-tour="students-table"]',
    placement: "top",
  },
  {
    id: "students-add",
    titleKey: "tutorial.tour.students.addTitle",
    descKey: "tutorial.tour.students.addDesc",
    targetSelector: '[data-tour="students-add"]',
    placement: "left",
  },
];

export const studentDetailTourSteps: TourStep[] = [
  {
    id: "student-scores",
    titleKey: "tutorial.tour.studentDetail.scoresTitle",
    descKey: "tutorial.tour.studentDetail.scoresDesc",
    targetSelector: '[data-tour="student-scores"]',
    placement: "bottom",
  },
  {
    id: "student-gap-reason",
    titleKey: "tutorial.tour.studentDetail.reasonTitle",
    descKey: "tutorial.tour.studentDetail.reasonDesc",
    targetSelector: '[data-tour="student-gap-reason"]',
    placement: "top",
  },
  {
    id: "student-remedial-btn",
    titleKey: "tutorial.tour.studentDetail.planTitle",
    descKey: "tutorial.tour.studentDetail.planDesc",
    targetSelector: '[data-tour="student-remedial-btn"]',
    placement: "left",
  },
  {
    id: "student-reassess-form",
    titleKey: "tutorial.tour.studentDetail.reassessTitle",
    descKey: "tutorial.tour.studentDetail.reassessDesc",
    targetSelector: '[data-tour="student-reassess-form"]',
    placement: "left",
  },
];

export const learningGapsTourSteps: TourStep[] = [
  {
    id: "gaps-threshold",
    titleKey: "tutorial.tour.learningGaps.thresholdTitle",
    descKey: "tutorial.tour.learningGaps.thresholdDesc",
    targetSelector: '[data-tour="gaps-threshold"]',
    placement: "bottom",
  },
  {
    id: "gaps-why-flagged",
    titleKey: "tutorial.tour.learningGaps.whyFlaggedTitle",
    descKey: "tutorial.tour.learningGaps.whyFlaggedDesc",
    targetSelector: '[data-tour="gaps-why-flagged"]',
    placement: "top",
  },
  {
    id: "gaps-action-plan",
    titleKey: "tutorial.tour.learningGaps.actionPlanTitle",
    descKey: "tutorial.tour.learningGaps.actionPlanDesc",
    targetSelector: '[data-tour="gaps-action-plan"]',
    placement: "left",
  },
];

export const remedialPlansTourSteps: TourStep[] = [
  {
    id: "plan-5steps",
    titleKey: "tutorial.tour.remedialPlans.fiveStepsTitle",
    descKey: "tutorial.tour.remedialPlans.fiveStepsDesc",
    targetSelector: '[data-tour="plan-5steps"]',
    placement: "top",
  },
  {
    id: "plan-mark-done",
    titleKey: "tutorial.tour.remedialPlans.markDoneTitle",
    descKey: "tutorial.tour.remedialPlans.markDoneDesc",
    targetSelector: '[data-tour="plan-mark-done"]',
    placement: "left",
  },
  {
    id: "plan-print",
    titleKey: "tutorial.tour.remedialPlans.printTitle",
    descKey: "tutorial.tour.remedialPlans.printDesc",
    targetSelector: '[data-tour="plan-print"]',
    placement: "bottom",
  },
];

export const reportsTourSteps: TourStep[] = [
  {
    id: "report-card",
    titleKey: "tutorial.tour.reports.cardTitle",
    descKey: "tutorial.tour.reports.cardDesc",
    targetSelector: '[data-tour="report-card"]',
    placement: "top",
  },
  {
    id: "report-print",
    titleKey: "tutorial.tour.reports.printTitle",
    descKey: "tutorial.tour.reports.printDesc",
    targetSelector: '[data-tour="report-print"]',
    placement: "bottom",
  },
];

// Map of page route to its tour steps
export const PAGE_TOURS: Record<string, TourStep[]> = {
  dashboard: dashboardTourSteps,
  students: studentsTourSteps,
  studentDetail: studentDetailTourSteps,
  learningGaps: learningGapsTourSteps,
  remedialPlans: remedialPlansTourSteps,
  reports: reportsTourSteps,
};

// 3. Offline FAQ Database (Section D & ShikshaBot Keyword Matcher)
export const TUTORIAL_FAQS: FAQItem[] = [
  {
    id: "faq-threshold",
    questionEn: "What does the 60% mastery threshold mean?",
    questionGu: "૬૦% બેન્ચમાર્ક થ્રેશોલ્ડનો અર્થ શું છે?",
    answerEn:
      "A student scoring below 60% is categorized as 'Needs Support', triggering an automatic learning gap flag. Scores between 60% and 79% indicate 'Developing' proficiency, while scores of 80% and above mark verified 'Mastery'.",
    answerGu:
      "૬૦% થી ઓછા ગુણ મેળવનાર વિદ્યાર્થીને 'સહાયની જરૂર' તરીકે વર્ગીકૃત કરવામાં આવે છે, જેનાથી આપોઆપ લર્નિંગ ગેપ ફ્લેગ થાય છે. ૬૦% થી ૭૯% વચ્ચે 'વિકાસશીલ' અને ૮૦% કે તેથી વધુને 'નિપુણ' માનવામાં આવે છે.",
    category: "threshold",
    keywords: ["60%", "threshold", "mastery", "benchmark", "rule", "ટકા", "બેન્ચમાર્ક", "નિયમ"],
  },
  {
    id: "faq-offline",
    questionEn: "Does ShikshaSetu AI work without internet?",
    questionGu: "શું શિક્ષાસેતુ AI ઇન્ટરનેટ વગર કાર્ય કરે છે?",
    answerEn:
      "Yes! ShikshaSetu AI is engineered as a 100% offline-first Progressive Web App (PWA). All gap rules, 5-step remedial plans, and ShikshaBot pedagogical guidance run locally in your browser with zero paid API dependencies.",
    answerGu:
      "હા! શિક્ષાસેતુ AI સંપૂર્ણપણે 100% ઑફલાઇન PWA તરીકે ડિઝાઇન કરેલ છે. તમામ ત્રુટિ નિયમો, ૫-પગલાંની ઉપચારાત્મક યોજનાઓ અને શિક્ષાબોટ ઇન્ટરનેટ કે પેઇડ API વગર તમારા ઉપકરણમાં ચાલે છે.",
    category: "offline",
    keywords: ["offline", "internet", "pwa", "wifi", "network", "ઑફલાઇન", "નેટ", "ઇન્ટરનેટ"],
  },
  {
    id: "faq-print",
    questionEn: "How do I print worksheets and student report cards?",
    questionGu: "હું વર્કશીટ્સ અને વિદ્યાર્થી રિપોર્ટ કાર્ડ કેવી રીતે પ્રિન્ટ કરી શકું?",
    answerEn:
      "Go to Remedial Plans or Reports, click the 'Print Worksheet' or 'Print Report' button. The system generates high-contrast, clean A4 layouts optimized for Gujarat primary school printers.",
    answerGu:
      "ઉપચાર યોજનાઓ અથવા અહેવાલ પૃષ્ઠ પર જાઓ અને 'પ્રિન્ટ વર્કશીટ' અથવા 'પ્રિન્ટ રિપોર્ટ' બટન પર ક્લિક કરો. તે શાળાના પ્રિન્ટર માટે અનુકૂળ A4 લેઆઉટ આપે છે.",
    category: "printing",
    keywords: ["print", "worksheet", "report", "pdf", "a4", "પ્રિન્ટ", "વર્કશીટ", "અહેવાલ"],
  },
  {
    id: "faq-gap-detection",
    questionEn: "How is a learning gap detected?",
    questionGu: "શિક્ષણ ત્રુટિ (Learning Gap) કેવી રીતે શોધાય છે?",
    answerEn:
      "Our transparent deterministic engine compares diagnostic assessment results against NIPUN Bharat learning outcomes. When a student scores under 60% on any fundamental concept, the engine flags the root cause and suggests targeted interventions.",
    answerGu:
      "અમારું એન્જિન મૂલ્યાંકન પરિણામોની નિપુણ ભારત માપદંડો સાથે સરખામણી કરે છે. જ્યારે કોઈપણ સંકલ્પનામાં ગુણ ૬૦% થી નીચે જાય, ત્યારે સિસ્ટમ કારણ સાથે ઉપાય સૂચવે છે.",
    category: "gap",
    keywords: ["gap", "detect", "algorithm", "reason", "flag", "ત્રુટિ", "ઓળખ", "ગેપ"],
  },
  {
    id: "faq-manipulatives",
    questionEn: "What are concrete manipulatives in 5-step plans?",
    questionGu: "૫-પગલાંની યોજનામાં મૂર્ત સાધનો (Manipulatives) શું છે?",
    answerEn:
      "Concrete manipulatives are tactile physical teaching aids—such as counting beads, bundle-and-sticks, fraction circle cutouts, and number flashcards—used in Steps 1 and 2 to anchor abstract concepts in real-world touch.",
    answerGu:
      "મૂર્ત સાધનો એટલે મણકા, દીવાસળીના જૂથ, અપૂર્ણાંક ચક્રો અને ચિત્ર કાર્ડ જેવા ભૌતિક શિક્ષણ સાધનો, જેના દ્વારા બાળક અમૂર્ત ગણિત કે ભાષાને સ્પર્શ કરી સરળતાથી સમજી શકે છે.",
    category: "pedagogy",
    keywords: ["manipulatives", "concrete", "beads", "counters", "tools", "સાધનો", "મૂર્ત", "મણકા"],
  },
  {
    id: "faq-delta",
    questionEn: "What is percentage-point delta (+pp) in reassessment?",
    questionGu: "પુનઃમૂલ્યાંકનમાં પર્સેન્ટેજ-પોઇન્ટ સુધારો (+pp) શું છે?",
    answerEn:
      "Percentage-point improvement measures the absolute growth from baseline to re-test. For example, Aarav Patel advancing from 35% to 85% is a +50 percentage-point gain, proving the pedagogical effectiveness of the intervention.",
    answerGu:
      "પર્સેન્ટેજ-પોઇન્ટ એ શરૂઆતના ગુણ અને પુનઃમૂલ્યાંકન વચ્ચેનો સીધો સુધારો છે. જેમ કે આરવ પટેલ ૩૫% થી ૮૫% પહોંચ્યો એટલે કે +૫૦ પોઇન્ટ્સનો નોંધપાત્ર સુધારો થયો.",
    category: "pedagogy",
    keywords: ["delta", "pp", "percentage", "gain", "reassess", "સુધારો", "પોઇન્ટ", "ડેલ્ટા"],
  },
];

// 4. Bilingual Glossary of Simple Terms (Section E)
export const TUTORIAL_GLOSSARY: GlossaryItem[] = [
  {
    id: "glossary-mastery",
    termEn: "Mastery (80%+)",
    termGu: "નિપુણતા (૮૦%+)",
    defEn: "When a child can accurately and independently solve problems and explain the reasoning behind a concept.",
    defGu: "જ્યારે બાળક કોઈપણ સંકલ્પનાના પ્રશ્નો કોઈની મદદ વગર ચોકસાઈથી જાતે ઉકેલી શકે.",
    exampleEn: "Aarav scoring 85% in division after using counters.",
    exampleGu: "કાઉન્ટર મણકા વાપર્યા પછી આરવ ભાગાકારમાં ૮૫% મેળવે છે.",
  },
  {
    id: "glossary-gap",
    termEn: "Learning Gap (<60%)",
    termGu: "શિક્ષણ ત્રુટિ / લર્નિંગ ગેપ (<૬૦%)",
    defEn: "A missing foundational understanding that blocks future learning in that subject.",
    defGu: "પાયાની એવી અધૂરી સંકલ્પના જે આગળનું નવું શીખવામાં અડચણરૂપ બને છે.",
    exampleEn: "Adding denominators directly in fractions (1/2 + 1/4 = 2/6).",
    exampleGu: "અપૂર્ણાંકમાં છેદનો સીધો સરવાળો કરી દેવો (૧/૨ + ૧/૪ = ૨/૬).",
  },
  {
    id: "glossary-manipulatives",
    termEn: "Concrete Manipulatives",
    termGu: "મૂર્ત શિક્ષણ સાધનો",
    defEn: "Hands-on physical objects children can touch, count, and arrange to understand abstract ideas.",
    defGu: "બાળકો સ્પર્શી શકે, ગણી શકે અને ગોઠવી શકે તેવા સાધનો (મણકા, પટ્ટીઓ, ક્યુબ્સ).",
    exampleEn: "Dividing 15 physical beads equally among 3 children.",
    exampleGu: "૧૫ મણકાને ૩ બાળકો વચ્ચે સરખા ભાગે વહેંચવા.",
  },
  {
    id: "glossary-delta",
    termEn: "Percentage-Point Delta (+pp)",
    termGu: "પર્સેન્ટેજ-પોઇન્ટ વૃદ્ધિ (+pp)",
    defEn: "The exact numerical increase in score between the first test and the re-test.",
    defGu: "પ્રથમ ટેસ્ટ અને પુનઃટેસ્ટ વચ્ચેનો ચોખ્ખો ટકાવારી તફાવત.",
    exampleEn: "Score rose from 35% to 85% = +50 pp gain.",
    exampleGu: "ગુણ ૩૫% થી વધીને ૮૫% થયા = +૫૦ pp સુધારો.",
  },
  {
    id: "glossary-reassessment",
    termEn: "Diagnostic Reassessment",
    termGu: "ઉપચાર પછી પુનઃમૂલ્યાંકન",
    defEn: "A targeted 3-5 question check given only on the specific weak concept after completing remedial activities.",
    defGu: "૫-પગલાંની ઉપચાર પ્રવૃત્તિ પૂર્ણ થયા પછી માત્ર નબળી સંકલ્પના પર લેવાતી ટૂંકી ચકાસણી.",
    exampleEn: "Testing 5 division sharing word problems to verify understanding.",
    exampleGu: "ભાગાકારની સાચી સમજ ચકાસવા ૫ વ્યવહારિક કોયડા પૂછવા.",
  },
];

// 5. Step-by-Step Lessons for Section B
export const TUTORIAL_LESSONS: LessonMockup[] = [
  {
    id: "lesson-marks",
    titleEn: "1. Entering Diagnostic Scores",
    titleGu: "૧. મૂલ્યાંકન ગુણ નોંધવા",
    descEn: "Record quick paper-based marks in under 30 seconds per student.",
    descGu: "વિદ્યાર્થી દીઠ ફક્ત ૩૦ સેકન્ડમાં મૂલ્યાંકન ગુણ નોંધો.",
    steps: [
      { en: "Open Assessments page or a student profile", gu: "મૂલ્યાંકન પૃષ્ઠ અથવા વિદ્યાર્થી પ્રોફાઇલ ખોલો" },
      { en: "Select Subject, Concept, and total marks", gu: "વિષય, સંકલ્પના અને કુલ ગુણ પસંદ કરો" },
      { en: "Enter obtained marks; percentage calculates automatically", gu: "મેળવેલા ગુણ દાખલ કરો; ટકાવારી આપોઆપ ગણાશે" },
    ],
    tag: "Assessment",
  },
  {
    id: "lesson-gap",
    titleEn: "2. Reading a Learning Gap Flag",
    titleGu: "૨. લર્નિંગ ગેપ ફ્લેગ સમજવો",
    descEn: "Inspect pedagogical root causes behind student misconceptions.",
    descGu: "વિદ્યાર્થીની ભૂલ પાછળનું સાચું કારણ જાણી શકાય છે.",
    steps: [
      { en: "Any score < 60% is automatically flagged", gu: "૬૦% થી ઓછા કોઈપણ ગુણ આપોઆપ ફ્લેગ થશે" },
      { en: "Read the transparent pedagogical reasoning", gu: "શિક્ષણશાસ્ત્ર આધારિત સ્પષ્ટ કારણ વાંચો" },
      { en: "See suggested concrete remediation actions", gu: "સૂચવેલ મૂર્ત ઉપચારાત્મક પગલાં જુઓ" },
    ],
    tag: "Gap Engine",
  },
  {
    id: "lesson-plan",
    titleEn: "3. Generating 5-Step Remedial Plans",
    titleGu: "૩. ૫-પગલાંની ઉપચાર યોજના બનાવવી",
    descEn: "Turn diagnostic gaps into structured 5-step concrete teaching steps.",
    descGu: "ત્રુટિઓને ક્રમબદ્ધ ૫-પગલાંના મૂર્ત શિક્ષણમાં રૂપાંતરિત કરો.",
    steps: [
      { en: "Click 'Generate Remedial Plan' on the gap card", gu: "ગેપ કાર્ડ પર 'ઉપચાર યોજના બનાવો' ક્લિક કરો" },
      { en: "Step 1-2: Concrete physical manipulatives (beads, rods)", gu: "પગલું ૧-૨: મૂર્ત ભૌતિક સાધનો (મણકા, સળીઓ)" },
      { en: "Step 3-4: Visual diagrams, flashcards, and paired practice", gu: "પગલું ૩-૪: ચિત્રો, ફ્લેશકાર્ડ્સ અને જોડી પ્રવૃત્તિ" },
    ],
    tag: "Remedial Plan",
  },
  {
    id: "lesson-quiz",
    titleEn: "4. Running Interactive Activities",
    titleGu: "૪. ઇન્ટરેક્ટિવ પ્રવૃત્તિઓ કરાવવી",
    descEn: "Let students practice on school tablets or smartphones with audio prompts.",
    descGu: "વિદ્યાર્થીઓને શાળાના ટેબલેટ કે ફોન પર અવાજ સાથે પ્રેક્ટિસ કરાવો.",
    steps: [
      { en: "Open Activities and select the matching concept", gu: "પ્રવૃત્તિઓ ખોલો અને સંકલ્પના પસંદ કરો" },
      { en: "Engage with visual drag-and-drop or multiple choice", gu: "ચિત્રો સાથે સરળ પ્રશ્નોત્તરી ઉકેલો" },
      { en: "Instant celebratory feedback builds student morale", gu: "તરત જ મળતો પ્રોત્સાહક પ્રતિભાવ બાળકનો ઉત્સાહ વધારે છે" },
    ],
    tag: "Activities",
  },
  {
    id: "lesson-reassess",
    titleEn: "5. Formative Reassessment & Delta",
    titleGu: "૫. પુનઃમૂલ્યાંકન અને સુધારો નોંધવો",
    descEn: "Document student growth objectively with percentage-point deltas.",
    descGu: "વિદ્યાર્થીનો સુધારો ચોક્કસ પર્સેન્ટેજ-પોઇન્ટ્સ સાથે નોંધો.",
    steps: [
      { en: "Click 'Reassess Delta' once remediation is finished", gu: "ઉપચાર કાર્ય પૂર્ણ થયા પછી 'પુનઃમૂલ્યાંકન' ક્લિક કરો" },
      { en: "Enter post-intervention test score", gu: "ઉપચાર પછીના ટેસ્ટના ગુણ દાખલ કરો" },
      { en: "The bridge turns green and celebrates verified mastery (+pp)", gu: "સેતુ લીલો થશે અને નિપુણતા ઉજવાશે (+pp)" },
    ],
    tag: "Reassessment",
  },
  {
    id: "lesson-print",
    titleEn: "6. Printing Worksheets & Reports",
    titleGu: "૬. વર્કશીટ અને રિપોર્ટ પ્રિન્ટ કરવા",
    descEn: "One-click clean A4 printable layouts for paper-first classrooms.",
    descGu: "કાગળ-આધારિત વર્ગખંડો માટે એક ક્લિકમાં સ્વચ્છ A4 પ્રિન્ટ.",
    steps: [
      { en: "Click 'Print Worksheet' on any active remedial plan", gu: "કોઈપણ ઉપચાર યોજના પર 'પ્રિન્ટ વર્કશીટ' ક્લિક કરો" },
      { en: "Select 'Reports' to view comprehensive student portfolios", gu: "વિગતવાર પોર્ટફોલિયો જોવા 'અહેવાલ' પસંદ કરો" },
      { en: "Fits perfectly on single A4 sheet with zero ink waste", gu: "શાળાના સામાન્ય કાગળ પર સ્વચ્છ રીતે પ્રિન્ટ થાય છે" },
    ],
    tag: "Print & Share",
  },
];

// 6. Rural Classroom Quick Tips (Section F)
export const RURAL_TIPS = [
  {
    id: "tip-offline",
    titleEn: "100% Offline Capability",
    titleGu: "સંપૂર્ણ ઑફલાઇન ક્ષમતા",
    descEn: "No internet needed in the classroom. Add to Home Screen (PWA) and use without data.",
    descGu: "વર્ગખંડમાં નેટની જરૂર નથી. હોમ સ્ક્રીન પર ઉમેરીને ઑફલાઇન ચલાવો.",
    icon: "WifiOff",
  },
  {
    id: "tip-print",
    titleEn: "Paper-Friendly Printable Sheets",
    titleGu: "પ્રિન્ટ માટે અનુકૂળ કાગળ શીટ્સ",
    descEn: "Print student worksheets and take-home parent slips from the school desktop once a week.",
    descGu: "અઠવાડિયે એક વાર શાળાના કમ્પ્યુટર પરથી વર્કશીટ્સ પ્રિન્ટ કરી શકો છો.",
    icon: "Printer",
  },
  {
    id: "tip-manipulatives",
    titleEn: "Local Classroom Manipulatives",
    titleGu: "વર્ગખંડના સ્થાનિક મૂર્ત સાધનો",
    descEn: "Use local stones, matchsticks, clay beads, and bottle caps for Step 1 & 2 activities.",
    descGu: "પગલું ૧ અને ૨ માટે કાંકરા, દીવાસળી, માટીના મણકા કે ઢાંકણા વાપરી શકાય છે.",
    icon: "Boxes",
  },
  {
    id: "tip-multigrade",
    titleEn: "Multi-Grade Teacher Sharing",
    titleGu: "બહુવર્ગીય શિક્ષણમાં ઉપયોગી",
    descEn: "Group students across Class 3-5 who share the same foundational gap into 1 remedial cohort.",
    descGu: "ધોરણ ૩ થી ૫ ના સમાન મુશ્કેલી ધરાવતા બાળકોનું એક જૂથ બનાવી સાથે ઉપચાર કરાવો.",
    icon: "Users",
  },
];
