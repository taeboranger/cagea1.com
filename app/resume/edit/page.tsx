import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { getResume } from "@/lib/resume";
import ResumeEditorForm from "@/components/ResumeEditorForm";

export const metadata: Metadata = {
  title: "이력서 편집 — cagea1.com",
};

export default async function ResumeEditPage() {
  await requireAuth("/resume/edit");
  const resume = await getResume();

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10">
      <h1 className="mb-10 font-serif text-2xl text-ink">이력서 편집</h1>
      <ResumeEditorForm resume={resume} />
    </div>
  );
}
