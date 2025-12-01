'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function HistoryPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    if (!user) return;

    const fetchSubmissions = async () => {
      try {
        const { data, error } = await supabase
          .from('form_submissions')
          .select(`
            id,
            submission_number,
            status,
            submitted_at,
            form_types (
              name
            )
          `)
          .eq('student_id', user.id)
          .order('submitted_at', { ascending: false });

        if (error) throw error;
        setSubmissions(data || []);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [user, supabase]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Forms History</h1>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {submissions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No submissions found.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {submissions.map((sub) => (
              <li key={sub.id}>
                <Link href={`/history/${sub.id}`} className="block hover:bg-gray-50 p-4 transition">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-lg text-ub-purple">{sub.form_types?.name}</p>
                      <p className="text-sm text-gray-500">#{sub.submission_number}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize
                        ${sub.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          sub.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {sub.status}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(sub.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
