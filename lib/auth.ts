import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "cagea1_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function getSecret() {
  const secret = process.env.SITE_AUTH_SECRET;
  if (!secret) {
    throw new Error("SITE_AUTH_SECRET environment variable is not set");
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createSessionToken() {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

function isValidToken(token: string | undefined) {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!safeEqual(sign(payload), signature)) return false;
  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  return true;
}

export function verifyCredentials(username: string, password: string) {
  const expectedUsername = process.env.SITE_USERNAME ?? "";
  const expectedPassword = process.env.SITE_PASSWORD ?? "";
  if (!expectedUsername || !expectedPassword) return false;
  return (
    safeEqual(username, expectedUsername) &&
    safeEqual(password, expectedPassword)
  );
}

export async function isAuthenticated() {
  const store = await cookies();
  return isValidToken(store.get(COOKIE_NAME)?.value);
}

export async function setSessionCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Use in Server Components (pages) — redirects to /login when not authenticated. */
export async function requireAuth(from: string) {
  if (!(await isAuthenticated())) {
    redirect(`/login?from=${encodeURIComponent(from)}`);
  }
}

/** Use inside Server Actions — throws when not authenticated. */
export async function requireAuthAction() {
  if (!(await isAuthenticated())) {
    throw new Error("Unauthorized");
  }
}
