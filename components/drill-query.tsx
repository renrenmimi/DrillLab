// 题库列表页的 URL 参数模型 —— 服务端和客户端都要用的一小段纯函数。
//
// 【为什么单独一个文件】
// `/drill` 的列表是服务端组件渲染的（正文带 JSX，只能在服务端 import
// content/drills），但搜索框和「筛出多少道」是客户端小岛。两边都要拼同一种
// 链接。这个文件**没有 "use client" 也不 import 任何内容**，所以两边都能
// import：服务端直接调用，客户端把这几十字节打进包里。
//
// 如果把它写在 "use client" 文件里，服务端 import 到的会是一个客户端引用
// 代理，调用时直接报错 —— 这是 RSC 的规则，不是风格问题。

/** 列表页认的四个参数 */
export interface DrillQuery {
  /** 方向：html / css / js / react / node / db / web，或 all */
  track?: string;
  /** 掌握状态：known / fuzzy / unknown / none（未做），或 all */
  mark?: string;
  /** 关键词或题库编号（`#279` 和 `279` 都认） */
  q?: string;
  page?: string;
}

/**
 * 一页放多少道 —— 和练习场一样是 12。
 *
 * 不是随手定的：答案正文虽然折叠着，但**必须已经在 HTML 里**（details 是纯
 * CSS，没有正文就展不开）。实测一道题的正文在页面里大约 15–20 KB，
 * 12 道 ≈ 250 KB HTML，和课程页一个量级；20 道就到 393 KB 了。
 */
export const DRILL_PAGE = 12;

/** 保留其他条件，只改一个维度 —— 筛选按钮就是普通链接 */
export function drillListHref(q: DrillQuery, patch: DrillQuery) {
  const next = { ...q, ...patch };
  const p = new URLSearchParams();
  if (next.track && next.track !== "all") p.set("track", next.track);
  if (next.mark && next.mark !== "all") p.set("mark", next.mark);
  if (next.q && next.q.trim()) p.set("q", next.q.trim());
  if (next.page && next.page !== "1") p.set("page", next.page);
  const s = p.toString();
  return s ? `/drill?${s}` : "/drill";
}

/** 关键词匹配：`#279` / `279` 按题库编号匹配，其余按中英文题面匹配 */
export function drillMatchesKeyword(
  kw: string,
  d: { bank: number[]; zh: string; en: string },
) {
  const needle = kw.trim().toLowerCase();
  if (!needle) return true;

  const asNumber = needle.replace(/^#/, "");
  if (/^\d+$/.test(asNumber)) {
    // 纯数字：既按编号精确匹配，也允许它出现在题面里（比如「ES6」不会走到这里）
    if (d.bank.some((n) => String(n) === asNumber)) return true;
  }
  return `${d.zh} ${d.en}`.toLowerCase().includes(needle);
}
