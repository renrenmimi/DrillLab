"use client";

// 课尾「接下来」面板里那一步的**轻壳**。
//
// 【为什么要有壳】
// 这一步在没跟计划时就是原来那句「接着看下一节」—— 那是首屏可见内容，
// 必须服务端就渲染出来。而计划版本要读 content/nav（120 KB），
// 课程页原本不需要它。
//
// 所以：默认那一支留在这里（只用字符串，不 import 任何内容模块），
// 计划那两支放在 lesson-plan-live.tsx，跟着计划的人才下载。
//
// 【三种情况，任何时候只有一个实心按钮】
//   没跟计划 / 这一节不在计划里 → 原样：「接着看下一节」
//   在计划里、下一格不是这一节  → 「接着走计划」当主按钮，
//                                「课程里的下一节」退成一行小字（两者不同才给）
//   计划走完了                  → 「计划走完了」+ 回看整条计划

import dynamic from "next/dynamic";
import Link from "next/link";
import { useProgress } from "@/lib/progress";
import { T } from "./t";

// 指向 plan-kit —— 和 components/plan-slots.tsx 里那几个懒加载点是**同一个模块**。
// 指向别的文件会让 webpack 把 plan-kit 提成初始 chunk（见那边的注释）。
const Live = dynamic(
  () => import("./plan-kit").then((m) => m.LessonPlanStepLive),
  { ssr: false },
);

export function LessonPlanStep({
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
  const { ready, activePlan } = useProgress();

  // 跟着计划走：整步交给懒加载的那一份。它自己会判断这一节在不在计划里，
  // 不在就返回 null —— 那种情况下下面这份默认的照样渲染。
  if (ready && activePlan()) {
    return (
      <>
        <Live examId={examId} lessonId={lessonId} next={next} arenaHref={arenaHref} />
        <DefaultStep next={next} arenaHref={arenaHref} data-fallback />
      </>
    );
  }

  return <DefaultStep next={next} arenaHref={arenaHref} />;
}

/**
 * 默认那一步。
 *
 * 【为什么跟着计划时它也渲染，而不是二选一】
 * 「这一节在不在计划里」要等懒加载那份到位才知道。如果这里先不渲染，
 * 一个正在跟计划、但读的是计划外一节课的人，会有一瞬间连「下一节」都没有。
 * 所以两份都渲染，由 CSS 在计划那份真的出现时把这一份收起来
 * （.lnext-step[data-plan-live] + .lnext-step[data-fallback] { display: none }）。
 * 纯 CSS，不用把状态提上去。
 */
function DefaultStep({
  next,
  arenaHref,
  ...rest
}: {
  next?: { href: string; zh: string; en?: string };
  arenaHref?: string;
} & Record<string, unknown>) {
  return (
    <li className="lnext-step" data-primary {...rest}>
      <div className="lnext-step-body">
        <span className="lnext-step-title">
          {next ? (
            <T zh="接着看下一节" en="Continue to the next lesson" />
          ) : (
            <T zh="这一门读完了 —— 去验收" en="Course finished — go get checked" />
          )}
        </span>
        <span className="lnext-step-sub">
          {next ? (
            <T zh={next.zh} en={next.en} />
          ) : (
            <T
              zh="考场：空文件夹、计时、没有提示按钮"
              en="The arena: an empty folder, a clock, no hint button"
            />
          )}
        </span>
      </div>
      <Link className="btn btn-primary lnext-cta" href={next ? next.href : (arenaHref ?? "/arena")}>
        {next ? <T zh="下一节" en="Next lesson" /> : <T zh="去考场" en="To the arena" />}
      </Link>
    </li>
  );
}
