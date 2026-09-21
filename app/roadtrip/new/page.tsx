import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import TripForm from "@/components/roadtrip/TripForm";

export const metadata: Metadata = { title: "새 여행 기록 — cagea1.com" };
export default async function NewRoadtripPage() {
  await requireAuth("/roadtrip/new");
  return <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-16 sm:px-10">
    <Link href="/roadtrip" className="text-xs text-mist hover:text-accent">← 여행 목록</Link>
    <h1 className="mb-10 mt-8 font-serif text-3xl text-ink">새 여행 기록</h1>
    <TripForm />
  </div>;
}