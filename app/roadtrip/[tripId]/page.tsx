import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getRoadtrip } from "@/lib/roadtrip";
import RoadtripJournal from "@/components/roadtrip/RoadtripJournal";

export async function generateMetadata({ params }: { params: Promise<{ tripId: string }> }): Promise<Metadata> {
  const { tripId } = await params;
  const result = await getRoadtrip(tripId);
  return { title: result ? result.trip.title + " — 여행 기록 — cagea1.com" : "여행 기록을 찾을 수 없습니다" };
}
export default async function TripPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const [result, authed] = await Promise.all([getRoadtrip(tripId), isAuthenticated()]);
  if (!result) notFound();
  return <RoadtripJournal key={tripId} trip={result.trip} initialPhotos={result.photos} authed={authed} apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""} />;
}