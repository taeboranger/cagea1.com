import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import GalleryUploadForm from "@/components/GalleryUploadForm";

export const metadata: Metadata = {
  title: "사진 업로드 — cagea1.com",
};

export default async function GalleryUploadPage() {
  await requireAuth("/gallery/upload");

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10">
      <h1 className="mb-10 font-serif text-2xl text-ink">사진 업로드</h1>
      <GalleryUploadForm />
    </div>
  );
}
