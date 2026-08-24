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
    items: [
      { href: "/guide", zh: "使用说明", en: "How to use", owns: ["/guide"] },
      { href: "/reference", zh: "速查", en: "Reference", owns: ["/reference"] },
    ],
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
 * 一级页面只给一个区段名（今天 / 我的计划 / 学课程……）；**深一层的页面给
 * 一条两段的面包屑**（学课程 / React 考试）。理由是顶栏是 sticky 的：
 * 正文里那条面包屑滚两屏就没了，而「我现在在哪门课里」是随时要知道的。
 *
 * 【它为什么不写页面标题】页面标题就在下面一行的 h1 上，顶栏再写一遍是重复。
 * 第二段说的是**这一页自己不说的那一半** —— 课文的 h1 是那一节的名字，
 * 不是课程名。
 *
 * 【为什么这里能有课程名，而不算 import 内容】下面那张表是五个静态字符串，
 * 不是内容模块（侧栏在每一页都渲染，拉 content/nav 会让每个路由多下 134 KB，
 * 见文件顶部）。表里没有的 id 直接退回一段面包屑 —— 加一门新考试仍然只要
 * CLAUDE.md 里那三步，漏了这里最多少一段路径，不会出错。
 */
const EXAM_CRUMB: Record<string, Crumb> = {
  foundations: { zh: "地基", en: "Foundations" },
  react: { zh: "React 考试", en: "React exam" },
  "graphql-federation": { zh: "Federation 考试", en: "Federation exam" },
  interview: { zh: "面试八股", en: "Interview questions" },
  "cab-booking": { zh: "Cab Booking", en: "Cab Booking" },
};

export interface Crumb {
  zh: string;
  en: string;
}

/** 深一层的页面在区段名后面再加的那一段。纯粹按路由形状判断，不读内容。 */
function subCrumb(path: string): Crumb | undefined {
  const seg = path.split("/").filter(Boolean);

  if (seg[0] === "exams" && seg[1]) return EXAM_CRUMB[seg[1]];
  if (seg[0] === "drill" && seg[1]) {
    return seg[1] === "session"
      ? { zh: "抽认卡", en: "Flashcards" }
      : { zh: "题库", en: "Question bank" };
  }
  if (seg[0] === "code" && seg[1]) return { zh: "Coding 题", en: "Coding problem" };
  if (seg[0] === "arena" && seg[1]) {
    if (seg[2] === "run") return { zh: "计时中", en: "Timed run" };
    if (seg[2] === "review") return { zh: "对答案", en: "Review" };
    return { zh: "一场考试", en: "One paper" };
  }
  if (seg[0] === "mock" && seg[1]) return { zh: "一套模拟考", en: "One mock exam" };
  if (seg[0] === "plans" && seg[1]) {
    return seg[1] === "choose"
      ? { zh: "换一条", en: "Change" }
      : { zh: "全程", en: "The whole route" };
  }
  return undefined;
}

/**
 * 顶栏那条「我在哪」。第一段永远是侧栏里亮着的那一项，
 * 深页面再补一段。返回 undefined 表示这一页不在导航结构里。
 */
export function locationOf(
  path: string,
): { section: Crumb; sectionHref: string; sub?: Crumb } | undefined {
  const href = activeSideHref(path);
  if (!href) return undefined;
  for (const g of SIDE_NAV) {
    for (const it of g.items) {
      if (it.href === href) {
        return { section: { zh: it.zh, en: it.en }, sectionHref: href, sub: subCrumb(path) };
      }
    }
  }
  return undefined;
}
