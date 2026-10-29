-- Migration: 003_parent_portal_schema.sql
-- Description: Parent profiles, parent-student relationships, linking codes, and teacher communication

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
