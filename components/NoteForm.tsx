"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  createNoteAction,
  updateNoteAction,
  type NoteFormState,
} from "@/app/actions/notes";
import type { Note } from "@/lib/notes";

const initialState: NoteFormState = {};

export default function NoteForm({ note }: { note?: Note }) {
  const action = note ? updateNoteAction.bind(null, note.id) : createNoteAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="content" className="text-xs text-ink-soft">
          내용
        </label>
        <textarea
          id="content"
          name="content"
          defaultValue={note?.content}
          required
          rows={8}
          className="w-full resize-y border-b border-line bg-transparent py-2 font-sans text-sm text-ink outline-none transition-colors focus:border-accent"
        />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-sans text-xs text-ink-soft">
          공개 범위
        </legend>
        <label className="flex items-center gap-2 font-sans text-sm text-ink">
          <input
            type="radio"
            name="visibility"
            value="public"
            defaultChecked={!note || note.visibility === "public"}
          />
          공개 — 누구나 볼 수 있습니다
        </label>
        <label className="flex items-center gap-2 font-sans text-sm text-ink">
          <input
            type="radio"
            name="visibility"
            value="private"
            defaultChecked={note?.visibility === "private"}
          />
          비공개 — 로그인했을 때만 보입니다
        </label>
      </fieldset>

      {state?.error && (
        <p className="text-sm text-accent" aria-live="polite">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="border border-ink bg-ink px-6 py-3 font-sans text-sm tracking-wide text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {pending ? "저장 중..." : "저장"}
        </button>
        <Link
          href="/notes"
          className="font-sans text-sm text-ink-soft transition-colors hover:text-accent"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
