import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import type {
  Student,
  Classroom,
  Assessment,
  AssessmentResult,
  LearningGap,
  RemedialPlan,
  LearningActivity,
  ActivityAttempt,
  SchoolSettings,
  School,
  User,
  ParentProfile,
  ParentLinkingCode,
  ParentMessage,
} from "../types";
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
  SEED_USERS,
  SEED_PARENTS,
} from "./seedData";

// Resolve PostgreSQL connection string from standard environment variables
export function getPostgresConnectionString(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.PGURI
  );
}

export function isPostgresConfigured(): boolean {
  const url = getPostgresConnectionString();
  return Boolean(url && url.trim().length > 0);
}

let poolInstance: Pool | null = null;
let schemaInitialized = false;
let schemaInitPromise: Promise<void> | null = null;

export function getPostgresPool(): Pool | null {
  const connectionString = getPostgresConnectionString();
  if (!connectionString) return null;

  if (!poolInstance) {
    const isLocalhost =
      connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

    poolInstance = new Pool({
      connectionString,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
    });

    poolInstance.on("error", (err) => {
      console.error("[PostgreSQL Pool Error]:", err.message);
    });
  }

  return poolInstance;
}

export const getPgPool = getPostgresPool;

/**
 * Execute parameterized query safely with connection pool
 */
export async function queryPostgres<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPostgresPool();
  if (!pool) {
    throw new Error("PostgreSQL connection string is not configured.");
  }
  await ensurePostgresSchema();
  return pool.query<T>(text, params);
}

/**
 * Automatically initializes database schema, constraints, indexes, and initial seeds
 * if the connected PostgreSQL instance is newly provisioned.
 */
export async function ensurePostgresSchema(): Promise<void> {
  if (schemaInitialized) return;
  if (!isPostgresConfigured()) return;

  if (schemaInitPromise) {
    return schemaInitPromise;
  }

  schemaInitPromise = (async () => {
    const pool = getPostgresPool();
    if (!pool) return;

    let client: PoolClient | null = null;
    try {
      client = await pool.connect();
      await client.query("BEGIN");

      // 1. Schools & Configuration
      await client.query(`
        CREATE TABLE IF NOT EXISTS schools (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            code VARCHAR(64) UNIQUE NOT NULL,
            preferred_language VARCHAR(8) DEFAULT 'en',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS school_settings (
            id VARCHAR(64) PRIMARY KEY,
            school_id VARCHAR(64) REFERENCES schools(id) ON DELETE CASCADE,
            mastery_threshold INTEGER DEFAULT 80,
            developing_threshold INTEGER DEFAULT 60,
            preferred_language VARCHAR(8) DEFAULT 'en',
            enable_ai_assist BOOLEAN DEFAULT TRUE,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS classrooms (
            id VARCHAR(64) PRIMARY KEY,
            school_id VARCHAR(64) REFERENCES schools(id) ON DELETE CASCADE,
            grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 5),
            section VARCHAR(8) NOT NULL,
            academic_year VARCHAR(16) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(school_id, grade, section, academic_year)
        );

        CREATE TABLE IF NOT EXISTS subjects (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(128) NOT NULL,
            name_gujarati VARCHAR(128),
            code VARCHAR(16) NOT NULL,
            language_code VARCHAR(8) DEFAULT 'en'
        );

        CREATE TABLE IF NOT EXISTS concepts (
            id VARCHAR(64) PRIMARY KEY,
            subject_id VARCHAR(64) REFERENCES subjects(id) ON DELETE CASCADE,
            subject_code VARCHAR(16) NOT NULL,
            grade INTEGER NOT NULL,
            name VARCHAR(255) NOT NULL,
            name_gujarati VARCHAR(255),
            description TEXT,
            prerequisites JSONB DEFAULT '[]'::jsonb
        );

        CREATE TABLE IF NOT EXISTS students (
            id VARCHAR(64) PRIMARY KEY,
            student_code VARCHAR(64) UNIQUE NOT NULL,
            display_name VARCHAR(128) NOT NULL,
            classroom_id VARCHAR(64) REFERENCES classrooms(id) ON DELETE RESTRICT,
            grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 5),
            section VARCHAR(8) NOT NULL,
            enrollment_status VARCHAR(32) DEFAULT 'active',
            notes TEXT DEFAULT '',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS assessments (
            id VARCHAR(64) PRIMARY KEY,
            classroom_id VARCHAR(64) REFERENCES classrooms(id) ON DELETE CASCADE,
            subject_id VARCHAR(64) REFERENCES subjects(id) ON DELETE RESTRICT,
            subject_code VARCHAR(16) NOT NULL,
            title VARCHAR(255) NOT NULL,
            assessment_date TIMESTAMP WITH TIME ZONE NOT NULL,
            status VARCHAR(32) DEFAULT 'published',
            max_marks NUMERIC(5,2) NOT NULL,
            concept_ids JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS assessment_results (
            id VARCHAR(64) PRIMARY KEY,
            assessment_id VARCHAR(64) REFERENCES assessments(id) ON DELETE CASCADE,
            student_id VARCHAR(64) REFERENCES students(id) ON DELETE CASCADE,
            concept_id VARCHAR(64) REFERENCES concepts(id) ON DELETE RESTRICT,
            marks_obtained NUMERIC(5,2) NOT NULL,
            maximum_marks NUMERIC(5,2) NOT NULL,
            percentage NUMERIC(5,2) NOT NULL,
            question_count INTEGER,
            correct_count INTEGER,
            notes TEXT,
            recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS learning_gaps (
            id VARCHAR(64) PRIMARY KEY,
            student_id VARCHAR(64) REFERENCES students(id) ON DELETE CASCADE,
            concept_id VARCHAR(64) REFERENCES concepts(id) ON DELETE RESTRICT,
            priority VARCHAR(16) NOT NULL,
            mastery_status VARCHAR(32) NOT NULL,
            reason TEXT NOT NULL,
            status VARCHAR(32) DEFAULT 'Active',
            attempts_count INTEGER DEFAULT 1,
            latest_percentage NUMERIC(5,2) NOT NULL,
            previous_percentage NUMERIC(5,2),
            delta_percentage_points NUMERIC(5,2),
            remedial_plan_id VARCHAR(64),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, concept_id)
        );

        CREATE TABLE IF NOT EXISTS remedial_plans (
            id VARCHAR(64) PRIMARY KEY,
            student_id VARCHAR(64) REFERENCES students(id) ON DELETE CASCADE,
            concept_id VARCHAR(64) REFERENCES concepts(id) ON DELETE RESTRICT,
            learning_objective TEXT NOT NULL,
            recommendation_reason TEXT NOT NULL,
            status VARCHAR(32) DEFAULT 'Suggested',
            estimated_minutes INTEGER DEFAULT 25,
            difficulty VARCHAR(32) DEFAULT 'Beginner',
            required_materials JSONB DEFAULT '[]'::jsonb,
            steps JSONB NOT NULL DEFAULT '[]'::jsonb,
            practice_questions_summary TEXT,
            reassessment_criteria TEXT,
            teacher_instructions TEXT,
            teacher_notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            review_date TIMESTAMP WITH TIME ZONE
        );

        CREATE TABLE IF NOT EXISTS learning_activities (
            id VARCHAR(64) PRIMARY KEY,
            concept_id VARCHAR(64) REFERENCES concepts(id) ON DELETE CASCADE,
            subject_code VARCHAR(16) NOT NULL,
            grade INTEGER NOT NULL,
            title VARCHAR(255) NOT NULL,
            title_gujarati VARCHAR(255),
            activity_type VARCHAR(32) NOT NULL,
            difficulty VARCHAR(16) DEFAULT 'Medium',
            estimated_minutes INTEGER DEFAULT 10,
            questions JSONB NOT NULL DEFAULT '[]'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS activity_attempts (
            id VARCHAR(64) PRIMARY KEY,
            student_id VARCHAR(64) REFERENCES students(id) ON DELETE CASCADE,
            activity_id VARCHAR(64) REFERENCES learning_activities(id) ON DELETE CASCADE,
            score NUMERIC(5,2) NOT NULL,
            maximum_score NUMERIC(5,2) NOT NULL,
            percentage NUMERIC(5,2) NOT NULL,
            answers JSONB DEFAULT '{}'::jsonb,
            incorrect_questions JSONB DEFAULT '[]'::jsonb,
            completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Performance Indexes
        CREATE INDEX IF NOT EXISTS idx_students_classroom ON students(classroom_id);
        CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
        CREATE INDEX IF NOT EXISTS idx_students_code ON students(student_code);
        CREATE INDEX IF NOT EXISTS idx_assessment_results_student ON assessment_results(student_id);
        CREATE INDEX IF NOT EXISTS idx_assessment_results_composite ON assessment_results(student_id, concept_id, recorded_at);
        CREATE INDEX IF NOT EXISTS idx_learning_gaps_student ON learning_gaps(student_id);
        CREATE INDEX IF NOT EXISTS idx_remedial_plans_student ON remedial_plans(student_id);

        -- Users & Permanent Teacher Accounts
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            role VARCHAR(32) DEFAULT 'teacher',
            school_id VARCHAR(64) REFERENCES schools(id) ON DELETE SET NULL,
            google_id VARCHAR(255) UNIQUE,
            avatar_url TEXT,
            provider VARCHAR(32) DEFAULT 'local',
            password_hash TEXT,
            status VARCHAR(32) DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
        CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
      `);

      // Seed baseline School if empty
      const schoolCheck = await client.query("SELECT COUNT(*) FROM schools");
      if (parseInt(schoolCheck.rows[0].count, 10) === 0) {
        await client.query(
          `INSERT INTO schools (id, name, code, preferred_language) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [SEED_SCHOOL.id, SEED_SCHOOL.name, SEED_SCHOOL.code, SEED_SCHOOL.preferredLanguage]
        );
        await client.query(
          `INSERT INTO school_settings (id, school_id, mastery_threshold, developing_threshold, preferred_language, enable_ai_assist)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
          [
            SEED_SETTINGS.id,
            SEED_SETTINGS.schoolId,
            SEED_SETTINGS.masteryThreshold,
            SEED_SETTINGS.developingThreshold,
            SEED_SETTINGS.preferredLanguage,
            SEED_SETTINGS.enableAiAssist,
          ]
        );

        // Seed classrooms
        for (const cls of SEED_CLASSROOMS) {
          await client.query(
            `INSERT INTO classrooms (id, school_id, grade, section, academic_year) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
            [cls.id, cls.schoolId, cls.grade, cls.section, cls.academicYear]
          );
        }

        // Seed subjects
        for (const sub of SEED_SUBJECTS) {
          await client.query(
            `INSERT INTO subjects (id, name, name_gujarati, code, language_code) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
            [sub.id, sub.name, sub.nameGujarati, sub.code, sub.languageCode]
          );
        }

        // Seed concepts
        for (const cpt of SEED_CONCEPTS) {
          await client.query(
            `INSERT INTO concepts (id, subject_id, subject_code, grade, name, name_gujarati, description, prerequisites)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`,
            [
              cpt.id,
              cpt.subjectId,
              cpt.subjectCode,
              cpt.grade,
              cpt.name,
              cpt.nameGujarati,
              cpt.description,
              JSON.stringify(cpt.prerequisites || []),
            ]
          );
        }

        // Seed initial students
        for (const std of SEED_STUDENTS) {
          await client.query(
            `INSERT INTO students (id, student_code, display_name, classroom_id, grade, section, enrollment_status, notes, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
            [
              std.id,
              std.studentCode,
              std.displayName,
              std.classroomId,
              std.grade,
              std.section,
              std.enrollmentStatus,
              std.notes || "",
            ]
          );
        }
      }

      // Seed baseline Users if empty
      const userCheck = await client.query("SELECT COUNT(*) FROM users");
      if (parseInt(userCheck.rows[0].count, 10) === 0) {
        for (const usr of SEED_USERS) {
          await client.query(
            `INSERT INTO users (id, name, email, role, school_id, google_id, avatar_url, provider, password_hash, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
            [
              usr.id,
              usr.name,
              usr.email,
              usr.role,
              usr.schoolId,
              usr.googleId || null,
              usr.avatarUrl || null,
              usr.provider || "local",
              usr.passwordHash || null,
              usr.status || "active",
            ]
          );
        }
      }

      await client.query("COMMIT");
      schemaInitialized = true;
      console.log("[PostgreSQL] Schema, constraints, indexes and baseline seeds verified successfully.");
    } catch (err) {
      if (client) await client.query("ROLLBACK");
      console.error("[PostgreSQL Schema Initialization Error]:", err);
      throw err;
    } finally {
      if (client) client.release();
      schemaInitPromise = null;
    }
  })();

  return schemaInitPromise;
}

/**
 * PostgreSQL Student Repository implementation with full parameterization & ACID transactions
 */
export const postgresStudentDb = {
  async getStudents(filters?: {
    classroomId?: string;
    grade?: number;
    search?: string;
  }): Promise<Student[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.classroomId && filters.classroomId !== "all") {
      conditions.push(`s.classroom_id = $${paramIndex++}`);
      params.push(filters.classroomId);
    }

    if (filters?.grade) {
      conditions.push(`s.grade = $${paramIndex++}`);
      params.push(filters.grade);
    }

    if (filters?.search && filters.search.trim().length > 0) {
      const q = `%${filters.search.trim().toLowerCase()}%`;
      conditions.push(
        `(LOWER(s.display_name) LIKE $${paramIndex} OR LOWER(s.student_code) LIKE $${paramIndex})`
      );
      params.push(q);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `
      SELECT 
        s.id,
        s.student_code AS "studentCode",
        s.display_name AS "displayName",
        s.classroom_id AS "classroomId",
        s.grade,
        s.section,
        s.enrollment_status AS "enrollmentStatus",
        s.notes,
        s.created_at AS "createdAt",
        s.updated_at AS "updatedAt"
      FROM students s
      ${whereClause}
      ORDER BY s.display_name ASC
    `;

    const res = await queryPostgres(sql, params);
    return res.rows.map(mapStudentRow);
  },

  async getStudentById(id: string): Promise<Student | null> {
    const sql = `
      SELECT 
        s.id,
        s.student_code AS "studentCode",
        s.display_name AS "displayName",
        s.classroom_id AS "classroomId",
        s.grade,
        s.section,
        s.enrollment_status AS "enrollmentStatus",
        s.notes,
        s.created_at AS "createdAt",
        s.updated_at AS "updatedAt"
      FROM students s
      WHERE s.id = $1
      LIMIT 1
    `;
    const res = await queryPostgres(sql, [id]);
    if (res.rows.length === 0) return null;
    return mapStudentRow(res.rows[0]);
  },

  async getStudentByCode(studentCode: string): Promise<Student | null> {
    const sql = `
      SELECT 
        s.id,
        s.student_code AS "studentCode",
        s.display_name AS "displayName",
        s.classroom_id AS "classroomId",
        s.grade,
        s.section,
        s.enrollment_status AS "enrollmentStatus",
        s.notes,
        s.created_at AS "createdAt",
        s.updated_at AS "updatedAt"
      FROM students s
      WHERE LOWER(s.student_code) = LOWER($1)
      LIMIT 1
    `;
    const res = await queryPostgres(sql, [studentCode.trim()]);
    if (res.rows.length === 0) return null;
    return mapStudentRow(res.rows[0]);
  },

  async createStudent(data: Omit<Student, "id" | "createdAt">): Promise<Student> {
    const id = `std-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const studentCode = data.studentCode.trim();
    const displayName = data.displayName.trim();
    const grade = Number(data.grade);
    const section = (data.section || "A").trim().toUpperCase();
    const classroomId = data.classroomId || `cls-${grade}${section.toLowerCase()}`;
    const enrollmentStatus = data.enrollmentStatus || "active";
    const notes = data.notes?.trim() || "";

    // Verify classroom exists before foreign key insert, creating on-demand if needed
    await queryPostgres(
      `INSERT INTO classrooms (id, school_id, grade, section, academic_year)
       VALUES ($1, 'sch-gn-01', $2, $3, '2026-27')
       ON CONFLICT (id) DO NOTHING`,
      [classroomId, grade, section]
    );

    const sql = `
      INSERT INTO students (
        id,
        student_code,
        display_name,
        classroom_id,
        grade,
        section,
        enrollment_status,
        notes,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING 
        id,
        student_code AS "studentCode",
        display_name AS "displayName",
        classroom_id AS "classroomId",
        grade,
        section,
        enrollment_status AS "enrollmentStatus",
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;

    const res = await queryPostgres(sql, [
      id,
      studentCode,
      displayName,
      classroomId,
      grade,
      section,
      enrollmentStatus,
      notes,
    ]);

    return mapStudentRow(res.rows[0]);
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student | null> {
    const existing = await this.getStudentById(id);
    if (!existing) return null;

    const setClauses: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;

    if (updates.displayName !== undefined) {
      setClauses.push(`display_name = $${paramIndex++}`);
      params.push(updates.displayName.trim());
    }
    if (updates.studentCode !== undefined) {
      setClauses.push(`student_code = $${paramIndex++}`);
      params.push(updates.studentCode.trim());
    }
    if (updates.grade !== undefined) {
      setClauses.push(`grade = $${paramIndex++}`);
      params.push(Number(updates.grade));
    }
    if (updates.section !== undefined) {
      setClauses.push(`section = $${paramIndex++}`);
      params.push(updates.section.trim().toUpperCase());
    }
    if (updates.classroomId !== undefined) {
      setClauses.push(`classroom_id = $${paramIndex++}`);
      params.push(updates.classroomId.trim());
    }
    if (updates.enrollmentStatus !== undefined) {
      setClauses.push(`enrollment_status = $${paramIndex++}`);
      params.push(updates.enrollmentStatus);
    }
    if (updates.notes !== undefined) {
      setClauses.push(`notes = $${paramIndex++}`);
      params.push(updates.notes.trim());
    }

    setClauses.push("updated_at = NOW()");

    if (setClauses.length === 1) {
      return existing;
    }

    const sql = `
      UPDATE students
      SET ${setClauses.join(", ")}
      WHERE id = $1
      RETURNING 
        id,
        student_code AS "studentCode",
        display_name AS "displayName",
        classroom_id AS "classroomId",
        grade,
        section,
        enrollment_status AS "enrollmentStatus",
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;

    const res = await queryPostgres(sql, params);
    if (res.rows.length === 0) return null;
    return mapStudentRow(res.rows[0]);
  },

  async deleteStudent(id: string): Promise<boolean> {
    const pool = getPostgresPool();
    if (!pool) return false;

    let client: PoolClient | null = null;
    try {
      client = await pool.connect();
      await client.query("BEGIN");

      // Cascading cleanups for student records
      await client.query("DELETE FROM learning_gaps WHERE student_id = $1", [id]);
      await client.query("DELETE FROM remedial_plans WHERE student_id = $1", [id]);
      await client.query("DELETE FROM assessment_results WHERE student_id = $1", [id]);
      await client.query("DELETE FROM activity_attempts WHERE student_id = $1", [id]);
      const res = await client.query("DELETE FROM students WHERE id = $1", [id]);

      await client.query("COMMIT");
      return (res.rowCount || 0) > 0;
    } catch (err) {
      if (client) await client.query("ROLLBACK");
      console.error(`[PostgreSQL deleteStudent error for ${id}]:`, err);
      throw err;
    } finally {
      if (client) client.release();
    }
  },
};

function mapStudentRow(row: any): Student {
  return {
    id: row.id,
    studentCode: row.studentCode,
    displayName: row.displayName,
    classroomId: row.classroomId,
    grade: Number(row.grade),
    section: row.section,
    enrollmentStatus: row.enrollmentStatus || "active",
    notes: row.notes || "",
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
  };
}

/**
 * PostgreSQL Assessment & Result Operations
 */
export const postgresAssessmentDb = {
  async getAssessments(classroomId?: string): Promise<Assessment[]> {
    let sql = `
      SELECT 
        id,
        classroom_id AS "classroomId",
        subject_id AS "subjectId",
        subject_code AS "subjectCode",
        title,
        assessment_date AS "assessmentDate",
        status,
        max_marks AS "maxMarks",
        concept_ids AS "conceptIds",
        created_at AS "createdAt"
      FROM assessments
    `;
    const params: any[] = [];
    if (classroomId && classroomId !== "all") {
      sql += " WHERE classroom_id = $1";
      params.push(classroomId);
    }
    sql += " ORDER BY assessment_date DESC";
    const res = await queryPostgres(sql, params);
    return res.rows.map((r) => ({
      ...r,
      maxMarks: Number(r.maxMarks),
      conceptIds: Array.isArray(r.conceptIds) ? r.conceptIds : JSON.parse(r.conceptIds || "[]"),
      assessmentDate: new Date(r.assessmentDate).toISOString().split("T")[0],
      createdAt: new Date(r.createdAt).toISOString(),
    }));
  },

  async createAssessment(
    data: Omit<Assessment, "id" | "createdAt">,
    initialResults?: Omit<AssessmentResult, "id" | "assessmentId">[]
  ): Promise<Assessment> {
    const id = `asm-${Date.now()}`;
    const pool = getPostgresPool();
    if (!pool) throw new Error("PostgreSQL pool not available");

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO assessments (
          id, classroom_id, subject_id, subject_code, title,
          assessment_date, status, max_marks, concept_ids, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          id,
          data.classroomId,
          data.subjectId,
          data.subjectCode,
          data.title,
          data.assessmentDate,
          data.status || "published",
          data.maxMarks,
          JSON.stringify(data.conceptIds || []),
        ]
      );

      if (initialResults && initialResults.length > 0) {
        for (const res of initialResults) {
          const resId = `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const pct = Math.round((Number(res.marksObtained) / Math.max(1, Number(res.maximumMarks))) * 100);
          await client.query(
            `INSERT INTO assessment_results (
              id, assessment_id, student_id, concept_id,
              marks_obtained, maximum_marks, percentage, notes, recorded_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              resId,
              id,
              res.studentId,
              res.conceptId,
              res.marksObtained,
              res.maximumMarks,
              pct,
              res.notes || "",
              res.recordedAt || new Date().toISOString(),
            ]
          );
        }
      }

      // Seed baseline Users if empty
      const userCheck = await client.query("SELECT COUNT(*) FROM users");
      if (parseInt(userCheck.rows[0].count, 10) === 0) {
        for (const usr of SEED_USERS) {
          await client.query(
            `INSERT INTO users (id, name, email, role, school_id, google_id, avatar_url, provider, password_hash, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
            [
              usr.id,
              usr.name,
              usr.email,
              usr.role,
              usr.schoolId,
              usr.googleId || null,
              usr.avatarUrl || null,
              usr.provider || "local",
              usr.passwordHash || null,
              usr.status || "active",
            ]
          );
        }
      }

      await client.query("COMMIT");
      return {
        ...data,
        id,
        createdAt: new Date().toISOString(),
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async getResults(studentId?: string, conceptId?: string): Promise<AssessmentResult[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (studentId) {
      conditions.push(`student_id = $${idx++}`);
      params.push(studentId);
    }
    if (conceptId) {
      conditions.push(`concept_id = $${idx++}`);
      params.push(conceptId);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `
      SELECT 
        id,
        assessment_id AS "assessmentId",
        student_id AS "studentId",
        concept_id AS "conceptId",
        marks_obtained AS "marksObtained",
        maximum_marks AS "maximumMarks",
        percentage,
        notes,
        recorded_at AS "recordedAt"
      FROM assessment_results
      ${where}
      ORDER BY recorded_at ASC
    `;
    const res = await queryPostgres(sql, params);
    return res.rows.map((r) => ({
      ...r,
      marksObtained: Number(r.marksObtained),
      maximumMarks: Number(r.maximumMarks),
      percentage: Number(r.percentage),
      recordedAt: new Date(r.recordedAt).toISOString(),
    }));
  },

  async recordResults(results: Omit<AssessmentResult, "id">[]): Promise<AssessmentResult[]> {
    const pool = getPostgresPool();
    if (!pool) throw new Error("PostgreSQL pool not available");

    const client = await pool.connect();
    const created: AssessmentResult[] = [];
    try {
      await client.query("BEGIN");
      for (const r of results) {
        const id = `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const pct = Math.round((Number(r.marksObtained) / Math.max(1, Number(r.maximumMarks))) * 100);
        await client.query(
          `INSERT INTO assessment_results (
            id, assessment_id, student_id, concept_id,
            marks_obtained, maximum_marks, percentage, notes, recorded_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            id,
            r.assessmentId,
            r.studentId,
            r.conceptId,
            r.marksObtained,
            r.maximumMarks,
            pct,
            r.notes || "",
            r.recordedAt || new Date().toISOString(),
          ]
        );
        created.push({
          ...r,
          id,
          percentage: pct,
          recordedAt: r.recordedAt || new Date().toISOString(),
        });
      }
      await client.query("COMMIT");
      return created;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
};

/**
 * PostgreSQL Learning Gaps Operations
 */
export const postgresLearningGapDb = {
  async getLearningGaps(studentId?: string): Promise<LearningGap[]> {
    let sql = `
      SELECT 
        g.id,
        g.student_id AS "studentId",
        s.display_name AS "studentName",
        g.concept_id AS "conceptId",
        c.name AS "conceptName",
        c.subject_code AS "subjectCode",
        s.grade,
        g.priority,
        g.mastery_status AS "masteryStatus",
        g.reason,
        g.status,
        g.attempts_count AS "attemptsCount",
        g.latest_percentage AS "latestPercentage",
        g.previous_percentage AS "previousPercentage",
        g.delta_percentage_points AS "deltaPercentagePoints",
        g.remedial_plan_id AS "remedialPlanId",
        g.updated_at AS "updatedAt"
      FROM learning_gaps g
      JOIN students s ON g.student_id = s.id
      JOIN concepts c ON g.concept_id = c.id
    `;
    const params: any[] = [];
    if (studentId) {
      sql += " WHERE g.student_id = $1";
      params.push(studentId);
    }
    sql += " ORDER BY g.updated_at DESC";
    const res = await queryPostgres(sql, params);
    return res.rows.map((r) => ({
      ...r,
      grade: Number(r.grade),
      attemptsCount: Number(r.attemptsCount || 1),
      latestPercentage: Number(r.latestPercentage),
      previousPercentage: r.previousPercentage !== null ? Number(r.previousPercentage) : undefined,
      deltaPercentagePoints: r.deltaPercentagePoints !== null ? Number(r.deltaPercentagePoints) : undefined,
      updatedAt: new Date(r.updatedAt).toISOString(),
    }));
  },

  async upsertLearningGap(gap: LearningGap): Promise<void> {
    const sql = `
      INSERT INTO learning_gaps (
        id, student_id, concept_id, priority, mastery_status, reason,
        status, attempts_count, latest_percentage, previous_percentage,
        delta_percentage_points, remedial_plan_id, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      ON CONFLICT (student_id, concept_id) DO UPDATE SET
        priority = EXCLUDED.priority,
        mastery_status = EXCLUDED.mastery_status,
        reason = EXCLUDED.reason,
        status = EXCLUDED.status,
        attempts_count = EXCLUDED.attempts_count,
        latest_percentage = EXCLUDED.latest_percentage,
        previous_percentage = EXCLUDED.previous_percentage,
        delta_percentage_points = EXCLUDED.delta_percentage_points,
        remedial_plan_id = COALESCE(EXCLUDED.remedial_plan_id, learning_gaps.remedial_plan_id),
        updated_at = NOW()
    `;
    await queryPostgres(sql, [
      gap.id,
      gap.studentId,
      gap.conceptId,
      gap.priority,
      gap.masteryStatus,
      gap.reason,
      gap.status,
      gap.attemptsCount,
      gap.latestPercentage,
      gap.previousPercentage ?? null,
      gap.deltaPercentagePoints ?? null,
      gap.remedialPlanId ?? null,
    ]);
  },
};

/**
 * PostgreSQL Remedial Plans Operations
 */
export const postgresRemedialPlanDb = {
  async getRemedialPlans(studentId?: string, status?: string): Promise<RemedialPlan[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (studentId) {
      conditions.push(`p.student_id = $${idx++}`);
      params.push(studentId);
    }
    if (status) {
      conditions.push(`p.status = $${idx++}`);
      params.push(status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `
      SELECT 
        p.id,
        p.student_id AS "studentId",
        s.display_name AS "studentName",
        p.concept_id AS "conceptId",
        c.name AS "conceptName",
        c.subject_code AS "subjectCode",
        p.learning_objective AS "learningObjective",
        p.recommendation_reason AS "recommendationReason",
        p.status,
        p.estimated_minutes AS "estimatedMinutes",
        p.difficulty,
        p.required_materials AS "requiredMaterials",
        p.steps,
        p.practice_questions_summary AS "practiceQuestionsSummary",
        p.reassessment_criteria AS "reassessmentCriteria",
        p.teacher_instructions AS "teacherInstructions",
        p.teacher_notes AS "teacherNotes",
        p.created_at AS "createdAt",
        p.review_date AS "reviewDate"
      FROM remedial_plans p
      JOIN students s ON p.student_id = s.id
      JOIN concepts c ON p.concept_id = c.id
      ${where}
      ORDER BY p.created_at DESC
    `;
    const res = await queryPostgres(sql, params);
    return res.rows.map((r) => ({
      ...r,
      estimatedMinutes: Number(r.estimatedMinutes || 25),
      requiredMaterials: Array.isArray(r.requiredMaterials)
        ? r.requiredMaterials
        : JSON.parse(r.requiredMaterials || "[]"),
      steps: Array.isArray(r.steps) ? r.steps : JSON.parse(r.steps || "[]"),
      createdAt: new Date(r.createdAt).toISOString(),
    }));
  },

  async upsertRemedialPlan(plan: RemedialPlan): Promise<void> {
    const sql = `
      INSERT INTO remedial_plans (
        id, student_id, concept_id, learning_objective, recommendation_reason,
        status, estimated_minutes, difficulty, required_materials, steps,
        practice_questions_summary, reassessment_criteria, teacher_instructions,
        teacher_notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      ON CONFLICT (id) DO UPDATE SET
        learning_objective = EXCLUDED.learning_objective,
        recommendation_reason = EXCLUDED.recommendation_reason,
        status = EXCLUDED.status,
        estimated_minutes = EXCLUDED.estimated_minutes,
        difficulty = EXCLUDED.difficulty,
        required_materials = EXCLUDED.required_materials,
        steps = EXCLUDED.steps,
        teacher_notes = EXCLUDED.teacher_notes,
        review_date = NOW()
    `;
    await queryPostgres(sql, [
      plan.id,
      plan.studentId,
      plan.conceptId,
      plan.learningObjective,
      plan.recommendationReason,
      plan.status,
      plan.estimatedMinutes || 25,
      plan.difficulty || "Beginner",
      JSON.stringify(plan.requiredMaterials || []),
      JSON.stringify(plan.steps || []),
      plan.practiceQuestionsSummary || "",
      plan.reassessmentCriteria || "",
      plan.teacherInstructions || "",
      plan.teacherNotes || "",
    ]);
  },

  async updateRemedialPlan(id: string, updates: Partial<RemedialPlan>): Promise<boolean> {
    const sets: string[] = [];
    const params: any[] = [id];
    let idx = 2;

    if (updates.status !== undefined) {
      sets.push(`status = $${idx++}`);
      params.push(updates.status);
    }
    if (updates.teacherNotes !== undefined) {
      sets.push(`teacher_notes = $${idx++}`);
      params.push(updates.teacherNotes);
    }
    if (updates.steps !== undefined) {
      sets.push(`steps = $${idx++}`);
      params.push(JSON.stringify(updates.steps));
    }
    if (updates.learningObjective !== undefined) {
      sets.push(`learning_objective = $${idx++}`);
      params.push(updates.learningObjective);
    }

    sets.push("review_date = NOW()");
    const sql = `UPDATE remedial_plans SET ${sets.join(", ")} WHERE id = $1`;
    const res = await queryPostgres(sql, params);
    return (res.rowCount || 0) > 0;
  },
};

/**
 * PostgreSQL Activities & Attempts Operations
 */
export const postgresActivityDb = {
  async getActivities(conceptId?: string, subjectCode?: string): Promise<LearningActivity[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (conceptId) {
      conditions.push(`a.concept_id = $${idx++}`);
      params.push(conceptId);
    }
    if (subjectCode) {
      conditions.push(`a.subject_code = $${idx++}`);
      params.push(subjectCode);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `
      SELECT 
        a.id,
        a.concept_id AS "conceptId",
        c.name AS "conceptName",
        a.subject_code AS "subjectCode",
        a.grade,
        a.title,
        a.title_gujarati AS "titleGujarati",
        a.activity_type AS "activityType",
        a.difficulty,
        a.estimated_minutes AS "estimatedMinutes",
        a.questions,
        a.created_at AS "createdAt"
      FROM learning_activities a
      JOIN concepts c ON a.concept_id = c.id
      ${where}
      ORDER BY a.grade ASC
    `;
    const res = await queryPostgres(sql, params);
    return res.rows.map((r) => ({
      ...r,
      grade: Number(r.grade),
      estimatedMinutes: Number(r.estimatedMinutes || 10),
      questions: Array.isArray(r.questions) ? r.questions : JSON.parse(r.questions || "[]"),
      createdAt: new Date(r.createdAt).toISOString(),
    }));
  },

  async recordAttempt(attempt: ActivityAttempt): Promise<void> {
    const sql = `
      INSERT INTO activity_attempts (
        id, student_id, activity_id, score, maximum_score,
        percentage, answers, incorrect_questions, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `;
    await queryPostgres(sql, [
      attempt.id,
      attempt.studentId,
      attempt.activityId,
      attempt.score,
      attempt.maximumScore,
      attempt.percentage,
      JSON.stringify(attempt.answers || {}),
      JSON.stringify(attempt.incorrectQuestions || []),
    ]);
  },
};

/**
 * PostgreSQL Settings Operations
 */
export const postgresSettingsDb = {
  async getSettings(): Promise<SchoolSettings | null> {
    const sql = `
      SELECT 
        id,
        school_id AS "schoolId",
        mastery_threshold AS "masteryThreshold",
        developing_threshold AS "developingThreshold",
        preferred_language AS "preferredLanguage",
        enable_ai_assist AS "enableAiAssist"
      FROM school_settings
      LIMIT 1
    `;
    const res = await queryPostgres(sql);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      schoolId: r.schoolId,
      masteryThreshold: Number(r.masteryThreshold || 80),
      developingThreshold: Number(r.developingThreshold || 60),
      preferredLanguage: r.preferredLanguage || "en",
      enableAiAssist: Boolean(r.enableAiAssist),
    };
  },

  async updateSettings(updates: Partial<SchoolSettings>): Promise<void> {
    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (updates.masteryThreshold !== undefined) {
      sets.push(`mastery_threshold = $${idx++}`);
      params.push(updates.masteryThreshold);
    }
    if (updates.developingThreshold !== undefined) {
      sets.push(`developing_threshold = $${idx++}`);
      params.push(updates.developingThreshold);
    }
    if (updates.preferredLanguage !== undefined) {
      sets.push(`preferred_language = $${idx++}`);
      params.push(updates.preferredLanguage);
    }
    if (updates.enableAiAssist !== undefined) {
      sets.push(`enable_ai_assist = $${idx++}`);
      params.push(updates.enableAiAssist);
    }

    if (sets.length === 0) return;
    sets.push("updated_at = NOW()");
    await queryPostgres(`UPDATE school_settings SET ${sets.join(", ")}`);
  },
};

export const postgresUserDb = {
  async getAllUsers(): Promise<User[]> {
    const pool = getPostgresPool()!;
    const { rows } = await pool.query(
      `SELECT id, name, email, role, school_id as "schoolId", google_id as "googleId", 
              avatar_url as "avatarUrl", provider, status, created_at as "createdAt", updated_at as "updatedAt" 
       FROM users ORDER BY created_at ASC`
    );
    return rows;
  },

  async getUserById(id: string): Promise<User | null> {
    const pool = getPostgresPool()!;
    const { rows } = await pool.query(
      `SELECT id, name, email, role, school_id as "schoolId", google_id as "googleId", 
              avatar_url as "avatarUrl", provider, status, password_hash as "passwordHash",
              created_at as "createdAt", updated_at as "updatedAt" 
       FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const pool = getPostgresPool()!;
    const { rows } = await pool.query(
      `SELECT id, name, email, role, school_id as "schoolId", google_id as "googleId", 
              avatar_url as "avatarUrl", provider, status, password_hash as "passwordHash",
              created_at as "createdAt", updated_at as "updatedAt" 
       FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email.trim()]
    );
    return rows[0] || null;
  },

  async getUserByGoogleId(googleId: string): Promise<User | null> {
    const pool = getPostgresPool()!;
    const { rows } = await pool.query(
      `SELECT id, name, email, role, school_id as "schoolId", google_id as "googleId", 
              avatar_url as "avatarUrl", provider, status, password_hash as "passwordHash",
              created_at as "createdAt", updated_at as "updatedAt" 
       FROM users WHERE google_id = $1 LIMIT 1`,
      [googleId]
    );
    return rows[0] || null;
  },

  async createUser(userData: Partial<User> & { email: string; name: string }): Promise<User> {
    const pool = getPostgresPool()!;
    const existing = await this.getUserByEmail(userData.email);
    if (existing) {
      throw new Error("A user with this email address already exists.");
    }

    const id = userData.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const { rows } = await pool.query(
      `INSERT INTO users (id, name, email, role, school_id, google_id, avatar_url, provider, password_hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, email, role, school_id as "schoolId", google_id as "googleId", avatar_url as "avatarUrl", provider, status, created_at as "createdAt", updated_at as "updatedAt"`,
      [
        id,
        userData.name || "Educator",
        userData.email.trim().toLowerCase(),
        userData.role || "teacher",
        userData.schoolId || "sch-gn-01",
        userData.googleId || null,
        userData.avatarUrl || null,
        userData.provider || "local",
        userData.passwordHash || null,
        userData.status || "active",
      ]
    );
    return rows[0];
  },

  async upsertUser(userData: Partial<User> & { email: string }): Promise<User> {
    const pool = getPostgresPool()!;
    const existing = userData.googleId
      ? await this.getUserByGoogleId(userData.googleId)
      : await this.getUserByEmail(userData.email);

    if (existing) {
      const { rows } = await pool.query(
        `UPDATE users SET 
          name = COALESCE($1, name),
          google_id = COALESCE($2, google_id),
          avatar_url = COALESCE($3, avatar_url),
          provider = COALESCE($4, provider),
          school_id = COALESCE($5, school_id),
          role = COALESCE($6, role),
          password_hash = COALESCE($7, password_hash),
          status = COALESCE($8, status),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING id, name, email, role, school_id as "schoolId", google_id as "googleId", avatar_url as "avatarUrl", provider, status, created_at as "createdAt", updated_at as "updatedAt"`,
        [
          userData.name || null,
          userData.googleId || null,
          userData.avatarUrl || null,
          userData.provider || null,
          userData.schoolId || null,
          userData.role || null,
          userData.passwordHash || null,
          userData.status || null,
          existing.id,
        ]
      );
      return rows[0];
    } else {
      return this.createUser({
        ...userData,
        name: userData.name || "Educator",
      });
    }
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const pool = getPostgresPool()!;
    const existing = await this.getUserById(id);
    if (!existing) return null;

    const { rows } = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        role = COALESCE($2, role),
        school_id = COALESCE($3, school_id),
        avatar_url = COALESCE($4, avatar_url),
        status = COALESCE($5, status),
        password_hash = COALESCE($6, password_hash),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, name, email, role, school_id as "schoolId", google_id as "googleId", avatar_url as "avatarUrl", provider, status, created_at as "createdAt", updated_at as "updatedAt"`,
      [
        updates.name || null,
        updates.role || null,
        updates.schoolId || null,
        updates.avatarUrl || null,
        updates.status || null,
        updates.passwordHash || null,
        id,
      ]
    );
    return rows[0] || null;
  },

  async deleteUser(id: string): Promise<boolean> {
    const pool = getPostgresPool()!;
    const res = await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  },
};

export const postgresParentDb = {
  async getParentByUserId(userId: string): Promise<ParentProfile | null> {
    const pool = getPostgresPool()!;
    const { rows: profileRows } = await pool.query(
      `SELECT id, user_id as "userId", name, email, phone, 
              preferred_language as "preferredLanguage", relationship, 
              created_at as "createdAt", updated_at as "updatedAt"
       FROM parent_profiles WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    if (!profileRows[0]) return null;
    const profile = profileRows[0];

    const { rows: studentRows } = await pool.query(
      `SELECT student_id as "studentId" FROM parent_students WHERE parent_id = $1 ORDER BY linked_at ASC`,
      [profile.id]
    );
    profile.studentIds = studentRows.map((r: any) => r.studentId);
    return profile;
  },

  async getParentById(id: string): Promise<ParentProfile | null> {
    const pool = getPostgresPool()!;
    const { rows: profileRows } = await pool.query(
      `SELECT id, user_id as "userId", name, email, phone, 
              preferred_language as "preferredLanguage", relationship, 
              created_at as "createdAt", updated_at as "updatedAt"
       FROM parent_profiles WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (!profileRows[0]) return null;
    const profile = profileRows[0];

    const { rows: studentRows } = await pool.query(
      `SELECT student_id as "studentId" FROM parent_students WHERE parent_id = $1 ORDER BY linked_at ASC`,
      [profile.id]
    );
    profile.studentIds = studentRows.map((r: any) => r.studentId);
    return profile;
  },

  async createParentProfile(data: {
    id?: string;
    userId: string;
    name: string;
    email?: string;
    phone?: string;
    preferredLanguage?: string;
    relationship?: string;
    studentIds?: string[];
  }): Promise<ParentProfile> {
    const pool = getPostgresPool()!;
    const id = data.id || `par-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const prefLang = data.preferredLanguage || "gu";
    const rel = data.relationship || "guardian";

    await pool.query(
      `INSERT INTO parent_profiles (id, user_id, name, email, phone, preferred_language, relationship)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         preferred_language = EXCLUDED.preferred_language,
         relationship = EXCLUDED.relationship,
         updated_at = CURRENT_TIMESTAMP`,
      [id, data.userId, data.name, data.email || null, data.phone || null, prefLang, rel]
    );

    if (data.studentIds && data.studentIds.length > 0) {
      for (const studentId of data.studentIds) {
        await pool.query(
          `INSERT INTO parent_students (parent_id, student_id, relationship)
           VALUES ($1, $2, $3)
           ON CONFLICT (parent_id, student_id) DO NOTHING`,
          [id, studentId, rel]
        );
      }
    }

    return {
      id,
      userId: data.userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      preferredLanguage: prefLang as any,
      relationship: rel as any,
      studentIds: data.studentIds || [],
    };
  },

  async linkParentToStudent(parentId: string, studentId: string, relationship = "guardian"): Promise<boolean> {
    const pool = getPostgresPool()!;
    await pool.query(
      `INSERT INTO parent_students (parent_id, student_id, relationship)
       VALUES ($1, $2, $3)
       ON CONFLICT (parent_id, student_id) DO UPDATE SET relationship = EXCLUDED.relationship`,
      [parentId, studentId, relationship]
    );
    return true;
  },

  async unlinkParentFromStudent(parentId: string, studentId: string): Promise<boolean> {
    const pool = getPostgresPool()!;
    const res = await pool.query(
      `DELETE FROM parent_students WHERE parent_id = $1 AND student_id = $2`,
      [parentId, studentId]
    );
    return (res.rowCount ?? 0) > 0;
  },

  async getLinkedStudentsForParent(parentId: string): Promise<Student[]> {
    const pool = getPostgresPool()!;
    const { rows } = await pool.query(
      `SELECT s.id, s.roll_number as "rollNumber", s.first_name as "firstName", 
              s.last_name as "lastName", s.display_name as "displayName", 
              s.class_id as "classId", s.grade, s.section, s.gender, 
              s.attendance_rate as "attendanceRate", s.performance_level as "performanceLevel",
              s.preferred_language as "preferredLanguage", s.avatar_url as "avatarUrl"
       FROM students s
       JOIN parent_students ps ON ps.student_id = s.id
       WHERE ps.parent_id = $1
       ORDER BY s.roll_number ASC`,
      [parentId]
    );
    return rows;
  },

  async createLinkingCode(studentId: string, createdByUserId?: string, expiresInDays = 7): Promise<ParentLinkingCode> {
    const pool = getPostgresPool()!;
    const id = `plc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `PAR-${randomSuffix}`;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    const { rows } = await pool.query(
      `INSERT INTO parent_linking_codes (id, student_id, code, expires_at, status, created_by_user_id)
       VALUES ($1, $2, $3, $4, 'active', $5)
       RETURNING id, student_id as "studentId", code, expires_at as "expiresAt", 
                 status, created_by_user_id as "createdByUserId", created_at as "createdAt"`,
      [id, studentId, code, expiresAt, createdByUserId || null]
    );
    return rows[0];
  },

  async getLinkingCode(code: string): Promise<ParentLinkingCode | null> {
    const pool = getPostgresPool()!;
    const normalized = code.trim().toUpperCase();
    const { rows } = await pool.query(
      `SELECT id, student_id as "studentId", code, expires_at as "expiresAt", 
              status, created_by_user_id as "createdByUserId", used_by_user_id as "usedByUserId",
              used_at as "usedAt", created_at as "createdAt"
       FROM parent_linking_codes WHERE UPPER(code) = $1 LIMIT 1`,
      [normalized]
    );
    return rows[0] || null;
  },

  async redeemLinkingCode(
    code: string,
    parentUserId: string,
    parentProfileId: string
  ): Promise<{ success: boolean; studentId?: string; error?: string }> {
    const pool = getPostgresPool()!;
    const linkingCode = await this.getLinkingCode(code);
    if (!linkingCode) {
      return { success: false, error: "Invalid verification code. Please check the code provided by your school." };
    }

    if (linkingCode.status === "used") {
      return { success: false, error: "This linking code has already been redeemed." };
    }

    if (new Date(linkingCode.expiresAt).getTime() < Date.now()) {
      await pool.query(`UPDATE parent_linking_codes SET status = 'expired' WHERE id = $1`, [linkingCode.id]);
      return { success: false, error: "This linking code has expired. Please request a new code from the school teacher." };
    }

    // Mark as used
    await pool.query(
      `UPDATE parent_linking_codes 
       SET status = 'used', used_by_user_id = $1, used_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [parentUserId, linkingCode.id]
    );

    // Link parent to student
    await pool.query(
      `INSERT INTO parent_students (parent_id, student_id, relationship)
       VALUES ($1, $2, 'guardian')
       ON CONFLICT (parent_id, student_id) DO NOTHING`,
      [parentProfileId, linkingCode.studentId]
    );

    return { success: true, studentId: linkingCode.studentId };
  },

  async getLinkingCodesForStudent(studentId: string): Promise<ParentLinkingCode[]> {
    const pool = getPostgresPool()!;
    const { rows } = await pool.query(
      `SELECT id, student_id as "studentId", code, expires_at as "expiresAt", 
              status, created_by_user_id as "createdByUserId", used_by_user_id as "usedByUserId",
              used_at as "usedAt", created_at as "createdAt"
       FROM parent_linking_codes WHERE student_id = $1 ORDER BY created_at DESC`,
      [studentId]
    );
    return rows;
  },

  async createParentMessage(
    parentId: string,
    studentId: string,
    subject: string,
    message: string
  ): Promise<ParentMessage> {
    const pool = getPostgresPool()!;
    const id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const { rows } = await pool.query(
      `INSERT INTO parent_messages (id, parent_id, student_id, subject, message, status)
       VALUES ($1, $2, $3, $4, $5, 'sent')
       RETURNING id, parent_id as "parentId", student_id as "studentId", subject, message, status, created_at as "createdAt"`,
      [id, parentId, studentId, subject, message]
    );
    return rows[0];
  },

  async getMessagesForParent(parentId: string): Promise<ParentMessage[]> {
    const pool = getPostgresPool()!;
    const { rows } = await pool.query(
      `SELECT id, parent_id as "parentId", student_id as "studentId", subject, message, status, 
              reply, replied_at as "repliedAt", created_at as "createdAt"
       FROM parent_messages WHERE parent_id = $1 ORDER BY created_at DESC`,
      [parentId]
    );
    return rows;
  },
};
