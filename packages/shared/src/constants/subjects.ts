import type { SubjectCode } from "../types/assessment";

export const SUBJECT_CODES: SubjectCode[] = ["MATH", "ENG", "GUJ", "EVS", "SCI", "SST", "HIN"];

export const SUBJECT_METADATA: Record<SubjectCode, { name: string; nameGujarati: string; icon: string }> = {
  MATH: { name: "Mathematics", nameGujarati: "ગણિત", icon: "Calculator" },
  ENG: { name: "English", nameGujarati: "અંગ્રેજી", icon: "BookOpen" },
  GUJ: { name: "Gujarati", nameGujarati: "ગુજરાતી", icon: "Languages" },
  EVS: { name: "Environmental Studies", nameGujarati: "પર્યાવરણ", icon: "Trees" },
  SCI: { name: "Science", nameGujarati: "વિજ્ઞાન", icon: "FlaskConical" },
  SST: { name: "Social Science", nameGujarati: "સામાજિક વિજ્ઞાન", icon: "Globe" },
  HIN: { name: "Hindi", nameGujarati: "હિન્દી", icon: "Languages" },
};
