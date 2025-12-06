'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function RegistrarNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const emailPrefix = user?.email?.split('@')[0];
  const logoutLabel = emailPrefix ? `${emailPrefix} (Logout)` : 'Logout';

  const isActive = (href: string, matchPrefix?: boolean) => {
    if (matchPrefix) {
      return pathname === href || pathname.startsWith(`${href}/`);
    }
    return pathname === href;
  };

  const navItems = [
    { href: '/registrar', label: 'Dashboard' },
    { href: '/registrar/submissions', label: 'Submissions', matchPrefix: true },
    { href: '/registrar/forms', label: 'Forms' },
    { href: '/registrar/staff', label: 'Staff' },
  ];

  return (
    <header className="w-full flex flex-col sm:flex-row items-center px-4 py-3 gap-4 bg-ub-purple">
      <Link href="/registrar" className="text-ub-yellow flex items-center gap-2 shrink-0">
        <Image
          src="/ub-formflow-logo-100x100.svg"
          alt="UB FormFlow Logo"
          width={40}
          height={40}
        />
        <span className="text-xl font-bold">UB FormFlow (Registrar)</span>
      </Link>

      <div className="w-full sm:grow flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-end">
        <NavigationMenu className="w-full">
          <NavigationMenuList className="flex flex-col sm:flex-row gap-2 w-full justify-center sm:justify-start">
            {navItems.map((item) => (
              <NavigationMenuItem key={item.href}>
                <Button
                  asChild
                  variant={isActive(item.href, item.matchPrefix) ? 'default' : 'outline'}
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center">
          <Button variant="default" onClick={logout}>
            {logoutLabel}
          </Button>
        </div>
      </div>
    </header>
  );
}
