export type UserRole = "teacher" | "admin" | "parent";
export type UserStatus = "active" | "pending" | "disabled";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  emailVerifiedAt?: string;
  role: UserRole;
  schoolId: string;
  has_seen_tutorial?: boolean;
  googleId?: string;
  avatarUrl?: string;
  provider?: "local" | "google" | "phone" | "email";
  passwordHash?: string;
  status?: "active" | "pending" | "disabled";
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
