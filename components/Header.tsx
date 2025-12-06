"use client";

import Image from "next/image";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const { user, studentId, role, logout } = useAuth();
  const isStudent = role === "student";
  const emailPrefix = user?.email?.split("@")[0];
  const logoutLabel =
    isStudent && studentId
      ? `${studentId} (Logout)`
      : emailPrefix
      ? `${emailPrefix} (Logout)`
      : "Logout";

  return (
    <header className="w-full flex flex-col sm:flex-row sm:items-center sm:gap-0 gap-4 px-4 py-3 bg-ub-purple">
      <div className="flex w-full sm:w-auto items-center justify-between">
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

        {/* Mobile Menu */}
        <div className="sm:hidden">
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
              <DropdownMenuItem
                className="text-ub-purple font-semibold hover:text-ub-purple focus:text-ub-purple focus:bg-ub-purple/10"
                asChild
              >
                <Link
                  href="/forms"
                  className="w-full text-ub-purple hover:text-ub-purple"
                >
                  All Forms
                </Link>
              </DropdownMenuItem>

              {isStudent && studentId && (
                <DropdownMenuItem
                  className="text-ub-purple hover:text-ub-purple focus:text-ub-purple focus:bg-ub-purple/10"
                  asChild
                >
                  <Link
                    href="/history"
                    className="w-full text-ub-purple hover:text-ub-purple"
                  >
                    Form History
                  </Link>
                </DropdownMenuItem>
              )}

              {role === "teacher" && (
                <DropdownMenuItem
                  className="text-ub-purple hover:text-ub-purple focus:text-ub-purple focus:bg-ub-purple/10"
                  asChild
                >
                  <Link
                    href="/teacher"
                    className="w-full text-ub-purple hover:text-ub-purple"
                  >
                    Teacher Dashboard
                  </Link>
                </DropdownMenuItem>
              )}

              {role === "dean" && (
                <DropdownMenuItem
                  className="text-ub-purple hover:text-ub-purple focus:text-ub-purple focus:bg-ub-purple/10"
                  asChild
                >
                  <Link
                    href="/dean"
                    className="w-full text-ub-purple hover:text-ub-purple"
                  >
                    Dean Dashboard
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="bg-ub-purple/30" />

              {!user ? (
                <DropdownMenuItem
                  className="text-[#d88c00] font-semibold hover:text-[#d88c00] focus:text-[#d88c00] focus:bg-ub-purple/10"
                  asChild
                >
                  <Link
                    href="/login"
                    className="w-full text-[#d88c00] hover:text-[#d88c00]"
                  >
                    Login
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="text-[#d88c00] font-semibold hover:text-[#d88c00] focus:text-[#d88c00] focus:bg-ub-purple/10"
                  onSelect={(event) => {
                    event.preventDefault();
                    logout();
                  }}
                >
                  {logoutLabel}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden sm:flex flex-1 justify-end">
        <NavigationMenu className="w-full">
          <NavigationMenuList className="flex flex-row flex-wrap gap-2 w-full justify-end">
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

            {role === "teacher" && (
              <NavigationMenuItem>
                <Button asChild variant="outline">
                  <Link href="/teacher">Teacher Dashboard</Link>
                </Button>
              </NavigationMenuItem>
            )}

            {role === "dean" && (
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
