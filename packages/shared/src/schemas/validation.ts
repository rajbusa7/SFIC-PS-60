export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  isValid: boolean;
  errors: ValidationError[];
  data?: T;
}

export function validateLogin(body: any): ValidationResult<{ email: string; role?: "teacher" | "admin" }> {
  const errors: ValidationError[] = [];
  if (!body || typeof body !== "object") {
    return { isValid: false, errors: [{ field: "body", message: "Request body must be a valid JSON object" }] };
  }
  if (!body.email || typeof body.email !== "string" || !body.email.includes("@")) {
    errors.push({ field: "email", message: "A valid email address is required" });
  }
  if (body.role && body.role !== "teacher" && body.role !== "admin") {
    errors.push({ field: "role", message: "Role must be either 'teacher' or 'admin'" });
  }
  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? { email: body.email.trim(), role: body.role } : undefined,
  };
}

export function validateCreateStudent(body: any): ValidationResult<{
  studentCode: string;
  displayName: string;
  classroomId: string;
  grade: number;
  section: string;
  enrollmentStatus?: "active" | "transferred" | "graduated";
  notes?: string;
}> {
  const errors: ValidationError[] = [];
  if (!body || typeof body !== "object") {
    return { isValid: false, errors: [{ field: "body", message: "Request body must be a valid JSON object" }] };
  }
  if (!body.studentCode || typeof body.studentCode !== "string" || !body.studentCode.trim()) {
    errors.push({ field: "studentCode", message: "Student code is required" });
  }
  if (!body.displayName || typeof body.displayName !== "string" || !body.displayName.trim()) {
    errors.push({ field: "displayName", message: "Student display name is required" });
  }
  if (!body.classroomId || typeof body.classroomId !== "string" || !body.classroomId.trim()) {
    errors.push({ field: "classroomId", message: "Classroom ID is required" });
  }
  const grade = Number(body.grade);
  if (isNaN(grade) || grade < 1 || grade > 5) {
    errors.push({ field: "grade", message: "Grade must be an integer between 1 and 5" });
  }
  if (!body.section || typeof body.section !== "string" || !body.section.trim()) {
    errors.push({ field: "section", message: "Section is required (e.g., 'A', 'B')" });
  }
  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0
      ? {
          studentCode: body.studentCode.trim(),
          displayName: body.displayName.trim(),
          classroomId: body.classroomId.trim(),
          grade,
          section: body.section.trim().toUpperCase(),
          enrollmentStatus: body.enrollmentStatus || "active",
          notes: body.notes || "",
        }
      : undefined,
  };
}

export function validateCreateAssessment(body: any): ValidationResult<{
  classroomId: string;
  subjectId: string;
  subjectCode: "MATH" | "ENG" | "GUJ" | "EVS";
  title: string;
  assessmentDate: string;
  maxMarks: number;
  conceptIds: string[];
  status?: "draft" | "published";
}> {
  const errors: ValidationError[] = [];
  if (!body || typeof body !== "object") {
    return { isValid: false, errors: [{ field: "body", message: "Request body must be an object" }] };
  }
  if (!body.classroomId) errors.push({ field: "classroomId", message: "Classroom ID is required" });
  if (!body.subjectId) errors.push({ field: "subjectId", message: "Subject ID is required" });
  if (!["MATH", "ENG", "GUJ", "EVS"].includes(body.subjectCode)) {
    errors.push({ field: "subjectCode", message: "Subject code must be one of MATH, ENG, GUJ, EVS" });
  }
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    errors.push({ field: "title", message: "Assessment title is required" });
  }
  const maxMarks = Number(body.maxMarks);
  if (isNaN(maxMarks) || maxMarks <= 0) {
    errors.push({ field: "maxMarks", message: "Max marks must be greater than 0" });
  }
  if (!Array.isArray(body.conceptIds) || body.conceptIds.length === 0) {
    errors.push({ field: "conceptIds", message: "At least one concept ID is required" });
  }
  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0
      ? {
          classroomId: body.classroomId,
          subjectId: body.subjectId,
          subjectCode: body.subjectCode,
          title: body.title.trim(),
          assessmentDate: body.assessmentDate || new Date().toISOString(),
          maxMarks,
          conceptIds: body.conceptIds,
          status: body.status || "published",
        }
      : undefined,
  };
}

export function validateAiTutorRequest(body: any): ValidationResult<{
  query: string;
  grade?: number;
  subject?: string;
  language?: "en" | "gu";
}> {
  const errors: ValidationError[] = [];
  if (!body || typeof body !== "object") {
    return { isValid: false, errors: [{ field: "body", message: "Request body is required" }] };
  }
  if (!body.query || typeof body.query !== "string" || !body.query.trim()) {
    errors.push({ field: "query", message: "Query text is required" });
  }
  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0
      ? {
          query: body.query.trim(),
          grade: Number(body.grade) || 4,
          subject: body.subject || "Mathematics",
          language: body.language === "gu" ? "gu" : "en",
        }
      : undefined,
  };
}
