import "server-only";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { isCoordinates, type RoadtripPhoto, type Roadtrip, type RoadtripSummary } from "./roadtrip-types";
import { normalizeRoadtripStore, type RoadtripStore } from "./roadtrip-data";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "roadtrip.json");
export const roadtripUploadDir = path.join(process.cwd(), "public", "uploads", "roadtrip");
export class RoadtripValidationError extends Error {}

const globalStore = globalThis as typeof globalThis & { roadtripWrite?: Promise<unknown> };
function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = (globalStore.roadtripWrite ?? Promise.resolve()).then(operation);
  globalStore.roadtripWrite = result.catch(() => undefined);
  return result;
}
async function readStore(): Promise<RoadtripStore> {
  try { return normalizeRoadtripStore(JSON.parse(await readFile(dataFile, "utf8"))); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { version: 2, trips: [], photos: [] };
    throw error;
  }
}
async function writeStore(store: RoadtripStore) {
  await mkdir(dataDir, { recursive: true });
  const temp = dataFile + "." + randomUUID() + ".tmp";
  try {
    await writeFile(temp, JSON.stringify(store, null, 2), "utf8");
    await rename(temp, dataFile);
  } finally { await unlink(temp).catch(() => undefined); }
}
function sortPhotos(photos: RoadtripPhoto[]) {
  return photos.sort((a, b) => (b.takenAt ?? b.createdAt).localeCompare(a.takenAt ?? a.createdAt));
}
export async function getRoadtrips(): Promise<RoadtripSummary[]> {
  const store = await readStore();
  return store.trips.map((trip) => {
    const photos = sortPhotos(store.photos.filter((photo) => photo.tripId === trip.id));
    return { ...trip, photoCount: photos.length, cover: photos[0] ?? null };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function getRoadtrip(id: string) {
  const store = await readStore();
  const trip = store.trips.find((trip) => trip.id === id);
  return trip ? { trip, photos: sortPhotos(store.photos.filter((photo) => photo.tripId === id)) } : null;
}
function validateTrip(input: unknown) {
  if (!input || typeof input !== "object") throw new RoadtripValidationError("잘못된 여행 정보입니다.");
  const { title, memo } = input as Record<string, unknown>;
  if (typeof title !== "string" || !title.trim() || title.trim().length > 100)
    throw new RoadtripValidationError("여행 제목은 1~100자로 입력해주세요.");
  if (typeof memo !== "string" || memo.length > 2000)
    throw new RoadtripValidationError("여행 메모는 2,000자까지 입력할 수 있습니다.");
  return { title: title.trim(), memo: memo.trim() };
}
export async function createRoadtrip(input: unknown): Promise<Roadtrip> {
  const details = validateTrip(input);
  return serialize(async () => {
    const store = await readStore();
    const now = new Date().toISOString();
    const trip = { id: randomUUID(), ...details, createdAt: now, updatedAt: now };
    store.trips.push(trip);
    await writeStore(store);
    return trip;
  });
}
export async function updateRoadtrip(id: string, input: unknown) {
  const details = validateTrip(input);
  return serialize(async () => {
    const store = await readStore();
    const trip = store.trips.find((trip) => trip.id === id);
    if (!trip) return null;
    Object.assign(trip, details, { updatedAt: new Date().toISOString() });
    await writeStore(store);
    return trip;
  });
}
async function removeImage(id: string) {
  await unlink(path.join(roadtripUploadDir, id + ".webp")).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") console.error("Roadtrip image cleanup failed", error.code);
  });
}
export async function deleteRoadtrip(id: string) {
  return serialize(async () => {
    const store = await readStore();
    if (!store.trips.some((trip) => trip.id === id)) return false;
    const removed = store.photos.filter((photo) => photo.tripId === id);
    store.trips = store.trips.filter((trip) => trip.id !== id);
    store.photos = store.photos.filter((photo) => photo.tripId !== id);
    await writeStore(store);
    await Promise.all(removed.map((photo) => removeImage(photo.id)));
    return true;
  });
}
export function validateDetails(input: unknown) {
  if (!input || typeof input !== "object") throw new RoadtripValidationError("잘못된 사진 정보입니다.");
  const { memo, location } = input as Record<string, unknown>;
  if (typeof memo !== "string" || memo.length > 2000) throw new RoadtripValidationError("메모는 2,000자까지 입력할 수 있습니다.");
  if (location !== null && !isCoordinates(location)) throw new RoadtripValidationError("올바른 위도와 경도를 입력해주세요.");
  return { memo: memo.trim(), location };
}
export async function addRoadtripPhoto(file: File, input: unknown): Promise<RoadtripPhoto> {
  const details = validateDetails(input);
  const tripId = (input as Record<string, unknown>).tripId;
  if (typeof tripId !== "string" || !(await getRoadtrip(tripId))) throw new RoadtripValidationError("사진을 추가할 여행 기록을 찾을 수 없습니다.");
  if (!file.size || file.size > 10 * 1024 * 1024) throw new RoadtripValidationError("사진은 10MB 이하로 업로드해주세요.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new RoadtripValidationError("JPG, PNG, WebP 사진을 선택해주세요.");
  const takenAt = (input as Record<string, unknown>).takenAt;
  if (takenAt !== null && (typeof takenAt !== "string" || !Number.isFinite(Date.parse(takenAt)))) throw new RoadtripValidationError("촬영 날짜가 올바르지 않습니다.");
  const originalName = (input as Record<string, unknown>).originalName;
  if (typeof originalName !== "string" || originalName.length > 255) throw new RoadtripValidationError("파일 이름이 올바르지 않습니다.");
  let output;
  try {
    output = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 80_000_000 })
      .autoOrient().resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  } catch { throw new RoadtripValidationError("사진을 읽을 수 없습니다. JPG, PNG, WebP 파일인지 확인해주세요."); }
  const id = randomUUID();
  const photo: RoadtripPhoto = {
    id, tripId, url: "/uploads/roadtrip/" + id + ".webp",
    width: output.info.width, height: output.info.height, originalName, ...details,
    takenAt: takenAt === null ? null : new Date(takenAt as string).toISOString(), createdAt: new Date().toISOString(),
  };
  await mkdir(roadtripUploadDir, { recursive: true });
  const destination = path.join(roadtripUploadDir, id + ".webp");
  await writeFile(destination, output.data);
  try {
    await serialize(async () => {
      const store = await readStore();
      const trip = store.trips.find((trip) => trip.id === tripId);
      if (!trip) throw new RoadtripValidationError("이 여행 기록은 삭제되었습니다.");
      trip.updatedAt = new Date().toISOString();
      store.photos.push(photo);
      await writeStore(store);
    });
  } catch (error) { await unlink(destination).catch(() => undefined); throw error; }
  return photo;
}
export async function updateRoadtripPhoto(id: string, input: unknown) {
  const details = validateDetails(input);
  return serialize(async () => {
    const store = await readStore();
    const photo = store.photos.find((photo) => photo.id === id);
    if (!photo) return null;
    Object.assign(photo, details);
    await writeStore(store);
    return photo;
  });
}
export async function deleteRoadtripPhoto(id: string) {
  return serialize(async () => {
    const store = await readStore();
    if (!store.photos.some((photo) => photo.id === id)) return false;
    store.photos = store.photos.filter((photo) => photo.id !== id);
    await writeStore(store);
    await removeImage(id);
    return true;
  });
}