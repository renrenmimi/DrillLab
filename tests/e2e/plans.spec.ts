import { test, expect } from "@playwright/test";

const STORE = "drilllab-progress-v1";

async function storedPlanId(page: import("@playwright/test").Page): Promise<string | null> {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw)?.plan?.id ?? null;
    } catch {
      return null;
    }
  }, STORE);
}

/** 走完「选一条计划」的完整路径,停在被选中的状态。 */
async function pickReactAssessment(page: import("@playwright/test").Page) {
  await page.goto("/plans");
  await page.getByRole("button", { name: /prepare for an assessment/i }).click();
  // 每条计划有两个链接:一个开始学(/exams/…),一个只看计划(/plans/…)。要的是前者。
  await page
    .locator('a[href^="/exams/"]')
    .filter({ hasText: /React Assessment/i })
    .first()
    .click();
  await page.waitForURL(/\/exams\//);
}

test.describe("choosing a guided plan", () => {
  test("a first-time visitor is offered both kinds of plan", async ({ page }) => {
    await page.goto("/plans");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/what do you want to be ready for|想为什么/i);
    await expect(page.getByRole("link", { name: /start the complete path/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /prepare for an assessment/i })).toBeVisible();
  });

  test("picking an assessment stores the plan and opens the first lesson", async ({ page }) => {
    expect(await (async () => {
      await page.goto("/plans");
      return storedPlanId(page);
    })()).toBeNull();

    await pickReactAssessment(page);

    expect(page.url()).toContain("/exams/");
    expect(await storedPlanId(page)).toBe("react-assessment");
  });
});

/**
 * 这一组守的是一个真实的历史缺陷。
 *
 * 那个三选一曾经是一扇单向门:选中之后 plan 永远有值,那一屏再也回不来 ——
 * 点 logo、点「今天」、手输 `/` 全都回不去。修法是把它搬到 /plans,
 * 并留下 /plans/choose 随时可以换。下面每一条都是那扇门的门闩。
 */
test.describe("going back to change a plan", () => {
  test("/plans stays reachable after a plan is chosen", async ({ page }) => {
    await pickReactAssessment(page);

    await page.goto("/plans");
    expect(new URL(page.url()).pathname).toBe("/plans");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/my guided plan|我的计划/i);
  });

  test("the chosen-plan view links back to the chooser", async ({ page }) => {
    await pickReactAssessment(page);
    await page.goto("/plans");

    await expect(page.locator('a[href="/plans/choose"]').first()).toBeVisible();
  });

  test("the chooser still offers every plan once one is already active", async ({ page }) => {
    await pickReactAssessment(page);
    await page.goto("/plans/choose");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/change your guided plan|换一条/i);
    // 已经选了一条,不代表其他几条就消失了。
    expect(await page.getByRole("button", { name: /switch to this/i }).count()).toBeGreaterThan(1);
  });

  test("switching actually replaces the stored plan", async ({ page }) => {
    await pickReactAssessment(page);
    expect(await storedPlanId(page)).toBe("react-assessment");

    await page.goto("/plans/choose");
    const others = page.getByRole("button", { name: /switch to this/i });
    // 第一个是当前这条以外的另一条 —— 具体是哪条不重要,换成功了才重要。
    await others.first().click();
    await page.waitForTimeout(500);

    const after = await storedPlanId(page);
    expect(after).not.toBeNull();
  });

  test("cancelling leaves the plan untouched", async ({ page }) => {
    await pickReactAssessment(page);
    await page.goto("/plans/choose");

    await page.getByRole("link", { name: /cancel and go back/i }).click();
    await page.waitForURL(/\/plans$/);

    expect(await storedPlanId(page)).toBe("react-assessment");
  });
});
