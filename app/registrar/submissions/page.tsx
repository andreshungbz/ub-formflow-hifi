'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Eye } from 'lucide-react';

export default function SubmissionsPage() {
  const [supabase] = useState(() => createClient());
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const { data, error } = await supabase
          .from('form_submissions')
          .select(`
            *,
            students (first_name, last_name, student_id),
            form_types (name)
          `)
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
  }, [supabase]);

  const filteredSubmissions = submissions.filter(sub => 
    sub.students.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.students.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.students.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.form_types.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.submission_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Submissions</h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search student or form..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref #</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Form Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : filteredSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">No submissions found.</TableCell>
              </TableRow>
            ) : (
              filteredSubmissions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.submission_number}</TableCell>
                  <TableCell>
                    {sub.students.first_name} {sub.students.last_name}
                    <br />
                    <span className="text-xs text-gray-500">{sub.students.student_id}</span>
                  </TableCell>
                  <TableCell>{sub.form_types.name}</TableCell>
                  <TableCell>{new Date(sub.submitted_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${sub.status === 'approved' ? 'bg-green-100 text-green-800' : 
                        sub.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {sub.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/registrar/submissions/${sub.id}`}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
