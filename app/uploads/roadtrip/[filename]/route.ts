import { readFile } from "node:fs/promises";
import path from "node:path";
import { roadtripUploadDir } from "@/lib/roadtrip";
export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!/^[a-f0-9-]{36}\.webp$/.test(filename)) return new Response(null, { status: 404 });
  try {
    const image = await readFile(path.join(roadtripUploadDir, filename));
    return new Response(new Uint8Array(image), { headers: {
      "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    return new Response(null, { status: (error as NodeJS.ErrnoException).code === "ENOENT" ? 404 : 500 });
  }
}