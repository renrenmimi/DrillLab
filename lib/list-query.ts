// 两张列表页的 URL 参数模型 —— 服务端和客户端都要用的纯函数。
//
// 【为什么单独一个文件】
// 和 components/drill-query.tsx 是同一个理由：/practice 和 /code 的列表是
// 服务端组件渲染的（要遍历练习和题目的正文，不能进客户端 chunk），
// 但 Practice 模式的**侧栏是客户端组件**，它也要拼同样的筛选链接。
//
// 这个文件没有 "use client"、也不 import 任何内容文件，所以两边都能 import。
// 抄第二份的后果是「侧栏点出来的链接和页面上的筛选按钮走向不同的 URL」。

export interface PracticeQuery {
  exam?: string;
  kind?: string;
  level?: string;
  page?: string;
}

/** 保留其他筛选条件，只改一个维度 —— 筛选项就是普通链接 */
export function practiceHref(q: PracticeQuery, patch: PracticeQuery) {
  const next = { ...q, ...patch };
  const p = new URLSearchParams();
  if (next.exam && next.exam !== "all") p.set("exam", next.exam);
  if (next.kind && next.kind !== "all") p.set("kind", next.kind);
  if (next.level && next.level !== "all") p.set("level", next.level);
  if (next.page && next.page !== "1") p.set("page", next.page);
  const s = p.toString();
  return s ? `/practice?${s}` : "/practice";
}

export interface CodingQuery {
  track?: string;
  diff?: string;
  run?: string;
}

export function codingHref(q: CodingQuery, patch: CodingQuery) {
  const next = { ...q, ...patch };
  const p = new URLSearchParams();
  if (next.track && next.track !== "all") p.set("track", next.track);
  if (next.diff && next.diff !== "all") p.set("diff", next.diff);
  if (next.run && next.run !== "all") p.set("run", next.run);
  const s = p.toString();
  return s ? `/code?${s}` : "/code";
}

/**
 * 从一条 recent 记录的 href 里把 query 解析回来。
 *
 * 侧栏不读 URL（在根 layout 的客户端组件里调 useSearchParams() 会让 252 个
 * 静态页面构建失败，见 components/recent.tsx 顶部的说明），它读的是列表页
 * 写进进度的那条 href。这个函数就是把那条 href 还原成筛选条件。
 *
 * 认不出（没有 ? 、或者是别的路径）就返回空对象 —— 侧栏于是不打高亮，
 * 不会瞎猜一个错的当前项。
 */
export function queryOfHref(href: string | undefined): Record<string, string> {
  if (!href) return {};
  const i = href.indexOf("?");
  if (i < 0) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(href.slice(i + 1))) out[k] = v;
  return out;
}
