import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import TripForm from "@/components/roadtrip/TripForm";

export const metadata: Metadata = { title: "새 여행 기록 — cagea1.com" };
export default async function NewRoadtripPage() {
  await requireAuth("/roadtrip/new");
  return <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-16 sm:px-10">
    <Link href="/roadtrip" className="text-xs text-mist hover:text-accent">← 여행 기록 목록</Link>
    <h1 className="mb-4 mt-8 font-serif text-3xl text-ink">새 여행 기록</h1>
    <p className="mb-10 text-sm leading-7 text-ink-soft">이번 여행에 이름을 붙여주세요. 만든 뒤 사진을 추가할 수 있습니다.</p>
    <TripForm />
  </div>;
}