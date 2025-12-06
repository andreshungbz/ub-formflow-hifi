"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function StaffManagementPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
    department: "",
    staffId: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRoleChange = (value: string) => {
    setFormData({ ...formData, role: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // 1. Create Auth User using a secondary client to avoid logging out the current user
      const supabaseAuth = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false, // Don't save this session to local storage
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        }
      );

      const { data: authData, error: authError } =
        await supabaseAuth.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              role: formData.role,
            },
          },
        });

      if (authError) throw authError;
      if (!authData.user)
        throw new Error(
          "Failed to create user. Email confirmation may be required."
        );

      // 2. Insert into staff table using the main authenticated client (Registrar)
      const { error: staffError } = await supabase.from("staff").insert({
        id: authData.user.id, // Link to the Auth User ID
        staff_id: formData.staffId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
        department: formData.department,
      });

      if (staffError) {
        // If staff creation fails, we should probably try to delete the auth user,
        // but we can't do that easily from client side.
        console.error("Staff insert error:", staffError);
        throw new Error(
          `Auth user created, but failed to create staff profile: ${staffError.message}`
        );
      }

      setMessage({
        type: "success",
        text: "Staff member created successfully! (User may need to confirm email)",
      });
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "",
        department: "",
        staffId: "",
      });
    } catch (error) {
      console.error("Error creating staff:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create staff member.";
      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Staff Management
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Create New Staff Member</CardTitle>
          <CardDescription>
            Add a new staff member to the system. This will create a login
            account and a staff profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staffId">Staff ID</Label>
              <Input
                id="staffId"
                value={formData.staffId}
                onChange={handleChange}
                required
                placeholder="e.g. STF-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select onValueChange={handleRoleChange} value={formData.role}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="dean">Dean</SelectItem>
                    <SelectItem value="registrar">Registrar</SelectItem>
                    <SelectItem value="accounts_receivable">
                      Accounts Receivable
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g. Science"
                />
              </div>
            </div>

            {message && (
              <div
                className={`p-4 rounded-md flex items-center gap-2 ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <p className="text-sm">{message.text}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Staff Member"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
