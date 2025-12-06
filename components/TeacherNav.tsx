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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function TeacherNav() {
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
    { href: '/teacher', label: 'Dashboard' },
    { href: '/teacher/history', label: 'History' },
    { href: '/forms', label: 'All Forms', matchPrefix: true },
  ];

  return (
    <header className="w-full flex flex-col [@media(min-width:960px)]:flex-row [@media(min-width:960px)]:items-center [@media(min-width:960px)]:gap-0 gap-4 px-4 py-3 bg-ub-purple">
      <div className="flex w-full [@media(min-width:960px)]:w-auto items-center justify-between">
        <Link href="/teacher" className="text-ub-yellow flex items-center gap-2 shrink-0">
          <Image
            src="/ub-formflow-logo-100x100.svg"
            alt="UB FormFlow Logo"
            width={40}
            height={40}
          />
          <span className="text-xl font-bold">UB FormFlow (Staff)</span>
        </Link>

        <div className="[@media(min-width:960px)]:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation menu"
                className="text-white hover:bg-white/20 focus-visible:ring-white/70"
              >
                <Menu className="h-6 w-6 text-white stroke-[2.5]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-[12rem] bg-white border-grey/70 text-ub-purple shadow-xl"
            >
              {navItems.map((item) => {
                const active = isActive(item.href, item.matchPrefix);
                return (
                  <DropdownMenuItem
                    key={item.href}
                    className={`text-ub-purple font-semibold hover:text-ub-purple focus:text-ub-purple focus:bg-ub-purple/10 ${
                      active ? 'font-bold' : ''
                    }`}
                    asChild
                  >
                    <Link
                      href={item.href}
                      className="w-full text-ub-purple hover:text-ub-purple"
                    >
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}

              <DropdownMenuSeparator className="bg-ub-purple/30" />

              <DropdownMenuItem
                className="text-[#d88c00] font-semibold hover:text-[#d88c00] focus:text-[#d88c00] focus:bg-ub-purple/10"
                onSelect={(event) => {
                  event.preventDefault();
                  logout();
                }}
              >
                {logoutLabel}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="hidden [@media(min-width:960px)]:flex w-full [@media(min-width:960px)]:grow [@media(min-width:960px)]:flex-row [@media(min-width:960px)]:items-center gap-3 [@media(min-width:960px)]:justify-end">
        <NavigationMenu className="w-full">
          <NavigationMenuList className="flex flex-row gap-2 w-full justify-start">
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
