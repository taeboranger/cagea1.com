import type { Metadata } from "next";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { getRoadtrips } from "@/lib/roadtrip";
import TripCards from "@/components/roadtrip/TripCards";

export const metadata: Metadata = {
  title: "여행 기록 — cagea1.com",
  description: "여행마다 사진과 이야기를 모아두는 작은 여행 기록장.",
};
export default async function RoadtripPage() {
  const [trips, authed] = await Promise.all([getRoadtrips(), isAuthenticated()]);
  return <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-10">
    <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
      <div>
        <p className="mb-3 text-[10px] tracking-[0.3em] text-mist">ROADTRIPS</p>
        <h1 className="font-serif text-3xl text-ink">여행 기록</h1>
        <p className="mt-4 text-sm leading-7 text-ink-soft">여행 하나에, 하나의 이야기.<br className="sm:hidden" /> 지나온 곳과 머무른 순간들을 모았습니다.</p>
      </div>
      <Link href={authed ? "/roadtrip/new" : "/login?from=%2Froadtrip%2Fnew"} className="border border-line px-4 py-2.5 text-sm text-ink-soft transition-colors hover:border-accent hover:text-accent">
        {authed ? "+ 새 여행 기록" : "로그인하고 기록하기 ↗"}
      </Link>
    </div>
    <p className="mb-6 border-b border-line pb-4 text-xs tracking-wide text-mist">{trips.length}개의 여행 이야기</p>
    {trips.length ? <TripCards trips={trips} authed={authed} /> : <div className="border border-dashed border-line px-6 py-20 text-center">
      <h2 className="font-serif text-xl text-ink">첫 여행의 이야기를 남겨보세요</h2>
      <p className="mt-4 text-sm leading-7 text-ink-soft">여행을 만들고 사진을 더하면, 그 여행만의 지도가 펼쳐집니다.</p>
    </div>}
  </div>;
}