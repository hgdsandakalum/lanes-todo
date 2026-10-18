import { expect, test } from "@playwright/test";

const PAGES = [
  "/",
  "/dashboard",
  "/w/softsora",
  "/w/softsora/gk",
  "/w/softsora/gk?view=board",
  "/w/tutorkit",
  "/w/freelance",
  "/w/admin",
  "/routines",
  "/subscriptions",
  "/notes",
  "/notes?f=all",
  "/templates",
  "/search?q=gaku",
  "/data",
];

for (const path of PAGES) {
  test(`${path} loads cleanly`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => (m.type() === "error" ? errors.push(m.text()) : null));
    page.on("pageerror", (e) => errors.push(e.message));

    const res = await page.goto(path);
    expect(res?.status(), "status").toBe(200);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main h1, main h2").first()).toBeVisible();

    const { scroll, width } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: document.documentElement.clientWidth }));
    expect(scroll, "nothing wider than the screen").toBeLessThanOrEqual(width);
    expect(errors, "console errors").toEqual([]);
  });
}
