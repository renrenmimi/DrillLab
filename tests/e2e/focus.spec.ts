import { test, expect, type Page } from "@playwright/test";

const CJK = /[㐀-鿿]/;

async function openSearch(page: Page) {
  await page.locator(".search-trigger").click();
  await expect(page.locator(".search-input")).toBeFocused();
  // 索引是第一次打开时才懒加载的
  await expect(page.locator(".search-hit").first()).toBeVisible();
}

const activeInPanel = (page: Page) =>
  page.evaluate(() => !!document.activeElement?.closest(".search-panel"));

/**
 * 搜索对话框（审查 A12）：Tab 曾经一路走出对话框，焦点在结果上时按 Esc 关不掉，
 * 关掉之后焦点落在 body 上；方向键选中的那一条对读屏也不可见。
 */
test.describe("the search dialog", () => {
  test("Tab stays inside the dialog", async ({ page }) => {
    await page.goto("/drill");
    await openSearch(page);
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      expect(await activeInPanel(page)).toBe(true);
    }
  });

  test("Esc closes it from a result, and focus goes back to the trigger", async ({ page }) => {
    await page.goto("/drill");
    await openSearch(page);
    await page.keyboard.press("Tab"); // 到第一条结果
    await page.keyboard.press("Escape");
    await expect(page.locator(".search-panel")).toHaveCount(0);
    await expect(page.locator(".search-trigger")).toBeFocused();
  });

  test("the selected result is exposed to assistive technology", async ({ page }) => {
    await page.goto("/drill");
    await openSearch(page);
    const input = page.locator(".search-input");
    await expect(input).toHaveAttribute("role", "combobox");
    await expect(page.locator("#search-results")).toHaveAttribute("role", "listbox");

    await page.keyboard.press("ArrowDown");
    await expect(input).toHaveAttribute("aria-activedescendant", "search-hit-1");
    await expect(page.locator("#search-hit-1")).toHaveAttribute("aria-selected", "true");
  });

  // 英文标题曾经没进索引：英文界面显示中文标题，用英文词也搜不到（审查 A6）
  test("coding problems are found by their English title and shown in English", async ({ page }) => {
    await page.goto("/drill");
    await openSearch(page);
    await page.keyboard.type("race conditions");
    const hit = page.locator('.search-hit[href="/code/fetch-user"]');
    await expect(hit).toBeVisible();
    expect(await hit.locator(".search-hit-title").innerText()).not.toMatch(CJK);
  });
});

/** 窄屏抽屉的两条焦点路径（审查 A13、A14） */
test.describe("the drawer gives focus back", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 768, "抽屉只在窄屏出现");

  test("closing it from the scrim returns focus to the menu button", async ({ page }) => {
    await page.goto("/drill");
    const menu = page.locator(".menu-btn");
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");

    await page.locator(".drawer-scrim").click({ position: { x: 340, y: 400 } });
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(menu).toBeFocused();
  });

  test("widening the window closes it instead of trapping Tab in the sidebar", async ({ page }) => {
    await page.goto("/drill");
    await page.locator(".menu-btn").click();
    await expect(page.locator(".sidebar")).toHaveAttribute("role", "dialog");

    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(page.locator(".sidebar")).not.toHaveAttribute("role", "dialog");
    await expect(page.locator(".sidebar")).not.toHaveAttribute("data-open", "true");
  });
});
