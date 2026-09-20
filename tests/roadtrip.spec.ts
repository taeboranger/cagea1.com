import { test, expect, type APIRequestContext } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import type { RoadtripPhoto } from "../lib/roadtrip-types";
import { normalizeRoadtripStore, LEGACY_TRIP_ID } from "../lib/roadtrip-data";

loadEnvConfig(process.cwd());
const origin = "http://localhost:3100";
function sessionToken() {
  const expiry = String(Date.now() + 60 * 60 * 1000);
  return expiry + "." + createHmac("sha256", process.env.SITE_AUTH_SECRET!).update(expiry).digest("hex");
}
const created: string[] = [];
const createdTrips: string[] = [];
const authHeaders = () => ({ Origin: origin, Cookie: "cagea1_session=" + sessionToken() });
async function createTrip(request: APIRequestContext, title = "테스트 여행") {
  const response = await request.post("/api/roadtrip/trips", { headers: authHeaders(), data: { title, memo: "여행 이야기" } });
  expect(response.status()).toBe(201);
  const trip = await response.json();
  createdTrips.push(trip.id);
  return trip;
}
test.afterEach(async ({ request }) => {
  for (const id of created.splice(0)) {
    const response = await request.delete("/api/roadtrip/" + id, { headers: authHeaders() });
    expect(response.ok()).toBeTruthy();
  }
  for (const id of createdTrips.splice(0)) {
    const response = await request.delete("/api/roadtrip/trips/" + id, { headers: authHeaders() });
    expect(response.ok()).toBeTruthy();
  }
});
test("API protects writes, validates images and coordinates, and preserves concurrent uploads", async ({ request }) => {
  expect((await request.post("/api/roadtrip")).status()).toBe(401);
  const headers = { Origin: origin, Cookie: "cagea1_session=" + sessionToken() };
  expect((await request.post("/api/roadtrip", { headers: { ...headers, Origin: "https://other.example" } })).status()).toBe(403);
  const image = await sharp({ create: { width: 2400, height: 1600, channels: 3, background: "#bdc6b9" } }).jpeg().toBuffer();
  const trip = await createTrip(request);
  const details = { tripId: trip.id, memo: "concurrency test", location: { lat: 0, lng: 0 }, takenAt: null, originalName: "api-test.jpg" };
  const invalid = await request.post("/api/roadtrip", { headers, multipart: {
    photo: { name: "test.jpg", mimeType: "image/jpeg", buffer: image },
    details: JSON.stringify({ ...details, location: { lat: 91, lng: 0 } }),
  } });
  expect(invalid.status()).toBe(400);
  expect((await request.post("/api/roadtrip", { headers, multipart: {
    photo: { name: "fake.jpg", mimeType: "image/jpeg", buffer: Buffer.from("not an image") },
    details: JSON.stringify(details),
  } })).status()).toBe(400);
  const responses = await Promise.all(Array.from({ length: 3 }, () => request.post("/api/roadtrip", { headers, multipart: {
    photo: { name: "test.jpg", mimeType: "image/jpeg", buffer: image }, details: JSON.stringify(details),
  } })));
  for (const response of responses) {
    expect(response.status()).toBe(201);
    const photo = await response.json();
    created.push(photo.id);
    expect(photo.width).toBe(1920);
    expect(photo.height).toBe(1280);
    expect(photo.location).toEqual({ lat: 0, lng: 0 });
    const saved = await request.get(photo.url);
    expect(saved.status()).toBe(200);
    expect(saved.headers()["content-type"]).toBe("image/webp");
  }
  const stored: RoadtripPhoto[] = JSON.parse(await readFile("data/roadtrip.json", "utf8")).photos;
  expect(stored.filter((photo) => created.includes(photo.id))).toHaveLength(3);
  expect((await request.patch("/api/roadtrip/" + created[0], { headers, data: { memo: "a".repeat(2001), location: null } })).status()).toBe(400);
});

test("photo upload, EXIF GPS, memo editing, reload persistence, mobile layout and deletion", async ({ page, context, request }, testInfo) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await context.addCookies([{ name: "cagea1_session", value: sessionToken(), url: origin }]);
  await page.setViewportSize({ width: 1440, height: 1100 });
  const trip = await createTrip(request);
  await page.goto("/roadtrip/" + trip.id);
  await expect(page.getByRole("heading", { name: trip.title, exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "지도", exact: true })).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: testInfo.outputPath("roadtrip-desktop-empty.png"), fullPage: true });
  await page.getByRole("button", { name: "+ 사진 추가", exact: true }).click();
  const withGps = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#9aac99" } }).jpeg()
    .withExif({ IFD0: { Orientation: "6" }, IFD2: { DateTimeOriginal: "2024:01:02 03:04:05" },
      IFD3: { GPSLatitudeRef: "N", GPSLatitude: "37/1 34/1 0/1", GPSLongitudeRef: "E", GPSLongitude: "126/1 58/1 0/1" } }).withMetadata({ orientation: 6 }).toBuffer();
  const noGps = await sharp({ create: { width: 500, height: 300, channels: 3, background: "#cbb6a2" } }).png().toBuffer();
  await page.getByLabel("여행 사진 선택").setInputFiles([
    { name: "gps-test.jpg", mimeType: "image/jpeg", buffer: withGps },
    { name: "no-gps-test.png", mimeType: "image/png", buffer: noGps },
  ]);
  await page.getByLabel("함께 남길 메모", { exact: false }).fill("첫 여행 메모");
  const uploaded: RoadtripPhoto[] = [];
  page.on("response", async (response) => {
    if (response.url().endsWith("/api/roadtrip") && response.status() === 201) {
      const photo = await response.json(); uploaded.push(photo); created.push(photo.id);
    }
  });
  await page.getByRole("button", { name: "사진 저장", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "2장의 사진을 저장했습니다." })).toBeVisible({ timeout: 30_000 });
  expect(uploaded).toHaveLength(2);
  const gps = uploaded.find((photo) => photo.originalName === "gps-test.jpg")!;
  expect(gps.location?.lat).toBeCloseTo(37.566666, 4);
  expect(gps.location?.lng).toBeCloseTo(126.966666, 4);
  expect(gps.takenAt).toBe("2024-01-01T18:04:05.000Z");
  expect(Math.max(gps.width, gps.height)).toBe(1920);
  expect(gps.height).toBeGreaterThan(gps.width);
  expect(uploaded.find((photo) => photo.originalName === "no-gps-test.png")?.location).toBeNull();
  await page.getByLabel("이 순간의 메모").fill("수정한 여행 메모");
  await page.getByLabel("위도", { exact: true }).fill("0");
  await page.getByLabel("경도", { exact: true }).fill("0");
  await page.getByRole("button", { name: "변경사항 저장" }).click();
  await expect(page.getByRole("status").filter({ hasText: "사진의 메모와 위치를 저장했습니다." })).toBeVisible();
  await page.reload();
  await page.getByRole("button").filter({ hasText: "수정한 여행 메모" }).click();
  await expect(page.getByLabel("이 순간의 메모")).toHaveValue("수정한 여행 메모");
  await expect(page.getByLabel("위도", { exact: true })).toHaveValue("0");
  await page.getByRole("button", { name: "지도에서 지정", exact: true }).click();
  const mapBox = await page.getByRole("region", { name: "지도", exact: true }).boundingBox();
  expect(mapBox).not.toBeNull();
  // Google places its mouse-event pane above the accessible map region.
  await page.mouse.click(mapBox!.x + 180, mapBox!.y + 120);
  await expect(page.getByLabel("위도", { exact: true })).not.toHaveValue("0");
  await page.getByRole("button", { name: "변경사항 저장" }).click();
  await expect(page.getByRole("status").filter({ hasText: "사진의 메모와 위치를 저장했습니다." })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("roadtrip-desktop-photos.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: testInfo.outputPath("roadtrip-mobile.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForTimeout(2200); // Allow the existing sky background transition to finish.
  await page.screenshot({ path: testInfo.outputPath("roadtrip-mobile-dark.png"), fullPage: true });
  await page.getByRole("button", { name: "사진 삭제", exact: true }).click();
  const deleted = page.waitForResponse((response) => response.request().method() === "DELETE");
  await page.getByRole("button", { name: "삭제하기", exact: true }).click();
  const response = await deleted;
  expect(response.status()).toBe(200);
  const deletedId = response.url().split("/").pop()!;
  created.splice(created.indexOf(deletedId), 1);
  expect((await request.get("/uploads/roadtrip/" + deletedId + ".webp")).status()).toBe(404);
  expect(runtimeErrors).toEqual([]);
});

test("legacy photo lists migrate without losing images, coordinates or memos", () => {
  const original = [{
    id: "legacy-photo", url: "/uploads/roadtrip/legacy-photo.webp", width: 640, height: 480,
    originalName: "before.jpg", location: { lat: 37, lng: 127 }, takenAt: null,
    createdAt: "2026-09-19T10:00:00.000Z", memo: "기존 메모",
  }];
  const store = normalizeRoadtripStore(original);
  expect(store.trips).toHaveLength(1);
  expect(store.trips[0].title).toBe("기존 여행 기록");
  expect(store.photos[0]).toEqual({ ...original[0], tripId: LEGACY_TRIP_ID });
  expect(original[0]).not.toHaveProperty("tripId");
  expect(normalizeRoadtripStore(store)).toEqual(store);
  expect(normalizeRoadtripStore([]).trips).toEqual([]);
  expect(() => normalizeRoadtripStore({ version: 99 })).toThrow();
});

test("multiple trips appear on the homepage and keep their photos separate", async ({ page, context, request }, testInfo) => {
  const headers = authHeaders();
  expect((await request.post("/api/roadtrip/trips", { data: { title: "blocked", memo: "" } })).status()).toBe(401);
  expect((await request.post("/api/roadtrip/trips", { headers, data: { title: " ", memo: "" } })).status()).toBe(400);
  expect((await request.post("/api/roadtrip/trips", { headers: { ...headers, Origin: "https://other.example" }, data: { title: "blocked", memo: "" } })).status()).toBe(403);
  await context.addCookies([{ name: "cagea1_session", value: sessionToken(), url: origin }]);
  await page.goto("/roadtrip");
  await page.getByRole("link", { name: "+ 새 여행 기록", exact: true }).click();
  await page.getByLabel("여행 제목").fill("제주에서 보낸 여름");
  await page.getByLabel("여행 메모", { exact: false }).fill("바다를 따라 천천히");
  const firstResponse = page.waitForResponse((response) => response.url().endsWith("/api/roadtrip/trips") && response.status() === 201);
  await page.getByRole("button", { name: "여행 만들기", exact: true }).click();
  const first = await (await firstResponse).json();
  createdTrips.push(first.id);
  await expect(page).toHaveURL("/roadtrip/" + first.id);
  const second = await createTrip(request, "부산의 가을");
  const image = await sharp({ create: { width: 600, height: 400, channels: 3, background: "#90b3c6" } }).jpeg().toBuffer();
  const tripPhotos: RoadtripPhoto[] = [];
  for (const [trip, filename] of [[first, "jeju.jpg"], [second, "busan.jpg"]] as const) {
    const response = await request.post("/api/roadtrip", { headers, multipart: {
      photo: { name: filename, mimeType: "image/jpeg", buffer: image },
      details: JSON.stringify({ tripId: trip.id, originalName: filename, memo: "", takenAt: null, location: null }),
    } });
    expect(response.status()).toBe(201);
    tripPhotos.push(await response.json());
  }
  expect((await request.patch("/api/roadtrip/trips/" + second.id, { data: { title: "blocked", memo: "" } })).status()).toBe(401);
  expect((await request.delete("/api/roadtrip/trips/" + second.id)).status()).toBe(401);
  await page.goto("/roadtrip/" + first.id);
  const photoList = page.getByRole("region", { name: "여행 사진 목록" });
  await expect(photoList.getByRole("button").filter({ hasText: "jeju.jpg" })).toBeVisible();
  await expect(photoList.getByRole("button").filter({ hasText: "busan.jpg" })).toHaveCount(0);
  await page.getByRole("button", { name: "여행 정보 수정", exact: true }).click();
  await page.getByLabel("여행 제목").fill("제주의 여름, 다시");
  await page.getByRole("button", { name: "여행 정보 저장" }).click();
  await expect(page.getByRole("heading", { name: "제주의 여름, 다시", exact: true })).toBeVisible();
  await context.clearCookies();
  await page.goto("/");
  const homepage = page.getByRole("region", { name: "여행 기록", exact: true });
  await expect(homepage.getByRole("heading", { name: "제주의 여름, 다시" })).toBeVisible();
  await expect(homepage.getByRole("heading", { name: "부산의 가을" })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await homepage.screenshot({ path: testInfo.outputPath("home-trips-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await homepage.screenshot({ path: testInfo.outputPath("home-trips-mobile.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await homepage.getByRole("link").filter({ hasText: "부산의 가을" }).click();
  await expect(page).toHaveURL("/roadtrip/" + second.id);
  await expect(page.getByRole("button", { name: "+ 사진 추가", exact: true })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "여행 사진 목록" }).getByRole("button").filter({ hasText: "busan.jpg" })).toBeVisible();
  await context.addCookies([{ name: "cagea1_session", value: sessionToken(), url: origin }]);
  await page.reload();
  await page.getByRole("button", { name: "여행 정보 수정", exact: true }).click();
  await page.getByRole("button", { name: "여행 삭제", exact: true }).click();
  await page.getByRole("button", { name: "여행과 사진 모두 삭제", exact: true }).click();
  await expect(page).toHaveURL("/roadtrip");
  createdTrips.splice(createdTrips.indexOf(second.id), 1);
  expect((await request.get(tripPhotos[1].url)).status()).toBe(404);
  expect((await request.get(tripPhotos[0].url)).status()).toBe(200);
  expect((await request.get("/roadtrip/" + second.id)).status()).toBe(404);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "제주의 여름, 다시" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "부산의 가을" })).toHaveCount(0);
});