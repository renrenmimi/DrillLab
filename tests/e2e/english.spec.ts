import { test, expect, type Locator } from "@playwright/test";

/** 中文字符（含全角标点）。英文界面里这些位置的英文字段都已经有了，不该再看到中文 */
const CJK = /[㐀-鿿　-〿＀-￯]/;

async function expectNoChinese(locator: Locator) {
  const count = await locator.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    // innerText 只算看得见的那一份 —— 另一种语言是 display: none
    expect(await locator.nth(i).innerText()).not.toMatch(CJK);
  }
}

/**
 * 英文是默认语言。下面这些位置曾经直接渲染中文字段（scenario / shortTitle / category /
 * 课名），而英文字段其实一直都在（审查 A3、A4、A5）。
 */
test.describe("English UI shows the English fields", () => {
  test("arena run page: scenario and course tag", async ({ page }) => {
    await page.goto("/arena/r-rebuild-q1/run");
    await expectNoChinese(page.locator(".arena-run-head .page-lede"));
    await expectNoChinese(page.locator(".arena-run-head .lesson-meta .tag"));
  });

  test("arena list and mock list", async ({ page }) => {
    await page.goto("/arena");
    await expectNoChinese(page.locator(".exam-tags .tag"));

    await page.goto("/mock");
    await expectNoChinese(page.locator(".exam-name"));
    await expectNoChinese(page.locator(".exam-desc"));
  });

  test("course overview: category, prerequisites and mock rows", async ({ page }) => {
    await page.goto("/exams/react");
    await expectNoChinese(page.locator(".page-head .eyebrow"));
    await expectNoChinese(page.locator('a[href="/exams/foundations"]').filter({ visible: true }));
    await expectNoChinese(page.locator(".exam-row .exam-name, .exam-row .exam-desc"));
  });

  test("coding problem: difficulty badge and walkthrough sentence", async ({ page }) => {
    await page.goto("/code/kanban");
    // toHaveText 读的是 textContent，会把 display: none 的中文那一份也算进去 —— 用 innerText
    expect((await page.locator(".page-head .lesson-meta .tag").nth(1).innerText()).trim()).toBe("Hard");
    await expectNoChinese(page.locator("#explain .sec-lede"));
    await page.locator("#explain summary").click();
    await expectNoChinese(page.locator("#explain .cd-note").first());
  });
});

/** 〔继续〕上的课名曾经只渲染当前 locale 那一份，而 hydration 之前 locale 一律是 en（审查 A18） */
test("the Continue button carries both languages in the server HTML", async ({ request }) => {
  const html = await (await request.get("/drill")).text();
  expect(html).toMatch(/class="cont-btn-item"><span data-lang="zh">/);
  expect(html).toMatch(/class="side-cta-item"><span data-lang="zh">/);
});

/** 中文导语里曾经原样显示 Markdown 的 **（审查 A32） */
test("the plan chooser lede has no stray Markdown in Chinese", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("drilllab-locale", "zh"));
  await page.goto("/plans/choose");
  const lede = page.locator(".ui-lede");
  await expect(lede).toContainText("不会删除任何进度");
  expect(await lede.innerText()).not.toContain("**");
  await expect(lede.locator("strong")).toHaveText("不会删除任何进度");
});
