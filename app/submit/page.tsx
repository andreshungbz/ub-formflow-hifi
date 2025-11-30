import { formsConfig } from "@/lib/forms";
import { notFound } from "next/navigation";
import SubmitCard from "./SubmitCard";

type SubmitPageProps = {
  searchParams?: Promise<{
    form?: string | string[];
  }>;
};

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const fallbackForm = formsConfig.at(0);

  if (!fallbackForm) {
    notFound();
  }

  const resolvedSearchParams = (await searchParams) ?? {};

  const selectedFormParam = resolvedSearchParams.form;
  const selectedFormId = Array.isArray(selectedFormParam)
    ? selectedFormParam[0]
    : selectedFormParam;

  const formMeta = selectedFormId
    ? formsConfig.find((form) => form.id === selectedFormId) ?? fallbackForm
    : fallbackForm;

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f6fb]">
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-4xl px-4">
          <SubmitCard formMeta={formMeta} />
        </div>
      </main>
    </div>
  );
}
