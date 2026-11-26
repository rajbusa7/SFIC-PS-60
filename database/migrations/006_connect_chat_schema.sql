-- ==============================================================================
-- ShikshaSetu AI - PostgreSQL Schema Migration (006_connect_chat_schema.sql)
-- ShikshaSetu Connect: WhatsApp-Style Parent-Teacher Communication System
-- ==============================================================================

CREATE TABLE IF NOT EXISTS connect_conversations (
    id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(32) NOT NULL CHECK (type IN ('direct', 'class_group', 'announcement')),
    title VARCHAR(255) NOT NULL,
    title_gujarati VARCHAR(255),
    description TEXT,
    classroom_id VARCHAR(64) REFERENCES classrooms(id) ON DELETE SET NULL,
    grade INTEGER,
    section VARCHAR(8),
    school_id VARCHAR(64) REFERENCES schools(id) ON DELETE CASCADE,
    avatar_url TEXT,
    participant_ids JSONB DEFAULT '[]'::jsonb,
    admin_ids JSONB DEFAULT '[]'::jsonb,
    last_message_text TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_message_sender_name VARCHAR(128),
    unread_counts JSONB DEFAULT '{}'::jsonb,
    is_pinned BOOLEAN DEFAULT FALSE,
    allow_parent_replies BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS connect_messages (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) REFERENCES connect_conversations(id) ON DELETE CASCADE,
    sender_id VARCHAR(64) NOT NULL,
    sender_name VARCHAR(128) NOT NULL,
    sender_role VARCHAR(32) NOT NULL CHECK (sender_role IN ('teacher', 'parent', 'admin')),
    sender_avatar TEXT,
    text TEXT NOT NULL,
    text_gujarati TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    reply_to JSONB DEFAULT NULL,
    status VARCHAR(16) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
    read_by JSONB DEFAULT '[]'::jsonb,
    is_announcement BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_reported BOOLEAN DEFAULT FALSE,
    report_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS connect_notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    conversation_id VARCHAR(64) REFERENCES connect_conversations(id) ON DELETE CASCADE,
    message_id VARCHAR(64) REFERENCES connect_messages(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_connect_conv_school ON connect_conversations(school_id);
CREATE INDEX IF NOT EXISTS idx_connect_conv_classroom ON connect_conversations(classroom_id);
CREATE INDEX IF NOT EXISTS idx_connect_messages_conv ON connect_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_connect_messages_created ON connect_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_connect_notif_user ON connect_notifications(user_id, read);
