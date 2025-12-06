'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Check, X } from 'lucide-react';

export default function AccountsAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.submissionId as string;
  const [supabase] = useState(() => createClient());
  const { user } = useAuth();

  const [submission, setSubmission] = useState<any>(null);
  const [approvalId, setApprovalId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!submissionId || !user) return;

      try {
        // Fetch submission details
        const { data: subData, error: subError } = await supabase
          .from('form_submissions')
          .select(
            `
            *,
            students (*),
            form_types (*)
          `
          )
          .eq('id', submissionId)
          .single();

        if (subError) throw subError;
        setSubmission(subData);

        // Fetch approval record for this accounts staff
        const { data: approvalData, error: approvalError } = await supabase
          .from('form_approvals')
          .select('*')
          .eq('form_submission_id', submissionId)
          .eq('approval_type', 'accounts_receivable')
          .eq('status', 'pending')
          .maybeSingle();

        if (approvalError) throw approvalError;
        setApprovalId(approvalData?.id || null);

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
            const { data } = await supabase.storage
              .from('form-attachments')
              .createSignedUrl(file.file_path, 3600);
            return { ...file, signedUrl: data?.signedUrl };
          })
        );
        setAttachments(attachmentsWithUrls);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [submissionId, user, supabase]);

  const handleApprove = async () => {
    if (!approvalId) return;
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

        await supabase.from('form_attachments').insert({
          form_submission_id: submissionId,
          file_name: `SIGNED - ${signedFile.name}`,
          file_path: fileName,
          file_size: signedFile.size,
          file_type: signedFile.type,
          is_current_version: true,
          uploaded_by: user?.id,
        });
      }

      // 2. Update approval record
      const { error: approvalError } = await supabase
        .from('form_approvals')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          comments: comments,
          staff_id: user?.id,
        })
        .eq('id', approvalId);

      if (approvalError) throw approvalError;

      // 3. Check if all approvals for this submission are now approved
      const { data: allApprovals } = await supabase
        .from('form_approvals')
        .select('status')
        .eq('form_submission_id', submissionId);

      const allApproved = allApprovals?.every((a) => a.status === 'approved');

      if (allApproved) {
        // Mark submission as approved
        await supabase
          .from('form_submissions')
          .update({
            status: 'approved',
            completed_at: new Date().toISOString(),
          })
          .eq('id', submissionId);
      }

      router.push('/accounts');
    } catch (error) {
      console.error('Error approving:', error);
      alert('Failed to approve. See console.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!approvalId || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    setProcessing(true);

    try {
      const { error: approvalError } = await supabase
        .from('form_approvals')
        .update({
          status: 'rejected',
          approved_at: new Date().toISOString(),
          comments: rejectionReason,
          staff_id: user?.id,
        })
        .eq('id', approvalId);

      if (approvalError) throw approvalError;

      const { error: submissionError } = await supabase
        .from('form_submissions')
        .update({ status: 'rejected' })
        .eq('id', submissionId);

      if (submissionError) throw submissionError;

      router.push('/accounts');
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Failed to reject. See console.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!submission)
    return <div className="p-8 text-center">Submission not found</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Assessment: {submission.form_types.name}
        </h1>
        <p className="text-gray-600">
          Student: {submission.students.first_name}{' '}
          {submission.students.last_name} ({submission.students.student_id})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <p className="text-gray-500 italic">No attachments found.</p>
              ) : (
                <div className="space-y-3">
                  {attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <span className="text-sm font-medium">
                          {file.file_name}
                        </span>
                      </div>
                      {file.signedUrl && (
                        <Button asChild size="sm" variant="outline">
                          <a
                            href={file.signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload Signed Document (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="file"
                onChange={(e) => setSignedFile(e.target.files?.[0] || null)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comments / Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any comments or notes..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">Approve Request</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleApprove}
                disabled={processing || !approvalId}
                className="w-full text-white bg-green-600 hover:bg-green-700"
              >
                <Check className="mr-2 h-4 w-4" />
                {processing ? 'Processing...' : 'Approve'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Reject Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="rejection-reason" className="mb-2">
                  Reason for Rejection
                </Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Explain why this is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                onClick={handleReject}
                disabled={processing || !approvalId}
                variant="destructive"
                className="w-full"
              >
                <X className="mr-2 h-4 w-4" />
                {processing ? 'Processing...' : 'Reject'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
