import { test, expect } from "@playwright/test";

/** r-state 这一节的「写代码块」练习有英文起始代码（starterEn） */
const LESSON = "/exams/react/r-state";
const CJK = /[㐀-鿿]/;

test.describe("the code-completion editor", () => {
  // 每一种 Tab 曾经都被拦下来插两个空格 —— 只用键盘的人进了这个框就出不来（审查 A36）
  test("Tab indents, but Shift+Tab and Esc-then-Tab leave the editor", async ({ page }) => {
    await page.goto(LESSON);
    const editor = page.getByRole("textbox", { name: /code editor|代码编辑区/i }).first();
    await expect(editor).toHaveAttribute("aria-describedby", /.+/);

    await editor.focus();
    const before = (await editor.inputValue()).length;
    await page.keyboard.press("Tab");
    await expect(editor).toBeFocused();
    expect((await editor.inputValue()).length).toBe(before + 2);

    await page.keyboard.press("Shift+Tab");
    await expect(editor).not.toBeFocused();

    await editor.focus();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Tab");
    await expect(editor).not.toBeFocused();
  });

  // 起始代码曾经一律是中文那一份 —— starterEn 写了 29 处，一处都没用上（审查 A24）
  test("the English UI starts from the English starter", async ({ page }) => {
    await page.goto(LESSON);
    const editor = page.locator("textarea.editor-area").first();
    await expect(editor).not.toHaveValue("");
    expect(await editor.inputValue()).not.toMatch(CJK);
  });

  test("switching language swaps an untouched starter but keeps edits", async ({ page }) => {
    await page.goto(LESSON);
    const editor = page.locator("textarea.editor-area").first();
    const lang = page.locator(".lang-btn");

    await lang.click();
    await expect.poll(async () => CJK.test(await editor.inputValue())).toBe(true);

    await editor.focus();
    await page.keyboard.press("End");
    await page.keyboard.type(" // mine");
    const edited = await editor.inputValue();
    await lang.click();
    await expect(editor).toHaveValue(edited);
  });

  // 窄屏上代码窗的文件名会被省略号截掉（审查 A27）
  test("file names carry a title with the full name", async ({ page }) => {
    await page.goto(LESSON);
    const names = page.locator(".codewin-name").filter({ visible: true });
    expect(await names.count()).toBeGreaterThan(0);
    for (const name of await names.all()) {
      const title = await name.getAttribute("title");
      expect(title).toBeTruthy();
      expect((await name.innerText()).trim()).toBe(title!.trim());
    }
  });
});

// iOS Safari 会在聚焦字号小于 16px 的输入框时把整页放大（审查 A23）
test("inputs are at least 16px on a phone", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) > 960, "只在窄屏和触屏上放大字号");
  for (const [url, sel] of [
    [LESSON, "textarea.editor-area"],
    ["/exams/foundations/package-json", "input.blank-input"],
    ["/drill", "input.drill-search-input"],
    ["/mock/react/support-tickets", "input.mk-score"],
  ] as const) {
    await page.goto(url);
    const size = await page.locator(sel).first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(size, `${sel} on ${url}`).toBeGreaterThanOrEqual(16);
  }
});
