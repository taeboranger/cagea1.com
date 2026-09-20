"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Roadtrip } from "@/lib/roadtrip-types";

export default function TripForm({ trip, onCancel, onSaved }: {
  trip?: Roadtrip; onCancel?: () => void; onSaved?: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(trip?.title ?? "");
  const [memo, setMemo] = useState(trip?.memo ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  async function submit(remove = false) {
    setPending(true); setError("");
    try {
      const response = await fetch("/api/roadtrip/trips" + (trip ? "/" + trip.id : ""), {
        method: remove ? "DELETE" : trip ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: remove ? undefined : JSON.stringify({ title, memo }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (remove) router.push("/roadtrip");
      else if (!trip) router.push("/roadtrip/" + result.id);
      else onSaved?.();
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "저장하지 못했습니다. 다시 시도해주세요.");
    } finally { setPending(false); }
  }
  return <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="space-y-6">
    <fieldset disabled={pending} className="space-y-6 disabled:opacity-60">
      <label className="block text-xs text-ink-soft">여행 제목
        <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={100} placeholder="예: 제주에서 보낸 여름"
          className="mt-2 w-full border-b border-line bg-transparent py-3 font-serif text-lg text-ink outline-none focus:border-accent" />
      </label>
      <label className="block text-xs text-ink-soft">여행 메모 <span className="text-mist">(선택)</span>
        <textarea value={memo} onChange={(event) => setMemo(event.target.value)} maxLength={2000} rows={4} placeholder="어디로, 누구와 떠난 여행인가요?"
          className="mt-2 w-full resize-y border border-line bg-transparent p-3 text-sm leading-7 text-ink outline-none focus:border-accent" />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="border border-ink bg-ink px-6 py-3 text-sm text-paper hover:opacity-85">{pending ? "저장 중…" : trip ? "여행 정보 저장" : "여행 만들기"}</button>
        <button type="button" onClick={() => onCancel ? onCancel() : router.push("/roadtrip")} className="text-sm text-ink-soft hover:text-accent">취소</button>
      </div>
      {trip && <div className="border-t border-line pt-4">
        {!confirmDelete ? <button type="button" onClick={() => setConfirmDelete(true)} className="text-xs text-mist hover:text-accent">여행 삭제</button>
          : <div className="space-y-3 text-sm leading-7">
            <p className="text-ink-soft">이 여행과 포함된 모든 사진·메모를 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.</p>
            <button type="button" onClick={() => void submit(true)} className="mr-5 text-accent">여행과 사진 모두 삭제</button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="text-ink-soft">삭제 취소</button>
          </div>}
      </div>}
    </fieldset>
    {error && <p role="alert" className="text-sm text-accent">{error}</p>}
  </form>;
}