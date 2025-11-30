"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Download,
  FileText,
  GraduationCap,
  LogOut,
  Stethoscope,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

// Mock data for forms
const formsData = [
  {
    id: "transcript",
    title: "Transcript Request Form",
    description: "Request official transcripts",
    category: "Academic Forms",
    icon: FileText,
    downloadUrl: "/forms/transcript-request.pdf",
  },
  {
    id: "program-completion",
    title: "Application for Program Completion",
    description: "Apply for graduation and program completion",
    category: "Academic Forms",
    icon: GraduationCap,
    downloadUrl: "/forms/program-completion.pdf",
  },
  {
    id: "deferred-exam",
    title: "Deferred Exam Application",
    description: "Apply to defer a final exam",
    category: "Academic Forms",
    icon: FileText,
    downloadUrl: "/forms/deferred-exam.pdf",
  },
  {
    id: "program-change",
    title: "Program Change Form",
    description: "Request to change your major or minor",
    category: "Academic Forms",
    icon: FileText,
    downloadUrl: "/forms/program-change.pdf",
  },
  {
    id: "som-application",
    title: "SOM Application",
    description: "School of Medicine application form",
    category: "Admissions",
    icon: Stethoscope,
    downloadUrl: "/forms/som-application.pdf",
  },
  {
    id: "undergrad-application",
    title: "Undergrad Application",
    description: "Undergraduate admission application",
    category: "Admissions",
    icon: UserPlus,
    downloadUrl: "/forms/undergrad-application.pdf",
  },
  {
    id: "withdrawal",
    title: "Withdrawal Form",
    description: "Withdraw from courses or university",
    category: "Academic Forms",
    icon: LogOut,
    downloadUrl: "/forms/withdrawal-form.pdf",
  },
  {
    id: "withdrawal-late",
    title: "Late Withdrawal Form",
    description: "Request for late withdrawal from courses",
    category: "Academic Forms",
    icon: AlertCircle,
    downloadUrl: "/forms/withdrawal-late.pdf",
  },
];

const categories = ["All Categories", "Academic Forms", "Admissions"];

export default function FormsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Categories");

  const filteredForms = formsData.filter((form) => {
    const matchesSearch =
      form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "All Categories" || form.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-[#f7f6fb] min-h-screen p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-black">All Forms</h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search forms..."
            className="pl-10 bg-gray-200 border-none shadow-none text-base h-12 placeholder:text-gray-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <Button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-full px-6 transition-colors ${
                activeCategory === category
                  ? "bg-[#7c3090] text-white hover:bg-[#6c2780]"
                  : "bg-white text-black border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Forms List */}
        <div className="space-y-4">
          {filteredForms.map((form, index) => (
            <div
              key={form.id}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                    index % 2 === 0
                      ? "bg-[#7c3090]/10 text-[#7c3090]"
                      : "bg-[#fec630]/10 text-[#fec630]"
                  }`}
                >
                  <form.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{form.title}</h3>
                  <p className="text-sm text-gray-500">{form.description}</p>
                </div>
              </div>
              <Button variant="outline" className="gap-2" asChild>
                <Link
                  href={form.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Link>
              </Button>
            </div>
          ))}

          {filteredForms.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No forms found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
