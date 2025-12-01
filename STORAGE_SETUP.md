# Storage Setup Guide

To enable file uploads in the form submission system, you need to create a Supabase Storage bucket.

## Steps to Create Storage Bucket

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click on "Storage" in the left sidebar

2. **Create a New Bucket**
   - Click "New bucket"
   - Name: `form-attachments`
   - Make it **public**: No (private)
   - Click "Create bucket"

3. **Set Up Storage Policies**

You need to create policies that allow authenticated users to upload files. Run this SQL in your Supabase SQL editor:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload form attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'form-attachments' AND
  (storage.foldername(name))[1]::text IN (
    SELECT id::text FROM form_submissions WHERE student_id = auth.uid()
  )
);

-- Allow users to read their own uploaded files
CREATE POLICY "Users can view own form attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'form-attachments' AND
  (storage.foldername(name))[1]::text IN (
    SELECT id::text FROM form_submissions WHERE student_id = auth.uid()
  )
);

-- Allow users to delete their own files (if needed)
CREATE POLICY "Users can delete own form attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'form-attachments' AND
  (storage.foldername(name))[1]::text IN (
    SELECT id::text FROM form_submissions WHERE student_id = auth.uid()
  )
);
```

4. **Optional: Set File Size Limits**

In Supabase Dashboard → Storage → Settings, you can configure:
- Maximum file size (recommended: 10MB per file)
- Allowed file types (optional)

## Usage

Once set up, the form submission page at `/forms/submit/[formId]` will automatically:
- Upload files to the `form-attachments` bucket
- Store file metadata in the `form_attachments` table
- Link files to form submissions

## File Path Structure

Files are stored with this structure:
```
form-attachments/
  └── {submission_id}/
      └── {random_id}.{extension}
```

This ensures:
- Files are organized by submission
- No filename conflicts
- Easy cleanup if a submission is deleted

