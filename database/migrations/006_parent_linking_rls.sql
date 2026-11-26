-- Migration: 006_parent_linking_rls.sql
-- Description: Row-Level Security (RLS) policies and integrity indexes for parent-child linking

CREATE INDEX IF NOT EXISTS idx_parent_linking_codes_student_status
  ON parent_linking_codes(student_id, status);

CREATE INDEX IF NOT EXISTS idx_parent_linking_codes_upper_code
  ON parent_linking_codes(UPPER(TRIM(code)));

ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_linking_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_activity_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS parent_profiles_owner_policy ON parent_profiles;
CREATE POLICY parent_profiles_owner_policy ON parent_profiles
  USING (
    current_setting('app.current_user_role', true) IN ('admin', 'teacher')
    OR user_id = current_setting('app.current_user_id', true)
  )
  WITH CHECK (
    current_setting('app.current_user_role', true) = 'admin'
    OR user_id = current_setting('app.current_user_id', true)
  );

DROP POLICY IF EXISTS parent_students_isolation_policy ON parent_students;
CREATE POLICY parent_students_isolation_policy ON parent_students
  USING (
    current_setting('app.current_user_role', true) IN ('admin', 'teacher')
    OR EXISTS (
      SELECT 1 FROM parent_profiles pp
      WHERE pp.id = parent_students.parent_id
        AND pp.user_id = current_setting('app.current_user_id', true)
    )
  )
  WITH CHECK (
    current_setting('app.current_user_role', true) IN ('admin', 'teacher')
    OR EXISTS (
      SELECT 1 FROM parent_profiles pp
      WHERE pp.id = parent_students.parent_id
        AND pp.user_id = current_setting('app.current_user_id', true)
    )
  );

DROP POLICY IF EXISTS parent_linking_codes_staff_policy ON parent_linking_codes;
CREATE POLICY parent_linking_codes_staff_policy ON parent_linking_codes
  USING (
    current_setting('app.current_user_role', true) IN ('admin', 'teacher')
    OR status = 'active'
  )
  WITH CHECK (
    current_setting('app.current_user_role', true) IN ('admin', 'teacher')
    OR (status = 'used' AND used_by_user_id = current_setting('app.current_user_id', true))
  );

DROP POLICY IF EXISTS parent_messages_isolation_policy ON parent_messages;
CREATE POLICY parent_messages_isolation_policy ON parent_messages
  USING (
    current_setting('app.current_user_role', true) IN ('admin', 'teacher')
    OR EXISTS (
      SELECT 1 FROM parent_profiles pp
      WHERE pp.id = parent_messages.parent_id
        AND pp.user_id = current_setting('app.current_user_id', true)
    )
  );

DROP POLICY IF EXISTS parent_activity_isolation_policy ON parent_activity_completions;
CREATE POLICY parent_activity_isolation_policy ON parent_activity_completions
  USING (
    current_setting('app.current_user_role', true) IN ('admin', 'teacher')
    OR EXISTS (
      SELECT 1 FROM parent_profiles pp
      WHERE pp.id = parent_activity_completions.parent_id
        AND pp.user_id = current_setting('app.current_user_id', true)
    )
  );
