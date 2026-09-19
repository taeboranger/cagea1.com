"use client";

import Image from "next/image";
import { useState } from "react";
import { isCoordinates, type Coordinates, type RoadtripPhoto } from "@/lib/roadtrip-types";

export default function PhotoDetails({ photo, authed, draft, picking, onPickMode, onDraft, onSaved, onDeleted }: {
  photo: RoadtripPhoto; authed: boolean; draft: Coordinates | null; picking: boolean;
  onPickMode: (value: boolean) => void; onDraft: (value: Coordinates | null) => void;
  onSaved: (photo: RoadtripPhoto) => void; onDeleted: (id: string) => void;
}) {
  const [memo, setMemo] = useState(photo.memo);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [coordinateText, setCoordinateText] = useState({ lat: String(photo.location?.lat ?? ""), lng: String(photo.location?.lng ?? "") });
  const fields = picking && draft ? { lat: String(draft.lat), lng: String(draft.lng) } : coordinateText;
  async function save(remove: boolean) {
    setError("");
    let location = draft;
    if (!picking) {
      const { lat, lng } = coordinateText;
      location = lat.trim() === "" && lng.trim() === "" ? null : { lat: Number(lat), lng: Number(lng) };
      if (!remove && location && (!lat.trim() || !lng.trim() || !isCoordinates(location))) { setError("위도와 경도를 모두 올바르게 입력해주세요."); return; }
    }
    setPending(true);
    try {
      const response = await fetch("/api/roadtrip/" + photo.id, {
        method: remove ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" }, body: remove ? undefined : JSON.stringify({ memo, location }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (remove) onDeleted(photo.id);
      else { onSaved(result); onPickMode(false); setCoordinateText({ lat: String(result.location?.lat ?? ""), lng: String(result.location?.lng ?? "") }); }
    } catch (error) { setError(error instanceof Error ? error.message : "저장하지 못했습니다. 다시 시도해주세요."); }
    finally { setPending(false); }
  }
  return <section className="border border-line bg-paper-raised" aria-label="사진 상세">
    <a href={photo.url} target="_blank" rel="noreferrer" className="block" aria-label="사진 크게 보기">
      <Image src={photo.url} alt={photo.memo || photo.originalName} width={photo.width} height={photo.height} className="max-h-80 w-full object-contain" sizes="(min-width: 1024px) 320px, 90vw" />
    </a>
    <div className="space-y-5 p-5">
      <div>
        <p className="text-xs tracking-wider text-mist">{new Date(photo.takenAt ?? photo.createdAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric" })}</p>
        <h2 className="mt-2 break-words font-serif text-lg text-ink">{photo.originalName}</h2>
      </div>
      {authed ? <form onSubmit={(event) => { event.preventDefault(); void save(false); }} className="space-y-4">
        <fieldset disabled={pending} className="space-y-4 disabled:opacity-60">
          <div>
            <label htmlFor="photo-memo" className="text-xs text-ink-soft">이 순간의 메모</label>
            <textarea id="photo-memo" value={memo} onChange={(event) => setMemo(event.target.value)} maxLength={2000} rows={4} placeholder="기억하고 싶은 이야기를 남겨주세요."
              className="mt-2 w-full resize-y border border-line bg-transparent p-3 text-sm leading-6 outline-none focus:border-accent" />
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-ink-soft">사진의 위치</span>
              <button type="button" onClick={() => {
                if (picking) { setCoordinateText({ lat: String(draft?.lat ?? ""), lng: String(draft?.lng ?? "") }); }
                else { const position = { lat: Number(coordinateText.lat), lng: Number(coordinateText.lng) }; onDraft(coordinateText.lat && coordinateText.lng && isCoordinates(position) ? position : null); }
                onPickMode(!picking);
              }} className="text-xs text-accent underline-offset-4 hover:underline">{picking ? "직접 입력" : "지도에서 지정"}</button>
            </div>
            {picking && <p className="mt-2 text-xs leading-5 text-accent">지도에서 촬영한 장소를 눌러주세요. 저장하면 반영됩니다.</p>}
            <div className="mt-2 grid grid-cols-2 gap-3">
              <label className="text-xs text-mist">위도
                <input aria-label="위도" type="number" step="any" min={-90} max={90} value={fields.lat} readOnly={picking}
                  onChange={(event) => setCoordinateText({ ...coordinateText, lat: event.target.value })}
                  className="mt-1 w-full border-b border-line bg-transparent py-2 text-sm text-ink outline-none focus:border-accent" />
              </label>
              <label className="text-xs text-mist">경도
                <input aria-label="경도" type="number" step="any" min={-180} max={180} value={fields.lng} readOnly={picking}
                  onChange={(event) => setCoordinateText({ ...coordinateText, lng: event.target.value })}
                  className="mt-1 w-full border-b border-line bg-transparent py-2 text-sm text-ink outline-none focus:border-accent" />
              </label>
            </div>
            {(fields.lat || fields.lng) && <button type="button" onClick={() => { onDraft(null); setCoordinateText({ lat: "", lng: "" }); onPickMode(false); }} className="mt-2 text-xs text-mist hover:text-accent">위치 지우기</button>}
          </div>
          <button type="submit" className="w-full border border-ink bg-ink px-4 py-2.5 text-sm text-paper hover:opacity-85">{pending ? "저장 중…" : "변경사항 저장"}</button>
          <button type="button" onClick={() => setConfirmDelete(true)} className="text-xs text-mist hover:text-accent">사진 삭제</button>
          {confirmDelete && <div className="border-t border-line pt-3 text-xs leading-6">
            <p>이 사진과 메모를 삭제할까요?</p>
            <div className="mt-2 flex gap-4"><button type="button" onClick={() => void save(true)} className="text-accent">삭제하기</button><button type="button" onClick={() => setConfirmDelete(false)}>취소</button></div>
          </div>}
        </fieldset>
        {error && <p role="alert" className="text-sm text-accent">{error}</p>}
      </form> : <>
        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-ink-soft">{photo.memo || "이 순간에는 아직 메모가 없습니다."}</p>
        <p className="text-xs text-mist">{photo.location ? photo.location.lat.toFixed(5) + ", " + photo.location.lng.toFixed(5) : "위치 정보가 없는 사진"}</p>
      </>}
      {photo.location && <a href={"https://www.google.com/maps/search/?api=1&query=" + photo.location.lat + "," + photo.location.lng} target="_blank" rel="noreferrer" className="inline-block text-xs text-ink-soft underline underline-offset-4">Google 지도에서 열기 ↗</a>}
    </div>
  </section>;
}