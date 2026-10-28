-- Migration: 003_ai_assistant_name.sql
-- Description: Add configurable AI Assistant display name to school settings

ALTER TABLE school_settings 
ADD COLUMN IF NOT EXISTS ai_assistant_name VARCHAR(128) DEFAULT 'Study Buddy';

UPDATE school_settings 
SET ai_assistant_name = 'Study Buddy' 
WHERE ai_assistant_name IS NULL OR ai_assistant_name = '';

