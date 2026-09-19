import { isSameOrigin } from "@/lib/request-origin";
import { isAuthenticated } from "@/lib/auth";
import { deleteRoadtripPhoto, updateRoadtripPhoto, RoadtripValidationError } from "@/lib/roadtrip";
import { revalidatePath } from "next/cache";

async function mutate(request: Request, params: Promise<{ id: string }>, remove: boolean) {
  if (!(await isAuthenticated())) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "허용되지 않은 요청입니다." }, { status: 403 });
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id)) return Response.json({ error: "사진을 찾을 수 없습니다." }, { status: 404 });
  try {
    const result = remove ? await deleteRoadtripPhoto(id) : await updateRoadtripPhoto(id, await request.json());
    if (!result) return Response.json({ error: "사진을 찾을 수 없습니다." }, { status: 404 });
    revalidatePath("/roadtrip");
    return Response.json(remove ? { ok: true } : result);
  } catch (error) {
    if (error instanceof RoadtripValidationError || error instanceof SyntaxError)
      return Response.json({ error: error instanceof RoadtripValidationError ? error.message : "잘못된 요청입니다." }, { status: 400 });
    console.error("Roadtrip update failed", error);
    return Response.json({ error: "변경사항을 저장하지 못했습니다. 다시 시도해주세요." }, { status: 500 });
  }
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return mutate(request, params, false);
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return mutate(request, params, true);
}