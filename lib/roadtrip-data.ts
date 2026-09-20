import type { RoadtripPhoto, Roadtrip } from "./roadtrip-types";

export interface RoadtripStore {
  version: 2;
  trips: Roadtrip[];
  photos: RoadtripPhoto[];
}
export const LEGACY_TRIP_ID = "00000000-0000-4000-8000-000000000001";

/** Upgrade the old photo list in memory; the next atomic write persists it. */
export function normalizeRoadtripStore(value: unknown): RoadtripStore {
  if (Array.isArray(value)) {
    const photos = value as Omit<RoadtripPhoto, "tripId">[];
    const dates = photos.map((photo) => photo.createdAt).sort();
    return {
      version: 2,
      trips: photos.length ? [{
        id: LEGACY_TRIP_ID, title: "기존 여행 기록", memo: "",
        createdAt: dates[0], updatedAt: dates[dates.length - 1],
      }] : [],
      photos: photos.map((photo) => ({ ...photo, tripId: LEGACY_TRIP_ID })),
    };
  }
  const store = value as RoadtripStore | null;
  if (store?.version !== 2 || !Array.isArray(store.trips) || !Array.isArray(store.photos)) {
    throw new Error("Unsupported roadtrip data format");
  }
  return store;
}