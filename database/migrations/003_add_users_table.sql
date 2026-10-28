-- ==============================================================================
-- ShikshaSetu / StudySaathi AI - Migration 003: Users & OAuth Authentication
-- SFIC Gujarat Hackathon 2026 - Problem Statement PS-60
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'teacher',
    school_id VARCHAR(64) REFERENCES schools(id) ON DELETE SET DEFAULT DEFAULT 'sch-gn-01',
    google_id VARCHAR(255) UNIQUE,
    avatar_url TEXT,
    provider VARCHAR(32) NOT NULL DEFAULT 'local',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Seed baseline roles if not already present
INSERT INTO users (id, name, email, role, school_id, provider)
VALUES 
    ('usr-teacher-01', 'Pooja Sharma', 'teacher@studysaathi.edu.in', 'teacher', 'sch-gn-01', 'local'),
    ('usr-admin-01', 'Principal R. K. Trivedi', 'principal@studysaathi.edu.in', 'admin', 'sch-gn-01', 'local'),
    ('par-001', 'Dineshbhai Patel', 'dinesh.patel@example.com', 'parent', 'sch-gn-01', 'local')
ON CONFLICT (email) DO NOTHING;
