"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { prepareRoadtripPhoto } from "@/lib/prepareRoadtripPhoto";
import type { Coordinates, RoadtripPhoto, Roadtrip } from "@/lib/roadtrip-types";
import PhotoDetails from "./PhotoDetails";
import TripForm from "./TripForm";

const RoadtripMap = dynamic(() => import("./RoadtripMap"), {
  ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-mist">여행 지도를 펼치는 중…</div>,
});
const buttonClass = "border border-line px-4 py-2.5 text-sm text-ink-soft transition-colors hover:border-accent hover:text-accent disabled:opacity-50";
export default function RoadtripJournal({ trip, initialPhotos, authed, apiKey }: { trip: Roadtrip; initialPhotos: RoadtripPhoto[]; authed: boolean; apiKey: string }) {
  const [editingTrip, setEditingTrip] = useState(false);
  const [photos, setPhotos] = useState(initialPhotos);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadMemo, setUploadMemo] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<"all" | "unlocated">("all");
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState<Coordinates | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const selected = photos.find((photo) => photo.id === selectedId);
  const locatedCount = photos.filter((photo) => photo.location).length;
  const visiblePhotos = filter === "all" ? photos : photos.filter((photo) => !photo.location);

  function selectPhoto(id: string) {
    setSelectedId(id); setPicking(false);
    setDraft(photos.find((photo) => photo.id === id)?.location ?? null);
    if (window.innerWidth < 1024) setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }
  async function upload() {
    if (!uploadFiles.length || busy) return;
    setBusy(true); setErrors([]); setNotice("");
    const failures: string[] = [];
    const failedFiles: File[] = [];
    const added: RoadtripPhoto[] = [];
    for (const [index, original] of uploadFiles.entries()) {
      setProgress((index + 1) + " / " + uploadFiles.length + " · " + original.name);
      try {
        const prepared = await prepareRoadtripPhoto(original);
        const form = new FormData();
        form.append("photo", prepared.file);
        form.append("details", JSON.stringify({ tripId: trip.id, location: prepared.location, takenAt: prepared.takenAt, memo: uploadMemo, originalName: original.name }));
        const response = await fetch("/api/roadtrip", { method: "POST", body: form });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        added.push(result);
      } catch (error) {
        failures.push(original.name + ": " + (error instanceof Error ? error.message : "업로드에 실패했습니다."));
        failedFiles.push(original);
      }
    }
    setPhotos((current) => [...added, ...current].sort((a, b) => (b.takenAt ?? b.createdAt).localeCompare(a.takenAt ?? a.createdAt)));
    setErrors(failures); setUploadFiles(failedFiles); setBusy(false); setProgress("");
    if (inputRef.current) inputRef.current.value = "";
    if (added.length) {
      const missing = added.filter((photo) => !photo.location).length;
      setNotice(added.length + "장의 사진을 저장했습니다." + (missing ? " 위치가 없는 " + missing + "장은 사진을 선택해 지도에 표시해주세요." : ""));
      setSelectedId(added[0].id); setDraft(added[0].location); setPicking(false); setFilter("all");
    }
    if (!failures.length) { setShowUpload(false); setUploadMemo(""); }
  }

  return <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
    <Link href="/roadtrip" className="mb-8 inline-block text-xs text-mist hover:text-accent">← 모든 여행 기록</Link>
    <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
      <div>
        <p className="mb-3 text-[10px] tracking-[0.3em] text-mist">ROADTRIP</p>
        <h1 className="break-words font-serif text-3xl text-ink">{trip.title}</h1>
        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-ink-soft">{trip.memo || "이 여행에서 만난 풍경과 작은 이야기들."}</p>
      </div>
      {authed ? <div className="flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={() => setEditingTrip(!editingTrip)} className={buttonClass}>여행 정보 수정</button><button type="button" disabled={busy} onClick={() => setShowUpload(!showUpload)} className={buttonClass}>{showUpload ? "업로드 닫기" : "+ 사진 추가"}</button></div>
        : <Link href={"/login?from=" + encodeURIComponent("/roadtrip/" + trip.id)} className="text-xs text-mist transition-colors hover:text-accent">로그인하고 기록하기 ↗</Link>}
    </div>

    {editingTrip && authed && <section aria-label="여행 정보 수정" className="mb-8 border border-line bg-paper-raised p-6"><TripForm trip={trip} onCancel={() => setEditingTrip(false)} onSaved={() => setEditingTrip(false)} /></section>}
    {showUpload && authed && <section className="mb-8 border border-line bg-paper-raised p-5 sm:p-7" aria-label="사진 업로드">
      <form onSubmit={(event) => { event.preventDefault(); void upload(); }} className="space-y-5">
        <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
          <label className="block cursor-pointer border border-dashed border-line px-5 py-7 text-center transition-colors hover:border-accent"
            onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (!busy) { setUploadFiles(Array.from(event.dataTransfer.files)); setErrors([]); } }}>
            <span className="block font-serif text-lg text-ink">여행의 순간을 올려주세요</span>
            <span className="mt-2 block text-xs leading-6 text-mist">사진을 끌어 놓거나 선택하세요 · JPG, PNG, WebP</span>
            <input ref={inputRef} aria-label="여행 사진 선택" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { setUploadFiles(Array.from(event.target.files ?? [])); setErrors([]); }}
              className="mt-4 w-full max-w-sm text-xs text-ink-soft file:mr-3 file:border file:border-line file:bg-transparent file:px-3 file:py-2 file:text-ink-soft" />
          </label>
          <p className="text-xs leading-6 text-mist">사진은 자동으로 축소됩니다. 촬영 위치가 있으면 지도에 표시하고, 없으면 업로드 후 직접 지정할 수 있습니다.</p>
          {uploadFiles.length > 0 && <p className="break-words text-xs leading-6 text-ink-soft">{uploadFiles.length}장 선택 · {uploadFiles.map((file) => file.name).join(", ")}</p>}
          <label className="block text-xs text-ink-soft">함께 남길 메모 <span className="text-mist">(선택 · 선택한 사진에 모두 적용)</span>
            <textarea value={uploadMemo} onChange={(event) => setUploadMemo(event.target.value)} maxLength={2000} rows={2} placeholder="이번 여행은 어땠나요?"
              className="mt-2 w-full resize-y border-b border-line bg-transparent py-2 text-sm leading-6 text-ink outline-none focus:border-accent" />
          </label>
          <button type="submit" disabled={!uploadFiles.length} className="border border-ink bg-ink px-6 py-3 text-sm text-paper hover:opacity-85 disabled:opacity-50">{busy ? "사진 저장 중…" : errors.length ? "실패한 사진 다시 저장" : "사진 저장"}</button>
        </fieldset>
        {progress && <p role="status" className="break-words text-xs text-ink-soft">{progress}</p>}
        {errors.length > 0 && <ul role="alert" className="space-y-1 text-xs leading-6 text-accent">{errors.map((error, index) => <li key={index}>{error}</li>)}</ul>}
      </form>
    </section>}

    {notice && <p role="status" className="mb-6 border-l-2 border-accent pl-4 text-sm leading-7 text-ink-soft">{notice}</p>}
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-mist">
      <span>사진 {photos.length}장 <span className="mx-2 text-line">/</span> 지도 위의 순간 {locatedCount}개</span>
      <span>{picking ? "지도에서 촬영 장소를 선택해주세요" : "사진을 누르면 그 순간의 이야기가 펼쳐집니다"}</span>
    </div>
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div ref={mapRef} className="relative h-[380px] overflow-hidden border border-line bg-paper-raised sm:h-[520px]">
        <RoadtripMap apiKey={apiKey} photos={photos} selectedId={selectedId} onSelect={selectPhoto} picking={picking} draft={draft} onPick={setDraft} />
        {!locatedCount && apiKey && <div className="pointer-events-none absolute bottom-8 left-4 right-4 border border-line bg-paper-raised/95 p-4 text-center text-xs leading-6 text-ink-soft">아직 지도에 남긴 순간이 없습니다.<br />{photos.length ? "사진을 선택해 촬영한 곳을 지정해주세요." : "첫 사진과 함께 여행을 시작해보세요."}</div>}
      </div>
      <div ref={detailRef} className="min-w-0 scroll-mt-6">
        {selected ? <PhotoDetails key={selected.id} photo={selected} authed={authed} picking={picking} draft={draft} onPickMode={(value) => { setPicking(value); if (value && window.innerWidth < 1024) mapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }} onDraft={setDraft}
          onSaved={(updated) => { setPhotos((current) => current.map((photo) => photo.id === updated.id ? updated : photo)); setDraft(updated.location); setNotice("사진의 메모와 위치를 저장했습니다."); }}
          onDeleted={(id) => { setPhotos((current) => current.filter((photo) => photo.id !== id)); setSelectedId(null); setPicking(false); setNotice("사진을 삭제했습니다."); }} />
          : <div className="flex min-h-48 flex-col justify-center border border-line px-7 py-9 lg:min-h-[520px]">
            <span className="mb-5 font-display text-3xl text-accent" aria-hidden="true">↗</span>
            <h2 className="font-serif text-xl leading-9 text-ink">어떤 순간을<br />기억하고 싶나요?</h2>
            <p className="mt-4 text-sm leading-7 text-ink-soft">{photos.length ? "지도나 아래 사진에서 하나의 순간을 골라보세요." : "낯선 풍경, 익숙한 거리. 사진 한 장에서 여행 기록이 시작됩니다."}</p>
            <div className="my-7 h-px w-10 bg-line" />
            <p className="text-xs leading-6 text-mist">사진 속 위치와<br />그날의 작은 이야기를 함께.</p>
          </div>}
      </div>
    </div>

    <section className="mt-12 border-t border-line pt-7" aria-label="여행 사진 목록">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-serif text-xl">남겨둔 순간들</h2>
        <div className="flex gap-4 text-xs">
          <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")} className={filter === "all" ? "text-accent" : "text-mist"}>전체 {photos.length}</button>
          <button type="button" aria-pressed={filter === "unlocated"} onClick={() => setFilter("unlocated")} className={filter === "unlocated" ? "text-accent" : "text-mist"}>위치 없음 {photos.length - locatedCount}</button>
        </div>
      </div>
      {visiblePhotos.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
        {visiblePhotos.map((photo) => <button type="button" key={photo.id} onClick={() => selectPhoto(photo.id)} aria-pressed={selectedId === photo.id}
          className="group min-w-0 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
          <div className={"relative aspect-[4/3] overflow-hidden border " + (selectedId === photo.id ? "border-accent ring-1 ring-accent" : "border-line")}>
            <Image src={photo.url} alt={photo.memo || photo.originalName} fill sizes="(min-width: 1024px) 240px, (min-width: 640px) 30vw, 45vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
            {!photo.location && <span className="absolute bottom-2 left-2 bg-paper/95 px-2 py-1 text-[10px] text-ink-soft">위치 없음</span>}
          </div>
          <p className="mt-3 truncate text-sm text-ink-soft">{photo.memo || photo.originalName}</p>
          <p className="mt-1 text-[10px] tracking-wider text-mist">{new Date(photo.takenAt ?? photo.createdAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</p>
        </button>)}
      </div> : <p className="py-10 text-center text-sm text-mist">{filter === "unlocated" ? "위치가 없는 사진이 없습니다." : "아직 남겨둔 사진이 없습니다."}</p>}
    </section>
  </div>;
}