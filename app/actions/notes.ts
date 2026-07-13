"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthAction } from "@/lib/auth";
import {
  addNote,
  deleteNote,
  updateNote,
  type NoteVisibility,
} from "@/lib/notes";

export type NoteFormState = {
  error?: string;
};

function parseVisibility(value: FormDataEntryValue | null): NoteVisibility {
  return value === "private" ? "private" : "public";
}

export async function createNoteAction(
  _prevState: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  await requireAuthAction();

  const content = String(formData.get("content") ?? "").trim();
  if (!content) {
    return { error: "내용을 입력해주세요." };
  }
  const visibility = parseVisibility(formData.get("visibility"));

  await addNote(content, visibility);
  revalidatePath("/notes");
  redirect("/notes");
}

export async function updateNoteAction(
  id: string,
  _prevState: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  await requireAuthAction();

  const content = String(formData.get("content") ?? "").trim();
  if (!content) {
    return { error: "내용을 입력해주세요." };
  }
  const visibility = parseVisibility(formData.get("visibility"));

  await updateNote(id, content, visibility);
  revalidatePath("/notes");
  redirect("/notes");
}

export async function deleteNoteAction(id: string) {
  await requireAuthAction();
  await deleteNote(id);
  revalidatePath("/notes");
}
