import { test, expect, type Page } from "@playwright/test";

// 编辑器（CodeMirror）在本站的 chunk 里，不依赖 CodeSandbox 的远程打包器 ——
// 所以这些用例不需要外网，也不等测试跑完。
const PROBLEM = "/code/hand-curry";
const MARK = "// my own line";

async function openWorkspace(page: Page) {
  await page.goto(PROBLEM);
  await page.getByRole("button", { name: /open the workspace|打开工作区/i }).click();
  await expect(page.locator(".sbx .cm-content")).toBeVisible();
}

async function typeAtEnd(page: Page, text: string) {
  await page.locator(".sbx .cm-content").click();
  await page.keyboard.press("Control+End");
  await page.keyboard.press("Meta+End");
  await page.keyboard.insertText(`\n${text}\n`);
}

const editorText = (page: Page) => page.locator(".sbx .cm-content").innerText();

/** 写了一半的代码曾经被任何一次重渲染（比如切主题）或者切档清掉（审查 A7） */
test.describe("the coding workspace keeps your edits", () => {
  test("switching the theme does not reset the editor", async ({ page }) => {
    await openWorkspace(page);
    await typeAtEnd(page, MARK);
    await expect.poll(() => editorText(page)).toContain(MARK);

    await page.locator(".topbar-tools .icon-btn").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.waitForTimeout(500);
    expect(await editorText(page)).toContain(MARK);
  });

  test("switching to blank slate and back brings the edits back", async ({ page }) => {
    await openWorkspace(page);
    await typeAtEnd(page, MARK);
    await expect.poll(() => editorText(page)).toContain(MARK);
    await page.waitForTimeout(600); // 改动是 400 ms 防抖之后才写进 sessionStorage

    const blank = page.getByRole("button", { name: /blank slate|空白重来/i });
    const scaffold = page.getByRole("button", { name: /with scaffold|带脚手架/i });
    await blank.click();
    await expect(blank).toHaveAttribute("aria-pressed", "true");
    await expect(scaffold).toHaveAttribute("aria-pressed", "false");

    await scaffold.click();
    await expect(scaffold).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => editorText(page)).toContain(MARK);
  });

  test("the starter files can be restored", async ({ page }) => {
    await openWorkspace(page);
    await typeAtEnd(page, MARK);
    const restore = page.getByRole("button", { name: /restore the starter files|恢复起始文件/i });
    await expect(restore).toBeVisible();
    await restore.click();
    await expect.poll(() => editorText(page)).not.toContain(MARK);
  });
});

/** 「空白重来」档下讲解和答案不渲染了，右栏目录里那两条曾经还在，点了没反应（审查 A21） */
test("blank slate hides the table-of-contents entries it removes", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) < 1280, "右栏目录只在 ≥1280px 出现");
  await openWorkspace(page);
  const explain = page.locator('.rail-toc a[href="#explain"]');
  await expect(explain).toBeVisible();

  await page.getByRole("button", { name: /blank slate|空白重来/i }).click();
  await expect(explain).toBeHidden();
  await expect(page.locator('.rail-toc a[href="#solution"]')).toBeHidden();
  await expect(page.locator('.rail-toc a[href="#workspace"]')).toBeVisible();
});
