"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, Download, FileText, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface FormType {
  id: string;
  name: string;
  description: string;
  deadline: string | null;
  template_file: string | null;
  downloadUrl?: string | null;
}

export default function Home() {
  const [upcomingForms, setUpcomingForms] = useState<FormType[]>([]);
  const [yearRoundForms, setYearRoundForms] = useState<FormType[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const now = new Date();
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const upcomingPromise = supabase
          .from("form_types")
          .select("*")
          .not("deadline", "is", null)
          .gte("deadline", now.toISOString())
          .lte("deadline", nextMonth.toISOString())
          .order("deadline", { ascending: true });

        const yearRoundPromise = supabase
          .from("form_types")
          .select("*")
          .is("deadline", null)
          .order("name", { ascending: true });

        const [upcomingResult, yearRoundResult] = await Promise.all([
          upcomingPromise,
          yearRoundPromise,
        ]);

        if (upcomingResult.error) throw upcomingResult.error;
        if (yearRoundResult.error) throw yearRoundResult.error;

        const withDownloadUrl = (formsData: FormType[]) =>
          (formsData || []).map((form) => {
            let downloadUrl = null;
            if (form.template_file) {
              const { data: urlData } = supabase.storage
                .from("form-attachments")
                .getPublicUrl(form.template_file);
              downloadUrl = urlData.publicUrl;
            }
            return { ...form, downloadUrl };
          });

        setUpcomingForms(withDownloadUrl(upcomingResult.data || []));
        setYearRoundForms(withDownloadUrl(yearRoundResult.data || []));
      } catch (error) {
        console.error("Error fetching forms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [supabase]);

  const handleSubmit = (formId: string) => {
    if (!user) {
      router.push("/login");
    } else {
      router.push(`/forms/submit/${formId}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#f7f6fb] py-16 flex-1 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7c3090]"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#f7f6fb] py-16 flex-1">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 text-center">
        <div className="space-y-4">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#581F94]">
            UB FormFlow
          </p>
          <h1 className="text-4xl font-semibold text-[#7c3090] md:text-5xl">
            Your forms. On-time. Hassle-free.
          </h1>
          <p className="text-lg text-[#6f6c80]">Submit a form online today.</p>
        </div>

        <section className="rounded-3xl border border-[#f0eaff] bg-white p-6 text-left shadow-[0_20px_60px_-30px_rgba(124,48,144,0.5)] md:p-10">
          <h2 className="text-xl font-semibold text-[#7c3090]">
            Upcoming Form Deadlines
          </h2>

          {upcomingForms.length === 0 ? (
            <p className="mt-6 text-gray-500">No upcoming deadlines found.</p>
          ) : (
            <Accordion
              type="single"
              collapsible
              className="mt-6 flex flex-col gap-4"
            >
              {upcomingForms.map((form) => (
                <AccordionItem
                  key={form.id}
                  value={form.id}
                  className="overflow-hidden rounded-2xl border border-[#fbd4b1] bg-[#fff8ef] px-4 last:border last:border-[#fbd4b1]"
                >
                  <AccordionTrigger className="gap-4 rounded-2xl px-2 py-4 text-base font-semibold text-[#322f3d] hover:no-underline cursor-pointer">
                    <div className="flex w-full items-center gap-4">
                      <span className="flex size-10 items-center justify-center rounded-full bg-[#fff0e4] text-[#f17433]">
                        <AlertCircle className="size-5" aria-hidden="true" />
                      </span>
                      <div className="flex flex-1 flex-col text-left">
                        <span>{form.name}</span>
                        {form.deadline && (
                          <span className="mt-1 flex items-center gap-2 text-sm font-normal text-[#6f6c80]">
                            <Calendar className="size-4" aria-hidden="true" />
                            Due:{" "}
                            {new Date(form.deadline).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2 text-[#4e4b5c]">
                    <p>{form.description}</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button
                        onClick={() => handleSubmit(form.id)}
                        className="bg-[#7c3090] text-white hover:bg-[#6c2780]"
                      >
                        <Send className="size-4 mr-2" aria-hidden="true" />
                        Submit Form
                      </Button>

                      {form.template_file && (
                        <Button
                          asChild
                          variant="outline"
                          className="border-[#f17433] text-[#f17433] hover:bg-[#ffe6d7]"
                        >
                          <a
                            href={
                              form.downloadUrl ||
                              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/form-attachments/${form.template_file}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download
                              className="size-4 mr-2"
                              aria-hidden="true"
                            />
                            Download Form
                          </a>
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </section>

        <section className="rounded-3xl border border-[#f0eaff] bg-white p-6 text-left shadow-[0_20px_60px_-30px_rgba(124,48,144,0.5)] md:p-10">
          <h2 className="text-xl font-semibold text-[#7c3090]">
            Year-Round Forms
          </h2>

          {yearRoundForms.length === 0 ? (
            <p className="mt-6 text-gray-500">
              No year-round forms are available right now.
            </p>
          ) : (
            <Accordion
              type="single"
              collapsible
              className="mt-6 flex flex-col gap-4"
            >
              {yearRoundForms.map((form) => (
                <AccordionItem
                  key={form.id}
                  value={`year-round-${form.id}`}
                  className="overflow-hidden rounded-2xl border border-[#dcd4ff] bg-[#f9f7ff] px-4 last:border last:border-[#dcd4ff]"
                >
                  <AccordionTrigger className="gap-4 rounded-2xl px-2 py-4 text-base font-semibold text-[#332d4d] hover:no-underline cursor-pointer">
                    <div className="flex w-full items-center gap-4">
                      <span className="flex size-10 items-center justify-center rounded-full bg-[#ebe7ff] text-[#5a3fd3]">
                        <FileText className="size-5" aria-hidden="true" />
                      </span>
                      <div className="flex flex-1 flex-col text-left">
                        <span>{form.name}</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2 text-[#4e4b5c]">
                    <p>{form.description}</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button
                        onClick={() => handleSubmit(form.id)}
                        className="bg-[#7c3090] text-white hover:bg-[#6c2780]"
                      >
                        <Send className="size-4 mr-2" aria-hidden="true" />
                        Submit Form
                      </Button>
                      {form.template_file && (
                        <Button
                          asChild
                          variant="outline"
                          className="border-[#5a3fd3] text-[#5a3fd3] hover:bg-[#ede9ff]"
                        >
                          <a
                            href={
                              form.downloadUrl ||
                              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/form-attachments/${form.template_file}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download
                              className="size-4 mr-2"
                              aria-hidden="true"
                            />
                            Download Form
                          </a>
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </section>
      </div>
    </div>
  );
}
