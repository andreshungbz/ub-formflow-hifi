export type FormConfig = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  downloadUrl: string;
  fileName: string;
};

export const formsConfig: FormConfig[] = [
  {
    id: "transcript",
    title: "Transcript Request Form",
    description: "Request official transcripts",
    dueDate: "Rolling",
    downloadUrl: "/forms/transcript-request.pdf",
    fileName: "transcript_request.pdf",
  },
  {
    id: "program-completion",
    title: "Application for Program Completion",
    description: "Finalize your records before graduation.",
    dueDate: "September 30, 2025",
    downloadUrl: "/forms/program-completion.pdf",
    fileName: "program_completion.pdf",
  },
  {
    id: "deferred-exam",
    title: "Deferred Exam Application",
    description: "Apply to defer a final exam",
    dueDate: "December 4, 2025",
    downloadUrl: "/forms/deferred-exam.pdf",
    fileName: "deferred_exam.pdf",
  },
  {
    id: "program-change",
    title: "Program Change Form",
    description: "Request to change your major or minor",
    dueDate: "November 28, 2025",
    downloadUrl: "/forms/program-change.pdf",
    fileName: "program_change.pdf",
  },
  {
    id: "som-application",
    title: "UB SoM Application",
    description: "UB School of Medicine application form",
    dueDate: "May 29, 2026",
    downloadUrl: "/forms/som-application.pdf",
    fileName: "som_application.pdf",
  },
  {
    id: "undergrad-application",
    title: "Undergrad Application",
    description: "Undergraduate admission application",
    dueDate: "May 29, 2026",
    downloadUrl: "/forms/undergrad-application.pdf",
    fileName: "undergrad_application.pdf",
  },
  {
    id: "withdrawal",
    title: "Withdrawal Form",
    description: "Withdraw from courses or university",
    dueDate: "October 31, 2025",
    downloadUrl: "/forms/withdrawal-form.pdf",
    fileName: "withdrawal_form.pdf",
  },
  {
    id: "withdrawal-late",
    title: "Late Withdrawal Form",
    description: "Request for late withdrawal from courses",
    dueDate: "November 14, 2025",
    downloadUrl: "/forms/withdrawal-late.pdf",
    fileName: "withdrawal_late.pdf",
  },
];
