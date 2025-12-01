'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';

export default function AccountsHistoryPage() {
  const [supabase] = useState(() => createClient());
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('form_approvals')
          .select(`
            *,
            form_submissions (
              submission_number,
              students (first_name, last_name, student_id),
              form_types (name)
            )
          `)
          .eq('staff_id', user.id)
          .neq('status', 'pending')
          .order('approved_at', { ascending: false });

        if (error) throw error;
        setHistory(data || []);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, supabase]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Approval History</h1>

      <div className="grid gap-4">
        {history.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No approval history found.</p>
            </CardContent>
          </Card>
        ) : (
          history.map((approval) => (
            <Card key={approval.id} className={`hover:shadow-md transition-shadow ${approval.status === 'approved' ? 'bg-green-50 border-green-200' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">
                      {approval.form_submissions.form_types.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Student: {approval.form_submissions.students.first_name} {approval.form_submissions.students.last_name}
                      {' '}({approval.form_submissions.students.student_id})
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Ref: {approval.form_submissions.submission_number}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {approval.status === 'approved' ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <CheckCircle className="h-4 w-4" /> Approved
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                        <XCircle className="h-4 w-4" /> Rejected
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(approval.approved_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {approval.comments && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700 italic">
                    "{approval.comments}"
                  </div>
                )}
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
