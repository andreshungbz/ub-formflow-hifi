'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { UserPlus } from 'lucide-react';

interface Department {
  id: number;
  name: string;
}

export default function CreateProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    phone: '',
    program_code: '',
    program_name: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from('department')
        .select('*')
        .order('name', { ascending: true });

      if (data && !error) {
        setDepartments(data);
      }
    };

    fetchDepartments();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProgramChange = (value: string) => {
    setFormData((prev) => ({ ...prev, program_name: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!user) {
      setError('You must be logged in to create a profile.');
      setSubmitting(false);
      return;
    }

    // Validate required fields
    if (!formData.student_id || !formData.first_name || !formData.last_name) {
      setError('Please fill in all required fields.');
      setSubmitting(false);
      return;
    }

    // Validate student_id format
    if (!/^\d+$/.test(formData.student_id)) {
      setError('Student ID must contain only numbers.');
      setSubmitting(false);
      return;
    }

    if (formData.student_id.length !== 10) {
      setError('Student ID must be exactly 10 digits.');
      setSubmitting(false);
      return;
    }

    try {
      // Create user profile with role 'student'
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          role: 'student',
        });

      if (profileError && profileError.code !== '23505') {
        // 23505 is unique violation, which is fine if profile already exists
        throw profileError;
      }

      // Create student profile
      const { error: studentError } = await supabase.from('students').insert({
        id: user.id,
        student_id: formData.student_id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || null,
        program_code: formData.program_code || null,
        program_name: formData.program_name || null,
        enrollment_status: 'active',
      });

      if (studentError) {
        throw studentError;
      }

      // Success - redirect to home
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create profile. Please try again.');
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-1 bg-background p-4 justify-center items-center min-h-[calc(100vh-8rem)]">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-1 bg-background p-4 justify-start sm:justify-center sm:items-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <UserPlus className="w-12 h-12 text-ub-purple mb-2" />
          <CardTitle>Create Student Profile</CardTitle>
          <CardDescription className="text-center">
            Please provide your student information to complete your profile.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="grid gap-1">
              <Label htmlFor="student_id">
                Student ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="student_id"
                name="student_id"
                type="text"
                placeholder="e.g. 2018118240"
                value={formData.student_id}
                onChange={handleChange}
                required
                maxLength={10}
                className={
                  error && !formData.student_id
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : ''
                }
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="first_name">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="first_name"
                name="first_name"
                type="text"
                placeholder="John"
                value={formData.first_name}
                onChange={handleChange}
                required
                className={
                  error && !formData.first_name
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : ''
                }
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="last_name">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="last_name"
                name="last_name"
                type="text"
                placeholder="Doe"
                value={formData.last_name}
                onChange={handleChange}
                required
                className={
                  error && !formData.last_name
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : ''
                }
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(501) 123-4567"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="program_code">Program Code</Label>
              <Input
                id="program_code"
                name="program_code"
                type="text"
                placeholder="e.g. CS"
                value={formData.program_code}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="program_name">Program/Department</Label>
              <Select value={formData.program_name} onValueChange={handleProgramChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your program" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creating Profile...' : 'Create Profile'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2"></CardFooter>
      </Card>
    </div>
  );
}
