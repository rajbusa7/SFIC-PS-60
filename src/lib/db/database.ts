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
  SEED_TEACHER_ASSIGNMENTS,
  SEED_INTERVENTION_RECORDS,
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
  postgresTeacherAssignmentDb,
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
  GmailConnection,
  TeacherAssignment,
  AuditLogEntry,
  SubjectCode,
  InterventionRecord,
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
  gmailConnection?: GmailConnection;
  worksheets?: any[];
  worksheetSubmissions?: any[];
  teacherAssignments?: TeacherAssignment[];
  auditLogs?: AuditLogEntry[];
  interventionRecords?: InterventionRecord[];
  parentHomeActivities?: any[];
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
    teacherAssignments: JSON.parse(JSON.stringify(SEED_TEACHER_ASSIGNMENTS)),
    auditLogs: [],
    interventionRecords: JSON.parse(JSON.stringify(SEED_INTERVENTION_RECORDS)),
    parentHomeActivities: [],
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
          let storeNeedsSync = false;

          if (!memoryStore.teacherAssignments) {
            memoryStore.teacherAssignments = JSON.parse(JSON.stringify(SEED_TEACHER_ASSIGNMENTS));
            storeNeedsSync = true;
          }
          if (!memoryStore.auditLogs) {
            memoryStore.auditLogs = [];
            storeNeedsSync = true;
          }
          if (!memoryStore.users) {
            memoryStore.users = JSON.parse(JSON.stringify(SEED_USERS));
            storeNeedsSync = true;
          } else {
            for (const user of SEED_USERS) {
              if (!memoryStore.users.some((u) => u.id === user.id)) {
                memoryStore.users.push(JSON.parse(JSON.stringify(user)));
                storeNeedsSync = true;
              }
            }
          }
          if (!memoryStore.activities || memoryStore.activities.length < SEED_ACTIVITIES.length) {
            memoryStore.activities = JSON.parse(JSON.stringify(SEED_ACTIVITIES));
            storeNeedsSync = true;
          }

          // Auto-sync seed classrooms if missing (e.g. cls-1a, cls-2a)
          if (!memoryStore.classrooms) memoryStore.classrooms = [];
          for (const cls of SEED_CLASSROOMS) {
            if (!memoryStore.classrooms.some((c) => c.id === cls.id)) {
              memoryStore.classrooms.push(JSON.parse(JSON.stringify(cls)));
              storeNeedsSync = true;
            }
          }
          // Auto-sync seed students if missing (e.g. Grade 1 and Grade 2 students)
          if (!memoryStore.students) memoryStore.students = [];
          for (const std of SEED_STUDENTS) {
            if (!memoryStore.students.some((s) => s.id === std.id)) {
              memoryStore.students.push(JSON.parse(JSON.stringify(std)));
              storeNeedsSync = true;
            }
          }
          // Auto-sync seed learning gaps if missing
          if (!memoryStore.learningGaps) memoryStore.learningGaps = [];
          for (const gap of SEED_LEARNING_GAPS) {
            if (!memoryStore.learningGaps.some((g) => g.id === gap.id)) {
              memoryStore.learningGaps.push(JSON.parse(JSON.stringify(gap)));
              storeNeedsSync = true;
            }
          }
          if (storeNeedsSync) {
            try {
              saveStore(memoryStore);
            } catch (err) {
              console.warn("Could not persist auto-synced seed records:", err);
            }
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
      // Guard against accidental duplicate submissions or update existing record for same assessment + student + concept
      const existingRecordIndex = store.results.findIndex((existing) => {
        if (
          r.assessmentId &&
          existing.assessmentId === r.assessmentId &&
          existing.studentId === r.studentId &&
          (!r.conceptId || existing.conceptId === r.conceptId)
        ) {
          return true;
        }
        if (
          existing.studentId === r.studentId &&
          existing.conceptId === r.conceptId &&
          existing.marksObtained === Number(r.marksObtained) &&
          existing.maximumMarks === Number(r.maximumMarks)
        ) {
          const existingTime = new Date(existing.recordedAt).getTime();
          const newTime = new Date(r.recordedAt || Date.now()).getTime();
          if (Math.abs(newTime - existingTime) < 3000) return true;
        }
        return false;
      });

      const pct = calculatePercentage(r.marksObtained, r.maximumMarks);

      if (existingRecordIndex !== -1) {
        const existing = store.results[existingRecordIndex];
        // If it is an update to marks or notes
        if (existing.marksObtained !== Number(r.marksObtained) || existing.maximumMarks !== Number(r.maximumMarks)) {
          existing.marksObtained = Number(r.marksObtained);
          existing.maximumMarks = Number(r.maximumMarks);
          existing.percentage = pct;
          existing.recordedAt = r.recordedAt || new Date().toISOString();
          if (r.notes !== undefined) existing.notes = r.notes;
        }
        created.push(existing);
        studentIds.add(r.studentId);
        continue;
      }

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
    const gaps = !studentId ? store.learningGaps : store.learningGaps.filter((g) => g.studentId === studentId);
    return gaps.map((g) => {
      let enriched = { ...g };

      const plan = g.remedialPlanId
        ? store.remedialPlans?.find((p) => p.id === g.remedialPlanId)
        : store.remedialPlans?.find((p) => p.studentId === g.studentId && p.conceptId === g.conceptId);

      if (plan) {
        enriched.remedialPlanId = plan.id;
        const isCompleted =
          plan.status === "Completed" ||
          (Array.isArray(plan.completedSteps) && Array.isArray(plan.steps) && plan.completedSteps.length >= plan.steps.length);
        enriched.remedialPlanStatus = plan.status;
        enriched.reassessmentDue = (isCompleted || (plan as any).reassessmentDue === true) && !plan.reassessmentResult;
      }

      // Longitudinal assessment history lookup from recorded results
      const cResults = (store.results || [])
        .filter((r) => r.studentId === g.studentId && r.conceptId === g.conceptId)
        .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

      if (cResults.length > 0) {
        enriched.assessmentHistory = cResults.map((r, idx) => {
          const score = r.percentage;
          const prevScore = idx > 0 ? cResults[idx - 1].percentage : undefined;
          const scoreDelta = prevScore !== undefined ? Math.round((score - prevScore) * 10) / 10 : undefined;
          const status = score >= 80 ? "Mastered" : score >= 60 ? "Developing" : "Needs Support";
          const assessmentTitle =
            idx === 0
              ? "Initial Assessment"
              : idx === cResults.length - 1
              ? "Latest Reassessment"
              : `Progress Check #${idx}`;
          return {
            id: r.id,
            assessmentId: r.assessmentId,
            date: r.recordedAt,
            score,
            marks: `${r.marksObtained}/${r.maximumMarks}`,
            assessment: r.notes?.includes("Assessment") ? r.notes : assessmentTitle,
            intervention: idx > 0 ? (g.remedialPlanId ? "Targeted 5-Step Remedial Plan" : "Guided Practice Session") : undefined,
            status,
            scoreDelta,
            notes: r.notes || "",
          };
        });

        enriched.numberOfAssessments = cResults.length;
        enriched.totalImprovement =
          cResults.length >= 2
            ? Math.round((cResults[cResults.length - 1].percentage - cResults[0].percentage) * 10) / 10
            : 0;
        enriched.latestScoreDelta =
          cResults.length >= 2
            ? Math.round((cResults[cResults.length - 1].percentage - cResults[cResults.length - 2].percentage) * 10) / 10
            : g.deltaPercentagePoints;

        // Gap Reopening Evaluation
        const priorMasteryIndex = cResults.slice(0, -1).findIndex((r) => r.percentage >= 80);
        if (priorMasteryIndex !== -1 && (cResults[cResults.length - 1]?.percentage ?? g.latestPercentage) < 80) {
          enriched.gapReopened = true;
          enriched.previousMasteryScore = cResults[priorMasteryIndex].percentage;
          enriched.masteryDate = cResults[priorMasteryIndex].recordedAt;
        }
      } else {
        // If zero result records exist, format single observation cleanly without fabricating history
        enriched.assessmentHistory = [
          {
            score: g.latestPercentage,
            date: g.updatedAt,
            assessment: "Initial Assessment",
            status: g.masteryStatus,
          },
        ];
        enriched.numberOfAssessments = 1;
        enriched.totalImprovement = 0;
        enriched.latestScoreDelta = undefined;
      }

      return enriched;
    });
  },

  getLearningGapById(id: string): LearningGap | null {
    const store = loadStore();
    return store.learningGaps.find((g) => g.id === id) || null;
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
          suggestedAction: detection.suggestedAction,
          diagnosis: detection.diagnosis,
          gapType: detection.gapType,
          diagnosisType: (detection.gapType || detection.diagnosis) as any,
          status: detection.masteryStatus === "Mastered" ? "Resolved" : existing.status,
          attemptsCount: detection.attemptsCount,
          latestPercentage: detection.latestPercentage,
          previousPercentage: detection.previousPercentage,
          deltaPercentagePoints: detection.deltaPercentagePoints,
          trend: detection.trend ?? undefined,
          trendLabel: detection.trendText,
          trendText: detection.trendText,
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
          suggestedAction: detection.suggestedAction,
          diagnosis: detection.diagnosis,
          gapType: detection.gapType,
          diagnosisType: (detection.gapType || detection.diagnosis) as any,
          status: "Active",
          attemptsCount: detection.attemptsCount,
          latestPercentage: detection.latestPercentage,
          previousPercentage: detection.previousPercentage,
          deltaPercentagePoints: detection.deltaPercentagePoints,
          trend: detection.trend ?? undefined,
          trendLabel: detection.trendText,
          trendText: detection.trendText,
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

  createRemedialPlanForGap(gapId: string, customNotes?: string, extraOptions?: any): RemedialPlan | null {
    const store = loadStore();
    const gap = store.learningGaps.find((g) => g.id === gapId);
    if (!gap) return null;

    // Mastered competencies do not require a remedial plan (Phase 4 requirement)
    if (gap.masteryStatus === "Mastered" || gap.status === "Resolved") {
      return null;
    }

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

    const rootConceptName = extraOptions?.rootConceptName || (gap as any).rootConcept?.name || (gap as any).dynamicRootConcept?.name;
    const isRootGapIdentified = extraOptions?.isRootGapIdentified ?? (gap as any).isRootGapIdentified ?? (gap as any).dynamicIsRootGapIdentified;
    const errorPattern = extraOptions?.errorPattern || (gap as any).errorPatternDetected || (gap as any).dynamicErrorPatternDetected || (gap as any).reason;
    const suggestedModality = extraOptions?.suggestedModality || (gap as any).dynamicPrescription?.suggestedModality;
    const approximateDuration = extraOptions?.approximateDuration || (gap as any).dynamicPrescription?.approximateDuration;
    const pedagogicalRationale = extraOptions?.pedagogicalRationale || (gap as any).dynamicPrescription?.reason;
    const recommendedAction = extraOptions?.recommendedAction || (gap as any).dynamicPrescription?.recommendedAction || gap.suggestedAction;

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
        knownMisconceptions: errorPattern || detection.reason,
        confirmedOrInferred,
        masteryBenchmark: store.settings.masteryThreshold || 80,
        rootConceptName,
        isRootGapIdentified,
        errorPattern,
        suggestedModality,
        approximateDuration,
        pedagogicalRationale,
        recommendedAction,
        language: extraOptions?.language || "en",
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
    if (!id || typeof id !== "string") return null;
    const store = loadStore();
    const clean = id.trim().toLowerCase();
    return (
      (store.users || []).find(
        (u) =>
          u.id.toLowerCase() === clean ||
          (u.email && u.email.toLowerCase() === clean) ||
          (u.googleId && u.googleId.toLowerCase() === clean)
      ) || null
    );
  },

  getUserByEmail(email: string): User | null {
    if (!email || typeof email !== "string") return null;
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
      try {
        const users = await postgresUserDb.getAllUsers();
        if (users && users.length > 0) return users;
      } catch (err) {
        console.warn("[Database] PostgreSQL getAllUsers failed, falling back to persistent store:", (err as any)?.message);
      }
    }
    return this.getUsers();
  },

  async getUserByIdAsync(id: string): Promise<User | null> {
    if (isPostgresConfigured()) {
      try {
        const user = await postgresUserDb.getUserById(id);
        if (user) return user;
      } catch (err) {
        console.warn("[Database] PostgreSQL getUserById failed, falling back to persistent store:", (err as any)?.message);
      }
    }
    return this.getUserById(id);
  },

  async getUserByEmailAsync(email: string): Promise<User | null> {
    if (isPostgresConfigured()) {
      try {
        const user = await postgresUserDb.getUserByEmail(email);
        if (user) return user;
      } catch (err) {
        console.warn("[Database] PostgreSQL getUserByEmail failed, falling back to persistent store:", (err as any)?.message);
      }
    }
    return this.getUserByEmail(email);
  },

  async getUserByGoogleIdAsync(googleId: string): Promise<User | null> {
    if (isPostgresConfigured()) {
      try {
        const user = await postgresUserDb.getUserByGoogleId(googleId);
        if (user) return user;
      } catch (err) {
        console.warn("[Database] PostgreSQL getUserByGoogleId failed, falling back to persistent store:", (err as any)?.message);
      }
    }
    return this.getUserByGoogleId(googleId);
  },

  async getUserByPhoneAsync(phone: string): Promise<User | null> {
    if (isPostgresConfigured()) {
      try {
        const user = await postgresUserDb.getUserByPhone(phone);
        if (user) return user;
      } catch (err) {
        console.warn("[Database] PostgreSQL getUserByPhone failed, falling back to persistent store:", (err as any)?.message);
      }
    }
    return this.getUserByPhone(phone);
  },

  async createUserAsync(userData: Partial<User> & { email: string; name: string }): Promise<User> {
    let pgUser: User | null = null;
    if (isPostgresConfigured()) {
      try {
        pgUser = await postgresUserDb.createUser(userData);
      } catch (err) {
        console.warn("[Database] PostgreSQL createUser failed, writing to persistent store:", (err as any)?.message);
      }
    }
    const localUser = this.createUser(userData);
    return pgUser || localUser;
  },

  async updateUserAsync(id: string, updates: Partial<User>): Promise<User | null> {
    let pgUser: User | null = null;
    if (isPostgresConfigured()) {
      try {
        pgUser = await postgresUserDb.updateUser(id, updates);
      } catch (err) {
        console.warn("[Database] PostgreSQL updateUser failed, falling back to persistent store:", (err as any)?.message);
      }
    }
    const localUser = this.updateUser(id, updates);
    return pgUser || localUser;
  },

  async deleteUserAsync(id: string): Promise<boolean> {
    let pgDeleted = false;
    if (isPostgresConfigured()) {
      try {
        pgDeleted = await postgresUserDb.deleteUser(id);
      } catch (err) {
        console.warn("[Database] PostgreSQL deleteUser failed, falling back to persistent store:", (err as any)?.message);
      }
    }
    const localDeleted = this.deleteUser(id);
    return pgDeleted || localDeleted;
  },

  async upsertUserAsync(userData: Partial<User> & { email: string }): Promise<User> {
    let pgUser: User | null = null;
    if (isPostgresConfigured()) {
      try {
        pgUser = await postgresUserDb.upsertUser(userData);
      } catch (err) {
        console.warn("[Database] PostgreSQL upsertUser failed, falling back to persistent store:", (err as any)?.message);
      }
    }
    const localUser = this.upsertUser(userData);
    return pgUser || localUser;
  },

  getGmailConnection(): GmailConnection | null {
    const store = loadStore();
    return store.gmailConnection || null;
  },

  saveGmailConnection(connection: GmailConnection): void {
    const store = loadStore();
    store.gmailConnection = connection;
    saveStore(store);
  },

  updateGmailConnectionStatus(status: GmailConnection["status"]): void {
    const store = loadStore();
    if (store.gmailConnection) {
      store.gmailConnection.status = status;
      saveStore(store);
    }
  },

  disconnectGmail(): boolean {
    const store = loadStore();
    if (!store.gmailConnection) return false;
    delete store.gmailConnection;
    saveStore(store);
    return true;
  },


  // --- Worksheet & Submission Management ---
  getWorksheets(filters?: { grade?: number; subjectCode?: string; studentId?: string }): any[] {
    const store = loadStore();
    let items = store.worksheets || [];
    if (filters?.grade) items = items.filter((w: any) => w.grade === filters.grade);
    if (filters?.subjectCode) items = items.filter((w: any) => w.subjectCode === filters.subjectCode);
    if (filters?.studentId) items = items.filter((w: any) => w.targetStudentId === filters.studentId);
    return items;
  },

  getWorksheetById(id: string): any | undefined {
    const store = loadStore();
    return (store.worksheets || []).find((w: any) => w.id === id);
  },

  saveWorksheet(worksheet: any): any {
    const store = loadStore();
    if (!store.worksheets) store.worksheets = [];
    const existingIdx = store.worksheets.findIndex((w: any) => w.id === worksheet.id);
    if (existingIdx !== -1) {
      store.worksheets[existingIdx] = worksheet;
    } else {
      store.worksheets.unshift(worksheet);
    }
    saveStore(store);
    return worksheet;
  },

  deleteWorksheet(id: string): boolean {
    const store = loadStore();
    if (!store.worksheets) return false;
    const initialLen = store.worksheets.length;
    store.worksheets = store.worksheets.filter((w: any) => w.id !== id);
    if (store.worksheets.length !== initialLen) {
      saveStore(store);
      return true;
    }
    return false;
  },

  recordWorksheetSubmission(submission: any): any {
    const store = loadStore();
    if (!store.worksheetSubmissions) store.worksheetSubmissions = [];
    store.worksheetSubmissions.unshift(submission);
    saveStore(store);
    return submission;
  },

  getWorksheetSubmissions(worksheetId?: string, studentId?: string): any[] {
    const store = loadStore();
    let subs = store.worksheetSubmissions || [];
    if (worksheetId) subs = subs.filter((s: any) => s.worksheetId === worksheetId);
    if (studentId) subs = subs.filter((s: any) => s.studentId === studentId);
    return subs;
  },


  getTeacherAssignments(teacherId?: string): TeacherAssignment[] {
    const store = loadStore();
    const assignments = store.teacherAssignments || [];
    const users = store.users || [];

    const SUBJECT_METADATA: Record<string, { nameEn: string; nameGu: string }> = {
      MATH: { nameEn: "Mathematics", nameGu: "ગણિત" },
      ENG: { nameEn: "English", nameGu: "અંગ્રેજી" },
      GUJ: { nameEn: "Gujarati", nameGu: "ગુજરાતી" },
      EVS: { nameEn: "Environmental Studies", nameGu: "પર્યાવરણ" },
      SCI: { nameEn: "Science", nameGu: "વિજ્ઞાન" },
      SST: { nameEn: "Social Science", nameGu: "સામાજિક વિજ્ઞાન" },
      HIN: { nameEn: "Hindi", nameGu: "હિન્દી" },
    };

    const enrich = (a: TeacherAssignment): TeacherAssignment => {
      const code = (a.subjectCode || "").toUpperCase() as SubjectCode;
      const meta = SUBJECT_METADATA[code];
      const subjectName = a.subjectName || (meta ? `${meta.nameEn} (${meta.nameGu})` : code);
      const grades = Array.isArray(a.grades) && a.grades.length > 0 ? a.grades : [1, 2, 3, 4, 5];
      const classes = a.classes && a.classes.length > 0 ? a.classes : grades.map((g) => `Class ${g}`);
      const classroomIds = a.classroomIds && a.classroomIds.length > 0 ? a.classroomIds : grades.map((g) => `cls-${g}a`);

      const userObj = users.find(
        (u) =>
          u.id.toLowerCase() === (a.teacherId || "").toLowerCase() ||
          (u.email && u.email.toLowerCase() === (a.teacherEmail || "").toLowerCase()) ||
          (u.email && u.email.toLowerCase() === (a.teacherId || "").toLowerCase())
      );

      return {
        ...a,
        subjectCode: code,
        subjectName,
        grades,
        classes,
        classroomIds,
        teacherName: a.teacherName || userObj?.name || a.teacherId,
        teacherEmail: a.teacherEmail || userObj?.email || "",
      };
    };

    if (!teacherId) {
      return assignments.map(enrich);
    }

    const cleanId = teacherId.trim().toLowerCase();
    const validIds = new Set<string>([cleanId]);

    // Find any user matching this ID, email, or googleId
    const matchedUsers = users.filter(
      (u) =>
        u.id.toLowerCase() === cleanId ||
        (u.email && u.email.toLowerCase() === cleanId) ||
        (u.googleId && u.googleId.toLowerCase() === cleanId) ||
        (u.name && u.name.toLowerCase() === cleanId)
    );

    for (const u of matchedUsers) {
      validIds.add(u.id.toLowerCase());
      if (u.email) validIds.add(u.email.toLowerCase());
      if (u.googleId) validIds.add(u.googleId.toLowerCase());
    }

    // Also collect teacher emails/ids from assignments that match
    for (const a of assignments) {
      const aId = (a.teacherId || "").toLowerCase();
      const aEmail = (a.teacherEmail || "").toLowerCase();
      if (validIds.has(aId) && aEmail) validIds.add(aEmail);
      if (validIds.has(aEmail) && aId) validIds.add(aId);
    }

    return assignments
      .filter((a) => {
        const aId = (a.teacherId || "").toLowerCase();
        const aEmail = (a.teacherEmail || "").toLowerCase();
        return validIds.has(aId) || validIds.has(aEmail);
      })
      .map(enrich);
  },

  getTeacherAssignmentById(id: string): TeacherAssignment | null {
    const store = loadStore();
    return (store.teacherAssignments || []).find((a) => a.id === id) || null;
  },

  setTeacherAssignment(assignment: Omit<TeacherAssignment, "id" | "assignedAt"> & { id?: string }): TeacherAssignment {
    const store = loadStore();
    if (!store.teacherAssignments) store.teacherAssignments = [];
    const users = store.users || [];

    const SUBJECT_METADATA: Record<string, { nameEn: string; nameGu: string }> = {
      MATH: { nameEn: "Mathematics", nameGu: "ગણિત" },
      ENG: { nameEn: "English", nameGu: "અંગ્રેજી" },
      GUJ: { nameEn: "Gujarati", nameGu: "ગુજરાતી" },
      EVS: { nameEn: "Environmental Studies", nameGu: "પર્યાવરણ" },
      SCI: { nameEn: "Science", nameGu: "વિજ્ઞાન" },
      SST: { nameEn: "Social Science", nameGu: "સામાજિક વિજ્ઞાન" },
      HIN: { nameEn: "Hindi", nameGu: "હિન્દી" },
    };

    // Auto-resolve teacher details if missing
    const cleanInputId = (assignment.teacherId || "").trim().toLowerCase();
    const cleanInputEmail = (assignment.teacherEmail || "").trim().toLowerCase();

    // Priority 1: Exact ID match
    const exactIdUser = users.find((u) => u.id.toLowerCase() === cleanInputId);

    // Priority 2: Canonical teacher ID preference
    const canonicalRaj =
      (cleanInputId === "usr-teacher-raj" || cleanInputEmail === "rajbusa63@gmail.com" || cleanInputId === "rajbusa63@gmail.com")
        ? users.find((u) => u.id === "usr-teacher-raj")
        : null;

    const userObj =
      exactIdUser ||
      canonicalRaj ||
      users.find(
        (u) =>
          (u.email && u.email.toLowerCase() === cleanInputId) ||
          (cleanInputEmail && u.email && u.email.toLowerCase() === cleanInputEmail)
      );

    const resolvedTeacherId = userObj ? userObj.id : assignment.teacherId;
    const resolvedName = assignment.teacherName || userObj?.name || assignment.teacherId;
    const resolvedEmail = assignment.teacherEmail || userObj?.email || "";

    const normalizedSubject = (assignment.subjectCode || "").trim().toUpperCase() as SubjectCode;
    const meta = SUBJECT_METADATA[normalizedSubject];
    const resolvedSubjectName = assignment.subjectName || (meta ? `${meta.nameEn} (${meta.nameGu})` : normalizedSubject);

    // Find if assignment already exists for this teacher and subject
    const existingIndex = assignment.id
      ? store.teacherAssignments.findIndex((a) => a.id === assignment.id)
      : store.teacherAssignments.findIndex((a) => {
          if (a.subjectCode !== normalizedSubject) return false;
          const aId = (a.teacherId || "").toLowerCase();
          const aEmail = (a.teacherEmail || "").toLowerCase();
          return (
            aId === resolvedTeacherId.toLowerCase() ||
            aId === cleanInputId ||
            (resolvedEmail && aEmail === resolvedEmail.toLowerCase()) ||
            (cleanInputEmail && aEmail === cleanInputEmail)
          );
        });

    const parsedGrades = assignment.grades && assignment.grades.length > 0
      ? Array.from(new Set(assignment.grades.map(Number))).filter((g) => g >= 1 && g <= 5).sort((a, b) => a - b)
      : [1, 2, 3, 4, 5];
    const parsedClasses = parsedGrades.map((g) => `Class ${g}`);
    const parsedClassroomIds = assignment.classroomIds && assignment.classroomIds.length > 0
      ? assignment.classroomIds
      : parsedGrades.map((g) => `cls-${g}a`);

    if (existingIndex >= 0) {
      const updated: TeacherAssignment = {
        ...store.teacherAssignments[existingIndex],
        ...assignment,
        teacherId: resolvedTeacherId,
        teacherName: resolvedName,
        teacherEmail: resolvedEmail,
        subjectCode: normalizedSubject,
        subjectName: resolvedSubjectName,
        grades: parsedGrades,
        classes: parsedClasses,
        classroomIds: parsedClassroomIds,
        updatedAt: new Date().toISOString(),
      };
      store.teacherAssignments[existingIndex] = updated;
      saveStore(store);
      return updated;
    } else {
      const newAssignment: TeacherAssignment = {
        id: assignment.id || `asg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        teacherId: resolvedTeacherId,
        teacherName: resolvedName,
        teacherEmail: resolvedEmail,
        schoolId: assignment.schoolId || userObj?.schoolId || "sch-gn-01",
        subjectCode: normalizedSubject,
        subjectName: resolvedSubjectName,
        classroomIds: parsedClassroomIds,
        grades: parsedGrades,
        classes: parsedClasses,
        isClassTeacher: Boolean(assignment.isClassTeacher),
        assignedAt: new Date().toISOString(),
      };
      store.teacherAssignments.push(newAssignment);
      saveStore(store);
      return newAssignment;
    }
  },

  deleteTeacherAssignmentsByTeacherId(teacherId: string): number {
    const store = loadStore();
    if (!store.teacherAssignments) return 0;
    const initialLen = store.teacherAssignments.length;
    store.teacherAssignments = store.teacherAssignments.filter((a) => a.teacherId !== teacherId);
    const count = initialLen - store.teacherAssignments.length;
    if (count > 0) {
      saveStore(store);
    }
    return count;
  },

  async deleteTeacherAssignmentsByTeacherIdAsync(teacherId: string): Promise<number> {
    const local = this.deleteTeacherAssignmentsByTeacherId(teacherId);
    if (isPostgresConfigured()) {
      try {
        const count = await postgresTeacherAssignmentDb.deleteAssignmentsByTeacher(teacherId);
        return count;
      } catch (err) {
        console.warn("[Database] PostgreSQL deleteAssignmentsByTeacher failed:", (err as any)?.message);
      }
    }
    return local;
  },

  deleteTeacherAssignment(id: string): boolean {
    const store = loadStore();
    if (!store.teacherAssignments) return false;
    const initialLen = store.teacherAssignments.length;
    store.teacherAssignments = store.teacherAssignments.filter((a) => a.id !== id);
    if (store.teacherAssignments.length !== initialLen) {
      saveStore(store);
      return true;
    }
    return false;
  },

  recordAuditLog(entry: Omit<AuditLogEntry, "id" | "timestamp">): AuditLogEntry {
    const store = loadStore();
    if (!store.auditLogs) store.auditLogs = [];
    const log: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
    };
    store.auditLogs.unshift(log);
    saveStore(store);
    return log;
  },

  getAuditLogs(filter?: { teacherId?: string; studentId?: string; subjectCode?: SubjectCode }): AuditLogEntry[] {
    const store = loadStore();
    let logs = store.auditLogs || [];
    if (filter?.teacherId) logs = logs.filter((l) => l.teacherId === filter.teacherId);
    if (filter?.studentId) logs = logs.filter((l) => l.studentId === filter.studentId);
    if (filter?.subjectCode) logs = logs.filter((l) => l.subjectCode === filter.subjectCode);
    return logs;
  },

  async getTeacherAssignmentsAsync(teacherId?: string): Promise<TeacherAssignment[]> {
    if (isPostgresConfigured()) {
      try {
        const assignments = teacherId
          ? await postgresTeacherAssignmentDb.getAssignmentsByTeacher(teacherId)
          : await postgresTeacherAssignmentDb.getAllAssignments();
        
        // Mirror into memory store for synchronous fallbacks
        const store = loadStore();
        if (store.teacherAssignments && !teacherId && assignments.length > 0) {
          store.teacherAssignments = assignments;
          saveStore(store);
        }
        return assignments;
      } catch (err) {
        console.warn("[Database] PostgreSQL getTeacherAssignmentsAsync failed, falling back to local store:", (err as any)?.message);
      }
    }
    return this.getTeacherAssignments(teacherId);
  },

  async getTeacherAssignmentByIdAsync(id: string): Promise<TeacherAssignment | null> {
    if (isPostgresConfigured()) {
      try {
        const asg = await postgresTeacherAssignmentDb.getAssignmentById(id);
        if (asg) return asg;
      } catch (err) {
        console.warn("[Database] PostgreSQL getTeacherAssignmentByIdAsync failed:", (err as any)?.message);
      }
    }
    return this.getTeacherAssignmentById(id);
  },

  async setTeacherAssignmentAsync(assignment: Omit<TeacherAssignment, "id" | "assignedAt"> & { id?: string }): Promise<TeacherAssignment> {
    // Keep local sync store up-to-date
    const local = this.setTeacherAssignment(assignment);
    if (isPostgresConfigured()) {
      try {
        const pgResult = await postgresTeacherAssignmentDb.upsertAssignment({
          ...local,
          id: assignment.id || local.id,
        });
        return pgResult;
      } catch (err) {
        console.warn("[Database] PostgreSQL setTeacherAssignmentAsync failed, saved to local store:", (err as any)?.message);
      }
    }
    return local;
  },

  async deleteTeacherAssignmentAsync(id: string): Promise<boolean> {
    const local = this.deleteTeacherAssignment(id);
    if (isPostgresConfigured()) {
      try {
        await postgresTeacherAssignmentDb.deleteAssignment(id);
        return true;
      } catch (err) {
        console.warn("[Database] PostgreSQL deleteTeacherAssignmentAsync failed:", (err as any)?.message);
      }
    }
    return local;
  },

  async recordAuditLogAsync(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<AuditLogEntry> {
    return this.recordAuditLog(entry);
  },

  async getAuditLogsAsync(filter?: { teacherId?: string; studentId?: string; subjectCode?: SubjectCode }): Promise<AuditLogEntry[]> {
    return this.getAuditLogs(filter);
  },

  // --- Phase 6: Intervention Effectiveness Tracking ---
  getInterventionRecords(filter?: {
    conceptId?: string;
    studentId?: string;
    interventionType?: string;
  }): InterventionRecord[] {
    const store = loadStore();
    let list = store.interventionRecords || [];
    if (filter?.conceptId) {
      list = list.filter((r: InterventionRecord) => r.conceptId === filter.conceptId);
    }
    if (filter?.studentId) {
      list = list.filter((r: InterventionRecord) => r.studentId === filter.studentId);
    }
    if (filter?.interventionType) {
      list = list.filter(
        (r: InterventionRecord) => r.interventionType.toLowerCase() === filter.interventionType?.toLowerCase()
      );
    }
    return list;
  },

  recordIntervention(record: Omit<InterventionRecord, "id">): InterventionRecord {
    const store = loadStore();
    if (!store.interventionRecords) store.interventionRecords = [];
    const newRecord: InterventionRecord = {
      ...record,
      id: `int-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: record.date || new Date().toISOString(),
    };
    store.interventionRecords.push(newRecord);
    saveStore(store);
    return newRecord;
  },

  // --- Phase 6: Parent Bridge Home Practice ---
  async sendHomePracticeToParentAsync(data: {
    studentId: string;
    activity: any;
    customNotes?: string;
    language?: "en" | "gu" | "hi";
  }): Promise<{ success: boolean; messageId?: string; parentName?: string }> {
    const store = loadStore();
    const student = this.getStudentById(data.studentId);
    if (!student) return { success: false };

    const parents = this.getParentsByStudentId(data.studentId);
    const parent = parents[0];
    const parentId = parent?.id || `par-${data.studentId}`;
    const parentName = parent?.name || `Parent of ${student.displayName}`;

    const lang = data.language || "en";
    const title =
      lang === "gu" && data.activity.titleGu
        ? data.activity.titleGu
        : lang === "hi" && data.activity.titleHi
        ? data.activity.titleHi
        : data.activity.title || data.activity.conceptName;

    const whatParentDoes =
      lang === "gu" && data.activity.whatParentDoesGu
        ? data.activity.whatParentDoesGu
        : lang === "hi" && data.activity.whatParentDoesHi
        ? data.activity.whatParentDoesHi
        : data.activity.whatParentDoes;

    const whatChildPractices =
      lang === "gu" && data.activity.whatChildPracticesGu
        ? data.activity.whatChildPracticesGu
        : lang === "hi" && data.activity.whatChildPracticesHi
        ? data.activity.whatChildPracticesHi
        : data.activity.whatChildPractices;

    const conversationalPrompt =
      lang === "gu" && data.activity.conversationalPromptGu
        ? data.activity.conversationalPromptGu
        : lang === "hi" && data.activity.conversationalPromptHi
        ? data.activity.conversationalPromptHi
        : data.activity.conversationalPrompt;

    const subject =
      lang === "gu"
        ? `ઘર-મહાવરો: ${title}`
        : lang === "hi"
        ? `गृह-अभ्यास: ${title}`
        : `Home Practice: ${title}`;

    const greeting =
      lang === "gu"
        ? `નમસ્તે વાલીશ્રી,`
        : lang === "hi"
        ? `नमस्ते अभिभावक,`
        : `Dear Parent,`;

    const intro =
      lang === "gu"
        ? `શિક્ષક તરફથી ${student.displayName} માટે ૫-મિનિટની સરળ ઘર-પ્રવૃત્તિ:`
        : lang === "hi"
        ? `शिक्षक की ओर से ${student.displayName} के लिए ५-मिनट का सरल गृह-अभ्यास:`
        : `Here is a short ${data.activity.durationMinutes || 5}-minute home practice recommended by teacher for ${student.displayName}:`;

    const formattedMessage = [
      greeting,
      intro,
      ``,
      `${lang === "gu" ? "પ્રવૃત્તિ" : lang === "hi" ? "गतिविधि" : "Activity"}: ${title}`,
      `️ ${lang === "gu" ? "જરૂરી સાધન" : lang === "hi" ? "जरूरी सामग्री" : "Materials"}: ${(data.activity.commonHouseholdMaterials || ["Household objects"]).join(", ")}`,
      ``,
      ` ${lang === "gu" ? "વાલીએ શું કરવું" : lang === "hi" ? "अभिभावक क्या करें" : "What to do"}: ${whatParentDoes}`,
      ` ${lang === "gu" ? "બાળક શું શીખશે" : lang === "hi" ? "बच्चा क्या सीखेगा" : "What it helps"}: ${whatChildPractices}`,
      `️ ${lang === "gu" ? "પૂછવાનો સંવાદ" : lang === "hi" ? "पूछने का सवाल" : "Question to ask"}: ${conversationalPrompt}`,
      data.customNotes ? `\n ${lang === "gu" ? "શિક્ષકની નોંધ" : lang === "hi" ? "शिक्षक की टिप्पणी" : "Teacher Note"}: ${data.customNotes}` : "",
    ].filter(Boolean).join("\n");

    const newMsg = await this.createParentMessageAsync(
      parentId,
      data.studentId,
      subject,
      formattedMessage
    );

    if (!store.parentHomeActivities) store.parentHomeActivities = [];
    store.parentHomeActivities.push({
      id: `pha-${Date.now()}`,
      studentId: data.studentId,
      parentId,
      activity: data.activity,
      sentAt: new Date().toISOString(),
      customNotes: data.customNotes,
      status: "Sent",
      messageId: newMsg.id,
    });
    saveStore(store);

    return {
      success: true,
      messageId: newMsg.id,
      parentName,
    };
  },

  getParentHomeActivities(studentId?: string): any[] {
    const store = loadStore();
    let list = store.parentHomeActivities || [];
    if (studentId) {
      list = list.filter((a: any) => a.studentId === studentId);
    }
    return list;
  },

  resetToDemoData(): void {
    const fresh = getInitialStore();
    saveStore(fresh);
  },
};
