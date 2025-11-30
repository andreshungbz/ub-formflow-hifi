import Image from 'next/image';
import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="w-full flex flex-col sm:flex-row items-center px-4 py-3 gap-4">
      {/* UB FormFlow Logo */}
      <div className="text-xl font-bold whitespace-nowrap flex items-center gap-2 shrink-0">
        <Image
          src="/ub-formflow-logo-100x100.svg"
          alt="UB FormFlow Logo"
          width={40}
          height={40}
        />
        <Link href="/">UB FormFlow</Link>
      </div>

      {/* Left-aligned Navigation Menu */}
      <div className="w-full sm:grow flex flex-col items-center sm:items-start">
        <NavigationMenu className="w-full">
          <NavigationMenuList className="flex flex-col sm:flex-row gap-2 w-full">
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle()}
              >
                <Link href="/forms">All Forms</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Login Button */}
      <Button asChild className="self-center sm:self-start">
        <Link href="/login">Login</Link>
      </Button>
    </header>
  );
}
