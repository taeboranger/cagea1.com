import type { Metadata } from "next";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { getRoadtrips } from "@/lib/roadtrip";
import TripCards from "@/components/roadtrip/TripCards";

export const metadata: Metadata = {
  title: "여행 기록 — cagea1.com",
  description: "여행 사진, 위치, 메모.",
};
export default async function RoadtripPage() {
  const [trips, authed] = await Promise.all([getRoadtrips(), isAuthenticated()]);
  return <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-10">
    <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
      <div>
        <h1 className="font-serif text-3xl text-ink">여행 기록</h1>
      </div>
      <Link href={authed ? "/roadtrip/new" : "/login?from=%2Froadtrip%2Fnew"} className="border border-line px-4 py-2.5 text-sm text-ink-soft transition-colors hover:border-accent hover:text-accent">
        {authed ? "+ 새 여행 기록" : "로그인"}
      </Link>
    </div>
    <p className="mb-6 border-b border-line pb-4 text-xs tracking-wide text-mist">여행 {trips.length}개</p>
    {trips.length ? <TripCards trips={trips} authed={authed} /> : <div className="border border-dashed border-line px-6 py-20 text-center">
      <p className="text-sm text-mist">여행 기록이 없습니다.</p>
    </div>}
  </div>;
}