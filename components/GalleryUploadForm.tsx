"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
  uploadPhotosAction,
  type UploadPhotosState,
} from "@/app/actions/gallery";
import { resizeImageToFit } from "@/lib/resizeImageForUpload";

const initialState: UploadPhotosState = {};

// Must stay under next.config.ts's serverActions.bodySizeLimit (20mb),
// with headroom for multipart overhead and the caption field.
const SERVER_BODY_LIMIT_BYTES = 20 * 1024 * 1024;
const UPLOAD_SAFETY_MARGIN_BYTES = 1 * 1024 * 1024;
const MAX_TOTAL_UPLOAD_BYTES =
  SERVER_BODY_LIMIT_BYTES - UPLOAD_SAFETY_MARGIN_BYTES;

export default function GalleryUploadForm() {
  const [state, formAction, pending] = useActionState(
    uploadPhotosAction,
    initialState
  );
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleFilesChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) {
      setFileNames([]);
      return;
    }

    setIsProcessing(true);
    try {
      const perFileBudget = MAX_TOTAL_UPLOAD_BYTES / files.length;
      const resized = await Promise.all(
        files.map(async (file) => {
          try {
            return await resizeImageToFit(file, perFileBudget);
          } catch (err) {
            // Fall back to the original file so a single decode failure
            // doesn't leave input.files unset for the whole batch.
            console.error(`이미지 리사이즈 실패, 원본으로 대체: ${file.name}`, err);
            return file;
          }
        })
      );

      const dataTransfer = new DataTransfer();
      resized.forEach((file) => dataTransfer.items.add(file));
      input.files = dataTransfer.files;

      setFileNames(resized.map((f) => f.name));
    } finally {
      setIsProcessing(false);
    }
  }

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
          onChange={handleFilesChange}
          className="font-sans text-sm text-ink-soft file:mr-4 file:border file:border-line file:bg-transparent file:px-3 file:py-2 file:font-sans file:text-sm file:text-ink-soft"
        />
        <p className="font-sans text-xs text-mist">
          용량이 큰 사진은 업로드 전 자동으로 리사이즈됩니다.
        </p>
        {isProcessing && (
          <p className="font-sans text-xs text-ink-soft">이미지 처리 중...</p>
        )}
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
          disabled={pending || isProcessing}
          className="border border-ink bg-ink px-6 py-3 font-sans text-sm tracking-wide text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {pending ? "업로드 중..." : isProcessing ? "이미지 처리 중..." : "업로드"}
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
