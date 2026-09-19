/** Match the external host when Next runs behind the site's reverse proxy. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim()
      ?? request.headers.get("host") ?? new URL(request.url).host;
    return new URL(origin).host === host;
  } catch { return false; }
}
