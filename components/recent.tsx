"use client";

// 一个不渲染任何东西的小岛：把「我现在在这个模式里的哪个位置」记下来。
//
// 【为什么要它，为什么不直接在侧栏里读 URL】
// 侧栏要给筛选项打高亮（Review 里当前是哪个方向、Practice 里当前筛了什么），
// 而这些条件都在 query string 里。侧栏在根 layout 里，是客户端组件 ——
// 在那儿调 useSearchParams()，252 个静态预渲染页面全部会因为
// 「useSearchParams() should be wrapped in a suspense boundary」构建失败。
// 用 Suspense 包起来能过，但那会让整块侧栏在 hydration 时被卸载重挂，
// <details> 的展开状态和焦点都会丢。
//
// 反过来做就干净了：**列表页本来就知道自己筛了什么**（它是服务端组件，
// query 是它的入参）。所以由它把完整 href 交给这个小岛写进 progress，
// 侧栏只读 progress —— 不碰 URL，没有 Suspense，也不会重挂。
//
// 顺带这一条记录就是顶栏「继续」的数据来源，一份数据两个用处。

import { useEffect } from "react";
import type { ModeId } from "@/lib/modes";
import { useProgress } from "@/lib/progress";

export function NoteRecent({
  mode,
  href,
  title,
  titleEn,
  sub,
  subEn,
}: {
  mode: ModeId;
  /** 完整路径，带 query。侧栏靠它解析当前筛选，顶栏直接拿它当链接 */
  href: string;
  title: string;
  titleEn?: string;
  sub?: string;
  subEn?: string;
}) {
  const { noteRecent, ready } = useProgress();

  // 【必须等 ready】和 LessonVisit 同一个坑：effect 是子先父后，
  // 这里比 ProgressProvider 的「从 localStorage 读回来」先跑。
  // 不等就写，写进去的是空进度，用户之前学过的全没了。
  // noteRecent 内部也挡了一道，两处都留着。
  useEffect(() => {
    if (!ready) return;
    noteRecent(mode, { href, title, titleEn, sub, subEn });
    // noteRecent 幂等（同 href 返回 prev 本身，React 跳过重渲染），
    // 所以不放进依赖数组也不会漏写 —— 依赖只跟着 ready 和落点变。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, mode, href, title, titleEn, sub, subEn]);

  return null;
}
