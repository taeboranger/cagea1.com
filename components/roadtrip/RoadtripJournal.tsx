"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { prepareRoadtripPhoto } from "@/lib/prepareRoadtripPhoto";
import type { Coordinates, RoadtripPhoto, Roadtrip } from "@/lib/roadtrip-types";
import PhotoDetails from "./PhotoDetails";
import TripForm from "./TripForm";
import DeleteTripButton from "./DeleteTripButton";

const RoadtripMap = dynamic(() => import("./RoadtripMap"), {
  ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-mist">지도 로딩 중…</div>,
});
const buttonClass = "border border-line px-4 py-2.5 text-sm text-ink-soft transition-colors hover:border-accent hover:text-accent disabled:opacity-50";
export default function RoadtripJournal({ trip, initialPhotos, authed, apiKey }: { trip: Roadtrip; initialPhotos: RoadtripPhoto[]; authed: boolean; apiKey: string }) {
  const [editingTrip, setEditingTrip] = useState(false);
  const [photos, setPhotos] = useState(initialPhotos);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadMemo, setUploadMemo] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [completed, setCompleted] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<"all" | "unlocated">("all");
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState<Coordinates | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadLock = useRef(false);
  const [memoFocusRequest, setMemoFocusRequest] = useState(0);
  const detailRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const selected = photos.find((photo) => photo.id === selectedId);
  const locatedCount = photos.filter((photo) => photo.location).length;
  const visiblePhotos = filter === "all" ? photos : photos.filter((photo) => !photo.location);

  function selectPhoto(id: string, editMemo = false) {
    setMemoFocusRequest((value) => editMemo ? value + 1 : 0);
    setSelectedId(id); setPicking(false);
    setDraft(photos.find((photo) => photo.id === id)?.location ?? null);
    if (editMemo || window.innerWidth < 1024) setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }
  function addFiles(incoming: File[]) {
    if (uploadLock.current) return;
    setUploadFiles((current) => [...current, ...incoming]);
    setErrors([]);
  }
  async function upload() {
    if (!uploadFiles.length || uploadLock.current) return;
    uploadLock.current = true;
    setBusy(true); setCompleted(0); setErrors([]); setNotice(""); setEditingTrip(false);
    const files = [...uploadFiles];
    const results: ({ photo: RoadtripPhoto } | { error: string })[] = new Array(files.length);
    let nextIndex = 0;
    try {
      async function worker() {
        while (nextIndex < files.length) {
          const index = nextIndex++;
          const original = files[index];
          try {
            const prepared = await prepareRoadtripPhoto(original);
            const form = new FormData();
            form.append("photo", prepared.file);
            form.append("details", JSON.stringify({ tripId: trip.id, location: prepared.location, takenAt: prepared.takenAt, memo: uploadMemo, originalName: original.name }));
            const response = await fetch("/api/roadtrip", { method: "POST", body: form });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            results[index] = { photo: result };
          } catch (error) {
            results[index] = { error: original.name + ": " + (error instanceof Error ? error.message : "업로드에 실패했습니다.") };
          } finally { setCompleted((value) => value + 1); }
        }
      }
      // Bound decoding and network work to avoid exhausting memory on phones.
      await Promise.all(Array.from({ length: Math.min(3, files.length) }, () => worker()));
      const added = results.flatMap((result) => "photo" in result ? [result.photo] : []);
      const failures = results.flatMap((result) => "error" in result ? [result.error] : []);
      setPhotos((current) => [...added, ...current].sort((a, b) => (b.takenAt ?? b.createdAt).localeCompare(a.takenAt ?? a.createdAt)));
      setErrors(failures);
      setUploadFiles(files.filter((_, index) => "error" in results[index]));
      if (added.length) {
        const missing = added.filter((photo) => !photo.location).length;
        setNotice(added.length + "장 저장 완료" + (missing ? " · 위치 없음 " + missing + "장" : ""));
        setSelectedId(added[0].id); setDraft(added[0].location); setPicking(false); setFilter("all"); setMemoFocusRequest(0);
      }
      if (!failures.length) { setShowUpload(false); setUploadMemo(""); }
    } finally {
      uploadLock.current = false;
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }
  return <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
    <Link href="/roadtrip" className="mb-8 inline-block text-xs text-mist hover:text-accent">← 여행 목록</Link>
    <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
      <div>
        <h1 className="break-words font-serif text-3xl text-ink">{trip.title}</h1>
        {trip.memo && <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-ink-soft">{trip.memo}</p>}
      </div>
      {authed ? <div className="flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={() => setEditingTrip(!editingTrip)} className={buttonClass}>여행 정보 수정</button><button type="button" disabled={busy} onClick={() => setShowUpload(!showUpload)} className={buttonClass}>{showUpload ? "업로드 닫기" : "+ 사진 추가"}</button><DeleteTripButton id={trip.id} title={trip.title} photoCount={photos.length} disabled={busy} /></div>
        : <Link href={"/login?from=" + encodeURIComponent("/roadtrip/" + trip.id)} className="text-xs text-mist transition-colors hover:text-accent">로그인</Link>}
    </div>

    {editingTrip && authed && <section aria-label="여행 정보 수정" className="mb-8 border border-line bg-paper-raised p-6"><TripForm trip={trip} onCancel={() => setEditingTrip(false)} onSaved={() => setEditingTrip(false)} /></section>}
    {showUpload && authed && <section className="mb-8 border border-line bg-paper-raised p-5 sm:p-7" aria-label="사진 업로드">
      <form onSubmit={(event) => { event.preventDefault(); void upload(); }} className="space-y-5">
        <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
          <label className="block cursor-pointer border border-dashed border-line px-5 py-7 text-center transition-colors hover:border-accent"
            onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(Array.from(event.dataTransfer.files)); }}>
            <span className="block font-serif text-lg text-ink">사진 선택</span>
            <span className="mt-2 block text-xs leading-6 text-mist">추가 선택·드래그 가능 · JPG, PNG, WebP</span>
            <input ref={inputRef} aria-label="여행 사진 선택" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }}
              className="mt-4 w-full max-w-sm text-xs text-ink-soft file:mr-3 file:border file:border-line file:bg-transparent file:px-3 file:py-2 file:text-ink-soft" />
          </label>
          <p className="text-xs leading-6 text-mist">자동 축소 · 촬영 위치 자동 표시 · 위치 직접 지정 가능</p>
          {uploadFiles.length > 0 && <div className="space-y-2">
            <p className="text-sm text-ink-soft">{uploadFiles.length}장 선택</p>
            <ul aria-label="선택한 사진" className="max-h-48 space-y-1 overflow-y-auto text-xs text-ink-soft">
              {uploadFiles.map((file, index) => <li key={index} className="flex items-center justify-between gap-3 border-b border-line py-2">
                <span className="min-w-0 break-all">{file.name}</span>
                <button type="button" aria-label={file.name + " 선택 취소"} onClick={() => setUploadFiles((current) => current.filter((_, item) => item !== index))} className="shrink-0 px-2 py-1 text-mist hover:text-accent">제외</button>
              </li>)}
            </ul>
          </div>}
          <label className="block text-xs text-ink-soft">메모 <span className="text-mist">(선택 · 모든 사진에 적용)</span>
            <textarea value={uploadMemo} onChange={(event) => setUploadMemo(event.target.value)} maxLength={2000} rows={2}
              className="mt-2 w-full resize-y border-b border-line bg-transparent py-2 text-sm leading-6 text-ink outline-none focus:border-accent" />
          </label>
          <button type="submit" disabled={!uploadFiles.length} className="border border-ink bg-ink px-6 py-3 text-sm text-paper hover:opacity-85 disabled:opacity-50">{busy ? "사진 저장 중…" : errors.length ? "실패한 사진 다시 저장" : "사진 저장"}</button>
        </fieldset>
        {busy && <div role="status" className="space-y-2 text-xs text-ink-soft"><p>{completed} / {uploadFiles.length}장 완료</p><progress aria-label="사진 업로드 진행" value={completed} max={uploadFiles.length} className="w-full accent-accent" /></div>}
        {errors.length > 0 && <ul role="alert" className="space-y-1 text-xs leading-6 text-accent">{errors.map((error, index) => <li key={index}>{error}</li>)}</ul>}
      </form>
    </section>}

    {notice && <p role="status" className="mb-6 border-l-2 border-accent pl-4 text-sm leading-7 text-ink-soft">{notice}</p>}
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-mist">
      <span>사진 {photos.length}장 <span className="mx-2 text-line">/</span> 위치 {locatedCount}장</span>
      {picking && <span>지도에서 위치 선택</span>}
    </div>
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div ref={mapRef} className="relative h-[380px] overflow-hidden border border-line bg-paper-raised sm:h-[520px]">
        <RoadtripMap apiKey={apiKey} photos={photos} selectedId={selectedId} onSelect={selectPhoto} picking={picking} draft={draft} onPick={setDraft} />
      </div>
      <div ref={detailRef} className="min-w-0 scroll-mt-6">
        {selected ? <PhotoDetails key={selected.id} photo={selected} authed={authed} memoFocusRequest={memoFocusRequest} picking={picking} draft={draft} onPickMode={(value) => { setPicking(value); if (value && window.innerWidth < 1024) mapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }} onDraft={setDraft}
          onSaved={(updated) => { setPhotos((current) => current.map((photo) => photo.id === updated.id ? updated : photo)); setDraft(updated.location); setNotice("저장 완료"); }}
          onDeleted={(id) => { setPhotos((current) => current.filter((photo) => photo.id !== id)); setSelectedId(null); setPicking(false); setNotice("사진 삭제 완료"); }} />
          : <div className="flex min-h-48 flex-col justify-center border border-line px-7 py-9 lg:min-h-[520px]">
            <p className="text-center text-sm text-mist">{photos.length ? "사진을 선택하세요" : "사진 없음"}</p>
          </div>}
      </div>
    </div>

    <section className="mt-12 border-t border-line pt-7" aria-label="여행 사진 목록">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-serif text-xl">사진</h2>
        <div className="flex gap-4 text-xs">
          <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")} className={filter === "all" ? "text-accent" : "text-mist"}>전체 {photos.length}</button>
          <button type="button" aria-pressed={filter === "unlocated"} onClick={() => setFilter("unlocated")} className={filter === "unlocated" ? "text-accent" : "text-mist"}>위치 없음 {photos.length - locatedCount}</button>
        </div>
      </div>
      {visiblePhotos.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
        {visiblePhotos.map((photo) => <article key={photo.id} className="min-w-0"><button type="button" onClick={() => selectPhoto(photo.id)} aria-pressed={selectedId === photo.id}
          className="group w-full min-w-0 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
          <div className={"relative aspect-[4/3] overflow-hidden border " + (selectedId === photo.id ? "border-accent ring-1 ring-accent" : "border-line")}>
            <Image src={photo.url} alt={photo.memo || photo.originalName} fill sizes="(min-width: 1024px) 240px, (min-width: 640px) 30vw, 45vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
            {!photo.location && <span className="absolute bottom-2 left-2 bg-paper/95 px-2 py-1 text-[10px] text-ink-soft">위치 없음</span>}
          </div>
          <p className="mt-3 truncate text-sm text-ink-soft">{photo.memo || photo.originalName}</p>
          <p className="mt-1 text-[10px] tracking-wider text-mist">{new Date(photo.takenAt ?? photo.createdAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</p>
        </button>{authed && <button type="button" aria-label={photo.originalName + " 메모 수정"} onClick={() => selectPhoto(photo.id, true)} className="mt-3 border-b border-line pb-1 text-xs text-ink-soft hover:border-accent hover:text-accent">메모 수정</button>}</article>)}
      </div> : <p className="py-10 text-center text-sm text-mist">{filter === "unlocated" ? "위치 없는 사진 없음" : "사진 없음"}</p>}
    </section>
  </div>;
}