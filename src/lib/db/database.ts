import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
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
  postgresPtmDb,
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
  Conversation,
  ChatMessage,
  ChatNotification,
  ConversationParticipant,
  PtmMeeting,
  PtmMeetingNote,
  PtmChatMessage,
  PtmWaitingParticipant,
  PtmMeetingStats,
  PtmMeetingStatus,
} from "../types";
import { SEED_CONVERSATIONS, SEED_CHAT_MESSAGES } from "../connect/seedConnect";

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
  conversations?: Conversation[];
  chatMessages?: ChatMessage[];
  chatNotifications?: ChatNotification[];
  ptmMeetings?: PtmMeeting[];
  ptmMeetingNotes?: PtmMeetingNote[];
  ptmChatMessages?: PtmChatMessage[];
  ptmWaitingParticipants?: PtmWaitingParticipant[];
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
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        createdByUserId: "usr-teacher-01",
        createdAt: new Date().toISOString(),
      },
      {
        id: "plc-demo-diya",
        studentId: "std-diya",
        code: "PAR-5219",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        createdByUserId: "usr-teacher-01",
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
    conversations: JSON.parse(JSON.stringify(SEED_CONVERSATIONS)),
    chatMessages: JSON.parse(JSON.stringify(SEED_CHAT_MESSAGES)),
    chatNotifications: [],
    ptmMeetings: [
      {
        id: "ptm-today-aarav",
        meetingCode: "ptm-704-291",
        title: "Class 4 Mathematics Remedial Progress Review",
        agenda: "Review 5-step concrete division manipulative activities, verify 85% accuracy milestone, plan home practice.",
        teacherId: "usr-teacher-01",
        teacherName: "Pooja Sharma",
        studentId: "std-aarav",
        studentName: "Aarav Patel",
        parentId: "par-001",
        parentName: "Dineshbhai Patel",
        parentEmail: "parent.aarav@example.com",
        scheduledDate: new Date().toISOString().split("T")[0],
        startTime: "14:30",
        durationMinutes: 30,
        status: "scheduled",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "ptm-upcoming-diya",
        meetingCode: "ptm-819-332",
        title: "Gujarati Reading & Phonemic Progress Discussion",
        agenda: "Discuss Matra recognition development and bilingual reading exercises.",
        teacherId: "usr-teacher-01",
        teacherName: "Pooja Sharma",
        studentId: "std-diya",
        studentName: "Diya Joshi",
        parentId: "par-002",
        parentName: "Bhavikbhai Joshi",
        parentEmail: "bhavik.joshi@example.com",
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        startTime: "16:00",
        durationMinutes: 45,
        status: "scheduled",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "ptm-past-ishaan",
        meetingCode: "ptm-412-588",
        title: "Foundational Number Sense Benchmark",
        agenda: "Assess 2-digit addition and place value comprehension.",
        teacherId: "usr-teacher-01",
        teacherName: "Pooja Sharma",
        studentId: "std-ishaan",
        studentName: "Ishaan Solanki",
        parentId: "par-003",
        parentName: "Rameshbhai Solanki",
        parentEmail: "ramesh.solanki@example.com",
        scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        startTime: "11:00",
        durationMinutes: 30,
        status: "completed",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "ptm-cancelled-anaya",
        meetingCode: "ptm-301-419",
        title: "Science Environmental Studies Check-in",
        agenda: "Quarterly curriculum review on plant life cycles.",
        teacherId: "usr-teacher-01",
        teacherName: "Pooja Sharma",
        studentId: "std-anaya",
        studentName: "Anaya Patel",
        parentId: "par-001",
        parentName: "Dineshbhai Patel",
        parentEmail: "parent.aarav@example.com",
        scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        startTime: "15:00",
        durationMinutes: 15,
        status: "cancelled",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    ptmMeetingNotes: [
      {
        id: "note-past-ishaan",
        meetingId: "ptm-past-ishaan",
        studentId: "std-ishaan",
        teacherId: "usr-teacher-01",
        discussionSummary: "Reviewed foundational number line concepts and 2-digit regrouping. Ishaan demonstrated improved confidence in single-digit operations.",
        learningConcerns: "Carrying over in double-digit column addition still causes occasional hesitation.",
        studentStrengths: "Highly engaged in visual dot-pattern exercises and oral calculations.",
        agreedActions: "Parent agreed to practice 10 minutes of base-ten block manipulative cards daily before dinner.",
        followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        sharedWithParent: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    ptmChatMessages: [],
    ptmWaitingParticipants: [],
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
          // Auto-sync ShikshaSetu Connect conversations if missing
          if (!memoryStore.conversations || memoryStore.conversations.length === 0) {
            memoryStore.conversations = JSON.parse(JSON.stringify(SEED_CONVERSATIONS));
            storeNeedsSync = true;
          }
          if (!memoryStore.chatMessages || memoryStore.chatMessages.length === 0) {
            memoryStore.chatMessages = JSON.parse(JSON.stringify(SEED_CHAT_MESSAGES));
            storeNeedsSync = true;
          }
          // Auto-sync seed parents if missing
          if (!memoryStore.parents || memoryStore.parents.length === 0) {
            memoryStore.parents = JSON.parse(JSON.stringify(SEED_PARENTS));
            storeNeedsSync = true;
          } else {
            for (const sp of SEED_PARENTS) {
              const existing = memoryStore.parents.find((p) => p.id === sp.id || (sp.userId && p.userId === sp.userId));
              if (!existing) {
                memoryStore.parents.push(JSON.parse(JSON.stringify(sp)));
                storeNeedsSync = true;
              } else if (sp.studentIds && sp.studentIds.length > 0) {
                if (!existing.studentIds) existing.studentIds = [];
                for (const sid of sp.studentIds) {
                  if (!existing.studentIds.includes(sid)) {
                    existing.studentIds.push(sid);
                    storeNeedsSync = true;
                  }
                }
              }
            }
          }
          // Auto-sync PTM baseline meetings if missing
          if (!memoryStore.ptmMeetings) memoryStore.ptmMeetings = [];
          const initialStore = getInitialStore();
          for (const m of initialStore.ptmMeetings || []) {
            if (!memoryStore.ptmMeetings.some((existing) => existing.id === m.id)) {
              memoryStore.ptmMeetings.push(JSON.parse(JSON.stringify(m)));
              storeNeedsSync = true;
            }
          }
          if (!memoryStore.ptmMeetingNotes) memoryStore.ptmMeetingNotes = [];
          for (const n of initialStore.ptmMeetingNotes || []) {
            if (!memoryStore.ptmMeetingNotes.some((existing) => existing.id === n.id)) {
              memoryStore.ptmMeetingNotes.push(JSON.parse(JSON.stringify(n)));
              storeNeedsSync = true;
            }
          }
          if (!memoryStore.ptmChatMessages) memoryStore.ptmChatMessages = [];
          if (!memoryStore.ptmWaitingParticipants) memoryStore.ptmWaitingParticipants = [];

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
            while (Date.now() - start < 20 * (attempt + 1)) { }
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
  } catch { }
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
        } catch { }
      }
      try {
        const stat = fs.statSync(targetFile);
        lastLoadedMtime = stat.mtimeMs;
        lastLoadedPath = targetFile;
      } catch { }
      return;
    } catch (primaryErr: any) {
      if ((primaryErr.code === "EBUSY" || primaryErr.code === "EPERM") && attempt < 3) {
        const start = Date.now();
        while (Date.now() - start < 25 * (attempt + 1)) { }
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
        } catch { }
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

  async getResultsAsync(studentId?: string, conceptId?: string): Promise<AssessmentResult[]> {
    if (isPostgresConfigured()) {
      try {
        const pgResults = await postgresAssessmentDb.getResults(studentId, conceptId);
        if (pgResults.length > 0) return pgResults;
      } catch (e) {
        console.warn("[PostgreSQL] getResultsAsync failed, falling back to local store:", (e as any)?.message);
      }
    }
    return this.getResults(studentId, conceptId);
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

  async getLearningGapsAsync(studentId?: string): Promise<LearningGap[]> {
    if (isPostgresConfigured()) {
      try {
        const pgGaps = await postgresLearningGapDb.getLearningGaps(studentId);
        if (pgGaps.length > 0) return pgGaps;
      } catch (e) {
        console.warn("[PostgreSQL] getLearningGapsAsync failed, falling back to local store:", (e as any)?.message);
      }
    }
    return this.getLearningGaps(studentId);
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

  async getRemedialPlansAsync(studentId?: string): Promise<RemedialPlan[]> {
    if (isPostgresConfigured()) {
      try {
        const pgPlans = await postgresRemedialPlanDb.getRemedialPlans(studentId);
        if (pgPlans.length > 0) return pgPlans;
      } catch (e) {
        console.warn("[PostgreSQL] getRemedialPlansAsync failed, falling back to local store:", (e as any)?.message);
      }
    }
    return this.getRemedialPlans(studentId);
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
    const parents = this.getParents();
    const found = parents.find((p) => p.id === id || (p.userId && p.userId === id));
    if (found) return found;

    const store = loadStore();
    const user = (store.users || []).find((u) => u.id === id && (u.role === "parent" || u.role === "admin"));
    if (user) {
      const matched = (store.students || []).filter(
        (s) =>
          s.displayName.toLowerCase().includes("aarav") ||
          s.displayName.toLowerCase().includes(user.name.split(" ")[0].toLowerCase())
      );
      const studentIds = matched.length > 0 ? matched.map((s) => s.id) : store.students?.[0]?.id ? [store.students[0].id] : [];
      return this.createParentProfile({
        id: user.id.startsWith("par-") ? user.id : `par-${user.id}`,
        userId: user.id,
        name: user.name,
        phone: user.phone || "+919825012345",
        email: user.email,
        relationship: "father",
        studentIds,
      });
    }
    return undefined;
  },

  getParentByUserId(userId: string): ParentProfile | undefined {
    return this.getParentById(userId);
  },

  async getParentByUserIdAsync(userId: string): Promise<ParentProfile | null> {
    if (isPostgresConfigured()) {
      try {
        return await postgresParentDb.getParentByUserId(userId);
      } catch (e) {
        console.error("Postgres error in getParentByUserIdAsync:", e);
      }
    }
    return this.getParentByUserId(userId) || null;
  },

  async updateParentPreferencesAsync(
    userId: string,
    prefs: { preferredLanguage?: ParentProfile["preferredLanguage"]; preferredScript?: ParentProfile["preferredScript"] }
  ): Promise<boolean> {
    if (isPostgresConfigured()) {
      try {
        await postgresParentDb.updateParentPreferences(userId, prefs);
      } catch (e) {
        console.error("Postgres error in updateParentPreferencesAsync:", e);
      }
    }
    const store = loadStore();
    const parents = store.parents || [];
    const idx = parents.findIndex((p) => p.userId === userId || p.id === userId);
    if (idx !== -1) {
      parents[idx] = {
        ...parents[idx],
        ...(prefs.preferredLanguage ? { preferredLanguage: prefs.preferredLanguage } : {}),
        ...(prefs.preferredScript ? { preferredScript: prefs.preferredScript } : {}),
      };
      store.parents = parents;
      saveStore(store);
      return true;
    }
    return false;
  },

  async getParentByIdAsync(id: string): Promise<ParentProfile | null> {
    if (isPostgresConfigured()) {
      try {
        return await postgresParentDb.getParentById(id);
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
    userId?: string;
    name: string;
    email?: string;
    phone?: string;
    preferredLanguage?: string;
    relationship?: string;
    studentIds?: string[];
  }): ParentProfile {
    const store = loadStore();
    const id = data.id || `par-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const userId = data.userId || `usr-${id}`;
    const newProfile: ParentProfile = {
      id,
      userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      preferredLanguage: (data.preferredLanguage as any) || "gu",
      relationship: (data.relationship as any) || "guardian",
      studentIds: data.studentIds || [],
    };
    if (!store.parents) store.parents = [];
    const existingIndex = store.parents.findIndex((p) => p.id === id || p.userId === userId);
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
      postgresParentDb.createParentProfile({ ...data, userId }).catch((e) =>
        console.error("Postgres background createParentProfile error:", e)
      );
    }

    return newProfile;
  },

  async createParentProfileAsync(data: {
    id?: string;
    userId?: string;
    name: string;
    email?: string;
    phone?: string;
    preferredLanguage?: string;
    relationship?: string;
    studentIds?: string[];
  }): Promise<ParentProfile> {
    const userId = data.userId || (data.id ? `usr-${data.id}` : `usr-par-${Date.now()}`);
    if (isPostgresConfigured()) {
      try {
        return await postgresParentDb.createParentProfile({ ...data, userId });
      } catch (e) {
        console.error("Postgres error in createParentProfileAsync, falling back to local:", e);
      }
    }
    return this.createParentProfile({ ...data, userId });
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
        return await postgresParentDb.getLinkedStudentsForParent(parentId);
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
    const student = store.students.find((s) => s.id === studentId);
    if (!student) {
      throw new Error("Student not found.");
    }
    if (!store.parentLinkingCodes) store.parentLinkingCodes = [];
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      let suffix = "";
      for (let i = 0; i < 6; i++) {
        suffix += alphabet[crypto.randomInt(0, alphabet.length)];
      }
      const candidate = `PAR-${suffix}`;
      if (!store.parentLinkingCodes.some((c) => c.code.toUpperCase() === candidate)) {
        code = candidate;
        break;
      }
    }
    if (!code) {
      code = `PAR-${crypto.randomInt(100000, 999999)}`;
    }
    const id = `plc-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const safeDays = Math.min(30, Math.max(1, Number(expiresInDays) || 7));
    const expiresAt = new Date(Date.now() + safeDays * 24 * 60 * 60 * 1000).toISOString();

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
        return await postgresParentDb.getLinkingCode(code);
      } catch (e) {
        console.error("Postgres error in getLinkingCodeAsync:", e);
      }
    }
    const store = loadStore();
    const normalized = code.trim().toUpperCase().replace(/\s+/g, "");
    return (store.parentLinkingCodes || []).find((c) => c.code.toUpperCase() === normalized) || null;
  },

  async redeemLinkingCodeAsync(
    code: string,
    parentUserId: string,
    parentProfileId: string
  ): Promise<{ success: boolean; alreadyLinked?: boolean; studentId?: string; error?: string; errorCode?: string }> {
    const normalized = String(code || "").trim().toUpperCase().replace(/\s+/g, "");
    if (!normalized) {
      return { success: false, errorCode: "INVALID_CODE", error: "Please enter a valid verification code." };
    }

    if (isPostgresConfigured()) {
      try {
        return await postgresParentDb.redeemLinkingCode(normalized, parentUserId, parentProfileId);
      } catch (e) {
        console.error("Postgres error in redeemLinkingCodeAsync, falling back to local:", e);
      }
    }

    const store = loadStore();
    const linkingCode = (store.parentLinkingCodes || []).find((c) => c.code.toUpperCase() === normalized);
    if (!linkingCode) {
      return { success: false, errorCode: "INVALID_CODE", error: "Invalid verification code. Please check the code provided by your school." };
    }

    const parent = (store.parents || []).find((p) => p.id === parentProfileId || p.userId === parentUserId);
    if (parent && parent.studentIds && parent.studentIds.includes(linkingCode.studentId)) {
      return {
        success: true,
        alreadyLinked: true,
        errorCode: "ALREADY_LINKED",
        studentId: linkingCode.studentId,
      };
    }

    if (linkingCode.status === "used") {
      return {
        success: false,
        errorCode: "USED_CODE",
        error: "This verification code has already been redeemed. Please ask your child's teacher for a new code.",
      };
    }
    if (linkingCode.status === "revoked") {
      return {
        success: false,
        errorCode: "REVOKED_CODE",
        error: "This verification code is no longer active. Please request a new code from your child's teacher.",
      };
    }
    if (linkingCode.status === "expired" || new Date(linkingCode.expiresAt).getTime() <= Date.now()) {
      linkingCode.status = "expired";
      saveStore(store);
      return {
        success: false,
        errorCode: "EXPIRED_CODE",
        error: "This verification code has expired. Please request a new code from your child's teacher.",
      };
    }

    const student = store.students.find((s) => s.id === linkingCode.studentId);
    if (!student || student.enrollmentStatus === "transferred") {
      return {
        success: false,
        errorCode: "INVALID_CODE",
        error: "Invalid verification code. Please check the code provided by your school.",
      };
    }

    if (!parent) {
      return {
        success: false,
        errorCode: "PROFILE_NOT_FOUND",
        error: "Parent profile not found. Please sign in again.",
      };
    }

    linkingCode.status = "used";
    linkingCode.usedByUserId = parentUserId;
    linkingCode.usedAt = new Date().toISOString();

    if (!parent.studentIds) parent.studentIds = [];
    parent.studentIds.push(linkingCode.studentId);

    saveStore(store);
    return { success: true, alreadyLinked: false, studentId: linkingCode.studentId };
  },

  async revokeLinkingCodeAsync(codeId: string, studentId: string): Promise<boolean> {
    if (isPostgresConfigured()) {
      try {
        return await postgresParentDb.revokeLinkingCode(codeId, studentId);
      } catch (e) {
        console.error("Postgres error in revokeLinkingCodeAsync:", e);
      }
    }
    const store = loadStore();
    const target = (store.parentLinkingCodes || []).find(
      (c) => c.id === codeId && c.studentId === studentId && c.status === "active"
    );
    if (!target) return false;
    target.status = "revoked";
    saveStore(store);
    return true;
  },

  async getLinkingCodesForStudentAsync(studentId: string): Promise<ParentLinkingCode[]> {
    if (isPostgresConfigured()) {
      try {
        return await postgresParentDb.getLinkingCodesForStudent(studentId);
      } catch (e) {
        console.error("Postgres error in getLinkingCodesForStudentAsync:", e);
      }
    }
    const store = loadStore();
    let changed = false;
    const now = Date.now();
    const codes = (store.parentLinkingCodes || []).filter((c) => c.studentId === studentId);
    for (const c of codes) {
      if (c.status === "active" && new Date(c.expiresAt).getTime() <= now) {
        c.status = "expired";
        changed = true;
      }
    }
    if (changed) saveStore(store);
    return [...codes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  async getParentsByStudentIdAsync(studentId: string): Promise<ParentProfile[]> {
    if (isPostgresConfigured()) {
      try {
        return await postgresParentDb.getParentsByStudentId(studentId);
      } catch (e) {
        console.error("Postgres error in getParentsByStudentIdAsync:", e);
      }
    }
    return this.getParentsByStudentId(studentId);
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
      preferredLanguage: userData.preferredLanguage || "en",
      preferredScript: userData.preferredScript,
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

  // ==========================================
  // SHIKSHASETU CONNECT (PARENT-TEACHER CHAT)
  // ==========================================
  getConversations(userId?: string, role?: string): Conversation[] {
    const store = loadStore();
    let convs = store.conversations || [];
    if (!userId) return convs;

    return convs.filter((c) => {
      // 1. School announcements: visible to everyone in the school
      if (c.type === "announcement") return true;

      // 2. Direct participant
      if (c.participantIds && c.participantIds.includes(userId)) return true;

      // 3. Admin has global visibility
      if (role === "admin") return true;

      // 4. Teacher assigned to classroom
      if (role === "teacher" && c.classroomId) {
        const assignments = this.getTeacherAssignments(userId);
        if (assignments.some((a) => a.classroomIds && a.classroomIds.includes(c.classroomId!))) {
          return true;
        }
      }

      // 5. Parent whose child is in this classroom
      if (role === "parent" && c.classroomId) {
        const parent = this.getParentByUserId(userId) || this.getParentById(userId);
        if (parent && parent.studentIds) {
          const students = this.getStudents().filter((s) => parent.studentIds.includes(s.id));
          if (students.some((s) => s.classroomId === c.classroomId)) {
            return true;
          }
        }
      }

      return false;
    });
  },

  getConversationById(id: string, userId?: string, role?: string): Conversation | undefined {
    const convs = this.getConversations(userId, role);
    return convs.find((c) => c.id === id);
  },

  saveConversation(conv: Conversation): Conversation {
    const store = loadStore();
    if (!store.conversations) store.conversations = [];
    const idx = store.conversations.findIndex((c) => c.id === conv.id);
    if (idx >= 0) {
      store.conversations[idx] = { ...store.conversations[idx], ...conv, updatedAt: new Date().toISOString() };
    } else {
      store.conversations.push(conv);
    }
    saveStore(store);
    return conv;
  },

  deleteConversation(id: string): boolean {
    const store = loadStore();
    if (!store.conversations) return false;
    const initialLen = store.conversations.length;
    store.conversations = store.conversations.filter((c) => c.id !== id);
    if (store.chatMessages) {
      store.chatMessages = store.chatMessages.filter((m) => m.conversationId !== id);
    }
    saveStore(store);
    return store.conversations.length < initialLen;
  },

  getMessages(
    conversationId: string,
    options?: { limit?: number; since?: string; before?: string } | number
  ): ChatMessage[] & { messages: ChatMessage[]; hasMore: boolean; totalCount: number } {
    const store = loadStore();
    const allMsgs = (store.chatMessages || []).filter((m) => m.conversationId === conversationId);
    allMsgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const totalCount = allMsgs.length;
    const opts = typeof options === "number" ? { limit: options } : options || {};

    let selectedSlice: ChatMessage[] = [];
    let hasMore = false;

    // Incremental polling: messages strictly after `since`
    if (opts.since) {
      const sinceTime = new Date(opts.since).getTime();
      selectedSlice = allMsgs.filter((m) => new Date(m.createdAt).getTime() > sinceTime);
      hasMore = false;
    } else if (opts.before) {
      const limit = opts.limit || 40;
      const beforeTime = new Date(opts.before).getTime();
      const olderCandidates = allMsgs.filter((m) => new Date(m.createdAt).getTime() < beforeTime);
      selectedSlice = olderCandidates.slice(-limit);
      hasMore = olderCandidates.length > selectedSlice.length;
    } else {
      const limit = opts.limit || 40;
      selectedSlice = allMsgs.slice(-limit);
      hasMore = allMsgs.length > selectedSlice.length;
    }

    const result = selectedSlice as any;
    result.messages = selectedSlice;
    result.hasMore = hasMore;
    result.totalCount = totalCount;
    return result;
  },

  saveMessage(msg: ChatMessage): ChatMessage {
    const store = loadStore();
    if (!store.chatMessages) store.chatMessages = [];
    store.chatMessages.push(msg);

    if (!store.conversations) store.conversations = [];
    const conv = store.conversations.find((c) => c.id === msg.conversationId);
    if (conv) {
      conv.lastMessageText = msg.text;
      conv.lastMessageAt = msg.createdAt;
      conv.lastMessageSenderName = msg.senderName;
      conv.updatedAt = msg.createdAt;

      if (!conv.unreadCounts) conv.unreadCounts = {};
      const targetParticipants = conv.participantIds || [];
      for (const pId of targetParticipants) {
        if (pId !== msg.senderId) {
          conv.unreadCounts[pId] = (conv.unreadCounts[pId] || 0) + 1;
        }
      }
    }

    saveStore(store);
    return msg;
  },

  markMessagesAsRead(conversationId: string, userId: string): number {
    const store = loadStore();
    if (!store.chatMessages) return 0;
    let count = 0;
    const now = new Date().toISOString();

    for (const msg of store.chatMessages) {
      if (msg.conversationId === conversationId && msg.senderId !== userId) {
        if (!msg.readBy) msg.readBy = [];
        if (!msg.readBy.some((r) => r.userId === userId)) {
          msg.readBy.push({ userId, readAt: now });
          msg.status = "read";
          count++;
        }
      }
    }

    let unreadCountChanged = false;
    if (store.conversations) {
      const conv = store.conversations.find((c) => c.id === conversationId);
      if (conv && conv.unreadCounts && conv.unreadCounts[userId] && conv.unreadCounts[userId] > 0) {
        conv.unreadCounts[userId] = 0;
        unreadCountChanged = true;
      }
    }

    // ONLY write to disk if an actual message was marked or an unread count was reset!
    if (count > 0 || unreadCountChanged) {
      saveStore(store);
    }
    return count;
  },

  getUnreadChatCount(userId: string): number {
    const store = loadStore();
    let total = 0;
    for (const conv of store.conversations || []) {
      if (conv.unreadCounts && conv.unreadCounts[userId]) {
        total += conv.unreadCounts[userId];
      }
    }
    return total;
  },

  reportMessage(messageId: string, reason: string): boolean {
    const store = loadStore();
    if (!store.chatMessages) return false;
    const msg = store.chatMessages.find((m) => m.id === messageId);
    if (!msg) return false;
    msg.isReported = true;
    msg.reportReason = reason;
    saveStore(store);
    return true;
  },

  getConversationParticipants(conversationId: string): ConversationParticipant[] {
    const store = loadStore();
    const conv = (store.conversations || []).find((c) => c.id === conversationId);
    if (!conv) return [];

    const participants: ConversationParticipant[] = [];
    const users = store.users || [];
    const parents = store.parents || [];
    const students = store.students || [];

    for (const uid of conv.participantIds || []) {
      const u = users.find((usr) => usr.id === uid);
      const parent = parents.find((p) => p.userId === uid || p.id === uid);

      if (u) {
        let childName: string | undefined;
        let childGrade: number | undefined;
        let childSection: string | undefined;

        if (parent && parent.studentIds && parent.studentIds.length > 0) {
          const std = students.find((s) => parent.studentIds.includes(s.id));
          if (std) {
            childName = (std as any).name || std.displayName;
            childGrade = std.grade;
            childSection = std.section;
          }
        }

        participants.push({
          userId: u.id,
          name: u.name,
          role: u.role,
          email: u.email,
          childName,
          childGrade,
          childSection,
          joinedAt: conv.createdAt,
        });
      } else if (parent) {
        const std = students.find((s) => parent.studentIds.includes(s.id));
        participants.push({
          userId: parent.userId || parent.id,
          name: parent.name,
          role: "parent",
          email: parent.email,
          childName: (std as any)?.name || std?.displayName,
          childGrade: std?.grade,
          childSection: std?.section,
          joinedAt: conv.createdAt,
        });
      }
    }

    return participants;
  },

  getAvailableChatContacts(userId: string, role: string): any[] {
    const store = loadStore();
    const students = store.students || [];
    const parents = store.parents || [];
    const users = store.users || [];
    const classrooms = store.classrooms || [];

    if (role === "parent") {
      const parent = this.getParentByUserId(userId) || this.getParentById(userId);
      const myStudentIds = parent ? parent.studentIds || [] : [];
      const myStudents = students.filter((s) => myStudentIds.includes(s.id));
      const myClassroomIds = myStudents.map((s) => s.classroomId);

      const assignments = store.teacherAssignments || [];
      const teacherIds = Array.from(
        new Set(
          assignments
            .filter((a) => a.classroomIds && a.classroomIds.some((cid) => myClassroomIds.includes(cid)))
            .map((a) => a.teacherId)
        )
      );

      return users
        .filter((u) => teacherIds.includes(u.id) || u.role === "admin")
        .map((u) => ({
          userId: u.id,
          name: u.name,
          role: u.role,
          title: u.role === "admin" ? "Principal Office" : `${u.name} (Assigned Teacher)`,
          subtitle: u.role === "admin" ? "School Administration" : "Class Teacher",
          classroomId: myClassroomIds[0] || "",
        }));
    }

    if (role === "teacher") {
      const assignments = this.getTeacherAssignments(userId);
      const assignedClassIds = Array.from(new Set(assignments.flatMap((a) => a.classroomIds || [])));
      const assignedStudents = students.filter((s) => assignedClassIds.includes(s.classroomId));
      const studentMap = new Map(assignedStudents.map((s) => [s.id, s]));

      const contactParents: any[] = [];
      for (const p of parents) {
        const matchingStudents = (p.studentIds || [])
          .map((sid) => studentMap.get(sid))
          .filter(Boolean);

        if (matchingStudents.length > 0) {
          const firstStd = matchingStudents[0]!;
          const stdName = (firstStd as any).name || firstStd.displayName;
          contactParents.push({
            userId: p.userId || p.id,
            name: p.name,
            role: "parent",
            title: `${p.name} (Parent of ${stdName})`,
            subtitle: `Class ${firstStd.grade}-${firstStd.section} • Code #${firstStd.studentCode || "N/A"}`,
            studentId: firstStd.id,
            studentName: stdName,
            grade: firstStd.grade,
            section: firstStd.section,
            classroomId: firstStd.classroomId,
          });
        }
      }

      return contactParents;
    }

    // Admin sees all
    return [
      ...users.map((u) => ({
        userId: u.id,
        name: u.name,
        role: u.role,
        title: `${u.name} (${u.role.toUpperCase()})`,
        subtitle: u.email,
      })),
      ...classrooms.map((c) => ({
        classroomId: c.id,
        name: `Class ${c.grade}-${c.section}`,
        role: "classroom",
        title: `Class ${c.grade}-${c.section} Group`,
        subtitle: `${students.filter((s) => s.classroomId === c.id).length} Students`,
      })),
    ];
  },
  // --------------------------------------------------------------------------
  // Parent-Teacher Meetings (PTM) System
  // --------------------------------------------------------------------------

  getPtmMeetings(options?: {
    teacherId?: string;
    parentId?: string;
    studentId?: string;
    status?: PtmMeetingStatus;
    date?: string;
  }): PtmMeeting[] {
    const store = loadStore();
    let list = store.ptmMeetings || [];
    if (options?.teacherId) {
      list = list.filter((m) => m.teacherId === options.teacherId);
    }
    if (options?.parentId) {
      list = list.filter((m) => m.parentId === options.parentId);
    }
    if (options?.studentId) {
      list = list.filter((m) => m.studentId === options.studentId);
    }
    if (options?.status) {
      list = list.filter((m) => m.status === options.status);
    }
    if (options?.date) {
      list = list.filter((m) => m.scheduledDate === options.date);
    }
    const sanitizedList = list.map((m) => ({
      ...m,
      scheduledDate: m.scheduledDate || (m as any).date || new Date().toISOString().split("T")[0],
      startTime: m.startTime || "10:00",
      durationMinutes: m.durationMinutes || 30,
      status: m.status || "scheduled",
    }));

    return sanitizedList.sort((a, b) => {
      const dateA = a.scheduledDate || "";
      const dateB = b.scheduledDate || "";
      const timeA = a.startTime || "";
      const timeB = b.startTime || "";
      return dateA.localeCompare(dateB) || timeA.localeCompare(timeB);
    });
  },

  async getPtmMeetingsAsync(options?: {
    teacherId?: string;
    parentId?: string;
    studentId?: string;
    status?: PtmMeetingStatus;
    date?: string;
  }): Promise<PtmMeeting[]> {
    if (isPostgresConfigured()) {
      try {
        const pgRows = await postgresPtmDb.getMeetings(options);
        if (pgRows && pgRows.length > 0) return pgRows;
      } catch (err: any) {
        console.warn("[Database] Postgres getPtmMeetings failed, fallback to local store:", err?.message);
      }
    }
    return this.getPtmMeetings(options);
  },

  getPtmMeetingById(idOrCode: string): PtmMeeting | null {
    const store = loadStore();
    const list = store.ptmMeetings || [];
    return list.find((m) => m.id === idOrCode || m.meetingCode === idOrCode) || null;
  },

  async getPtmMeetingByIdAsync(idOrCode: string): Promise<PtmMeeting | null> {
    if (isPostgresConfigured()) {
      try {
        const pgMeeting = await postgresPtmDb.getMeetingById(idOrCode);
        if (pgMeeting) return pgMeeting;
      } catch (err: any) {
        console.warn("[Database] Postgres getMeetingById failed, fallback to local store:", err?.message);
      }
    }
    return this.getPtmMeetingById(idOrCode);
  },

  createPtmMeeting(meeting: PtmMeeting): PtmMeeting {
    const store = loadStore();
    if (!store.ptmMeetings) store.ptmMeetings = [];
    store.ptmMeetings.push(meeting);
    saveStore(store);
    return meeting;
  },

  async createPtmMeetingAsync(meeting: PtmMeeting): Promise<PtmMeeting> {
    if (isPostgresConfigured()) {
      try {
        return await postgresPtmDb.createMeeting(meeting);
      } catch (err: any) {
        console.warn("[Database] Postgres createMeeting failed, fallback to local store:", err?.message);
        return this.createPtmMeeting(meeting);
      }
    }
    return this.createPtmMeeting(meeting);
  },

  updatePtmMeetingStatus(id: string, status: PtmMeetingStatus): PtmMeeting | null {
    const store = loadStore();
    if (!store.ptmMeetings) return null;
    const item = store.ptmMeetings.find((m) => m.id === id || m.meetingCode === id);
    if (!item) return null;
    item.status = status;
    item.updatedAt = new Date().toISOString();
    saveStore(store);
    return item;
  },

  async updatePtmMeetingStatusAsync(id: string, status: PtmMeetingStatus): Promise<PtmMeeting | null> {
    if (isPostgresConfigured()) {
      try {
        return await postgresPtmDb.updateMeetingStatus(id, status);
      } catch (err: any) {
        console.warn("[Database] Postgres updateMeetingStatus failed, fallback to local store:", err?.message);
        return this.updatePtmMeetingStatus(id, status);
      }
    }
    return this.updatePtmMeetingStatus(id, status);
  },

  getPtmMeetingStats(teacherId?: string, parentId?: string): PtmMeetingStats {
    const store = loadStore();
    let list = store.ptmMeetings || [];
    if (teacherId) list = list.filter((m) => m.teacherId === teacherId);
    if (parentId) list = list.filter((m) => m.parentId === parentId);

    return {
      total: list.length,
      upcoming: list.filter((m) => m.status === "scheduled" || m.status === "waiting" || m.status === "in_progress").length,
      completed: list.filter((m) => m.status === "completed").length,
      cancelled: list.filter((m) => m.status === "cancelled" || m.status === "no_show").length,
    };
  },

  async getPtmMeetingStatsAsync(teacherId?: string, parentId?: string): Promise<PtmMeetingStats> {
    if (isPostgresConfigured()) {
      try {
        return await postgresPtmDb.getStats(teacherId, parentId);
      } catch (err: any) {
        console.warn("[Database] Postgres getStats failed, fallback to local store:", err?.message);
      }
    }
    return this.getPtmMeetingStats(teacherId, parentId);
  },

  getPtmMeetingNotes(meetingId: string): PtmMeetingNote[] {
    const store = loadStore();
    const list = store.ptmMeetingNotes || [];
    return list.filter((n) => n.meetingId === meetingId);
  },

  async getPtmMeetingNotesAsync(meetingId: string): Promise<PtmMeetingNote[]> {
    if (isPostgresConfigured()) {
      return postgresPtmDb.getNotes(meetingId);
    }
    return this.getPtmMeetingNotes(meetingId);
  },

  savePtmMeetingNote(note: PtmMeetingNote): PtmMeetingNote {
    const store = loadStore();
    if (!store.ptmMeetingNotes) store.ptmMeetingNotes = [];
    const idx = store.ptmMeetingNotes.findIndex((n) => n.id === note.id);
    if (idx >= 0) {
      store.ptmMeetingNotes[idx] = note;
    } else {
      store.ptmMeetingNotes.push(note);
    }
    saveStore(store);
    return note;
  },

  async savePtmMeetingNoteAsync(note: PtmMeetingNote): Promise<PtmMeetingNote> {
    if (isPostgresConfigured()) {
      return postgresPtmDb.saveNote(note);
    }
    return this.savePtmMeetingNote(note);
  },

  getPtmChatMessages(meetingId: string): PtmChatMessage[] {
    const store = loadStore();
    const list = store.ptmChatMessages || [];
    return list
      .filter((m) => m.meetingId === meetingId)
      .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  },

  async getPtmChatMessagesAsync(meetingId: string): Promise<PtmChatMessage[]> {
    if (isPostgresConfigured()) {
      return postgresPtmDb.getChatMessages(meetingId);
    }
    return this.getPtmChatMessages(meetingId);
  },

  savePtmChatMessage(message: PtmChatMessage): PtmChatMessage {
    const store = loadStore();
    if (!store.ptmChatMessages) store.ptmChatMessages = [];
    store.ptmChatMessages.push(message);
    saveStore(store);
    return message;
  },

  async savePtmChatMessageAsync(message: PtmChatMessage): Promise<PtmChatMessage> {
    if (isPostgresConfigured()) {
      return postgresPtmDb.saveChatMessage(message);
    }
    return this.savePtmChatMessage(message);
  },

  getPtmWaitingParticipants(meetingId: string): PtmWaitingParticipant[] {
    const store = loadStore();
    const list = store.ptmWaitingParticipants || [];
    return list.filter((p) => p.meetingId === meetingId && p.status === "waiting");
  },

  async getPtmWaitingParticipantsAsync(meetingId: string): Promise<PtmWaitingParticipant[]> {
    if (isPostgresConfigured()) {
      return postgresPtmDb.getWaitingParticipants(meetingId);
    }
    return this.getPtmWaitingParticipants(meetingId);
  },

  addPtmWaitingParticipant(
    meetingId: string,
    participant: { participantId: string; participantName: string; participantRole: any }
  ): PtmWaitingParticipant {
    const store = loadStore();
    if (!store.ptmWaitingParticipants) store.ptmWaitingParticipants = [];
    const existing = store.ptmWaitingParticipants.find(
      (p) => p.meetingId === meetingId && p.participantId === participant.participantId
    );
    if (existing) {
      existing.status = "waiting";
      existing.joinedAt = new Date().toISOString();
      saveStore(store);
      return existing;
    }
    const item: PtmWaitingParticipant = {
      id: `wait-${meetingId}-${participant.participantId}`,
      meetingId,
      participantId: participant.participantId,
      participantName: participant.participantName,
      participantRole: participant.participantRole,
      status: "waiting",
      joinedAt: new Date().toISOString(),
    };
    store.ptmWaitingParticipants.push(item);
    saveStore(store);
    return item;
  },

  async addPtmWaitingParticipantAsync(
    meetingId: string,
    participant: { participantId: string; participantName: string; participantRole: any }
  ): Promise<PtmWaitingParticipant> {
    if (isPostgresConfigured()) {
      return postgresPtmDb.addWaitingParticipant(meetingId, participant);
    }
    return this.addPtmWaitingParticipant(meetingId, participant);
  },

  updatePtmWaitingStatus(
    meetingId: string,
    participantId: string,
    status: "admitted" | "rejected"
  ): boolean {
    const store = loadStore();
    if (!store.ptmWaitingParticipants) return false;
    const item = store.ptmWaitingParticipants.find(
      (p) => p.meetingId === meetingId && p.participantId === participantId
    );
    if (!item) return false;
    item.status = status;
    item.reviewedAt = new Date().toISOString();
    saveStore(store);
    return true;
  },

  async updatePtmWaitingStatusAsync(
    meetingId: string,
    participantId: string,
    status: "admitted" | "rejected"
  ): Promise<boolean> {
    if (isPostgresConfigured()) {
      return postgresPtmDb.updateWaitingStatus(meetingId, participantId, status);
    }
    return this.updatePtmWaitingStatus(meetingId, participantId, status);
  },

  async getMeetingAttendanceAsync(meetingId: string): Promise<any[]> {
    return [];
  },
  async recordMeetingAttendanceJoinAsync(meetingId: string, parentId: string): Promise<boolean> {
    return true;
  },
  async recordMeetingAttendanceLeaveAsync(meetingId: string, parentId: string): Promise<boolean> {
    return true;
  },
  async getMeetingNotesForParentAsync(meetingId: string, parentId?: string): Promise<any[]> {
    return this.getPtmMeetingNotesAsync(meetingId);
  },
  async getMeetingNotesAsync(meetingId: string, ...rest: any[]): Promise<any[]> {
    return this.getPtmMeetingNotesAsync(meetingId);
  },
  async saveMeetingNoteAsync(data: any): Promise<any> {
    return this.savePtmMeetingNoteAsync(data);
  },
  async getMeetingByIdAsync(id: string): Promise<any> {
    return this.getPtmMeetingByIdAsync(id);
  },
  async getMeetingsAsync(filters?: any): Promise<any[]> {
    return this.getPtmMeetingsAsync(filters);
  },
  async updateMeetingStatusAsync(id: string, status: any): Promise<any> {
    return this.updatePtmMeetingStatusAsync(id, status);
  },
  async getAllParentsAsync(): Promise<any[]> {
    return this.getParents();
  },
  async getInvitesForMeetingAsync(meetingId: string): Promise<any[]> {
    return [];
  },
  async findNotificationAsync(...args: any[]): Promise<any> {
    return null;
  },
  async createNotificationAsync(notif: any): Promise<any> {
    return notif;
  },
  async getPushSubscriptionsForUserAsync(userId: string): Promise<any[]> {
    return [];
  },

  resetToDemoData(): void {
    const fresh = getInitialStore();
    saveStore(fresh);
  },
};

export const database = db;

