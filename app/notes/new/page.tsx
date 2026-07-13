import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import NoteForm from "@/components/NoteForm";

export const metadata: Metadata = {
  title: "새 메모 — cagea1.com",
};

export default async function NewNotePage() {
  await requireAuth("/notes/new");

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10">
      <h1 className="mb-10 font-serif text-2xl text-ink">새 메모</h1>
      <NoteForm />
    </div>
  );
}
