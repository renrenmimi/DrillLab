import { test, expect } from "@playwright/test";

/**
 * 首页是一张仪表盘,不问任何问题。
 *
 * 这一点是被改回来过的:早先首页先问「你想为什么做好准备?」,答完才让进,
 * 而且那是一扇单向门。这里把「不问问题」本身钉住,免得它悄悄长回来。
 */
test.describe("the home page", () => {
  test("opens straight onto where you left off, without asking anything first", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/pick up where you left off|接着上次/i);

    // 旧设计的那句话不能出现在首页上。
    await expect(page.getByText(/what do you want to be ready for/i)).toHaveCount(0);
  });

  test("offers all five tracks", async ({ page }) => {
    await page.goto("/");

    for (const slug of ["foundations", "react", "graphql-federation", "cab-booking", "interview"]) {
      await expect(page.locator(`a[href^="/exams/${slug}/"]`).first()).toBeVisible();
    }
  });

  test("offers the single-drill entries for someone with twenty minutes", async ({ page }) => {
    await page.goto("/");

    // 「只想单练某一类」那一段 —— 它是首页存在的理由之一。
    for (const href of ["/drill", "/practice", "/arena", "/mock", "/code"]) {
      await expect(page.locator(`a[href^="${href}"]`).first()).toBeVisible();
    }
  });

  test("reaches the guided plans without committing to one", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a[href="/plans"]').first()).toBeVisible();
  });
});
