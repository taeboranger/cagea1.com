import { isSameOrigin } from "@/lib/request-origin";
import { isAuthenticated } from "@/lib/auth";
import { addRoadtripPhoto, RoadtripValidationError } from "@/lib/roadtrip";
import { revalidatePath } from "next/cache";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "허용되지 않은 요청입니다." }, { status: 403 });
  if (Number(request.headers.get("content-length")) > 11 * 1024 * 1024) return Response.json({ error: "업로드 용량이 너무 큽니다." }, { status: 413 });
  try {
    const data = await request.formData();
    const file = data.get("photo");
    if (!(file instanceof File)) throw new RoadtripValidationError("사진을 선택해주세요.");
    const photo = await addRoadtripPhoto(file, JSON.parse(String(data.get("details"))));
    revalidatePath("/roadtrip");
    return Response.json(photo, { status: 201 });
  } catch (error) {
    if (error instanceof RoadtripValidationError || error instanceof SyntaxError || error instanceof TypeError)
      return Response.json({ error: error instanceof RoadtripValidationError ? error.message : "잘못된 업로드 요청입니다." }, { status: 400 });
    console.error("Roadtrip upload failed", error);
    return Response.json({ error: "사진 저장에 실패했습니다. 다시 시도해주세요." }, { status: 500 });
  }
}