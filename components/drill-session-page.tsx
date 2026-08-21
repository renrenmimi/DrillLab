// 抽认卡的服务端半边：只做一件事 —— 把 URL 上点到的那几道题的答案渲染好，
// 交给客户端组件。
//
// 为什么答案要在这里渲染：客户端组件不许 import content/drills（正文带 JSX，
// 一 import 就把 99 道题打进 JS 包）。这些 body 是 ReactNode，走 RSC payload
// 下来，客户端只负责显示哪一张、什么时候显示。
//
// 为什么按 ids 而不是一次全发：见 components/drill-session.tsx 顶部那段。
// 一句话 —— 一轮只看十几张，没必要把 99 道题的正文都塞进这一页的 HTML。

import { drillById } from "@/content/drills";
import type { DrillQuestion } from "@/content/types";
import { DrillAnswer } from "./drill-answer";
import { DrillSession, type DrillCardData } from "./drill-session";

export function DrillSessionPage({
  ids,
  scope,
  random,
}: {
  ids: string[];
  scope?: string;
  random?: boolean;
}) {
  // 去重 + 丢掉不认识的 id（链接被手改过、或者题目改名了都可能发生）
  const seen = new Set<string>();
  const picked: DrillQuestion[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    const q = drillById(id);
    if (!q) continue;
    seen.add(id);
    picked.push(q);
  }

  const cards: DrillCardData[] = picked.map((q) => ({
    id: q.id,
    body: <DrillAnswer q={q} scope="sess" />,
  }));

  // 把 URL 归一化成一个字符串，客户端用它认「这是同一轮」（sessionStorage 里
  // 存的位置只对同一轮有效）。顺序要和 drill-session.tsx 里 sessionHref 一致。
  const p = new URLSearchParams();
  if (scope) p.set("scope", scope);
  if (random) p.set("random", "1");
  if (picked.length > 0) p.set("ids", picked.map((q) => q.id).join(","));
  const qs = p.toString();

  return <DrillSession cards={cards} scope={scope} search={qs ? `?${qs}` : ""} />;
}
