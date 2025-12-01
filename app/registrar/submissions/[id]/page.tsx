'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, Download, CheckCircle, XCircle, AlertCircle, User } from 'lucide-react';

export default function SubmissionDetailsPage() {
  const params = useParams();
  const submissionId = params.id as string;
  const [supabase] = useState(() => createClient());
  
  const [submission, setSubmission] = useState<any>(null);
  const [fileHistory, setFileHistory] = useState<any[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!submissionId) return;

      try {
        // 1. Fetch submission details
        const { data: subData, error: subError } = await supabase
          .from('form_submissions')
          .select(`
            *,
            students (*),
            form_types (*)
          `)
          .eq('id', submissionId)
          .single();

        if (subError) throw subError;
        setSubmission(subData);

        // 2. Fetch ALL attachments (file history) with uploader info
        // Note: uploaded_by is a UUID. We need to join with staff or user_profiles to get names.
        // However, Supabase Auth users are not directly joinable in standard queries unless we have a public view.
        // But we can join with 'staff' table if the uploader is staff.
        // If uploader is student, we might need to check 'students' table (using student_id? no, auth id).
        
        // Let's try to fetch attachments first.
        const { data: attData, error: attError } = await supabase
          .from('form_attachments')
          .select('*')
          .eq('form_submission_id', submissionId)
          .order('uploaded_at', { ascending: false });

        if (attError) throw attError;

        // Now let's fetch uploader details manually for each unique uploader
        const uploaderIds = Array.from(new Set(attData?.map(a => a.uploaded_by).filter(Boolean)));
        
        // Fetch staff profiles
        const { data: staffProfiles } = await supabase
          .from('staff')
          .select('id, first_name, last_name, role')
          .in('id', uploaderIds);

        // Fetch student profiles (if any uploader is a student)
        // We assume students table has 'id' matching auth.uid() or we use student_id?
        // Actually students table usually has 'student_id' as PK, but let's check if it has auth 'id'.
        // Based on previous context, students table has 'id' as UUID.
        const { data: studentProfiles } = await supabase
          .from('students')
          .select('id, first_name, last_name')
          .in('id', uploaderIds);

        const uploaderMap = new Map();
        staffProfiles?.forEach(p => uploaderMap.set(p.id, `${p.first_name} ${p.last_name} (${p.role})`));
        studentProfiles?.forEach(p => uploaderMap.set(p.id, `${p.first_name} ${p.last_name} (Student)`));

        // Generate signed URLs and attach uploader info
        const attachmentsWithDetails = await Promise.all(
          (attData || []).map(async (file) => {
            const { data } = await supabase
              .storage
              .from('form-attachments')
              .createSignedUrl(file.file_path, 3600);
            
            return { 
              ...file, 
              signedUrl: data?.signedUrl,
              uploaderName: uploaderMap.get(file.uploaded_by) || 'Unknown User'
            };
          })
        );
        setFileHistory(attachmentsWithDetails);

        // 3. Fetch Approval History
        const { data: appData, error: appError } = await supabase
          .from('form_approvals')
          .select(`
            *,
            staff (first_name, last_name, role)
          `)
          .eq('form_submission_id', submissionId)
          .order('sequence_order', { ascending: true });

        if (appError) throw appError;
        setApprovalHistory(appData || []);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [submissionId, supabase]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!submission) return <div className="p-8 text-center">Submission not found</div>;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Submission Details: {submission.form_types.name}
        </h1>
        <p className="text-gray-500">
          Submitted by <span className="font-medium text-gray-900">{submission.students.first_name} {submission.students.last_name}</span> ({submission.students.student_id})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: File History */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>File History & Versions</CardTitle>
            </CardHeader>
            <CardContent>
              {fileHistory.length === 0 ? (
                <p className="text-gray-500 italic">No files found.</p>
              ) : (
                <div className="space-y-4">
                  {fileHistory.map((file, index) => (
                    <div key={file.id} className={`p-4 rounded-lg border ${index === 0 && file.is_current_version ? 'border-ub-purple bg-purple-50' : 'border-gray-200 bg-white'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <FileText className={`h-5 w-5 mt-1 ${file.is_current_version ? 'text-ub-purple' : 'text-gray-400'}`} />
                          <div>
                            <p className="font-medium text-gray-900">{file.file_name}</p>
                            
                            <div className="flex flex-col gap-1 mt-1">
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                {new Date(file.uploaded_at).toLocaleString()}
                                <span>•</span>
                                <span>{file.file_size ? (file.file_size / 1024).toFixed(1) + ' KB' : 'Unknown size'}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <User className="h-3 w-3" />
                                <span>Uploaded by: <span className="font-medium">{file.uploaderName}</span></span>
                              </div>
                            </div>

                            {file.is_current_version && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-2">
                                Current Version
                              </span>
                            )}
                          </div>
                        </div>
                        {file.signedUrl && (
                          <Button asChild size="sm" variant="outline">
                            <a href={file.signedUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-1" /> Download
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Status & Approval History */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {submission.status === 'approved' ? <CheckCircle className="h-5 w-5 text-green-500" /> :
                     submission.status === 'rejected' ? <XCircle className="h-5 w-5 text-red-500" /> :
                     <AlertCircle className="h-5 w-5 text-yellow-500" />}
                    <span className="font-medium capitalize text-lg">{submission.status}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submitted At</p>
                  <p className="font-medium">{new Date(submission.submitted_at).toLocaleString()}</p>
                </div>
                {submission.completed_at && (
                  <div>
                    <p className="text-sm text-gray-500">Completed At</p>
                    <p className="font-medium">{new Date(submission.completed_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 pl-6 py-2">
                {approvalHistory.map((step, index) => (
                  <div key={step.id} className="relative">
                    <span className={`absolute -left-[31px] top-1 h-6 w-6 rounded-full border-2 flex items-center justify-center bg-white
                      ${step.status === 'approved' ? 'border-green-500 text-green-500' : 
                        step.status === 'rejected' ? 'border-red-500 text-red-500' : 
                        'border-gray-300 text-gray-300'}`}>
                      {step.status === 'approved' ? <CheckCircle className="h-3 w-3" /> :
                       step.status === 'rejected' ? <XCircle className="h-3 w-3" /> :
                       <div className="h-2 w-2 rounded-full bg-gray-300" />}
                    </span>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">{step.approval_type} Approval</p>
                      <p className="text-xs text-gray-500 capitalize">Status: {step.status}</p>
                      
                      {step.staff && (
                        <p className="text-xs text-gray-600 mt-1">
                          By: {step.staff.first_name} {step.staff.last_name}
                        </p>
                      )}
                      
                      {step.approved_at && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(step.approved_at).toLocaleString()}
                        </p>
                      )}

                      {step.comments && (
                        <div className="mt-2 text-xs bg-gray-50 p-2 rounded text-gray-700 italic">
                          "{step.comments}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
