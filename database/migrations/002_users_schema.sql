-- ==============================================================================
-- StudySaathi AI - PostgreSQL Schema Migration (002_users_schema.sql)
-- SFIC Gujarat Hackathon 2026 - Problem Statement PS-60
-- Target Database: PostgreSQL 14+ (Supabase, Neon, AWS RDS, Vercel Postgres)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(32) DEFAULT 'teacher' CHECK (role IN ('teacher', 'admin', 'parent')),
    school_id VARCHAR(64) REFERENCES schools(id) ON DELETE SET NULL,
    google_id VARCHAR(255) UNIQUE,
    avatar_url TEXT,
    provider VARCHAR(32) DEFAULT 'local' CHECK (provider IN ('local', 'google')),
    password_hash TEXT,
    status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'disabled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
