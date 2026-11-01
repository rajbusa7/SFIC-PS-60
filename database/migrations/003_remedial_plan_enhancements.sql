-- ==============================================================================
-- ShikshaSetu AI - PostgreSQL Schema Migration (003_remedial_plan_enhancements.sql)
-- Enhances remedial_plans table with structured assessment evidence, teaching strategy,
-- practice questions, teacher approval, and versioning.
-- ==============================================================================

ALTER TABLE remedial_plans
  ADD COLUMN IF NOT EXISTS supporting_evidence JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS teaching_strategy TEXT,
  ADD COLUMN IF NOT EXISTS practice_questions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS success_criteria TEXT,
  ADD COLUMN IF NOT EXISTS completed_step_numbers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS teacher_approval JSONB,
  ADD COLUMN IF NOT EXISTS prerequisites_evaluated JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS previous_plan_id VARCHAR(64),
  ADD COLUMN IF NOT EXISTS recommended_reassessment_interval_days INTEGER DEFAULT 7,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Support updated statuses: Draft, Pending teacher approval, Approved, In Progress, Completed, Requires revision, Suggested, Needs Review
ALTER TABLE remedial_plans DROP CONSTRAINT IF EXISTS remedial_plans_status_check;
ALTER TABLE remedial_plans ADD CONSTRAINT remedial_plans_status_check
  CHECK (status IN (
    'Draft',
    'Pending teacher approval',
    'Approved',
    'In Progress',
    'Completed',
    'Requires revision',
    'Suggested',
    'Needs Review'
  ));
