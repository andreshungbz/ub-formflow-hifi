"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Clock, FileText } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";

interface ApprovalRequest {
  id: string;
  approval_type: string;
  created_at: string;
  form_submissions: {
    id: string;
    submission_number: string;
    submitted_at: string;
    students: {
      first_name: string;
      last_name: string;
      student_id: string;
    };
    form_types: {
      name: string;
    };
  };
}

const mapApproval = (approval: unknown): ApprovalRequest => {
  const approvalRecord = approval as {
    id: string;
    approval_type: string;
    created_at: string;
    form_submissions?: unknown;
  };

  const submissionRecord = Array.isArray(approvalRecord.form_submissions)
    ? approvalRecord.form_submissions[0]
    : approvalRecord.form_submissions;
  const submission = submissionRecord as ApprovalRequest["form_submissions"];

  if (!submission) {
    throw new Error("Missing submission data for approval");
  }

  return {
    id: approvalRecord.id,
    approval_type: approvalRecord.approval_type,
    created_at: approvalRecord.created_at,
    form_submissions: {
      id: submission.id,
      submission_number: submission.submission_number,
      submitted_at: submission.submitted_at,
      students: submission.students,
      form_types: submission.form_types,
    },
  };
};

export default function TeacherDashboard() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const fetchApprovals = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("form_approvals")
          .select(
            `
            id,
            approval_type,
            created_at,
            form_submissions (
              id,
              submission_number,
              submitted_at,
              students (
                first_name,
                last_name,
                student_id
              ),
              form_types (
                name
              )
            )
          `
          )
          .eq("status", "pending")
          .eq("staff_id", user.id) // Filter by current user
          .order("created_at", { ascending: true });

        if (error) throw error;
        setApprovals((data || []).map(mapApproval));
      } catch (error) {
        console.error("Error fetching approvals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovals();
  }, [supabase, user]);

  if (loading) {
    return <div className="p-8 text-center">Loading pending approvals...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Pending Approvals
      </h1>

      {approvals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <CheckCircle className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
          <p className="mt-2 text-gray-500">
            You have no pending forms to approve.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {approvals.map((approval) => (
              <li key={approval.id}>
                <Link
                  href={`/teacher/assess/${approval.form_submissions.id}?approvalId=${approval.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-purple-100 text-purple-600">
                            <FileText className="h-6 w-6" />
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-ub-purple truncate">
                            {approval.form_submissions.form_types.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Submitted by{" "}
                            {approval.form_submissions.students.first_name}{" "}
                            {approval.form_submissions.students.last_name} (
                            {approval.form_submissions.students.student_id})
                          </p>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex flex-col items-end">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 capitalize">
                          {approval.approval_type.replace("_", " ")} Approval
                        </p>
                        <p className="mt-1 text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(approval.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
