-- ============================================================================
-- UB FormFlow - Supabase Auth Unified Schema (PRODUCTION READY)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USER PROFILES (Links directly to auth.users)
-- ============================================================================
CREATE TABLE public.department (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  CONSTRAINT department_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(30) NOT NULL CHECK (role IN ('student', 'staff', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STUDENTS (Auth-linked)
-- ============================================================================

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id VARCHAR(10) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  program_code VARCHAR(50),
  program_name VARCHAR(200),
  enrollment_status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STAFF (Auth-linked)
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FORM TYPES
-- ============================================================================

CREATE TABLE IF NOT EXISTS form_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  receipt_template_path TEXT, -- Path to the receipt template file in storage
  template_file TEXT,
  category INT,
  deadline TIMESTAMPTZ,
  requires_lecturer_approval BOOLEAN DEFAULT FALSE,
  requires_dean_approval BOOLEAN DEFAULT FALSE,
  requires_registrar_approval BOOLEAN DEFAULT FALSE,
  requires_accounts_receivable_approval BOOLEAN DEFAULT FALSE,
  approval_workflow JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FORM SUBMISSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  form_type_id UUID NOT NULL REFERENCES form_types(id),
  submission_number VARCHAR(50) UNIQUE,
  status VARCHAR(50) DEFAULT 'submitted',
  form_data JSONB NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FORM APPROVALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS form_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_submission_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id),
  approval_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  comments TEXT,
  rejection_reason TEXT,
  sequence_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(form_submission_id, approval_type)
);

-- ============================================================================
-- STATUS HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS form_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_submission_id UUID REFERENCES form_submissions(id) ON DELETE CASCADE,
  status VARCHAR(50),
  changed_by UUID REFERENCES auth.users(id),
  changed_by_role VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ATTACHMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS form_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_submission_id UUID REFERENCES form_submissions(id) ON DELETE CASCADE,
  file_name TEXT,
  file_path TEXT,
  file_size BIGINT,
  file_type TEXT,
  is_current_version BOOLEAN DEFAULT TRUE, -- Flag to indicate the latest version of the document
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER t_students_updated BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER t_staff_updated BEFORE UPDATE ON staff
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER t_form_types_updated BEFORE UPDATE ON form_types
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER t_submissions_updated BEFORE UPDATE ON form_submissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER t_approvals_updated BEFORE UPDATE ON form_approvals
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- SUBMISSION NUMBER GENERATION
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_submission_number()
RETURNS TRIGGER AS $$
DECLARE
  code TEXT;
  yr TEXT;
  seq INT;
BEGIN
  SELECT UPPER(LEFT(name,3)) INTO code FROM form_types WHERE id = NEW.form_type_id;
  yr := TO_CHAR(NOW(), 'YYYY');

  SELECT COUNT(*) + 1 INTO seq FROM form_submissions
  WHERE submission_number LIKE code || '-' || yr || '-%';

  NEW.submission_number := code || '-' || yr || '-' || LPAD(seq::TEXT, 5, '0');
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER t_generate_reference
BEFORE INSERT ON form_submissions
FOR EACH ROW
EXECUTE FUNCTION generate_submission_number();

-- ============================================================================
-- APPROVAL AUTO CREATION
-- ============================================================================

CREATE OR REPLACE FUNCTION create_approval_records()
RETURNS TRIGGER AS $$
DECLARE r RECORD; n INT := 1;
BEGIN
  SELECT * INTO r FROM form_types WHERE id = NEW.form_type_id;

  IF r.requires_lecturer_approval THEN
    INSERT INTO form_approvals(form_submission_id, approval_type, sequence_order)
    VALUES (NEW.id, 'lecturer', n); n := n + 1;
  END IF;

  IF r.requires_dean_approval THEN
    INSERT INTO form_approvals(form_submission_id, approval_type, sequence_order)
    VALUES (NEW.id, 'dean', n); n := n + 1;
  END IF;

  IF r.requires_registrar_approval THEN
    INSERT INTO form_approvals(form_submission_id, approval_type, sequence_order)
    VALUES (NEW.id, 'registrar', n); n := n + 1;
  END IF;

  IF r.requires_accounts_receivable_approval THEN
    INSERT INTO form_approvals(form_submission_id, approval_type, sequence_order)
    VALUES (NEW.id, 'accounts_receivable', n);
  END IF;

  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER t_create_approvals
AFTER INSERT ON form_submissions
FOR EACH ROW EXECUTE FUNCTION create_approval_records();

-- ============================================================================
-- ROW LEVEL SECURITY (FIXED FOR SUPABASE AUTH)
-- ============================================================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_status_history ENABLE ROW LEVEL SECURITY;

-- Students see themselves
CREATE POLICY "Students read own profile"
ON students FOR SELECT USING (id = auth.uid());

CREATE POLICY "Students update self"
ON students FOR UPDATE USING (id = auth.uid());

-- Staff see self
CREATE POLICY "Staff read self"
ON staff FOR SELECT USING (id = auth.uid());

-- Student submissions
CREATE POLICY "Students view own submissions"
ON form_submissions FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Students insert own submissions"
ON form_submissions FOR INSERT
WITH CHECK (student_id = auth.uid());

-- Staff approvals
CREATE POLICY "Staff update assigned approvals"
ON form_approvals FOR UPDATE
USING (staff_id = auth.uid());

-- Attachments
CREATE POLICY "Students upload attachments"
ON form_attachments FOR INSERT
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Students view own attachments"
ON form_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM form_submissions
    WHERE id = form_attachments.form_submission_id
    AND student_id = auth.uid()
  )
);

-- ============================================================================
-- SAMPLE FORM TYPES (SAFE)
-- ============================================================================

INSERT INTO form_types (name, description, requires_lecturer_approval, requires_dean_approval, requires_registrar_approval, requires_accounts_receivable_approval)
VALUES
('Course Withdrawal', 'Withdraw from class', true, false, true, false),
('Program Change', 'Change of program', false, true, true, false),
('Tuition Payment Plan', 'Payment request', false, false, false, true),
('Grade Appeal', 'Appeal grade', true, true, false, false),
('Transcript Request', 'Request transcript', false, false, true, false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES (TEMPLATES)
-- ============================================================================

-- Allow public read access to template files (must be in 'templates/' folder)
CREATE POLICY "Public can view templates"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'form-attachments' AND (storage.foldername(name))[1] = 'templates' );

