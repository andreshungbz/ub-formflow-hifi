"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X } from "lucide-react";

interface SubmissionDetails {
  id: string;
  submission_number: string;
  submitted_at: string;
  status: string;
  form_types: {
    name: string;
  };
  students: {
    first_name: string;
    last_name: string;
    student_id: string;
    program_name?: string | null;
    phone?: string | null;
  };
}

interface SubmissionAttachment {
  id: string;
  form_submission_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  is_current_version: boolean;
  uploaded_by: string;
}

type AttachmentWithUrl = SubmissionAttachment & { signedUrl?: string };

export default function RegistrarAssessmentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const submissionId = params.submissionId as string;
  const approvalId = searchParams.get("approvalId");
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [submission, setSubmission] = useState<SubmissionDetails | null>(null);
  const [attachments, setAttachments] = useState<AttachmentWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [comments, setComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!submissionId) return;

      try {
        // Fetch submission details
        const { data: subData, error: subError } = await supabase
          .from("form_submissions")
          .select(
            `
            *,
            students (*),
            form_types (*)
          `
          )
          .eq("id", submissionId)
          .single();

        if (subError) throw subError;
        setSubmission(subData as SubmissionDetails);

        // Fetch attachments - ONLY current versions
        const { data: attData, error: attError } = await supabase
          .from("form_attachments")
          .select("*")
          .eq("form_submission_id", submissionId)
          .eq("is_current_version", true);

        if (attError) throw attError;

        // Generate signed URLs
        const attachmentsWithUrls = await Promise.all(
          (attData || []).map(async (file) => {
            const { data } = await supabase.storage
              .from("form-attachments")
              .createSignedUrl(file.file_path, 3600);
            return {
              ...(file as SubmissionAttachment),
              signedUrl: data?.signedUrl,
            } as AttachmentWithUrl;
          })
        );
        setAttachments(attachmentsWithUrls);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [submissionId, supabase]);

  const handleApprove = async () => {
    if (!approvalId) return;
    setProcessing(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Upload signed file if present
      if (signedFile) {
        const fileExt = signedFile.name.split(".").pop();
        const fileName = `${submissionId}/signed-registrar-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("form-attachments")
          .upload(fileName, signedFile);

        if (uploadError) throw uploadError;

        const { error: versionError } = await supabase
          .from("form_attachments")
          .update({ is_current_version: false })
          .eq("form_submission_id", submissionId)
          .eq("is_current_version", true);

        if (versionError) throw versionError;

        // Add the signed file as a new current version
        await supabase.from("form_attachments").insert({
          form_submission_id: submissionId,
          file_name: `SIGNED (Registrar) - ${signedFile.name}`,
          file_path: fileName,
          file_size: signedFile.size,
          file_type: signedFile.type,
          is_current_version: true,
          uploaded_by: user.id,
        });
      }

      // 2. Update approval record
      // This is where we "pace their id" (update staff_id to current user)
      const { error: approvalError } = await supabase
        .from("form_approvals")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          comments: comments,
          staff_id: user.id, // Assign the approval to the current registrar
        })
        .eq("id", approvalId);

      if (approvalError) throw approvalError;

      // 3. Check if all approvals for this submission are now approved
      const { data: allApprovals } = await supabase
        .from("form_approvals")
        .select("status")
        .eq("form_submission_id", submissionId);

      const allApproved = allApprovals?.every((a) => a.status === "approved");

      if (allApproved) {
        // Mark submission as approved
        await supabase
          .from("form_submissions")
          .update({
            status: "approved",
            completed_at: new Date().toISOString(),
          })
          .eq("id", submissionId);
      }

      router.push("/registrar");
    } catch (error) {
      console.error("Error approving:", error);
      alert("Failed to approve. See console.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!approvalId || !rejectionReason) {
      alert("Please provide a rejection reason.");
      return;
    }
    setProcessing(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 1. Update approval record
      await supabase
        .from("form_approvals")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
          staff_id: user?.id, // Also track who rejected it
        })
        .eq("id", approvalId);

      // 2. Update submission status to rejected
      await supabase
        .from("form_submissions")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          completed_at: new Date().toISOString(),
        })
        .eq("id", submissionId);

      router.push("/registrar");
    } catch (error) {
      console.error("Error rejecting:", error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!submission)
    return <div className="p-8 text-center">Submission not found</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            Registrar Assessment: {submission.form_types.name}
          </h1>
          <span className="text-sm text-gray-500">
            #{submission.submission_number}
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Student Information
            </h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="font-semibold text-lg">
                {submission.students.first_name} {submission.students.last_name}
              </p>
              <p className="text-gray-600">
                ID: {submission.students.student_id}
              </p>
              <p className="text-gray-600">
                {submission.students.program_name}
              </p>
              <p className="text-gray-600">{submission.students.phone}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Submission Details
            </h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600 mb-1">Submitted on:</p>
              <p className="font-medium mb-3">
                {new Date(submission.submitted_at).toLocaleString()}
              </p>

              <p className="text-sm text-gray-600 mb-1">Status:</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 capitalize">
                {submission.status}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Attachments (Current Version)
          </h3>
          {attachments.length === 0 ? (
            <p className="text-gray-500 italic">No attachments.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {attachments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white"
                >
                  <span
                    className="text-sm truncate mr-2"
                    title={file.file_name}
                  >
                    {file.file_name}
                  </span>
                  {file.signedUrl ? (
                    <a
                      href={file.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ub-purple hover:underline text-sm font-medium"
                    >
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
              onClick={() => setAction("approve")}
              className="bg-green-600 hover:bg-green-700 text-white flex-1 py-6 text-lg"
            >
              <Check className="mr-2 h-5 w-5" /> Approve Application
            </Button>
            <Button
              onClick={() => setAction("reject")}
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
                {action === "approve"
                  ? "Approve Application"
                  : "Reject Application"}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setAction(null)}>
                Cancel
              </Button>
            </div>

            {action === "approve" ? (
              <div className="space-y-4">
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
                  <Label
                    htmlFor="file-upload"
                    className="block mb-2 font-medium text-blue-900"
                  >
                    Upload Signed Document (Optional)
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={(e) => setSignedFile(e.target.files?.[0] || null)}
                    className="bg-white"
                  />
                  <p className="text-xs text-blue-700 mt-2">
                    If you downloaded the form to sign it, upload the signed
                    version here. It will become the current version for the
                    student.
                  </p>
                </div>

                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {processing ? "Processing..." : "Confirm Approval"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reason" className="text-red-700">
                    Rejection Reason (Required)
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="Explain why this application is being rejected..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="border-red-200 focus:ring-red-500"
                  />
                </div>
                <Button
                  onClick={handleReject}
                  disabled={processing}
                  variant="destructive"
                  className="w-full"
                >
                  {processing ? "Processing..." : "Confirm Rejection"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
