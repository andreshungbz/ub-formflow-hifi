'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function DeanNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="bg-ub-purple shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href="/dean" className="flex-shrink-0">
              <span className="text-xl font-bold text-ub-yellow">UB FormFlow (Dean)</span>
            </Link>
            <div className="hidden md:flex gap-2">
              <Button 
                asChild 
                variant={pathname === '/dean' ? 'default' : 'outline'}
                size="sm"
              >
                <Link href="/dean">Dashboard</Link>
              </Button>
              <Button 
                asChild 
                variant={pathname === '/dean/history' ? 'default' : 'outline'}
                size="sm"
              >
                <Link href="/dean/history">History</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/forms">All Forms</Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white hidden sm:block">
              {user?.email}
            </span>
            <Button variant="default" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
