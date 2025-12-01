'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (role !== 'accounts_receivable' && role !== 'admin') {
        // Redirect unauthorized users
        if (role === 'student') router.push('/history');
        else if (role === 'teacher') router.push('/teacher');
        else if (role === 'dean') router.push('/dean');
        else if (role === 'registrar') router.push('/registrar');
        else router.push('/');
      }
    }
  }, [user, role, loading, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || (role !== 'accounts_receivable' && role !== 'admin')) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
