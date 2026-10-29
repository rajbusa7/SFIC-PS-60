import fs from "fs";
import path from "path";
import {
  SEED_SCHOOL,
  SEED_SETTINGS,
  SEED_CLASSROOMS,
  SEED_SUBJECTS,
  SEED_CONCEPTS,
  SEED_STUDENTS,
  SEED_ASSESSMENTS,
  SEED_RESULTS,
  SEED_LEARNING_GAPS,
  SEED_REMEDIAL_PLANS,
  SEED_ACTIVITIES,
  SEED_WORKSHEETS,
} from "./seedData";
import { detectLearningGap } from "../engine/gapDetection";
import { generateRemedialPlan } from "../engine/remedialEngine";
import { calculatePercentage } from "../engine/calculations";
import type {
  School,
  SchoolSettings,
  Classroom,
  Subject,
  SubjectCode,
  Concept,
  Student,
  Assessment,
  AssessmentResult,
  LearningGap,
  GapPriority,
  GapStatus,
  MasteryStatus,
  RemedialPlan,
  LearningActivity,
  ActivityAttempt,
  WorksheetData,
} from "../types";

export interface LearningGapFilter {
  studentId?: string;
  classroomId?: string;
  grade?: number;
  subjectCode?: SubjectCode;
  conceptId?: string;
  priority?: GapPriority;
  status?: GapStatus;
  masteryStatus?: MasteryStatus;
}

interface DataStore {
  school: School;
  settings: SchoolSettings;
  classrooms: Classroom[];
  subjects: Subject[];
  concepts: Concept[];
  students: Student[];
  assessments: Assessment[];
  results: AssessmentResult[];
  learningGaps: LearningGap[];
  remedialPlans: RemedialPlan[];
  activities: LearningActivity[];
  attempts: ActivityAttempt[];
  worksheets: WorksheetData[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "shikshasetu_store.json");

function getInitialStore(): DataStore {
  return {
    school: { ...SEED_SCHOOL },
    settings: { ...SEED_SETTINGS },
    classrooms: [...SEED_CLASSROOMS],
    subjects: [...SEED_SUBJECTS],
    concepts: [...SEED_CONCEPTS],
    students: [...SEED_STUDENTS],
    assessments: [...SEED_ASSESSMENTS],
    results: [...SEED_RESULTS],
    learningGaps: [...SEED_LEARNING_GAPS],
    remedialPlans: [...SEED_REMEDIAL_PLANS],
    activities: [...SEED_ACTIVITIES],
    attempts: [],
    worksheets: [...SEED_WORKSHEETS],
  };
}

let memoryStore: DataStore | null = null;

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function retryFs<T>(fn: () => T, retries = 5, delay = 20): T {
  for (let i = 0; i < retries; i++) {
    try {
      return fn();
    } catch (err: any) {
      if ((err.code === "EBUSY" || err.code === "EPERM") && i < retries - 1) {
        const start = Date.now();
        while (Date.now() - start < delay) {}
        continue;
      }
      throw err;
    }
  }
  return fn();
}

function loadStore(): DataStore {
  if (memoryStore) return memoryStore;

  ensureDataDirectory();

  if (fs.existsSync(STORE_FILE)) {
    try {
      const content = retryFs(() => fs.readFileSync(STORE_FILE, "utf-8"));
      memoryStore = JSON.parse(content) as DataStore;
      if (!memoryStore.worksheets) {
        memoryStore.worksheets = [...SEED_WORKSHEETS];
      }
      return memoryStore;
    } catch (e) {
      console.error("Failed to load store from disk, initializing fresh seed:", e);
    }
  }

  memoryStore = getInitialStore();
  saveStore(memoryStore);
  return memoryStore;
}

function saveStore(store: DataStore) {
  ensureDataDirectory();
  const json = JSON.stringify(store, null, 2);
  retryFs(() => {
    fs.writeFileSync(STORE_FILE, json, "utf-8");
  });
  memoryStore = store;
}

export const db = {
  getSchool(): School {
    return loadStore().school;
  },

  getSettings(): SchoolSettings {
    return loadStore().settings;
  },

  updateSettings(updates: Partial<SchoolSettings>): SchoolSettings {
    const store = loadStore();
    store.settings = { ...store.settings, ...updates };
    saveStore(store);
    return store.settings;
  },

  getClassrooms(): Classroom[] {
    return loadStore().classrooms;
  },

  getSubjects(): Subject[] {
    return loadStore().subjects;
  },

  getConcepts(subjectId?: string): Concept[] {
    const store = loadStore();
    if (!subjectId) return store.concepts;
    return store.concepts.filter((c) => c.subjectId === subjectId);
  },

  getConceptById(id: string): Concept | undefined {
    return loadStore().concepts.find((c) => c.id === id);
  },

  getStudents(classroomId?: string): Student[] {
    const store = loadStore();
    if (!classroomId) return store.students;
    return store.students.filter((s) => s.classroomId === classroomId);
  },

  getStudentById(id: string): Student | undefined {
    return loadStore().students.find((s) => s.id === id);
  },

  getStudentByCode(studentCode: string): Student | undefined {
    const clean = studentCode.trim().toLowerCase();
    return loadStore().students.find((s) => s.studentCode.trim().toLowerCase() === clean);
  },

  addStudent(studentData: Omit<Student, "id" | "createdAt"> & { id?: string }): Student {
    const store = loadStore();
    const cleanCode = studentData.studentCode?.trim();
    if (!cleanCode) {
      throw new Error("Student code is required");
    }
    const cleanName = studentData.displayName?.trim();
    if (!cleanName) {
      throw new Error("Student full name is required");
    }

    const duplicate = store.students.find(
      (s) => s.studentCode.trim().toLowerCase() === cleanCode.toLowerCase()
    );
    if (duplicate) {
      throw new Error(`Student with ID/Code '${cleanCode}' already exists`);
    }

    const grade = Number(studentData.grade) || 4;
    const section = (studentData.section || "A").toUpperCase();
    const classroomId = studentData.classroomId || `cls-${grade}${section.toLowerCase()}`;

    // Ensure classroom exists in store.classrooms
    const existingClassroom = store.classrooms.find((c) => c.id === classroomId);
    if (!existingClassroom) {
      store.classrooms.push({
        id: classroomId,
        schoolId: store.school.id || "sch-gn-01",
        grade,
        section,
        academicYear: "2026-27",
      });
    }

    const newStudent: Student = {
      ...studentData,
      id: studentData.id || `std-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      studentCode: cleanCode,
      displayName: cleanName,
      grade,
      section,
      classroomId,
      enrollmentStatus: studentData.enrollmentStatus || "active",
      notes: studentData.notes || "",
      createdAt: new Date().toISOString(),
    };
    store.students.push(newStudent);
    saveStore(store);
    return newStudent;
  },

  updateStudent(id: string, updates: Partial<Student>): Student | null {
    const store = loadStore();
    const index = store.students.findIndex((s) => s.id === id);
    if (index === -1) return null;

    if (updates.studentCode !== undefined) {
      const cleanCode = updates.studentCode.trim();
      if (!cleanCode) {
        throw new Error("Student code cannot be empty");
      }
      const duplicate = store.students.find(
        (s) => s.id !== id && s.studentCode.trim().toLowerCase() === cleanCode.toLowerCase()
      );
      if (duplicate) {
        throw new Error(`Student ID '${cleanCode}' is already in use by another student`);
      }
      updates.studentCode = cleanCode;
    }

    if (updates.displayName !== undefined) {
      const cleanName = updates.displayName.trim();
      if (!cleanName) {
        throw new Error("Student full name cannot be empty");
      }
      updates.displayName = cleanName;
    }

    if (updates.grade !== undefined || updates.section !== undefined) {
      const newGrade = updates.grade !== undefined ? Number(updates.grade) : store.students[index].grade;
      const newSection = (updates.section !== undefined ? updates.section : store.students[index].section).toUpperCase();
      const classroomId = updates.classroomId || `cls-${newGrade}${newSection.toLowerCase()}`;
      updates.grade = newGrade;
      updates.section = newSection;
      updates.classroomId = classroomId;

      const existingClassroom = store.classrooms.find((c) => c.id === classroomId);
      if (!existingClassroom) {
        store.classrooms.push({
          id: classroomId,
          schoolId: store.school.id || "sch-gn-01",
          grade: newGrade,
          section: newSection,
          academicYear: "2026-27",
        });
      }
    }

    store.students[index] = { ...store.students[index], ...updates };
    saveStore(store);
    return store.students[index];
  },

  deleteStudent(id: string): boolean {
    const store = loadStore();
    const beforeLen = store.students.length;
    store.students = store.students.filter((s) => s.id !== id);
    if (store.students.length !== beforeLen) {
      // Cascading deletion of related records (foreign key integrity)
      store.results = store.results.filter((r) => r.studentId !== id);
      store.learningGaps = store.learningGaps.filter((g) => g.studentId !== id);
      store.remedialPlans = store.remedialPlans.filter((p) => p.studentId !== id);
      store.attempts = store.attempts.filter((a) => a.studentId !== id);
      saveStore(store);
      return true;
    }
    return false;
  },

  getAssessments(classroomId?: string): Assessment[] {
    const store = loadStore();
    if (!classroomId) return store.assessments;
    return store.assessments.filter((a) => a.classroomId === classroomId);
  },

  getAssessmentById(id: string): Assessment | undefined {
    return loadStore().assessments.find((a) => a.id === id);
  },

  createAssessment(
    assessmentData: Omit<Assessment, "id" | "createdAt">,
    initialResults?: Omit<AssessmentResult, "id" | "assessmentId">[]
  ): Assessment {
    const store = loadStore();
    const maxMarks = Number(assessmentData.maxMarks);
    if (isNaN(maxMarks) || maxMarks <= 0) {
      throw new Error("Maximum marks must be greater than zero");
    }

    // Safe deduplication: check if an identical assessment already exists (prevent duplicate submission)
    const existing = store.assessments.find(
      (a) =>
        a.title.trim().toLowerCase() === assessmentData.title.trim().toLowerCase() &&
        a.classroomId === assessmentData.classroomId &&
        a.assessmentDate === assessmentData.assessmentDate &&
        a.subjectCode === assessmentData.subjectCode
    );

    const assessmentId = existing ? existing.id : `asm-${Date.now()}`;
    const newAssessment: Assessment = {
      ...assessmentData,
      maxMarks,
      id: assessmentId,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };

    if (existing) {
      const idx = store.assessments.findIndex((a) => a.id === existing.id);
      store.assessments[idx] = newAssessment;
    } else {
      store.assessments.push(newAssessment);
    }

    if (initialResults && initialResults.length > 0) {
      for (const res of initialResults) {
        const marksObtained = Number(res.marksObtained);
        if (isNaN(marksObtained) || marksObtained < 0) {
          throw new Error("Marks obtained cannot be negative");
        }
        if (marksObtained > maxMarks) {
          throw new Error(`Marks obtained (${marksObtained}) cannot exceed maximum marks (${maxMarks})`);
        }

        const pct = calculatePercentage(marksObtained, maxMarks);

        // Check if a result already exists for this assessment, student, and concept
        const existingResIndex = store.results.findIndex(
          (r) =>
            r.assessmentId === assessmentId &&
            r.studentId === res.studentId &&
            r.conceptId === res.conceptId
        );

        if (existingResIndex !== -1) {
          store.results[existingResIndex] = {
            ...store.results[existingResIndex],
            marksObtained,
            maximumMarks: maxMarks,
            percentage: pct,
            notes: res.notes ?? store.results[existingResIndex].notes,
            recordedAt: res.recordedAt || store.results[existingResIndex].recordedAt,
          };
        } else {
          const resultRecord: AssessmentResult = {
            ...res,
            id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            assessmentId,
            marksObtained,
            maximumMarks: maxMarks,
            percentage: pct,
            recordedAt: res.recordedAt || new Date().toISOString(),
          };
          store.results.push(resultRecord);
        }
      }
    }

    saveStore(store);

    // Recalculate learning gaps for affected students
    if (initialResults) {
      const studentIds = Array.from(new Set(initialResults.map((r) => r.studentId)));
      for (const sId of studentIds) {
        this.recalculateLearningGapsForStudent(sId);
      }
    }

    return newAssessment;
  },

  updateAssessment(
    id: string,
    updates: Partial<Assessment>,
    resultsUpdates?: { studentId: string; conceptId?: string; marksObtained: number; notes?: string }[]
  ): Assessment | null {
    const store = loadStore();
    const index = store.assessments.findIndex((a) => a.id === id);
    if (index === -1) return null;

    const current = store.assessments[index];
    const newMaxMarks = updates.maxMarks !== undefined ? Number(updates.maxMarks) : current.maxMarks;
    if (newMaxMarks <= 0) {
      throw new Error("Maximum marks must be greater than zero");
    }

    store.assessments[index] = {
      ...current,
      ...updates,
      maxMarks: newMaxMarks,
    };

    const affectedStudents = new Set<string>();

    // Update associated results if resultsUpdates provided
    if (resultsUpdates && resultsUpdates.length > 0) {
      const primaryConceptId = updates.conceptIds?.[0] || current.conceptIds[0];

      for (const rUpdate of resultsUpdates) {
        const conceptId = rUpdate.conceptId || primaryConceptId;
        const marksObtained = Number(rUpdate.marksObtained);
        if (isNaN(marksObtained) || marksObtained < 0) {
          throw new Error("Marks obtained cannot be negative");
        }
        if (marksObtained > newMaxMarks) {
          throw new Error(`Marks obtained (${marksObtained}) cannot exceed maximum marks (${newMaxMarks})`);
        }

        const pct = calculatePercentage(marksObtained, newMaxMarks);
        const existingResIndex = store.results.findIndex(
          (r) => r.assessmentId === id && r.studentId === rUpdate.studentId && r.conceptId === conceptId
        );

        if (existingResIndex !== -1) {
          store.results[existingResIndex] = {
            ...store.results[existingResIndex],
            marksObtained,
            maximumMarks: newMaxMarks,
            percentage: pct,
            notes: rUpdate.notes !== undefined ? rUpdate.notes : store.results[existingResIndex].notes,
          };
        } else {
          store.results.push({
            id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            assessmentId: id,
            studentId: rUpdate.studentId,
            conceptId,
            marksObtained,
            maximumMarks: newMaxMarks,
            percentage: pct,
            notes: rUpdate.notes || "",
            recordedAt: updates.assessmentDate || current.assessmentDate || new Date().toISOString(),
          });
        }
        affectedStudents.add(rUpdate.studentId);
      }
    } else if (updates.maxMarks !== undefined) {
      // Recalculate percentage for all existing results under this assessment if maxMarks changed
      store.results = store.results.map((res) => {
        if (res.assessmentId === id) {
          affectedStudents.add(res.studentId);
          return {
            ...res,
            maximumMarks: newMaxMarks,
            percentage: calculatePercentage(res.marksObtained, newMaxMarks),
          };
        }
        return res;
      });
    }

    saveStore(store);

    for (const sId of affectedStudents) {
      this.recalculateLearningGapsForStudent(sId);
    }

    return store.assessments[index];
  },

  deleteAssessment(id: string): boolean {
    const store = loadStore();
    const beforeLen = store.assessments.length;
    store.assessments = store.assessments.filter((a) => a.id !== id);
    if (store.assessments.length !== beforeLen) {
      // Find affected students before removing results
      const affectedStudentIds = Array.from(
        new Set(store.results.filter((r) => r.assessmentId === id).map((r) => r.studentId))
      );

      // Cascade remove results
      store.results = store.results.filter((r) => r.assessmentId !== id);
      saveStore(store);

      // Recalculate gaps
      for (const sId of affectedStudentIds) {
        this.recalculateLearningGapsForStudent(sId);
      }
      return true;
    }
    return false;
  },

  getResults(studentId?: string, conceptId?: string, assessmentId?: string): AssessmentResult[] {
    const store = loadStore();
    let res = store.results;
    if (studentId) res = res.filter((r) => r.studentId === studentId);
    if (conceptId) res = res.filter((r) => r.conceptId === conceptId);
    if (assessmentId) res = res.filter((r) => r.assessmentId === assessmentId);

    const asmMap = new Map(store.assessments.map((a) => [a.id, a]));
    const conceptMap = new Map(store.concepts.map((c) => [c.id, c]));

    return res.map((r) => {
      const asm = asmMap.get(r.assessmentId);
      const concept = conceptMap.get(r.conceptId);
      return {
        ...r,
        assessmentTitle: asm?.title || r.assessmentTitle || "Assessment",
        subjectCode: (asm?.subjectCode || concept?.subjectCode || r.subjectCode || "MATH") as SubjectCode,
        conceptName: concept?.name || r.conceptName || r.conceptId,
      };
    });
  },

  recordResults(resultsData: (Omit<AssessmentResult, "id" | "percentage"> & { percentage?: number })[]): AssessmentResult[] {
    const store = loadStore();
    const created: AssessmentResult[] = [];
    const studentIds = new Set<string>();

    for (const r of resultsData) {
      const marksObtained = Number(r.marksObtained);
      const maximumMarks = Number(r.maximumMarks);

      if (isNaN(maximumMarks) || maximumMarks <= 0) {
        throw new Error("Maximum marks must be greater than zero");
      }
      if (isNaN(marksObtained) || marksObtained < 0) {
        throw new Error("Marks obtained cannot be negative");
      }
      if (marksObtained > maximumMarks) {
        throw new Error(`Marks obtained (${marksObtained}) cannot exceed maximum marks (${maximumMarks})`);
      }

      const pct = calculatePercentage(marksObtained, maximumMarks);

      // Deduplicate: check if result already exists for same assessmentId, studentId, and conceptId
      const existingIndex = store.results.findIndex(
        (res) =>
          res.assessmentId === r.assessmentId &&
          res.studentId === r.studentId &&
          res.conceptId === r.conceptId
      );

      if (existingIndex !== -1) {
        store.results[existingIndex] = {
          ...store.results[existingIndex],
          marksObtained,
          maximumMarks,
          percentage: pct,
          notes: r.notes !== undefined ? r.notes : store.results[existingIndex].notes,
          recordedAt: r.recordedAt || store.results[existingIndex].recordedAt,
        };
        created.push(store.results[existingIndex]);
      } else {
        const newResult: AssessmentResult = {
          ...r,
          id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          marksObtained,
          maximumMarks,
          percentage: pct,
          recordedAt: r.recordedAt || new Date().toISOString(),
        };
        store.results.push(newResult);
        created.push(newResult);
      }
      studentIds.add(r.studentId);
    }

    saveStore(store);

    // Automatically recalculate gaps for all updated students
    for (const sId of studentIds) {
      this.recalculateLearningGapsForStudent(sId);
    }

    return created;
  },

  updateResult(id: string, updates: Partial<AssessmentResult>): AssessmentResult | null {
    const store = loadStore();
    const index = store.results.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const current = store.results[index];
    const newMarksObtained = updates.marksObtained !== undefined ? Number(updates.marksObtained) : current.marksObtained;
    const newMaxMarks = updates.maximumMarks !== undefined ? Number(updates.maximumMarks) : current.maximumMarks;

    if (newMaxMarks <= 0) {
      throw new Error("Maximum marks must be greater than zero");
    }
    if (newMarksObtained < 0) {
      throw new Error("Marks obtained cannot be negative");
    }
    if (newMarksObtained > newMaxMarks) {
      throw new Error(`Marks obtained (${newMarksObtained}) cannot exceed maximum marks (${newMaxMarks})`);
    }

    const pct = calculatePercentage(newMarksObtained, newMaxMarks);

    store.results[index] = {
      ...current,
      ...updates,
      marksObtained: newMarksObtained,
      maximumMarks: newMaxMarks,
      percentage: pct,
    };

    saveStore(store);

    this.recalculateLearningGapsForStudent(current.studentId);
    return store.results[index];
  },

  deleteResult(id: string): boolean {
    const store = loadStore();
    const index = store.results.findIndex((r) => r.id === id);
    if (index === -1) return false;

    const studentId = store.results[index].studentId;
    store.results.splice(index, 1);
    saveStore(store);

    this.recalculateLearningGapsForStudent(studentId);
    return true;
  },

  getLearningGaps(filterOrStudentId?: string | LearningGapFilter): LearningGap[] {
    const store = loadStore();
    const studentMap = new Map(store.students.map((s) => [s.id, s]));
    const conceptMap = new Map(store.concepts.map((c) => [c.id, c]));
    const subjectMap = new Map(store.subjects.map((sub) => [sub.code, sub]));

    // Enrich gaps on the fly so any existing records have studentCode, classroomId, subjectName, thresholdsUsed
    let gaps: LearningGap[] = store.learningGaps.map((g) => {
      const student = studentMap.get(g.studentId);
      const concept = conceptMap.get(g.conceptId);
      const subject = g.subjectCode ? subjectMap.get(g.subjectCode) : undefined;
      return {
        ...g,
        studentName: g.studentName || student?.displayName,
        studentCode: g.studentCode || student?.studentCode,
        classroomId: g.classroomId || student?.classroomId,
        section: g.section || student?.section,
        grade: g.grade || student?.grade,
        conceptName: g.conceptName || concept?.name,
        conceptNameGujarati: g.conceptNameGujarati || concept?.nameGujarati,
        subjectName: g.subjectName || subject?.name || g.subjectCode,
        thresholdsUsed: g.thresholdsUsed || {
          developing: store.settings.developingThreshold,
          mastery: store.settings.masteryThreshold,
        },
      };
    });

    if (typeof filterOrStudentId === "string") {
      return gaps.filter((g) => g.studentId === filterOrStudentId);
    }

    if (filterOrStudentId && typeof filterOrStudentId === "object") {
      const f = filterOrStudentId;
      if (f.studentId) gaps = gaps.filter((g) => g.studentId === f.studentId);
      if (f.classroomId) gaps = gaps.filter((g) => g.classroomId === f.classroomId);
      if (f.grade !== undefined) gaps = gaps.filter((g) => g.grade === Number(f.grade));
      if (f.subjectCode) gaps = gaps.filter((g) => g.subjectCode === f.subjectCode);
      if (f.conceptId) gaps = gaps.filter((g) => g.conceptId === f.conceptId);
      if (f.priority) gaps = gaps.filter((g) => g.priority === f.priority);
      if (f.status) gaps = gaps.filter((g) => g.status === f.status);
      if (f.masteryStatus) gaps = gaps.filter((g) => g.masteryStatus === f.masteryStatus);
    }

    return gaps;
  },

  recalculateLearningGapsForStudent(studentId: string): LearningGap[] {
    const store = loadStore();
    const student = store.students.find((s) => s.id === studentId);
    if (!student) return [];

    const thresholds = {
      mastery: store.settings.masteryThreshold,
      developing: store.settings.developingThreshold,
    };

    // Find all unique concepts evaluated for this student
    const studentResults = store.results.filter((r) => r.studentId === studentId);
    const conceptIds = Array.from(new Set(studentResults.map((r) => r.conceptId)));

    // Clean up stale gaps for concepts that are no longer present in studentResults
    store.learningGaps = store.learningGaps.filter(
      (g) => g.studentId !== studentId || conceptIds.includes(g.conceptId)
    );

    for (const conceptId of conceptIds) {
      const concept = store.concepts.find((c) => c.id === conceptId);
      if (!concept) continue;
      const subject = store.subjects.find((s) => s.code === concept.subjectCode);

      const conceptResultsSorted = studentResults
        .filter((r) => r.conceptId === conceptId)
        .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

      const history = conceptResultsSorted.map((r) => ({
        marksObtained: r.marksObtained,
        maximumMarks: r.maximumMarks,
        recordedAt: r.recordedAt,
      }));

      const latestResult = conceptResultsSorted[conceptResultsSorted.length - 1];

      const detection = detectLearningGap(conceptId, concept.name, history, thresholds);

      // Find existing gap record if any
      const existingGapIndex = store.learningGaps.findIndex(
        (g) => g.studentId === studentId && g.conceptId === conceptId
      );

      // Determine proper gap status:
      // If mastered -> "Resolved"
      // If not mastered:
      //   If previously "Under Intervention", keep "Under Intervention"
      //   Otherwise "Active" (this reactivates a gap if score dropped below mastery threshold)
      let targetStatus: GapStatus = "Active";
      if (detection.masteryStatus === "Mastered") {
        targetStatus = "Resolved";
      } else if (existingGapIndex !== -1 && store.learningGaps[existingGapIndex].status === "Under Intervention") {
        targetStatus = "Under Intervention";
      }

      const gapData = {
        studentId,
        studentName: student.displayName,
        studentCode: student.studentCode,
        classroomId: student.classroomId,
        section: student.section,
        conceptId,
        conceptName: concept.name,
        conceptNameGujarati: concept.nameGujarati,
        subjectCode: concept.subjectCode,
        subjectName: subject?.name || concept.subjectCode,
        grade: student.grade,
        priority: detection.priority,
        masteryStatus: detection.masteryStatus,
        reason: detection.reason,
        suggestedAction: detection.suggestedAction,
        status: targetStatus,
        attemptsCount: detection.attemptsCount,
        latestPercentage: detection.latestPercentage,
        previousPercentage: detection.previousPercentage,
        deltaPercentagePoints: detection.deltaPercentagePoints,
        marksObtained: latestResult?.marksObtained,
        maximumMarks: latestResult?.maximumMarks,
        assessmentDate: latestResult?.recordedAt,
        thresholdsUsed: {
          developing: thresholds.developing,
          mastery: thresholds.mastery,
        },
        updatedAt: new Date().toISOString(),
      };

      if (existingGapIndex !== -1) {
        store.learningGaps[existingGapIndex] = {
          ...store.learningGaps[existingGapIndex],
          ...gapData,
        };

        if (detection.masteryStatus === "Mastered") {
          const relatedPlan = store.remedialPlans.find(
            (p) => p.studentId === studentId && p.conceptId === conceptId
          );
          if (relatedPlan) {
            relatedPlan.status = "Completed";
          }
        }
      } else {
        const newGap: LearningGap = {
          id: `gap-${studentId}-${conceptId}`,
          ...gapData,
        };
        store.learningGaps.push(newGap);
      }
    }

    saveStore(store);
    return this.getLearningGaps(studentId);
  },

  getRemedialPlans(studentId?: string): RemedialPlan[] {
    const store = loadStore();
    if (!studentId) return store.remedialPlans;
    return store.remedialPlans.filter((p) => p.studentId === studentId);
  },

  getRemedialPlanById(id: string): RemedialPlan | undefined {
    return loadStore().remedialPlans.find((p) => p.id === id);
  },

  createRemedialPlanForGap(
    gapId: string,
    customNotes?: string,
    options?: { forceRecreate?: boolean }
  ): RemedialPlan | null {
    const store = loadStore();
    const gap = store.learningGaps.find((g) => g.id === gapId);
    if (!gap) return null;

    const student = store.students.find((s) => s.id === gap.studentId);
    const concept = store.concepts.find((c) => c.id === gap.conceptId);
    if (!student || !concept) return null;

    // Requirement 7: Prevent accidental duplicate plans from repeated button clicks.
    // If a plan already exists for this student & concept and was created recently or is active,
    // return the existing plan unless the teacher deliberately requested forceRecreate.
    if (!options?.forceRecreate) {
      const existingPlan = store.remedialPlans.find(
        (p) => p.studentId === student.id && p.conceptId === concept.id
      );
      if (existingPlan) {
        const timeDiffMs = Date.now() - new Date(existingPlan.createdAt).getTime();
        // Return existing if created within last 15 seconds or is currently active/suggested
        if (timeDiffMs < 15000 || existingPlan.status === "Suggested" || existingPlan.status === "In Progress" || existingPlan.status === "Approved") {
          if (customNotes) existingPlan.teacherNotes = customNotes;
          existingPlan.learningGapId = gap.id;
          gap.status = "Under Intervention";
          gap.remedialPlanId = existingPlan.id;
          saveStore(store);
          return existingPlan;
        }
      }
    }

    const studentResults = store.results
      .filter((r) => r.studentId === gap.studentId && r.conceptId === gap.conceptId)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

    const latestResult = studentResults[studentResults.length - 1];

    const detection = detectLearningGap(
      gap.conceptId,
      concept.name,
      studentResults.map((r) => ({
        marksObtained: r.marksObtained,
        maximumMarks: r.maximumMarks,
        recordedAt: r.recordedAt,
      })),
      {
        mastery: store.settings.masteryThreshold,
        developing: store.settings.developingThreshold,
      }
    );

    const subjectObj = store.subjects.find((s) => s.id === concept.subjectId || s.code === concept.subjectCode);

    const plan = generateRemedialPlan(
      student.id,
      student.displayName,
      concept.id,
      concept.name,
      concept.subjectCode,
      detection,
      customNotes,
      {
        studentCode: student.studentCode,
        classroomId: student.classroomId,
        grade: student.grade,
        subjectName: subjectObj?.name || concept.subjectCode,
        learningGapId: gap.id,
        triggeringAssessmentId: latestResult?.id,
      }
    );

    const existingPlanIndex = store.remedialPlans.findIndex(
      (p) => p.studentId === student.id && p.conceptId === concept.id
    );
    if (existingPlanIndex !== -1 && !options?.forceRecreate) {
      store.remedialPlans[existingPlanIndex] = plan;
    } else {
      store.remedialPlans.unshift(plan);
    }

    // Link plan to gap
    gap.remedialPlanId = plan.id;
    gap.status = "Under Intervention";
    gap.updatedAt = new Date().toISOString();

    saveStore(store);
    return plan;
  },

  createRemedialPlanForStudentConcept(
    studentId: string,
    conceptId: string,
    options?: { forceRecreate?: boolean; customNotes?: string }
  ): RemedialPlan | null {
    const store = loadStore();
    const student = store.students.find((s) => s.id === studentId);
    const concept = store.concepts.find((c) => c.id === conceptId);
    if (!student || !concept) return null;

    // Requirement 7: Deduplication check
    if (!options?.forceRecreate) {
      const existingPlan = store.remedialPlans.find(
        (p) => p.studentId === student.id && p.conceptId === concept.id
      );
      if (existingPlan) {
        const timeDiffMs = Date.now() - new Date(existingPlan.createdAt).getTime();
        if (timeDiffMs < 15000 || existingPlan.status === "Suggested" || existingPlan.status === "In Progress" || existingPlan.status === "Approved") {
          return existingPlan;
        }
      }
    }

    // Find real assessment results for this student and concept
    const studentResults = store.results
      .filter((r) => r.studentId === studentId && r.conceptId === conceptId)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

    const latestResult = studentResults[studentResults.length - 1];

    let gap = store.learningGaps.find((g) => g.studentId === studentId && g.conceptId === conceptId);

    const detection = detectLearningGap(
      concept.id,
      concept.name,
      studentResults.map((r) => ({
        marksObtained: r.marksObtained,
        maximumMarks: r.maximumMarks,
        recordedAt: r.recordedAt,
      })),
      {
        mastery: store.settings.masteryThreshold,
        developing: store.settings.developingThreshold,
      }
    );

    const subjectObj = store.subjects.find((s) => s.id === concept.subjectId || s.code === concept.subjectCode);

    // If gap record didn't exist yet, create one
    if (!gap) {
      gap = {
        id: `gap-${student.id}-${concept.id}`,
        studentId: student.id,
        studentName: student.displayName,
        studentCode: student.studentCode,
        classroomId: student.classroomId,
        section: student.section,
        grade: student.grade,
        conceptId: concept.id,
        conceptName: concept.name,
        conceptNameGujarati: concept.nameGujarati,
        subjectCode: concept.subjectCode,
        subjectName: subjectObj?.name || concept.subjectCode,
        status: "Under Intervention",
        priority: detection.masteryStatus === "Needs Support" ? "High" : "Medium",
        masteryStatus: detection.masteryStatus,
        reason: detection.reason,
        suggestedAction: detection.suggestedAction,
        attemptsCount: detection.attemptsCount,
        latestPercentage: detection.latestPercentage,
        previousPercentage: detection.previousPercentage,
        deltaPercentagePoints: detection.deltaPercentagePoints,
        marksObtained: latestResult?.marksObtained,
        maximumMarks: latestResult?.maximumMarks,
        assessmentDate: latestResult?.recordedAt,
        updatedAt: new Date().toISOString(),
      };
      store.learningGaps.push(gap);
    }

    const activeGap = gap;

    const plan = generateRemedialPlan(
      student.id,
      student.displayName,
      concept.id,
      concept.name,
      concept.subjectCode,
      detection,
      options?.customNotes,
      {
        studentCode: student.studentCode,
        classroomId: student.classroomId,
        grade: student.grade,
        subjectName: subjectObj?.name || concept.subjectCode,
        learningGapId: activeGap.id,
        triggeringAssessmentId: latestResult?.id,
      }
    );

    const existingPlanIndex = store.remedialPlans.findIndex(
      (p) => p.studentId === student.id && p.conceptId === concept.id
    );
    if (existingPlanIndex !== -1 && !options?.forceRecreate) {
      store.remedialPlans[existingPlanIndex] = plan;
    } else {
      store.remedialPlans.unshift(plan);
    }

    activeGap.remedialPlanId = plan.id;
    activeGap.status = "Under Intervention";
    activeGap.updatedAt = new Date().toISOString();

    saveStore(store);
    return plan;
  },

  updateRemedialPlanStep(planId: string, stepNumber: number, completed: boolean): RemedialPlan | null {
    const store = loadStore();
    const plan = store.remedialPlans.find((p) => p.id === planId);
    if (!plan) return null;

    if (!plan.steps || plan.steps.length === 0) {
      return null;
    }

    const stepIndex = plan.steps.findIndex((s) => s.stepNumber === stepNumber);
    if (stepIndex === -1) return null;

    plan.steps[stepIndex].completed = Boolean(completed);

    // Recalculate progress
    const completedCount = plan.steps.filter((s) => s.completed).length;
    const totalSteps = plan.steps.length;
    plan.completedStepsCount = completedCount;
    plan.progressPercentage = Math.round((completedCount / Math.max(1, totalSteps)) * 100);
    plan.updatedAt = new Date().toISOString();

    // Auto-update plan status based on progress
    if (completedCount === totalSteps) {
      plan.status = "Completed";
    } else if (completedCount > 0 && (plan.status === "Suggested" || plan.status === "Approved")) {
      plan.status = "In Progress";
    } else if (completedCount < totalSteps && plan.status === "Completed") {
      plan.status = "In Progress";
    }

    // If plan is completed, also update linked learning gap status if present
    if (plan.learningGapId) {
      const gap = store.learningGaps.find((g) => g.id === plan.learningGapId);
      if (gap) {
        if (plan.status === "Completed") {
          gap.status = "Resolved";
        } else {
          gap.status = "Under Intervention";
        }
        gap.updatedAt = new Date().toISOString();
      }
    }

    saveStore(store);
    return plan;
  },

  reopenRemedialPlan(planId: string): RemedialPlan | null {
    const store = loadStore();
    const plan = store.remedialPlans.find((p) => p.id === planId);
    if (!plan) return null;

    plan.status = "In Progress";
    plan.updatedAt = new Date().toISOString();

    if (plan.learningGapId) {
      const gap = store.learningGaps.find((g) => g.id === plan.learningGapId);
      if (gap) {
        gap.status = "Under Intervention";
        gap.updatedAt = new Date().toISOString();
      }
    }

    saveStore(store);
    return plan;
  },

  saveCustomRemedialPlan(plan: RemedialPlan): RemedialPlan {
    const store = loadStore();
    const existingIndex = store.remedialPlans.findIndex((p) => p.id === plan.id);
    if (existingIndex !== -1) {
      store.remedialPlans[existingIndex] = plan;
    } else {
      store.remedialPlans.unshift(plan);
    }

    // Link to gap if exists
    const matchingGap = store.learningGaps.find(
      (g) => g.studentId === plan.studentId && g.conceptId === plan.conceptId
    );
    if (matchingGap) {
      matchingGap.remedialPlanId = plan.id;
      if (matchingGap.status === "Active") {
        matchingGap.status = "Under Intervention";
      }
      matchingGap.updatedAt = new Date().toISOString();
    }

    saveStore(store);
    return plan;
  },

  updateRemedialPlan(id: string, updates: Partial<RemedialPlan>): RemedialPlan | null {
    const store = loadStore();
    const index = store.remedialPlans.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const currentPlan = store.remedialPlans[index];
    const mergedPlan = { ...currentPlan, ...updates, updatedAt: new Date().toISOString() };

    // If steps were updated, recalculate completion stats
    if (updates.steps) {
      const completedCount = mergedPlan.steps.filter((s) => s.completed).length;
      mergedPlan.completedStepsCount = completedCount;
      mergedPlan.progressPercentage = Math.round((completedCount / Math.max(1, mergedPlan.steps.length)) * 100);
      if (completedCount === mergedPlan.steps.length) {
        mergedPlan.status = "Completed";
      }
    }

    store.remedialPlans[index] = mergedPlan;
    saveStore(store);
    return store.remedialPlans[index];
  },

  getActivities(conceptId?: string, subjectCode?: string, studentRole?: boolean): LearningActivity[] {
    const store = loadStore();
    let acts = store.activities;
    if (conceptId) acts = acts.filter((a) => a.conceptId === conceptId);
    if (subjectCode) acts = acts.filter((a) => a.subjectCode === subjectCode);

    if (studentRole) {
      // Security: Strip correctAnswer and explanation so student cannot access answer keys before submission
      return acts.map((a) => ({
        ...a,
        questions: a.questions.map((q) => {
          const { correctAnswer, explanation, ...rest } = q;
          return rest as any;
        }),
      }));
    }
    return acts;
  },

  getActivityById(id: string, studentRole?: boolean): LearningActivity | undefined {
    const act = loadStore().activities.find((a) => a.id === id);
    if (!act) return undefined;
    if (studentRole) {
      return {
        ...act,
        questions: act.questions.map((q) => {
          const { correctAnswer, explanation, ...rest } = q;
          return rest as any;
        }),
      };
    }
    return act;
  },

  createActivity(data: Omit<LearningActivity, "id" | "createdAt">): LearningActivity {
    const store = loadStore();
    if (!data.title || !data.title.trim()) {
      throw new Error("Activity title is required");
    }
    if (!data.conceptId) {
      throw new Error("Target concept ID is required");
    }
    if (!data.subjectCode) {
      throw new Error("Subject code is required");
    }
    if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
      throw new Error("At least one question is required");
    }
    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];
      if (!q.questionText || !q.questionText.trim()) {
        throw new Error(`Question ${i + 1} must have question text`);
      }
      if (q.type === "mcq") {
        if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
          throw new Error(`Question ${i + 1} (MCQ) must have at least two answer options`);
        }
      }
      if (q.correctAnswer === undefined || q.correctAnswer === null || String(q.correctAnswer).trim() === "") {
        throw new Error(`Question ${i + 1} must specify a valid correct answer`);
      }
    }

    const newActivity: LearningActivity = {
      ...data,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    store.activities.unshift(newActivity);
    saveStore(store);
    return newActivity;
  },

  updateActivity(id: string, updates: Partial<LearningActivity>): LearningActivity | null {
    const store = loadStore();
    const index = store.activities.findIndex((a) => a.id === id);
    if (index === -1) return null;

    if (updates.questions) {
      if (!Array.isArray(updates.questions) || updates.questions.length === 0) {
        throw new Error("At least one question is required");
      }
      for (let i = 0; i < updates.questions.length; i++) {
        const q = updates.questions[i];
        if (!q.questionText || !q.questionText.trim()) {
          throw new Error(`Question ${i + 1} must have question text`);
        }
        if (q.type === "mcq") {
          if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
            throw new Error(`Question ${i + 1} (MCQ) must have at least two answer options`);
          }
        }
        if (q.correctAnswer === undefined || q.correctAnswer === null || String(q.correctAnswer).trim() === "") {
          throw new Error(`Question ${i + 1} must specify a valid correct answer`);
        }
      }
    }

    const updated: LearningActivity = {
      ...store.activities[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    store.activities[index] = updated;
    saveStore(store);
    return updated;
  },

  deleteActivity(id: string): boolean {
    const store = loadStore();
    const lenBefore = store.activities.length;
    store.activities = store.activities.filter((a) => a.id !== id);
    if (store.activities.length < lenBefore) {
      saveStore(store);
      return true;
    }
    return false;
  },

  recordActivityAttempt(attemptData: Omit<ActivityAttempt, "id" | "completedAt">): ActivityAttempt {
    const store = loadStore();

    // Accidental duplicate submission prevention (e.g. rapid double click on Submit):
    const recentDuplicate = store.attempts.find((att) => {
      if (att.studentId !== attemptData.studentId || att.activityId !== attemptData.activityId) return false;
      const timeDiff = Date.now() - new Date(att.completedAt).getTime();
      return timeDiff < 15000 && att.score === attemptData.score;
    });
    if (recentDuplicate) {
      return recentDuplicate;
    }

    const pct = calculatePercentage(attemptData.score, attemptData.maximumScore);
    const attempt: ActivityAttempt = {
      ...attemptData,
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      percentage: pct,
      completedAt: new Date().toISOString(),
    };
    store.attempts.push(attempt);

    // If associated with a remedial plan, advance progress
    const activity = store.activities.find((a) => a.id === attempt.activityId);
    if (activity) {
      const relatedPlan = store.remedialPlans.find(
        (p) =>
          p.studentId === attempt.studentId &&
          (p.conceptId === activity.conceptId || (activity.remedialPlanId && p.id === activity.remedialPlanId)) &&
          (p.status === "Approved" || p.status === "In Progress" || p.status === "Suggested")
      );
      if (relatedPlan) {
        relatedPlan.status = "In Progress";
        const practiceStep = relatedPlan.steps.find(
          (s) => s.activityType === "independent_practice" || s.activityType === "hands_on"
        );
        if (practiceStep && !practiceStep.completed) {
          practiceStep.completed = true;
          relatedPlan.completedStepsCount = relatedPlan.steps.filter((s) => s.completed).length;
          relatedPlan.progressPercentage = Math.round(
            (relatedPlan.completedStepsCount / relatedPlan.steps.length) * 100
          );
        }
      }
    }

    // Critical Requirement 4: DO NOT automatically mark a competency mastered based on activity completion alone.

    saveStore(store);
    return attempt;
  },

  getAttempts(studentId?: string, activityId?: string): ActivityAttempt[] {
    const store = loadStore();
    let atts = store.attempts;
    if (studentId) atts = atts.filter((a) => a.studentId === studentId);
    if (activityId) atts = atts.filter((a) => a.activityId === activityId);
    return atts;
  },

  getWorksheets(conceptId?: string, subjectCode?: string, grade?: number): WorksheetData[] {
    const store = loadStore();
    let ws = store.worksheets || [];
    if (conceptId) ws = ws.filter((w) => w.conceptId === conceptId);
    if (subjectCode) ws = ws.filter((w) => w.subjectCode === subjectCode);
    if (grade) ws = ws.filter((w) => w.grade === grade);
    return ws;
  },

  getWorksheetById(id: string): WorksheetData | undefined {
    const store = loadStore();
    return (store.worksheets || []).find((w) => w.id === id);
  },

  createWorksheet(data: Omit<WorksheetData, "id" | "createdAt">): WorksheetData {
    const store = loadStore();
    if (!data.title || !data.title.trim()) {
      throw new Error("Worksheet title is required");
    }
    if (!data.subject) {
      throw new Error("Subject is required");
    }
    if (!data.concept) {
      throw new Error("Concept is required");
    }
    if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
      throw new Error("At least one question is required");
    }
    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];
      if (!q.question || !q.question.trim()) {
        throw new Error(`Question ${i + 1} must have question text`);
      }
      if (!q.marks || q.marks <= 0) {
        throw new Error(`Question ${i + 1} must specify marks greater than 0`);
      }
    }

    const totalMarks =
      data.totalMarks || data.questions.reduce((sum, q) => sum + (q.marks || 2), 0);

    const newWorksheet: WorksheetData = {
      ...data,
      id: `ws-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      totalMarks,
      createdAt: new Date().toISOString(),
    };
    store.worksheets = store.worksheets || [];
    store.worksheets.unshift(newWorksheet);
    saveStore(store);
    return newWorksheet;
  },

  updateWorksheet(id: string, updates: Partial<WorksheetData>): WorksheetData | null {
    const store = loadStore();
    store.worksheets = store.worksheets || [];
    const index = store.worksheets.findIndex((w) => w.id === id);
    if (index === -1) return null;

    if (updates.questions) {
      if (!Array.isArray(updates.questions) || updates.questions.length === 0) {
        throw new Error("At least one question is required");
      }
      for (let i = 0; i < updates.questions.length; i++) {
        const q = updates.questions[i];
        if (!q.question || !q.question.trim()) {
          throw new Error(`Question ${i + 1} must have question text`);
        }
        if (!q.marks || q.marks <= 0) {
          throw new Error(`Question ${i + 1} must specify marks greater than 0`);
        }
      }
    }

    const updated: WorksheetData = {
      ...store.worksheets[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    store.worksheets[index] = updated;
    saveStore(store);
    return updated;
  },

  deleteWorksheet(id: string): boolean {
    const store = loadStore();
    store.worksheets = store.worksheets || [];
    const lenBefore = store.worksheets.length;
    store.worksheets = store.worksheets.filter((w) => w.id !== id);
    if (store.worksheets.length < lenBefore) {
      saveStore(store);
      return true;
    }
    return false;
  },

  getRecommendationsForStudent(studentId: string): {
    gap: LearningGap;
    remedialPlan?: RemedialPlan;
    recommendedActivities: LearningActivity[];
    recommendedWorksheets: WorksheetData[];
  }[] {
    const store = loadStore();
    const gaps = this.getLearningGaps(studentId).filter((g) => g.latestPercentage < 80);
    const plans = this.getRemedialPlans(studentId);

    return gaps.map((gap) => {
      const plan = plans.find((p) => p.conceptId === gap.conceptId || p.learningGapId === gap.id);
      const acts = store.activities.filter(
        (a) =>
          a.conceptId === gap.conceptId ||
          (gap.subjectCode && a.subjectCode === gap.subjectCode && a.grade === gap.grade)
      );
      const ws = (store.worksheets || []).filter(
        (w) =>
          w.conceptId === gap.conceptId ||
          (gap.subjectCode && w.subjectCode === gap.subjectCode && w.grade === gap.grade)
      );

      return {
        gap,
        remedialPlan: plan,
        recommendedActivities: acts,
        recommendedWorksheets: ws,
      };
    });
  },

  resetToDemoData(): void {
    const fresh = getInitialStore();
    saveStore(fresh);
  },
};
