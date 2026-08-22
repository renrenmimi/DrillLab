// 侧栏那一套**主导航**的结构 —— 全站唯一一份，位置在每一页上都一样。
//
// 【为什么这一版把导航搬进侧栏】
// 上一版是「顶栏四个模式 + 侧栏那个模式的结构」。它比更早那版好，但仍然是
// **两套导航同屏竞争**：顶栏有计划徽标 + 四个模式 + 一颗「继续」，侧栏又有
// 计划面板 + 「接着学」+ 课程树。同一屏上七八个都挺重要的东西，
// 于是「下一步做什么」被稀释掉了。
//
// 现在只有一套：**侧栏是导航，顶栏是工具。**
// 顶栏只剩「我在哪」（面包屑）和搜索 / 语言 / 主题 / 帮助。
//
// 【为什么这里一个内容模块都不 import】
// 侧栏现在**每一页都渲染**（老版本只在四个模式的页面上渲染）。
// 一旦这里 import content/nav（134 KB），每个路由的首屏都要带上它。
// 所以主导航是一串静态链接，不带任何计数 ——
// 计数要么在页面里，要么在那一页的上下文侧栏里（那些页面本来就要读 nav）。
// 顺带：少几个数字，导航反而更容易扫。

import { modeOf, type ModeId } from "./modes";

export interface SideItem {
  href: string;
  zh: string;
  en: string;
  /** 属于这一项的路由前缀。判断是「相等，或者以 前缀 + '/' 开头」 */
  owns: string[];
  /** 有的话，当前路由落在这个模式里时这一项就是选中的 */
  mode?: ModeId;
}

export interface SideGroup {
  /** 组标题。顶上那两项没有组标题 */
  zh?: string;
  en?: string;
  items: SideItem[];
}

export const SIDE_NAV: SideGroup[] = [
  {
    items: [
      { href: "/", zh: "今天", en: "Today", owns: ["/"] },
      { href: "/plans", zh: "我的计划", en: "My plan", owns: ["/plans"] },
    ],
  },
  {
    zh: "资料库",
    en: "Library",
    items: [
      { href: "/path", zh: "学课程", en: "Learn", owns: ["/path", "/exams"], mode: "learn" },
      { href: "/drill", zh: "背知识点", en: "Review", owns: ["/drill"], mode: "review" },
      {
        href: "/practice",
        zh: "做练习",
        en: "Practice",
        owns: ["/practice", "/code"],
        mode: "practice",
      },
    ],
  },
  {
    zh: "检验",
    en: "Assessment",
    items: [
      { href: "/arena", zh: "考场", en: "Arena", owns: ["/arena"] },
      { href: "/mock", zh: "模拟考", en: "Mock exams", owns: ["/mock"] },
    ],
  },
  {
    items: [{ href: "/reference", zh: "速查", en: "Reference", owns: ["/reference"] }],
  },
];

const ownsPath = (owns: string[], path: string) =>
  owns.some((p) => path === p || (p !== "/" && path.startsWith(p + "/")));

/**
 * 当前路径对应侧栏里的哪一项。返回 href，没有就是 undefined。
 *
 * 【为什么不能只看前缀】`/` 的 owns 是 `["/"]`，裸 startsWith 会让
 * 每一个路由都命中首页。所以 `/` 只认完全相等。
 */
export function activeSideHref(path: string): string | undefined {
  for (const g of SIDE_NAV) {
    for (const it of g.items) {
      if (ownsPath(it.owns, path)) return it.href;
    }
  }
  // 兜底：模式路由里有些页面（比如 /exams/react/xxx）已经被 owns 覆盖了，
  // 但将来新增模式路由时这一层能保证侧栏还是有一项亮着。
  const mode = modeOf(path);
  if (mode) {
    for (const g of SIDE_NAV) {
      for (const it of g.items) if (it.mode === mode) return it.href;
    }
  }
  return undefined;
}

/**
 * 顶栏那条「我在哪」。
 *
 * 只给**区段名**，不给页面标题 —— 页面标题就在下面一行的 h1 上，
 * 顶栏再写一遍是重复。区段名是页面自己不说的那一半。
 */
export function sectionOf(path: string): { zh: string; en: string } | undefined {
  const href = activeSideHref(path);
  if (!href) return undefined;
  for (const g of SIDE_NAV) {
    for (const it of g.items) {
      if (it.href === href) return { zh: it.zh, en: it.en };
    }
  }
  return undefined;
}
