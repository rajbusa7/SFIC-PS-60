import type { SubjectCode } from "./assessment";

export type UserRole = "teacher" | "admin" | "parent";
export type UserStatus = "active" | "pending" | "disabled";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  phoneVerified?: boolean;
  role: UserRole;
  schoolId: string;
  has_seen_tutorial?: boolean;
  googleId?: string;
  avatarUrl?: string;
  provider?: "local" | "google" | "phone";
  passwordHash?: string;
  status?: "active" | "pending" | "disabled";
  teacherType?: "subject" | "class";
  isClassTeacher?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  preferredLanguage: "en" | "gu";
}

export interface Classroom {
  id: string;
  schoolId: string;
  grade: number; // 1 to 5
  section: string; // "A", "B", "C"
  academicYear: string;
}

export interface Student {
  id: string;
  studentCode: string;
  displayName: string;
  classroomId: string;
  grade: number;
  section: string;
  enrollmentStatus: "active" | "transferred" | "graduated";
  notes?: string;
  createdAt: string;
}

export interface SchoolSettings {
  id: string;
  schoolId: string;
  masteryThreshold: number; // default: 80%
  developingThreshold: number; // default: 60%
  preferredLanguage: "en" | "gu";
  enableAiAssist: boolean;
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  teacherName?: string;
  teacherEmail?: string;
  schoolId?: string;
  subjectCode: SubjectCode;
  subjectName?: string;
  classes?: string[];
  isClassTeacher?: boolean;
  classroomIds: string[];
  grades: number[];
  assignedAt: string;
  updatedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  subjectCode: SubjectCode;
  assessmentId: string;
  previousMarks: number;
  updatedMarks: number;
  action: string;
  timestamp: string;
}
