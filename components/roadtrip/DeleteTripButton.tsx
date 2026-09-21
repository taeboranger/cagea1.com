"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function DeleteTripButton({ id, title, photoCount, disabled = false }: {
  id: string; title: string; photoCount: number; disabled?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    if (pending) return;
    setPending(true); setError("");
    try {
      const response = await fetch("/api/roadtrip/trips/" + id, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      dialog.current?.close();
      if (pathname === "/roadtrip/" + id) router.replace("/roadtrip");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "삭제하지 못했습니다. 다시 시도해주세요.");
    } finally { setPending(false); }
  }
  return <>
    <button type="button" disabled={disabled || pending} onClick={() => { setError(""); dialog.current?.showModal(); }}
      className="border border-line px-4 py-2.5 text-sm text-ink-soft transition-colors hover:border-accent hover:text-accent disabled:opacity-50">여행 삭제</button>
    <dialog ref={dialog} aria-label="여행 삭제 확인" onCancel={(event) => { if (pending) event.preventDefault(); }}
      className="fixed inset-0 m-auto w-[calc(100%-3rem)] max-w-md border border-line bg-paper-raised p-6 text-ink backdrop:bg-black/40">
      <h2 className="font-serif text-xl">여행을 삭제할까요?</h2>
      <p className="mt-4 break-words text-sm leading-7 text-ink-soft">‘{title}’과 사진 {photoCount}장, 메모가 영구 삭제됩니다.</p>
      <div className="mt-6 flex flex-wrap gap-4">
        <button type="button" disabled={pending} onClick={() => dialog.current?.close()} autoFocus className="border border-line px-4 py-2 text-sm disabled:opacity-50">삭제 취소</button>
        <button type="button" disabled={pending} onClick={() => void remove()} className="border border-accent bg-accent px-4 py-2 text-sm text-paper disabled:opacity-50">{pending ? "삭제 중…" : "여행과 사진 모두 삭제"}</button>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-accent">{error}</p>}
    </dialog>
  </>;
}