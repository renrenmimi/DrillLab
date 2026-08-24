"use client";

// /plans —— 两种状态，**任何时候只有一个 h1**。
//
// 【上一版为什么乱】它把三样东西同时摊在一屏上：三选一、六张卡的全表、
// 当前计划的仪表盘。于是一页里有两到三个 h1，而已经在跟计划的人还得先
// 滚过一整套「选计划」的界面，才看得到自己的计划。
//
// 现在：
//
//   没跟计划   h1「你想为什么做好准备？」→ 三选一
//              下面一条安静的「看全部六条」，全表的标题是 h2
//   跟着计划   h1「我的引导计划」→ 仪表盘 + 继续
//              一颗显眼但次级的「换一条引导计划」，去 /plans/choose
//              **默认不渲染三选一和全表** —— 那是「换」这件事的界面，
//              而「换」有它自己的地址
//
// 【术语】分类（track）= 首页那五个科目分类；引导计划（guided plan）=
// 横跨学 / 背 / 练 / 写 / 考的一条推荐顺序。两个词不混用。

import Link from "next/link";
import { litePlans } from "@/lib/plan-lite";
import { useProgress } from "@/lib/progress";
import { PlanCard } from "./plan-cards";
import { PlanDash } from "./plan-dash";
import { PlanMark } from "./plan-mark";
import { PlanPicker } from "./plan-picker";
import { T } from "./t";

export function PlanList() {
  const { activePlan, ready } = useProgress();
  const active = ready ? activePlan() : undefined;
  const plans = litePlans();

  /* ---------------- 跟着计划：这一页就是「我的计划」 ---------------- */
  if (active) {
    return (
      <main className="main" data-rail="off">
        <div className="content ui-page pl-list">
          <div className="ui-head">
            <div className="ui-eyebrow">
              <PlanMark />
              <T zh="引导计划" en="Guided plan" />
            </div>
            <h1 className="ui-h1">
              <T zh="我的引导计划" en="My guided plan" />
            </h1>
            <p className="ui-lede">
              <T
                zh="分类整理的是科目，引导计划把几个分类里的东西排成一条推荐顺序。"
                en="Tracks organise subjects. A guided plan puts work from several tracks into one recommended order."
              />
            </p>
          </div>

          <PlanDash />

          {/* 显眼但次级：它是描边按钮，不是这一页的实心主动作
              （那一个是仪表盘里的〔继续〕）。 */}
          <div className="pl-list-change">
            <Link className="btn" href="/plans/choose">
              <T zh="换一条引导计划" en="Change guided plan" />
            </Link>
            <span className="pl-list-change-note">
              <T
                zh="换一条不会删除任何进度。"
                en="Switching erases nothing you have done."
              />
            </span>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------- 没跟计划：这一页就是那个三选一 ---------------- */
  return (
    <main className="main" data-rail="off">
      <div className="content ui-page pl-list">
        {/* 这一段自己带 h1 —— 它就是这一页的主内容 */}
        <PlanPicker />

        <div className="ui-sec pl-list-foot" id="all-plans" data-quiet>
          <div className="ui-sec-head">
            <h2 className="ui-sec-title">
              <T zh={`全部六条的细节`} en={`All ${plans.length} in detail`} />
            </h2>
          </div>
          <p className="ui-sec-note pl-list-note">
            <T
              zh="上面那三个是入口，这里是六条的全貌：各自多少档、多少条、覆盖哪些分类。"
              en="The three choices above are the way in. Here is the full picture: how many stages and items each one has, and which tracks it covers."
            />
          </p>

          <ul className="plc-grid">
            {plans.map((p) => (
              <PlanCard key={p.id} plan={p} />
            ))}
          </ul>
        </div>

        <div className="ui-sec pl-list-foot" data-quiet>
          <h2 className="ui-sec-title">
            <T zh="不想被引导？" en="Would rather not be guided?" />
          </h2>
          <p>
            <T
              zh={
                <>
                  那就不用选。首页那五个分类和侧栏的
                  <Link href="/drill">背知识点</Link>、
                  <Link href="/practice">做练习</Link>、
                  <Link href="/arena">考场</Link>
                  一直都在，进度是同一份。引导计划只回答「下一步做什么」。
                </>
              }
              en={
                <>
                  Then do not choose one. The five tracks on Today and the{" "}
                  <Link href="/drill">Review</Link>, <Link href="/practice">Practice</Link>{" "}
                  and <Link href="/arena">Arena</Link> entries in the sidebar are always
                  there, and the progress behind them is the same. A guided plan only
                  answers what to do next.
                </>
              }
            />
          </p>
        </div>
      </div>
    </main>
  );
}
