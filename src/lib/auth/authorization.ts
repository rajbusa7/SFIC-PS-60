import { extractSessionToken, verifySession, type SessionUser } from "./session";
import { db } from "../db/database";
import type { SubjectCode, TeacherAssignment } from "@shared/types";

export interface AuthorizationResult {
  authorized: boolean;
  status: number;
  user?: SessionUser;
  error?: string;
  assignments?: TeacherAssignment[];
}

export interface TeacherScope {
  teacherId: string;
  assignments: TeacherAssignment[];
  subjectCodes: SubjectCode[];
  classroomIds: string[];
  grades: number[];
}

/**
 * Returns the full authorized scope of a teacher from the trusted database.
 */
export function getTeacherAuthorizedScope(teacherId: string): TeacherScope {
  const assignments = db.getTeacherAssignments(teacherId);
  const subjectCodes = Array.from(new Set(assignments.map((a) => a.subjectCode)));
  const classroomIds = Array.from(new Set(assignments.flatMap((a) => a.classroomIds || [])));
  const grades = Array.from(new Set(assignments.flatMap((a) => a.grades || [])));

  return {
    teacherId,
    assignments,
    subjectCodes,
    classroomIds,
    grades,
  };
}

/**
 * Validates whether the authenticated user has administrative privileges.
 */
export async function authorizeAdminOnly(request: Request): Promise<AuthorizationResult> {
  const token = await extractSessionToken(request);
  const user = await verifySession(token);

  if (!user) {
    return {
      authorized: false,
      status: 401,
      error: "Authentication required. Please sign in.",
    };
  }

  if (user.role !== "admin") {
    return {
      authorized: false,
      status: 403,
      user,
      error: "Forbidden: Administrative privileges required.",
    };
  }

  return {
    authorized: true,
    status: 200,
    user,
  };
}

/**
 * Centralized authorization engine for teachers and administrators.
 * Verifies that the authenticated teacher is authorized for the requested subject, class, and student.
 * Administrators are automatically authorized for all academic resources.
 */
export async function authorizeTeacherAccess(
  request: Request,
  options?: {
    subjectCode?: SubjectCode | string;
    classroomId?: string;
    grade?: number;
    studentId?: string;
  }
): Promise<AuthorizationResult> {
  const token = await extractSessionToken(request);
  const user = await verifySession(token);

  if (!user) {
    return {
      authorized: false,
      status: 401,
      error: "Authentication required. Please sign in.",
    };
  }

  // Administrators have full access across all subjects, classes, and students
  if (user.role === "admin") {
    return {
      authorized: true,
      status: 200,
      user,
      assignments: db.getTeacherAssignments(),
    };
  }

  if (user.role !== "teacher") {
    return {
      authorized: false,
      status: 403,
      user,
      error: "Forbidden: Access restricted to authorized teachers.",
    };
  }

  // Retrieve teacher assignments from trusted database
  let assignments = db.getTeacherAssignments(user.id);
  if ((!assignments || assignments.length === 0) && user.email) {
    assignments = db.getTeacherAssignments(user.email);
  }
  if (!assignments || assignments.length === 0) {
    return {
      authorized: false,
      status: 403,
      user,
      assignments: [],
      error: "No subjects have been assigned to your account. Please contact your administrator.",
    };
  }

  const normalizedSubject = options?.subjectCode?.toUpperCase() as SubjectCode | undefined;

  // 1. Verify Subject Authorization
  if (normalizedSubject) {
    const subjectAssignment = assignments.find((a) => a.subjectCode === normalizedSubject);
    if (!subjectAssignment) {
      return {
        authorized: false,
        status: 403,
        user,
        assignments,
        error: `Forbidden: You are not authorized to access subject '${normalizedSubject}'.`,
      };
    }

    // 2. Verify Classroom Authorization under this subject
    if (options?.classroomId && options.classroomId !== "all") {
      const isClassAuthorized = subjectAssignment.classroomIds?.includes(options.classroomId);
      if (!isClassAuthorized) {
        return {
          authorized: false,
          status: 403,
          user,
          assignments,
          error: `Forbidden: You are not authorized to access class '${options.classroomId}' for subject '${normalizedSubject}'.`,
        };
      }
    }

    // 3. Verify Grade Authorization under this subject
    if (typeof options?.grade === "number") {
      const isGradeAuthorized = subjectAssignment.grades?.includes(options.grade);
      if (!isGradeAuthorized) {
        return {
          authorized: false,
          status: 403,
          user,
          assignments,
          error: `Forbidden: You are not authorized to access Grade ${options.grade} for subject '${normalizedSubject}'.`,
        };
      }
    }

    // 4. Verify Student Authorization under this subject
    if (options?.studentId) {
      const student = db.getStudentById(options.studentId);
      if (!student) {
        return {
          authorized: false,
          status: 404,
          user,
          assignments,
          error: `Student not found: '${options.studentId}'.`,
        };
      }

      const isClassAuthorized = subjectAssignment.classroomIds?.includes(student.classroomId);
      const isGradeAuthorized = subjectAssignment.grades?.includes(student.grade);

      if (!isClassAuthorized && !isGradeAuthorized) {
        return {
          authorized: false,
          status: 403,
          user,
          assignments,
          error: `Forbidden: You are not authorized to access student '${options.studentId}' in Grade ${student.grade}.`,
        };
      }
    }
  } else {
    // Subject was not specified in options; check general class/student authorization across all assignments
    const allAssignedClassroomIds = assignments.flatMap((a) => a.classroomIds || []);
    const allAssignedGrades = assignments.flatMap((a) => a.grades || []);

    if (options?.classroomId && options.classroomId !== "all") {
      if (!allAssignedClassroomIds.includes(options.classroomId)) {
        return {
          authorized: false,
          status: 403,
          user,
          assignments,
          error: `Forbidden: You are not authorized to access class '${options.classroomId}'.`,
        };
      }
    }

    if (typeof options?.grade === "number") {
      if (!allAssignedGrades.includes(options.grade)) {
        return {
          authorized: false,
          status: 403,
          user,
          assignments,
          error: `Forbidden: You are not authorized to access Grade ${options.grade}.`,
        };
      }
    }

    if (options?.studentId) {
      const student = db.getStudentById(options.studentId);
      if (!student) {
        return {
          authorized: false,
          status: 404,
          user,
          assignments,
          error: `Student not found: '${options.studentId}'.`,
        };
      }

      const isClassAuthorized = allAssignedClassroomIds.includes(student.classroomId);
      const isGradeAuthorized = allAssignedGrades.includes(student.grade);

      if (!isClassAuthorized && !isGradeAuthorized) {
        return {
          authorized: false,
          status: 403,
          user,
          assignments,
          error: `Forbidden: You are not authorized to access student '${options.studentId}'.`,
        };
      }
    }
  }

  return {
    authorized: true,
    status: 200,
    user,
    assignments,
  };
}

