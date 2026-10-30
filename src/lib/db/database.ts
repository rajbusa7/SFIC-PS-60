import fs from "fs";
import path from "path";
import os from "os";
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
  SEED_PARENTS,
  SEED_NOTICES,
  SEED_NOTICE_TRANSLATIONS,
  SEED_NOTICE_DELIVERIES,
  SEED_AI_CONFIGS,
  SEED_USERS,
} from "./seedData";
import { detectLearningGap } from "../engine/gapDetection";
import { generateRemedialPlan } from "../engine/remedialEngine";
import { calculatePercentage } from "../engine/calculations";
import {
  isPostgresConfigured,
  postgresStudentDb,
  postgresAssessmentDb,
  postgresLearningGapDb,
  postgresRemedialPlanDb,
  postgresActivityDb,
  postgresSettingsDb,
  postgresUserDb,
  postgresParentDb,
} from "./postgres";
import type {
  School,
  SchoolSettings,
  Classroom,
  Subject,
  Concept,
  Student,
  Assessment,
  AssessmentResult,
  LearningGap,
  RemedialPlan,
  LearningActivity,
  ActivityAttempt,
  SchoolNotice,
  NoticeTranslation,
  NoticeDelivery,
  ParentProfile,
  ParentLinkingCode,
  ParentMessage,
  AiProviderConfig,
  AiUsageMetric,
  User,
} from "../types";

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
  parents: ParentProfile[];
  parentLinkingCodes?: ParentLinkingCode[];
  parentMessages?: ParentMessage[];
  parentActivityCompletions?: any[];
  notices: SchoolNotice[];
  translations: NoticeTranslation[];
  deliveries: NoticeDelivery[];
  aiMetrics: AiUsageMetric[];
  aiConfigs: AiProviderConfig[];
  users?: User[];
  feedback?: { id: string; email: string; message?: string; submittedAt: string }[];
}

const DEFAULT_DATA_DIR = path.join(process.cwd(), "data");
const DEFAULT_STORE_FILE = path.join(DEFAULT_DATA_DIR, "shikshasetu_store.json");
const TMP_DATA_DIR = path.join(os.tmpdir(), "shikshasetu_data");
const TMP_STORE_FILE = path.join(TMP_DATA_DIR, "shikshasetu_store.json");

function getInitialStore(): DataStore {
  return {
    school: { ...SEED_SCHOOL },
    settings: { ...SEED_SETTINGS },
    classrooms: JSON.parse(JSON.stringify(SEED_CLASSROOMS)),
    subjects: JSON.parse(JSON.stringify(SEED_SUBJECTS)),
    concepts: JSON.parse(JSON.stringify(SEED_CONCEPTS)),
    students: JSON.parse(JSON.stringify(SEED_STUDENTS)),
    assessments: JSON.parse(JSON.stringify(SEED_ASSESSMENTS)),
    results: JSON.parse(JSON.stringify(SEED_RESULTS)),
    learningGaps: JSON.parse(JSON.stringify(SEED_LEARNING_GAPS)),
    remedialPlans: JSON.parse(JSON.stringify(SEED_REMEDIAL_PLANS)),
    activities: JSON.parse(JSON.stringify(SEED_ACTIVITIES)),
    attempts: [],
    parents: JSON.parse(JSON.stringify(SEED_PARENTS)),
    parentLinkingCodes: [
      {
        id: "plc-demo-aarav",
        studentId: "std-aarav",
        code: "PAR-4892",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        createdAt: new Date().toISOString(),
      },
      {
        id: "plc-demo-diya",
        studentId: "std-diya",
        code: "PAR-5219",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        createdAt: new Date().toISOString(),
      },
    ],
    parentMessages: [],
    notices: JSON.parse(JSON.stringify(SEED_NOTICES)),
    translations: JSON.parse(JSON.stringify(SEED_NOTICE_TRANSLATIONS)),
    deliveries: JSON.parse(JSON.stringify(SEED_NOTICE_DELIVERIES)),
    aiMetrics: [],
    aiConfigs: JSON.parse(JSON.stringify(SEED_AI_CONFIGS)),
    users: JSON.parse(JSON.stringify(SEED_USERS)),
    feedback: [],
  };
}

let memoryStore: DataStore | null = null;
let lastLoadedMtime = 0;
let lastLoadedPath = "";

function ensureDirectory(dirPath: string): boolean {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch {
    return false;
  }
}

function getWritableStorePath(): string {
  // If running in Vercel or standard serverless Lambda, /var/task is read-only so write to /tmp
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    ensureDirectory(TMP_DATA_DIR);
    return TMP_STORE_FILE;
  }

  // Local or standard Node environment
  if (ensureDirectory(DEFAULT_DATA_DIR)) {
    return DEFAULT_STORE_FILE;
  }

  ensureDirectory(TMP_DATA_DIR);
  return TMP_STORE_FILE;
}

function loadStore(): DataStore {
  const targetFile = getWritableStorePath();
  const candidates = [targetFile, TMP_STORE_FILE, DEFAULT_STORE_FILE];

  for (const candidate of candidates) {
    if (fs.existsSync(/*turbopackIgnore: true*/ candidate)) {
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const stat = fs.statSync(/*turbopackIgnore: true*/ candidate);
          if (memoryStore && lastLoadedPath === candidate && lastLoadedMtime === stat.mtimeMs) {
            return memoryStore;
          }
          const content = fs.readFileSync(/*turbopackIgnore: true*/ candidate, "utf-8");
          memoryStore = JSON.parse(content) as DataStore;
          if (!memoryStore.users) {
            memoryStore.users = JSON.parse(JSON.stringify(SEED_USERS));
          }
          if (!memoryStore.activities || memoryStore.activities.length < SEED_ACTIVITIES.length) {
            memoryStore.activities = JSON.parse(JSON.stringify(SEED_ACTIVITIES));
          }
          lastLoadedMtime = stat.mtimeMs;
          lastLoadedPath = candidate;
          return memoryStore;
        } catch (e: any) {
          if ((e.code === "EBUSY" || e.code === "EPERM") && attempt < 3) {
            const start = Date.now();
            while (Date.now() - start < 20 * (attempt + 1)) {}
            continue;
          }
          console.warn(`Could not read store from ${candidate}:`, e);
          break;
        }
      }
    }
  }

  if (memoryStore) return memoryStore;
  memoryStore = getInitialStore();
  try {
    saveStore(memoryStore);
  } catch {}
  return memoryStore;
}

function saveStore(store: DataStore) {
  memoryStore = store;
  const json = JSON.stringify(store, null, 2);
  const targetFile = getWritableStorePath();
  const tempFile = `${targetFile}.tmp.${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      fs.writeFileSync(tempFile, json, "utf-8");
      try {
        fs.renameSync(tempFile, targetFile);
      } catch {
        fs.copyFileSync(tempFile, targetFile);
        try {
          fs.unlinkSync(tempFile);
        } catch {}
      }
      try {
        const stat = fs.statSync(targetFile);
        lastLoadedMtime = stat.mtimeMs;
        lastLoadedPath = targetFile;
      } catch {}
      return;
    } catch (primaryErr: any) {
      if ((primaryErr.code === "EBUSY" || primaryErr.code === "EPERM") && attempt < 3) {
        const start = Date.now();
        while (Date.now() - start < 25 * (attempt + 1)) {}
        continue;
      }

      // If writing to target failed (e.g. EROFS on read-only system), attempt writing to os.tmpdir directly
      try {
        const fallbackFile = path.join(os.tmpdir(), "shikshasetu_store.json");
        fs.writeFileSync(fallbackFile, json, "utf-8");
        try {
          const stat = fs.statSync(fallbackFile);
          lastLoadedMtime = stat.mtimeMs;
          lastLoadedPath = fallbackFile;
        } catch {}
      } catch {
        // Memory store is already updated in memoryStore; do not crash serverless execution
        console.warn("Storage notice: Persistent disk write skipped, store held in active memory.");
      }
      return;
    }
  }
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
    if (isPostgresConfigured()) {
      postgresSettingsDb.updateSettings(updates).catch((e) =>
        console.error("[PostgreSQL updateSettings sync error]:", e)
      );
    }
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
    if (!classroomId || classroomId === "all") return store.students;
    return store.students.filter((s) => s.classroomId === classroomId);
  },

  async getStudentsAsync(filters?: { classroomId?: string; grade?: number; search?: string }): Promise<Student[]> {
    if (isPostgresConfigured()) {
      try {
        const pgStudents = await postgresStudentDb.getStudents(filters);
        // Sync local memory store with latest PostgreSQL records
        const store = loadStore();
        if (pgStudents && pgStudents.length > 0) {
          store.students = pgStudents;
        }
        return pgStudents;
      } catch (err) {
        console.warn("[PostgreSQL] Query failed, falling back to persistent store:", err);
      }
    }
    let students = this.getStudents(filters?.classroomId);
    if (filters?.grade) {
      students = students.filter((s) => s.grade === filters.grade);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      students = students.filter(
        (s) => s.displayName.toLowerCase().includes(q) || s.studentCode.toLowerCase().includes(q)
      );
    }
    return students;
  },

  getStudentById(id: string): Student | undefined {
    return loadStore().students.find((s) => s.id === id);
  },

  async getStudentByIdAsync(id: string): Promise<Student | undefined> {
    if (isPostgresConfigured()) {
      try {
        const student = await postgresStudentDb.getStudentById(id);
        if (student) return student;
      } catch (err) {
        console.warn("[PostgreSQL] Query failed, falling back to persistent store:", err);
      }
    }
    return this.getStudentById(id);
  },

  addStudent(studentData: Omit<Student, "id" | "createdAt">): Student {
    const store = loadStore();
    const newStudent: Student = {
      ...studentData,
      id: `std-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    store.students.push(newStudent);
    saveStore(store);
    if (isPostgresConfigured()) {
      postgresStudentDb.createStudent(newStudent).catch((e) =>
        console.error("[PostgreSQL addStudent async sync error]:", e)
      );
    }
    return newStudent;
  },

  async addStudentAsync(studentData: Omit<Student, "id" | "createdAt">): Promise<Student> {
    if (isPostgresConfigured()) {
      try {
        const newStudent = await postgresStudentDb.createStudent(studentData);
        const store = loadStore();
        store.students.push(newStudent);
        saveStore(store);
        return newStudent;
      } catch (err) {
        console.warn("[PostgreSQL] Error in addStudentAsync, falling back to local store:", err);
      }
    }
    return this.addStudent(studentData);
  },

  updateStudent(id: string, updates: Partial<Student>): Student | null {
    const store = loadStore();
    const index = store.students.findIndex((s) => s.id === id);
    if (index === -1) return null;
    store.students[index] = { ...store.students[index], ...updates };
    saveStore(store);
    if (isPostgresConfigured()) {
      postgresStudentDb.updateStudent(id, updates).catch((e) =>
        console.error("[PostgreSQL updateStudent async sync error]:", e)
      );
    }
    return store.students[index];
  },

  async updateStudentAsync(id: string, updates: Partial<Student>): Promise<Student | null> {
    if (isPostgresConfigured()) {
      try {
        const updated = await postgresStudentDb.updateStudent(id, updates);
        if (updated) {
          const store = loadStore();
          const index = store.students.findIndex((s) => s.id === id);
          if (index !== -1) {
            store.students[index] = updated;
            saveStore(store);
          }
          return updated;
        }
      } catch (err) {
        console.warn("[PostgreSQL] Error in updateStudentAsync, falling back to local store:", err);
      }
    }
    return this.updateStudent(id, updates);
  },

  deleteStudent(id: string): boolean {
    const store = loadStore();
    const beforeLen = store.students.length;
    store.students = store.students.filter((s) => s.id !== id);
    if (store.students.length !== beforeLen) {
      // Cascading relational cleanups
      store.learningGaps = store.learningGaps.filter((g) => g.studentId !== id);
      store.remedialPlans = store.remedialPlans.filter((p) => p.studentId !== id);
      store.results = store.results.filter((r) => r.studentId !== id);
      store.attempts = store.attempts.filter((a) => a.studentId !== id);
      store.deliveries = store.deliveries.filter((d) => d.studentId !== id);
      saveStore(store);
      if (isPostgresConfigured()) {
        postgresStudentDb.deleteStudent(id).catch((e) =>
          console.error("[PostgreSQL deleteStudent async sync error]:", e)
        );
      }
      return true;
    }
    return false;
  },

  async deleteStudentAsync(id: string): Promise<boolean> {
    if (isPostgresConfigured()) {
      try {
        const deleted = await postgresStudentDb.deleteStudent(id);
        const store = loadStore();
        store.students = store.students.filter((s) => s.id !== id);
        store.learningGaps = store.learningGaps.filter((g) => g.studentId !== id);
        store.remedialPlans = store.remedialPlans.filter((p) => p.studentId !== id);
        store.results = store.results.filter((r) => r.studentId !== id);
        store.attempts = store.attempts.filter((a) => a.studentId !== id);
        store.deliveries = store.deliveries.filter((d) => d.studentId !== id);
        saveStore(store);
        return deleted;
      } catch (err) {
        console.warn("[PostgreSQL] Error in deleteStudentAsync, falling back to local store:", err);
      }
    }
    return this.deleteStudent(id);
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
    const assessmentId = `asm-${Date.now()}`;
    const newAssessment: Assessment = {
      ...assessmentData,
      id: assessmentId,
      createdAt: new Date().toISOString(),
    };
    store.assessments.push(newAssessment);

    if (initialResults && initialResults.length > 0) {
      for (const res of initialResults) {
        const pct = calculatePercentage(res.marksObtained, res.maximumMarks);
        const resultRecord: AssessmentResult = {
          ...res,
          id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          assessmentId,
          percentage: pct,
          recordedAt: res.recordedAt || new Date().toISOString(),
        };
        store.results.push(resultRecord);
      }
    }

    saveStore(store);

    if (isPostgresConfigured()) {
      postgresAssessmentDb.createAssessment(assessmentData, initialResults).catch((e) =>
        console.error("[PostgreSQL createAssessment sync error]:", e)
      );
    }

    // Recalculate learning gaps for affected students
    if (initialResults) {
      const studentIds = Array.from(new Set(initialResults.map((r) => r.studentId)));
      for (const sId of studentIds) {
        this.recalculateLearningGapsForStudent(sId);
      }
    }

    return newAssessment;
  },

  getResults(studentId?: string, conceptId?: string): AssessmentResult[] {
    const store = loadStore();
    let res = store.results;
    if (studentId) res = res.filter((r) => r.studentId === studentId);
    if (conceptId) res = res.filter((r) => r.conceptId === conceptId);
    return res;
  },

  recordResults(resultsData: Omit<AssessmentResult, "id">[]): AssessmentResult[] {
    const store = loadStore();
    const created: AssessmentResult[] = [];
    const studentIds = new Set<string>();

    for (const r of resultsData) {
      const pct = calculatePercentage(r.marksObtained, r.maximumMarks);
      const newResult: AssessmentResult = {
        ...r,
        id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        percentage: pct,
        recordedAt: r.recordedAt || new Date().toISOString(),
      };
      store.results.push(newResult);
      created.push(newResult);
      studentIds.add(r.studentId);
    }

    saveStore(store);

    if (isPostgresConfigured()) {
      postgresAssessmentDb.recordResults(resultsData).catch((e) =>
        console.error("[PostgreSQL recordResults sync error]:", e)
      );
    }

    // Automatically recalculate gaps for all updated students
    for (const sId of studentIds) {
      this.recalculateLearningGapsForStudent(sId);
    }

    return created;
  },

  getLearningGaps(studentId?: string): LearningGap[] {
    const store = loadStore();
    if (!studentId) return store.learningGaps;
    return store.learningGaps.filter((g) => g.studentId === studentId);
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

    for (const conceptId of conceptIds) {
      const concept = store.concepts.find((c) => c.id === conceptId);
      if (!concept) continue;

      const history = studentResults
        .filter((r) => r.conceptId === conceptId)
        .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
        .map((r) => ({
          marksObtained: r.marksObtained,
          maximumMarks: r.maximumMarks,
          recordedAt: r.recordedAt,
        }));

      const detection = detectLearningGap(conceptId, concept.name, history, thresholds);

      // Find existing gap record if any
      const existingGapIndex = store.learningGaps.findIndex(
        (g) => g.studentId === studentId && g.conceptId === conceptId
      );

      if (existingGapIndex !== -1) {
        const existing = store.learningGaps[existingGapIndex];
        store.learningGaps[existingGapIndex] = {
          ...existing,
          priority: detection.priority,
          masteryStatus: detection.masteryStatus,
          reason: detection.reason,
          status: detection.masteryStatus === "Mastered" ? "Resolved" : existing.status,
          attemptsCount: detection.attemptsCount,
          latestPercentage: detection.latestPercentage,
          previousPercentage: detection.previousPercentage,
          deltaPercentagePoints: detection.deltaPercentagePoints,
          updatedAt: new Date().toISOString(),
        };

        if (detection.masteryStatus === "Mastered") {
          const relatedPlan = store.remedialPlans.find(
            (p) => p.studentId === studentId && p.conceptId === conceptId
          );
          if (relatedPlan) {
            relatedPlan.status = "Completed";
          }
        }
      } else if (detection.requiresRemediation) {
        // Create new gap
        const newGap: LearningGap = {
          id: `gap-${studentId}-${conceptId}`,
          studentId,
          studentName: student.displayName,
          conceptId,
          conceptName: concept.name,
          subjectCode: concept.subjectCode,
          grade: student.grade,
          priority: detection.priority,
          masteryStatus: detection.masteryStatus,
          reason: detection.reason,
          status: "Active",
          attemptsCount: detection.attemptsCount,
          latestPercentage: detection.latestPercentage,
          previousPercentage: detection.previousPercentage,
          deltaPercentagePoints: detection.deltaPercentagePoints,
          updatedAt: new Date().toISOString(),
        };
        store.learningGaps.push(newGap);
      }
    }

    saveStore(store);

    if (isPostgresConfigured()) {
      const studentGaps = store.learningGaps.filter((g) => g.studentId === studentId);
      for (const gap of studentGaps) {
        postgresLearningGapDb.upsertLearningGap(gap).catch((e) =>
          console.error("[PostgreSQL upsertLearningGap sync error]:", e)
        );
      }
    }

    return store.learningGaps.filter((g) => g.studentId === studentId);
  },

  getRemedialPlans(studentId?: string): RemedialPlan[] {
    const store = loadStore();
    if (!studentId) return store.remedialPlans;
    return store.remedialPlans.filter((p) => p.studentId === studentId);
  },

  getRemedialPlanById(id: string): RemedialPlan | undefined {
    return loadStore().remedialPlans.find((p) => p.id === id);
  },

  createRemedialPlanForGap(gapId: string, customNotes?: string): RemedialPlan | null {
    const store = loadStore();
    const gap = store.learningGaps.find((g) => g.id === gapId);
    if (!gap) return null;

    const student = store.students.find((s) => s.id === gap.studentId);
    const concept = store.concepts.find((c) => c.id === gap.conceptId);
    if (!student || !concept) return null;

    const studentResults = store.results
      .filter((r) => r.studentId === gap.studentId && r.conceptId === gap.conceptId)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

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

    // Extract student's real grade and section, baseline score, and confirmed vs inferred status
    const baselineScore =
      gap.latestPercentage ??
      (studentResults.length > 0 ? studentResults[studentResults.length - 1].percentage : 35);
    const confirmedOrInferred = (gap as any).isSingleObservation ? "inferred" : "confirmed";
    const baselineEvidence =
      gap.reason ||
      `Student scored ${baselineScore}% on assessment. Prior results show persistent conceptual gap.`;

    const plan = generateRemedialPlan(
      student.id,
      student.displayName,
      concept.id,
      concept.name,
      concept.subjectCode,
      detection,
      customNotes,
      {
        studentClass: student.grade,
        studentSection: student.section,
        baselineScore,
        baselineEvidence,
        knownMisconceptions: detection.reason,
        confirmedOrInferred,
        masteryBenchmark: store.settings.masteryThreshold || 80,
      }
    );

    const existingPlanIndex = store.remedialPlans.findIndex(
      (p) => p.studentId === student.id && p.conceptId === concept.id
    );
    if (existingPlanIndex !== -1) {
      store.remedialPlans[existingPlanIndex] = plan;
    } else {
      store.remedialPlans.push(plan);
    }

    // Link plan to gap
    gap.remedialPlanId = plan.id;
    gap.status = "Under Intervention";
    gap.updatedAt = new Date().toISOString();

    saveStore(store);

    if (isPostgresConfigured()) {
      postgresRemedialPlanDb.upsertRemedialPlan(plan).catch((e) =>
        console.error("[PostgreSQL upsertRemedialPlan sync error]:", e)
      );
    }

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

    if (isPostgresConfigured()) {
      postgresRemedialPlanDb.upsertRemedialPlan(plan).catch((e) =>
        console.error("[PostgreSQL saveCustomRemedialPlan sync error]:", e)
      );
    }

    return plan;
  },

  updateRemedialPlan(id: string, updates: Partial<RemedialPlan>): RemedialPlan | null {
    const store = loadStore();
    const index = store.remedialPlans.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const existing = store.remedialPlans[index];

    // Enforce business logic: plan cannot be Completed solely because activities were checked off
    // if reassessment is pending or benchmark has not been achieved
    if (updates.status === "Completed") {
      const hasPassedReassessment = existing.reassessmentResult?.isMastered === true;
      if (!hasPassedReassessment && (!updates.reassessmentResult || !updates.reassessmentResult.isMastered)) {
        updates.status = "In Progress";
      }
    }

    store.remedialPlans[index] = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    saveStore(store);

    if (isPostgresConfigured()) {
      postgresRemedialPlanDb.updateRemedialPlan(id, updates).catch((e) =>
        console.error("[PostgreSQL updateRemedialPlan sync error]:", e)
      );
    }

    return store.remedialPlans[index];
  },

  /**
   * Records empirical reassessment outcome for a remedial plan,
   * calculating true percentage point growth, evaluating against benchmark,
   * updating gap status, and scheduling retention checks.
   */
  recordPlanReassessment(
    planId: string,
    marksObtained: number,
    maximumMarks: number,
    answers?: Record<number, string>,
    notes?: string,
    teacherFeedback?: string
  ): { success: boolean; plan?: RemedialPlan; error?: string } {
    const store = loadStore();
    const planIndex = store.remedialPlans.findIndex((p) => p.id === planId);
    if (planIndex === -1) {
      return { success: false, error: "Remedial plan not found." };
    }

    const plan = store.remedialPlans[planIndex];

    // Validation
    if (marksObtained < 0 || maximumMarks <= 0 || marksObtained > maximumMarks) {
      return { success: false, error: "Marks obtained must be between 0 and maximum marks." };
    }

    const percentage = Math.round((marksObtained / maximumMarks) * 100);
    const benchmark = plan.masteryBenchmark || store.settings.masteryThreshold || 80;
    const isMastered = percentage >= benchmark;

    const baselinePercentage = plan.baselineScore ?? 35;
    // Percentage points difference (e.g. 80% - 35% = +45 percentage points)
    const deltaPercentagePoints = percentage - baselinePercentage;

    // Evaluate mastered skills vs needs support skills
    const masteredSkills: string[] = [];
    const needsSupportSkills: string[] = [];

    if (Array.isArray(plan.reassessmentQuestions) && plan.reassessmentQuestions.length > 0) {
      plan.reassessmentQuestions.forEach((q) => {
        const studentAns = answers ? answers[q.questionNumber] : undefined;
        const skill = q.skillTarget || `Question ${q.questionNumber}`;
        if (studentAns && studentAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
          masteredSkills.push(skill);
        } else if (studentAns !== undefined) {
          needsSupportSkills.push(skill);
        } else {
          if (isMastered) masteredSkills.push(skill);
          else needsSupportSkills.push(skill);
        }
      });
    } else {
      if (isMastered) masteredSkills.push(plan.conceptName || "Target Competency");
      else needsSupportSkills.push(plan.conceptName || "Target Competency");
    }

    const retentionCheckDate = isMastered
      ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    const reassessmentResult = {
      recordedAt: new Date().toISOString(),
      marksObtained,
      maximumMarks,
      percentage,
      baselinePercentage,
      deltaPercentagePoints,
      isMastered,
      studentAnswers: answers,
      masteredSkills,
      needsSupportSkills,
      retentionCheckDate,
      teacherFeedback: teacherFeedback || notes || "",
    };

    // Update plan status
    plan.reassessmentResult = reassessmentResult;
    if (isMastered) {
      plan.status = "Completed";
      plan.completedSteps = [1, 2, 3, 4, 5];
    } else {
      plan.status = "Needs Review";
      plan.followUpRecommendations = `Student achieved ${percentage}% (target: ${benchmark}%). Needs adaptive follow-up intervention with concrete manipulatives.`;
    }
    plan.updatedAt = new Date().toISOString();
    store.remedialPlans[planIndex] = plan;

    // Record assessment result in persistent results store
    const newResult = {
      id: `res-retest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      assessmentId: `asm-retest-${plan.conceptId}`,
      studentId: plan.studentId,
      conceptId: plan.conceptId,
      marksObtained,
      maximumMarks,
      percentage,
      notes: `Post-remediation reassessment for ${plan.conceptName}. Score: ${percentage}% (+${deltaPercentagePoints} pp gain).`,
      recordedAt: new Date().toISOString(),
    };
    store.results.push(newResult);

    // Update corresponding learning gap
    const gap = store.learningGaps.find(
      (g) => g.studentId === plan.studentId && g.conceptId === plan.conceptId
    );
    if (gap) {
      gap.previousPercentage = gap.latestPercentage;
      gap.latestPercentage = percentage;
      gap.deltaPercentagePoints = deltaPercentagePoints;
      gap.attemptsCount = (gap.attemptsCount || 1) + 1;
      gap.updatedAt = new Date().toISOString();

      if (isMastered) {
        gap.status = "Resolved";
        gap.masteryStatus = "Mastered";
        gap.reason = `Demonstrated mastery on reassessment (${percentage}%, +${deltaPercentagePoints} pp improvement over baseline).`;
      } else {
        gap.status = "Under Intervention";
        gap.masteryStatus = percentage >= store.settings.developingThreshold ? "Developing" : "Needs Support";
        gap.reason = `Post-intervention reassessment scored ${percentage}%. Below ${benchmark}% mastery target; adaptive follow-up recommended.`;
      }
    }

    saveStore(store);

    return { success: true, plan };
  },

  /**
   * Generates a targeted follow-up plan when a student does not meet the mastery benchmark.
   */
  generateFollowUpPlan(parentPlanId: string, customNotes?: string): RemedialPlan | null {
    const store = loadStore();
    const parent = store.remedialPlans.find((p) => p.id === parentPlanId);
    if (!parent) return null;

    const gap = store.learningGaps.find(
      (g) => g.studentId === parent.studentId && g.conceptId === parent.conceptId
    );
    const detection = {
      conceptId: parent.conceptId,
      conceptName: parent.conceptName || "Target Concept",
      requiresRemediation: true,
      priority: "High" as const,
      masteryStatus: "Needs Support" as const,
      reason: parent.reassessmentResult
        ? `Reassessment score was ${parent.reassessmentResult.percentage}% (below ${parent.masteryBenchmark || 80}% target). Needs alternative pedagogical approach.`
        : "Follow-up intervention required.",
      suggestedAction: "Initiate adaptive multi-sensory follow-up plan with modified manipulatives.",
      attemptsCount: (gap?.attemptsCount || 1) + 1,
      latestPercentage: parent.reassessmentResult?.percentage ?? parent.baselineScore ?? 35,
      averagePercentage: parent.reassessmentResult?.percentage ?? 35,
      isSingleObservation: false,
    };

    const followUpPlan = generateRemedialPlan(
      parent.studentId,
      parent.studentName || "Student",
      parent.conceptId,
      parent.conceptName || "Target Concept",
      parent.subjectCode || "MATH",
      detection,
      customNotes || `Adaptive follow-up plan addressing remaining difficulties.`,
      {
        studentClass: parent.studentClass,
        studentSection: parent.studentSection,
        baselineScore: parent.reassessmentResult?.percentage ?? parent.baselineScore ?? 35,
        baselineEvidence: `Follow-up plan generated after reassessment score of ${parent.reassessmentResult?.percentage ?? 35}%.`,
        knownMisconceptions: parent.reassessmentResult?.needsSupportSkills?.join(", ") || parent.knownMisconceptions,
        confirmedOrInferred: "confirmed",
        masteryBenchmark: parent.masteryBenchmark || 80,
        isFollowUp: true,
        parentPlanId: parent.id,
      }
    );

    parent.followUpPlanId = followUpPlan.id;
    parent.updatedAt = new Date().toISOString();
    store.remedialPlans.unshift(followUpPlan);

    saveStore(store);
    return followUpPlan;
  },

  /**
   * Safely upgrades or repairs an existing plan with fewer than 5 steps or missing fields,
   * preserving all student records and historical notes.
   */
  repairOrUpgradePlan(planId: string): RemedialPlan | null {
    const store = loadStore();
    const index = store.remedialPlans.findIndex((p) => p.id === planId);
    if (index === -1) return null;

    const existing = store.remedialPlans[index];
    const dummyDetection = {
      conceptId: existing.conceptId,
      conceptName: existing.conceptName || "Concept",
      requiresRemediation: true,
      priority: "High" as const,
      masteryStatus: "Needs Support" as const,
      reason: existing.recommendationReason,
      suggestedAction: "Upgrade to complete 5-step curriculum.",
      attemptsCount: 1,
      latestPercentage: existing.baselineScore || 35,
      averagePercentage: existing.baselineScore || 35,
      isSingleObservation: true,
    };

    const upgraded = generateRemedialPlan(
      existing.studentId,
      existing.studentName || "Student",
      existing.conceptId,
      existing.conceptName || "Concept",
      existing.subjectCode || "MATH",
      dummyDetection,
      existing.teacherNotes
    );

    store.remedialPlans[index] = {
      ...upgraded,
      id: existing.id,
      studentId: existing.studentId,
      studentName: existing.studentName,
      status: existing.status,
      completedSteps: existing.completedSteps || [],
      teacherNotes: existing.teacherNotes || upgraded.teacherNotes,
      createdAt: existing.createdAt,
      reassessmentResult: existing.reassessmentResult,
    };

    saveStore(store);
    return store.remedialPlans[index];
  },

  getActivities(conceptId?: string): LearningActivity[] {
    const store = loadStore();
    if (!conceptId) return store.activities;
    return store.activities.filter((a) => a.conceptId === conceptId);
  },

  getActivityById(id: string): LearningActivity | undefined {
    return loadStore().activities.find((a) => a.id === id);
  },

  recordActivityAttempt(attemptData: Omit<ActivityAttempt, "id" | "completedAt">): ActivityAttempt {
    const store = loadStore();
    const pct = calculatePercentage(attemptData.score, attemptData.maximumScore);
    const attempt: ActivityAttempt = {
      ...attemptData,
      id: `att-${Date.now()}`,
      percentage: pct,
      completedAt: new Date().toISOString(),
    };
    store.attempts.push(attempt);

    // If associated with a remedial plan, update plan status to 'In Progress' or 'Completed'
    const activity = store.activities.find((a) => a.id === attempt.activityId);
    if (activity) {
      const relatedPlan = store.remedialPlans.find(
        (p) =>
          p.studentId === attempt.studentId &&
          p.conceptId === activity.conceptId &&
          (p.status === "Approved" || p.status === "In Progress" || p.status === "Suggested")
      );
      if (relatedPlan) {
        relatedPlan.status = pct >= 80 ? "Completed" : "In Progress";
      }
    }

    saveStore(store);

    if (isPostgresConfigured()) {
      postgresActivityDb.recordAttempt(attempt).catch((e) =>
        console.error("[PostgreSQL recordAttempt sync error]:", e)
      );
    }

    return attempt;
  },

  getAttempts(studentId?: string): ActivityAttempt[] {
    const store = loadStore();
    if (!studentId) return store.attempts;
    return store.attempts.filter((a) => a.studentId === studentId);
  },

  // --- Parent & Notice Management ---
  getParents(): ParentProfile[] {
    const store = loadStore();
    return store.parents || [];
  },

  getParentById(id: string): ParentProfile | undefined {
    return this.getParents().find((p) => p.id === id);
  },

  getParentByUserId(userId: string): ParentProfile | undefined {
    return this.getParents().find((p) => p.userId === userId);
  },

  async getParentByUserIdAsync(userId: string): Promise<ParentProfile | null> {
    if (isPostgresConfigured()) {
      try {
        const profile = await postgresParentDb.getParentByUserId(userId);
        if (profile) return profile;
      } catch (e) {
        console.error("Postgres error in getParentByUserIdAsync:", e);
      }
    }
    return this.getParentByUserId(userId) || null;
  },

  async getParentByIdAsync(id: string): Promise<ParentProfile | null> {
    if (isPostgresConfigured()) {
      try {
        const profile = await postgresParentDb.getParentById(id);
        if (profile) return profile;
      } catch (e) {
        console.error("Postgres error in getParentByIdAsync:", e);
      }
    }
    return this.getParentById(id) || null;
  },

  getParentByPhone(phone: string): ParentProfile | undefined {
    const cleaned = phone.trim().replace(/[\s\-\(\)]/g, "");
    return this.getParents().find((p) => {
      if (!p.phone) return false;
      const pClean = p.phone.trim().replace(/[\s\-\(\)]/g, "");
      return pClean === cleaned || pClean.endsWith(cleaned) || cleaned.endsWith(pClean);
    });
  },

  async getParentByPhoneAsync(phone: string): Promise<ParentProfile | null> {
    if (isPostgresConfigured()) {
      try {
        const profile = await postgresParentDb.getParentByPhone(phone);
        if (profile) return profile;
      } catch (e) {
        console.error("Postgres error in getParentByPhoneAsync:", e);
      }
    }
    return this.getParentByPhone(phone) || null;
  },

  createParentProfile(data: {
    id?: string;
    userId: string;
    name: string;
    email?: string;
    phone?: string;
    preferredLanguage?: string;
    relationship?: string;
    studentIds?: string[];
  }): ParentProfile {
    const store = loadStore();
    const id = data.id || `par-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newProfile: ParentProfile = {
      id,
      userId: data.userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      preferredLanguage: (data.preferredLanguage as any) || "gu",
      relationship: (data.relationship as any) || "guardian",
      studentIds: data.studentIds || [],
    };
    if (!store.parents) store.parents = [];
    const existingIndex = store.parents.findIndex((p) => p.id === id || p.userId === data.userId);
    if (existingIndex >= 0) {
      store.parents[existingIndex] = {
        ...store.parents[existingIndex],
        ...newProfile,
        studentIds: Array.from(new Set([...(store.parents[existingIndex].studentIds || []), ...(data.studentIds || [])])),
      };
    } else {
      store.parents.push(newProfile);
    }
    saveStore(store);

    if (isPostgresConfigured()) {
      postgresParentDb.createParentProfile(data).catch((e) =>
        console.error("Postgres background createParentProfile error:", e)
      );
    }

    return newProfile;
  },

  async createParentProfileAsync(data: {
    id?: string;
    userId: string;
    name: string;
    email?: string;
    phone?: string;
    preferredLanguage?: string;
    relationship?: string;
    studentIds?: string[];
  }): Promise<ParentProfile> {
    if (isPostgresConfigured()) {
      try {
        return await postgresParentDb.createParentProfile(data);
      } catch (e) {
        console.error("Postgres error in createParentProfileAsync, falling back to local:", e);
      }
    }
    return this.createParentProfile(data);
  },

  async linkParentToStudentAsync(parentId: string, studentId: string, relationship = "guardian"): Promise<boolean> {
    const store = loadStore();
    const parent = (store.parents || []).find((p) => p.id === parentId || p.userId === parentId);
    if (parent) {
      if (!parent.studentIds) parent.studentIds = [];
      if (!parent.studentIds.includes(studentId)) {
        parent.studentIds.push(studentId);
        saveStore(store);
      }
    }

    if (isPostgresConfigured()) {
      try {
        await postgresParentDb.linkParentToStudent(parentId, studentId, relationship);
      } catch (e) {
        console.error("Postgres error in linkParentToStudentAsync:", e);
      }
    }
    return true;
  },

  async getLinkedStudentsForParentAsync(parentId: string): Promise<Student[]> {
    if (isPostgresConfigured()) {
      try {
        const students = await postgresParentDb.getLinkedStudentsForParent(parentId);
        if (students && students.length > 0) return students;
      } catch (e) {
        console.error("Postgres error in getLinkedStudentsForParentAsync:", e);
      }
    }
    const parent = this.getParentById(parentId) || this.getParentByUserId(parentId);
    if (!parent || !parent.studentIds || parent.studentIds.length === 0) return [];
    return this.getStudents().filter((s) => parent.studentIds.includes(s.id));
  },

  async createLinkingCodeAsync(studentId: string, createdByUserId?: string, expiresInDays = 7): Promise<ParentLinkingCode> {
    if (isPostgresConfigured()) {
      try {
        return await postgresParentDb.createLinkingCode(studentId, createdByUserId, expiresInDays);
      } catch (e) {
        console.error("Postgres error in createLinkingCodeAsync, falling back to local:", e);
      }
    }
    const store = loadStore();
    if (!store.parentLinkingCodes) store.parentLinkingCodes = [];
    const id = `plc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `PAR-${randomSuffix}`;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    const linkingCode: ParentLinkingCode = {
      id,
      studentId,
      code,
      expiresAt,
      status: "active",
      createdByUserId,
      createdAt: new Date().toISOString(),
    };
    store.parentLinkingCodes.push(linkingCode);
    saveStore(store);
    return linkingCode;
  },

  async getLinkingCodeAsync(code: string): Promise<ParentLinkingCode | null> {
    if (isPostgresConfigured()) {
      try {
        const found = await postgresParentDb.getLinkingCode(code);
        if (found) return found;
      } catch (e) {
        console.error("Postgres error in getLinkingCodeAsync:", e);
      }
    }
    const store = loadStore();
    const normalized = code.trim().toUpperCase();
    return (store.parentLinkingCodes || []).find((c) => c.code.toUpperCase() === normalized) || null;
  },

  async redeemLinkingCodeAsync(
    code: string,
    parentUserId: string,
    parentProfileId: string
  ): Promise<{ success: boolean; studentId?: string; error?: string }> {
    if (isPostgresConfigured()) {
      try {
        return await postgresParentDb.redeemLinkingCode(code, parentUserId, parentProfileId);
      } catch (e) {
        console.error("Postgres error in redeemLinkingCodeAsync, falling back to local:", e);
      }
    }

    const store = loadStore();
    const normalized = code.trim().toUpperCase();
    const linkingCode = (store.parentLinkingCodes || []).find((c) => c.code.toUpperCase() === normalized);
    if (!linkingCode) {
      return { success: false, error: "Invalid verification code. Please check the code provided by your school." };
    }
    if (linkingCode.status === "used") {
      return { success: false, error: "This linking code has already been redeemed." };
    }
    if (new Date(linkingCode.expiresAt).getTime() < Date.now()) {
      linkingCode.status = "expired";
      saveStore(store);
      return { success: false, error: "This linking code has expired. Please request a new code from the school teacher." };
    }

    linkingCode.status = "used";
    linkingCode.usedByUserId = parentUserId;
    linkingCode.usedAt = new Date().toISOString();

    // Link parent profile
    const parent = (store.parents || []).find((p) => p.id === parentProfileId || p.userId === parentUserId);
    if (parent) {
      if (!parent.studentIds) parent.studentIds = [];
      if (!parent.studentIds.includes(linkingCode.studentId)) {
        parent.studentIds.push(linkingCode.studentId);
      }
    }

    saveStore(store);
    return { success: true, studentId: linkingCode.studentId };
  },

  async getLinkingCodesForStudentAsync(studentId: string): Promise<ParentLinkingCode[]> {
    if (isPostgresConfigured()) {
      try {
        const codes = await postgresParentDb.getLinkingCodesForStudent(studentId);
        if (codes && codes.length > 0) return codes;
      } catch (e) {
        console.error("Postgres error in getLinkingCodesForStudentAsync:", e);
      }
    }
    const store = loadStore();
    return (store.parentLinkingCodes || []).filter((c) => c.studentId === studentId);
  },

  async createParentMessageAsync(
    parentId: string,
    studentId: string,
    subject: string,
    message: string
  ): Promise<ParentMessage> {
    if (isPostgresConfigured()) {
      try {
        return await postgresParentDb.createParentMessage(parentId, studentId, subject, message);
      } catch (e) {
        console.error("Postgres error in createParentMessageAsync, falling back to local:", e);
      }
    }
    const store = loadStore();
    if (!store.parentMessages) store.parentMessages = [];
    const id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newMsg: ParentMessage = {
      id,
      parentId,
      studentId,
      subject,
      message,
      status: "sent",
      createdAt: new Date().toISOString(),
    };
    store.parentMessages.push(newMsg);
    saveStore(store);
    return newMsg;
  },

  async getMessagesForParentAsync(parentId: string): Promise<ParentMessage[]> {
    if (isPostgresConfigured()) {
      try {
        const messages = await postgresParentDb.getMessagesForParent(parentId);
        if (messages && messages.length > 0) return messages;
      } catch (e) {
        console.error("Postgres error in getMessagesForParentAsync:", e);
      }
    }
    const store = loadStore();
    return (store.parentMessages || []).filter((m) => m.parentId === parentId);
  },

  async recordParentActivityCompletionAsync(
    parentId: string,
    studentId: string,
    activityId: string,
    conceptId?: string,
    completed = true
  ): Promise<{ success: boolean; completion: any }> {
    const store = loadStore();
    if (!store.parentActivityCompletions) {
      store.parentActivityCompletions = [];
    }

    const id = `cmp-${parentId}-${studentId}-${activityId}`;
    const existingIndex = store.parentActivityCompletions.findIndex(
      (c) => c.id === id || (c.studentId === studentId && c.activityId === activityId)
    );

    let completionObj: any;
    if (existingIndex >= 0) {
      store.parentActivityCompletions[existingIndex].completed = completed;
      store.parentActivityCompletions[existingIndex].completedAt = new Date().toISOString();
      completionObj = store.parentActivityCompletions[existingIndex];
    } else {
      completionObj = {
        id,
        parentId,
        studentId,
        activityId,
        conceptId: conceptId || "",
        completed,
        completedAt: new Date().toISOString(),
      };
      store.parentActivityCompletions.push(completionObj);
    }

    saveStore(store);

    if (isPostgresConfigured()) {
      try {
        const pgCompletion = await postgresParentDb.recordActivityCompletion(
          parentId,
          studentId,
          activityId,
          conceptId || "",
          completed
        );
        if (pgCompletion) return { success: true, completion: pgCompletion };
      } catch (e) {
        console.error("Postgres error in recordParentActivityCompletionAsync:", e);
      }
    }

    return { success: true, completion: completionObj };
  },

  async getParentActivityCompletionsAsync(studentId: string): Promise<any[]> {
    if (isPostgresConfigured()) {
      try {
        const pgCompletions = await postgresParentDb.getActivityCompletions(studentId);
        if (pgCompletions && pgCompletions.length > 0) return pgCompletions;
      } catch (e) {
        console.error("Postgres error in getParentActivityCompletionsAsync:", e);
      }
    }
    const store = loadStore();
    return (store.parentActivityCompletions || []).filter(
      (c) => c.studentId === studentId && c.completed === true
    );
  },

  getParentsByStudentId(studentId: string): ParentProfile[] {
    return this.getParents().filter((p) => p.studentIds.includes(studentId));
  },

  getNotices(filter?: { category?: string; status?: string; grade?: number }): SchoolNotice[] {
    const store = loadStore();
    let notices = store.notices || [];
    if (filter?.category && filter.category !== "all") {
      notices = notices.filter((n) => n.category === filter.category);
    }
    if (filter?.status && filter.status !== "all") {
      notices = notices.filter((n) => n.status === filter.status);
    }
    if (filter?.grade) {
      notices = notices.filter(
        (n) => n.targetAudience === "all" || n.targetClassGrade === filter.grade
      );
    }
    return notices;
  },

  getNoticeById(id: string): SchoolNotice | undefined {
    const store = loadStore();
    return (store.notices || []).find((n) => n.id === id);
  },

  saveNotice(noticeData: Omit<SchoolNotice, "id" | "createdAt" | "updatedAt">): SchoolNotice {
    const store = loadStore();
    if (!store.notices) store.notices = [];
    const now = new Date().toISOString();
    const notice: SchoolNotice = {
      ...noticeData,
      id: `not-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    store.notices.unshift(notice);
    saveStore(store);
    return notice;
  },

  updateNotice(id: string, updates: Partial<SchoolNotice>): SchoolNotice | null {
    const store = loadStore();
    if (!store.notices) store.notices = [];
    const idx = store.notices.findIndex((n) => n.id === id);
    if (idx === -1) return null;
    store.notices[idx] = {
      ...store.notices[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveStore(store);
    return store.notices[idx];
  },

  deleteNotice(id: string): boolean {
    const store = loadStore();
    if (!store.notices) return false;
    const initialLen = store.notices.length;
    store.notices = store.notices.filter((n) => n.id !== id);
    if (store.notices.length !== initialLen) {
      if (store.translations) {
        store.translations = store.translations.filter((t) => t.noticeId !== id);
      }
      if (store.deliveries) {
        store.deliveries = store.deliveries.filter((d) => d.noticeId !== id);
      }
      saveStore(store);
      return true;
    }
    return false;
  },

  getTranslations(noticeId?: string): NoticeTranslation[] {
    const store = loadStore();
    const list = store.translations || [];
    if (!noticeId) return list;
    return list.filter((t) => t.noticeId === noticeId);
  },

  saveTranslation(translationData: Omit<NoticeTranslation, "id" | "updatedAt">): NoticeTranslation {
    const store = loadStore();
    if (!store.translations) store.translations = [];
    const existingIdx = store.translations.findIndex(
      (t) => t.noticeId === translationData.noticeId && t.language === translationData.language
    );
    const now = new Date().toISOString();
    let result: NoticeTranslation;
    if (existingIdx !== -1) {
      store.translations[existingIdx] = {
        ...store.translations[existingIdx],
        ...translationData,
        updatedAt: now,
      };
      result = store.translations[existingIdx];
    } else {
      result = {
        ...translationData,
        id: `tr-${Date.now()}-${translationData.language}`,
        updatedAt: now,
      };
      store.translations.push(result);
    }
    saveStore(store);
    return result;
  },

  getDeliveries(noticeId?: string, parentId?: string): NoticeDelivery[] {
    const store = loadStore();
    let deliveries = store.deliveries || [];
    if (noticeId) {
      deliveries = deliveries.filter((d) => d.noticeId === noticeId);
    }
    if (parentId) {
      deliveries = deliveries.filter((d) => d.parentId === parentId);
    }
    return deliveries;
  },

  sendNoticeToParents(
    noticeId: string,
    options?: { grade?: number; section?: string; studentIds?: string[] }
  ): NoticeDelivery[] {
    const store = loadStore();
    const notice = this.getNoticeById(noticeId);
    if (!notice) return [];

    let targetStudents = store.students || [];
    if (options?.grade) {
      targetStudents = targetStudents.filter((s) => s.grade === options.grade);
    }
    if (options?.section) {
      targetStudents = targetStudents.filter((s) => s.section === options.section);
    }
    if (options?.studentIds && options.studentIds.length > 0) {
      targetStudents = targetStudents.filter((s) => options.studentIds!.includes(s.id));
    }

    if (!store.deliveries) store.deliveries = [];
    const now = new Date().toISOString();
    const createdDeliveries: NoticeDelivery[] = [];

    for (const student of targetStudents) {
      const parents = this.getParentsByStudentId(student.id);
      const parent = parents[0] || {
        id: `par-gen-${student.id}`,
        name: `Parent of ${student.displayName}`,
        preferredLanguage: "gu",
      };

      // Check if delivery already exists to avoid duplicates
      const exists = store.deliveries.some(
        (d) => d.noticeId === noticeId && d.studentId === student.id
      );
      if (!exists) {
        const delivery: NoticeDelivery = {
          id: `del-${Date.now()}-${student.id}`,
          noticeId,
          parentId: parent.id,
          parentName: parent.name,
          studentId: student.id,
          studentName: student.displayName,
          studentGrade: student.grade,
          studentSection: student.section,
          language: (parent.preferredLanguage as any) || "gu",
          channel: "whatsapp",
          status: "delivered",
          sentAt: now,
          deliveredAt: now,
        };
        store.deliveries.push(delivery);
        createdDeliveries.push(delivery);
      }
    }

    // Mark notice as sent
    this.updateNotice(noticeId, { status: "sent", sentAt: now });
    saveStore(store);
    return createdDeliveries;
  },

  recordAcknowledgment(deliveryId: string, feedback?: string): NoticeDelivery | null {
    const store = loadStore();
    if (!store.deliveries) return null;
    const delivery = store.deliveries.find((d) => d.id === deliveryId);
    if (!delivery) return null;
    const now = new Date().toISOString();
    delivery.status = "acknowledged";
    delivery.readAt = delivery.readAt || now;
    delivery.acknowledgedAt = now;
    if (feedback) delivery.parentFeedback = feedback;
    saveStore(store);
    return delivery;
  },

  // --- AI Provider Configurations & Metrics ---
  getAiProviderConfigs(): AiProviderConfig[] {
    const store = loadStore();
    return store.aiConfigs || SEED_AI_CONFIGS;
  },

  updateAiProviderConfig(task: string, updates: Partial<AiProviderConfig>): AiProviderConfig[] {
    const store = loadStore();
    if (!store.aiConfigs) store.aiConfigs = [...SEED_AI_CONFIGS];
    const idx = store.aiConfigs.findIndex((c) => c.task === task);
    if (idx !== -1) {
      store.aiConfigs[idx] = { ...store.aiConfigs[idx], ...updates };
    } else {
      store.aiConfigs.push({
        task: task as any,
        primaryProvider: (updates.primaryProvider as any) || "offline_fallback",
        fallbackProvider: updates.fallbackProvider as any,
        enabled: updates.enabled ?? true,
      });
    }
    saveStore(store);
    return store.aiConfigs;
  },

  getAiMetrics(): AiUsageMetric[] {
    const store = loadStore();
    return store.aiMetrics || [];
  },

  recordAiMetric(metric: AiUsageMetric): void {
    const store = loadStore();
    if (!store.aiMetrics) store.aiMetrics = [];
    store.aiMetrics.unshift(metric);
    // Keep last 200 metrics to avoid storage bloat
    if (store.aiMetrics.length > 200) {
      store.aiMetrics = store.aiMetrics.slice(0, 200);
    }
    saveStore(store);
  },

  getFeedback(): { id: string; email: string; message?: string; submittedAt: string }[] {
    const store = loadStore();
    return store.feedback || [];
  },

  saveFeedback(email: string, message?: string): { id: string; email: string; message?: string; submittedAt: string } {
    const store = loadStore();
    if (!store.feedback) store.feedback = [];
    const item = {
      id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email,
      message,
      submittedAt: new Date().toISOString(),
    };
    store.feedback.unshift(item);
    saveStore(store);
    return item;
  },


  getUsers(): User[] {
    const store = loadStore();
    return store.users || [];
  },

  getUserById(id: string): User | null {
    const store = loadStore();
    return (store.users || []).find((u) => u.id === id) || null;
  },

  getUserByEmail(email: string): User | null {
    const store = loadStore();
    const normalized = email.trim().toLowerCase();
    return (store.users || []).find((u) => u.email.toLowerCase() === normalized) || null;
  },

  getUserByGoogleId(googleId: string): User | null {
    const store = loadStore();
    return (store.users || []).find((u) => u.googleId === googleId) || null;
  },

  getUserByPhone(phone: string): User | null {
    const store = loadStore();
    const cleaned = phone.trim().replace(/[\s\-\(\)]/g, "");
    return (
      (store.users || []).find((u) => {
        if (!u.phone) return false;
        const uClean = u.phone.trim().replace(/[\s\-\(\)]/g, "");
        return uClean === cleaned || uClean.endsWith(cleaned) || cleaned.endsWith(uClean);
      }) || null
    );
  },

  createUser(userData: Partial<User> & { email: string; name: string }): User {
    const store = loadStore();
    const usersList = store.users || JSON.parse(JSON.stringify(SEED_USERS));
    store.users = usersList;
    const normalizedEmail = userData.email.trim().toLowerCase();
    const existing = usersList.find((u: User) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      throw new Error("A user with this email address already exists.");
    }

    const now = new Date().toISOString();
    const newUser: User = {
      id: userData.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: userData.name,
      email: userData.email.trim().toLowerCase(),
      role: userData.role || "teacher",
      schoolId: userData.schoolId || "sch-gn-01",
      googleId: userData.googleId,
      avatarUrl: userData.avatarUrl,
      provider: userData.provider || "local",
      passwordHash: userData.passwordHash,
      status: userData.status || "active",
      createdAt: now,
      updatedAt: now,
    };
    usersList.push(newUser);
    saveStore(store);
    return newUser;
  },

  updateUser(id: string, updates: Partial<User>): User | null {
    const store = loadStore();
    const usersList = store.users || JSON.parse(JSON.stringify(SEED_USERS));
    store.users = usersList;
    const index = usersList.findIndex((u: User) => u.id === id);
    if (index === -1) return null;

    const existing = usersList[index];
    const updated: User = {
      ...existing,
      ...updates,
      id: existing.id,
      email: existing.email,
      updatedAt: new Date().toISOString(),
    };
    usersList[index] = updated;
    saveStore(store);
    return updated;
  },

  deleteUser(id: string): boolean {
    const store = loadStore();
    const usersList = store.users || JSON.parse(JSON.stringify(SEED_USERS));
    const index = usersList.findIndex((u: User) => u.id === id);
    if (index === -1) return false;
    usersList.splice(index, 1);
    store.users = usersList;
    saveStore(store);
    return true;
  },

  upsertUser(userData: Partial<User> & { email: string }): User {
    const store = loadStore();
    const usersList = store.users || JSON.parse(JSON.stringify(SEED_USERS));
    store.users = usersList;
    const normalizedEmail = userData.email.trim().toLowerCase();
    const existingIndex = usersList.findIndex(
      (u: User) =>
        (userData.googleId && u.googleId === userData.googleId) ||
        u.email.toLowerCase() === normalizedEmail
    );

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const existing = usersList[existingIndex];
      const updated: User = {
        ...existing,
        ...userData,
        id: existing.id,
        role: existing.role || userData.role || "teacher",
        schoolId: existing.schoolId || userData.schoolId || "sch-gn-01",
        passwordHash: userData.passwordHash || existing.passwordHash,
        status: userData.status || existing.status || "active",
        updatedAt: now,
      };
      usersList[existingIndex] = updated;
      saveStore(store);
      return updated;
    } else {
      const newUser: User = {
        id: userData.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: userData.name || "Educator",
        email: userData.email.trim().toLowerCase(),
        role: userData.role || "teacher",
        schoolId: userData.schoolId || "sch-gn-01",
        googleId: userData.googleId,
        avatarUrl: userData.avatarUrl,
        provider: userData.provider || "google",
        passwordHash: userData.passwordHash,
        status: userData.status || "active",
        createdAt: now,
        updatedAt: now,
      };
      usersList.push(newUser);
      saveStore(store);
      return newUser;
    }
  },

  async getUsersAsync(): Promise<User[]> {
    if (isPostgresConfigured()) {
      return postgresUserDb.getAllUsers();
    }
    return this.getUsers();
  },

  async getUserByIdAsync(id: string): Promise<User | null> {
    if (isPostgresConfigured()) {
      return postgresUserDb.getUserById(id);
    }
    return this.getUserById(id);
  },

  async getUserByEmailAsync(email: string): Promise<User | null> {
    if (isPostgresConfigured()) {
      return postgresUserDb.getUserByEmail(email);
    }
    return this.getUserByEmail(email);
  },

  async getUserByGoogleIdAsync(googleId: string): Promise<User | null> {
    if (isPostgresConfigured()) {
      return postgresUserDb.getUserByGoogleId(googleId);
    }
    return this.getUserByGoogleId(googleId);
  },

  async getUserByPhoneAsync(phone: string): Promise<User | null> {
    if (isPostgresConfigured()) {
      return postgresUserDb.getUserByPhone(phone);
    }
    return this.getUserByPhone(phone);
  },

  async createUserAsync(userData: Partial<User> & { email: string; name: string }): Promise<User> {
    if (isPostgresConfigured()) {
      return postgresUserDb.createUser(userData);
    }
    return this.createUser(userData);
  },

  async updateUserAsync(id: string, updates: Partial<User>): Promise<User | null> {
    if (isPostgresConfigured()) {
      return postgresUserDb.updateUser(id, updates);
    }
    return this.updateUser(id, updates);
  },

  async deleteUserAsync(id: string): Promise<boolean> {
    if (isPostgresConfigured()) {
      return postgresUserDb.deleteUser(id);
    }
    return this.deleteUser(id);
  },

  async upsertUserAsync(userData: Partial<User> & { email: string }): Promise<User> {
    if (isPostgresConfigured()) {
      return postgresUserDb.upsertUser(userData);
    }
    return this.upsertUser(userData);
  },

  resetToDemoData(): void {
    const fresh = getInitialStore();
    saveStore(fresh);
  },
};
