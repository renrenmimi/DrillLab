import { test, expect, type Page } from "@playwright/test";

const STORE = "drilllab-progress-v1";
const ID = "r-rebuild-q2"; // 限时 45 分钟

async function stored(page: Page) {
  return page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? "{}"), STORE);
}

async function startAndHandIn(page: Page) {
  await page.goto(`/arena/${ID}`);
  await page.getByRole("button", { name: /start the clock|开始计时/i }).click();
  await page.waitForURL(new RegExp(`/arena/${ID}/run$`));
  await expect(page.locator(".arena-clockbar[data-state='live']")).toBeVisible();

  await page.getByRole("button", { name: /^(hand in|交卷)$/i }).click();
  await page.getByRole("button", { name: /yes, hand in|确定，交卷/i }).click();
  await page.waitForURL(new RegExp(`/arena/${ID}/review$`));
  await expect(page.locator(".arena-box[data-step='checkoff']")).toBeVisible();
}

/**
 * 用时的终点必须是「按下交卷」那一刻。曾经那一刻从来没写进存储，复盘页按「进这一页」
 * 现算 —— 刷新一下、或者隔一会儿才回来自评，按时交的卷就变成了超时（审查 A31）。
 */
test.describe("the arena hand-in time", () => {
  test("handing in records the moment it happened", async ({ page }) => {
    await startAndHandIn(page);
    const live = (await stored(page)).arenaLive;
    expect(typeof live?.submittedAt).toBe("number");
    expect(live.submittedAt).toBeGreaterThanOrEqual(live.startedAt);
  });

  test("the review page and the record use the hand-in time, not the time you come back", async ({ page }) => {
    await startAndHandIn(page);

    // 假装是 40 分钟前开考、10 分钟前交的卷 —— 交卷时没超时，现在已经超过 45 分钟限时
    await page.evaluate((key) => {
      const d = JSON.parse(window.localStorage.getItem(key)!);
      const now = Date.now();
      d.arenaLive.startedAt = now - 50 * 60_000;
      d.arenaLive.submittedAt = now - 10 * 60_000;
      window.localStorage.setItem(key, JSON.stringify(d));
    }, STORE);
    await page.reload();

    await expect(page.locator(".arena-verdict-time")).toHaveText("40:00");
    await expect(page.locator(".arena-verdict-sub .tag[data-tone='warn']")).toHaveCount(0);

    for (const box of await page.locator(".arena-check input[type='checkbox']").all()) await box.check();
    await page.getByRole("button", { name: /record it|记下这次/i }).click();

    await expect.poll(async () => (await stored(page)).arena?.[ID]?.length ?? 0).toBe(1);
    const attempt = (await stored(page)).arena[ID][0];
    expect(attempt.outcome).toBe("passed");
    expect(Math.round((attempt.endedAt - attempt.startedAt) / 60_000)).toBe(40);
  });
});
