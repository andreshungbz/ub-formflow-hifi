"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, FileText, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Map category IDs to names (assuming 1 and 2 based on user's previous mock data)
const CATEGORY_MAP: Record<number, string> = {
  1: "Academic Forms",
  2: "Admissions",
  3: "Financial",
  4: "Withdrawal",
};

interface FormType {
  id: string;
  name: string;
  description: string;
  category: number | string | null;
  tags: string[] | null;
  template_file: string | null;
  downloadUrl?: string | null;
}

export default function FormsPage() {
  const [forms, setForms] = useState<FormType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const { data, error } = await supabase
          .from("form_types")
          .select("*")
          .eq("is_active", true);

        if (error) throw error;

        // Use public URLs for templates (synchronous, no extra API calls)
        const formsWithUrls = (data || []).map((form) => {
          let downloadUrl = null;
          if (form.template_file) {
            const { data: publicData } = supabase.storage
              .from("form-attachments")
              .getPublicUrl(form.template_file);
            downloadUrl = publicData.publicUrl;
          }
          return { ...form, downloadUrl };
        });

        setForms(formsWithUrls);
      } catch (error) {
        console.error("Error fetching forms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [supabase]);

  // Get unique tags from fetched forms
  const availableCategories = [
    "All Categories",
    ...Array.from(new Set(forms.flatMap((f) => f.tags || []))).sort(),
  ];

  const filteredForms = forms.filter((form) => {
    const formTags = form.tags || [];
    const matchesSearch =
      form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (form.description &&
        form.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      activeCategory === "All Categories" || formTags.includes(activeCategory);

    return matchesSearch && matchesCategory;
  });

  const handleCardClick = (formId: string) => {
    router.push(`/forms/submit/${formId}`);
  };

  if (loading) {
    return (
      <div className="bg-[#f7f6fb] min-h-screen p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7c3090]"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#f7f6fb] min-h-screen p-4 sm:p-8">
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
            className="pl-10 bg-gray-50 border-none shadow-sm text-base h-12 placeholder:text-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-3">
          {availableCategories.map((category) => (
            <Button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-md px-6 transition-colors ${
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
              onClick={() => handleCardClick(form.id)}
              className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md cursor-pointer group gap-4 sm:gap-0"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#7c3090]/10 text-[#7c3090]">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-[#7c3090] transition-colors">
                    {form.name}
                  </h3>
                  <p className="text-sm text-gray-500">{form.description}</p>
                </div>
              </div>

              <div className="flex w-full sm:w-auto gap-2">
                {form.downloadUrl ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 z-10 flex-1 sm:flex-none h-9"
                    asChild
                    onClick={(e) => e.stopPropagation()} // Prevent card click when clicking download
                  >
                    <Link
                      href={form.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    disabled
                    size="sm"
                    className="gap-2 text-gray-400 flex-1 sm:flex-none h-9"
                  >
                    <Download className="h-4 w-4" />
                    Unavailable
                  </Button>
                )}
                <Button
                  asChild
                  size="sm"
                  className="bg-[#7c3090] text-white hover:bg-[#6c2780] gap-2 z-10 flex-1 sm:flex-none h-9"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link href={`/forms/submit/${form.id}`}>Submit Form</Link>
                </Button>
              </div>
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
