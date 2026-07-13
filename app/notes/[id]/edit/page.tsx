import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getNote } from "@/lib/notes";
import NoteForm from "@/components/NoteForm";

export const metadata: Metadata = {
  title: "메모 편집 — cagea1.com",
};

export default async function EditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAuth(`/notes/${id}/edit`);

  const note = await getNote(id);
  if (!note) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10">
      <h1 className="mb-10 font-serif text-2xl text-ink">메모 편집</h1>
      <NoteForm note={note} />
    </div>
  );
}
