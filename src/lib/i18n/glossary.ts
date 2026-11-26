import type { SupportedLanguage, TranslationQualityStatus } from "../../../packages/shared/src/types/notice";

export type GlossaryTermId =
  | "learningGap"
  | "assessment"
  | "mastery"
  | "developing"
  | "needsSupport"
  | "remedialPlan"
  | "progress"
  | "activity"
  | "student"
  | "teacher"
  | "concept"
  | "learningObjective"
  | "parentBridge"
  | "worksheet";

export interface GlossaryEntry {
  id: GlossaryTermId;
  english: string;
  definition: string;
  terms: Partial<
    Record<
      SupportedLanguage,
      {
        term: string;
        quality: TranslationQualityStatus;
      }
    >
  >;
}

/**
 * Standardized primary education terminology dictionary.
 * Prevents inconsistent translations across UI, Learning Gaps, Remedial Plans, AI prompts, and Reports.
 */
export const EDUCATIONAL_GLOSSARY: Record<GlossaryTermId, GlossaryEntry> = {
  learningGap: {
    id: "learningGap",
    english: "Learning Gap",
    definition: "A specific foundational concept or skill below expected mastery.",
    terms: {
      en: { term: "Learning Gap", quality: "Approved" },
      gu: { term: "અધ્યયન ત્રુટિ", quality: "Reviewed" },
      hi: { term: "सीखने की कमी", quality: "Reviewed" },
    },
  },
  assessment: {
    id: "assessment",
    english: "Assessment",
    definition: "Diagnostic or formative check of student understanding.",
    terms: {
      en: { term: "Assessment", quality: "Approved" },
      gu: { term: "મૂલ્યાંકન", quality: "Reviewed" },
      hi: { term: "मूल्यांकन", quality: "Reviewed" },
    },
  },
  mastery: {
    id: "mastery",
    english: "Mastery",
    definition: "Consistent independent demonstration at or above benchmark.",
    terms: {
      en: { term: "Mastery", quality: "Approved" },
      gu: { term: "નિપુણતા", quality: "Reviewed" },
      hi: { term: "निपुणता", quality: "Reviewed" },
    },
  },
  developing: {
    id: "developing",
    english: "Developing",
    definition: "Partial conceptual grasp requiring guided practice.",
    terms: {
      en: { term: "Developing", quality: "Approved" },
      gu: { term: "વિકાસશીલ", quality: "Reviewed" },
      hi: { term: "विकासशील", quality: "Reviewed" },
    },
  },
  needsSupport: {
    id: "needsSupport",
    english: "Needs Support",
    definition: "Requires structured remedial scaffolding and manipulatives.",
    terms: {
      en: { term: "Needs Support", quality: "Approved" },
      gu: { term: "સહાયની જરૂર છે", quality: "Reviewed" },
      hi: { term: "सहायता आवश्यक", quality: "Reviewed" },
    },
  },
  remedialPlan: {
    id: "remedialPlan",
    english: "Remedial Plan",
    definition: "Five-step Concrete-Pictorial-Abstract intervention pathway.",
    terms: {
      en: { term: "Remedial Plan", quality: "Approved" },
      gu: { term: "ઉપચારાત્મક યોજના", quality: "Reviewed" },
      hi: { term: "उपचारात्मक योजना", quality: "Reviewed" },
    },
  },
  progress: {
    id: "progress",
    english: "Progress",
    definition: "Measurable percentage-point change across diagnostic cycles.",
    terms: {
      en: { term: "Progress", quality: "Approved" },
      gu: { term: "પ્રગતિ", quality: "Reviewed" },
      hi: { term: "प्रगति", quality: "Reviewed" },
    },
  },
  activity: {
    id: "activity",
    english: "Activity",
    definition: "Interactive or hands-on practice exercise for students.",
    terms: {
      en: { term: "Activity", quality: "Approved" },
      gu: { term: "પ્રવૃત્તિ", quality: "Reviewed" },
      hi: { term: "गतिविधि", quality: "Reviewed" },
    },
  },
  student: {
    id: "student",
    english: "Student",
    definition: "Enrolled primary learner (Standards 1 to 5).",
    terms: {
      en: { term: "Student", quality: "Approved" },
      gu: { term: "વિદ્યાર્થી", quality: "Reviewed" },
      hi: { term: "विद्यार्थी", quality: "Reviewed" },
    },
  },
  teacher: {
    id: "teacher",
    english: "Teacher",
    definition: "Classroom educator or subject instructor.",
    terms: {
      en: { term: "Teacher", quality: "Approved" },
      gu: { term: "શિક્ષક", quality: "Reviewed" },
      hi: { term: "शिक्षक", quality: "Reviewed" },
    },
  },
  concept: {
    id: "concept",
    english: "Concept",
    definition: "Targeted curriculum competency unit.",
    terms: {
      en: { term: "Concept", quality: "Approved" },
      gu: { term: "સંકલ્પના", quality: "Reviewed" },
      hi: { term: "अवधारणा", quality: "Reviewed" },
    },
  },
  learningObjective: {
    id: "learningObjective",
    english: "Learning Objective",
    definition: "Specific observable educational goal for a lesson or plan.",
    terms: {
      en: { term: "Learning Objective", quality: "Approved" },
      gu: { term: "અધ્યયન હેતુ", quality: "Reviewed" },
      hi: { term: "अधिगम उद्देश्य", quality: "Reviewed" },
    },
  },
  parentBridge: {
    id: "parentBridge",
    english: "Parent Bridge",
    definition: "Multilingual school-to-parent communication portal and notices.",
    terms: {
      en: { term: "Parent Bridge", quality: "Approved" },
      gu: { term: "વાલી સેતુ", quality: "Reviewed" },
      hi: { term: "अभिभावक सेतु", quality: "Reviewed" },
    },
  },
  worksheet: {
    id: "worksheet",
    english: "Worksheet",
    definition: "Printable practice sheet with targeted questions and answer key.",
    terms: {
      en: { term: "Worksheet", quality: "Approved" },
      gu: { term: "કાર્યપત્રક", quality: "Reviewed" },
      hi: { term: "कार्यपत्रक", quality: "Reviewed" },
    },
  },
};

export function getGlossaryTerm(
  termId: GlossaryTermId,
  lang: SupportedLanguage
): string {
  const entry = EDUCATIONAL_GLOSSARY[termId];
  return entry.terms[lang]?.term || entry.english;
}

export function getAllGlossaryEntries(): GlossaryEntry[] {
  return Object.values(EDUCATIONAL_GLOSSARY);
}

export function buildGlossaryInstruction(lang: SupportedLanguage): string {
  const lines = Object.values(EDUCATIONAL_GLOSSARY)
    .map((entry) => {
      const target = entry.terms[lang]?.term;
      return target ? `- ${entry.english}: ${target}` : null;
    })
    .filter(Boolean);

  if (lines.length === 0) return "";
  return `Use these standardized educational terms consistently:\n${lines.join("\n")}`;
}
