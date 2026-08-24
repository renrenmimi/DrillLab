"use client";

// /plans/choose —— 换一条引导计划。
//
// 【为什么它是一个独立的页面，而不是把六张卡摊在 /plans 上】
// 上一版 `/plans` 同时渲染三个东西：三选一、六张卡的全表、当前计划的仪表盘。
// 一屏里有三个 h1，而且已经在跟计划的人还得先滚过一整套「选计划」的界面
// 才看得到自己的计划。侧栏那个「换一条」更糟 —— 它指向 `/plans`，
// 而你可能已经站在 `/plans` 上，**点了等于没反应**。
//
// 现在分工是：
//   /plans          没跟计划 → 三选一；跟着计划 → 我的计划（仪表盘 + 继续）
//   /plans/choose   只做一件事：换。当前这条是哪条、能换成哪些、以及取消。
//
// 侧栏那个「换一条」也指到这里，所以它永远是一次真实的跳转。

import Link from "next/link";
import { useRouter } from "next/navigation";
import { litePlans, phasesOf } from "@/lib/plan-lite";
import { pct } from "@/lib/plan-progress";
import { useProgress } from "@/lib/progress";
import { PhaseBadge, usePlanStatus } from "./plan-kit";
import { PlanMark } from "./plan-mark";
import { T } from "./t";

/** 一条可选的计划。当前这条会标出来，并且不给「换成它」的按钮 */
function Choice({
  id,
  current,
  onPick,
}: {
  id: string;
  current: boolean;
  onPick: (id: string) => void;
}) {
  const { status } = usePlanStatus(id);
  if (!status) return null;
  const plan = status.plan;
  const hours = Math.round(plan.minutes / 60);

  return (
    <li className="chz" data-current={current || undefined}>
      <div className="chz-main">
        <div className="chz-top">
          <h3 className="chz-name display">
            <T zh={plan.zh} en={plan.en} />
          </h3>
          {current && (
            <span className="chz-now">
              <T zh="正在跟这条" en="Following now" />
            </span>
          )}
        </div>

        <p className="chz-out">
          <T zh={plan.outcomeZh} en={plan.outcomeEn} />
        </p>

        <div className="chz-phases">
          {phasesOf(plan).map((ph) => (
            <PhaseBadge key={ph} phase={ph} />
          ))}
        </div>

        <div className="ui-meta chz-meta">
          <span>
            <T
              zh={`${plan.stages.length} 档 · ${status.total} 条`}
              en={`${plan.stages.length} stages · ${status.total} items`}
            />
          </span>
          <span>
            <T zh={`约 ${hours} 小时`} en={`about ${hours} h`} />
          </span>
          {status.done > 0 && (
            <span className="chz-done">
              <T
                zh={`已经做过 ${status.done} 条（${pct(status.done, status.total)}%）`}
                en={`${status.done} already done (${pct(status.done, status.total)}%)`}
              />
            </span>
          )}
        </div>
      </div>

      <div className="chz-act">
        {current ? (
          <Link className="btn btn-sm" href={`/plans/${plan.id}`}>
            <T zh="看这条的全程" en="View this plan" />
          </Link>
        ) : (
          <button type="button" className="btn btn-sm" onClick={() => onPick(plan.id)}>
            <T zh="换成这条" en="Switch to this" />
          </button>
        )}
      </div>
    </li>
  );
}

export function PlanChooser() {
  const { activePlan, setActivePlan, ready } = useProgress();
  const router = useRouter();
  const current = ready ? activePlan()?.id : undefined;
  const plans = litePlans();

  const pick = (id: string) => {
    setActivePlan(id);
    // 换完就回 /plans —— 那一页现在会显示新计划的仪表盘。
    // 用 replace 而不是 push：这一步不该在返回历史里留一格，
    // 否则按返回又回到选择页，看着像没换成。
    router.replace("/plans");
  };

  return (
    <main className="main" data-rail="off">
      <div className="content ui-page chz-page">
        <nav className="crumb" aria-label="Breadcrumb">
          <span>
            <Link href="/plans">
              <T zh="我的引导计划" en="My guided plan" />
            </Link>
          </span>
          <span className="crumb-sep" aria-hidden>
            /
          </span>
          <span>
            <T zh="换一条" en="Change" />
          </span>
        </nav>

        <div className="ui-head">
          <div className="ui-eyebrow">
            <PlanMark />
            <T zh="引导计划" en="Guided plan" />
          </div>
          <h1 className="ui-h1">
            {current ? (
              <T zh="换一条引导计划" en="Change your guided plan" />
            ) : (
              <T zh="挑一条引导计划" en="Choose a guided plan" />
            )}
          </h1>
          <p className="ui-lede">
            <T
              zh="分类整理的是科目，引导计划把几个分类里的东西排成一条推荐顺序。换一条**不会删除任何进度** —— 已经读过的课文、做对的练习、自评过的八股全都还在，新计划照样把它们算进去。"
              en="Tracks organise subjects. A guided plan puts work from several tracks into one recommended order. Switching erases nothing — every lesson you have read, exercise you have solved and question you have rated stays, and the new plan counts them too."
            />
          </p>
        </div>

        <ul className="chz-list">
          {plans.map((p) => (
            <Choice key={p.id} id={p.id} current={p.id === current} onPick={pick} />
          ))}
        </ul>

        {/* 取消永远在。返回键也能用 —— pick() 用的是 replace，
            所以「换过了再按返回」不会回到这一页。 */}
        <div className="chz-foot">
          <Link className="btn" href="/plans">
            <T zh="取消，回到我的计划" en="Cancel and go back" />
          </Link>
          {current && (
            <span className="chz-foot-note">
              <T
                zh="不做任何改动就离开，当前计划保持不变。"
                en="Leave without choosing and your current plan stays as it is."
              />
            </span>
          )}
        </div>
      </div>
    </main>
  );
}
