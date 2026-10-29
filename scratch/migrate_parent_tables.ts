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

async function migrate() {
  const connStr = getEnvUrl();
  console.log("Connecting to Neon DB...");
  const pool = new Pool({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pool.query(`
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

      CREATE INDEX IF NOT EXISTS idx_parent_profiles_user ON parent_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_parent_students_student ON parent_students(student_id);
      CREATE INDEX IF NOT EXISTS idx_parent_linking_codes_code ON parent_linking_codes(code);
      CREATE INDEX IF NOT EXISTS idx_parent_messages_student ON parent_messages(student_id);
    `);

    console.log("✔ Parent tables and indexes created successfully in Neon DB.");
  } finally {
    await pool.end();
  }
}

migrate().catch(e => {
  console.error("Migration error:", e);
  process.exit(1);
});

