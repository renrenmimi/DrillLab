import { test, expect } from "@playwright/test";

/**
 * 窄屏抽屉。桌面上侧栏一直在,窄屏上它收进一个按钮里 ——
 * 那个按钮要是坏了,窄屏访客就再也走不到别的章节。
 */
test.describe("the mobile drawer", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 768, "抽屉只在窄屏出现");

  test("opens and closes from the menu button", async ({ page }) => {
    await page.goto("/");
    const menu = page.locator(".menu-btn");

    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute("aria-expanded", "false");

    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");

    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
  });

  test("Escape closes it, so it never traps the page", async ({ page }) => {
    await page.goto("/");
    const menu = page.locator(".menu-btn");

    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
  });

  test("its label says what the button will do", async ({ page }) => {
    await page.goto("/");
    const menu = page.locator(".menu-btn");

    await expect(menu).toHaveAttribute("aria-label", /open/i);
    await menu.click();
    await expect(menu).toHaveAttribute("aria-label", /close/i);
  });

  test("navigates from inside the drawer", async ({ page }) => {
    await page.goto("/");
    await page.locator(".menu-btn").click();

    await page.locator('a[href="/drill"]').filter({ visible: true }).first().click();
    await page.waitForURL(/\/drill/);

    expect(new URL(page.url()).pathname).toBe("/drill");
  });

  test("no horizontal overflow at 360px", async ({ page }) => {
    await page.goto("/");

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });
});

test.describe("the desktop sidebar", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 768, "宽屏才有常驻侧栏");

  test("navigation is reachable without opening anything", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a[href="/drill"]').first()).toBeVisible();
  });
});
