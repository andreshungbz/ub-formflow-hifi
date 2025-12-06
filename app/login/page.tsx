"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { User } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";

export default function LoginCard() {
  const { login } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await login(email, password);

    if (authError) {
      setError(authError.message || "Invalid email or password.");
      setLoading(false);
      return;
    }

    // Get the current user after login
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (currentUser) {
      // 1. Check if user has a student profile
      const { data: studentProfile } = await supabase
        .from("students")
        .select("id")
        .eq("id", currentUser.id)
        .single();

      if (studentProfile) {
        setTimeout(() => router.push("/"), 800);
        setLoading(false);
        return;
      }

      // 2. If no student profile, check if user has a staff profile
      const { data: staffProfile } = await supabase
        .from("staff")
        .select("id, role")
        .eq("id", currentUser.id)
        .single();

      if (staffProfile) {
        const roleData = staffProfile.role.toLowerCase();

        if (roleData === "registrar") {
          router.push("/registrar");
        } else if (roleData === "dean") {
          router.push("/dean");
        } else if (roleData === "teacher") {
          router.push("/teacher");
        } else if (roleData === "accounts_receivable") {
          router.push("/accounts");
        } else if (roleData === "student") {
          router.push("/history");
        } else {
          router.push("/");
        }
        setLoading(false);
        return;
      }

      // 3. If neither, redirect to create profile
      router.push("/profile/create");
    } else {
      setError("Login successful but user data not found. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-1 bg-background p-4 justify-center items-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center">
          <User className="w-12 h-12 text-ub-purple mb-2" />
          <CardTitle>UB FormFlow Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="grid gap-1">
              <Label htmlFor="email" className="mb-1">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={
                  error
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : ""
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <a
                href="#"
                className="inline w-fit self-end text-sm underline-offset-4 hover:underline"
              >
                Forgot password?
              </a>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <p className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-ub-purple underline hover:text-ub-purple/80 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
