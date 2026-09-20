import { isAuthenticated } from "@/lib/auth";
import { isSameOrigin } from "@/lib/request-origin";
import { createRoadtrip, RoadtripValidationError } from "@/lib/roadtrip";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "허용되지 않은 요청입니다." }, { status: 403 });
  try {
    const trip = await createRoadtrip(await request.json());
    revalidatePath("/");
    revalidatePath("/roadtrip", "layout");
    return Response.json(trip, { status: 201 });
  } catch (error) {
    if (error instanceof RoadtripValidationError || error instanceof SyntaxError)
      return Response.json({ error: error instanceof RoadtripValidationError ? error.message : "잘못된 요청입니다." }, { status: 400 });
    console.error("Roadtrip creation failed", error);
    return Response.json({ error: "여행 기록을 저장하지 못했습니다." }, { status: 500 });
  }
}