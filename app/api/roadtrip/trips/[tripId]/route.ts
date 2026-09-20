import { isAuthenticated } from "@/lib/auth";
import { isSameOrigin } from "@/lib/request-origin";
import { deleteRoadtrip, updateRoadtrip, RoadtripValidationError } from "@/lib/roadtrip";
import { revalidatePath } from "next/cache";

async function mutate(request: Request, params: Promise<{ tripId: string }>, remove: boolean) {
  if (!(await isAuthenticated())) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "허용되지 않은 요청입니다." }, { status: 403 });
  const { tripId } = await params;
  try {
    const result = remove ? await deleteRoadtrip(tripId) : await updateRoadtrip(tripId, await request.json());
    if (!result) return Response.json({ error: "여행 기록을 찾을 수 없습니다." }, { status: 404 });
    revalidatePath("/");
    revalidatePath("/roadtrip", "layout");
    return Response.json(remove ? { ok: true } : result);
  } catch (error) {
    if (error instanceof RoadtripValidationError || error instanceof SyntaxError)
      return Response.json({ error: error instanceof RoadtripValidationError ? error.message : "잘못된 요청입니다." }, { status: 400 });
    console.error("Roadtrip mutation failed", error);
    return Response.json({ error: "여행 기록을 변경하지 못했습니다." }, { status: 500 });
  }
}
export async function PATCH(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  return mutate(request, params, false);
}
export async function DELETE(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  return mutate(request, params, true);
}