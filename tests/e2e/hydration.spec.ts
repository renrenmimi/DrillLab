import { test, expect } from "@playwright/test";

/**
 * 线上冷加载大约九次出一次 React #418，然后整页在客户端重渲染（审查 A16）。
 *
 * 根子是时序：webpack 加载完一个 chunk 后，会把它接管的那个 HTML <script> 从 <head> 里删掉；
 * 如果这一下正好发生在 hydration 半路上，而 <head> 里又有 React 要逐个对齐的普通节点
 * （曾经是 layout 里那两段 bootstrap 脚本），游标就会错位。本机 chunk 到得太快，
 * 所以这里人为把外壳要用的那个 chunk 推迟 50–400 ms —— 修之前这样冷加载
 * 30 次里出 8 次。
 */
const MARKERS = ["drilllab-progress-v1", "get clear on how a JavaScript project runs"];
const LOADS = 12;

test("cold loads hydrate without React #418 when shell chunks arrive late", async ({ browser, viewport }, info) => {
  test.skip((viewport?.width ?? 0) >= 768, "时序问题和宽度无关，只在一个 project 里跑，省 CI 时间");
  test.setTimeout(120_000);
  const baseURL = info.project.use.baseURL;

  let failures = 0;
  for (let i = 0; i < LOADS; i++) {
    const ctx = await browser.newContext({ baseURL, viewport: viewport ?? undefined });
    await ctx.route(/\/_next\/static\/chunks\/.*\.js$/, async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      if (MARKERS.some((m) => body.includes(m))) {
        await new Promise((r) => setTimeout(r, 50 + Math.random() * 350));
      }
      await route.fulfill({ response, body });
    });
    const page = await ctx.newPage();
    let hit = false;
    page.on("pageerror", (e) => {
      if (/#418|Hydration failed/i.test(e.message)) hit = true;
    });
    await page.goto("/path");
    await page.waitForLoadState("networkidle");
    if (hit) failures++;
    await ctx.close();
  }
  expect(failures, `#418 in ${failures} of ${LOADS} cold loads`).toBe(0);
});
