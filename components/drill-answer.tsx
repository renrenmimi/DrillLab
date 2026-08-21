// 一道八股题的答案正文 —— 服务端组件，列表页 / 单题页 / 抽认卡三处共用。
//
// 同一道题在哪儿看都长一样，是因为三处渲染答案的只有这一个组件。
//
// 【为什么必须留在服务端】
// answer 是 ReactNode（正文带 JSX），只有服务端组件能 import content/drills。
// 客户端小岛拿到的永远是「已经渲染好的 children」，正文走 RSC payload，
// 不进 JS 包。
//
// 有 answerEn 的题直接复用课程页那个 AnswerTabs（纯 CSS 的中文 / English
// 两个 tab，零 JS）—— 不另写一套。

import type { DrillQuestion } from "@/content/types";
import { CodeBlock } from "./code";
import { AnswerTabs } from "./lesson-kit";

export function DrillAnswer({
  q,
  /** AnswerTabs 用 radio 的 name 做分组，同一页出现多次要错开 */
  scope = "d",
}: {
  q: DrillQuestion;
  scope?: string;
}) {
  return (
    <div className="prose">
      {q.answerEn ? (
        <AnswerTabs id={`${scope}-${q.id}`} zh={q.answer} en={q.answerEn} />
      ) : (
        q.answer
      )}
      {q.code?.map((ex, i) => (
        <CodeBlock key={i} ex={ex} />
      ))}
    </div>
  );
}
