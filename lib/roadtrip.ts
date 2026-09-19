import "server-only";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { isCoordinates, type RoadtripPhoto } from "./roadtrip-types";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "roadtrip.json");
export const roadtripUploadDir = path.join(process.cwd(), "public", "uploads", "roadtrip");
export class RoadtripValidationError extends Error {}

// Serialize writes for this site's single Node instance; rename makes reads atomic.
const globalStore = globalThis as typeof globalThis & { roadtripWrite?: Promise<unknown> };
function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = (globalStore.roadtripWrite ?? Promise.resolve()).then(operation);
  globalStore.roadtripWrite = result.catch(() => undefined);
  return result;
}
export async function getRoadtripPhotos(): Promise<RoadtripPhoto[]> {
  try {
    const photos: RoadtripPhoto[] = JSON.parse(await readFile(dataFile, "utf8"));
    return photos.sort((a, b) => (b.takenAt ?? b.createdAt).localeCompare(a.takenAt ?? a.createdAt));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}
async function writePhotos(photos: RoadtripPhoto[]) {
  await mkdir(dataDir, { recursive: true });
  const temp = dataFile + "." + randomUUID() + ".tmp";
  try {
    await writeFile(temp, JSON.stringify(photos, null, 2), "utf8");
    await rename(temp, dataFile);
  } finally { await unlink(temp).catch(() => undefined); }
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
    id, url: "/uploads/roadtrip/" + id + ".webp",
    width: output.info.width, height: output.info.height, originalName, ...details,
    takenAt: takenAt === null ? null : new Date(takenAt as string).toISOString(), createdAt: new Date().toISOString(),
  };
  await mkdir(roadtripUploadDir, { recursive: true });
  const destination = path.join(roadtripUploadDir, id + ".webp");
  await writeFile(destination, output.data);
  try {
    await serialize(async () => { await writePhotos([...(await getRoadtripPhotos()), photo]); });
  } catch (error) { await unlink(destination).catch(() => undefined); throw error; }
  return photo;
}
export async function updateRoadtripPhoto(id: string, input: unknown) {
  const details = validateDetails(input);
  return serialize(async () => {
    const photos = await getRoadtripPhotos();
    const photo = photos.find((photo) => photo.id === id);
    if (!photo) return null;
    Object.assign(photo, details);
    await writePhotos(photos);
    return photo;
  });
}
export async function deleteRoadtripPhoto(id: string) {
  return serialize(async () => {
    const photos = await getRoadtripPhotos();
    if (!photos.some((photo) => photo.id === id)) return false;
    await writePhotos(photos.filter((photo) => photo.id !== id));
    await unlink(path.join(roadtripUploadDir, id + ".webp")).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") console.error("Roadtrip image cleanup failed", error.code);
    });
    return true;
  });
}