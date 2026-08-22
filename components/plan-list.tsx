"use client";

// /plans —— 六条计划，加上「你正在跟哪条走」。
//
// 这一页要回答的问题只有一个：**我现在想达成什么目标？**
// 所以它不解释产品架构，也不重复四个模式那一套 —— 那些在首页下半和 /guide 里。

import Link from "next/link";
import { litePlans } from "@/lib/plan-lite";
import { useProgress } from "@/lib/progress";
import { ActivePlanCard, PlanCard } from "./plan-cards";
import { PlanMark } from "./plan-mark";
import { T } from "./t";

export function PlanList() {
  const { activePlan, ready } = useProgress();
  const active = ready ? activePlan() : undefined;
  const plans = litePlans();
  const others = plans.filter((p) => p.id !== active?.id);

  return (
    <main className="main" data-rail="off">
      <div className="content ui-page pl-list">
        <div className="ui-head">
          <div className="ui-eyebrow">
            <PlanMark />
            <T zh="引导计划" en="Guided plans" />
          </div>
          <h1 className="ui-h1">
            <T zh="你想为什么做好准备？" en="What do you want to be ready for?" />
          </h1>
          <p className="ui-lede">
            <T
              zh="每一条都是一串有序的、跨模式的步骤：读哪几节、背哪些方向、做哪些练习、写哪几道题、最后在空文件夹里做一遍。用的全是站里已有的内容，不另出题。"
              en="Each one is an ordered sequence that crosses the four modes: which lessons to read, which topics to revise, which exercises and problems to do, and finally the same thing in an empty folder. All of it is material that already exists here."
            />
          </p>
        </div>

        {active && (
          <div className="pl-list-active">
            <ActivePlanCard />
          </div>
        )}

        <div className="minihead">
          {active ? (
            <T zh="换一条" en="Switch to another" />
          ) : (
            <T zh={`${plans.length} 条计划`} en={`${plans.length} plans`} />
          )}
        </div>

        <ul className="plc-grid">
          {(active ? others : plans).map((p) => (
            <PlanCard key={p.id} plan={p} />
          ))}
        </ul>

        <div className="ui-sec pl-list-foot" data-quiet>
          <h2 className="ui-sec-title">
            <T zh="不想被引导？" en="Would rather not be guided?" />
          </h2>
          <p>
            <T
              zh={
                <>
                  四个模式一直都在：
                  <Link href="/path">学课程</Link>、
                  <Link href="/drill">背知识点</Link>、
                  <Link href="/practice">做练习</Link>、
                  <Link href="/arena">模拟考试</Link>。
                  引导计划回答「下一步做什么」，四个模式回答「让我自己挑」——
                  两个入口互不影响，进度是同一份。
                </>
              }
              en={
                <>
                  The four modes are always there: <Link href="/path">Learn</Link>,{" "}
                  <Link href="/drill">Review</Link>, <Link href="/practice">Practice</Link>{" "}
                  and <Link href="/arena">Assess</Link>. A guided plan answers what to do
                  next; the four modes let you browse and choose. Neither affects the
                  other, and the progress behind them is the same.
                </>
              }
            />
          </p>
        </div>
      </div>
    </main>
  );
}
