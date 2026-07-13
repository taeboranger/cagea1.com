import "server-only";
import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "gallery");

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

// Fallback for files written to public/uploads/gallery after this server
// process booted: `next start` snapshots the public folder's contents once
// at startup, so newly uploaded photos 404 through the static file server
// until the process restarts. This route reads straight from disk instead.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const match = /^[a-zA-Z0-9-]+\.(jpg|png|webp|gif)$/.exec(filename);
  if (!match) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const buffer = await readFile(path.join(UPLOAD_DIR, filename));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": CONTENT_TYPES[match[1]],
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
