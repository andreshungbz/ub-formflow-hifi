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
    id: "withdrawal",
    title: "Withdrawal Form",
    description:
      "Tell us you plan to withdraw so we can pause billing, refund payment, and connect you with next steps.",
    dueDate: "November 15, 2025",
    downloadUrl: "/forms/withdrawal-form.pdf",
    fileName: "withdrawal_form_ub.pdf",
  },
  {
    id: "program-completion",
    title: "Application for Program Completion",
    description:
      "Finalize your records before graduation. The application lets advisors verify credits and release your diploma.",
    dueDate: "November 20, 2025",
    downloadUrl: "/forms/program-completion.pdf",
    fileName: "program_completion_form_ub.pdf",
  },
];
