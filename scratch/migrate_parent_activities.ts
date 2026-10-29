import { Pool } from "pg";
import * as fs from "fs";

function getEnvUrl(): string {
  const envContent = fs.readFileSync(".env", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("DATABASE_URL=")) {
      let val = trimmed.substring("DATABASE_URL=".length).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      return val;
    }
  }
  return process.env.DATABASE_URL || "";
}

async function run() {
  const connStr = getEnvUrl();
  console.log("Connecting to Neon DB...");
  const pool = new Pool({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS parent_activity_completions (
          id VARCHAR(64) PRIMARY KEY,
          parent_id VARCHAR(64) REFERENCES parent_profiles(id) ON DELETE CASCADE,
          student_id VARCHAR(64) REFERENCES students(id) ON DELETE CASCADE,
          activity_id VARCHAR(64) NOT NULL,
          concept_id VARCHAR(64),
          completed BOOLEAN DEFAULT TRUE,
          completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_parent_activity_student ON parent_activity_completions(student_id);
    `);
    console.log("parent_activity_completions table created/verified!");

    // Ensure Dineshbhai Patel user and parent profile are linked to Aarav Patel in PostgreSQL
    await pool.query(`
      INSERT INTO users (id, name, email, role, school_id, status)
      VALUES ('par-001', 'Dineshbhai Patel', 'dinesh.patel@example.com', 'parent', 'sch-gn-01', 'active')
      ON CONFLICT (id) DO UPDATE SET name = 'Dineshbhai Patel', role = 'parent';

      INSERT INTO parent_profiles (id, user_id, name, email, preferred_language, relationship)
      VALUES ('par-001-profile', 'par-001', 'Dineshbhai Patel', 'dinesh.patel@example.com', 'gu', 'father')
      ON CONFLICT (id) DO UPDATE SET name = 'Dineshbhai Patel';

      INSERT INTO parent_students (parent_id, student_id, relationship)
      VALUES ('par-001-profile', 'std-aarav', 'father')
      ON CONFLICT DO NOTHING;
    `);
    console.log("Dineshbhai Patel successfully linked to Aarav Patel in PostgreSQL!");
  } catch (e) {
    console.error("Migration error:", e);
  } finally {
    await pool.end();
  }
}

run();

