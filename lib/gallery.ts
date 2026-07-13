import "server-only";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { imageSize } from "image-size";

export interface GalleryPhoto {
  id: string;
  filename: string;
  url: string;
  width: number;
  height: number;
  caption: string;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "gallery.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "gallery");

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

async function ensureFile() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DATA_FILE, "utf-8");
  } catch {
    await writeFile(DATA_FILE, "[]", "utf-8");
  }
}

async function readAll(): Promise<GalleryPhoto[]> {
  await ensureFile();
  const raw = await readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw) as GalleryPhoto[];
}

async function writeAll(photos: GalleryPhoto[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(photos, null, 2), "utf-8");
}

export async function getPhotos(): Promise<GalleryPhoto[]> {
  const photos = await readAll();
  return photos.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export class UnsupportedImageTypeError extends Error {}

export async function addPhoto(
  file: File,
  caption: string
): Promise<GalleryPhoto> {
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    throw new UnsupportedImageTypeError(`지원하지 않는 파일 형식입니다: ${file.type}`);
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const { width, height } = imageSize(buffer);

  const id = randomUUID();
  const filename = `${id}.${extension}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  const photo: GalleryPhoto = {
    id,
    filename,
    url: `/uploads/gallery/${filename}`,
    width: width ?? 1200,
    height: height ?? 800,
    caption,
    createdAt: new Date().toISOString(),
  };

  const photos = await readAll();
  photos.push(photo);
  await writeAll(photos);

  return photo;
}

export async function deletePhoto(id: string): Promise<void> {
  const photos = await readAll();
  const photo = photos.find((p) => p.id === id);
  if (!photo) return;

  await writeAll(photos.filter((p) => p.id !== id));

  try {
    await unlink(path.join(UPLOAD_DIR, photo.filename));
  } catch {
    // file already gone; ignore
  }
}
