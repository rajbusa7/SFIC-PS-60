import { readFileSync, writeFileSync } from "fs";

function patchFile(filePath, patches) {
  let content = readFileSync(filePath, "utf8");
  for (const [search, replace] of patches) {
    if (!content.includes(search)) {
      console.error(`PATCH FAILED: could not find target in ${filePath}:\n${search.slice(0, 120)}`);
      process.exit(1);
    }
    content = content.replace(search, replace);
  }
  writeFileSync(filePath, content, "utf8");
  console.log(`Patched: ${filePath}`);
}

// ── 1. seedData.ts ────────────────────────────────────────────────────────────
const seedPath = "src/lib/db/seedData.ts";
patchFile(seedPath, [
  // 1a. Add classrooms for grades 1 and 2
  [
    `  { id: "cls-3a", schoolId: "sch-gn-01", grade: 3, section: "A", academicYear: "2026-27" },`,
    `  { id: "cls-1a", schoolId: "sch-gn-01", grade: 1, section: "A", academicYear: "2026-27" },\r\n  { id: "cls-2a", schoolId: "sch-gn-01", grade: 2, section: "A", academicYear: "2026-27" },\r\n  { id: "cls-3a", schoolId: "sch-gn-01", grade: 3, section: "A", academicYear: "2026-27" },`,
  ],
  // 1b. Add students for grades 1 and 2 before Class 4-A block
  [
    `export const SEED_STUDENTS: Student[] = [\r\n  // Class 4-A`,
    `export const SEED_STUDENTS: Student[] = [\r\n  // Class 1-A\r\n  {\r\n    id: "std-arjun",\r\n    studentCode: "MPS-1A-01",\r\n    displayName: "Arjun Pandya",\r\n    classroomId: "cls-1a",\r\n    grade: 1,\r\n    section: "A",\r\n    enrollmentStatus: "active",\r\n    notes: "Enthusiastic learner. Strong at number recognition up to 50.",\r\n    createdAt: "2026-06-14T09:00:00Z",\r\n  },\r\n  {\r\n    id: "std-krisha",\r\n    studentCode: "MPS-1A-02",\r\n    displayName: "Krisha Modi",\r\n    classroomId: "cls-1a",\r\n    grade: 1,\r\n    section: "A",\r\n    enrollmentStatus: "active",\r\n    notes: "Needs support with phonics sound mapping.",\r\n    createdAt: "2026-06-14T09:05:00Z",\r\n  },\r\n  // Class 2-A\r\n  {\r\n    id: "std-hetvi",\r\n    studentCode: "MPS-2A-01",\r\n    displayName: "Hetvi Raval",\r\n    classroomId: "cls-2a",\r\n    grade: 2,\r\n    section: "A",\r\n    enrollmentStatus: "active",\r\n    notes: "Good grasp of addition. Needs practice with 2-digit subtraction.",\r\n    createdAt: "2026-06-14T09:10:00Z",\r\n  },\r\n  {\r\n    id: "std-neel",\r\n    studentCode: "MPS-2A-02",\r\n    displayName: "Neel Parmar",\r\n    classroomId: "cls-2a",\r\n    grade: 2,\r\n    section: "A",\r\n    enrollmentStatus: "active",\r\n    createdAt: "2026-06-14T09:15:00Z",\r\n  },\r\n  // Class 4-A`,
  ],
  // 1c. Add assessments for grades 1 and 2 before closing bracket
  [
    `  {\r\n    id: "asm-06",`,
    `  {\r\n    id: "asm-g1-math",\r\n    classroomId: "cls-1a",\r\n    subjectId: "sub-math",\r\n    subjectCode: "MATH",\r\n    title: "Class 1: Number Recognition & Counting",\r\n    assessmentDate: "2026-09-12",\r\n    status: "published",\r\n    maxMarks: 10,\r\n    conceptIds: ["c-math-count-1"],\r\n    createdAt: "2026-09-10T10:00:00Z",\r\n  },\r\n  {\r\n    id: "asm-g1-eng",\r\n    classroomId: "cls-1a",\r\n    subjectId: "sub-eng",\r\n    subjectCode: "ENG",\r\n    title: "Class 1: Alphabet & Phonics Assessment",\r\n    assessmentDate: "2026-09-14",\r\n    status: "published",\r\n    maxMarks: 10,\r\n    conceptIds: ["c-eng-alpha-1"],\r\n    createdAt: "2026-09-12T10:00:00Z",\r\n  },\r\n  {\r\n    id: "asm-g2-math",\r\n    classroomId: "cls-2a",\r\n    subjectId: "sub-math",\r\n    subjectCode: "MATH",\r\n    title: "Class 2: Addition & Subtraction (2-Digit)",\r\n    assessmentDate: "2026-09-16",\r\n    status: "published",\r\n    maxMarks: 15,\r\n    conceptIds: ["c-math-addsub-2"],\r\n    createdAt: "2026-09-14T10:00:00Z",\r\n  },\r\n  {\r\n    id: "asm-g2-eng",\r\n    classroomId: "cls-2a",\r\n    subjectId: "sub-eng",\r\n    subjectCode: "ENG",\r\n    title: "Class 2: Word Formation Assessment",\r\n    assessmentDate: "2026-09-18",\r\n    status: "published",\r\n    maxMarks: 15,\r\n    conceptIds: ["c-eng-word-2"],\r\n    createdAt: "2026-09-16T10:00:00Z",\r\n  },\r\n  {\r\n    id: "asm-06",`,
  ],
  // 1d. Add results for grade 1 and 2 students before closing bracket of SEED_RESULTS
  [
    `  // Kabir Varma (Class 3-A) - Place Value Developing\r\n  {\r\n    id: "res-kabir-01",\r\n    assessmentId: "asm-05",\r\n    studentId: "std-kabir",\r\n    conceptId: "c-place-01",\r\n    marksObtained: 13,\r\n    maximumMarks: 20,\r\n    percentage: 65,\r\n    recordedAt: "2026-09-15T11:00:00Z",\r\n  },\r\n];`,
    `  // Kabir Varma (Class 3-A) - Place Value Developing\r\n  {\r\n    id: "res-kabir-01",\r\n    assessmentId: "asm-05",\r\n    studentId: "std-kabir",\r\n    conceptId: "c-place-01",\r\n    marksObtained: 13,\r\n    maximumMarks: 20,\r\n    percentage: 65,\r\n    recordedAt: "2026-09-15T11:00:00Z",\r\n  },\r\n\r\n  // Arjun Pandya (Class 1-A) - Number Recognition\r\n  {\r\n    id: "res-arjun-01",\r\n    assessmentId: "asm-g1-math",\r\n    studentId: "std-arjun",\r\n    conceptId: "c-math-count-1",\r\n    marksObtained: 8,\r\n    maximumMarks: 10,\r\n    percentage: 80,\r\n    recordedAt: "2026-09-12T11:00:00Z",\r\n  },\r\n  // Arjun Pandya (Class 1-A) - Alphabet & Phonics\r\n  {\r\n    id: "res-arjun-02",\r\n    assessmentId: "asm-g1-eng",\r\n    studentId: "std-arjun",\r\n    conceptId: "c-eng-alpha-1",\r\n    marksObtained: 9,\r\n    maximumMarks: 10,\r\n    percentage: 90,\r\n    recordedAt: "2026-09-14T11:00:00Z",\r\n  },\r\n\r\n  // Krisha Modi (Class 1-A) - Number Recognition\r\n  {\r\n    id: "res-krisha-01",\r\n    assessmentId: "asm-g1-math",\r\n    studentId: "std-krisha",\r\n    conceptId: "c-math-count-1",\r\n    marksObtained: 5,\r\n    maximumMarks: 10,\r\n    percentage: 50,\r\n    notes: "Struggles to identify numbers beyond 20.",\r\n    recordedAt: "2026-09-12T11:00:00Z",\r\n  },\r\n  // Krisha Modi (Class 1-A) - Alphabet & Phonics\r\n  {\r\n    id: "res-krisha-02",\r\n    assessmentId: "asm-g1-eng",\r\n    studentId: "std-krisha",\r\n    conceptId: "c-eng-alpha-1",\r\n    marksObtained: 6,\r\n    maximumMarks: 10,\r\n    percentage: 60,\r\n    recordedAt: "2026-09-14T11:00:00Z",\r\n  },\r\n\r\n  // Hetvi Raval (Class 2-A) - Addition & Subtraction\r\n  {\r\n    id: "res-hetvi-01",\r\n    assessmentId: "asm-g2-math",\r\n    studentId: "std-hetvi",\r\n    conceptId: "c-math-addsub-2",\r\n    marksObtained: 8,\r\n    maximumMarks: 15,\r\n    percentage: 53,\r\n    notes: "Addition correct; subtraction with regrouping needs support.",\r\n    recordedAt: "2026-09-16T11:00:00Z",\r\n  },\r\n  // Hetvi Raval (Class 2-A) - Word Formation\r\n  {\r\n    id: "res-hetvi-02",\r\n    assessmentId: "asm-g2-eng",\r\n    studentId: "std-hetvi",\r\n    conceptId: "c-eng-word-2",\r\n    marksObtained: 12,\r\n    maximumMarks: 15,\r\n    percentage: 80,\r\n    recordedAt: "2026-09-18T11:00:00Z",\r\n  },\r\n\r\n  // Neel Parmar (Class 2-A) - Addition & Subtraction\r\n  {\r\n    id: "res-neel-01",\r\n    assessmentId: "asm-g2-math",\r\n    studentId: "std-neel",\r\n    conceptId: "c-math-addsub-2",\r\n    marksObtained: 12,\r\n    maximumMarks: 15,\r\n    percentage: 80,\r\n    recordedAt: "2026-09-16T11:00:00Z",\r\n  },\r\n  // Neel Parmar (Class 2-A) - Word Formation\r\n  {\r\n    id: "res-neel-02",\r\n    assessmentId: "asm-g2-eng",\r\n    studentId: "std-neel",\r\n    conceptId: "c-eng-word-2",\r\n    marksObtained: 11,\r\n    maximumMarks: 15,\r\n    percentage: 73,\r\n    recordedAt: "2026-09-18T11:00:00Z",\r\n  },\r\n];`,
  ],
  // 1e. Add learning gaps for grade 1 & 2 students below threshold
  [
    `  {\r\n    id: "gap-kabir-place",`,
    `  {\r\n    id: "gap-krisha-count",\r\n    studentId: "std-krisha",\r\n    studentName: "Krisha Modi",\r\n    conceptId: "c-math-count-1",\r\n    conceptName: "Number Recognition & Counting (1-100)",\r\n    subjectCode: "MATH",\r\n    grade: 1,\r\n    priority: "High",\r\n    masteryStatus: "Needs Support",\r\n    reason: "Needs Support: Assessment performance (50%) is below the configured support threshold (60%). Student struggles to identify numbers beyond 20. Concrete number line and counting activities are recommended.",\r\n    suggestedAction: "Use physical number cards and counting objects to reinforce number recognition from 1 to 100.",\r\n    diagnosisType: "Developing / Not Yet Mastered",\r\n    status: "Active",\r\n    attemptsCount: 1,\r\n    latestPercentage: 50,\r\n    updatedAt: "2026-09-12T12:00:00Z",\r\n  },\r\n  {\r\n    id: "gap-hetvi-addsub",\r\n    studentId: "std-hetvi",\r\n    studentName: "Hetvi Raval",\r\n    conceptId: "c-math-addsub-2",\r\n    conceptName: "Addition & Subtraction (2-Digit)",\r\n    subjectCode: "MATH",\r\n    grade: 2,\r\n    priority: "High",\r\n    masteryStatus: "Needs Support",\r\n    reason: "Needs Support: Assessment performance (53%) is below the configured support threshold (60%). Addition is correct but subtraction with regrouping requires targeted support.",\r\n    suggestedAction: "Use base-10 blocks to demonstrate 2-digit subtraction with regrouping step by step.",\r\n    diagnosisType: "Procedural Error",\r\n    status: "Active",\r\n    attemptsCount: 1,\r\n    latestPercentage: 53,\r\n    updatedAt: "2026-09-16T12:00:00Z",\r\n  },\r\n  {\r\n    id: "gap-kabir-place",`,
  ],
]);

// ── 2. translations.ts ────────────────────────────────────────────────────────
const transPath = "src/lib/i18n/translations.ts";
patchFile(transPath, [
  // English header: add class1A and class2A
  [
    `      class3A: "Class 3 - Section A",`,
    `      class1A: "Class 1 - Section A",\r\n      class2A: "Class 2 - Section A",\r\n      class3A: "Class 3 - Section A",`,
  ],
  // English students: add class1 and class2
  [
    `      class3: "Class 3",`,
    `      class1: "Class 1",\r\n      class2: "Class 2",\r\n      class3: "Class 3",`,
  ],
  // English dashboard: totalStudentsDesc
  [
    `      totalStudentsDesc: "Classes 3, 4 & 5",`,
    `      totalStudentsDesc: "Classes 1-5",`,
  ],
  // Gujarati header: add class1A and class2A
  [
    `      class3A: "ધોરણ ૩ - વર્ગ અ",`,
    `      class1A: "ધોરણ ૧ - વિભાગ અ",\r\n      class2A: "ધોરણ ૨ - વિભાગ અ",\r\n      class3A: "ધોરણ ૩ - વર્ગ અ",`,
  ],
  // Gujarati students: add class1 and class2
  [
    `      class3: "ધોરણ ૩",`,
    `      class1: "ધોરણ ૧",\r\n      class2: "ધોરણ ૨",\r\n      class3: "ધોરણ ૩",`,
  ],
]);

// ── 3. AppHeader.tsx ──────────────────────────────────────────────────────────
const headerPath = "src/components/layout/AppHeader.tsx";
patchFile(headerPath, [
  [
    `            <option value="cls-3a">{t.header?.class3A || "Class 3 - Section A"}</option>`,
    `            <option value="cls-1a">{t.header?.class1A || "Class 1 - Section A"}</option>\r\n            <option value="cls-2a">{t.header?.class2A || "Class 2 - Section A"}</option>\r\n            <option value="cls-3a">{t.header?.class3A || "Class 3 - Section A"}</option>`,
  ],
]);

// ── 4. dashboard/page.tsx ─────────────────────────────────────────────────────
const dashboardPath = "src/app/dashboard/page.tsx";
patchFile(dashboardPath, [
  [
    `              <option value="cls-3a">{formatClass("Class 3-A")}</option>`,
    `              <option value="cls-1a">{formatClass("Class 1-A")}</option>\r\n              <option value="cls-2a">{formatClass("Class 2-A")}</option>\r\n              <option value="cls-3a">{formatClass("Class 3-A")}</option>`,
  ],
]);

// ── 5. assessments/new/page.tsx ───────────────────────────────────────────────
const asmNewPath = "src/app/assessments/new/page.tsx";
patchFile(asmNewPath, [
  [
    `                <option value="cls-3a">{formatClass("Class 3 - Section A")}</option>`,
    `                <option value="cls-1a">{formatClass("Class 1 - Section A")}</option>\n                <option value="cls-2a">{formatClass("Class 2 - Section A")}</option>\n                <option value="cls-3a">{formatClass("Class 3 - Section A")}</option>`,
  ],
]);

// ── 6. students/page.tsx ──────────────────────────────────────────────────────
const studentsPath = "src/app/students/page.tsx";
patchFile(studentsPath, [
  [
    `              <option value="3">{language === "gu" ? "ધોરણ ૩" : "Class 3"}</option>`,
    `              <option value="1">{language === "gu" ? "ધોરણ ૧" : "Class 1"}</option>\r\n              <option value="2">{language === "gu" ? "ધોરણ ૨" : "Class 2"}</option>\r\n              <option value="3">{language === "gu" ? "ધોરણ ૩" : "Class 3"}</option>`,
  ],
]);

console.log("\nAll patches applied successfully.");
