-- ============================================================================
-- Migration 004: Pre-Test vs Post-Test Learning Improvement Tracking
-- ShikshaSetu AI - SFIC 2026 (PS-60)
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_improvements (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    concept_id VARCHAR(64) NOT NULL REFERENCES concepts(id) ON DELETE RESTRICT,
    subject_code VARCHAR(16) NOT NULL,
    classroomId VARCHAR(64) REFERENCES classrooms(id) ON DELETE SET NULL,
    
    -- Pre-Test (Baseline)
    pre_test_assessment_id VARCHAR(64) REFERENCES assessments(id) ON DELETE SET NULL,
    pre_test_result_id VARCHAR(64) REFERENCES assessment_results(id) ON DELETE SET NULL,
    pre_test_score NUMERIC(5,2) NOT NULL,
    pre_test_max_marks NUMERIC(5,2) NOT NULL,
    pre_test_percentage NUMERIC(5,2) NOT NULL,
    pre_test_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Linked Remedial Intervention
    remedial_plan_id VARCHAR(64) REFERENCES remedial_plans(id) ON DELETE SET NULL,
    intervention_start_date TIMESTAMP WITH TIME ZONE,
    intervention_completion_date TIMESTAMP WITH TIME ZONE,
    assigned_activities_count INTEGER DEFAULT 0,
    completed_activities_count INTEGER DEFAULT 0,
    
    -- Post-Test (Follow-up)
    post_test_assessment_id VARCHAR(64) REFERENCES assessments(id) ON DELETE SET NULL,
    post_test_result_id VARCHAR(64) REFERENCES assessment_results(id) ON DELETE SET NULL,
    post_test_score NUMERIC(5,2),
    post_test_max_marks NUMERIC(5,2),
    post_test_percentage NUMERIC(5,2),
    post_test_date TIMESTAMP WITH TIME ZONE,
    
    -- Calculated Metrics
    delta_percentage_points NUMERIC(5,2),
    relative_improvement_percentage NUMERIC(6,2),
    status VARCHAR(32) NOT NULL CHECK (status IN (
        'Improvement observed',
        'No measurable change',
        'Performance declined',
        'Insufficient evidence',
        'Awaiting post-test'
    )),
    comparability_status VARCHAR(32) NOT NULL DEFAULT 'comparable' CHECK (comparability_status IN (
        'comparable',
        'limited_comparability',
        'not_comparable'
    )),
    comparability_notes TEXT,
    causal_attribution_disclaimer TEXT,
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_student_concept_pretest UNIQUE (student_id, concept_id, pre_test_assessment_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_improvements_student ON learning_improvements(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_improvements_concept ON learning_improvements(concept_id);
CREATE INDEX IF NOT EXISTS idx_learning_improvements_status ON learning_improvements(status);
