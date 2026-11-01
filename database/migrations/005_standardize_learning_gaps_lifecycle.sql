-- ============================================================================
-- Migration 005: Standardize Learning Gaps Lifecycle, Priority, and Metadata
-- StudySaathi / ShikshaSetu AI - SFIC 2026 (PS-60)
-- ============================================================================

ALTER TABLE learning_gaps
  ADD COLUMN IF NOT EXISTS section VARCHAR(8) DEFAULT 'A',
  ADD COLUMN IF NOT EXISTS subject_name VARCHAR(128),
  ADD COLUMN IF NOT EXISTS lifecycle_status VARCHAR(32) DEFAULT 'Active Gap';

-- Update priority check constraint to include 'Critical'
ALTER TABLE learning_gaps DROP CONSTRAINT IF EXISTS learning_gaps_priority_check;
ALTER TABLE learning_gaps ADD CONSTRAINT learning_gaps_priority_check
  CHECK (priority IN ('Critical', 'High', 'Medium', 'Low'));

-- Update status check constraint to support standardized lifecycle distinctions
ALTER TABLE learning_gaps DROP CONSTRAINT IF EXISTS learning_gaps_status_check;
ALTER TABLE learning_gaps ADD CONSTRAINT learning_gaps_status_check
  CHECK (status IN ('Active Gap', 'Monitoring/Developing', 'Closed Gap', 'Active', 'Under Intervention', 'Resolved', 'Overridden'));
