"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { deletePhotoAction } from "@/app/actions/gallery";
import type { GalleryPhoto } from "@/lib/gallery";

export default function GalleryGrid({
  photos,
  authed,
}: {
  photos: GalleryPhoto[];
  authed: boolean;
}) {
  const [selected, setSelected] = useState<GalleryPhoto | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative mb-4 break-inside-avoid border border-line"
          >
            <button
              type="button"
              onClick={() => setSelected(photo)}
              className="block w-full"
            >
              <Image
                src={photo.url}
                width={photo.width}
                height={photo.height}
                alt={photo.caption || "갤러리 사진"}
                className="h-auto w-full object-cover"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
            </button>
            {photo.caption && (
              <p className="border-t border-line px-3 py-2 font-sans text-xs text-ink-soft">
                {photo.caption}
              </p>
            )}
            {authed && (
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(() => {
                    deletePhotoAction(photo.id);
                  })
                }
                className="absolute right-2 top-2 border border-line bg-paper/90 px-2 py-1 font-sans text-xs text-ink-soft opacity-0 transition-opacity hover:text-accent group-hover:opacity-100 disabled:opacity-50"
              >
                삭제
              </button>
            )}
          </div>
        ))}
      </div>

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-6"
        >
          <div className="relative max-h-full max-w-4xl">
            <Image
              src={selected.url}
              width={selected.width}
              height={selected.height}
              alt={selected.caption || "갤러리 사진"}
              className="max-h-[85vh] w-auto object-contain"
            />
            {selected.caption && (
              <p className="mt-3 text-center font-sans text-sm text-paper">
                {selected.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
