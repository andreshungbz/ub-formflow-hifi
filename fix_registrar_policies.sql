-- ============================================================================
-- FIX REGISTRAR/STAFF POLICIES
-- Run this in the Supabase SQL Editor to fix the "new row violates..." error
-- and allow Registrars to claim and approve requests.
-- ============================================================================

-- 1. Allow Staff (Registrar, Dean, Teacher) to upload attachments
-- This fixes the "new row violates row-level security policy" error when uploading signed docs.
DROP POLICY IF EXISTS "Staff insert attachments" ON form_attachments;
CREATE POLICY "Staff insert attachments"
ON form_attachments FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM staff WHERE id = auth.uid())
);

-- 2. Allow Staff to view all attachments
-- Necessary to see the student's uploaded files.
DROP POLICY IF EXISTS "Staff view all attachments" ON form_attachments;
CREATE POLICY "Staff view all attachments"
ON form_attachments FOR SELECT
USING (
  EXISTS (SELECT 1 FROM staff WHERE id = auth.uid())
);

-- 3. Allow Staff to update UNASSIGNED approvals
-- This fixes the issue where a Registrar cannot approve a request because it's not yet assigned to them.
-- This policy allows them to "claim" the request by updating it.
DROP POLICY IF EXISTS "Staff update unassigned approvals" ON form_approvals;
CREATE POLICY "Staff update unassigned approvals"
ON form_approvals FOR UPDATE
USING (
  (staff_id IS NULL OR staff_id = auth.uid())
  AND EXISTS (SELECT 1 FROM staff WHERE id = auth.uid())
);

-- Note: The existing "Staff update assigned approvals" policy might conflict or be redundant.
-- It's safer to keep it or rely on the one above which covers both cases (NULL or self).
-- If you want to be clean, you can drop the old one, but adding a new permissive one is usually fine (policies are OR'd).


-- ============================================================================
-- STORAGE POLICIES (IMPORTANT)
-- You must also run these in the Supabase Dashboard > Storage > Policies
-- if you haven't already. SQL cannot always create storage policies directly
-- depending on your setup, but try running this:
-- ============================================================================

-- Allow Staff to upload to 'form-attachments' bucket
BEGIN;
  INSERT INTO storage.buckets (id, name) VALUES ('form-attachments', 'form-attachments') ON CONFLICT DO NOTHING;
  
  -- Policy for INSERT
  CREATE POLICY "Staff Upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'form-attachments' 
    AND EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid())
  );

  -- Policy for SELECT
  CREATE POLICY "Staff Read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'form-attachments' 
    AND EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid())
  );
COMMIT;
