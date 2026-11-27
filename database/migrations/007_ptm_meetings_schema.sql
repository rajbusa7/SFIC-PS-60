-- Migration: 007_ptm_meetings_schema.sql
-- Description: Parent-Teacher Meetings (PTM), meeting notes, waiting room, in-meeting chat, and RLS

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
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS start_time VARCHAR(8);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS meeting_code VARCHAR(32);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS agenda TEXT;
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS teacher_notes TEXT;
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS teacher_id VARCHAR(64);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS teacher_name VARCHAR(255);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS student_id VARCHAR(64);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS student_name VARCHAR(255);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS parent_id VARCHAR(64);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS parent_name VARCHAR(255);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS parent_email VARCHAR(255);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(32);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'scheduled';
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS join_token_hash VARCHAR(128);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

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

-- Ensure columns exist if table was previously created with older schema
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS start_time VARCHAR(8);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS meeting_code VARCHAR(32);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS agenda TEXT;
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS teacher_notes TEXT;
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS teacher_id VARCHAR(64);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS teacher_name VARCHAR(255);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS student_id VARCHAR(64);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS student_name VARCHAR(255);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS parent_id VARCHAR(64);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS parent_name VARCHAR(255);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS parent_email VARCHAR(255);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(32);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'scheduled';
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS join_token_hash VARCHAR(128);
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE ptm_meetings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

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
CREATE INDEX IF NOT EXISTS idx_ptm_notes_student ON ptm_meeting_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_ptm_chat_meeting ON ptm_chat_messages(meeting_id);
CREATE INDEX IF NOT EXISTS idx_ptm_waiting_meeting ON ptm_waiting_room(meeting_id, status);

ALTER TABLE ptm_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ptm_meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ptm_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ptm_waiting_room ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ptm_meetings_access_policy ON ptm_meetings;
CREATE POLICY ptm_meetings_access_policy ON ptm_meetings
  USING (
    current_setting('app.current_user_role', true) IN ('admin', 'teacher')
    OR EXISTS (
      SELECT 1 FROM parent_profiles pp
      WHERE pp.id = ptm_meetings.parent_id
        AND pp.user_id = current_setting('app.current_user_id', true)
    )
  )
  WITH CHECK (
    current_setting('app.current_user_role', true) IN ('admin', 'teacher')
  );

DROP POLICY IF EXISTS ptm_notes_access_policy ON ptm_meeting_notes;
CREATE POLICY ptm_notes_access_policy ON ptm_meeting_notes
  USING (
    current_setting('app.current_user_role', true) IN ('admin', 'teacher')
    OR (shared_with_parent = true AND EXISTS (
      SELECT 1 FROM ptm_meetings m
      JOIN parent_profiles pp ON pp.id = m.parent_id
      WHERE m.id = ptm_meeting_notes.meeting_id
        AND pp.user_id = current_setting('app.current_user_id', true)
    ))
  )
  WITH CHECK (
    current_setting('app.current_user_role', true) IN ('admin', 'teacher')
  );
