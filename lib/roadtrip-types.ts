export interface Coordinates { lat: number; lng: number }
export interface RoadtripPhoto {
  id: string;
  url: string;
  width: number;
  height: number;
  originalName: string;
  location: Coordinates | null;
  takenAt: string | null;
  createdAt: string;
  memo: string;
}
export function isCoordinates(value: unknown): value is Coordinates {
  if (!value || typeof value !== "object") return false;
  const { lat, lng } = value as Coordinates;
  return typeof lat === "number" && Number.isFinite(lat) && Math.abs(lat) <= 90 &&
    typeof lng === "number" && Number.isFinite(lng) && Math.abs(lng) <= 180;
}