'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const { user, studentId, role, logout } = useAuth();
  const isStudent = role === 'student';
  const emailPrefix = user?.email?.split('@')[0];
  const logoutLabel = isStudent && studentId
    ? `${studentId} (Logout)`
    : emailPrefix
      ? `${emailPrefix} (Logout)`
      : 'Logout';

  return (
    <header className="w-full flex flex-col sm:flex-row items-center px-4 py-3 gap-4 bg-ub-purple">
      {/* UB FormFlow Logo */}
      <div className="text-xl font-bold whitespace-nowrap flex items-center gap-2 shrink-0">
        <Link
          href="/"
          className="text-ub-yellow flex items-center gap-2 shrink-0"
        >
          <Image
            src="/ub-formflow-logo-100x100.svg"
            alt="UB FormFlow Logo"
            width={40}
            height={40}
          />
          UB FormFlow
        </Link>
      </div>

      {/* Navigation */}
      <div className="w-full sm:grow flex flex-col items-center sm:items-end">
        <NavigationMenu className="w-full">
          <NavigationMenuList className="flex flex-col sm:flex-row gap-2 w-full justify-center sm:justify-start">
            <NavigationMenuItem>
              <Button asChild variant="outline">
                <Link href="/forms">All Forms</Link>
              </Button>
            </NavigationMenuItem>

            {isStudent && studentId && (
              <NavigationMenuItem>
                <Button asChild variant="outline">
                  <Link href={`/history/`}>Form History</Link>
                </Button>
              </NavigationMenuItem>
            )}

            {role === 'teacher' && (
              <NavigationMenuItem>
                <Button asChild variant="outline">
                  <Link href="/teacher">Teacher Dashboard</Link>
                </Button>
              </NavigationMenuItem>
            )}

            {role === 'dean' && (
              <NavigationMenuItem>
                <Button asChild variant="outline">
                  <Link href="/dean">Dean Dashboard</Link>
                </Button>
              </NavigationMenuItem>
            )}

            {!user ? (
              <NavigationMenuItem>
                <Button asChild variant="default">
                  <Link href="/login">Login</Link>
                </Button>
              </NavigationMenuItem>
            ) : (
              <NavigationMenuItem>
                <Button variant="default" onClick={logout}>
                  {logoutLabel}
                </Button>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}
