'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Upload,
  X,
  File,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface FileWithPreview extends File {
  preview?: string;
  id: string;
}

interface FormType {
  id: string;
  name: string;
  description: string;
  requires_lecturer_approval: boolean;
  requires_dean_approval: boolean;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
}

// Allowed file types
const allowedFileTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'text/plain',
  'text/csv',
];

const allowedExtensions = [
  'pdf',
  'doc',
  'docx',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'txt',
  'csv',
];

// Validate file type
const isValidFileType = (file: File): boolean => {
  // Check MIME type
  if (file.type && allowedFileTypes.includes(file.type.toLowerCase())) {
    return true;
  }

  // Check file extension as fallback
  const fileName = file.name || '';
  const parts = fileName.split('.');
  if (parts.length > 1) {
    const ext = parts[parts.length - 1].toLowerCase();
    return allowedExtensions.includes(ext);
  }

  // If no type info, allow it (user can remove if needed)
  return true;
};

export default function SubmitFormPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const formTypeId = params.formId as string;

  const [formType, setFormType] = useState<FormType | null>(null);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingFormType, setLoadingFormType] = useState(true);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // Fetch form type information
  useEffect(() => {
    async function fetchFormType() {
      if (!formTypeId) return;

      setLoadingFormType(true);
      const { data, error } = await supabase
        .from('form_types')
        .select(
          'id, name, description, requires_lecturer_approval, requires_dean_approval'
        )
        .eq('id', formTypeId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setError('Form type not found or is inactive.');
        setLoadingFormType(false);
        return;
      }

      setFormType(data);
      setLoadingFormType(false);
    }

    fetchFormType();
  }, [formTypeId, supabase]);

  // Fetch staff based on requirements
  useEffect(() => {
    async function fetchStaff() {
      if (!formType) return;

      // Determine which role to fetch
      // If requires lecturer -> fetch lecturers/teachers
      // If requires dean (and not lecturer, or if we want to support both but user said only teacher if both) -> fetch deans
      // User rule: "if it requires requires teacher or dean. If its need both only do the teacher."

      let roleFilter = '';
      if (formType.requires_lecturer_approval) {
        roleFilter = 'lecturer'; // We'll search for this
      } else if (formType.requires_dean_approval) {
        roleFilter = 'dean';
      } else {
        return; // No staff selection needed
      }

      setLoadingStaff(true);

      // We'll use ilike for flexible matching (e.g. "Senior Lecturer", "Dean of Science")
      // Also including "Teacher" if looking for lecturer, just in case
      let query = supabase
        .from('staff')
        .select('id, first_name, last_name, role, department')
        .eq('is_active', true);

      if (roleFilter === 'lecturer') {
        // Match lecturer OR teacher
        query = query.or('role.ilike.%lecturer%,role.ilike.%teacher%');
      } else {
        query = query.ilike('role', `%${roleFilter}%`);
      }

      const { data, error } = await query
        .order('department', { ascending: true })
        .order('last_name', { ascending: true });

      if (error) {
        console.error('Error fetching staff:', error);
      } else {
        setStaffList(data || []);
      }
      setLoadingStaff(false);
    }

    fetchStaff();
  }, [formType, supabase]);

  // Get unique departments from staff list
  const departments = Array.from(
    new Set(staffList.map((s) => s.department || 'Other'))
  ).sort();

  // Filter staff by selected department
  const filteredStaff =
    selectedDepartment && selectedDepartment !== 'ALL'
      ? staffList.filter(
          (s) => (s.department || 'Other') === selectedDepartment
        )
      : staffList;

  // Redirect if not authenticated
  useEffect(() => {
    if (!loadingFormType && !user) {
      router.push('/login');
    }
  }, [user, loadingFormType, router]);

  // Generate unique ID for files
  const generateFileId = () => Math.random().toString(36).substring(2, 9);

  // Add files to state
  const addFiles = useCallback((newFiles: File[]) => {
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    newFiles.forEach((file) => {
      if (isValidFileType(file)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name || 'Unknown file');
      }
    });

    if (invalidFiles.length > 0) {
      setError(
        `The following files are not supported: ${invalidFiles.join(', ')}. ` +
          `Please upload PDF, DOC, DOCX, PNG, JPG, GIF, TXT, or CSV files.`
      );
      setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
    }

    const filesWithPreview: FileWithPreview[] = validFiles.map((file) => {
      // Preserve the File instance while adding metadata
      const fileWithMeta = Object.assign(file, {
        id: generateFileId(),
        preview: file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined,
      }) as FileWithPreview;
      return fileWithMeta;
    });

    setFiles((prev) => [...prev, ...filesWithPreview]);
  }, []);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      addFiles(droppedFiles);
    },
    [addFiles]
  );

  // Handle file input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  // Remove file
  const removeFile = (id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  // Format file size
  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes || isNaN(bytes) || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = Math.round((bytes / Math.pow(k, i)) * 100) / 100;
    return size + ' ' + sizes[i];
  };

  // Get file extension safely
  const getFileExtension = (
    fileName: string | undefined,
    fileType: string | undefined
  ): string => {
    // Try to get extension from filename first
    if (fileName) {
      const parts = fileName.split('.');
      if (parts.length > 1) {
        const ext = parts[parts.length - 1].toLowerCase();
        if (ext && ext.length <= 10) {
          // Valid extension
          return ext;
        }
      }
    }

    // Fallback to MIME type
    if (fileType) {
      const mimeToExt: Record<string, string> = {
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          'docx',
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/gif': 'gif',
        'text/plain': 'txt',
      };

      if (mimeToExt[fileType]) {
        return mimeToExt[fileType];
      }

      // Extract from MIME type if possible
      const mimeParts = fileType.split('/');
      if (mimeParts.length > 1) {
        return mimeParts[1].split(';')[0];
      }
    }

    // Default fallback
    return 'bin';
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formTypeId || !formType) {
      setError(
        'Missing required information. Please ensure you are logged in.'
      );
      return;
    }

    // Validate staff selection if required
    if (
      (formType.requires_lecturer_approval ||
        formType.requires_dean_approval) &&
      !selectedStaffId
    ) {
      // Logic check: if requires both, we show lecturer select (so we need selectedStaffId).
      // If requires only dean, we show dean select (so we need selectedStaffId).
      // If requires neither, we don't need it.
      // Wait, if requires_lecturer_approval is false but requires_dean_approval is true, we need it.
      // If requires_lecturer_approval is true, we need it.
      // So basically if either is true, we need selectedStaffId (because we always show one dropdown if either is true).
      // EXCEPT if there's a case where we don't show dropdown?
      // My logic above: `if (formType.requires_lecturer_approval || (formType.requires_dean_approval && !formType.requires_lecturer_approval))`
      // This covers all cases where at least one is true.

      // Double check the "both" case. User: "If its need both only do the teacher."
      // So if both are true, we show teacher select. We need selectedStaffId.

      setError(
        `Please select a ${
          formType.requires_lecturer_approval ? 'lecturer' : 'dean'
        }.`
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create form submission record
      const { data: submission, error: submissionError } = await supabase
        .from('form_submissions')
        .insert({
          student_id: user.id,
          form_type_id: formTypeId,
          form_data: formData,
          status: 'submitted',
        })
        .select()
        .single();

      if (submissionError || !submission) {
        throw new Error(
          submissionError?.message || 'Failed to create form submission'
        );
      }

      setSubmissionId(submission.id);

      // 2. Assign staff if selected
      if (selectedStaffId && formType) {
        const approvalType = formType.requires_lecturer_approval
          ? 'lecturer'
          : 'dean';

        // Update the automatically created approval record
        const { error: updateError } = await supabase
          .from('form_approvals')
          .update({ staff_id: selectedStaffId })
          .eq('form_submission_id', submission.id)
          .eq('approval_type', approvalType);

        if (updateError) {
          console.error('Failed to assign staff:', updateError);
          // We don't stop the process, but we log it.
          // Ideally we might want to alert the user, but the form is submitted.
        }
      }

      // 3. Upload files and create attachment records
      if (files.length > 0) {
        const uploadResults = await Promise.allSettled(
          files.map(async (file) => {
            // Validate file object - ensure it's a valid file
            if (!file || typeof file !== 'object') {
              throw new Error('Invalid file object');
            }

            // Check if it has file-like properties (safer than instanceof)
            const isFileLike =
              typeof file.size === 'number' &&
              typeof file.name === 'string' &&
              typeof file.type === 'string';

            if (!isFileLike) {
              throw new Error(
                'File must have valid file properties (size, name, type)'
              );
            }

            const fileName = file.name || 'unnamed-file';
            const fileType = file.type || '';
            const fileSize =
              typeof file.size === 'number' && !isNaN(file.size)
                ? file.size
                : 0;

            // Validate file size
            if (!fileSize || fileSize <= 0) {
              throw new Error(`File "${fileName}" has invalid size`);
            }

            // Validate file size (10MB limit)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (fileSize > maxSize) {
              throw new Error(`File "${fileName}" exceeds 10MB limit`);
            }

            // Get file extension safely
            const fileExt = getFileExtension(fileName, fileType);

            // Upload file to Supabase Storage
            const uniqueId = generateFileId();
            const storageFileName = `${submission.id}/${uniqueId}.${fileExt}`;
            const filePath = storageFileName;

            console.log('Uploading file:', {
              fileName,
              fileType,
              fileSize,
              fileExt,
              filePath,
            });

            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from('form-attachments')
                .upload(filePath, file, {
                  cacheControl: '3600',
                  upsert: false,
                });

            if (uploadError) {
              console.error('Upload error:', uploadError);
              if (
                uploadError.message.includes('Bucket not found') ||
                uploadError.message.includes('does not exist')
              ) {
                throw new Error(
                  'Storage bucket not configured. Please contact administrator or check STORAGE_SETUP.md'
                );
              }
              throw new Error(
                `Failed to upload "${fileName}": ${uploadError.message}`
              );
            }

            console.log('File uploaded successfully:', uploadData);

            // Create attachment record
            const attachmentData = {
              form_submission_id: submission.id,
              file_name: fileName,
              file_path: filePath,
              file_size: fileSize,
              file_type: fileType || 'application/octet-stream',
              uploaded_by: user.id,
            };

            console.log('Creating attachment record:', attachmentData);

            const { data: attachmentData_result, error: attachmentError } =
              await supabase
                .from('form_attachments')
                .insert(attachmentData)
                .select()
                .single();

            if (attachmentError) {
              console.error('Attachment creation error:', attachmentError);
              // Don't delete the uploaded file - it might still be useful
              // Just log the error and continue, or throw if critical
              throw new Error(
                `Failed to save attachment record for "${fileName}": ${attachmentError.message}`
              );
            }

            console.log('Attachment record created:', attachmentData_result);
          })
        );

        // Check for failed uploads
        const failedUploads = uploadResults.filter(
          (r) => r.status === 'rejected'
        );
        if (failedUploads.length > 0) {
          const errorMessages = failedUploads.map((r) => {
            if (r.status === 'rejected') {
              return r.reason instanceof Error
                ? r.reason.message
                : String(r.reason);
            }
            return 'Unknown error';
          });
          throw new Error(
            `Some files failed to upload:\n${errorMessages.join('\n')}`
          );
        }
      }

      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/history/${submission.id}`);
      }, 2000);
    } catch (err: unknown) {
      console.error('Submission error:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to submit form. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup file previews
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  if (loadingFormType) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-ub-purple" />
      </div>
    );
  }

  if (!formType) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Form Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The form you&apos;re looking for doesn&apos;t exist or is no longer
          available.
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">
          Form Submitted Successfully!
        </h1>
        <p className="text-muted-foreground mb-4">
          Your form has been submitted and is being processed.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Redirecting to your submission...
        </p>
        <Button asChild>
          <Link href={submissionId ? `/history/${submissionId}` : '/history'}>
            View Submission
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{formType.name}</CardTitle>
          <CardDescription>{formType.description}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Form Fields */}
            <div className="space-y-4">
              {/* Staff Selection */}
              {(formType.requires_lecturer_approval ||
                (formType.requires_dean_approval &&
                  !formType.requires_lecturer_approval)) && (
                <div className="space-y-4">
                  {/* Department Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="department-select">
                      Filter by Department
                    </Label>
                    <Select
                      value={selectedDepartment}
                      onValueChange={(value) => {
                        setSelectedDepartment(value);
                        setSelectedStaffId(''); // Reset staff selection when department changes
                      }}
                      disabled={loadingStaff}
                    >
                      <SelectTrigger id="department-select">
                        <SelectValue
                          placeholder={
                            loadingStaff
                              ? 'Loading departments...'
                              : 'All Departments'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Departments</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Staff Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="staff-select">
                      Select{' '}
                      {formType.requires_lecturer_approval
                        ? 'Lecturer/Teacher'
                        : 'Dean'}{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedStaffId}
                      onValueChange={setSelectedStaffId}
                      disabled={loadingStaff}
                    >
                      <SelectTrigger id="staff-select">
                        <SelectValue
                          placeholder={
                            loadingStaff
                              ? 'Loading staff...'
                              : `Select a ${
                                  formType.requires_lecturer_approval
                                    ? 'lecturer'
                                    : 'dean'
                                }`
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredStaff.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.first_name} {staff.last_name}{' '}
                            {staff.department ? `(${staff.department})` : ''}
                          </SelectItem>
                        ))}
                        {filteredStaff.length === 0 && !loadingStaff && (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            {selectedDepartment && selectedDepartment !== 'ALL'
                              ? `No staff found in ${selectedDepartment}`
                              : 'No staff found'}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="notes" className="mb-1">
                  Additional Notes (Optional)
                </Label>
                <textarea
                  id="notes"
                  rows={4}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Add any additional information or notes..."
                  value={formData.notes || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* File Upload Area */}
            <div className="space-y-2">
              <Label>Attachments (Optional)</Label>
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-ub-purple bg-ub-purple/5'
                    : 'border-gray-300 hover:border-ub-purple/50'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.txt,.csv"
                  onChange={handleFileInput}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-12 h-12 text-ub-purple" />
                  <div>
                    <span className="text-ub-purple font-medium">
                      Click to upload
                    </span>{' '}
                    or drag and drop
                  </div>
                  <p className="text-sm text-muted-foreground">
                    PDF, DOC, DOCX, PNG, JPG, GIF, TXT, CSV (Max 10MB per file)
                  </p>
                </label>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-2 mt-4">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                    >
                      <File className="w-5 h-5 text-ub-purple flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.name || 'Unnamed file'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size || 0)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(file.id)}
                        className="flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between mt-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-ub-purple hover:bg-ub-purple/80 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Form'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
