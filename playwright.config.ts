import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3200);
const BASE_URL = process.env.BASE_URL ?? `http://127.0.0.1:${PORT}`;
const LOCAL = !process.env.BASE_URL;

/**
 * 这些用例守的是「怎么走到内容」，不是内容本身 —— 首页读不读得懂、计划选不选得动、
 * 选完还回不回得去、窄屏抽屉开不开得了。所以跑的是 `next start` 而不是 dev server：
 * 抽屉的开合与 /plans 的分支都依赖真实的 hydration 时序。
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "list" : [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
    },
    // 抽屉只在窄屏出现,所以它需要一个真的窄屏。
    {
      name: "phone",
      use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 760 } },
    },
  ],
  webServer: LOCAL
    ? {
        command: `npx next start -p ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: "ignore",
      }
    : undefined,
});
