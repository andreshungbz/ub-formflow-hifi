import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, Download, Send } from "lucide-react";
import { formsConfig } from "@/lib/forms";

export default function Home() {
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

          <Accordion
            type="single"
            collapsible
            className="mt-6 flex flex-col gap-4"
          >
            {formsConfig.map((form) => (
              <AccordionItem
                key={form.id}
                value={form.id}
                className="overflow-hidden rounded-2xl border border-[#fbd4b1] bg-[#fff8ef] px-4 last:border last:border-[#fbd4b1]"
              >
                <AccordionTrigger className="gap-4 rounded-2xl px-2 py-4 text-base font-semibold text-[#322f3d] hover:no-underline cursor-pointer">
                  <div className="flex w-full items-center gap-4">
                    <span className="flex size-10 items-center justify-center rounded-full bg-white text-[#f17433]">
                      <AlertCircle className="size-5" aria-hidden="true" />
                    </span>
                    <div className="flex flex-1 flex-col text-left">
                      <span>{form.title}</span>
                      <span className="mt-1 flex items-center gap-2 text-sm font-normal text-[#6f6c80]">
                        <Calendar className="size-4" aria-hidden="true" />
                        Due: {form.dueDate}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2 text-[#4e4b5c]">
                  <p>{form.description}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      asChild
                      className="bg-[#7c3090] text-white hover:bg-[#6c2780]"
                    >
                      <Link href={`/submit?form=${form.id}`}>
                        <Send className="size-4" aria-hidden="true" />
                        Submit Form
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="border-[#f17433] text-[#f17433] hover:bg-[#ffe6d7]"
                    >
                      <Link
                        href={form.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="size-4" aria-hidden="true" />
                        Download PDF
                      </Link>
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </div>
  );
}
