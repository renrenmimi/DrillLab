"use client";

// 新访客的第一屏 —— **三个决定，不是六张卡**。
//
// 【为什么从六张改成三个】
// 上一版第一屏直接摊开六条计划：每张卡有名字、结果、适合谁、六七个档位徽章、
// 「20 档 · 350 条 · 约 42 小时」，还有一颗 Start。六张一起看是
// **六个都挺重要的选择**，而一个刚到的人这时候连「Federation 是什么」都不知道。
// 密度本身就是劝退：要读完六张卡才敢点第一下。
//
// 现在第一屏只问一次，答案只有三个：
//
//   A  什么都想学        → 完整学习路线（推荐，整屏唯一的实心按钮）
//   B  准备一场考试      → 展开四个紧凑子项（React / Federation / Spring / Cab）
//   C  准备面试          → 前端面试复习
//
// B 是渐进披露：不选它，那四个考试根本不出现。选了才展开一行一个的紧凑列表 ——
// 那时候「我要准备哪一场考试」已经是个具体问题了，四个选项不再是噪音。
//
// 六条计划一条都没删，也没改：`/plans` 仍然是完整那张表，
// 这一屏底下有一条安静的「看全部六条计划」通向它。
//
// 【为什么这个文件可以读 plan-lite】
// 计划清单在首页本来就是首屏依赖（这一屏要计划的名字和结果）。
// 见 lib/plan-lite.ts 顶部那段说明。

import Link from "next/link";
import { useState } from "react";
import { litePlanById, type LitePlan } from "@/lib/plan-lite";
import { useProgress } from "@/lib/progress";
import { PlanMark } from "./plan-mark";
import { T } from "./t";

/** 四场考试的顺序 —— 和 content/plans.ts 里的定义顺序一致 */
const EXAM_PLANS = [
  "react-assessment",
  "federation-assessment",
  "spring-controller",
  "cab-booking",
] as const;

const COMPLETE = "complete";
const INTERVIEW = "frontend-interview";

/** 「约 15 小时」。计划的 minutes 是全部条目之和 */
function hours(p: LitePlan | undefined) {
  if (!p) return undefined;
  const h = Math.round(p.minutes / 60);
  return { zh: `约 ${h} 小时`, en: `about ${h} h` };
}

/** 一条计划的规模，给紧凑子项用 */
function scale(p: LitePlan | undefined) {
  if (!p) return undefined;
  const h = hours(p)!;
  return {
    zh: `${p.items.length} 条 · ${h.zh}`,
    en: `${p.items.length} items · ${h.en}`,
  };
}

export function PlanPicker() {
  const { setActivePlan } = useProgress();
  // 展开哪一组。同时最多一组 —— 三个决定里只会选一个。
  const [open, setOpen] = useState<"exam" | null>(null);

  const complete = litePlanById(COMPLETE);
  const interview = litePlanById(INTERVIEW);

  /** 选中一条计划并进它的第一格。和计划卡片上的 Start 是同一个动作。 */
  const start = (plan: LitePlan | undefined) => {
    if (plan) setActivePlan(plan.id);
  };

  const firstHref = (plan: LitePlan | undefined) =>
    plan?.items[0]?.href ?? (plan ? `/plans/${plan.id}` : "/plans");

  return (
    <section className="pick" aria-labelledby="pick-h">
      {/* 一处克制的环境光晕。只有新访客的第一屏有它，别处一律没有。 */}
      <div className="pick-glow" aria-hidden />

      <div className="ui-eyebrow">
        <PlanMark />
        <T zh="开始之前" en="Before you start" />
      </div>

      <h1 className="pick-h1 display" id="pick-h">
        <T zh="你想为什么做好准备？" en="What do you want to be ready for?" />
      </h1>

      <p className="pick-lede">
        <T
          zh="选一个，剩下的顺序交给它 —— 读哪几节、背哪些方向、做哪些练习、最后在空文件夹里做一遍。"
          en="Pick one and the order comes with it: which lessons to read, which topics to revise, which exercises to do, and finally the same thing in an empty folder."
        />
      </p>

      <ul className="pick-list">
        {/* ---------- A 推荐 ---------- */}
        <li className="pick-opt" data-tone="lead">
          <div className="pick-opt-main">
            <div className="pick-opt-top">
              <h2 className="pick-opt-name display">
                <T zh="从零完整学一遍" en="The complete learning path" />
              </h2>
              <span className="pick-flag">
                <T zh="推荐" en="Recommended" />
              </span>
            </div>
            <p className="pick-opt-for">
              <T
                zh="适合想按顺序把全部内容走完的人。从「npm install 到底做了什么」讲起，不假设任何前置知识。"
                en="For someone who wants to learn everything in order. It starts from what npm install actually does and assumes nothing."
              />
            </p>
            {complete && (
              <div className="ui-meta">
                <span>
                  <T
                    zh={`${complete.stages.length} 档 · ${complete.items.length} 条`}
                    en={`${complete.stages.length} stages · ${complete.items.length} items`}
                  />
                </span>
                <span>
                  <T zh={hours(complete)!.zh} en={hours(complete)!.en} />
                </span>
              </div>
            )}
          </div>

          {/* 整屏唯一的实心按钮 */}
          <Link
            className="pick-cta"
            href={firstHref(complete)}
            onClick={() => start(complete)}
          >
            <T zh="开始完整路线" en="Start the complete path" />
          </Link>
        </li>

        {/* ---------- B 渐进披露 ---------- */}
        <li className="pick-opt">
          <button
            type="button"
            className="pick-opt-btn"
            aria-expanded={open === "exam"}
            aria-controls="pick-exams"
            onClick={() => setOpen(open === "exam" ? null : "exam")}
          >
            <span className="pick-opt-main">
              <span className="pick-opt-top">
                <span className="pick-opt-name display">
                  <T zh="准备一场考试" en="Prepare for an assessment" />
                </span>
              </span>
              <span className="pick-opt-for">
                <T
                  zh="有明确的考试或交付要在眼前。选中之后挑是哪一场。"
                  en="There is a specific assessment in front of you. Choose which one next."
                />
              </span>
            </span>
            <span className="pick-chev" aria-hidden />
          </button>

          {open === "exam" && (
            <ul className="pick-subs" id="pick-exams">
              {EXAM_PLANS.map((id) => {
                const p = litePlanById(id);
                if (!p) return null;
                const s = scale(p);
                return (
                  <li key={id}>
                    <Link className="pick-sub" href={firstHref(p)} onClick={() => start(p)}>
                      <span className="pick-sub-name">
                        <T zh={p.zh} en={p.en} />
                      </span>
                      <span className="pick-sub-out">
                        <T zh={p.outcomeZh} en={p.outcomeEn} />
                      </span>
                      {s && (
                        <span className="pick-sub-n">
                          <T zh={s.zh} en={s.en} />
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </li>

        {/* ---------- C 面试 ---------- */}
        <li className="pick-opt">
          <Link
            className="pick-opt-btn"
            href={firstHref(interview)}
            onClick={() => start(interview)}
          >
            <span className="pick-opt-main">
              <span className="pick-opt-top">
                <span className="pick-opt-name display">
                  <T zh="准备面试" en="Prepare for interviews" />
                </span>
              </span>
              <span className="pick-opt-for">
                <T
                  zh="要过一遍高频问答和手写题。走「前端面试复习」这条。"
                  en="You need a pass over the common questions and the write-it-yourself ones. That is the Frontend Interview Review route."
                />
              </span>
            </span>
            <span className="pick-go" aria-hidden>
              →
            </span>
          </Link>
        </li>
      </ul>

      <p className="pick-all">
        {/* 这一段现在就住在 /plans 上，所以链接改成锚点 —— 指向自己会白刷一次页面 */}
        <a className="ui-quiet" href="#all-plans">
          <T zh="看全部六条的细节" en="See all six in detail" />
        </a>
        <span className="pick-all-note">
          <T
            zh="换计划、先不跟计划都随时可以，进度一条都不会丢。"
            en="You can switch or stop being guided at any time; nothing you have finished is lost."
          />
        </span>
      </p>
    </section>
  );
}
