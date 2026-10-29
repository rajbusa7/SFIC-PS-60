-- ==============================================================================
-- StudySaathi AI - SMS OTP Authentication & Phone Verification Schema
-- SFIC Gujarat Hackathon 2026 - Problem Statement PS-60
-- ==============================================================================

-- 1. Ensure phone column exists on users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(32);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 2. Ensure phone column exists on parent_profiles table
ALTER TABLE parent_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(32);
CREATE INDEX IF NOT EXISTS idx_parent_profiles_phone ON parent_profiles(phone);

-- 3. Phone OTP Verifications Table
-- Stores verification session state, cryptographic OTP hashes, rate limits, and provider references.
CREATE TABLE IF NOT EXISTS phone_verifications (
    id VARCHAR(64) PRIMARY KEY,
    phone VARCHAR(32) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('teacher', 'admin', 'parent')),
    otp_hash VARCHAR(255),
    verification_sid VARCHAR(128),
    provider VARCHAR(32) NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    status VARCHAR(32) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired', 'failed')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_status ON phone_verifications(status);
