-- ============================================================================
-- FIX REGISTRAR MANAGEMENT POLICIES
-- Run this to allow Registrars to create Staff and Forms
-- ============================================================================

-- 1. Allow Registrars to INSERT into staff table
DROP POLICY IF EXISTS "Registrars manage staff" ON staff;
CREATE POLICY "Registrars manage staff"
ON staff FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM staff s 
    WHERE s.id = auth.uid() 
    AND s.role = 'registrar'
  )
);

-- 2. Allow Registrars to INSERT/UPDATE form_types
DROP POLICY IF EXISTS "Registrars manage form types" ON form_types;
CREATE POLICY "Registrars manage form types"
ON form_types FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM staff s 
    WHERE s.id = auth.uid() 
    AND s.role = 'registrar'
  )
);

-- 3. Allow Registrars to VIEW ALL submissions (for the submissions tab)
-- The existing policy might be too restrictive (only assigned approvals).
-- We need a policy that lets Registrars see ALL submissions.
DROP POLICY IF EXISTS "Registrars view all submissions" ON form_submissions;
CREATE POLICY "Registrars view all submissions"
ON form_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff s 
    WHERE s.id = auth.uid() 
    AND s.role = 'registrar'
  )
);

-- 4. Allow Registrars to VIEW ALL attachments (for history)
DROP POLICY IF EXISTS "Registrars view all attachments" ON form_attachments;
CREATE POLICY "Registrars view all attachments"
ON form_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff s 
    WHERE s.id = auth.uid() 
    AND s.role = 'registrar'
  )
);
