import crypto from "crypto";
import type { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
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
  TeacherAssignment,
  PtmMeeting,
  PtmMeetingNote,
  PtmChatMessage,
  PtmWaitingParticipant,
  PtmMeetingStats,
  PtmMeetingStatus,
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
  SEED_TEACHER_ASSIGNMENTS,
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

    let PoolClass: any;
    try {
      PoolClass = require("pg").Pool;
    } catch {
      return null;
    }

    poolInstance = new PoolClass({
      connectionString,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
    });

    poolInstance?.on("error", (err: any) => {
      console.error("[PostgreSQL Pool Error]:", err.message);
    });
  }

  return poolInstance;
}

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

        -- Parent Portal Tables
        CREATE TABLE IF NOT EXISTS parent_profiles (
            id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(32),
            preferred_language VARCHAR(8) DEFAULT 'gu',
            relationship VARCHAR(32) DEFAULT 'guardian',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS parent_students (
            parent_id VARCHAR(64) REFERENCES parent_profiles(id) ON DELETE CASCADE,
            student_id VARCHAR(64) REFERENCES students(id) ON DELETE CASCADE,
            relationship VARCHAR(32) DEFAULT 'guardian',
            linked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (parent_id, student_id)
        );

        CREATE TABLE IF NOT EXISTS parent_linking_codes (
            id VARCHAR(64) PRIMARY KEY,
            student_id VARCHAR(64) REFERENCES students(id) ON DELETE CASCADE,
            code VARCHAR(32) UNIQUE NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            status VARCHAR(16) DEFAULT 'active',
            created_by_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
            used_by_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
            used_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS parent_messages (
            id VARCHAR(64) PRIMARY KEY,
            parent_id VARCHAR(64) REFERENCES parent_profiles(id) ON DELETE CASCADE,
            student_id VARCHAR(64) REFERENCES students(id) ON DELETE CASCADE,
            subject VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            status VARCHAR(16) DEFAULT 'sent',
            reply TEXT,
            replied_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS parent_activity_completions (
            id VARCHAR(128) PRIMARY KEY,
            parent_id VARCHAR(64) REFERENCES parent_profiles(id) ON DELETE CASCADE,
            student_id VARCHAR(64) REFERENCES students(id) ON DELETE CASCADE,
            activity_id VARCHAR(128) NOT NULL,
            concept_id VARCHAR(64),
            completed BOOLEAN DEFAULT TRUE,
            completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_parent_profiles_user ON parent_profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_parent_students_student ON parent_students(student_id);
        CREATE INDEX IF NOT EXISTS idx_parent_linking_codes_code ON parent_linking_codes(code);
        CREATE INDEX IF NOT EXISTS idx_parent_messages_student ON parent_messages(student_id);
        CREATE INDEX IF NOT EXISTS idx_parent_activity_student ON parent_activity_completions(student_id);
        CREATE INDEX IF NOT EXISTS idx_parent_activity_parent ON parent_activity_completions(parent_id);

        -- Ensure phone columns & indexes exist for SMS OTP Authentication
        ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(32);
        CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
        ALTER TABLE parent_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(32);
        CREATE INDEX IF NOT EXISTS idx_parent_profiles_phone ON parent_profiles(phone);

        -- Ensure multilingual preferences columns & non-restrictive constraints
        ALTER TABLE schools DROP CONSTRAINT IF EXISTS schools_preferred_language_check;
        ALTER TABLE schools ALTER COLUMN preferred_language TYPE VARCHAR(24);
        ALTER TABLE school_settings DROP CONSTRAINT IF EXISTS school_settings_preferred_language_check;
        ALTER TABLE school_settings ALTER COLUMN preferred_language TYPE VARCHAR(24);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(24) DEFAULT 'en';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_script VARCHAR(16);
        CREATE INDEX IF NOT EXISTS idx_users_preferred_language ON users(preferred_language);
        ALTER TABLE parent_profiles ALTER COLUMN preferred_language TYPE VARCHAR(24);
        ALTER TABLE parent_profiles ADD COLUMN IF NOT EXISTS preferred_script VARCHAR(16);
        ALTER TABLE subjects ADD COLUMN IF NOT EXISTS localizations JSONB DEFAULT '{}'::jsonb;
        ALTER TABLE concepts ADD COLUMN IF NOT EXISTS localizations JSONB DEFAULT '{}'::jsonb;
        ALTER TABLE learning_activities ADD COLUMN IF NOT EXISTS localizations JSONB DEFAULT '{}'::jsonb;

        -- Update demo accounts with baseline verified phone numbers
        UPDATE users SET phone = '+919876543210' WHERE id = 'usr-teacher-01' AND phone IS NULL;
        UPDATE users SET phone = '+919876543211' WHERE id = 'usr-admin-01' AND phone IS NULL;
        UPDATE users SET phone = '+919825012345' WHERE id = 'par-001' AND phone IS NULL;
        UPDATE parent_profiles SET phone = '+919825012345' WHERE id = 'par-001' AND phone IS NULL;

        -- Teacher Assignments Table
        CREATE TABLE IF NOT EXISTS teacher_assignments (
            id VARCHAR(64) PRIMARY KEY,
            teacher_id VARCHAR(64) NOT NULL,
            teacher_name VARCHAR(255) NOT NULL,
            teacher_email VARCHAR(255) NOT NULL,
            school_id VARCHAR(64) DEFAULT 'sch-gn-01',
            subject_code VARCHAR(16) NOT NULL,
            subject_name VARCHAR(255) NOT NULL,
            classroom_ids JSONB DEFAULT '[]'::jsonb,
            grades JSONB DEFAULT '[]'::jsonb,
            classes JSONB DEFAULT '[]'::jsonb,
            is_class_teacher BOOLEAN DEFAULT FALSE,
            assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(teacher_id, subject_code)
        );

        CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_id ON teacher_assignments(teacher_id);
        CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_email ON teacher_assignments(LOWER(teacher_email));
        CREATE INDEX IF NOT EXISTS idx_teacher_assignments_subject_code ON teacher_assignments(subject_code);
        CREATE INDEX IF NOT EXISTS idx_teacher_assignments_updated_at ON teacher_assignments(updated_at DESC);

        -- Row-Level Security (RLS) policies for parent linking & records isolation
        ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
        ALTER TABLE parent_linking_codes ENABLE ROW LEVEL SECURITY;
        ALTER TABLE parent_messages ENABLE ROW LEVEL SECURITY;
        ALTER TABLE parent_activity_completions ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS parent_profiles_owner_policy ON parent_profiles;
        CREATE POLICY parent_profiles_owner_policy ON parent_profiles
          USING (
            current_setting('app.current_user_role', true) IN ('admin', 'teacher')
            OR user_id = current_setting('app.current_user_id', true)
          )
          WITH CHECK (
            current_setting('app.current_user_role', true) = 'admin'
            OR user_id = current_setting('app.current_user_id', true)
          );

        DROP POLICY IF EXISTS parent_students_isolation_policy ON parent_students;
        CREATE POLICY parent_students_isolation_policy ON parent_students
          USING (
            current_setting('app.current_user_role', true) IN ('admin', 'teacher')
            OR EXISTS (
              SELECT 1 FROM parent_profiles pp
              WHERE pp.id = parent_students.parent_id
                AND pp.user_id = current_setting('app.current_user_id', true)
            )
          )
          WITH CHECK (
            current_setting('app.current_user_role', true) IN ('admin', 'teacher')
            OR EXISTS (
              SELECT 1 FROM parent_profiles pp
              WHERE pp.id = parent_students.parent_id
                AND pp.user_id = current_setting('app.current_user_id', true)
            )
          );

        DROP POLICY IF EXISTS parent_linking_codes_staff_policy ON parent_linking_codes;
        CREATE POLICY parent_linking_codes_staff_policy ON parent_linking_codes
          USING (
            current_setting('app.current_user_role', true) IN ('admin', 'teacher')
            OR status = 'active'
          )
          WITH CHECK (
            current_setting('app.current_user_role', true) IN ('admin', 'teacher')
            OR (status = 'used' AND used_by_user_id = current_setting('app.current_user_id', true))
          );

        DROP POLICY IF EXISTS parent_messages_isolation_policy ON parent_messages;
        CREATE POLICY parent_messages_isolation_policy ON parent_messages
          USING (
            current_setting('app.current_user_role', true) IN ('admin', 'teacher')
            OR EXISTS (
              SELECT 1 FROM parent_profiles pp
              WHERE pp.id = parent_messages.parent_id
                AND pp.user_id = current_setting('app.current_user_id', true)
            )
          );

        DROP POLICY IF EXISTS parent_activity_isolation_policy ON parent_activity_completions;
        CREATE POLICY parent_activity_isolation_policy ON parent_activity_completions
          USING (
            current_setting('app.current_user_role', true) IN ('admin', 'teacher')
            OR EXISTS (
              SELECT 1 FROM parent_profiles pp
              WHERE pp.id = parent_activity_completions.parent_id
                AND pp.user_id = current_setting('app.current_user_id', true)
            )
          );
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

      // Seed baseline teacher assignments if empty
      const asgCheck = await client.query('SELECT COUNT(*) FROM teacher_assignments');
      if (parseInt(asgCheck.rows[0].count, 10) === 0) {
        for (const asg of SEED_TEACHER_ASSIGNMENTS) {
          await client.query(
            `INSERT INTO teacher_assignments (
              id, teacher_id, teacher_name, teacher_email, school_id, subject_code, subject_name,
              classroom_ids, grades, classes, is_class_teacher, assigned_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
            ON CONFLICT (teacher_id, subject_code) DO NOTHING`,
            [
              asg.id,
              asg.teacherId,
              asg.teacherName || "Pooja Sharma",
              asg.teacherEmail || "teacher@studysaathi.edu.in",
              asg.schoolId || "sch-gn-01",
              asg.subjectCode,
              asg.subjectName || asg.subjectCode,
              JSON.stringify(asg.classroomIds || []),
              JSON.stringify(asg.grades || []),
              JSON.stringify(asg.classes || []),
              Boolean(asg.isClassTeacher),
            ]
          );
        }
      }

      // Seed baseline demo parent linking codes if not already created
      await client.query(
        `INSERT INTO parent_linking_codes (id, student_id, code, expires_at, status, created_by_user_id, created_at)
         SELECT 'plc-demo-aarav', 'std-aarav', 'PAR-4892', NOW() + INTERVAL '30 days', 'active',
                CASE WHEN EXISTS (SELECT 1 FROM users WHERE id = 'usr-teacher-01') THEN 'usr-teacher-01' ELSE NULL END,
                NOW()
         WHERE EXISTS (SELECT 1 FROM students WHERE id = 'std-aarav')
           AND NOT EXISTS (SELECT 1 FROM parent_linking_codes WHERE id = 'plc-demo-aarav' OR UPPER(code) = 'PAR-4892')`
      );
      await client.query(
        `INSERT INTO parent_linking_codes (id, student_id, code, expires_at, status, created_by_user_id, created_at)
         SELECT 'plc-demo-diya', 'std-diya', 'PAR-5219', NOW() + INTERVAL '30 days', 'active',
                CASE WHEN EXISTS (SELECT 1 FROM users WHERE id = 'usr-teacher-01') THEN 'usr-teacher-01' ELSE NULL END,
                NOW()
         WHERE EXISTS (SELECT 1 FROM students WHERE id = 'std-diya')
           AND NOT EXISTS (SELECT 1 FROM parent_linking_codes WHERE id = 'plc-demo-diya' OR UPPER(code) = 'PAR-5219')`
      );

      // 14. Parent-Teacher Meetings (PTM) System
      await client.query(`
        CREATE TABLE IF NOT EXISTS ptm_meetings (
            id VARCHAR(64) PRIMARY KEY,
            meeting_code VARCHAR(32) UNIQUE NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            agenda TEXT,
            teacher_notes TEXT,
            teacher_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
            teacher_name VARCHAR(255) NOT NULL,
            student_id VARCHAR(64) REFERENCES students(id) ON DELETE CASCADE,
            student_name VARCHAR(255) NOT NULL,
            parent_id VARCHAR(64) REFERENCES parent_profiles(id) ON DELETE SET NULL,
            parent_name VARCHAR(255) NOT NULL,
            parent_email VARCHAR(255),
            parent_phone VARCHAR(32),
            scheduled_date DATE NOT NULL,
            start_time VARCHAR(8) NOT NULL,
            duration_minutes INTEGER NOT NULL DEFAULT 30,
            status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
            join_token_hash VARCHAR(128),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Ensure columns exist if table was previously created with older schema
        DO $$ 
        BEGIN 
            BEGIN ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS scheduled_date DATE; EXCEPTION WHEN OTHERS THEN NULL; END;
            BEGIN ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS start_time VARCHAR(8); EXCEPTION WHEN OTHERS THEN NULL; END;
            BEGIN ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30; EXCEPTION WHEN OTHERS THEN NULL; END;
            BEGIN ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS meeting_code VARCHAR(32); EXCEPTION WHEN OTHERS THEN NULL; END;
            BEGIN ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS title VARCHAR(255); EXCEPTION WHEN OTHERS THEN NULL; END;
            BEGIN ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS description TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
            BEGIN ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS agenda TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
            BEGIN ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS teacher_notes TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
            BEGIN ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS teacher_id VARCHAR(64); EXCEPTION WHEN OTHERS THEN NULL; END;
            BEGIN ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS teacher_name VARCHAR(255); EXCEPTION WHEN OTHERS THEN NULL; END;
            BEGIN ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS student_id VARCHAR(64); EXCEPTION WHEN OTHERS THEN NULL; END;
            BEGIN ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS student_name VARCHAR(255); EXCEPTION WHEN OTHERS THEN NULL; END;
            BEGIN ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS parent_id VARCHAR(64); EXCEPTION WHEN OTHERS THEN NULL; END;
            BEGIN ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS parent_name VARCHAR(255); EXCEPTION WHEN OTHERS THEN NULL; END;
            BEGIN ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS parent_email VARCHAR(255); EXCEPTION WHEN OTHERS THEN NULL; END;
            BEGIN ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(32); EXCEPTION WHEN OTHERS THEN NULL; END;
            BEGIN ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'scheduled'; EXCEPTION WHEN OTHERS THEN NULL; END;
            BEGIN ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS join_token_hash VARCHAR(128); EXCEPTION WHEN OTHERS THEN NULL; END;
            BEGIN ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP; EXCEPTION WHEN OTHERS THEN NULL; END;
            BEGIN ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP; EXCEPTION WHEN OTHERS THEN NULL; END;
        END $$;

        CREATE TABLE IF NOT EXISTS ptm_meeting_notes (
            id VARCHAR(64) PRIMARY KEY,
            meeting_id VARCHAR(64) REFERENCES ptm_meetings(id) ON DELETE CASCADE,
            student_id VARCHAR(64) REFERENCES students(id) ON DELETE CASCADE,
            teacher_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
            discussion_summary TEXT NOT NULL,
            learning_concerns TEXT,
            student_strengths TEXT,
            agreed_actions TEXT,
            follow_up_date DATE,
            shared_with_parent BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS ptm_chat_messages (
            id VARCHAR(64) PRIMARY KEY,
            meeting_id VARCHAR(64) REFERENCES ptm_meetings(id) ON DELETE CASCADE,
            sender_id VARCHAR(64) NOT NULL,
            sender_name VARCHAR(255) NOT NULL,
            sender_role VARCHAR(32) NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS ptm_waiting_room (
            id VARCHAR(64) PRIMARY KEY,
            meeting_id VARCHAR(64) REFERENCES ptm_meetings(id) ON DELETE CASCADE,
            participant_id VARCHAR(64) NOT NULL,
            participant_name VARCHAR(255) NOT NULL,
            participant_role VARCHAR(32) NOT NULL,
            status VARCHAR(16) NOT NULL DEFAULT 'waiting',
            joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            reviewed_at TIMESTAMP WITH TIME ZONE
        );

        CREATE INDEX IF NOT EXISTS idx_ptm_meetings_teacher ON ptm_meetings(teacher_id);
        CREATE INDEX IF NOT EXISTS idx_ptm_meetings_student ON ptm_meetings(student_id);
        CREATE INDEX IF NOT EXISTS idx_ptm_meetings_parent ON ptm_meetings(parent_id);
        CREATE INDEX IF NOT EXISTS idx_ptm_meetings_date ON ptm_meetings(scheduled_date, start_time);
        CREATE INDEX IF NOT EXISTS idx_ptm_meetings_status ON ptm_meetings(status);
        CREATE INDEX IF NOT EXISTS idx_ptm_meetings_code ON ptm_meetings(meeting_code);
        CREATE INDEX IF NOT EXISTS idx_ptm_notes_meeting ON ptm_meeting_notes(meeting_id);
        CREATE INDEX IF NOT EXISTS idx_ptm_chat_meeting ON ptm_chat_messages(meeting_id);
        CREATE INDEX IF NOT EXISTS idx_ptm_waiting_meeting ON ptm_waiting_room(meeting_id, status);
      `);

      // Baseline PTM seeds
      await client.query(`
        INSERT INTO ptm_meetings (
            id, meeting_code, title, agenda, teacher_id, teacher_name,
            student_id, student_name, parent_id, parent_name, parent_email,
            scheduled_date, start_time, duration_minutes, status, created_at, updated_at
        )
        SELECT 'ptm-today-aarav', 'ptm-704-291', 'Class 4 Mathematics Remedial Progress Review',
               'Review 5-step concrete division manipulative activities, verify 85% accuracy milestone, plan home practice.',
               'usr-teacher-01', 'Pooja Sharma', 'std-aarav', 'Aarav Patel', 'par-001', 'Dineshbhai Patel', 'parent.aarav@example.com',
               CURRENT_DATE, '14:30', 30, 'scheduled', NOW(), NOW()
        WHERE NOT EXISTS (SELECT 1 FROM ptm_meetings WHERE id = 'ptm-today-aarav');

        INSERT INTO ptm_meetings (
            id, meeting_code, title, agenda, teacher_id, teacher_name,
            student_id, student_name, parent_id, parent_name, parent_email,
            scheduled_date, start_time, duration_minutes, status, created_at, updated_at
        )
        SELECT 'ptm-upcoming-diya', 'ptm-819-332', 'Gujarati Reading & Phonemic Progress Discussion',
               'Discuss Matra recognition development and bilingual reading exercises.',
               'usr-teacher-01', 'Pooja Sharma', 'std-diya', 'Diya Joshi', 'par-002', 'Bhavikbhai Joshi', 'bhavik.joshi@example.com',
               CURRENT_DATE + INTERVAL '2 days', '16:00', 45, 'scheduled', NOW(), NOW()
        WHERE NOT EXISTS (SELECT 1 FROM ptm_meetings WHERE id = 'ptm-upcoming-diya');

        INSERT INTO ptm_meetings (
            id, meeting_code, title, agenda, teacher_id, teacher_name,
            student_id, student_name, parent_id, parent_name, parent_email,
            scheduled_date, start_time, duration_minutes, status, created_at, updated_at
        )
        SELECT 'ptm-past-ishaan', 'ptm-412-588', 'Foundational Number Sense Benchmark',
               'Assess 2-digit addition and place value comprehension.',
               'usr-teacher-01', 'Pooja Sharma', 'std-ishaan', 'Ishaan Solanki', 'par-003', 'Rameshbhai Solanki', 'ramesh.solanki@example.com',
               CURRENT_DATE - INTERVAL '7 days', '11:00', 30, 'completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'
        WHERE NOT EXISTS (SELECT 1 FROM ptm_meetings WHERE id = 'ptm-past-ishaan');

        INSERT INTO ptm_meetings (
            id, meeting_code, title, agenda, teacher_id, teacher_name,
            student_id, student_name, parent_id, parent_name, parent_email,
            scheduled_date, start_time, duration_minutes, status, created_at, updated_at
        )
        SELECT 'ptm-cancelled-anaya', 'ptm-301-419', 'Science Environmental Studies Check-in',
               'Quarterly curriculum review on plant life cycles.',
               'usr-teacher-01', 'Pooja Sharma', 'std-anaya', 'Anaya Patel', 'par-001', 'Dineshbhai Patel', 'parent.aarav@example.com',
               CURRENT_DATE - INTERVAL '5 days', '15:00', 15, 'cancelled', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
        WHERE NOT EXISTS (SELECT 1 FROM ptm_meetings WHERE id = 'ptm-cancelled-anaya');

        INSERT INTO ptm_meeting_notes (
            id, meeting_id, student_id, teacher_id, discussion_summary,
            learning_concerns, student_strengths, agreed_actions, follow_up_date, shared_with_parent, created_at, updated_at
        )
        SELECT 'note-past-ishaan', 'ptm-past-ishaan', 'std-ishaan', 'usr-teacher-01',
               'Reviewed foundational number line concepts and 2-digit regrouping. Ishaan demonstrated improved confidence in single-digit operations.',
               'Carrying over in double-digit column addition still causes occasional hesitation.',
               'Highly engaged in visual dot-pattern exercises and oral calculations.',
               'Parent agreed to practice 10 minutes of base-ten block manipulative cards daily before dinner.',
               CURRENT_DATE + INTERVAL '14 days', true, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'
        WHERE NOT EXISTS (SELECT 1 FROM ptm_meeting_notes WHERE id = 'note-past-ishaan');
      `);

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
    return res.rows.map((r: any) => ({
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
    return res.rows.map((r: any) => ({
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
    return res.rows.map((r: any) => ({
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
    return res.rows.map((r: any) => ({
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
    return res.rows.map((r: any) => ({
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
              avatar_url as "avatarUrl", provider, status, preferred_language as "preferredLanguage", preferred_script as "preferredScript", created_at as "createdAt", updated_at as "updatedAt" 
       FROM users ORDER BY created_at ASC`
    );
    return rows;
  },

  async getUserById(id: string): Promise<User | null> {
    const pool = getPostgresPool()!;
    const { rows } = await pool.query(
      `SELECT id, name, email, role, school_id as "schoolId", google_id as "googleId", 
              avatar_url as "avatarUrl", provider, status, password_hash as "passwordHash",
              preferred_language as "preferredLanguage", preferred_script as "preferredScript",
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
              preferred_language as "preferredLanguage", preferred_script as "preferredScript",
              created_at as "createdAt", updated_at as "updatedAt" 
       FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email.trim()]
    );
    return rows[0] || null;
  },

  async getUserByGoogleId(googleId: string): Promise<User | null> {
    const pool = getPostgresPool()!;
    const { rows } = await pool.query(
      `SELECT id, name, email, phone, role, school_id as "schoolId", google_id as "googleId", 
              avatar_url as "avatarUrl", provider, status, password_hash as "passwordHash",
              preferred_language as "preferredLanguage", preferred_script as "preferredScript",
              created_at as "createdAt", updated_at as "updatedAt" 
       FROM users WHERE google_id = $1 LIMIT 1`,
      [googleId]
    );
    return rows[0] || null;
  },

  async getUserByPhone(phone: string): Promise<User | null> {
    const pool = getPostgresPool();
    if (!pool) return null;
    const cleaned = phone.trim().replace(/[\s\-\(\)]/g, "");
    const national = cleaned.slice(-10);
    const { rows } = await pool.query(
      `SELECT id, name, email, phone, role, school_id as "schoolId", google_id as "googleId", 
              avatar_url as "avatarUrl", provider, status, password_hash as "passwordHash",
              preferred_language as "preferredLanguage", preferred_script as "preferredScript",
              created_at as "createdAt", updated_at as "updatedAt" 
       FROM users 
       WHERE phone = $1 OR phone = $2 OR RIGHT(phone, 10) = $3 LIMIT 1`,
      [phone, cleaned, national]
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
      `INSERT INTO users (id, name, email, phone, role, school_id, google_id, avatar_url, provider, password_hash, status, preferred_language, preferred_script)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, name, email, phone, role, school_id as "schoolId", google_id as "googleId", avatar_url as "avatarUrl", provider, status, preferred_language as "preferredLanguage", preferred_script as "preferredScript", created_at as "createdAt", updated_at as "updatedAt"`,
      [
        id,
        userData.name || "Educator",
        userData.email.trim().toLowerCase(),
        userData.phone || null,
        userData.role || "teacher",
        userData.schoolId || "sch-gn-01",
        userData.googleId || null,
        userData.avatarUrl || null,
        userData.provider || "local",
        userData.passwordHash || null,
        userData.status || "active",
        userData.preferredLanguage || "en",
        userData.preferredScript || null,
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
          preferred_language = COALESCE($9, preferred_language),
          preferred_script = COALESCE($10, preferred_script),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $11
        RETURNING id, name, email, role, school_id as "schoolId", google_id as "googleId", avatar_url as "avatarUrl", provider, status, preferred_language as "preferredLanguage", preferred_script as "preferredScript", created_at as "createdAt", updated_at as "updatedAt"`,
        [
          userData.name || null,
          userData.googleId || null,
          userData.avatarUrl || null,
          userData.provider || null,
          userData.schoolId || null,
          userData.role || null,
          userData.passwordHash || null,
          userData.status || null,
          userData.preferredLanguage || null,
          userData.preferredScript || null,
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
        preferred_language = COALESCE($7, preferred_language),
        preferred_script = COALESCE($8, preferred_script),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING id, name, email, role, school_id as "schoolId", google_id as "googleId", avatar_url as "avatarUrl", provider, status, preferred_language as "preferredLanguage", preferred_script as "preferredScript", created_at as "createdAt", updated_at as "updatedAt"`,
      [
        updates.name || null,
        updates.role || null,
        updates.schoolId || null,
        updates.avatarUrl || null,
        updates.status || null,
        updates.passwordHash || null,
        updates.preferredLanguage || null,
        updates.preferredScript || null,
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

const LINKING_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateSecureLinkingCode(): string {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += LINKING_CODE_ALPHABET[crypto.randomInt(0, LINKING_CODE_ALPHABET.length)];
  }
  return `PAR-${suffix}`;
}

function normalizeLinkingCode(code: string): string {
  return String(code || "").trim().toUpperCase().replace(/\s+/g, "");
}

function mapLinkingCodeRow(row: any): ParentLinkingCode {
  return {
    id: row.id,
    studentId: row.studentId,
    code: row.code,
    expiresAt: row.expiresAt ? new Date(row.expiresAt).toISOString() : new Date().toISOString(),
    status: row.status,
    createdByUserId: row.createdByUserId || undefined,
    usedByUserId: row.usedByUserId || undefined,
    usedAt: row.usedAt ? new Date(row.usedAt).toISOString() : undefined,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
  };
}

export const postgresParentDb = {
  async updateParentPreferences(
    userId: string,
    prefs: { preferredLanguage?: string; preferredScript?: string }
  ): Promise<boolean> {
    const pool = getPostgresPool();
    if (!pool) return false;
    const res = await pool.query(
      `UPDATE parent_profiles SET
         preferred_language = COALESCE($1, preferred_language),
         preferred_script = COALESCE($2, preferred_script),
         updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3`,
      [prefs.preferredLanguage || null, prefs.preferredScript || null, userId]
    );
    return (res.rowCount ?? 0) > 0;
  },
  async getParentByUserId(userId: string): Promise<ParentProfile | null> {
    await ensurePostgresSchema();
    const pool = getPostgresPool()!;
    const { rows: profileRows } = await pool.query(
      `SELECT id, user_id as "userId", name, email, phone, 
              preferred_language as "preferredLanguage", preferred_script as "preferredScript", relationship, 
              created_at as "createdAt", updated_at as "updatedAt"
       FROM parent_profiles WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
      [userId]
    );
    if (!profileRows[0]) return null;
    const profile = profileRows[0];

    const { rows: studentRows } = await pool.query(
      `SELECT DISTINCT ps.student_id as "studentId"
       FROM parent_students ps
       JOIN parent_profiles pp ON pp.id = ps.parent_id
       WHERE pp.user_id = $1`,
      [userId]
    );
    profile.studentIds = studentRows.map((r: any) => r.studentId);
    return profile;
  },

  async getParentByPhone(phone: string): Promise<ParentProfile | null> {
    await ensurePostgresSchema();
    const pool = getPostgresPool();
    if (!pool) return null;
    const cleaned = phone.trim().replace(/[\s\-\(\)]/g, "");
    const national = cleaned.slice(-10);
    const { rows: profileRows } = await pool.query(
      `SELECT id, user_id as "userId", name, email, phone, 
              preferred_language as "preferredLanguage", preferred_script as "preferredScript", relationship, 
              created_at as "createdAt", updated_at as "updatedAt"
       FROM parent_profiles 
       WHERE phone = $1 OR phone = $2 OR RIGHT(phone, 10) = $3
       ORDER BY created_at ASC LIMIT 1`,
      [phone, cleaned, national]
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
    await ensurePostgresSchema();
    const pool = getPostgresPool()!;
    const { rows: profileRows } = await pool.query(
      `SELECT id, user_id as "userId", name, email, phone, 
              preferred_language as "preferredLanguage", preferred_script as "preferredScript", relationship, 
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

  async getParentsByStudentId(studentId: string): Promise<ParentProfile[]> {
    await ensurePostgresSchema();
    const pool = getPostgresPool()!;
    const { rows } = await pool.query(
      `SELECT pp.id, pp.user_id as "userId", pp.name, pp.email, pp.phone,
              pp.preferred_language as "preferredLanguage",
              COALESCE(ps.relationship, pp.relationship) as relationship
       FROM parent_profiles pp
       JOIN parent_students ps ON ps.parent_id = pp.id
       WHERE ps.student_id = $1
       ORDER BY ps.linked_at ASC`,
      [studentId]
    );
    return rows.map((r: any) => ({
      ...r,
      studentIds: [studentId],
    }));
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
    await ensurePostgresSchema();
    const pool = getPostgresPool()!;
    const prefLang = data.preferredLanguage || "gu";
    const rel = data.relationship || "guardian";

    // Prevent duplicate parent_profiles rows for the same user_id
    const existingByUser = await this.getParentByUserId(data.userId);
    const id = existingByUser?.id || data.id || `par-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    await pool.query(
      `INSERT INTO parent_profiles (id, user_id, name, email, phone, preferred_language, relationship)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         email = COALESCE(EXCLUDED.email, parent_profiles.email),
         phone = COALESCE(EXCLUDED.phone, parent_profiles.phone),
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

    const mergedIds = Array.from(new Set([...(existingByUser?.studentIds || []), ...(data.studentIds || [])]));
    return {
      id,
      userId: data.userId,
      name: data.name,
      email: data.email || existingByUser?.email,
      phone: data.phone || existingByUser?.phone,
      preferredLanguage: prefLang as any,
      relationship: rel as any,
      studentIds: mergedIds,
    };
  },

  async linkParentToStudent(parentId: string, studentId: string, relationship = "guardian"): Promise<boolean> {
    await ensurePostgresSchema();
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
    await ensurePostgresSchema();
    const pool = getPostgresPool()!;
    const res = await pool.query(
      `DELETE FROM parent_students WHERE parent_id = $1 AND student_id = $2`,
      [parentId, studentId]
    );
    return (res.rowCount ?? 0) > 0;
  },

  async getLinkedStudentsForParent(parentId: string): Promise<Student[]> {
    await ensurePostgresSchema();
    const pool = getPostgresPool()!;
    const { rows } = await pool.query(
      `SELECT DISTINCT
         s.id,
         s.student_code AS "studentCode",
         s.display_name AS "displayName",
         s.classroom_id AS "classroomId",
         s.grade,
         s.section,
         s.enrollment_status AS "enrollmentStatus",
         s.notes,
         s.created_at AS "createdAt"
       FROM students s
       JOIN parent_students ps ON ps.student_id = s.id
       LEFT JOIN parent_profiles pp ON pp.id = ps.parent_id
       WHERE ps.parent_id = $1
          OR (
            pp.user_id IS NOT NULL
            AND pp.user_id = (SELECT user_id FROM parent_profiles WHERE id = $1 LIMIT 1)
          )
       ORDER BY s.display_name ASC`,
      [parentId]
    );
    return rows.map(mapStudentRow);
  },

  async createLinkingCode(studentId: string, createdByUserId?: string, expiresInDays = 7): Promise<ParentLinkingCode> {
    await ensurePostgresSchema();
    const pool = getPostgresPool()!;

    const studentRes = await pool.query(`SELECT id FROM students WHERE id = $1 LIMIT 1`, [studentId]);
    if (studentRes.rows.length === 0) {
      throw new Error("Student not found.");
    }

    const safeDays = Math.min(30, Math.max(1, Number(expiresInDays) || 7));
    const expiresAt = new Date(Date.now() + safeDays * 24 * 60 * 60 * 1000).toISOString();

    let validCreatorId: string | null = null;
    if (createdByUserId) {
      const creatorRes = await pool.query(`SELECT id FROM users WHERE id = $1 LIMIT 1`, [createdByUserId]);
      if (creatorRes.rows.length > 0) {
        validCreatorId = createdByUserId;
      }
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const id = `plc-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
      const code = generateSecureLinkingCode();
      try {
        const { rows } = await pool.query(
          `INSERT INTO parent_linking_codes (id, student_id, code, expires_at, status, created_by_user_id)
           VALUES ($1, $2, $3, $4, 'active', $5)
           RETURNING id, student_id as "studentId", code, expires_at as "expiresAt", 
                     status, created_by_user_id as "createdByUserId", created_at as "createdAt"`,
          [id, studentId, code, expiresAt, validCreatorId]
        );
        return mapLinkingCodeRow(rows[0]);
      } catch (err: any) {
        if (err?.code === "23505" && attempt < 4) continue;
        throw err;
      }
    }
    throw new Error("Failed to generate a unique verification code. Please try again.");
  },

  async getLinkingCode(code: string): Promise<ParentLinkingCode | null> {
    await ensurePostgresSchema();
    const pool = getPostgresPool()!;
    const normalized = normalizeLinkingCode(code);
    if (!normalized) return null;
    const { rows } = await pool.query(
      `SELECT id, student_id as "studentId", code, expires_at as "expiresAt", 
              status, created_by_user_id as "createdByUserId", used_by_user_id as "usedByUserId",
              used_at as "usedAt", created_at as "createdAt"
       FROM parent_linking_codes WHERE UPPER(TRIM(code)) = $1 LIMIT 1`,
      [normalized]
    );
    return rows[0] ? mapLinkingCodeRow(rows[0]) : null;
  },

  async redeemLinkingCode(
    code: string,
    parentUserId: string,
    parentProfileId: string
  ): Promise<{ success: boolean; alreadyLinked?: boolean; studentId?: string; error?: string; errorCode?: string }> {
    await ensurePostgresSchema();
    const pool = getPostgresPool()!;
    const normalized = normalizeLinkingCode(code);
    if (!normalized) {
      return {
        success: false,
        errorCode: "INVALID_CODE",
        error: "Please enter a valid verification code.",
      };
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const codeRes = await client.query(
        `SELECT id, student_id as "studentId", code, expires_at as "expiresAt",
                status, created_by_user_id as "createdByUserId", used_by_user_id as "usedByUserId",
                used_at as "usedAt", created_at as "createdAt"
         FROM parent_linking_codes
         WHERE UPPER(TRIM(code)) = $1
         FOR UPDATE
         LIMIT 1`,
        [normalized]
      );

      if (codeRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return {
          success: false,
          errorCode: "INVALID_CODE",
          error: "Invalid verification code. Please check the code provided by your school.",
        };
      }

      const linkingCode = mapLinkingCodeRow(codeRes.rows[0]);

      // Check if THIS authenticated parent is already linked to the student before rejecting reused/active codes.
      // Safe because it only matches an already-authorized parent-student association.
      const existingLinkRes = await client.query(
        `SELECT 1 FROM parent_students ps
         JOIN parent_profiles pp ON pp.id = ps.parent_id
         WHERE (ps.parent_id = $1 OR pp.user_id = $2) AND ps.student_id = $3
         LIMIT 1`,
        [parentProfileId, parentUserId, linkingCode.studentId]
      );
      if (existingLinkRes.rows.length > 0) {
        await client.query("ROLLBACK");
        return {
          success: true,
          alreadyLinked: true,
          errorCode: "ALREADY_LINKED",
          studentId: linkingCode.studentId,
        };
      }

      if (linkingCode.status === "used") {
        await client.query("ROLLBACK");
        return {
          success: false,
          errorCode: "USED_CODE",
          error: "This verification code has already been redeemed. Please ask your child's teacher for a new code.",
        };
      }

      if (linkingCode.status === "revoked") {
        await client.query("ROLLBACK");
        return {
          success: false,
          errorCode: "REVOKED_CODE",
          error: "This verification code is no longer active. Please request a new code from your child's teacher.",
        };
      }

      if (linkingCode.status === "expired" || new Date(linkingCode.expiresAt).getTime() <= Date.now()) {
        if (linkingCode.status !== "expired") {
          await client.query(`UPDATE parent_linking_codes SET status = 'expired' WHERE id = $1`, [linkingCode.id]);
        }
        await client.query("COMMIT");
        return {
          success: false,
          errorCode: "EXPIRED_CODE",
          error: "This verification code has expired. Please request a new code from your child's teacher.",
        };
      }

      // Ensure student exists and is active (never leak details on failure)
      const studentRes = await client.query(
        `SELECT id, enrollment_status as "enrollmentStatus" FROM students WHERE id = $1 LIMIT 1`,
        [linkingCode.studentId]
      );
      if (studentRes.rows.length === 0 || studentRes.rows[0].enrollmentStatus === "transferred") {
        await client.query("ROLLBACK");
        return {
          success: false,
          errorCode: "INVALID_CODE",
          error: "Invalid verification code. Please check the code provided by your school.",
        };
      }

      // Verify parent profile ownership before consuming code or linking
      const profileRes = await client.query(
        `SELECT id, relationship FROM parent_profiles WHERE id = $1 AND user_id = $2 LIMIT 1`,
        [parentProfileId, parentUserId]
      );
      if (profileRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return {
          success: false,
          errorCode: "PROFILE_NOT_FOUND",
          error: "Parent profile not found. Please sign in again.",
        };
      }

      // Atomically mark code as used
      const updateRes = await client.query(
        `UPDATE parent_linking_codes
         SET status = 'used', used_by_user_id = $1, used_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND status = 'active'
         RETURNING id`,
        [parentUserId, linkingCode.id]
      );
      if ((updateRes.rowCount ?? 0) === 0) {
        await client.query("ROLLBACK");
        return {
          success: false,
          errorCode: "USED_CODE",
          error: "This verification code has already been redeemed. Please ask your child's teacher for a new code.",
        };
      }

      const rel = profileRes.rows[0].relationship || "guardian";
      await client.query(
        `INSERT INTO parent_students (parent_id, student_id, relationship)
         VALUES ($1, $2, $3)
         ON CONFLICT (parent_id, student_id) DO NOTHING`,
        [parentProfileId, linkingCode.studentId, rel]
      );

      await client.query("COMMIT");
      return { success: true, alreadyLinked: false, studentId: linkingCode.studentId };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async revokeLinkingCode(codeId: string, studentId: string): Promise<boolean> {
    await ensurePostgresSchema();
    const pool = getPostgresPool()!;
    const res = await pool.query(
      `UPDATE parent_linking_codes
       SET status = 'revoked'
       WHERE id = $1 AND student_id = $2 AND status = 'active'`,
      [codeId, studentId]
    );
    return (res.rowCount ?? 0) > 0;
  },

  async getLinkingCodesForStudent(studentId: string): Promise<ParentLinkingCode[]> {
    await ensurePostgresSchema();
    const pool = getPostgresPool()!;
    await pool.query(
      `UPDATE parent_linking_codes
       SET status = 'expired'
       WHERE student_id = $1 AND status = 'active' AND expires_at <= CURRENT_TIMESTAMP`,
      [studentId]
    );
    const { rows } = await pool.query(
      `SELECT id, student_id as "studentId", code, expires_at as "expiresAt", 
              status, created_by_user_id as "createdByUserId", used_by_user_id as "usedByUserId",
              used_at as "usedAt", created_at as "createdAt"
       FROM parent_linking_codes WHERE student_id = $1 ORDER BY created_at DESC`,
      [studentId]
    );
    return rows.map(mapLinkingCodeRow);
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

  async recordActivityCompletion(
    parentId: string,
    studentId: string,
    activityId: string,
    conceptId: string,
    completed: boolean
  ): Promise<any> {
    const pool = getPostgresPool()!;
    const id = `cmp-${parentId}-${studentId}-${activityId}`;
    const { rows } = await pool.query(
      `INSERT INTO parent_activity_completions (id, parent_id, student_id, activity_id, concept_id, completed, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (id) DO UPDATE SET completed = $6, completed_at = NOW()
       RETURNING id, parent_id as "parentId", student_id as "studentId", activity_id as "activityId", concept_id as "conceptId", completed, completed_at as "completedAt"`,
      [id, parentId, studentId, activityId, conceptId || "", completed]
    );
    return rows[0];
  },

  async getActivityCompletions(studentId: string): Promise<any[]> {
    const pool = getPostgresPool()!;
    const { rows } = await pool.query(
      `SELECT id, parent_id as "parentId", student_id as "studentId", activity_id as "activityId", concept_id as "conceptId", completed, completed_at as "completedAt"
       FROM parent_activity_completions
       WHERE student_id = $1 AND completed = TRUE
       ORDER BY completed_at DESC`,
      [studentId]
    );
    return rows;
  },
};


export const postgresTeacherAssignmentDb = {
  async getAllAssignments(): Promise<TeacherAssignment[]> {
    const pool = getPostgresPool();
    if (!pool) return [];
    await ensurePostgresSchema();
    const { rows } = await pool.query(
      `SELECT id, teacher_id as "teacherId", teacher_name as "teacherName", teacher_email as "teacherEmail",
              school_id as "schoolId", subject_code as "subjectCode", subject_name as "subjectName",
              classroom_ids as "classroomIds", grades, classes, is_class_teacher as "isClassTeacher",
              assigned_at as "assignedAt", updated_at as "updatedAt"
       FROM teacher_assignments
       ORDER BY updated_at DESC`
    );
    return rows.map((r) => ({
      ...r,
      classroomIds: Array.isArray(r.classroomIds) ? r.classroomIds : typeof r.classroomIds === "string" ? JSON.parse(r.classroomIds) : [],
      grades: Array.isArray(r.grades) ? r.grades : typeof r.grades === "string" ? JSON.parse(r.grades) : [],
      classes: Array.isArray(r.classes) ? r.classes : typeof r.classes === "string" ? JSON.parse(r.classes) : [],
    }));
  },

  async getAssignmentsByTeacher(teacherId: string): Promise<TeacherAssignment[]> {
    const pool = getPostgresPool();
    if (!pool) return [];
    await ensurePostgresSchema();
    const clean = (teacherId || "").trim().toLowerCase();
    const { rows } = await pool.query(
      `SELECT id, teacher_id as "teacherId", teacher_name as "teacherName", teacher_email as "teacherEmail",
              school_id as "schoolId", subject_code as "subjectCode", subject_name as "subjectName",
              classroom_ids as "classroomIds", grades, classes, is_class_teacher as "isClassTeacher",
              assigned_at as "assignedAt", updated_at as "updatedAt"
       FROM teacher_assignments
       WHERE LOWER(teacher_id) = $1 OR LOWER(teacher_email) = $1
       ORDER BY updated_at DESC`,
      [clean]
    );
    return rows.map((r) => ({
      ...r,
      classroomIds: Array.isArray(r.classroomIds) ? r.classroomIds : typeof r.classroomIds === "string" ? JSON.parse(r.classroomIds) : [],
      grades: Array.isArray(r.grades) ? r.grades : typeof r.grades === "string" ? JSON.parse(r.grades) : [],
      classes: Array.isArray(r.classes) ? r.classes : typeof r.classes === "string" ? JSON.parse(r.classes) : [],
    }));
  },

  async getAssignmentById(id: string): Promise<TeacherAssignment | null> {
    const pool = getPostgresPool();
    if (!pool) return null;
    await ensurePostgresSchema();
    const { rows } = await pool.query(
      `SELECT id, teacher_id as "teacherId", teacher_name as "teacherName", teacher_email as "teacherEmail",
              school_id as "schoolId", subject_code as "subjectCode", subject_name as "subjectName",
              classroom_ids as "classroomIds", grades, classes, is_class_teacher as "isClassTeacher",
              assigned_at as "assignedAt", updated_at as "updatedAt"
       FROM teacher_assignments
       WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      ...r,
      classroomIds: Array.isArray(r.classroomIds) ? r.classroomIds : typeof r.classroomIds === "string" ? JSON.parse(r.classroomIds) : [],
      grades: Array.isArray(r.grades) ? r.grades : typeof r.grades === "string" ? JSON.parse(r.grades) : [],
      classes: Array.isArray(r.classes) ? r.classes : typeof r.classes === "string" ? JSON.parse(r.classes) : [],
    };
  },

  async upsertAssignment(
    assignment: Omit<TeacherAssignment, "id" | "assignedAt"> & { id?: string }
  ): Promise<TeacherAssignment> {
    const pool = getPostgresPool();
    if (!pool) throw new Error("Database pool is not available");
    await ensurePostgresSchema();

    const id = assignment.id || `asg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const subjectCode = (assignment.subjectCode || "").trim().toUpperCase();
    const grades = Array.isArray(assignment.grades) && assignment.grades.length > 0
      ? Array.from(new Set(assignment.grades.map(Number))).filter((g) => g >= 1 && g <= 5).sort((a, b) => a - b)
      : [1, 2, 3, 4, 5];
    const classes = Array.isArray(assignment.classes) && assignment.classes.length > 0
      ? assignment.classes
      : grades.map((g) => `Class ${g}`);
    const classroomIds = Array.isArray(assignment.classroomIds) && assignment.classroomIds.length > 0
      ? assignment.classroomIds
      : grades.map((g) => `cls-${g}a`);

    const { rows } = await pool.query(
      `INSERT INTO teacher_assignments (
        id, teacher_id, teacher_name, teacher_email, school_id, subject_code, subject_name,
        classroom_ids, grades, classes, is_class_teacher, assigned_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      ON CONFLICT (teacher_id, subject_code) DO UPDATE SET
        teacher_name = EXCLUDED.teacher_name,
        teacher_email = EXCLUDED.teacher_email,
        school_id = EXCLUDED.school_id,
        subject_name = EXCLUDED.subject_name,
        classroom_ids = EXCLUDED.classroom_ids,
        grades = EXCLUDED.grades,
        classes = EXCLUDED.classes,
        is_class_teacher = EXCLUDED.is_class_teacher,
        updated_at = NOW()
      RETURNING id, teacher_id as "teacherId", teacher_name as "teacherName", teacher_email as "teacherEmail",
                school_id as "schoolId", subject_code as "subjectCode", subject_name as "subjectName",
                classroom_ids as "classroomIds", grades, classes, is_class_teacher as "isClassTeacher",
                assigned_at as "assignedAt", updated_at as "updatedAt"`,
      [
        id,
        assignment.teacherId,
        assignment.teacherName || assignment.teacherId,
        assignment.teacherEmail || "",
        assignment.schoolId || "sch-gn-01",
        subjectCode,
        assignment.subjectName || subjectCode,
        JSON.stringify(classroomIds),
        JSON.stringify(grades),
        JSON.stringify(classes),
        Boolean(assignment.isClassTeacher),
      ]
    );

    const r = rows[0];
    return {
      ...r,
      classroomIds: Array.isArray(r.classroomIds) ? r.classroomIds : typeof r.classroomIds === "string" ? JSON.parse(r.classroomIds) : [],
      grades: Array.isArray(r.grades) ? r.grades : typeof r.grades === "string" ? JSON.parse(r.grades) : [],
      classes: Array.isArray(r.classes) ? r.classes : typeof r.classes === "string" ? JSON.parse(r.classes) : [],
    };
  },

  async deleteAssignment(id: string): Promise<boolean> {
    const pool = getPostgresPool();
    if (!pool) return false;
    await ensurePostgresSchema();
    const res = await pool.query(`DELETE FROM teacher_assignments WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  },

  async deleteAssignmentsByTeacher(teacherId: string): Promise<number> {
    const pool = getPostgresPool();
    if (!pool) return 0;
    await ensurePostgresSchema();
    const clean = (teacherId || "").trim().toLowerCase();
    const res = await pool.query(
      `DELETE FROM teacher_assignments WHERE LOWER(teacher_id) = $1 OR LOWER(teacher_email) = $1`,
      [clean]
    );
    return res.rowCount ?? 0;
  },
};

export const postgresPtmDb = {
  async getMeetings(options?: {
    teacherId?: string;
    parentId?: string;
    studentId?: string;
    status?: PtmMeetingStatus;
    date?: string;
  }): Promise<PtmMeeting[]> {
    const pool = getPostgresPool();
    if (!pool) return [];
    await ensurePostgresSchema();

    let query = `
      SELECT id, meeting_code as "meetingCode", title, description, agenda, teacher_notes as "teacherNotes",
             teacher_id as "teacherId", teacher_name as "teacherName",
             student_id as "studentId", student_name as "studentName",
             parent_id as "parentId", parent_name as "parentName",
             parent_email as "parentEmail", parent_phone as "parentPhone",
             TO_CHAR(scheduled_date, 'YYYY-MM-DD') as "scheduledDate",
             start_time as "startTime", duration_minutes as "durationMinutes",
             status, join_token_hash as "joinTokenHash",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM ptm_meetings
      WHERE 1=1
    `;
    const params: any[] = [];
    let pIdx = 1;

    if (options?.teacherId) {
      query += ` AND teacher_id = $${pIdx++}`;
      params.push(options.teacherId);
    }
    if (options?.parentId) {
      query += ` AND parent_id = $${pIdx++}`;
      params.push(options.parentId);
    }
    if (options?.studentId) {
      query += ` AND student_id = $${pIdx++}`;
      params.push(options.studentId);
    }
    if (options?.status) {
      query += ` AND status = $${pIdx++}`;
      params.push(options.status);
    }
    if (options?.date) {
      query += ` AND TO_CHAR(scheduled_date, 'YYYY-MM-DD') = $${pIdx++}`;
      params.push(options.date);
    }

    query += ` ORDER BY scheduled_date ASC, start_time ASC`;

    const { rows } = await pool.query(query, params);
    return rows;
  },

  async getMeetingById(idOrCode: string): Promise<PtmMeeting | null> {
    const pool = getPostgresPool();
    if (!pool) return null;
    await ensurePostgresSchema();

    const { rows } = await pool.query(
      `SELECT id, meeting_code as "meetingCode", title, description, agenda, teacher_notes as "teacherNotes",
              teacher_id as "teacherId", teacher_name as "teacherName",
              student_id as "studentId", student_name as "studentName",
              parent_id as "parentId", parent_name as "parentName",
              parent_email as "parentEmail", parent_phone as "parentPhone",
              TO_CHAR(scheduled_date, 'YYYY-MM-DD') as "scheduledDate",
              start_time as "startTime", duration_minutes as "durationMinutes",
              status, join_token_hash as "joinTokenHash",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM ptm_meetings
       WHERE id = $1 OR meeting_code = $1`,
      [idOrCode]
    );
    return rows[0] || null;
  },

  async createMeeting(meeting: PtmMeeting): Promise<PtmMeeting> {
    const pool = getPostgresPool();
    if (!pool) throw new Error("PostgreSQL not configured");
    await ensurePostgresSchema();

    const { rows } = await pool.query(
      `INSERT INTO ptm_meetings (
         id, meeting_code, title, description, agenda, teacher_notes,
         teacher_id, teacher_name, student_id, student_name,
         parent_id, parent_name, parent_email, parent_phone,
         scheduled_date, start_time, duration_minutes, status, join_token_hash,
         created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
       RETURNING id, meeting_code as "meetingCode", title, description, agenda, teacher_notes as "teacherNotes",
                 teacher_id as "teacherId", teacher_name as "teacherName",
                 student_id as "studentId", student_name as "studentName",
                 parent_id as "parentId", parent_name as "parentName",
                 parent_email as "parentEmail", parent_phone as "parentPhone",
                 TO_CHAR(scheduled_date, 'YYYY-MM-DD') as "scheduledDate",
                 start_time as "startTime", duration_minutes as "durationMinutes",
                 status, join_token_hash as "joinTokenHash",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [
        meeting.id,
        meeting.meetingCode,
        meeting.title,
        meeting.description || null,
        meeting.agenda || null,
        meeting.teacherNotes || null,
        meeting.teacherId,
        meeting.teacherName,
        meeting.studentId,
        meeting.studentName,
        meeting.parentId,
        meeting.parentName,
        meeting.parentEmail || null,
        meeting.parentPhone || null,
        meeting.scheduledDate,
        meeting.startTime,
        meeting.durationMinutes || 30,
        meeting.status || "scheduled",
        meeting.joinTokenHash || null,
      ]
    );
    return rows[0];
  },

  async updateMeetingStatus(id: string, status: PtmMeetingStatus): Promise<PtmMeeting | null> {
    const pool = getPostgresPool();
    if (!pool) return null;
    await ensurePostgresSchema();

    const { rows } = await pool.query(
      `UPDATE ptm_meetings
       SET status = $2, updated_at = NOW()
       WHERE id = $1 OR meeting_code = $1
       RETURNING id, meeting_code as "meetingCode", title, description, agenda, teacher_notes as "teacherNotes",
                 teacher_id as "teacherId", teacher_name as "teacherName",
                 student_id as "studentId", student_name as "studentName",
                 parent_id as "parentId", parent_name as "parentName",
                 parent_email as "parentEmail", parent_phone as "parentPhone",
                 TO_CHAR(scheduled_date, 'YYYY-MM-DD') as "scheduledDate",
                 start_time as "startTime", duration_minutes as "durationMinutes",
                 status, join_token_hash as "joinTokenHash",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [id, status]
    );
    return rows[0] || null;
  },

  async getStats(teacherId?: string, parentId?: string): Promise<PtmMeetingStats> {
    const pool = getPostgresPool();
    if (!pool) return { total: 0, upcoming: 0, completed: 0, cancelled: 0 };
    await ensurePostgresSchema();

    let filter = "";
    const params: any[] = [];
    if (teacherId) {
      filter += " AND teacher_id = $1";
      params.push(teacherId);
    } else if (parentId) {
      filter += " AND parent_id = $1";
      params.push(parentId);
    }

    const { rows } = await pool.query(
      `SELECT
         COUNT(*)::int as total,
         COUNT(*) FILTER (WHERE status = 'scheduled' OR status = 'waiting' OR status = 'in_progress')::int as upcoming,
         COUNT(*) FILTER (WHERE status = 'completed')::int as completed,
         COUNT(*) FILTER (WHERE status = 'cancelled' OR status = 'no_show')::int as cancelled
       FROM ptm_meetings
       WHERE 1=1 ${filter}`,
      params
    );

    const r = rows[0] || {};
    return {
      total: r.total || 0,
      upcoming: r.upcoming || 0,
      completed: r.completed || 0,
      cancelled: r.cancelled || 0,
    };
  },

  async getNotes(meetingId: string): Promise<PtmMeetingNote[]> {
    const pool = getPostgresPool();
    if (!pool) return [];
    await ensurePostgresSchema();

    const { rows } = await pool.query(
      `SELECT id, meeting_id as "meetingId", student_id as "studentId", teacher_id as "teacherId",
              discussion_summary as "discussionSummary", learning_concerns as "learningConcerns",
              student_strengths as "studentStrengths", agreed_actions as "agreedActions",
              TO_CHAR(follow_up_date, 'YYYY-MM-DD') as "followUpDate",
              shared_with_parent as "sharedWithParent",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM ptm_meeting_notes
       WHERE meeting_id = $1
       ORDER BY created_at DESC`,
      [meetingId]
    );
    return rows;
  },

  async saveNote(note: PtmMeetingNote): Promise<PtmMeetingNote> {
    const pool = getPostgresPool();
    if (!pool) throw new Error("PostgreSQL not configured");
    await ensurePostgresSchema();

    const { rows } = await pool.query(
      `INSERT INTO ptm_meeting_notes (
         id, meeting_id, student_id, teacher_id, discussion_summary,
         learning_concerns, student_strengths, agreed_actions, follow_up_date,
         shared_with_parent, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         discussion_summary = EXCLUDED.discussion_summary,
         learning_concerns = EXCLUDED.learning_concerns,
         student_strengths = EXCLUDED.student_strengths,
         agreed_actions = EXCLUDED.agreed_actions,
         follow_up_date = EXCLUDED.follow_up_date,
         shared_with_parent = EXCLUDED.shared_with_parent,
         updated_at = NOW()
       RETURNING id, meeting_id as "meetingId", student_id as "studentId", teacher_id as "teacherId",
                 discussion_summary as "discussionSummary", learning_concerns as "learningConcerns",
                 student_strengths as "studentStrengths", agreed_actions as "agreedActions",
                 TO_CHAR(follow_up_date, 'YYYY-MM-DD') as "followUpDate",
                 shared_with_parent as "sharedWithParent",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [
        note.id,
        note.meetingId,
        note.studentId,
        note.teacherId,
        note.discussionSummary,
        note.learningConcerns || null,
        note.studentStrengths || null,
        note.agreedActions || null,
        note.followUpDate || null,
        note.sharedWithParent ?? false,
      ]
    );
    return rows[0];
  },

  async getChatMessages(meetingId: string): Promise<PtmChatMessage[]> {
    const pool = getPostgresPool();
    if (!pool) return [];
    await ensurePostgresSchema();

    const { rows } = await pool.query(
      `SELECT id, meeting_id as "meetingId", sender_id as "senderId",
              sender_name as "senderName", sender_role as "senderRole",
              message, created_at as "createdAt"
       FROM ptm_chat_messages
       WHERE meeting_id = $1
       ORDER BY created_at ASC`,
      [meetingId]
    );
    return rows;
  },

  async saveChatMessage(msg: PtmChatMessage): Promise<PtmChatMessage> {
    const pool = getPostgresPool();
    if (!pool) throw new Error("PostgreSQL not configured");
    await ensurePostgresSchema();

    const { rows } = await pool.query(
      `INSERT INTO ptm_chat_messages (id, meeting_id, sender_id, sender_name, sender_role, message, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, meeting_id as "meetingId", sender_id as "senderId",
                 sender_name as "senderName", sender_role as "senderRole",
                 message, created_at as "createdAt"`,
      [msg.id, msg.meetingId, msg.senderId, msg.senderName, msg.senderRole, msg.message]
    );
    return rows[0];
  },

  async getWaitingParticipants(meetingId: string): Promise<PtmWaitingParticipant[]> {
    const pool = getPostgresPool();
    if (!pool) return [];
    await ensurePostgresSchema();

    const { rows } = await pool.query(
      `SELECT id, meeting_id as "meetingId", participant_id as "participantId",
              participant_name as "participantName", participant_role as "participantRole",
              status, joined_at as "joinedAt", reviewed_at as "reviewedAt"
       FROM ptm_waiting_room
       WHERE meeting_id = $1 AND status = 'waiting'
       ORDER BY joined_at ASC`,
      [meetingId]
    );
    return rows;
  },

  async addWaitingParticipant(
    meetingId: string,
    participant: { participantId: string; participantName: string; participantRole: any }
  ): Promise<PtmWaitingParticipant> {
    const pool = getPostgresPool();
    if (!pool) throw new Error("PostgreSQL not configured");
    await ensurePostgresSchema();

    const id = `wait-${meetingId}-${participant.participantId}`;
    const { rows } = await pool.query(
      `INSERT INTO ptm_waiting_room (id, meeting_id, participant_id, participant_name, participant_role, status, joined_at)
       VALUES ($1, $2, $3, $4, $5, 'waiting', NOW())
       ON CONFLICT (id) DO UPDATE SET status = 'waiting', joined_at = NOW(), reviewed_at = NULL
       RETURNING id, meeting_id as "meetingId", participant_id as "participantId",
                 participant_name as "participantName", participant_role as "participantRole",
                 status, joined_at as "joinedAt", reviewed_at as "reviewedAt"`,
      [id, meetingId, participant.participantId, participant.participantName, participant.participantRole]
    );
    return rows[0];
  },

  async updateWaitingStatus(
    meetingId: string,
    participantId: string,
    status: "admitted" | "rejected"
  ): Promise<boolean> {
    const pool = getPostgresPool();
    if (!pool) return false;
    await ensurePostgresSchema();

    const res = await pool.query(
      `UPDATE ptm_waiting_room
       SET status = $3, reviewed_at = NOW()
       WHERE meeting_id = $1 AND participant_id = $2`,
      [meetingId, participantId, status]
    );
    return (res.rowCount ?? 0) > 0;
  },
};

export const getPgPool = getPostgresPool;
