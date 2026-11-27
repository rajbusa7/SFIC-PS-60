-- ==============================================================================
-- StudySaathi AI - Migration 006: Multilingual Preferences & Script Support
-- Non-destructive additive schema migration supporting all 22 scheduled Indian
-- languages and optional script variants without altering existing rows.
-- ==============================================================================

-- 1. Drop legacy ('en', 'gu') CHECK constraints and widen preferred_language columns
ALTER TABLE schools DROP CONSTRAINT IF EXISTS schools_preferred_language_check;
ALTER TABLE schools ALTER COLUMN preferred_language TYPE VARCHAR(24);

ALTER TABLE school_settings DROP CONSTRAINT IF EXISTS school_settings_preferred_language_check;
ALTER TABLE school_settings ALTER COLUMN preferred_language TYPE VARCHAR(24);

ALTER TABLE parent_profiles ALTER COLUMN preferred_language TYPE VARCHAR(24);
ALTER TABLE parent_profiles ADD COLUMN IF NOT EXISTS preferred_script VARCHAR(16);

-- 2. Add per-user language & script preferences for independent choice per account
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(24) DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_script VARCHAR(16);
CREATE INDEX IF NOT EXISTS idx_users_preferred_language ON users(preferred_language);

-- 3. Add extensible localization JSONB maps while preserving legacy *_gujarati columns
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS localizations JSONB DEFAULT '{}'::jsonb;
ALTER TABLE concepts ADD COLUMN IF NOT EXISTS localizations JSONB DEFAULT '{}'::jsonb;
ALTER TABLE learning_activities ADD COLUMN IF NOT EXISTS localizations JSONB DEFAULT '{}'::jsonb;

-- 4. Widen notice translation language storage for ISO 639-3 codes (e.g. kok, brx, mai, sat)
ALTER TABLE notices ADD COLUMN IF NOT EXISTS original_language VARCHAR(24) DEFAULT 'en';
