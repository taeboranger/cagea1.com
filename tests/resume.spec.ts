import { test, expect } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { createHmac, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import projects from "../content/resume-projects-2026-09.json";

loadEnvConfig(process.cwd());
test("project data preserves the previous resume and adds each project once", async () => {
  const resume = JSON.parse(await readFile("data/resume.json", "utf8"));
  for (const project of projects) {
    expect(resume.projects.filter((p: { title: string }) => p.title === project.title)).toEqual([project]);
  }
  const previous = { ...resume, projects: resume.projects.filter((p: { id: string }) => !projects.some(n => n.id === p.id)) };
  expect(createHash("sha256").update(JSON.stringify(previous)).digest("hex"))
    .toBe("20caef5ab687f97c90c42ffc5271108d9a67441abb034aad9bd038dc87bceb0d");
});
test("resume displays projects, links and paragraphs at desktop and mobile widths", async ({ page, context }) => {
  const secret = process.env.SITE_AUTH_SECRET;
  expect(secret, "Local session secret is required").toBeTruthy();
  const expires = String(Date.now() + 3600000);
  await context.addCookies([{ name: "cagea1_session",
    value: expires + "." + createHmac("sha256", secret!).update(expires).digest("hex"),
    url: "http://localhost:3100", httpOnly: true, sameSite: "Lax" }]);
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto("/resume");
    expect(response?.status()).toBe(200);
    for (const project of projects) {
      const heading = page.getByRole("heading", { name: project.title, exact: true });
      await expect(heading).toHaveCount(1);
      const card = heading.locator("../..");
      await expect(card.locator(".rich-content p")).toHaveCount(project.title === "SKKEDULE" ? 3 : 4);
      await expect(card.locator('a[aria-label="GitHub 링크"]')).toHaveAttribute("href", project.githubLink);
      if (project.link) await expect(card.locator('a[aria-label="관련 링크"]')).toHaveAttribute("href", project.link);
      for (const anchor of await card.locator("a").all()) {
        await expect(anchor).toHaveAttribute("target", "_blank");
        await expect(anchor).toHaveAttribute("rel", "noopener noreferrer");
      }
      await expect(card.locator(".rich-content")).toBeVisible();
    }
    await page.screenshot({ path: `test-results/resume-${width}.png`, fullPage: true });
    const overflow = await page.evaluate(() => Array.from(document.querySelectorAll('main *')).filter(el => el.getBoundingClientRect().right > innerWidth).map(el => ({ tag: el.tagName, className: el.className })));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), JSON.stringify({ width, overflow })).toBeTruthy();
  }
});
test("anonymous requests preserve the existing private resume setting", async ({ request }) => {
  const resume = JSON.parse(await readFile("data/resume.json", "utf8"));
  if (!resume.isPublic) {
    const response = await request.get("/resume");
    expect(response.status()).toBe(404);
    const html = await response.text();
    for (const project of projects) expect(html).not.toContain(project.githubLink);
  }
});
