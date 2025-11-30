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
import Link from 'next/link';
import { User } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginCard() {
  const { login } = useAuth();
  const router = useRouter();

  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d+$/.test(studentId)) {
      setError('Student ID must contain only numbers.');
      return;
    }

    if (studentId.length !== 10) {
      setError('Student ID must be exactly 10 digits.');
      return;
    }

    setError('');
    login(studentId); // prototype: accept any password
    router.push('/');
  };

  return (
    <div className="flex flex-1 bg-background p-4 justify-start sm:justify-center sm:items-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center">
          <User className="w-12 h-12 text-ub-purple mb-2" />
          <CardTitle>Student Login</CardTitle>
          <CardDescription className="text-center">
            Enter your Student ID and password credentials for the{' '}
            <Link
              href="https://registration.ub.edu.bz/search.cfm"
              className="text-ub-purple underline hover:text-ub-purple/80 transition-colors"
            >
              UB Xenegrade Registration site
            </Link>
            .
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="grid gap-1">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                type="text"
                placeholder="e.g. 2018118240"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                className={
                  error
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : ''
                }
              />
              {error && <p className="text-red-600 text-sm">{error}</p>}
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="text-sm underline-offset-4 hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2"></CardFooter>
      </Card>
    </div>
  );
}
