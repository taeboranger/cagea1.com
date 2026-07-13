"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  uploadPhotosAction,
  type UploadPhotosState,
} from "@/app/actions/gallery";

const initialState: UploadPhotosState = {};

export default function GalleryUploadForm() {
  const [state, formAction, pending] = useActionState(
    uploadPhotosAction,
    initialState
  );
  const [fileNames, setFileNames] = useState<string[]>([]);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="photos" className="text-xs text-ink-soft">
          사진 선택 (여러 장 선택 가능)
        </label>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          required
          onChange={(e) =>
            setFileNames(Array.from(e.target.files ?? []).map((f) => f.name))
          }
          className="font-sans text-sm text-ink-soft file:mr-4 file:border file:border-line file:bg-transparent file:px-3 file:py-2 file:font-sans file:text-sm file:text-ink-soft"
        />
        {fileNames.length > 0 && (
          <ul className="font-sans text-xs text-mist">
            {fileNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="caption" className="text-xs text-ink-soft">
          설명 (선택, 선택한 모든 사진에 적용됩니다)
        </label>
        <input
          id="caption"
          name="caption"
          className="border-b border-line bg-transparent py-2 font-sans text-sm text-ink outline-none transition-colors focus:border-accent"
        />
      </div>

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
          {pending ? "업로드 중..." : "업로드"}
        </button>
        <Link
          href="/gallery"
          className="font-sans text-sm text-ink-soft transition-colors hover:text-accent"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
