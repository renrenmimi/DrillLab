import { test, expect, type Page } from "@playwright/test";

const STORE = "drilllab-progress-v1";
const ROUND = "/drill/session?scope=all&ids=q269,q380,q381";

async function marks(page: Page): Promise<Record<string, string | undefined>> {
  return page.evaluate((key) => {
    const d = JSON.parse(window.localStorage.getItem(key) ?? "{}");
    const out: Record<string, string | undefined> = {};
    for (const [id, r] of Object.entries(d.drills ?? {})) out[id] = (r as { mark: string }).mark;
    return out;
  }, STORE);
}

/** 进度要从 localStorage 读回来之后，自评才会落盘 —— 等网络和 hydration 都安静下来 */
async function openRound(page: Page, url = ROUND) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".dsess-card")).toBeVisible();
}

/** 当前是第几张。结果页上没有这一行 —— 返回 null，不等它出现 */
const position = (page: Page) =>
  page.evaluate(() => document.querySelector(".dsess-n")?.textContent ?? null);

async function rate(page: Page, key: "1" | "2" | "3") {
  const before = await position(page);
  await page.keyboard.press(key);
  // 自评会自动进下一张（或者进结果页）
  await expect.poll(async () => (await position(page)) !== before).toBe(true);
}

test.describe("a flashcard round", () => {
  test("has exactly one h1 while a card is showing", async ({ page }) => {
    await openRound(page);
    await expect(page.locator("h1")).toHaveCount(1);
  });

  // 结果页上 1 / 2 / 3 / ← / → 曾经照样生效，悄悄改掉已经存下的自评（审查 A2）
  test("the result screen ignores the rating keys", async ({ page }) => {
    await openRound(page);
    await rate(page, "1");
    await rate(page, "2");
    await rate(page, "3");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/3 cards, 3 rated/i);
    const saved = await marks(page);

    for (const key of ["1", "2", "ArrowLeft", "3", "ArrowRight", "1"]) await page.keyboard.press(key);

    expect(await marks(page)).toEqual(saved);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/3 cards, 3 rated/i);
  });

  // 中途离开再接着做，结果页曾经只算回来之后评的那几张（审查 A11）
  test("resuming keeps the ratings made before leaving", async ({ page }) => {
    await openRound(page);
    await rate(page, "3");
    await rate(page, "2");

    await page.goto("/drill/session");
    await page.getByRole("link", { name: /resume|接着做/i }).click();
    await expect(page.locator(".dsess-n")).toHaveText(/3 \/ 3/);
    await rate(page, "1");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/3 cards, 3 rated/i);
    await expect(page.locator(".dsess-missed li")).toHaveCount(1);
  });

  // 「再过一遍」之后离开，「接着做」曾经打开原来那一整轮（审查 A10）
  test("a redo round is not offered as the original round", async ({ page }) => {
    await openRound(page);
    await rate(page, "3");
    await rate(page, "2");
    await rate(page, "1");

    await page.getByRole("button", { name: /redo the missed|再过一遍/i }).click();
    await expect(page.locator(".dsess-n")).toHaveText(/1 \/ 2/);
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".dsess-n")).toHaveText(/2 \/ 2/);

    await page.goto("/drill/session");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/you left a round unfinished|上一轮还没做完/i)).toHaveCount(0);
  });
});
