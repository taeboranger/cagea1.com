import exifr from "exifr";
import { isCoordinates, type Coordinates } from "./roadtrip-types";

export async function prepareRoadtripPhoto(file: File): Promise<{ file: File; location: Coordinates | null; takenAt: string | null }> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("JPG, PNG, WebP 사진을 선택해주세요. HEIC 사진은 JPG로 변환해주세요.");
  if (file.size > 50 * 1024 * 1024) throw new Error("원본 사진은 50MB 이하로 선택해주세요.");
  // Read GPS before canvas re-encoding strips EXIF metadata.
  const metadata = await exifr.parse(file, { gps: true, exif: true, makerNote: false }).catch(() => undefined);
  const coordinates = { lat: metadata?.latitude, lng: metadata?.longitude };
  const date = metadata?.DateTimeOriginal;
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("사진을 처리할 수 없는 브라우저입니다.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("사진 축소에 실패했습니다.")), "image/webp", 0.84,
    ));
    return {
      file: new File([blob], "photo.webp", { type: blob.type }),
      location: isCoordinates(coordinates) ? coordinates : null,
      takenAt: date instanceof Date && Number.isFinite(date.getTime()) ? date.toISOString() : null,
    };
  } finally { bitmap.close(); }
}