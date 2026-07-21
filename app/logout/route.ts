import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function GET() {
  await clearSessionCookie();
  // A relative Location header is resolved by the browser against the
  // actual address bar, unlike new URL("/", request.url) which reflects
  // whatever Host the server received internally (e.g. localhost:3000
  // behind an nginx proxy that doesn't forward the original Host header).
  return new NextResponse(null, {
    status: 302,
    headers: { Location: "/" },
  });
}
