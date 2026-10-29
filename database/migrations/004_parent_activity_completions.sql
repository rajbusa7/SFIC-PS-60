-- Migration: 004_parent_activity_completions.sql
-- Description: Persistent tracking of home learning activities completed by parents for their children

CREATE TABLE IF NOT EXISTS parent_activity_completions (
    id VARCHAR(128) PRIMARY KEY,
    parent_id VARCHAR(64) REFERENCES parent_profiles(id) ON DELETE CASCADE,
    student_id VARCHAR(64) REFERENCES students(id) ON DELETE CASCADE,
    activity_id VARCHAR(128) NOT NULL,
    concept_id VARCHAR(64),
    completed BOOLEAN DEFAULT TRUE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parent_activity_student ON parent_activity_completions(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_activity_parent ON parent_activity_completions(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_activity_composite ON parent_activity_completions(student_id, activity_id);
