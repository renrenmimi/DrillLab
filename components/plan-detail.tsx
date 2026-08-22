"use client";

// 一条计划的完整路线图 —— 这一版的主角。
//
// 【为什么是客户端组件，而且这次没问题】
// 它需要的东西只有两样：计划定义（content/plans）和标题（content/nav），
// 两个都是纯数据模块。完成度由 lib/plan-progress 从已有进度推导。
// **一个字的课程正文都没有**，所以不存在「客户端 import 内容」那个坑
// （实测踩过一次，单 chunk 784 KB）。也不加载 Sandpack。
//
// 【路线图的设计】
// 竖着一条线，每一档一个编号站点。三种状态各有自己的**形状和文字**，
// 不靠颜色单独表意：
//   做完了   实心站点 + 对勾 + 「读完了」
//   你在这   带光环的强调色站点 + 「你在这」徽标 + 默认展开
//   还没到   空心站点 + 收起
// 收起来的档点一下就开 —— 从来不锁死，有基础的人要能跳。

import Link from "next/link";
import { useEffect, useState } from "react";
import { DRILL_TRACK_LABEL } from "@/content/nav";
import {
  tracksOfStage,
  type PlanItem,
  type ResolvedPlan,
  type ResolvedStage,
} from "@/content/plans";
import { useT } from "@/lib/locale";
import { modeById } from "@/lib/modes";
import type { ItemState, PlanStatus } from "@/lib/plan-progress";
import { useProgress } from "@/lib/progress";
import {
  PHASE,
  PhaseBadge,
  PlanMeter,
  STATE_LABEL,
  StateDot,
  usePlanStatus,
} from "./plan-kit";
import { PlanMark } from "./plan-mark";
import { T } from "./t";

/* ============================================================
   一格
   ============================================================ */

function ItemRow({
  item,
  index,
  state,
  isNext,
}: {
  item: PlanItem;
  index: number;
  state: ItemState;
  isNext: boolean;
}) {
  const mode = modeById(item.mode);
  return (
    <li className="rm-row" data-state={state} data-next={isNext || undefined}>
      <span className="rm-row-n tabular" aria-hidden>
        {String(index + 1).padStart(2, "0")}
      </span>
      <StateDot state={state} />
      <Link className="rm-row-link" href={item.href}>
        <span className="rm-row-title">
          <T zh={item.zh} en={item.en} />
        </span>
        <span className="rm-row-meta">
          <span className="rm-row-mode" data-mode={item.mode}>
            <T zh={mode.zh} en={mode.en} />
          </span>
          {item.minutes !== undefined && (
            <span className="rm-row-min tabular">
              <T zh={`约 ${item.minutes} 分钟`} en={`~${item.minutes} min`} />
            </span>
          )}
          <span className="rm-row-state">
            <T zh={STATE_LABEL[state].zh} en={STATE_LABEL[state].en} />
          </span>
        </span>
      </Link>
      {isNext && (
        <span className="rm-row-cta" aria-hidden>
          <T zh="下一步" en="Next" />
        </span>
      )}
    </li>
  );
}

/**
 * 密集档的格子。
 *
 * 练习和八股一档有几十条，一行一个会把页面拉成好几屏。
 * 格子里只有编号和状态，**真实标题挂在 aria-label 和 title 上** ——
 * 所以键盘和屏幕阅读器读到的是标题，不是「01」。
 * 而且这一档上面永远单独给一行「下一格」，所以任何时候都有一个带标题的目标。
 */
function ItemChip({
  item,
  index,
  state,
  isNext,
}: {
  item: PlanItem;
  index: number;
  state: ItemState;
  isNext: boolean;
}) {
  const t = useT();
  const title = t(item.zh, item.en ?? item.zh);
  const stateText = t(STATE_LABEL[state].zh, STATE_LABEL[state].en);
  // 【状态不能只靠颜色】做完的格子显示对勾、没做的显示编号，
  // 边框也跟着换（虚线 → 实线）。颜色只是第三个通道。
  const done =
    state === "done" || state === "reviewed" || state === "confident" || state === "passed";
  return (
    <li>
      <Link
        className="rm-chip"
        href={item.href}
        data-state={state}
        data-next={isNext || undefined}
        aria-label={`${index + 1}. ${title} — ${stateText}`}
        title={`${index + 1}. ${title} — ${stateText}`}
      >
        <span className="rm-chip-n tabular" aria-hidden>
          {done ? "✓" : state === "live" ? "■" : index + 1}
        </span>
      </Link>
    </li>
  );
}

/* ============================================================
   一档
   ============================================================ */

function Stage({
  stage,
  index,
  status,
  planStageState,
}: {
  stage: ResolvedStage;
  index: number;
  status: PlanStatus;
  planStageState: "done" | "current" | "future";
}) {
  const stat = status.stages[index];
  const next = status.next;
  const nextKeyHere = next && next.stageIndex === index ? next.item.key : undefined;
  const tracks = tracksOfStage(stage);
  const nextItem = nextKeyHere
    ? stage.items.find((it) => it.key === nextKeyHere)
    : undefined;
  const nextIndex = nextItem ? stage.items.indexOf(nextItem) : -1;

  return (
    <li className="rm-stage" id={`stage-${stage.id}`} data-state={planStageState}>
      <span className="rm-marker" aria-hidden>
        <span className="rm-marker-n tabular">{String(index + 1).padStart(2, "0")}</span>
      </span>

      <details className="rm-det" open={planStageState === "current"}>
        <summary className="rm-head">
          <span className="rm-head-top">
            <PhaseBadge phase={stage.phase} />
            <h3 className="rm-title">
              <T zh={stage.zh} en={stage.en} />
            </h3>
            {planStageState === "current" && (
              <span className="rm-you">
                <T zh="你在这" en="You are here" />
              </span>
            )}
            {planStageState === "done" && (
              <span className="rm-ok">
                <T zh="这一档做完了" en="Stage complete" />
              </span>
            )}
            <span className="rm-count tabular">
              {stat.done} / {stat.total}
            </span>
          </span>
          <span className="rm-why">
            <T zh={stage.whyZh} en={stage.whyEn} />
          </span>
        </summary>

        <div className="rm-body">
          {stat.confident !== undefined && (
            <p className="rm-note">
              <T
                zh={`过过一遍 ${stat.done} / ${stat.total} · 其中标了「会」的 ${stat.confident} 道。自评过一次就算过了这一档 —— 不用把每道都标成「会」才往下走。`}
                en={`${stat.done} / ${stat.total} reviewed, ${stat.confident} of them marked confident. One rating is enough to clear this stage — you do not have to reach confident on every question first.`}
              />
            </p>
          )}

          {tracks.length > 0 && (
            <p className="rm-tracks">
              <T zh="覆盖方向：" en="Topics covered: " />
              {tracks.map((tk, i) => (
                <span key={tk}>
                  {i > 0 && <span aria-hidden>·</span>}
                  <Link href={`/drill?track=${tk}`}>
                    <T zh={DRILL_TRACK_LABEL[tk].zh} en={DRILL_TRACK_LABEL[tk].en} />
                  </Link>
                </span>
              ))}
            </p>
          )}

          {/* 密集档：先单独给一行「下一格」，再摊格子。
              这样即便是 54 个格子的那一档，也永远有一个带标题的目标。 */}
          {stage.layout === "chips" && nextItem && (
            <ol className="rm-rows rm-rows-solo">
              <ItemRow
                item={nextItem}
                index={nextIndex}
                state={status.itemStatus.get(nextItem.key)!.state}
                isNext
              />
            </ol>
          )}

          {stage.layout === "rows" ? (
            <ol className="rm-rows">
              {stage.items.map((item, i) => (
                <ItemRow
                  key={item.key}
                  item={item}
                  index={i}
                  state={status.itemStatus.get(item.key)!.state}
                  isNext={item.key === nextKeyHere}
                />
              ))}
            </ol>
          ) : (
            <ol className="rm-chips">
              {stage.items.map((item, i) => (
                <ItemChip
                  key={item.key}
                  item={item}
                  index={i}
                  state={status.itemStatus.get(item.key)!.state}
                  isNext={item.key === nextKeyHere}
                />
              ))}
            </ol>
          )}

          {stage.layout === "chips" && (
            <p className="rm-note rm-note-quiet">
              <T
                zh={`${stat.total} 格，一格一个真实条目 —— 鼠标停上去或用键盘走过去会读出它的标题。`}
                en={`${stat.total} squares, one per real item — hover or tab to one and it reads out its title.`}
              />
            </p>
          )}
        </div>
      </details>
    </li>
  );
}

/* ============================================================
   整页
   ============================================================ */

export function PlanDetail({ plan }: { plan: ResolvedPlan }) {
  const { status, ready } = usePlanStatus(plan.id);
  const { activePlan, setActivePlan, notePlanSeen, ready: pReady } = useProgress();
  const [changing, setChanging] = useState(false);

  // 「最近看过哪条计划」。幂等，所以依赖数组里只放 id 和 ready
  useEffect(() => {
    if (!pReady) return;
    notePlanSeen(plan.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pReady, plan.id]);

  if (!status) return null;

  const active = pReady ? activePlan() : undefined;
  const isActive = active?.id === plan.id;
  const stage = status.plan.stages[status.currentStageIndex];
  const next = status.next;
  const hours = Math.round(plan.minutes / 60);

  return (
    <main className="main" data-rail="off">
      <div className="content pl-page">
        <nav className="crumb" aria-label="Breadcrumb">
          <span>
            <Link href="/plans">
              <T zh="引导计划" en="Guided plans" />
            </Link>
          </span>
          <span className="crumb-sep" aria-hidden>
            /
          </span>
          <span>
            <T zh={plan.zh} en={plan.en} />
          </span>
        </nav>

        {/* ---------- 计划页头 ---------- */}
        <header className="pl-head">
          <div className="pl-head-eyebrow">
            <PlanMark />
            <T zh="引导计划" en="Guided plan" />
            {isActive && (
              <span className="pl-head-active">
                <T zh="正在跟这条走" en="Following this one" />
              </span>
            )}
          </div>

          <h1 className="pl-head-title serif">
            <T zh={plan.zh} en={plan.en} />
          </h1>
          <p className="pl-head-outcome">
            <T zh={plan.outcomeZh} en={plan.outcomeEn} />
          </p>

          <p className="pl-head-scope">
            <T
              zh={`${plan.stages.length} 档 · ${status.total} 个条目 · 有估时的部分约 ${hours} 小时`}
              en={`${plan.stages.length} stages · ${status.total} items · about ${hours} hours of timed material`}
            />
            <span className="pl-head-for">
              <T zh={plan.forZh} en={plan.forEn} />
            </span>
          </p>

          <PlanMeter
            done={status.done}
            total={status.total}
            label={
              status.complete ? (
                <T zh="全部做完了" en="All done" />
              ) : (
                <T
                  zh={`第 ${status.currentStageIndex + 1} 档 · ${stage?.zh ?? ""}`}
                  en={`stage ${status.currentStageIndex + 1} · ${stage?.en ?? ""}`}
                />
              )
            }
          />

          <div className="pl-head-actions">
            {status.complete ? (
              <span className="pl-done-flag">
                <T
                  zh="这条计划的每一格都做完了。"
                  en="Every item in this plan is done."
                />
              </span>
            ) : (
              next && (
                <Link
                  className="pl-head-cta"
                  href={next.item.href}
                  onClick={() => {
                    // 点了「开始 / 继续」就等于选了这条计划 —— 不用先在别处点一下「选它」
                    if (!isActive) setActivePlan(plan.id);
                  }}
                >
                  <span className="pl-head-cta-label">
                    {isActive ? (
                      <T zh="继续" en="Continue" />
                    ) : status.done > 0 ? (
                      <T zh="跟这条走" en="Follow this plan" />
                    ) : (
                      <T zh="开始" en="Start" />
                    )}
                  </span>
                  <span className="pl-head-cta-item">
                    <T zh={next.item.zh} en={next.item.en} />
                  </span>
                </Link>
              )
            )}

            {!isActive && (
              <button
                type="button"
                className="btn btn-sm"
                disabled={!pReady}
                onClick={() => setActivePlan(plan.id)}
              >
                <T zh="设为当前计划" en="Make this my plan" />
              </button>
            )}

            {isActive && (
              <>
                <Link className="btn btn-sm" href="/plans">
                  <T zh="换一条计划" en="Change plan" />
                </Link>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setChanging(true)}
                >
                  <T zh="先不跟计划" en="Stop guiding me" />
                </button>
              </>
            )}
          </div>

          {changing && <StopGuiding onClose={() => setChanging(false)} />}

          {status.complete && status.weakestDrill && (
            <p className="pl-head-more">
              <T
                zh="还能做的一件事：把标了「不会」和「模糊」的八股再过一遍。"
                en="One thing left worth doing: run the questions you marked shaky or missed again."
              />{" "}
              <Link href={status.weakestDrill.href}>
                <T zh="从这一道开始 →" en="Start with this one →" />
              </Link>
            </p>
          )}
        </header>

        {/* ---------- 路线图 ---------- */}
        <ol className="rm" aria-label="Plan roadmap">
          {status.plan.stages.map((s, i) => (
            <Stage
              key={s.id}
              stage={s}
              index={i}
              status={status}
              planStageState={
                status.stages[i].complete
                  ? "done"
                  : i === status.currentStageIndex
                    ? "current"
                    : "future"
              }
            />
          ))}
        </ol>

        {!ready && (
          <p className="dimmer" style={{ fontSize: 13 }}>
            <T
              zh="正在读这台浏览器里的进度…"
              en="Reading your progress from this browser…"
            />
          </p>
        )}

        <p className="pl-foot">
          <T
            zh={
              <>
                计划里每一格的完成状态都是<strong>已有进度的一个视图</strong> ——
                以前自己刷过的八股、做过的练习一条都不会白做，跟着计划做完的
                也照样在 <Link href="/path">课程</Link> 里打勾。
                换计划、不跟计划都不动任何记录。
              </>
            }
            en={
              <>
                Every square here is <strong>a view of progress you already have</strong>.
                Questions you rated and exercises you solved before picking a plan all
                count, and anything you finish inside a plan is still ticked in{" "}
                <Link href="/path">the courses</Link>. Changing plans or stopping never
                touches a record.
              </>
            }
          />
        </p>
      </div>
    </main>
  );
}

/** 「先不跟计划」的确认。破坏性不大，但要说清它不动任何进度 */
function StopGuiding({ onClose }: { onClose: () => void }) {
  const { clearActivePlan } = useProgress();
  return (
    <div className="pl-confirm" role="alertdialog" aria-label="Stop guiding me">
      <span>
        <T
          zh="不跟计划之后，首页第一屏换回「接着上次那件事」。已经做完的东西一条都不会动。"
          en="With guiding off, the home page goes back to picking up your last item. Nothing you have finished is touched."
        />
      </span>
      <button
        type="button"
        className="btn btn-sm"
        onClick={() => {
          clearActivePlan();
          onClose();
        }}
      >
        <T zh="确定" en="Turn it off" />
      </button>
      <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>
        <T zh="再想想" en="Never mind" />
      </button>
    </div>
  );
}

/** 档位标签的顺序 —— 计划卡片上那排小徽章要按这个排 */
export const PHASE_ORDER = Object.keys(PHASE) as (keyof typeof PHASE)[];

export type { ResolvedPlan };
