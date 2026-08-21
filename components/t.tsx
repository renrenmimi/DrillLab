// 双语渲染的两个原语。**故意不加 "use client"** —— 课程正文是服务端组件，
// 它也要能用这两个。
//
// 做法：两种语言都渲染进 HTML，各包一层 data-lang，由 CSS 隐掉另一边
// （见 styles/base.css 末尾那几行，以及 lib/locale.tsx 顶部的说明）。
//
// 为什么分成两个：
//   <T>      行内用，包 <span>
//   <TBlock> 段落/列表/表格这类块级内容用，包 <div>
// 混用会出问题 —— <span> 里放 <p>，浏览器解析时会把 <p> 提出去，布局直接坏。
//
// 两个包装层都是 display: contents，所以不影响 flex / grid / 行内布局。

import type { ReactNode } from "react";

/** 行内双语：<T zh="继续" en="Continue" /> */
export function T({ zh, en }: { zh: ReactNode; en?: ReactNode }) {
  // 没给英文就两种语言都显示中文 —— 翻译可以增量补，缺的自动回落
  if (en === undefined || en === null) return <>{zh}</>;
  return (
    <>
      <span data-lang="zh">{zh}</span>
      <span data-lang="en">{en}</span>
    </>
  );
}

/** 块级双语：正文、列表、表格 */
export function TBlock({ zh, en }: { zh: ReactNode; en?: ReactNode }) {
  if (en === undefined || en === null) return <>{zh}</>;
  return (
    <>
      <div data-lang="zh">{zh}</div>
      <div data-lang="en">{en}</div>
    </>
  );
}

/* ============================================================
   内容数据里的双语字段
   ============================================================ */

/**
 * 内容模型里的字符串字段。
 * 直接写 string = 只有中文（英文回落到中文）；
 * 写 L("中文", "English") = 双语。
 *
 * 这样设计是为了**向后兼容**：已经写好的课文一行都不用改，
 * 英文可以一门课一门课地补上。
 */
export type LocalizedString = string | { zh: string; en: string };

/** 造一个双语字符串 */
export const L = (zh: string, en: string): LocalizedString => ({ zh, en });

/** 取某种语言的纯文本 —— 给 <title>、aria-label、metadata 这类只能要字符串的地方用 */
export function pick(v: LocalizedString, locale: "zh" | "en" = "zh"): string {
  return typeof v === "string" ? v : v[locale];
}

/** 渲染一个双语字符串字段 */
export function Loc({ v }: { v: LocalizedString }) {
  if (typeof v === "string") return <>{v}</>;
  return <T zh={v.zh} en={v.en} />;
}

/** 双语字符串数组里所有语言的文本拼起来 —— 搜索索引用 */
export function allText(v: LocalizedString): string {
  return typeof v === "string" ? v : `${v.zh} ${v.en}`;
}
