"use client";

// 首页 —— 一张「今天做什么」的仪表盘。
//
// 【这一版换了第一个问题】
// 上一版第一屏问的是「你今天想做哪一类事」，答案是四个模式。那一步是对的，
// 但四个模式里只有 Learn 是线性的 —— 一个说「我要准备 React 考试」的人，
// 点进 Review 看到的是 105 道题的题库，点进 Practice 看到的是筛选器。
// 他要的是一条从现在到考试的路，而首页给不出。
//
// 所以第一个问题换成了：
//
//     你现在想达成什么目标？
//
// 六条引导计划就是六个答案。已经在跟某一条走的人，第一屏直接是那条计划的
// 当前位置和下一格 —— 整页唯一的主按钮。
//
// 四个模式**一个都没删**，它们退到「自由选择练习方式」这一节：
//   引导计划 = 「告诉我下一步做什么」
//   四个模式 = 「让我自己挑」
//
// 顺带删掉了原来那一节「建议的顺序」（学 → 背 → 练 → 考）——
// 那句话现在由计划本身说，而且说得具体得多：它不是一个抽象的顺序，
// 是「先读这 21 节、再背这 36 道、再做这 54 个练习」。
//
// 刻意不做的事：不做大卡片、不做渐变、不做进度环、不在第一屏解释产品架构。
// 「这个站是怎么组织的」那一整套说明在 /guide，从顶栏右边那个 ? 进。

import Link from "next/link";
import {
  ARENA,
  CODING,
  DRILLS,
  NAV,
  examPath,
  lessonPath,
  navExam,
} from "@/content/nav";
import { pathGroups } from "@/content/path";
import { useLocale } from "@/lib/locale";
import { MODES } from "@/lib/modes";
import { useProgress } from "@/lib/progress";
import { ContinueCard, ContinueStrip } from "./continue";
import { ActivePlanCard, PlanCards } from "./plan-cards";
import { useActivePlan } from "./plan-kit";
import { PlanMark } from "./plan-mark";
import { T } from "./t";

const TOTAL_LESSONS = NAV.reduce((n, e) => n + e.lessonCount, 0);
const TOTAL_EXERCISES = NAV.reduce((n, e) => n + e.exerciseCount, 0);
const SANDBOXED = CODING.filter((c) => c.hasSandbox).length;
const MOCK_COUNT = NAV.reduce((n, e) => n + e.mockExams.length, 0);
const drillsOf = (track: string) => DRILLS.filter((d) => d.track === track).length;
const codingOf = (track: string) => CODING.filter((c) => c.track === track).length;

/** 每个模式在卡片上那行数字。数量一律从数据算，不写死。 */
const MODE_COUNT: Record<string, { zh: string; en: string }> = {
  learn: {
    zh: `${NAV.length} 门课 · ${TOTAL_LESSONS} 节`,
    en: `${NAV.length} courses · ${TOTAL_LESSONS} lessons`,
  },
  review: {
    zh: `${DRILLS.length} 道问答 · 抽认卡`,
    en: `${DRILLS.length} questions · flashcards`,
  },
  practice: {
    zh: `${TOTAL_EXERCISES} 个练习 · ${CODING.length} 道 coding（${SANDBOXED} 道能在浏览器里跑）`,
    en: `${TOTAL_EXERCISES} exercises · ${CODING.length} coding problems (${SANDBOXED} run in the browser)`,
  },
  assess: {
    zh: `${ARENA.length} 道计时题，含 ${MOCK_COUNT} 套模拟考`,
    en: `${ARENA.length} timed papers, ${MOCK_COUNT} of them full mocks`,
  },
};

/**
 * 课文链接的兜底。
 *
 * 下面那几条「按技术点直接进去」写的是具体某一节课的 id。课文改名的话
 * 这些链接会 404，而这一页是客户端组件，没有构建期断言能挡住它。
 * 所以链接前先在 NAV 里查一下：查不到就退到那门课的总览页 ——
 * 少一层精确，总比给一个死链接好。
 */
function lessonOrExam(examId: string, lessonId: string) {
  const exam = navExam(examId);
  const ok = exam?.modules.some((m) => m.lessons.some((l) => l.id === lessonId));
  return ok ? lessonPath(examId, lessonId) : examPath(examId);
}

interface TopicAction {
  mode: "review" | "practice" | "learn" | "assess";
  href: string;
  n?: number;
  /**
   * 覆盖默认文字。
   *
   * TypeScript 那一行有两个「读课文」的去处（地基里够用的那两节，
   * 和面试八股里的深度那两节）—— 两个 chip 都写「读课文」就分不清点哪个了。
   */
  labelZh?: string;
  labelEn?: string;
}

const TOPICS: { name: string; actions: TopicAction[] }[] = [
  {
    name: "JavaScript",
    actions: [
      { mode: "review", href: "/drill?track=js", n: drillsOf("js") },
      { mode: "practice", href: "/code?track=js", n: codingOf("js") },
      { mode: "learn", href: lessonOrExam("foundations", "js-immutable-data") },
    ],
  },
  {
    name: "React",
    actions: [
      { mode: "review", href: "/drill?track=react", n: drillsOf("react") },
      { mode: "practice", href: "/code?track=react", n: codingOf("react") },
      { mode: "learn", href: examPath("react") },
      { mode: "assess", href: "/arena/r-rebuild-q1" },
    ],
  },
  {
    name: "TypeScript",
    actions: [
      { mode: "review", href: "/drill?track=ts", n: drillsOf("ts") },
      { mode: "learn", href: lessonOrExam("foundations", "ts-types"), labelZh: "够用就好", labelEn: "Just enough" },
      { mode: "learn", href: lessonOrExam("interview", "iv-ts-utility"), labelZh: "深度", labelEn: "In depth" },
    ],
  },
  {
    name: "GraphQL",
    actions: [
      { mode: "practice", href: "/code?track=graphql", n: codingOf("graphql") },
      { mode: "learn", href: examPath("graphql-federation") },
      { mode: "assess", href: "/arena/g-rebuild-subgraph" },
    ],
  },
  {
    name: "Spring Boot",
    actions: [
      { mode: "practice", href: "/code?track=java", n: codingOf("java") },
      { mode: "learn", href: lessonOrExam("graphql-federation", "g-spring-basics") },
      { mode: "assess", href: "/arena/g-rebuild-controller" },
    ],
  },
];

const ACTION_LABEL: Record<TopicAction["mode"], { zh: string; en: string }> = {
  review: { zh: "背知识点", en: "Review" },
  practice: { zh: "做练习", en: "Practice" },
  learn: { zh: "读课文", en: "Learn" },
  assess: { zh: "去考场", en: "Assess" },
};

export function Home() {
  const { data, ready, countLessons, countExercises, reset } = useProgress();
  const { locale } = useLocale();
  const { status: plan, optedOut } = useActivePlan();

  const doneLessons = ready ? NAV.reduce((n, e) => n + countLessons(e.id), 0) : 0;
  const doneExercises = ready ? NAV.reduce((n, e) => n + countExercises(e.id), 0) : 0;
  const markedDrills = ready ? Object.keys(data.drills).length : 0;
  const doneCoding = ready ? Object.keys(data.coding).length : 0;
  const arenaRuns = ready
    ? Object.values(data.arena).reduce((n, list) => n + list.length, 0)
    : 0;
  const started =
    doneLessons + doneExercises + markedDrills + doneCoding + arenaRuns > 0;

  return (
    <main className="main" data-rail="off">
      <div className="content dash">
        {/* ================================================================
            第一屏。三种情况互斥，任何时候只有一个 h1、只有一个主按钮。

            ① 正在跟某条计划   → 那条计划的当前位置和下一格
            ② 没跟计划         → 「你现在想达成什么目标？」+ 六条计划
            ③ 说过「先自己逛」 → 回到「接着上次那件事」，并留一条回计划的路
            ================================================================ */}
        {plan ? (
          <ActivePlanCard />
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
          <section className="dash-goal" aria-labelledby="dash-goal-h">
            <div className="dash-goal-eyebrow">
              <PlanMark />
              <T zh="引导计划" en="Guided plans" />
            </div>
            <h1 className="dash-goal-title serif" id="dash-goal-h">
              <T zh="你现在想达成什么目标？" en="What are you preparing for?" />
            </h1>
            <p className="dash-goal-lede">
              <T
                zh="挑一个目标，剩下的顺序交给它：读哪几节、背哪些方向、做哪些练习、写哪几道题、最后在空文件夹里做一遍。用的全是站里已有的内容。"
                en="Pick an outcome and the order comes with it: which lessons to read, which topics to revise, which exercises and problems to do, and finally the same thing in an empty folder. All of it is material that already exists here."
              />
            </p>
            <PlanCards />
            <ContinueStrip />
          </section>
        )}

        {/* ================================================================
            自由选择。四个模式一个都没删，只是退到第二位 ——
            「让我自己挑」和「告诉我下一步做什么」是两种都成立的用法。
            ================================================================ */}
        <section className="dash-sec">
          <h2 className="dash-sec-title">
            <T zh="自由选择练习方式" en="Explore freely" />
          </h2>
          <p className="dash-sec-lede">
            <T
              zh="已经知道自己要什么就直接进：四个模式任何时候都能点，进度和计划是同一份。"
              en="If you already know what you want, go straight in. All four modes are open at any time, and the progress behind them is the same as the plans."
            />
          </p>
          <ul className="dash-modes">
            {MODES.map((m) => (
              <li key={m.id}>
                <Link className="dash-mode" href={m.href}>
                  <span className="dash-mode-name">
                    <T zh={m.zh} en={m.en} />
                  </span>
                  <span className="dash-mode-blurb">
                    <T zh={m.blurbZh} en={m.blurbEn} />
                  </span>
                  <span className="dash-mode-n tabular">
                    <T zh={MODE_COUNT[m.id].zh} en={MODE_COUNT[m.id].en} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 有基础的人的旁路。不必选计划，也不必先选模式。
            视觉上比上面两节更轻 —— 它是一条捷径，不是主路。 */}
        <section className="dash-sec dash-sec-quiet">
          <h2 className="dash-sec-title">
            <T zh="已经有基础？直接按技术点进去" en="Already know the basics? Go straight to a topic" />
          </h2>
          <ul className="dash-topics">
            {TOPICS.map((t) => (
              <li key={t.name} className="dash-topic">
                <span className="dash-topic-name">{t.name}</span>
                <span className="dash-topic-acts">
                  {t.actions.map((a, i) => (
                    <Link key={i} className="dash-topic-act" href={a.href}>
                      <T
                        zh={a.labelZh ?? ACTION_LABEL[a.mode].zh}
                        en={a.labelEn ?? ACTION_LABEL[a.mode].en}
                      />
                      {a.n !== undefined && <span className="tabular"> {a.n}</span>}
                    </Link>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* 英文用户的边界说明。这条要写准，别含糊 ——
            **有英文**：界面、全部讲解段正文、105 道八股答案、模拟考讲解与环境说明。
            **只有中文**：讲解段的标题和副标、学完你会 / 考点 / 要点回顾、
            148 个练习的题面和提示、代码块里的注释、速查表。
            与其让人点进去才发现，不如在这里说清。
            zh 那一边留空 —— 中文用户不需要看到这句。 */}
        <T
          en={
            <p className="dash-langnote">
              <strong>A note on language.</strong> Fully in English: the interface,
              all 381 numbered explanation sections, all {DRILLS.length} drill answers,
              the mock walkthroughs and setup notes, and every code block, command,
              test output and sandbox problem statement.{" "}
              <strong>Still Chinese only:</strong> section headings and subtitles,
              the objectives / what-it-tests / recap lists, all {TOTAL_EXERCISES} exercise
              prompts and hints, the comments inside code blocks, and the reference
              tables. So in English you get English prose under Chinese headings, and
              the exercises stay Chinese.
            </p>
          }
          zh=""
        />

        {/* 进度：有进度才显示，没有就不占地方。
            一个大大的 0 / 80 对新用户是压力不是信息。 */}
        {started && (
          <section className="dash-sec">
            <h2 className="dash-sec-title">
              <T zh="你的进度" en="Your progress" />
            </h2>
            <div className="dash-prog">
              {/* 顺序和侧栏、路线图取同一个来源 —— NAV 是登记顺序，
                  会把平行支线排在 Cab Booking 前面，三处就又不一致了。 */}
              {pathGroups()
                .flatMap((g) => g.exams)
                .map((exam) => {
                  const done = countLessons(exam.id);
                  return (
                    <div className="progress-row" key={exam.id}>
                      <span>
                        <T zh={exam.shortTitle} en={exam.shortTitleEn} />
                      </span>
                      <span className="bar">
                        <i
                          style={{
                            width: `${(done / Math.max(1, exam.lessonCount)) * 100}%`,
                          }}
                        />
                      </span>
                      <span className="progress-num">
                        {done}/{exam.lessonCount}
                      </span>
                    </div>
                  );
                })}
            </div>
            <p className="dash-prog-line">
              <T
                zh={`八股自评 ${markedDrills} / ${DRILLS.length} · 练习做对 ${doneExercises} / ${TOTAL_EXERCISES} · coding 完成 ${doneCoding} / ${CODING.length} · 考场尝试 ${arenaRuns} 次`}
                en={`${markedDrills} / ${DRILLS.length} questions rated · ${doneExercises} / ${TOTAL_EXERCISES} exercises right · ${doneCoding} / ${CODING.length} coding problems done · ${arenaRuns} arena attempts`}
              />
            </p>
          </section>
        )}

        {/* 折叠区：查完就走的东西，加上进度本身怎么存的。
            「清空进度」放在这儿 —— 它是破坏性操作，不该常驻在侧栏里，
            但也不该藏到找不着，所以给它一个固定的家。 */}
        <details className="dash-more">
          <summary>
            <T
              zh="其他：速查表、模拟考自评、内容来源、进度怎么存的"
              en="More: reference, mock scoring, sources, how progress is stored"
            />
          </summary>
          <div className="dash-more-body">
            <ul>
              <li>
                <Link href="/reference">
                  <T zh="速查表" en="Reference" />
                </Link>{" "}
                <span className="dimmer">
                  <T zh="命令、API、状态码 —— 查完就走" en="Commands, APIs, status codes" />
                </span>
              </li>
              <li>
                <Link href="/mock">
                  <T zh="模拟考自评" en="Mock exam scoring" />
                </Link>{" "}
                <span className="dimmer">
                  <T
                    zh="题面在考场里，这一页是交卷后按 rubric 自评用的"
                    en="The papers live in the arena; this page is for scoring yourself"
                  />
                </span>
              </li>
              <li>
                <Link href="/guide">
                  <T zh="使用说明" en="How to use this" />
                </Link>{" "}
                <span className="dimmer">
                  <T
                    zh="按什么顺序走、每天怎么用、考前一周怎么冲"
                    en="What order to go in, day to day, and the week before an assessment"
                  />
                </span>
              </li>
              <li>
                <Link href="/path">
                  <T zh="课程路线图" en="Course roadmap" />
                </Link>{" "}
                <span className="dimmer">
                  <T
                    zh={`${TOTAL_LESSONS} 节 —— 题目背后的讲解，卡住了回来查`}
                    en={`${TOTAL_LESSONS} lessons — the explanation behind the problems`}
                  />
                </span>
              </li>
            </ul>
            <p className="dimmer" style={{ fontSize: 13.5 }}>
              <T
                zh="三门真题课读的是本机上的 react-notes-app、graphql-federation-practice 与 cab-booking-context，只读不改。标了「源项目」或「已跑通」的代码都在本机真实跑过。"
                en="The three assessment courses read three real projects on this machine, read-only. Every block marked “source” or “verified” was actually run here."
              />
            </p>
            <p className="dimmer" style={{ fontSize: 13.5 }}>
              <T
                zh="进度只存在这台浏览器里（localStorage），不上传、不需要登录、也不会同步到别的设备。"
                en="Progress lives only in this browser (localStorage). Nothing is uploaded, no sign-in, and it does not sync across devices."
              />
            </p>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => {
                const msg =
                  locale === "en"
                    ? "Clear all progress? Checked lessons, solved exercises, question ratings, rebuild and mock-exam records will be deleted. This cannot be undone."
                    : "清空全部学习进度？已勾选的课程、做对的练习、八股自评、从零重写与模拟考记录都会被删除，无法恢复。";
                if (window.confirm(msg)) reset();
              }}
            >
              <T zh="清空进度" en="Clear progress" />
            </button>
          </div>
        </details>
      </div>
    </main>
  );
}
