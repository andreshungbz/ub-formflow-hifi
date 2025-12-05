"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Eye,
  Download,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

type FormType = {
  name: string | null;
};

type Submission = {
  id: string;
  submission_number: string | null;
  status: string;
  submitted_at: string;
  form_types: FormType | null;
};

type SubmissionQueryResult = Omit<Submission, "form_types"> & {
  form_types: FormType | FormType[] | null;
};

export default function HistoryPage() {
  const { user, studentId } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  useEffect(() => {
    if (!user) return;

    const fetchSubmissions = async () => {
      try {
        const { data, error } = await supabase
          .from("form_submissions")
          .select(
            `
            id,
            submission_number,
            status,
            submitted_at,
            form_types (
              name
            )
          `
          )
          .eq("student_id", user.id)
          .order("submitted_at", { ascending: false });

        if (error) throw error;
        const typedData = (data as SubmissionQueryResult[]) ?? [];
        const normalized = typedData.map((sub) => ({
          ...sub,
          form_types: Array.isArray(sub.form_types)
            ? sub.form_types[0] ?? null
            : sub.form_types ?? null,
        }));
        setSubmissions(normalized);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [user, supabase]);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "approved":
        return {
          label: "Completed",
          icon: CheckCircle,
          color: "text-green-600",
          bg: "bg-green-50",
        };
      case "rejected":
        return {
          label: "Rejected",
          icon: XCircle,
          color: "text-red-600",
          bg: "bg-red-50",
        };
      default:
        return {
          label: "In Progress",
          icon: Clock,
          color: "text-blue-600",
          bg: "bg-blue-50",
        };
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const { label: statusLabel } = getStatusDisplay(sub.status);
    const matchesSearch =
      (sub.form_types?.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (sub.submission_number || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All Status" || statusLabel === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="bg-[#f7f6fb] min-h-screen p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7c3090]"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#f7f6fb] min-h-screen p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <h1 className="text-3xl font-bold text-black">Form History</h1>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by form name or confirmation number..."
            className="pl-10 bg-gray-50 border-none shadow-sm text-base h-12 placeholder:text-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-3">
          {["All Status", "Completed", "In Progress", "Rejected"].map(
            (status) => (
              <Button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-md px-6 transition-colors ${
                  statusFilter === status
                    ? "bg-[#7c3090] text-white hover:bg-[#6c2780]"
                    : "bg-white text-black border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {status}
              </Button>
            )
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
          <Table className="table-fixed min-w-[1000px]">
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="w-[200px] font-semibold text-gray-900">
                  Status
                </TableHead>
                <TableHead className="w-[250px] font-semibold text-gray-900">
                  Form Name
                </TableHead>
                <TableHead className="w-[180px] font-semibold text-gray-900">
                  Confirmation Number
                </TableHead>
                <TableHead className="w-[150px] font-semibold text-gray-900">
                  Submitted Date
                </TableHead>
                <TableHead className="w-[200px] text-right font-semibold text-gray-900">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-gray-500"
                  >
                    No submissions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((sub) => {
                  const {
                    label,
                    icon: Icon,
                    color,
                  } = getStatusDisplay(sub.status);
                  return (
                    <TableRow key={sub.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className={`flex items-center gap-2 ${color}`}>
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-700">
                        {sub.form_types?.name}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {sub.submission_number}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {new Date(sub.submitted_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 h-9"
                            asChild
                          >
                            <Link href={`/history/${sub.id}`}>
                              <Eye className="h-4 w-4" />
                              View
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 h-9 text-[#7c3090] border-[#7c3090]/30 hover:bg-[#7c3090]/10"
                            asChild
                          >
                            <a
                              href={`/api/receipt?studentId=${
                                studentId || "N/A"
                              }&formName=${encodeURIComponent(
                                sub.form_types?.name || "Form"
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="h-4 w-4" />
                              Receipt
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
