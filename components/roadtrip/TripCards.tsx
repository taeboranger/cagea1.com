import Image from "next/image";
import Link from "next/link";
import type { RoadtripSummary } from "@/lib/roadtrip-types";

export default function TripCards({ trips }: { trips: RoadtripSummary[] }) {
  return <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
    {trips.map((trip) => <Link key={trip.id} href={"/roadtrip/" + trip.id} className="group min-w-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
      <div className="relative aspect-[4/3] overflow-hidden border border-line bg-paper-raised">
        {trip.cover ? <Image src={trip.cover.url} alt={trip.title + " 대표 사진"} fill sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
          : <div className="flex h-full flex-col items-center justify-center gap-4 text-mist">
            <svg width="72" height="48" viewBox="0 0 72 48" fill="none" aria-hidden="true">
              <path d="M4 40 25 13l16 20 10-13 17 20H4Z" stroke="currentColor" strokeWidth="1" />
              <circle cx="52" cy="10" r="4" stroke="currentColor" />
            </svg>
            <span className="text-xs tracking-wider">이 여행의 첫 사진을 기다립니다</span>
          </div>}
        <span className="absolute bottom-3 left-3 bg-paper/95 px-2.5 py-1 text-xs text-ink-soft">사진 {trip.photoCount}장</span>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <h3 className="break-words font-serif text-xl leading-8 text-ink transition-colors group-hover:text-accent">{trip.title}</h3>
        <span className="pt-1 text-accent" aria-hidden="true">↗</span>
      </div>
      {trip.memo && <p className="mt-2 line-clamp-2 break-words text-sm leading-7 text-ink-soft">{trip.memo}</p>}
      <p className="mt-3 text-xs tracking-wider text-mist">{new Date(trip.createdAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</p>
    </Link>)}
  </div>;
}