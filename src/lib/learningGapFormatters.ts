import type { Language } from "./i18n/translations";
import type { SubjectCode } from "../../packages/shared/src/types";

export type StandardPriority = "High Priority" | "Medium Priority" | "Low Priority";
export type StandardGapStatus = "Needs Support" | "Developing" | "Mastered";

/**
 * Centralized, reusable class-label formatting function.
 * Eliminates invalid labels such as "Class 4-undefined", "Class 3-null", "Class undefined", "Class NaN".
 * Displays class using actual stored class info; appends section ONLY when a valid section exists.
 * Returns empty string for invalid/missing data so it is never displayed as broken text.
 */
export function formatClassLabel(
  gradeOrClass?: any,
  section?: any,
  lang: Language = "en"
): string {
  if (gradeOrClass === null || gradeOrClass === undefined) {
    return "";
  }

  let grade: number | string | undefined = undefined;
  let sec: string | undefined = undefined;

  // Handle object input: { grade, section } or { classNumber, classSection } etc.
  if (typeof gradeOrClass === "object") {
    grade =
      gradeOrClass.grade ??
      gradeOrClass.classNumber ??
      gradeOrClass.classGrade ??
      gradeOrClass.studentClass;
    sec =
      section !== undefined
        ? section
        : gradeOrClass.section ??
          gradeOrClass.classSection ??
          gradeOrClass.studentSection;
  } else if (typeof gradeOrClass === "string") {
    const raw = gradeOrClass.trim();
    if (raw.toLowerCase() === "all") {
      return lang === "gu" ? "બધા વર્ગ" : "All Classes";
    }

    // Clean out malformed tokens like "-undefined", "-null", "-nan", " undefined", etc.
    const cleaned = raw
      .replace(/[-_\s]+(undefined|null|nan)\b/gi, "")
      .replace(/\b(undefined|null|nan)\b/gi, "")
      .trim();

    // Check if numeric grade exists
    const match = cleaned.match(/(?:cls-|class\s*|ધોરણ\s*)?(\d+)(?:[\s\-]*([a-zA-Z]))?/i);
    if (match) {
      grade = match[1];
      if (section !== undefined) {
        sec = String(section);
      } else if (match[2]) {
        sec = match[2];
      }
    } else {
      // If no valid numeric grade exists (e.g. "Class undefined", "Class null", "Class NaN")
      return "";
    }
  } else if (typeof gradeOrClass === "number") {
    if (isNaN(gradeOrClass) || gradeOrClass <= 0) return "";
    grade = gradeOrClass;
    sec = section !== undefined ? String(section) : undefined;
  }

  // Validate grade
  if (grade === undefined || grade === null) return "";
  const numGrade = Number(grade);
  if (isNaN(numGrade) || numGrade <= 0) return "";

  // Validate section: only accept valid real section like "A", "B", "C", "D"
  let cleanSec = "";
  if (sec !== undefined && sec !== null) {
    const s = String(sec).trim();
    const upper = s.toUpperCase();
    if (upper && upper !== "UNDEFINED" && upper !== "NULL" && upper !== "NAN") {
      const matchSec = upper.match(/^[A-Z]$/) || upper.match(/^(?:SECTION\s*)?([A-Z])$/);
      cleanSec = matchSec ? (matchSec[1] || matchSec[0]) : "";
    }
  }

  if (lang === "gu") {
    const gujDigits: Record<string, string> = {
      "1": "૧",
      "2": "૨",
      "3": "૩",
      "4": "૪",
      "5": "૫",
      "6": "૬",
      "7": "૭",
      "8": "૮",
      "9": "૯",
      "0": "૦",
    };
    const gujGrade = String(numGrade)
      .split("")
      .map((d) => gujDigits[d] || d)
      .join("");
    const gujSec =
      cleanSec === "A" ? "અ" : cleanSec === "B" ? "બ" : cleanSec === "C" ? "ક" : cleanSec;
    return cleanSec ? `ધોરણ ${gujGrade}-${gujSec}` : `ધોરણ ${gujGrade}`;
  }

  return cleanSec ? `Class ${numGrade}-${cleanSec}` : `Class ${numGrade}`;
}

/**
 * Standardize priority to exactly one of: "High Priority" | "Medium Priority" | "Low Priority"
 * Programmatically prevents duplicate suffixes such as "Low Priority Priority".
 */
export function normalizePriority(priority?: string | null): StandardPriority {
  const norm = String(priority || "").toLowerCase().trim();
  if (norm.includes("high")) return "High Priority";
  if (norm.includes("low")) return "Low Priority";
  return "Medium Priority";
}

/**
 * Formats priority into standardized English or Gujarati label.
 * Guarantees zero duplicate "Priority" / "અગ્રતા" suffixes.
 */
export function formatPriorityLabel(
  priority: string | null | undefined,
  lang: Language = "en"
): string {
  const normalized = normalizePriority(priority);
  if (lang === "gu") {
    if (normalized === "High Priority") return "ઉચ્ચ અગ્રતા";
    if (normalized === "Low Priority") return "સામાન્ય અગ્રતા";
    return "મધ્યમ અગ્રતા";
  }
  return normalized;
}

/**
 * Standardize learning gap status to exactly one of: "Needs Support" | "Developing" | "Mastered"
 */
export function normalizeGapStatus(status?: string | null): StandardGapStatus {
  const norm = String(status || "").toLowerCase().trim();
  if (
    norm.includes("master") ||
    norm === "resolved" ||
    norm === "completed" ||
    norm.includes("નિપુણ")
  ) {
    return "Mastered";
  }
  if (
    norm.includes("develop") ||
    norm === "under intervention" ||
    norm === "in progress" ||
    norm.includes("વિકાસશીલ")
  ) {
    return "Developing";
  }
  return "Needs Support";
}

/**
 * Formats learning gap status into standardized English or Gujarati label.
 */
export function formatGapStatusLabel(
  status: string | null | undefined,
  lang: Language = "en"
): string {
  const normalized = normalizeGapStatus(status);
  if (lang === "gu") {
    if (normalized === "Mastered") return "નિપુણ";
    if (normalized === "Developing") return "વિકાસશીલ";
    return "સહાયની જરૂર છે";
  }
  return normalized;
}

/**
 * Centralized subject resolver.
 * Ensures learning gaps like "Short Passage Reading Comprehension" and "Subject-Verb Agreement"
 * are mapped to English/Language, and never incorrectly defaulted to Mathematics.
 */
export function resolveSubject(input: any): { code: SubjectCode; name: string } {
  let conceptId = "";
  let conceptName = "";
  let subjectCode = "";
  let subjectName = "";

  if (typeof input === "object" && input !== null) {
    conceptId = String(input.conceptId || input.id || "");
    conceptName = String(input.conceptName || input.title || input.name || "");
    subjectCode = String(input.subjectCode || input.subjectId || "");
    subjectName = String(input.subjectName || input.subject || "");
  } else if (typeof input === "string") {
    const trimmed = input.trim();
    if (trimmed.startsWith("c-")) {
      conceptId = trimmed;
    } else if (["MATH", "ENG", "GUJ", "EVS"].includes(trimmed.toUpperCase())) {
      subjectCode = trimmed.toUpperCase();
    } else {
      conceptName = trimmed;
    }
  }

  // 1. Concept ID specific overrides
  const lowerConcept = conceptId.toLowerCase();
  if (
    lowerConcept.startsWith("c-eng-") ||
    lowerConcept.includes("comp-01") ||
    lowerConcept.includes("verb-01") ||
    lowerConcept.includes("blend-01")
  ) {
    return { code: "ENG", name: "English" };
  }
  if (
    lowerConcept.startsWith("c-guj-") ||
    lowerConcept.includes("matra-01") ||
    lowerConcept.includes("conj-01")
  ) {
    return { code: "GUJ", name: "Gujarati" };
  }
  if (
    lowerConcept.startsWith("c-evs-") ||
    lowerConcept.includes("water-01") ||
    lowerConcept.includes("plant-01") ||
    lowerConcept.includes("comm-01")
  ) {
    return { code: "EVS", name: "Environmental Studies" };
  }
  if (
    lowerConcept.startsWith("c-div-") ||
    lowerConcept.startsWith("c-mult-") ||
    lowerConcept.startsWith("c-place-") ||
    lowerConcept.startsWith("c-frac-")
  ) {
    return { code: "MATH", name: "Mathematics" };
  }

  // 2. Explicit verified subject codes
  const upperCode = subjectCode.toUpperCase().trim();
  if (upperCode === "ENG" || upperCode === "SUB-ENG") return { code: "ENG", name: "English" };
  if (upperCode === "GUJ" || upperCode === "SUB-GUJ") return { code: "GUJ", name: "Gujarati" };
  if (upperCode === "EVS" || upperCode === "SUB-EVS")
    return { code: "EVS", name: "Environmental Studies" };
  if (upperCode === "MATH" || upperCode === "SUB-MATH") return { code: "MATH", name: "Mathematics" };
  if (upperCode === "SCI" || upperCode === "SUB-SCI") return { code: "SCI" as SubjectCode, name: "Science" };
  if (upperCode === "SST" || upperCode === "SUB-SST") return { code: "SST" as SubjectCode, name: "Social Science" };
  if (upperCode === "HIN" || upperCode === "SUB-HIN") return { code: "HIN" as SubjectCode, name: "Hindi" };

  // 3. Keyword analysis from concept/subject names
  const combined = `${conceptName} ${subjectName}`.toLowerCase();
  if (
    combined.includes("reading") ||
    combined.includes("comprehension") ||
    combined.includes("passage") ||
    combined.includes("verb") ||
    combined.includes("phonetic") ||
    combined.includes("grammar") ||
    combined.includes("english") ||
    combined.includes("અંગ્રેજી")
  ) {
    return { code: "ENG", name: "English" };
  }
  if (
    combined.includes("ગુજરાતી") ||
    combined.includes("માત્રા") ||
    combined.includes("જોડાક્ષર") ||
    combined.includes("વાંચન") ||
    combined.includes("લેખન") ||
    combined.includes("gujarati")
  ) {
    return { code: "GUJ", name: "Gujarati" };
  }
  if (
    combined.includes("water") ||
    combined.includes("plant") ||
    combined.includes("environment") ||
    combined.includes("conservation") ||
    combined.includes("sanitation") ||
    combined.includes("community helper") ||
    combined.includes("evs") ||
    combined.includes("પર્યાવરણ")
  ) {
    return { code: "EVS", name: "Environmental Studies" };
  }
  if (
    combined.includes("sci") ||
    combined.includes("science") ||
    combined.includes("વિજ્ઞાન")
  ) {
    return { code: "SCI" as SubjectCode, name: "Science" };
  }
  if (
    combined.includes("sst") ||
    combined.includes("social") ||
    combined.includes("સામાજિક")
  ) {
    return { code: "SST" as SubjectCode, name: "Social Science" };
  }
  if (
    combined.includes("hin") ||
    combined.includes("hindi") ||
    combined.includes("હિન્દી")
  ) {
    return { code: "HIN" as SubjectCode, name: "Hindi" };
  }

  return { code: "MATH", name: "Mathematics" };
}

/**
 * Formats subject name into localized English or Gujarati label.
 */
export function formatSubjectLabel(input: any, lang: Language = "en"): string {
  const resolved = resolveSubject(input);
  if (lang === "gu") {
    switch (resolved.code) {
      case "MATH":
        return "ગણિત";
      case "ENG":
        return "અંગ્રેજી";
      case "GUJ":
        return "ગુજરાતી";
      case "EVS":
        return "પર્યાવરણ (આસપાસ)";
      case "SCI":
        return "વિજ્ઞાન";
      case "SST":
        return "સામાજિક વિજ્ઞાન";
      case "HIN":
        return "હિન્દી";
      default:
        return resolved.name;
    }
  }
  return resolved.name;
}
