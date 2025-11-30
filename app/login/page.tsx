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

export default function LoginCard() {
  return (
    <div className="flex flex-1 bg-background p-4 justify-center sm:justify-center sm:items-center min-h-[calc(100vh-8rem)]">
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
          <form className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input id="studentId" type="text" placeholder="123456" required />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="text-sm underline-offset-4 hover:underline"
                ></a>
              </div>
              <Input id="password" type="password" required />
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full">
            Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
