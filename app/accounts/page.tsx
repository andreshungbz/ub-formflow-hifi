'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Clock, FileText } from 'lucide-react';

interface ApprovalWithPrecedingCheck {
  id: string;
  approval_type: string;
  created_at: string;
  sequence_order: number;
  form_submission_id: string;
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
  all_approvals: {
    id: string;
    status: string;
    sequence_order: number;
  }[];
}

export default function AccountsDashboard() {
  const [supabase] = useState(() => createClient());
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalWithPrecedingCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprovals = async () => {
      if (!user) return;

      try {
        // 1. Fetch pending approvals for 'accounts_receivable'
        // We also need to fetch ALL approvals for the same submission to check sequence
        const { data, error } = await supabase
          .from('form_approvals')
          .select(`
            id,
            approval_type,
            created_at,
            sequence_order,
            form_submission_id,
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
          `)
          .eq('status', 'pending')
          .eq('approval_type', 'accounts_receivable') // Make sure this matches DB enum
          .order('created_at', { ascending: true });

        if (error) throw error;

        // 2. For each pending approval, fetch sibling approvals to check sequence
        const approvalsWithCheck = await Promise.all(
          (data || []).map(async (approval) => {
            const { data: siblings } = await supabase
              .from('form_approvals')
              .select('id, status, sequence_order')
              .eq('form_submission_id', approval.form_submission_id);
            
            return {
              ...approval,
              all_approvals: siblings || []
            };
          })
        );

        // 3. Filter: Only show if all preceding steps are approved
        const readyApprovals = approvalsWithCheck.filter((approval: ApprovalWithPrecedingCheck) => {
          const hasPendingPrecedingApproval = approval.all_approvals.some(
            (a) => a.sequence_order < approval.sequence_order && a.status !== 'approved'
          );
          return !hasPendingPrecedingApproval;
        });

        setApprovals(readyApprovals);

      } catch (error) {
        console.error('Error fetching approvals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovals();
  }, [user, supabase]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Accounts Receivable Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage pending financial approvals.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {approvals.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
            <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
            <p className="mt-1 text-sm text-gray-500">You're all caught up!</p>
          </div>
        ) : (
          approvals.map((approval) => (
            <Card key={approval.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(approval.created_at).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-lg mt-2">{approval.form_submissions.form_types.name}</CardTitle>
                <CardDescription>
                  {approval.form_submissions.students.first_name} {approval.form_submissions.students.last_name}
                  <br />
                  ID: {approval.form_submissions.students.student_id}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end">
                  <Button asChild className="w-full">
                    <Link href={`/accounts/assess/${approval.form_submission_id}`}>
                      Review Request
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
