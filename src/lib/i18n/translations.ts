import type { SupportedLanguage } from "../../../packages/shared/src/types/notice";
import { englishDictionary, type DictionaryShape } from "./loader";

import guCommon from "./locales/gu/common.json";
import guDashboard from "./locales/gu/dashboard.json";
import guStudents from "./locales/gu/students.json";
import guAssessments from "./locales/gu/assessments.json";
import guLearningGaps from "./locales/gu/learning-gaps.json";
import guRemedialPlans from "./locales/gu/remedial-plans.json";
import guActivities from "./locales/gu/activities.json";
import guProgress from "./locales/gu/progress.json";
import guReports from "./locales/gu/reports.json";
import guParentBridge from "./locales/gu/parent-bridge.json";
import guSettings from "./locales/gu/settings.json";
import guTutorial from "./locales/gu/tutorial.json";

export type Language = SupportedLanguage;

const gujaratiDictionary = {
  ...guCommon,
  ...guDashboard,
  ...guStudents,
  ...guAssessments,
  ...guLearningGaps,
  ...guRemedialPlans,
  ...guActivities,
  ...guProgress,
  ...guReports,
  ...guParentBridge,
  ...guSettings,
  ...guTutorial,
} as DictionaryShape;

export const translations = {
  en: englishDictionary,
  gu: gujaratiDictionary,
};

// --- DYNAMIC FORMATTING HELPERS ---
import {
  formatClassLabel,
  formatPriorityLabel,
  formatGapStatusLabel,
  formatSubjectLabel,
} from "../learningGapFormatters";

export { formatClassLabel, formatPriorityLabel, formatGapStatusLabel, formatSubjectLabel };

export function formatSubjectName(codeOrName: string, lang: Language): string {
  return formatSubjectLabel(codeOrName, lang);
}

export function formatStatusLabel(status: string, lang: Language): string {
  const norm = (status || "").toLowerCase().trim();
  if (norm.includes("high") || norm.includes("medium") || norm.includes("low")) {
    return formatPriorityLabel(status, lang);
  }
  if (
    norm.includes("needs support") ||
    norm.includes("need support") ||
    norm.includes("developing") ||
    norm.includes("mastered") ||
    norm.includes("mastery")
  ) {
    return formatGapStatusLabel(status, lang);
  }

  if (lang === "gu") {
    if (norm.includes("critical") || norm.includes("urgent")) return "તાકીદનું";
    if (norm.includes("suggested")) return "સૂચવેલ";
    if (norm.includes("approved")) return "મંજૂર થયેલ";
    if (norm.includes("in progress")) return "પ્રગતિમાં";
    if (norm.includes("completed")) return "પૂર્ણ થયેલ";
    if (norm.includes("active")) return "સક્રિય";
    if (norm.includes("resolved")) return "ઉકેલાઈ ગયેલ";
    if (norm.includes("on track")) return "યોગ્ય પ્રગતિ";
    return status;
  }
  if (norm.includes("critical") || norm.includes("urgent")) return "Critical Attention";
  if (norm.includes("suggested")) return "Suggested";
  if (norm.includes("approved")) return "Approved";
  if (norm.includes("in progress")) return "In Progress";
  if (norm.includes("completed")) return "Completed";
  if (norm.includes("active")) return "Active";
  if (norm.includes("resolved")) return "Resolved";
  if (norm.includes("on track")) return "On Track";
  return status;
}

export function formatClassName(
  clsOrGrade: Parameters<typeof formatClassLabel>[0],
  lang: Language,
  section?: Parameters<typeof formatClassLabel>[1]
): string {
  return formatClassLabel(clsOrGrade, section, lang);
}
