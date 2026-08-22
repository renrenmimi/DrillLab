"use client";

// 首页 —— 第一屏只让人做**一个**决定。
//
// 【UI v2 换掉了什么】
// 上一版第一屏对新访客是六张计划卡：每张有名字、结果、适合谁、六七个档位徽章、
// 「20 档 · 350 条 · 约 42 小时」和一颗 Start。六张一起看是六个同等重要的选择，
// 而一个刚到的人这时候连「Federation 是什么」都不知道 —— 密度本身就是劝退。
//
// 现在分成两种人，各自一屏，互斥：
//
//   新访客   → PlanPicker：三个决定（什么都想学 / 准备一场考试 / 准备面试）
//              「准备一场考试」选中之后才展开那四场（渐进披露）
//   回访者   → PlanDash：一张学习仪表盘。计划名、当前档、进度、剩余估时、
//              一张「下一件事」的大卡、整页唯一的实心按钮
//
// 四个模式和「按技术点直接进去」**一个都没删**，但从第一屏挪到了最下面
// 「浏览全部材料」那一节，标题层级明显更低 —— 它们本来就一直在侧栏里，
// 首页再摊一份等重的卡片只会和「继续」抢注意力。
//
// 刻意不做的事：不做渐变卡、不做进度环、不在第一屏解释产品架构。
// 「这个站是怎么组织的」那一整套说明在 /guide。
// 唯一一处环境光晕在 PlanPicker 里（新访客的第一屏），别处一律没有。

import dynamic from "next/dynamic";
import Link from "next/link";
import { ContinueCard } from "./continue";
import { PlanDash } from "./plan-dash";
import { PlanPicker } from "./plan-picker";
import { useActivePlan } from "./plan-kit";
import { PlanMark } from "./plan-mark";
import { T } from "./t";

/* 第一屏以下的全部内容。它要读 content/nav（92 KB 原始字节）才能写出
   「5 门课 · 80 节」这类计数，而第一屏一个字节都用不上 ——
   所以走 next/dynamic，进一个异步 chunk。实测首页首屏 181 → 153 kB。 */
const HomeLibrary = dynamic(() => import("./home-library").then((m) => m.HomeLibrary), {
  ssr: false,
});

export function Home() {
  const { status: plan, optedOut } = useActivePlan();

  return (
    <main className="main" data-rail="off">
      <div className="content ui-page dash">
        {/* ================================================================
            第一屏。三种情况互斥，任何时候只有一个 h1、只有一个主按钮。

            ① 正在跟某条计划   → 那条计划的仪表盘（PlanDash）
            ② 没跟计划         → 三个决定（PlanPicker）
            ③ 说过「先不跟计划」 → 回到「接着上次那件事」，并留一条回计划的路
            ================================================================ */}
        {plan ? (
          <PlanDash />
        ) : optedOut ? (
          <>
            <ContinueCard />
            <p className="dash-optout">
              <PlanMark size={12} />
              <T
                zh={
                  <>
                    想要一条从现在到考试的完整路径？
                    <Link href="/plans">看看六条引导计划 →</Link>
                  </>
                }
                en={
                  <>
                    Want one complete route from here to the assessment?{" "}
                    <Link href="/plans">Look at the six guided plans →</Link>
                  </>
                }
              />
            </p>
          </>
        ) : (
          <PlanPicker />
        )}

        {/* 第一屏以下的全部内容。懒加载 —— 它要读 content/nav（92 KB），
            而第一屏一个字节都用不上。见 components/home-library.tsx 顶部。 */}
        <HomeLibrary />
      </div>
    </main>
  );
}
