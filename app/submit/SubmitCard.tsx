"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { FormConfig } from "@/lib/forms";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  UploadCloud,
} from "lucide-react";

const FILE_HELPER_TEXT = "Upload a completed PDF, PNG, or JPG file (10MB max).";

type SubmitCardProps = {
  formMeta: FormConfig;
};

export default function SubmitCard({ formMeta }: SubmitCardProps) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleFiles = (files?: FileList | null) => {
    if (!files?.length) {
      return;
    }

    const file = files[0];
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
    const lowerName = file.name.toLowerCase();
    const hasAllowedExtension = [".pdf", ".png", ".jpg", ".jpeg"].some((ext) =>
      lowerName.endsWith(ext)
    );
    const isAllowed = allowedTypes.includes(file.type) || hasAllowedExtension;

    if (!isAllowed) {
      setSelectedFile(null);
      setStatus("error");
      setMessage("Only PDF, PNG, or JPG files are allowed.");
      return;
    }

    setSelectedFile(file);
    setMessage(null);
    setStatus("idle");
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  const onDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setStatus("error");
      setMessage("Please add a file before uploading.");
      return;
    }

    setStatus("success");
    setMessage(`${selectedFile.name} was uploaded successfully.`);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setStatus("idle");
    setMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadButtonClasses = selectedFile
    ? "bg-[#7c3090] hover:bg-[#6d2880]"
    : "bg-[#b493ff] hover:bg-[#a078f8]";

  return (
    <Card className="rounded-3xl border-none bg-white shadow-[0_30px_80px_-40px_rgba(88,31,148,0.7)]">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-semibold text-[#2b1b3f]">
          {formMeta.title}
        </CardTitle>
        <CardDescription className="text-base text-[#6f6c80]">
          Download the PDF, complete it, then upload the finished copy.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        <section className="space-y-2">
          <Label className="text-sm font-semibold text-[#322f3d]">
            Download the Form PDF
          </Label>
          <div className="flex flex-col gap-4 rounded-2xl border border-[#ebe6f5] bg-[#fbfaff] p-5 shadow-inner sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-dashed border-[#d1c4f3] bg-white px-4 py-3 font-medium text-[#4e4b5c]">
              <FileText className="text-[#7c3090]" aria-hidden="true" />
              <span>{formMeta.fileName}</span>
            </div>
            <Button
              asChild
              className="w-full gap-2 rounded-2xl bg-[#7c3090] px-6 py-5 text-base font-semibold text-white hover:bg-[#6d2880] sm:w-auto"
            >
              <Link
                href={formMeta.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="size-5" aria-hidden="true" />
                Download
              </Link>
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <Label className="text-sm font-semibold text-[#322f3d]">
            Upload the completed form
          </Label>
          <label
            htmlFor={fileInputId}
            onDrop={onDrop}
            onDragOver={onDragOver}
            className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-[#c9c4d9] bg-white/80 px-6 py-16 text-center text-[#4e4b5c] transition hover:border-[#a998ce]"
          >
            <UploadCloud
              className="size-12 text-[#b493ff]"
              aria-hidden="true"
            />
            <div>
              <p className="text-lg font-semibold text-[#322f3d]">
                Drag and drop files here
              </p>
              <p className="text-sm text-[#787486]">
                {selectedFile ? selectedFile.name : FILE_HELPER_TEXT}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-[#b493ff] text-[#7c3090] hover:bg-[#f3ebff]"
              onClick={(event) => {
                event.preventDefault();
                openFileDialog();
              }}
            >
              Add File
            </Button>
          </label>
          <input
            id={fileInputId}
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            className="sr-only"
            onChange={(event) => handleFiles(event.target.files)}
          />
        </section>

        {message && (
          <div
            role="status"
            className={cn(
              "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium",
              status === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            )}
          >
            {status === "success" ? (
              <CheckCircle2 className="size-5" aria-hidden="true" />
            ) : (
              <AlertTriangle className="size-5" aria-hidden="true" />
            )}
            <span>{message}</span>
          </div>
        )}

        <section>
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-left text-red-700">
            <AlertTriangle className="size-6 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">
                Submit by {formMeta.dueDate}
              </p>
              <p className="text-xs text-red-600">
                Late uploads may prevent processing of your request.
              </p>
            </div>
          </div>
        </section>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 border-t border-[#f3f1f7] pt-6 sm:flex-row">
        <Button
          variant="outline"
          className="w-full rounded-2xl border-[#d7d3e6] text-[#4e4b5c] hover:bg-[#f5f2ff] sm:w-40"
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button
          className={cn(
            "w-full flex-1 rounded-2xl py-5 text-base font-semibold text-white",
            uploadButtonClasses,
            selectedFile ? "" : "disabled:opacity-60"
          )}
          onClick={handleUpload}
          disabled={!selectedFile}
        >
          Upload
        </Button>
      </CardFooter>
    </Card>
  );
}
