import { test, expect, type Page } from "@playwright/test";

/** 这一页上每一组答案 tab：看得见的是哪一份 */
async function visiblePanels(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll(".ans-tabs")].map((t) => {
      const shown = (sel: string) => {
        const el = t.querySelector(sel);
        return !!el && getComputedStyle(el).display !== "none";
      };
      return `${shown(".ans-panel-zh") ? "zh" : ""}${shown(".ans-panel-en") ? "en" : ""}`;
    }),
  );
}

/**
 * 答案的「中文 / English」tab 曾经写死默认中文，只靠外壳在 locale 变化时拨一次 radio —— 于是
 * 英文界面在 hydration 之前、每次客户端换页之后、抽认卡翻面之后看到的都是中文答案（审查 A34）。
 */
test.describe("answer language tabs", () => {
  test("the server HTML does not pre-select Chinese", async ({ request }) => {
    const html = await (await request.get("/exams/foundations/node-and-npm")).text();
    expect(html).toContain("ans-radio-zh");
    expect(html).not.toMatch(/<input[^>]*ans-radio-zh[^>]*checked/);
    expect(html).not.toMatch(/<input[^>]*checked[^>]*ans-radio-zh/);
  });

  test("English stays English after client-side navigation", async ({ page }) => {
    await page.goto("/exams/foundations/node-and-npm");
    const first = await visiblePanels(page);
    expect(first.length).toBeGreaterThan(0);
    expect(new Set(first)).toEqual(new Set(["en"]));

    await page.locator('a.lesson-jump-link[data-dir="next"]').click();
    await page.waitForURL(/\/package-json$/);
    await expect.poll(async () => [...new Set(await visiblePanels(page))]).toEqual(["en"]);
  });

  test("Chinese UI shows the Chinese answer", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("drilllab-locale", "zh"));
    await page.goto("/exams/foundations/node-and-npm");
    await expect.poll(async () => [...new Set(await visiblePanels(page))]).toEqual(["zh"]);
  });

  test("picking the other tab still switches the answer", async ({ page }) => {
    await page.goto("/exams/foundations/node-and-npm");
    const group = page.locator(".ans-tabs").first();
    await group.locator(".ans-tab").first().click(); // 「中文」
    await expect(group.locator(".ans-panel-zh")).toBeVisible();
    await expect(group.locator(".ans-panel-en")).toBeHidden();
  });

  test("a flipped flashcard answers in English", async ({ page }) => {
    await page.goto("/drill/session?scope=all&ids=q269");
    await page.locator(".dsess-flip").click();
    await expect(page.locator(".dsess-answer .ans-tabs").first()).toBeVisible();
    expect(new Set(await visiblePanels(page))).toEqual(new Set(["en"]));
  });
});
