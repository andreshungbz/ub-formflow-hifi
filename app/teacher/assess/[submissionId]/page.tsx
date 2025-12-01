'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check, X, Upload } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AssessmentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const submissionId = params.submissionId as string;
  const approvalId = searchParams.get('approvalId');
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [submission, setSubmission] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  // New state for Dean selection
  const [nextApproval, setNextApproval] = useState<any>(null);
  const [deans, setDeans] = useState<any[]>([]);
  const [selectedDeanId, setSelectedDeanId] = useState<string>('');
  const [loadingDeans, setLoadingDeans] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!submissionId) return;

      try {
        // Fetch submission details
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

        // Fetch attachments
        const { data: attData, error: attError } = await supabase
          .from('form_attachments')
          .select('*')
          .eq('form_submission_id', submissionId)
          .eq('is_current_version', true);

        if (attError) throw attError;

        // Generate signed URLs
        const attachmentsWithUrls = await Promise.all(
          (attData || []).map(async (file) => {
            const { data } = await supabase
              .storage
              .from('form-attachments')
              .createSignedUrl(file.file_path, 3600);
            return { ...file, signedUrl: data?.signedUrl };
          })
        );
        setAttachments(attachmentsWithUrls);

        // Fetch current approval to find the next one
        if (approvalId) {
          const { data: currentApproval, error: currentApprovalError } = await supabase
            .from('form_approvals')
            .select('*')
            .eq('id', approvalId)
            .single();

          if (currentApprovalError) throw currentApprovalError;

          // Find next approval
          const { data: nextApp, error: nextAppError } = await supabase
            .from('form_approvals')
            .select('*')
            .eq('form_submission_id', submissionId)
            .eq('sequence_order', currentApproval.sequence_order + 1)
            .single();

          // It's okay if there is no next approval (end of chain)
          if (nextApp) {
            setNextApproval(nextApp);
            
            // If next is dean, fetch deans
            if (nextApp.approval_type === 'dean') {
              setLoadingDeans(true);
              const { data: deansData, error: deansError } = await supabase
                .from('staff')
                .select('id, first_name, last_name, department')
                .ilike('role', '%dean%')
                .eq('is_active', true);
                
              if (deansError) {
                console.error('Error fetching deans:', deansError);
              } else {
                setDeans(deansData || []);
              }
              setLoadingDeans(false);
            }
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [submissionId, supabase, approvalId]);

  const handleApprove = async () => {
    if (!approvalId) return;
    
    // Validate dean selection if required
    if (nextApproval?.approval_type === 'dean' && !selectedDeanId) {
      alert('Please select a Dean for the next approval step.');
      return;
    }

    setProcessing(true);

    try {
      // 1. Upload signed file if present
      if (signedFile) {
        const fileExt = signedFile.name.split('.').pop();
        const fileName = `${submissionId}/signed-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('form-attachments')
          .upload(fileName, signedFile);

        if (uploadError) throw uploadError;
          const { error: versionError } = await supabase
          .from('form_attachments')
          .update({ is_current_version: false })
          .eq('form_submission_id', submissionId)
          .eq('is_current_version', true);

        if (versionError) throw versionError;


        // Mark old files as not current (optional, depending on logic, usually we just add new one)
        // Actually, let's just add the new one as current.
        // If we want to replace a specific file, it's harder. 
        // Let's assume we are adding a "Signed" version.
        
        await supabase.from('form_attachments').insert({
          form_submission_id: submissionId,
          file_name: `SIGNED - ${signedFile.name}`,
          file_path: fileName,
          file_size: signedFile.size,
          file_type: signedFile.type,
          is_current_version: true,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id
        });
      }

      // 2. Update approval record
      const { error: approvalError } = await supabase
        .from('form_approvals')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          comments: comments
        })
        .eq('id', approvalId);

      if (approvalError) throw approvalError;

      // 3. Assign next approver if needed
      if (nextApproval?.approval_type === 'dean' && selectedDeanId) {
        const { error: assignError } = await supabase
          .from('form_approvals')
          .update({ staff_id: selectedDeanId })
          .eq('id', nextApproval.id);

        if (assignError) throw assignError;
      }

      // 4. Check if all approvals are done (optional, or handle via trigger/backend logic)
      // For now, we just approve this step.

      router.push('/teacher');
    } catch (error) {
      console.error('Error approving:', error);
      alert('Failed to approve. See console.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!approvalId || !rejectionReason) {
      alert('Please provide a rejection reason.');
      return;
    }
    setProcessing(true);

    try {
      // 1. Update approval record
      await supabase
        .from('form_approvals')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectionReason
        })
        .eq('id', approvalId);

      // 2. Update submission status to rejected
      await supabase
        .from('form_submissions')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          completed_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      router.push('/teacher');
    } catch (error) {
      console.error('Error rejecting:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!submission) return <div className="p-8 text-center">Submission not found</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            Assess Application: {submission.form_types.name}
          </h1>
          <span className="text-sm text-gray-500">#{submission.submission_number}</span>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Student Information</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="font-semibold text-lg">{submission.students.first_name} {submission.students.last_name}</p>
              <p className="text-gray-600">ID: {submission.students.student_id}</p>
              <p className="text-gray-600">{submission.students.program_name}</p>
              <p className="text-gray-600">{submission.students.phone}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Submission Details</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600 mb-1">Submitted on:</p>
              <p className="font-medium mb-3">{new Date(submission.submitted_at).toLocaleString()}</p>
              
              <p className="text-sm text-gray-600 mb-1">Status:</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 capitalize">
                {submission.status}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Attachments</h3>
          {attachments.length === 0 ? (
            <p className="text-gray-500 italic">No attachments.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {attachments.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white">
                  <span className="text-sm truncate mr-2" title={file.file_name}>{file.file_name}</span>
                  {file.signedUrl ? (
                    <a href={file.signedUrl} target="_blank" rel="noopener noreferrer" className="text-ub-purple hover:underline text-sm font-medium">
                      View
                    </a>
                  ) : (
                    <span className="text-red-500 text-xs">Unavailable</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Take Action</h2>
        
        {!action ? (
          <div className="flex gap-4">
            <Button 
              onClick={() => setAction('approve')}
              className="bg-green-600 hover:bg-green-700 text-white flex-1 py-6 text-lg"
            >
              <Check className="mr-2 h-5 w-5" /> Approve Application
            </Button>
            <Button 
              onClick={() => setAction('reject')}
              variant="destructive"
              className="flex-1 py-6 text-lg"
            >
              <X className="mr-2 h-5 w-5" /> Reject Application
            </Button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-semibold">
                {action === 'approve' ? 'Approve Application' : 'Reject Application'}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setAction(null)}>Cancel</Button>
            </div>

            {action === 'approve' ? (
              <div className="space-y-4">
                {/* Dean Selection (Conditional) */}
                {nextApproval?.approval_type === 'dean' && (
                  <div className="bg-purple-50 p-4 rounded-md border border-purple-100">
                    <Label htmlFor="dean-select" className="block mb-2 font-medium text-purple-900">
                      Select Dean for Next Approval <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedDeanId}
                      onValueChange={setSelectedDeanId}
                      disabled={loadingDeans}
                    >
                      <SelectTrigger id="dean-select" className="bg-white">
                        <SelectValue placeholder={loadingDeans ? "Loading deans..." : "Select a Dean"} />
                      </SelectTrigger>
                      <SelectContent>
                        {deans.map((dean) => (
                          <SelectItem key={dean.id} value={dean.id}>
                            {dean.first_name} {dean.last_name} {dean.department ? `(${dean.department})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-purple-700 mt-2">
                      The application will be forwarded to this Dean for the next stage of approval.
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="comments">Comments (Optional)</Label>
                  <Textarea 
                    id="comments" 
                    placeholder="Add any comments for the student..." 
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                  <Label htmlFor="file-upload" className="block mb-2 font-medium text-blue-900">
                    Upload Signed Document (Optional)
                  </Label>
                  <Input 
                    id="file-upload" 
                    type="file" 
                    onChange={(e) => setSignedFile(e.target.files?.[0] || null)}
                    className="bg-white"
                  />
                  <p className="text-xs text-blue-700 mt-2">
                    If you downloaded the form to sign it, upload the signed version here. It will become the current version for the student.
                  </p>
                </div>

                <Button onClick={handleApprove} disabled={processing} className="w-full bg-green-600 hover:bg-green-700">
                  {processing ? 'Processing...' : 'Confirm Approval'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reason" className="text-red-700">Rejection Reason (Required)</Label>
                  <Textarea 
                    id="reason" 
                    placeholder="Explain why this application is being rejected..." 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="border-red-200 focus:ring-red-500"
                  />
                </div>
                <Button onClick={handleReject} disabled={processing} variant="destructive" className="w-full">
                  {processing ? 'Processing...' : 'Confirm Rejection'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
