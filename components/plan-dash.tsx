"use client";

// 回访者的首页 —— 一张**个人学习仪表盘**。
//
// 第一屏只回答三个问题，其余全部推到下面：
//
//   我在准备什么？   计划名 + 当前档
//   我走到哪了？     4 / 130 + 剩余估时
//   下一步做什么？   一张大卡 + 整页唯一的实心按钮
//
// 【和上一版的区别】
// 上一版第一屏是「计划名 + 进度 + 下一格标题 + 一颗按钮 + 两条文字链」，
// 紧接着就是四个模式的等重卡片。四张卡和那颗按钮抢注意力，
// 而它们回答的是完全不同的问题（「让我自己挑」）。
// 现在四个模式退到最下面一节「浏览全部材料」，标题层级明显更低，
// 而且它们本来就一直在侧栏里。
//
// 【为什么「下一件事」那张卡要写「为什么是它」】
// 「下一步是《两个考试项目的目录结构》」这句话本身不构成理由。
// 一个人凭什么信这一步值得做？所以卡上带一句这一档的作用 ——
// 那句话是计划**唯一自己拥有的文字**（content/plans.ts 里的 whyZh），
// 课文里不存在，因为课文只说自己讲什么。

import Link from "next/link";
import { useState } from "react";
import { useT } from "@/lib/locale";
import { modeById } from "@/lib/modes";
import { pct } from "@/lib/plan-progress";
import { T } from "./t";
import { PlanMark } from "./plan-mark";
import { RestartRound, StateDot, useActivePlan } from "./plan-kit";

/**
 * 剩下大概要多久。
 *
 * 【这个数字的边界要说清】只有课文、coding、考场题和模拟考带估时
 * （content/plans.ts 的数据模型如此），练习和八股没有。所以这里是
 * **有估时的那部分**之和，不是全部。宁可少算，也不编一个平均值 ——
 * 编出来的数字会让人以为剩下的时间比实际短。
 */
function remainingHours(
  items: { key: string; minutes?: number }[],
  done: (key: string) => boolean,
) {
  const mins = items.reduce((n, it) => (done(it.key) ? n : n + (it.minutes ?? 0)), 0);
  if (mins <= 0) return undefined;
  return mins >= 90
    ? { zh: `还剩约 ${Math.round(mins / 60)} 小时`, en: `about ${Math.round(mins / 60)} h left` }
    : { zh: `还剩约 ${mins} 分钟`, en: `about ${mins} min left` };
}

export function PlanDash() {
  const { status, ready } = useActivePlan();
  const t = useT();
  // 「重走一遍」也放在这一屏。用户实测过一次：他要的就是「从头开始」，
  // 而这一屏是他唯一会看的地方 —— 只放在计划详情页等于没放。
  const [restarting, setRestarting] = useState(false);
  if (!ready || !status) return null;

  const { plan, next, itemStatus } = status;
  const stageIndex = status.currentStageIndex;
  const stage = plan.stages[stageIndex];
  const isDone = (key: string) => !!itemStatus.get(key)?.done;
  const left = remainingHours(plan.items, isDone);

  // 当前档的紧凑预览：做完的 + 当前那一格 + 后面两三格。
  // 一档可能有九十条（「背知识点」那种），全列出来就又变成数据库导出了。
  const preview = (() => {
    if (!stage) return [];
    const items = stage.items;
    const at = next && next.stageIndex === stageIndex ? next.itemIndex : 0;
    const doneBefore = items.slice(0, at).filter((it) => isDone(it.key));
    const tail = doneBefore.slice(-2);
    return [
      ...tail.map((it) => ({ it, kind: "done" as const })),
      ...(items[at] ? [{ it: items[at], kind: "now" as const }] : []),
      ...items.slice(at + 1, at + 3).map((it) => ({ it, kind: "next" as const })),
    ];
  })();

  const nextMode = next ? modeById(next.item.mode) : undefined;

  return (
    <section className="dash2" aria-labelledby="dash2-h">
      {/* ---------- 我在准备什么 / 走到哪了 ---------- */}
      <header className="dash2-head">
        <div className="ui-eyebrow">
          <PlanMark />
          <T zh="你的计划" en="Your plan" />
        </div>

        <h1 className="dash2-plan display" id="dash2-h">
          <T zh={plan.zh} en={plan.en} />
        </h1>

        <p className="dash2-stage">
          {status.complete ? (
            <T zh="七档全部走完了" en="Every stage is done" />
          ) : (
            <T
              zh={`第 ${stageIndex + 1} / ${plan.stages.length} 档 · ${stage?.zh ?? ""}`}
              en={`Stage ${stageIndex + 1} of ${plan.stages.length} · ${stage?.en ?? ""}`}
            />
          )}
        </p>

        <div className="ui-prog dash2-prog">
          <span className="ui-prog-num">
            <b>{status.done}</b> / {status.total}
          </span>
          <span className="ui-bar">
            <i style={{ width: `${pct(status.done, status.total)}%` }} />
          </span>
          {left && (
            <span
              className="ui-prog-label"
              title={t(
                "只统计带估时的部分（课文、coding、考场、模拟考）。练习和八股没有估时。",
                "Counts only the items that carry an estimate: lessons, coding problems, arena papers and mocks. Exercises and questions do not have one.",
              )}
            >
              <T zh={left.zh} en={left.en} />
            </span>
          )}
        </div>
      </header>

      {/* ---------- 下一件事 ---------- */}
      {next ? (
        <div className="dash2-next">
          <div className="dash2-next-top">
            <span className="dash2-kind">
              <T zh={nextMode!.zh} en={nextMode!.en} />
            </span>
            <span className="dash2-pos">
              <T
                zh={`第 ${next.stageIndex + 1} 档 · 第 ${next.itemIndex + 1} / ${plan.stages[next.stageIndex].items.length} 条`}
                en={`Stage ${next.stageIndex + 1} · item ${next.itemIndex + 1} of ${plan.stages[next.stageIndex].items.length}`}
              />
            </span>
            {next.item.minutes !== undefined && (
              <span className="dash2-min">
                <T zh={`约 ${next.item.minutes} 分钟`} en={`~${next.item.minutes} min`} />
              </span>
            )}
          </div>

          <h2 className="dash2-next-name display">
            <T zh={next.item.zh} en={next.item.en} />
          </h2>

          {stage && (
            <p className="dash2-why">
              <span className="dash2-why-label">
                <T zh="为什么是这一步" en="Why this is next" />
              </span>
              <T zh={stage.whyZh} en={stage.whyEn} />
            </p>
          )}

          <Link className="dash2-cta" href={next.item.href}>
            <T zh="继续" en="Continue" />
          </Link>

          {/* 【次要动作必须在同一屏上看得见】选了一条计划之后，
              「看全程 / 换一条 / 先不跟」三条路都得有出口。
              上一版这一屏一个都没有，只能自己想到去点侧栏的「我的计划」。 */}
          <p className="dash2-alts">
            <Link className="ui-quiet" href={`/plans/${plan.id}`}>
              <T zh="看全程" en="View the full plan" />
            </Link>
            <Link className="ui-quiet" href="/plans">
              <T zh="换一条计划" en="Change plan" />
            </Link>
            <button
              type="button"
              className="ui-quiet dash2-alt-btn"
              onClick={() => setRestarting(true)}
            >
              <T zh="重走一遍" en="Start over" />
            </button>
          </p>

          {restarting && (
            <RestartRound
              planId={plan.id}
              total={status.total}
              onClose={() => setRestarting(false)}
            />
          )}
        </div>
      ) : (
        <div className="dash2-next" data-done>
          <h2 className="dash2-next-name display">
            <T zh="这条计划走完了" en="This plan is complete" />
          </h2>
          <p className="dash2-why">
            <T
              zh="下一步可以再走一遍这条，换一条别的，或者回头把标了「不会」的八股过一遍。"
              en="You can run this one again, pick a different plan, or go back over the questions you marked as not known."
            />
          </p>
          <button
            type="button"
            className="dash2-cta"
            onClick={() => setRestarting(true)}
          >
            <T zh="再走一遍" en="Run it again" />
          </button>
          <p className="dash2-alts">
            <Link className="ui-quiet" href="/plans">
              <T zh="挑下一条计划" en="Pick another plan" />
            </Link>
          </p>
        </div>
      )}

      {/* ---------- 当前档的紧凑预览 ---------- */}
      {preview.length > 1 && stage && (
        <div className="dash2-peek">
          <div className="dash2-peek-head">
            <span className="dash2-peek-title">
              <T zh={stage.zh} en={stage.en} />
            </span>
            <Link className="ui-quiet" href={`/plans/${plan.id}#stage-${stage.id}`}>
              <T zh="看这一档全部" en="View the whole stage" />
            </Link>
          </div>
          <ol className="dash2-peek-list">
            {preview.map(({ it, kind }) => (
              <li key={it.key} className="dash2-peek-row" data-kind={kind}>
                <StateDot state={itemStatus.get(it.key)?.state ?? "todo"} />
                <Link className="dash2-peek-name" href={it.href}>
                  <T zh={it.zh} en={it.en} />
                </Link>
                {kind === "now" && (
                  <span className="dash2-peek-now">
                    <T zh="现在" en="Now" />
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
