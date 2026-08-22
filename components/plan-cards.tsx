"use client";

// 计划卡片 —— 首页和 /plans 共用。
//
// 两种形态：
//   PlanCard        紧凑卡。六张并排也要在 390px 上读得完，所以不做大卡片。
//   ActivePlanCard  首页第一屏那张。它回答的是「我在跟哪条走、下一格是什么」，
//                   所以里面有整页唯一的主按钮。
//
// 【为什么两处共用一份】
// 首页和 /plans 都要「一条计划长什么样」。抄两份的结果是改一边忘一边 ——
// 上一轮 IA 审计里记的「同一个地方两个名字」就是这么来的。

import Link from "next/link";
import { PLANS, type Plan, type PlanPhase } from "@/content/plans";
import { useProgress } from "@/lib/progress";
import { PhaseBadge, PlanMeter, usePlanStatus, useActivePlan } from "./plan-kit";
import { PlanMark } from "./plan-mark";
import { T } from "./t";

/** 这条计划由哪几档组成（去重、保持顺序）—— 卡片上那排小徽章 */
function phasesOf(plan: Plan): PlanPhase[] {
  const seen = new Set<PlanPhase>();
  const out: PlanPhase[] = [];
  for (const s of plan.stages) {
    if (seen.has(s.phase)) continue;
    seen.add(s.phase);
    out.push(s.phase);
  }
  return out;
}

/* ============================================================
   紧凑卡
   ============================================================ */

export function PlanCard({ plan }: { plan: Plan }) {
  const { status, ready } = usePlanStatus(plan.id);
  const { activePlan, setActivePlan, ready: pReady } = useProgress();
  if (!status) return null;

  const isActive = pReady && activePlan()?.id === plan.id;
  const started = status.done > 0;
  const hours = Math.round(status.plan.minutes / 60);

  return (
    <li className="plc" data-active={isActive || undefined}>
      <Link className="plc-main" href={`/plans/${plan.id}`}>
        <span className="plc-top">
          <span className="plc-mark" aria-hidden>
            <PlanMark size={13} />
          </span>
          <span className="plc-name">
            <T zh={plan.zh} en={plan.en} />
          </span>
          {isActive && (
            <span className="plc-flag">
              <T zh="当前" en="Current" />
            </span>
          )}
        </span>

        <span className="plc-outcome">
          <T zh={plan.outcomeZh} en={plan.outcomeEn} />
        </span>

        <span className="plc-for">
          <T zh={plan.forZh} en={plan.forEn} />
        </span>

        <span className="plc-phases" aria-hidden>
          {phasesOf(plan).map((p) => (
            <PhaseBadge key={p} phase={p} />
          ))}
        </span>

        <span className="plc-scope tabular">
          <T
            zh={`${plan.stages.length} 档 · ${status.total} 个条目 · 约 ${hours} 小时`}
            en={`${plan.stages.length} stages · ${status.total} items · about ${hours} h`}
          />
        </span>
      </Link>

      <div className="plc-foot">
        {ready && started ? (
          <PlanMeter done={status.done} total={status.total} />
        ) : (
          <span className="plc-fresh">
            <T zh="还没开始" en="Not started" />
          </span>
        )}
        {status.next && (
          <Link
            className="plc-cta"
            href={status.next.item.href}
            onClick={() => {
              if (!isActive) setActivePlan(plan.id);
            }}
          >
            {isActive ? (
              <T zh="继续" en="Continue" />
            ) : started ? (
              <T zh="跟这条走" en="Follow" />
            ) : (
              <T zh="开始" en="Start" />
            )}
          </Link>
        )}
        {!status.next && (
          <span className="plc-cta" data-done>
            <T zh="做完了" en="Complete" />
          </span>
        )}
      </div>
    </li>
  );
}

/** 六张卡。首页和 /plans 共用 */
export function PlanCards() {
  return (
    <ul className="plc-grid">
      {PLANS.map((p) => (
        <PlanCard key={p.id} plan={p} />
      ))}
    </ul>
  );
}

/* ============================================================
   首页第一屏那张
   ============================================================ */

export function ActivePlanCard() {
  const { status, ready } = useActivePlan();
  if (!ready || !status) return null;

  const stage = status.plan.stages[status.currentStageIndex];
  const next = status.next;

  return (
    <section className="apc" aria-labelledby="apc-h">
      <div className="apc-eyebrow">
        <PlanMark />
        {status.complete ? (
          <T zh="这条计划走完了" en="Your plan is complete" />
        ) : (
          <T zh="接着走你的计划" en="Continue your plan" />
        )}
      </div>

      <h1 className="apc-title serif" id="apc-h">
        <T zh={status.plan.zh} en={status.plan.en} />
      </h1>

      <PlanMeter
        done={status.done}
        total={status.total}
        label={
          status.complete ? (
            <T zh="全部做完了" en="all done" />
          ) : (
            <T
              zh={`第 ${status.currentStageIndex + 1} / ${status.plan.stages.length} 档`}
              en={`stage ${status.currentStageIndex + 1} of ${status.plan.stages.length}`}
            />
          )
        }
      />

      {!status.complete && stage && (
        <p className="apc-stage">
          <PhaseBadge phase={stage.phase} />
          <span className="apc-stage-name">
            <T zh={stage.zh} en={stage.en} />
          </span>
        </p>
      )}

      {next ? (
        <>
          <p className="apc-next-label">
            <T zh="下一步就是这一格" en="Your next item" />
          </p>
          <p className="apc-next-title">
            <T zh={next.item.zh} en={next.item.en} />
            {next.item.minutes !== undefined && (
              <span className="apc-next-min tabular">
                <T zh={`约 ${next.item.minutes} 分钟`} en={`~${next.item.minutes} min`} />
              </span>
            )}
          </p>
          <div className="apc-actions">
            <Link className="apc-cta" href={next.item.href}>
              <T zh="继续计划" en="Continue plan" />
            </Link>
            <Link className="apc-alt" href={`/plans/${status.plan.id}`}>
              <T zh="看整条计划" en="View full plan" />
            </Link>
            <Link className="apc-alt" href="/plans">
              <T zh="换一条" en="Change plan" />
            </Link>
          </div>
        </>
      ) : (
        <div className="apc-actions">
          <Link className="apc-cta" href={`/plans/${status.plan.id}`}>
            <T zh="回看整条计划" en="Review the whole plan" />
          </Link>
          <Link className="apc-alt" href="/plans">
            <T zh="挑下一条计划" en="Pick the next plan" />
          </Link>
        </div>
      )}
    </section>
  );
}

