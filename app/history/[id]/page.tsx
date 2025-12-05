"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Download, Check, Clock, Circle, AlertCircle } from "lucide-react";

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

export default function FormDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
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
          .from("form_submissions")
          .select(
            `
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
          `
          )
          .eq("id", id)
          .single();

        if (subError) throw subError;
        setSubmission(subData as any);
      } catch (err: any) {
        console.error("Error fetching details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f7f6fb]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7c3090]"></div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center bg-[#f7f6fb] min-h-screen pt-20">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-block">
          {error ? `Error: ${error}` : "Form submission not found."}
        </div>
        <br />
        <Link
          href="/history"
          className="text-[#7c3090] hover:underline mt-4 inline-block"
        >
          &larr; Back to History
        </Link>
      </div>
    );
  }

  // Construct timeline steps
  const steps = [
    {
      title: "Submitted",
      date: submission.submitted_at,
      status: "completed",
      description: `Submitted on ${new Date(
        submission.submitted_at
      ).toLocaleDateString()}`,
      comment: null,
    },
    ...(submission.form_approvals || [])
      .sort((a, b) => a.sequence_order - b.sequence_order)
      .map((approval) => ({
        title:
          approval.approval_type
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()) + " Approval",
        date: approval.approved_at || approval.rejected_at,
        status:
          approval.status === "approved"
            ? "completed"
            : approval.status === "rejected"
            ? "rejected"
            : "pending",
        description:
          approval.status === "pending"
            ? "Currently in progress"
            : approval.status === "approved"
            ? `Approved on ${new Date(
                approval.approved_at!
              ).toLocaleDateString()}`
            : `Rejected on ${new Date(
                approval.rejected_at!
              ).toLocaleDateString()}`,
        comment: approval.comments,
      })),
    {
      title: "Sent to Records Office",
      date: submission.completed_at,
      status: submission.status === "approved" ? "completed" : "pending",
      description:
        submission.status === "approved"
          ? "Finalized and sent to records"
          : "Pending finalization",
      comment: null,
    },
  ];

  return (
    <div className="bg-[#f7f6fb] min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Form Progress</h1>
          <p className="text-gray-500 mt-1">
            Track the status of your submitted form
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header Card */}
          <div className="bg-[#fcfaff] p-6 border-b border-gray-100 flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Form Submission
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Confirmation #:{" "}
                <span className="font-mono">
                  {submission.submission_number}
                </span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                Submitted
              </span>
              <p className="text-gray-900 font-medium">
                {new Date(submission.submitted_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-8 relative">
            {/* Vertical Line */}
            <div className="absolute left-[59px] top-10 bottom-10 w-0.5 bg-gray-100" />

            <div className="space-y-8 relative">
              {steps.map((step, index) => {
                let Icon = Circle;
                let iconColor = "text-gray-300";
                let bgColor = "bg-white";
                let borderColor = "border-gray-200";

                if (step.status === "completed") {
                  Icon = Check;
                  iconColor = "text-white";
                  bgColor = "bg-[#7c3090]"; // ub-purple
                  borderColor = "border-[#7c3090]";
                } else if (step.status === "rejected") {
                  Icon = Check; // Or X
                  iconColor = "text-white";
                  bgColor = "bg-red-500";
                  borderColor = "border-red-500";
                } else if (
                  index > 0 &&
                  steps[index - 1].status === "completed" &&
                  step.status === "pending"
                ) {
                  // Current active step
                  Icon = Clock;
                  iconColor = "text-[#7c3090]";
                  bgColor = "bg-white";
                  borderColor = "border-[#7c3090]";
                }

                return (
                  <div key={index} className="flex gap-6 relative">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 ${bgColor} ${borderColor}`}
                    >
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>

                    {/* Content */}
                    <div className="pt-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {step.title}
                      </h3>
                      <p
                        className={`text-sm mt-0.5 ${
                          step.status === "pending" &&
                          index > 0 &&
                          steps[index - 1].status === "completed"
                            ? "text-[#7c3090] font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        {step.description}
                      </p>
                      {/* @ts-ignore */}
                      {step.comment && (
                        <div className="mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-600 italic">
                          "{step.comment}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Warning */}
        <div className="mt-8 bg-[#fcfaff] border border-[#f3e8ff] rounded-xl p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-[#7c3090] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900">
              Additional Action May Be Required
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              If additional information is needed, you will be notified via
              email.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/history"
            className="flex items-center justify-center px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            Back to Form History
          </Link>
          <a
            href={`/api/receipt?studentId=${
              submission.students?.student_id || "N/A"
            }&formName=${encodeURIComponent(
              submission.form_types?.name || "Form"
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            View Receipt
          </a>
        </div>
      </div>
    </div>
  );
}
