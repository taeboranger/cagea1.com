import type { Metadata } from "next";
import { isAuthenticated } from "@/lib/auth";
import { getRoadtripPhotos } from "@/lib/roadtrip";
import RoadtripJournal from "@/components/roadtrip/RoadtripJournal";
export const metadata: Metadata = {
  title: "여행 기록 — cagea1.com",
  description: "사진과 짧은 메모로 지도 위에 남기는 여행의 순간들.",
};
export default async function RoadtripPage() {
  const [photos, authed] = await Promise.all([getRoadtripPhotos(), isAuthenticated()]);
  return <RoadtripJournal initialPhotos={photos} authed={authed} apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""} />;
}