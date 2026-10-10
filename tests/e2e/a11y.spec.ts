import { test, expect, type Page } from "@playwright/test";

const MOCK = "/mock/react/support-tickets";

/** 看得见的标题层级，按文档顺序 */
const headingLevels = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")]
      .filter((h) => h.getClientRects().length > 0)
      .map((h) => Number(h.tagName[1])),
  );

// 「这一页故意不给运行环境」曾经是 h3，紧跟在 h1 后面（审查 A25）
test("the mock exam page does not skip heading levels", async ({ page }) => {
  await page.goto(MOCK);
  const levels = await headingLevels(page);
  expect(levels[0]).toBe(1);
  for (let i = 1; i < levels.length; i++) {
    expect(levels[i] - levels[i - 1], `heading #${i}`).toBeLessThanOrEqual(1);
  }
});

// 模拟考的自评分曾经只看 Number.isFinite —— 负数、999 / 20、1e3 都照样记下（审查 A38）
test("the mock self-score accepts only 0 to full marks, in halves", async ({ page }) => {
  await page.goto(MOCK);
  const input = page.locator("input.mk-score");
  const record = page.getByRole("button", { name: /^(record it|记下成绩)$/i });

  for (const bad of ["999", "-1", "3.3", "abc"]) {
    await input.fill(bad);
    await expect(record).toBeDisabled();
    await expect(input).toHaveAttribute("aria-invalid", "true");
  }

  await input.fill("12.5");
  await expect(record).toBeEnabled();
  await record.click();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("drilllab-progress-v1") ?? "{}").mocks?.["react/support-tickets"]?.score,
      ),
    )
    .toBe(12.5);

  // 记过的分数回填到输入框里
  await page.reload();
  await expect(input).toHaveValue("12.5");
});

// 窄屏上这几个链接曾经只有 15–22px 高，顶栏的品牌链接 17px（审查 A28）
test.describe("touch targets on a phone", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) > 960, "只在窄屏上检查");

  // Rounded to 0.01px: layout works in 1/64px units, and under load a 24px min-height
  // has come back as 23.99993896484375, which failed the >= 24 check for no real reason.
  const height = (page: Page, selector: string) =>
    page
      .locator(selector)
      .filter({ visible: true })
      .first()
      .evaluate((el) => Math.round(el.getBoundingClientRect().height * 100) / 100);

  test("the top bar brand link is as tall as the buttons beside it", async ({ page }) => {
    await page.goto("/drill");
    expect(await height(page, ".topbar-brand")).toBeGreaterThanOrEqual(44);
  });

  test("small text links are at least 24px tall", async ({ page }) => {
    await page.goto("/arena/r-rebuild-q1");
    expect(await height(page, ".crumb a")).toBeGreaterThanOrEqual(24);

    await page.goto("/arena");
    expect(await height(page, "a.exam-name")).toBeGreaterThanOrEqual(24);

    await page.goto("/exams/foundations/package-json");
    expect(await height(page, "a.lesson-jump-link")).toBeGreaterThanOrEqual(24);

    await page.goto("/drill");
    expect(await height(page, ".ladder-more-head")).toBeGreaterThanOrEqual(24);
  });
});
