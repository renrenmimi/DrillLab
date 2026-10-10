import { test, expect, type Page } from "@playwright/test";

const STORE = "drilllab-progress-v1";

async function stored(page: Page) {
  return page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? "{}"), STORE);
}

/** 课文页上「学完没有」的徽章只在进度从 localStorage 读回来之后才渲染 —— 用它当 ready 的信号。 */
async function openLesson(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator(".done-bar")).toBeVisible();
  await expect(page.getByText("Not marked yet", { exact: true })).toBeVisible();
}

/**
 * 进度只存在 localStorage 里，而两个标签页各自持有一份内存快照。
 * 曾经的写法是每次把自己那份快照整份写回去 —— 另一个标签页期间写进去的记录
 * 就被抹掉了（审查 A1）。
 */
test.describe("progress shared by two tabs", () => {
  test("a write in one tab does not erase what the other tab wrote", async ({ context }) => {
    const first = await context.newPage();
    const second = await context.newPage();

    await openLesson(first, "/exams/foundations/node-and-npm");
    await openLesson(second, "/exams/foundations/package-json");

    // 先在第二个标签页打勾，再回到第一个标签页打勾 —— 第一个标签页的快照里没有第二个的那条
    await second.locator(".done-bar button").click();
    await expect.poll(async () => Object.keys((await stored(second)).lessons ?? {})).toContain(
      "foundations/package-json",
    );

    await first.bringToFront();
    await first.locator(".done-bar button").click();

    await expect
      .poll(async () => Object.keys((await stored(first)).lessons ?? {}).sort())
      .toEqual(["foundations/node-and-npm", "foundations/package-json"]);
  });

  test("the other tab picks up the change without a reload", async ({ context }) => {
    const first = await context.newPage();
    const second = await context.newPage();

    await openLesson(first, "/exams/foundations/node-and-npm");
    await openLesson(second, "/exams/foundations/node-and-npm");

    await second.locator(".done-bar button").click();

    // 第一个标签页没有刷新，徽章也要跟着变成「学完了」
    await expect(first.getByText("Finished", { exact: true })).toBeVisible();
  });
});

/**
 * 存着的计划 id 不在六条计划里（计划改名、导入的老数据）。外壳按「在跟计划」去渲染，
 * 而计划零件什么都画不出来 —— 全站唯一那颗〔继续〕曾经因此消失（审查 A33）。
 */
test("an unknown stored plan does not take the Continue button away", async ({ page }) => {
  await page.addInitScript((key) => {
    if (window.sessionStorage.getItem("seeded")) return;
    window.sessionStorage.setItem("seeded", "1");
    window.localStorage.setItem(
      key,
      JSON.stringify({
        lessons: {},
        exercises: {},
        rebuilds: {},
        mocks: {},
        drills: {},
        arena: {},
        coding: {},
        recent: { byMode: {} },
        plan: { id: "no-such-plan", startedAt: 1, at: 1 },
      }),
    );
  }, STORE);

  await page.goto("/drill");

  await expect.poll(async () => (await stored(page)).plan ?? null).toBeNull();
  await expect(page.locator(".cont-btn, .side-cta").filter({ visible: true }).first()).toBeVisible();
});
