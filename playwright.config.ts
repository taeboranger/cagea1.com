import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  use: { baseURL: "http://localhost:3100", browserName: "chromium", channel: process.platform === "win32" ? "msedge" : undefined, headless: true, timezoneId: "Asia/Seoul" },
  webServer: { command: "npm run dev -- --port 3100", url: "http://localhost:3100/roadtrip", reuseExistingServer: true, timeout: 120_000 },
});
