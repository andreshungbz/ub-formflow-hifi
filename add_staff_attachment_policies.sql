-- Add RLS policy to allow staff to upload attachments when approving forms

-- Allow staff to insert attachments (for uploading signed documents)
CREATE POLICY "Staff upload attachments"
ON form_attachments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM staff
    WHERE staff.id = auth.uid()
  )
);

-- Allow staff to view all attachments for forms they're reviewing
CREATE POLICY "Staff view all attachments"
ON form_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff
    WHERE staff.id = auth.uid()
  )
);

-- Also add storage policies for staff to upload to the bucket
-- Note: You'll need to run these in the Supabase dashboard under Storage > Policies

-- Storage policy for staff uploads
-- Go to Supabase Dashboard > Storage > form-attachments > Policies
-- Add this policy:

-- Policy Name: Staff can upload attachments
-- Allowed operation: INSERT
-- Policy definition:
-- (bucket_id = 'form-attachments' AND (EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid())))

-- Storage policy for staff to read
-- Policy Name: Staff can read all attachments  
-- Allowed operation: SELECT
-- Policy definition:
-- (bucket_id = 'form-attachments' AND (EXISTS (SELECT 1 FROM staff WHERE staff.id = auth.uid())))
