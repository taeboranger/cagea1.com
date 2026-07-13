import type { Metadata } from "next";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { getPhotos } from "@/lib/gallery";
import GalleryGrid from "@/components/GalleryGrid";

export const metadata: Metadata = {
  title: "갤러리 — cagea1.com",
};

export default async function GalleryPage() {
  const [photos, authed] = await Promise.all([getPhotos(), isAuthenticated()]);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 sm:px-10">
      <div className="mb-10 flex items-center justify-between gap-6">
        <h1 className="font-serif text-3xl text-ink">갤러리</h1>
        {authed && (
          <Link
            href="/gallery/upload"
            className="shrink-0 border border-line px-4 py-2 font-sans text-sm text-ink-soft transition-colors hover:border-accent hover:text-accent"
          >
            사진 업로드
          </Link>
        )}
      </div>

      {photos.length === 0 ? (
        <p className="font-sans text-sm text-ink-soft">
          아직 업로드된 사진이 없습니다.
        </p>
      ) : (
        <GalleryGrid photos={photos} authed={authed} />
      )}
    </div>
  );
}
