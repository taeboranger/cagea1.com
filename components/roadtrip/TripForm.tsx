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

  async function submit() {
    setPending(true); setError("");
    try {
      const response = await fetch("/api/roadtrip/trips" + (trip ? "/" + trip.id : ""), {
        method: trip ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, memo }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (!trip) router.push("/roadtrip/" + result.id);
      else onSaved?.();
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "저장하지 못했습니다. 다시 시도해주세요.");
    } finally { setPending(false); }
  }
  return <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="space-y-6">
    <fieldset disabled={pending} className="space-y-6 disabled:opacity-60">
      <label className="block text-xs text-ink-soft">여행 제목
        <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={100}
          className="mt-2 w-full border-b border-line bg-transparent py-3 font-serif text-lg text-ink outline-none focus:border-accent" />
      </label>
      <label className="block text-xs text-ink-soft">여행 메모 <span className="text-mist">(선택)</span>
        <textarea value={memo} onChange={(event) => setMemo(event.target.value)} maxLength={2000} rows={4}
          className="mt-2 w-full resize-y border border-line bg-transparent p-3 text-sm leading-7 text-ink outline-none focus:border-accent" />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="border border-ink bg-ink px-6 py-3 text-sm text-paper hover:opacity-85">{pending ? "저장 중…" : trip ? "여행 정보 저장" : "여행 만들기"}</button>
        <button type="button" onClick={() => onCancel ? onCancel() : router.push("/roadtrip")} className="text-sm text-ink-soft hover:text-accent">취소</button>
      </div>
    </fieldset>
    {error && <p role="alert" className="text-sm text-accent">{error}</p>}
  </form>;
}