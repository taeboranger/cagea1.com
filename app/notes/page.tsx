import type { Metadata } from "next";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { getNotes } from "@/lib/notes";
import { deleteNoteAction } from "@/app/actions/notes";

export const metadata: Metadata = {
  title: "메모 — cagea1.com",
};

export default async function NotesPage() {
  const authed = await isAuthenticated();
  const notes = await getNotes(authed);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10">
      <div className="mb-10 flex items-center justify-between gap-6">
        <h1 className="font-serif text-3xl text-ink">메모</h1>
        {authed && (
          <Link
            href="/notes/new"
            className="shrink-0 border border-line px-4 py-2 font-sans text-sm text-ink-soft transition-colors hover:border-accent hover:text-accent"
          >
            새 메모
          </Link>
        )}
      </div>

      {notes.length === 0 ? (
        <p className="font-sans text-sm text-ink-soft">
          아직 작성된 메모가 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-6">
          {notes.map((note) => (
            <li key={note.id} className="border border-line p-5">
              <div className="mb-3 flex items-center justify-between gap-4">
                <span
                  className={`font-sans text-xs ${
                    note.visibility === "private"
                      ? "text-accent"
                      : "text-mist"
                  }`}
                >
                  {note.visibility === "private" ? "비공개" : "공개"} ·{" "}
                  {new Date(note.createdAt).toLocaleDateString("ko-KR")}
                </span>
                {authed && (
                  <div className="flex shrink-0 items-center gap-3">
                    <Link
                      href={`/notes/${note.id}/edit`}
                      className="font-sans text-xs text-ink-soft transition-colors hover:text-accent"
                    >
                      편집
                    </Link>
                    <form action={deleteNoteAction.bind(null, note.id)}>
                      <button
                        type="submit"
                        className="font-sans text-xs text-mist transition-colors hover:text-accent"
                      >
                        삭제
                      </button>
                    </form>
                  </div>
                )}
              </div>
              <p className="whitespace-pre-line font-sans text-sm leading-relaxed text-ink">
                {note.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
