"use client";

// 「继续」—— 顶栏那颗按钮和首页那张卡共用的一段逻辑。
//
// 【它回答的问题】
// 一个回头客打开这个站，第一个念头是「我上次到哪了」。以前这个答案只在
// 首页的 hero 里，而且只认课文；从八股或者 coding 半途离开的人回来看到的
// 仍然是「接着上次那一节课」—— 那不是他上次做的事。
//
// 现在目标从 progress.recent 里取，四个模式都算：
//   最近一节课 / 最近一张筛过的题单 / 最近一道 coding 题 / 最近一场考试。
// 一条历史都没有的人，目标是地基第一节 —— 那也是首页那句「从地基开始」。
//
// 【为什么 ready 之前要渲染「从第一节开始」而不是空】
// 进度在 localStorage 里，服务端不知道。服务端和首次客户端渲染必须输出同一棵树，
// 否则 hydration 警告。所以两边都先渲染「开始第一课」，挂载后 ready 翻 true
// 再换成真实目标 —— 换的是文字，不是结构，不会跳版。

import dynamic from "next/dynamic";
import Link from "next/link";
import { NAV, lessonPath, navExam, navLessonsOf } from "@/content/nav";
import { pathGroups } from "@/content/path";
import { useT } from "@/lib/locale";
import { modeById, type ModeId } from "@/lib/modes";
import { useProgress } from "@/lib/progress";
import { T } from "./t";

export interface ContinueTarget {
  mode: ModeId;
  href: string;
  title: string;
  titleEn?: string;
  sub?: string;
  subEn?: string;
  /** 没有任何历史 —— 这是「从地基第一节开始」，按钮上写「开始」而不是「继续」 */
  fresh: boolean;
  /** 估时（分钟）。只有 fresh 那一档给得出，用来在首页那张卡上写「约 12 分钟」 */
  minutes?: number;
}

/** 地基第一节 —— 全站唯一的「零历史」落点 */
function foundationsStart(): ContinueTarget {
  const exam = NAV.find((e) => e.id === "foundations") ?? NAV[0];
  const first = exam ? navLessonsOf(exam)[0] : undefined;
  if (!first) {
    // 内容全空只可能发生在开发中途，别让顶栏因此崩掉
    return { mode: "learn", href: "/path", title: "课程", titleEn: "Courses", fresh: true };
  }
  return {
    mode: "learn",
    href: lessonPath(exam.id, first.lesson.id),
    title: first.lesson.title,
    titleEn: first.lesson.titleEn,
    sub: exam.shortTitle,
    subEn: exam.shortTitleEn,
    fresh: true,
    minutes: first.lesson.minutes,
  };
}

/**
 * 「继续」的目标：跨模式最近去过的那一条，没有就是地基第一节。
 *
 * 【跟着计划走的时候呢】
 * 那种情况下顶栏那颗按钮换成 components/plan-kit.tsx 里的
 * PlanContinueButton（懒加载）—— 因为算「计划的下一格」要展开计划，
 * 就要读 content/nav（120 KB 原始字节）。这个文件在外壳里，
 * 每一个路由都下载它，所以它**不许**碰计划那一套。
 * 分工写在 ContinueButton 里。
 */
export function useContinue(): { ready: boolean; target: ContinueTarget } {
  const { ready, mostRecent } = useProgress();
  if (!ready) return { ready, target: foundationsStart() };

  const best = mostRecent();
  if (!best) return { ready, target: foundationsStart() };
  return {
    ready,
    target: { mode: best.mode, ...best.item, fresh: false },
  };
}

/** 某一个模式里最近的那一条。Review / Practice / Assess 侧栏用它认「当前筛的是什么」。 */
export function useResume(mode: ModeId): ContinueTarget | undefined {
  const { ready, recentOf } = useProgress();
  if (!ready) return undefined;
  const item = recentOf(mode);
  return item ? { mode, ...item, fresh: false } : undefined;
}

/**
 * Learn 模式里那一个「接着学 / 从这里开始」的目标。
 *
 * 【为什么不能让侧栏和 /path 各算各的】
 * 它们同时出现在同一屏上（/path 页顶那条 + 左边侧栏那颗）。
 * 各算一份的结果实测就是打架：一个说「Node.js、npm 和 lockfile」
 * （地基第一节），另一个说「两个考试项目的目录结构」（第一节没读完的）。
 * 同一个问题在一屏里给两个答案，正是这次要修的毛病。所以只有这一份。
 *
 * 优先级：
 *   ① 这个模式里最近去过的那一节
 *   ② 升级前的老数据只有 last —— 回落到它，老用户第一次打开就能接上
 *   ③ 主线里第一节还没读完的课
 *   ④ 地基第一节
 */
export function useLearnTarget(): { target: ContinueTarget; resumed: boolean } {
  const { ready, recentOf, data, lessonDone } = useProgress();

  if (ready) {
    const recent = recentOf("learn");
    if (recent) return { target: { mode: "learn", ...recent, fresh: false }, resumed: true };

    if (data.last) {
      return {
        target: {
          mode: "learn",
          href: `/exams/${data.last.examId}/${data.last.lessonId}`,
          title: data.last.title,
          fresh: false,
        },
        resumed: true,
      };
    }

    for (const exam of pathGroups().find((g) => g.kind === "main")?.exams ?? []) {
      const hit = navLessonsOf(exam).find((r) => !lessonDone(exam.id, r.lesson.id));
      if (!hit) continue;
      return {
        target: {
          mode: "learn",
          href: lessonPath(exam.id, hit.lesson.id),
          title: hit.lesson.title,
          titleEn: hit.lesson.titleEn,
          sub: exam.shortTitle,
          subEn: exam.shortTitleEn,
          fresh: false,
        },
        resumed: false,
      };
    }
  }

  return { target: foundationsStart(), resumed: false };
}

/**
 * 「你在这门课的第几节」。
 *
 * 只有 learn 那一档能算出来 —— href 形如 /exams/<examId>/<lessonId>，
 * 从 NAV 里反查得到序号和总数。别的模式没有线性序号，返回 undefined，
 * 调用方就只显示模式名和 sub。
 */
export function lessonPositionOf(href: string):
  | { examId: string; lessonId: string; index: number; total: number; courseZh: string; courseEn?: string }
  | undefined {
  const m = /^\/exams\/([^/?#]+)\/([^/?#]+)/.exec(href);
  if (!m) return undefined;
  const exam = navExam(m[1]);
  if (!exam) return undefined;
  const ref = navLessonsOf(exam).find((r) => r.lesson.id === m[2]);
  if (!ref) return undefined;
  return {
    examId: exam.id,
    lessonId: ref.lesson.id,
    index: ref.index,
    total: ref.total,
    courseZh: exam.shortTitle,
    courseEn: exam.shortTitleEn,
  };
}

/* ============================================================
   顶栏那颗按钮
   ------------------------------------------------------------
   刻意做小：32px 高，和搜索、语言、主题一排。它要显眼，但顶栏不该变成工具条。
   宽屏下带上目标名字（截断），窄屏只留「继续」两个字。
   ============================================================ */

/**
 * 顶栏那颗按钮。
 *
 * 跟着计划走 → 换成懒加载的 PlanContinueButton（它指向计划的下一格）。
 * 没跟计划   → 就是这一份，指向最近去过的地方。
 * 两支都不会同时出现，所以顶栏永远只有一颗「继续」。
 */
export function ContinueButton() {
  const { activePlan, ready: pReady } = useProgress();
  if (pReady && activePlan()) return <PlanContinue />;
  return <RecentContinueButton />;
}

const PlanContinue = dynamic(
  () => import("./plan-kit").then((m) => m.PlanContinueButton),
  { ssr: false, loading: () => <RecentContinueButton /> },
);

function RecentContinueButton() {
  const { target } = useContinue();
  const t = useT();
  const label = target.fresh ? t("开始", "Start") : t("继续", "Continue");
  const name = t(target.title, target.titleEn ?? target.title);

  return (
    <Link className="cont-btn" href={target.href} title={`${label} — ${name}`}>
      <span className="cont-btn-label">
        {target.fresh ? <T zh="开始" en="Start" /> : <T zh="继续" en="Continue" />}
      </span>
      <span className="cont-btn-item">{name}</span>
    </Link>
  );
}

/* ============================================================
   首页第一屏那张卡
   ------------------------------------------------------------
   一张卡、一个主按钮。有历史就说清「哪一件事、在哪门课、走到哪」，
   没有历史就说清「从哪开始、大概多久」。
   ============================================================ */

export function ContinueCard() {
  const { ready, target } = useContinue();
  const { countLessons } = useProgress();
  const mode = modeById(target.mode);
  const pos = lessonPositionOf(target.href);
  const done = ready && pos ? countLessons(pos.examId) : 0;

  return (
    <section className="dash-cont" aria-labelledby="dash-cont-h">
      <div className="dash-cont-eyebrow">
        {target.fresh ? (
          <T zh="从地基开始" en="Start from the foundations" />
        ) : (
          <T zh="接着上次那件事" en="Continue where you left off" />
        )}
      </div>

      <h1 className="dash-cont-title display" id="dash-cont-h">
        <T zh={target.title} en={target.titleEn} />
      </h1>

      <p className="dash-cont-meta">
        <span className="dash-cont-mode">
          <T zh={mode.zh} en={mode.en} />
        </span>
        {(target.sub || pos) && (
          <span className="dash-cont-sub">
            <T zh={target.sub ?? pos?.courseZh ?? ""} en={target.subEn ?? pos?.courseEn} />
          </span>
        )}
        {pos && (
          <span className="dash-cont-pos tabular">
            <T
              zh={`第 ${pos.index} / ${pos.total} 节`}
              en={`Lesson ${pos.index} of ${pos.total}`}
            />
          </span>
        )}
        {pos && ready && (
          <span className="dash-cont-pos tabular">
            <T zh={`这门课已读 ${done} 节`} en={`${done} done in this course`} />
          </span>
        )}
        {target.fresh && target.minutes !== undefined && (
          <span className="dash-cont-pos tabular">
            <T zh={`约 ${target.minutes} 分钟`} en={`~${target.minutes} min`} />
          </span>
        )}
      </p>

      <Link className="dash-cont-cta" href={target.href}>
        {target.fresh ? (
          <T zh="开始第一节" en="Start the first lesson" />
        ) : (
          <T zh="继续" en="Continue" />
        )}
      </Link>
    </section>
  );
}

/**
 * 紧凑的「接着上次那件事」条 —— 首页在**没跟计划**时用。
 *
 * 【为什么不是那张大卡】
 * 没跟计划时首页第一屏要问的是「你现在想达成什么目标」（六条计划），
 * 那句话是 h1。这时候「上次那件事」退成一行 —— 它仍然在，但不再抢焦点。
 */
export function ContinueStrip() {
  const { ready, target } = useContinue();
  const mode = modeById(target.mode);
  if (!ready || target.fresh) return null;

  return (
    <div className="dash-resume">
      <span className="dash-resume-label">
        <T zh="或者接着上次那件事" en="Or pick up where you left off" />
      </span>
      <Link className="dash-resume-link" href={target.href}>
        <span className="dash-resume-mode" data-mode={target.mode}>
          <T zh={mode.zh} en={mode.en} />
        </span>
        <span className="dash-resume-title">
          <T zh={target.title} en={target.titleEn} />
        </span>
      </Link>
    </div>
  );
}

/**
 * 一行式的「接着学」条 —— /path 顶部用。
 *
 * 和上面那张卡是同一个目标，但这里只针对 learn：站在路线图上，
 * 「继续」应该回到课文，不该跳去八股。
 */
export function ResumeBar() {
  const { target, resumed } = useLearnTarget();
  const pos = lessonPositionOf(target.href);

  return (
    <div className="resume-bar">
      <div className="resume-bar-text">
        <span className="resume-bar-label">
          {resumed ? (
            <T zh="接着上次那一节" en="Pick up your last lesson" />
          ) : (
            <T zh="从这里开始" en="Start here" />
          )}
        </span>
        <span className="resume-bar-title">
          <T zh={target.title} en={target.titleEn} />
        </span>
        {pos && (
          <span className="resume-bar-pos tabular">
            <T
              zh={`${pos.courseZh} · 第 ${pos.index} / ${pos.total} 节`}
              en={`${pos.courseEn ?? pos.courseZh} · lesson ${pos.index} of ${pos.total}`}
            />
          </span>
        )}
      </div>
      <Link className="btn btn-primary" href={target.href}>
        {resumed ? <T zh="继续" en="Resume" /> : <T zh="开始" en="Start" />}
      </Link>
    </div>
  );
}
