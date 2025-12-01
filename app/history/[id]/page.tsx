'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Download } from 'lucide-react';

// Define types for better type safety
interface FormApproval {
  id: string;
  approval_type: string;
  status: string;
  sequence_order: number;
  approved_at: string | null;
  rejected_at: string | null;
  comments: string | null;
  staff?: {
    first_name: string;
    last_name: string;
  };
}

interface FormSubmission {
  id: string;
  submission_number: string;
  status: string;
  submitted_at: string;
  completed_at: string | null;
  notes: string | null;
  rejection_reason: string | null;
  form_types: {
    name: string;
    receipt_template_path: string | null;
  };
  students: {
    student_id: string;
  };
  form_approvals?: FormApproval[];
}

interface FormAttachment {
  id: string;
  file_name: string;
  file_path: string;
  signedUrl?: string;
}

export default function FormDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [attachments, setAttachments] = useState<FormAttachment[]>([]);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        // Fetch submission details
        const { data: subData, error: subError } = await supabase
          .from('form_submissions')
          .select(`
            id,
            submission_number,
            status,
            submitted_at,
            completed_at,
            notes,
            rejection_reason,
            form_types (
              name,
              receipt_template_path
            ),
            students (
              student_id
            ),
            form_approvals (
              id,
              approval_type,
              status,
              sequence_order,
              approved_at,
              rejected_at,
              comments,
              staff (
                first_name,
                last_name
              )
            )
          `)
          .eq('id', id)
          .single();

        if (subError) throw subError;
        setSubmission(subData as any);

        // Generate signed URL for template receipt if available (legacy/static)
        if (subData.form_types?.receipt_template_path) {
          const { data, error } = await supabase
            .storage
            .from('form-attachments') 
            .createSignedUrl(subData.form_types.receipt_template_path, 3600);

          if (!error && data) {
            setReceiptUrl(data.signedUrl);
          }
        }

        // Fetch attachments metadata - ONLY current versions
        const { data: attData, error: attError } = await supabase
          .from('form_attachments')
          .select('*')
          .eq('form_submission_id', id)
          .eq('is_current_version', true);

        if (attError) throw attError;

        // Generate signed URLs for attachments
        const attachmentsWithUrls = await Promise.all(
          (attData || []).map(async (file) => {
            const { data, error } = await supabase
              .storage
              .from('form-attachments')
              .createSignedUrl(file.file_path, 3600); // 1 hour expiry

            if (error) {
              console.error('Error creating signed URL:', error);
              return { ...file, signedUrl: null };
            }
            return { ...file, signedUrl: data.signedUrl };
          })
        );

        setAttachments(attachmentsWithUrls as FormAttachment[]);

      } catch (err: any) {
        console.error('Error fetching details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ub-purple"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Error loading form details: {error}
        </div>
        <Link href="/history" className="text-ub-purple hover:underline mt-4 inline-block">
          &larr; Back to History
        </Link>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="text-ub-grey text-lg">Form submission not found.</div>
        <Link href="/history" className="text-ub-purple hover:underline mt-4 inline-block">
          &larr; Back to History
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <Link href="/history" className="text-ub-purple hover:underline inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to History
        </Link>
        
        <div className="flex gap-2">
          {/* Generated Receipt Download */}
          <a 
            href={`/api/receipt?studentId=${submission.students?.student_id || 'N/A'}&formName=${encodeURIComponent(submission.form_types?.name || 'Form')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-ub-purple hover:bg-ub-purple/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ub-purple"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </a>

          {/* Legacy/Static Receipt Template Download (if exists) */}
          {receiptUrl && (
            <a 
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ub-purple"
            >
              <Download className="h-4 w-4 mr-2" />
              Template
            </a>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-8 py-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {submission.form_types?.name || 'Form Details'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Submission ID: <span className="font-mono text-gray-700">{submission.submission_number}</span>
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-semibold capitalize border
            ${submission.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 
              submission.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : 
              'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
            {submission.status}
          </div>
        </div>

        <div className="p-8">
          {/* Status Timeline / Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date Submitted</h3>
              <p className="text-gray-900 font-medium">
                {new Date(submission.submitted_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            {submission.completed_at && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date Completed</h3>
                <p className="text-gray-900 font-medium">
                  {new Date(submission.completed_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Notes & Rejection Reason */}
          {(submission.notes || submission.rejection_reason) && (
            <div className="space-y-6 mb-8">
              {submission.notes && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Notes
                  </h3>
                  <p className="text-blue-900 text-sm">{submission.notes}</p>
                </div>
              )}
              
              {submission.rejection_reason && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                  <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Rejection Reason
                  </h3>
                  <p className="text-red-900 text-sm">{submission.rejection_reason}</p>
                </div>
              )}
            </div>
          )}

          {/* Approval Workflow */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              Approval Workflow
            </h3>
            {(!submission.form_approvals || submission.form_approvals.length === 0) ? (
              <p className="text-gray-500 italic text-sm">No specific approvals required for this form.</p>
            ) : (
              <div className="space-y-3">
                {submission.form_approvals
                  .sort((a, b) => a.sequence_order - b.sequence_order)
                  .map((approval) => (
                    <div 
                      key={approval.id}
                      className={`flex items-start justify-between p-4 rounded-lg border-2 transition-all
                        ${approval.status === 'approved' ? 'bg-green-50 border-green-300' : 
                          approval.status === 'rejected' ? 'bg-red-50 border-red-300' : 
                          'bg-gray-50 border-gray-300'}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 capitalize">
                            {approval.approval_type.replace('_', ' ')}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize
                            ${approval.status === 'approved' ? 'bg-green-200 text-green-800' : 
                              approval.status === 'rejected' ? 'bg-red-200 text-red-800' : 
                              'bg-yellow-200 text-yellow-800'}`}
                          >
                            {approval.status}
                          </span>
                        </div>
                        
                        {approval.staff && (
                          <p className="text-sm text-gray-600">
                            {approval.staff.first_name} {approval.staff.last_name}
                          </p>
                        )}
                        
                        {approval.comments && (
                          <p className="text-sm text-gray-700 mt-2 italic">"{approval.comments}"</p>
                        )}
                      </div>
                      
                      <div className="text-right text-xs text-gray-500 ml-4">
                        {approval.approved_at && (
                          <p>Approved: {new Date(approval.approved_at).toLocaleDateString()}</p>
                        )}
                        {approval.rejected_at && (
                          <p>Rejected: {new Date(approval.rejected_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {/* Attachments */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              Uploaded Documents
            </h3>
            {attachments.length === 0 ? (
              <p className="text-gray-500 italic text-sm">No documents were uploaded with this submission.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {attachments.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center min-w-0 flex-1 mr-4">
                      <div className="bg-red-100 p-2 rounded text-red-600 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" title={file.file_name}>
                          {file.file_name}
                        </p>
                        <p className="text-xs text-gray-500">Document</p>
                      </div>
                    </div>
                    {file.signedUrl ? (
                      <a 
                        href={file.signedUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-shrink-0 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-ub-purple bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ub-purple"
                      >
                        Download
                      </a>
                    ) : (
                      <span className="text-xs text-red-500">Unavailable</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
