"use client";

// 引导计划里**全站挂载**的那几个零件：顶栏徽标、顶栏「继续」、侧栏面板、
// 页内位置条、列表页提示条、课尾那一步。
//
// 【这个文件只许读 lib/plan-lite，不许碰 content/plans】
// 这几个零件挂在根 layout 上，每一个路由都会经过它们。而 content/plans.ts
// 要 import content/nav（134 KB）+ content/nav-exercises（39 KB）才能把
// 「这门课的全部课文」这种查询展开成真实条目 —— 那条依赖一旦出现在这里，
// webpack 就把 nav 从「所有页面共用的那个 chunk」拆出去，于是每个路由都要
// 单独再下一遍。实测课程页 First Load JS 142 → 195 kB（+37%）。
//
// content/plan-manifest.ts 是构建期压好的轻量清单，只有算「我在哪、下一格
// 是什么」要的字段，**不 import 任何内容模块**。改回去之前先读它顶部那段。
//
// 需要估时、每一档的「为什么在这儿」、覆盖方向的地方只有 /plans/[planId]，
// 那一页是单独一个路由，自己去读 content/plans。

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { useT } from "@/lib/locale";
import type { ModeId } from "@/lib/modes";
import { litePlanById, type LiteItem, type LiteStatus } from "@/lib/plan-lite";
import { itemKey, pct, planStatus, type ItemState } from "@/lib/plan-progress";
import { usePublishPlanNext } from "@/lib/plan-signal";
import type { PlanPhase } from "@/lib/plan-types";
import { useProgress } from "@/lib/progress";
import { PlanMark } from "./plan-mark";
import { T } from "./t";

/* ============================================================
   档位标签
   ------------------------------------------------------------
   七档的名字全站只有这一份。每一档还挂一个模式 —— 徽标的颜色跟模式走，
   这样「这一步属于哪个模式」不用读字也看得出。
   ============================================================ */

export const PHASE: Record<
  PlanPhase,
  { zh: string; en: string; mode: ModeId }
> = {
  prereq: { zh: "前置", en: "Prereq", mode: "learn" },
  learn: { zh: "学", en: "Learn", mode: "learn" },
  review: { zh: "背", en: "Review", mode: "review" },
  practice: { zh: "练", en: "Practice", mode: "practice" },
  code: { zh: "写", en: "Code", mode: "practice" },
  rebuild: { zh: "空手做", en: "Rebuild", mode: "assess" },
  assess: { zh: "模拟考", en: "Assess", mode: "assess" },
};

/** 一格的状态在 UI 上怎么说。**不靠颜色单独表意** —— 每一档都有自己的字和形状 */
export const STATE_LABEL: Record<ItemState, { zh: string; en: string }> = {
  todo: { zh: "没做", en: "Not started" },
  done: { zh: "做完了", en: "Done" },
  reviewed: { zh: "过过一遍", en: "Reviewed" },
  confident: { zh: "会了", en: "Confident" },
  attempted: { zh: "试过，没通过", en: "Attempted" },
  live: { zh: "正在计时", en: "In progress" },
  passed: { zh: "通过了", en: "Passed" },
};

/* ============================================================
   hook
   ============================================================ */

/** 某一条计划的完成情况。ready 之前一律按「什么都没做」算，服务端和首帧一致 */
export function usePlanStatus(planId?: string): {
  status: LiteStatus | undefined;
  ready: boolean;
} {
  const { data, ready } = useProgress();
  const plan = litePlanById(planId);
  const status = useMemo(() => (plan ? planStatus(plan, data) : undefined), [plan, data]);
  return { status, ready };
}

/** 当前跟着走的那条计划。没选过就是 undefined */
export function useActivePlan(): {
  status: LiteStatus | undefined;
  ready: boolean;
  optedOut: boolean;
} {
  const { data, ready } = useProgress();
  // ready 之前不认 data.plan —— 那时 data 是 EMPTY，认了会在 hydration 后跳一次
  const plan = litePlanById(ready ? data.plan?.id : undefined);
  const status = useMemo(() => (plan ? planStatus(plan, data) : undefined), [plan, data]);
  return { status, ready, optedOut: ready ? !!data.planOptOut : false };
}

/* ============================================================
   小零件
   ============================================================ */

export function PhaseBadge({ phase }: { phase: PlanPhase }) {
  const p = PHASE[phase];
  return (
    <span className="ph-badge" data-mode={p.mode}>
      <T zh={p.zh} en={p.en} />
    </span>
  );
}

/**
 * 一格的状态点。
 *
 * **形状和文字都带信息**，不只靠颜色：没做是空心圈，做完是对勾，
 * 通过是实心对勾，正在计时是一个小方块。屏幕阅读器读 aria-label。
 */
export function StateDot({ state }: { state: ItemState }) {
  const t = useT();
  const label = t(STATE_LABEL[state].zh, STATE_LABEL[state].en);
  const glyph =
    state === "todo"
      ? ""
      : state === "live"
        ? "■"
        : state === "attempted"
          ? "·"
          : state === "reviewed"
            ? "✓"
            : "✓";
  return (
    <span className="st-dot" data-state={state} role="img" aria-label={label}>
      {glyph}
    </span>
  );
}

/** 细进度条 + 诚实数字。计划页头、侧栏面板、首页卡片共用一份 */
export function PlanMeter({
  done,
  total,
  label,
}: {
  done: number;
  total: number;
  label?: ReactNode;
}) {
  return (
    <div className="pl-meter">
      <span className="pl-meter-num tabular">
        {done} / {total}
      </span>
      <span
        className="pl-meter-rail"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct(done, total)}
      >
        <i style={{ width: `${pct(done, total)}%` }} />
      </span>
      {label && <span className="pl-meter-label">{label}</span>}
    </div>
  );
}

/* ============================================================
   顶栏那枚徽标
   ------------------------------------------------------------
   放在四个模式的**左边**，中间一条竖线隔开 —— 它和那四项不是同一类东西：
   四项是「我想做哪一类事」，这一枚是「我在跟着哪条路走」。
   没选计划时它退成一个「计划」入口。
   ============================================================ */

export function PlanChip({ onNavigate }: { onNavigate?: () => void }) {
  const { status, ready } = useActivePlan();
  const t = useT();

  if (!ready || !status) {
    return (
      <Link
        className="topbar-plan"
        href="/plans"
        data-empty
        onClick={onNavigate}
        title={t("按目标走的引导计划", "Goal-based guided plans")}
      >
        <PlanMark />
        <span className="topbar-plan-name">
          <T zh="计划" en="Plans" />
        </span>
      </Link>
    );
  }

  return (
    <Link
      className="topbar-plan"
      href={`/plans/${status.plan.id}`}
      onClick={onNavigate}
      title={t(
        `${status.plan.zh} · ${status.done} / ${status.total}`,
        `${status.plan.en} · ${status.done} / ${status.total}`,
      )}
    >
      <PlanMark />
      <span className="topbar-plan-name">
        <T zh={status.plan.zh} en={status.plan.en} />
      </span>
      <span className="topbar-plan-n tabular">
        {status.done}/{status.total}
      </span>
    </Link>
  );
}

/**
 * 顶栏那颗按钮的**计划版本** —— 指向计划的下一格。
 *
 * 只有在跟着计划走的时候才会被下载（components/continue.tsx 里做的判断）。
 * 计划走完了就退回「看整条计划」，不留一个死按钮。
 */
export function PlanContinueButton() {
  const { status, ready } = useActivePlan();
  const t = useT();

  if (!ready || !status) return null;

  const next = status.next;
  const href = next ? next.item.href : `/plans/${status.plan.id}`;
  const name = next
    ? t(next.item.zh, next.item.en ?? next.item.zh)
    : t("看整条计划", "Review the plan");
  const label = next ? t("继续", "Continue") : t("走完了", "Done");
  const where = t(
    `${status.plan.zh} · ${status.done} / ${status.total}`,
    `${status.plan.en} · ${status.done} / ${status.total}`,
  );

  return (
    <Link
      className="cont-btn"
      data-plan="true"
      href={href}
      title={`${label} — ${name}（${where}）`}
    >
      <span className="cont-btn-label">
        {next ? <T zh="继续" en="Continue" /> : <T zh="走完了" en="Done" />}
      </span>
      <span className="cont-btn-item">{name}</span>
    </Link>
  );
}

/* ============================================================
   侧栏顶部那块面板
   ------------------------------------------------------------
   **不是把整条计划搬进侧栏** —— 只给四样：叫什么、走到哪、这一档是什么、
   下一格是什么。侧栏剩下的部分照旧显示当前模式自己的结构。
   ============================================================ */

export function PlanPanel({ onNavigate }: { onNavigate: () => void }) {
  const { status, ready } = useActivePlan();
  const next = status?.next;

  // 把「下一步」登记给侧栏 —— Learn 那一档侧栏据此决定还要不要画自己那颗
  // 「接着学」。两处指同一节课时只留这一处，见 lib/plan-signal.tsx。
  // hook 不能写在 return 后面，所以这一行在早退之前。
  usePublishPlanNext(ready && status ? next?.item.href : undefined);

  if (!ready || !status) return null;

  const stage = status.plan.stages[status.currentStageIndex];

  return (
    <section className="pl-panel" aria-label="Guided plan">
      <div className="pl-panel-top">
        <span className="pl-panel-eyebrow">
          <PlanMark size={12} />
          <T zh="计划" en="Plan" />
        </span>
        <Link
          className="pl-panel-link"
          href={`/plans/${status.plan.id}`}
          onClick={onNavigate}
        >
          <T zh="看全程 →" en="Full plan →" />
        </Link>
      </div>

      <Link
        className="pl-panel-name"
        href={`/plans/${status.plan.id}`}
        onClick={onNavigate}
      >
        <T zh={status.plan.zh} en={status.plan.en} />
      </Link>

      <PlanMeter done={status.done} total={status.total} />

      {status.complete ? (
        <p className="pl-panel-done">
          <T zh="这条计划走完了。" en="This plan is complete." />
        </p>
      ) : (
        stage && (
          <>
            <p className="pl-panel-stage">
              <span className="pl-panel-stage-n tabular">
                {status.currentStageIndex + 1} / {status.plan.stages.length}
              </span>
              <T zh={stage.zh} en={stage.en} />
            </p>
            {next && (
              <Link
                className="pl-panel-next"
                href={next.item.href}
                onClick={onNavigate}
              >
                <span className="pl-panel-next-label">
                  <T zh="下一步" en="Next" />
                </span>
                <span className="pl-panel-next-title">
                  <T zh={next.item.zh} en={next.item.en} />
                </span>
              </Link>
            )}
          </>
        )
      )}
    </section>
  );
}

/* ============================================================
   页内的「你在计划的第几步」
   ------------------------------------------------------------
   课文页、八股页、练习页、Coding 页、考场页共用这一条。
   不在当前计划里就什么都不渲染 —— 自由浏览的人不该被计划的横幅打扰。
   ============================================================ */

export function PlanItemBanner({
  itemKey,
  compact,
}: {
  /** PlanItem.key，由调用方用 lib/plan-progress 的 itemKey() 拼 */
  itemKey: string;
  /** 考场 run 页那种「已经在计时」的地方用：只留一行，不给下一步按钮 */
  compact?: boolean;
}) {
  const { status, ready } = useActivePlan();
  if (!ready || !status) return null;

  let stageIndex = -1;
  let itemIndex = -1;
  for (let i = 0; i < status.plan.stages.length; i++) {
    const idx = status.plan.stages[i].items.findIndex((it) => it.key === itemKey);
    if (idx >= 0) {
      stageIndex = i;
      itemIndex = idx;
      break;
    }
  }
  if (stageIndex < 0) return null;

  const stage = status.plan.stages[stageIndex];
  const stageStat = status.stages[stageIndex];
  const st = status.itemStatus.get(itemKey);
  const next = status.next;
  // 「下一步」指向别的格才值得给按钮 —— 指向你正在看的这一格就是噪音
  const showNext = !compact && next && next.item.key !== itemKey;

  return (
    <aside className="pl-here" aria-label="Your position in the guided plan">
      <span className="pl-here-lead">
        <PlanMark size={12} />
        <Link href={`/plans/${status.plan.id}`}>
          <T zh={status.plan.zh} en={status.plan.en} />
        </Link>
      </span>

      <span className="pl-here-pos">
        <span className="tabular">
          <T
            zh={`第 ${stageIndex + 1} / ${status.plan.stages.length} 档`}
            en={`Stage ${stageIndex + 1} of ${status.plan.stages.length}`}
          />
        </span>
        <span className="pl-here-sep" aria-hidden>
          ·
        </span>
        <PhaseBadge phase={stage.phase} />
        <span className="pl-here-stage">
          <T zh={stage.zh} en={stage.en} />
        </span>
        <span className="pl-here-sep" aria-hidden>
          ·
        </span>
        <span className="tabular">
          <T
            zh={`这一格是 ${itemIndex + 1} / ${stageStat.total}`}
            en={`item ${itemIndex + 1} of ${stageStat.total}`}
          />
        </span>
        {st && st.state !== "todo" && (
          <>
            <span className="pl-here-sep" aria-hidden>
              ·
            </span>
            <span className="pl-here-state" data-state={st.state}>
              <T zh={STATE_LABEL[st.state].zh} en={STATE_LABEL[st.state].en} />
            </span>
          </>
        )}
      </span>

      {showNext && next && (
        <Link className="pl-here-next" href={next.item.href}>
          <T zh="计划的下一步" en="Next in plan" />
          <span className="pl-here-next-title">
            <T zh={next.item.zh} en={next.item.en} />
          </span>
        </Link>
      )}
    </aside>
  );
}

/**
 * 一格做完之后的「接下来」。
 *
 * 和上面那条位置条分工不同：位置条在页首回答「我在哪」，
 * 这一块在页尾回答「做完了，然后呢」。
 */
export function PlanNextStep({ itemKey }: { itemKey: string }) {
  const { status, ready } = useActivePlan();
  if (!ready || !status) return null;

  const inPlan = status.plan.items.some((it) => it.key === itemKey);
  if (!inPlan) return null;

  if (status.complete) {
    return (
      <div className="pl-nextstep" data-done>
        <span className="pl-nextstep-label">
          <T zh="计划走完了" en="Plan complete" />
        </span>
        <Link className="pl-nextstep-cta" href={`/plans/${status.plan.id}`}>
          <T zh="看整条计划" en="Review the whole plan" />
        </Link>
      </div>
    );
  }

  const next = status.next;
  if (!next) return null;
  const stage = status.plan.stages[next.stageIndex];

  return (
    <div className="pl-nextstep">
      <span className="pl-nextstep-label">
        <PlanMark size={12} />
        <T zh="计划的下一步" en="Next in your plan" />
        <span className="pl-nextstep-stage">
          <PhaseBadge phase={stage.phase} />
          <T zh={stage.zh} en={stage.en} />
        </span>
      </span>
      <Link className="pl-nextstep-cta" href={next.item.href}>
        <T zh={next.item.zh} en={next.item.en} />
      </Link>
    </div>
  );
}

/**
 * 课尾「接下来」面板里那一步的计划版本。
 *
 * 【为什么它住在 plan-kit 而不是自己一个文件】
 * 它被 components/lesson-plan.tsx 懒加载。而 plan-slots.tsx 也懒加载这个文件。
 * 第一版把它放在单独的 lesson-plan-live.tsx 里，于是 plan-kit 被**两条**
 * 不同的异步链引用，webpack 因此把 plan-kit（连带 content/nav 那 113 kB）
 * 提成了课程页的初始 chunk —— 实测课程页 470 → 628 kB 原始字节。
 * 收进同一个模块之后，全站所有懒加载点指向同一个异步 chunk，它就老实待在异步里。
 */
export function LessonPlanStepLive({
  examId,
  lessonId,
  next,
  arenaHref,
}: {
  examId: string;
  lessonId: string;
  /** 课程里的下一节。纯字符串 —— 服务端传进来的东西不带 JSX */
  next?: { href: string; zh: string; en?: string };
  /** 没有下一节时往哪儿去 */
  arenaHref?: string;
}) {
  const { status, ready } = useActivePlan();
  const key = itemKey("lesson", lessonId, examId);
  const inPlan = ready && status ? status.plan.items.some((it) => it.key === key) : false;

  if (!inPlan || !status) return null;

  /* ---------- 计划走完了 ---------- */
  if (status.complete) {
    return (
      <li className="lnext-step" data-primary data-plan-live>
        <div className="lnext-step-body">
          <span className="lnext-step-title">
            <T zh="你的计划走完了" en="Your plan is complete" />
          </span>
          <span className="lnext-step-sub">
            <T zh={status.plan.zh} en={status.plan.en} />
          </span>
        </div>
        <Link className="lnext-cta" href={`/plans/${status.plan.id}`}>
          <T zh="回看整条计划" en="Review the plan" />
        </Link>
      </li>
    );
  }

  const pn = status.next;
  if (!pn) return null;
  const stage = status.plan.stages[pn.stageIndex];
  // 计划的下一格正好就是课程里的下一节 —— 那就不用说两遍
  const same = next && pn.item.href === next.href;

  return (
    <li className="lnext-step" data-primary data-plan-live>
      <div className="lnext-step-body">
        <span className="lnext-step-title">
          <T zh="接着走计划" en="Continue your plan" />
          <span className="lnext-step-plan">
            <PhaseBadge phase={stage.phase} />
            <T zh={stage.zh} en={stage.en} />
          </span>
        </span>
        <span className="lnext-step-sub">
          <T zh={pn.item.zh} en={pn.item.en} />
        </span>
        {!same && next && (
          <span className="lnext-step-sub lnext-step-aside">
            <T zh="课程里的下一节是 " en="The next lesson in the course is " />
            <Link href={next.href}>
              <T zh={next.zh} en={next.en} />
            </Link>
          </span>
        )}
      </div>
      <Link className="lnext-cta" href={pn.item.href}>
        <T zh="下一格" en="Next item" />
      </Link>
    </li>
  );
}

/**
 * 列表页上的一条计划提示。
 *
 * 只在「计划的下一格正好属于这一页所在的模式」时出现 —— 比如你在跟 React
 * 考试那条计划走、下一格是一道八股，那么 /drill 顶上就出现这一条。
 * 下一格是一节课的时候 /drill 上不出现，因为那时候这一页不是你该待的地方。
 */
export function PlanStrip({ mode }: { mode: ModeId }) {
  const { status, ready } = useActivePlan();
  if (!ready || !status || !status.next) return null;
  if (status.next.item.mode !== mode) return null;

  const stage = status.plan.stages[status.next.stageIndex];

  return (
    <aside className="pl-strip" aria-label="Guided plan">
      <span className="pl-strip-lead">
        <PlanMark size={12} />
        <Link href={`/plans/${status.plan.id}`}>
          <T zh={status.plan.zh} en={status.plan.en} />
        </Link>
        <span className="pl-strip-sep" aria-hidden>
          ·
        </span>
        <span className="tabular">
          <T
            zh={`第 ${status.next.stageIndex + 1} / ${status.plan.stages.length} 档`}
            en={`stage ${status.next.stageIndex + 1} of ${status.plan.stages.length}`}
          />
        </span>
        <PhaseBadge phase={stage.phase} />
        <span className="pl-strip-stage">
          <T zh={stage.zh} en={stage.en} />
        </span>
        <span className="pl-strip-count tabular">
          {status.stages[status.next.stageIndex].done} /{" "}
          {status.stages[status.next.stageIndex].total}
        </span>
      </span>
      <Link className="pl-strip-next" href={status.next.item.href}>
        <T zh="下一格" en="Next" />
        <span className="pl-strip-next-title">
          <T zh={status.next.item.zh} en={status.next.item.en} />
        </span>
      </Link>
    </aside>
  );
}

