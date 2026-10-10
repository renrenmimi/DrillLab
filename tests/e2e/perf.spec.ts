import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * content/nav 的数据（gzip 后约 31 KB）曾经跟着外壳进了每一个路由的首屏 ——
 * continue.tsx、sidebars.tsx、search.tsx 都在根 layout 下面静态 import 它（审查 A35）。
 * 这几页自己用不上它，首屏里就不该有。`rebuildIds` 是 nav 清单里才有的字段名。
 */
const NAV_ONLY = "rebuildIds";

async function scriptsOf(request: APIRequestContext, path: string) {
  const html = await (await request.get(path)).text();
  const srcs = [...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="(\/_next\/static\/[^"]+\.js)"/g)].map((m) => m[1]);
  return { html, srcs: [...new Set(srcs)] };
}

test.describe("first-load JavaScript", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 768, "只看服务端给的 HTML，宽度无关，跑一遍就够");

  for (const path of ["/", "/plans", "/guide", "/reference"]) {
    test(`${path} does not ship the nav data up front`, async ({ request }) => {
      const { srcs } = await scriptsOf(request, path);
      expect(srcs.length).toBeGreaterThan(0);
      for (const src of srcs) {
        const js = await (await request.get(src)).text();
        expect(js.includes(NAV_ONLY), `${src} carries content/nav`).toBe(false);
      }
    });
  }

  test("the context sidebar is still rendered on the server", async ({ request }) => {
    const { html } = await scriptsOf(request, "/drill");
    expect(html).toContain('class="sidebar-ctx"');
  });
});
