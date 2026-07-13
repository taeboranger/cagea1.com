const DIMENSION_STEP = 0.85;
const MIN_DIMENSION = 480;
const QUALITY_STEP = 0.85;
const MIN_QUALITY = 0.5;
const MAX_ATTEMPTS = 12;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지를 불러올 수 없습니다."));
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("이미지 변환에 실패했습니다."))),
      type,
      quality
    );
  });
}

/**
 * Returns the file unchanged if it already fits maxBytes. Otherwise re-encodes
 * it via canvas, alternating quality and dimension cuts, until it fits (or a
 * floor is hit). GIFs are left untouched since canvas would flatten animation.
 */
export async function resizeImageToFit(
  file: File,
  maxBytes: number
): Promise<File> {
  if (file.size <= maxBytes || file.type === "image/gif") {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);
  let img: HTMLImageElement;
  try {
    img = await loadImage(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  const outputType =
    file.type === "image/png"
      ? "image/png"
      : file.type === "image/webp"
        ? "image/webp"
        : "image/jpeg";
  const supportsQuality = outputType !== "image/png";

  let width = img.naturalWidth;
  let height = img.naturalHeight;
  let quality = 0.92;
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    canvas.width = Math.round(width);
    canvas.height = Math.round(height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    blob = await canvasToBlob(
      canvas,
      outputType,
      supportsQuality ? quality : undefined
    );

    if (blob.size <= maxBytes) break;

    if (supportsQuality && quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality * QUALITY_STEP);
    } else {
      width *= DIMENSION_STEP;
      height *= DIMENSION_STEP;
      if (Math.max(width, height) < MIN_DIMENSION) break;
    }
  }

  if (!blob) return file;

  const extension =
    outputType === "image/png" ? "png" : outputType === "image/webp" ? "webp" : "jpg";
  const newName = file.name.replace(/\.[^.]+$/, "") + `.${extension}`;
  return new File([blob], newName, { type: outputType, lastModified: Date.now() });
}
