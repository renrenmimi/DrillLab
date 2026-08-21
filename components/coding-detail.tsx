// 一道 coding 题的详情页 —— 服务端组件。
//
// 一页四段，不跳来跳去：
//   §01 题面      默认只有这一段
//   §02 工作区    沙箱（或「本机跑」卡片）
//   §03 展开讲解  折叠，展开后是 explainLessonId 那一节的原文
//   §04 参考答案  四级提示 → 答案门
//
// §02 之后的开合归 CodingWorkspace（客户端）管，但 §03 / §04 的正文
// 仍然在这里服务端渲染，然后当 props 传进去 —— 内容一个字节都不进客户端包。

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  allCodingProblems,
  allExercises,
  codingProblemById,
  EXAMS,
  lessonPath,
} from "@/content/registry";
import { CODING_TRACK_LABEL, DIFFICULTY_LABEL } from "@/content/coding";
import type { CodeExample, CodingProblem, Lesson } from "@/content/types";
import { CodeBlock } from "./code";
import { CodingWorkspace } from "./coding-workspace";
import { HintPanel, SolutionGate } from "./hint-panel";
import { AnswerTabs, Section, BilingualList } from "./lesson-kit";
import { L, T, type LocalizedString } from "./t";

/* ---------- 从现有内容里找东西，不复制 ---------- */

function lessonById(lessonId: string): { lesson: Lesson; examId: string } | undefined {
  for (const exam of EXAMS) {
    for (const mod of exam.modules) {
      for (const lesson of mod.lessons) {
        if (lesson.id === lessonId) return { lesson, examId: exam.id };
      }
    }
  }
  return undefined;
}

/**
 * 四级提示从来源练习里取。
 *
 * coding.ts 里的 solution 是**引用**原练习的 CodeExample 对象（没有复制），
 * 所以用引用相等就能反查回那道练习 —— 不需要在 CodingProblem 上再存一个 from 字段。
 * 有几道题的答案是从课文代码块里挑的（Tabs / 播放器 / Dropdown / RTK），
 * 那几道找不到练习，就不显示提示。宁可没有，也不现编。
 */
function hintsFor(problem: CodingProblem): string[] {
  const first = problem.solution[0];
  if (!first) return [];

  for (const ref of allExercises()) {
    const ex = ref.exercise;
    if (ex.kind === "code-completion" && ex.solution === first) return ex.hints;
    if (ex.kind === "from-scratch" && ex.solution.includes(first)) return ex.hints;
  }
  return [];
}

// 为什么这道题没有浏览器沙箱。逐题写 —— 「跑不了」和「为什么跑不了」是两件事。
const LOCAL_WHY: Record<string, LocalizedString> = {
  "orders-subgraph": L(
    "这道题要真起一个 Apollo subgraph 服务，跑 npm test 里的十个断言，还要用 _service / _entities 两个联邦入口验证。浏览器沙箱起不了服务端进程 —— 所以这里只给命令和期望输出。",
    "This one needs a real Apollo subgraph process, the ten assertions in npm test, and verification through the _service and _entities federation entry points. A browser sandbox cannot start a server process, so you get the commands and the expected output instead.",
  ),
  "spring-endpoints": L(
    "这道题要 JVM 和 Maven。浏览器里没有 JVM，装不出来也不该装 —— 所以这里只给命令和期望输出。",
    "This one needs a JVM and Maven. There is no JVM in a browser and there should not be, so you get the commands and the expected output instead.",
  ),
  // fetch-user 和 player 的原因不一样：不是跑不了服务端，是测试文件里的猴子补丁
  // 拦不到 fetch 和媒体元素原型（实测，见 content/coding.ts 的坑五）。
  "fetch-user": L(
    "这道题要 stub fetch 才能测竞态，而 Sandpack 的测试环境拦不住 fetch（globalThis / window / self 都试过）。测试本身是对的 —— 在本机 vitest 下 9/9 通过。所以这里只给命令。",
    "Testing the race condition needs a stubbed fetch, and Sandpack's test environment cannot intercept fetch (globalThis, window and self were all tried). The tests themselves are fine — 9/9 under vitest locally. So you get the commands instead.",
  ),
  player: L(
    "这道题要 stub HTMLMediaElement 的 play / currentTime，而 Sandpack 的测试环境拦不住媒体元素原型。测试本身是对的 —— 在本机 vitest 下 7/7 通过。所以这里只给命令。",
    "Testing this needs stubs on HTMLMediaElement's play and currentTime, and Sandpack's test environment cannot intercept the media element prototype. The tests themselves are fine — 7/7 under vitest locally. So you get the commands instead.",
  ),
};

/* ---------- 页面 ---------- */

export function CodingDetail({ id }: { id: string }) {
  const problem = codingProblemById(id);
  if (!problem) notFound();

  const all = allCodingProblems();
  const index = all.findIndex((p) => p.id === problem.id);
  const prev = all[index - 1];
  const next = all[index + 1];

  const explain = problem.explainLessonId ? lessonById(problem.explainLessonId) : undefined;
  const hints = hintsFor(problem);
  const inBrowser = problem.runnable && !!problem.sandbox;

  return (
    <main className="main">
      <div className="content">
        <nav aria-label="面包屑 / Breadcrumb" className="crumb">
          <Link href="/code">
            <T zh="Coding 题" en="Coding" />
          </Link>
          <span className="crumb-sep" aria-hidden>
            /
          </span>
          <span>{CODING_TRACK_LABEL[problem.track]}</span>
        </nav>

        <div className="page-head">
          <h1 className="page-title serif">
            <T zh={problem.title} en={problem.titleEn} />
          </h1>
          <div className="lesson-meta" style={{ marginTop: 14 }}>
            <span className="tag">{CODING_TRACK_LABEL[problem.track]}</span>
            <span className="tag" data-tone={problem.difficulty === 3 ? "warn" : undefined}>
              {DIFFICULTY_LABEL[problem.difficulty].zh} · {DIFFICULTY_LABEL[problem.difficulty].en}
            </span>
            <span className="tag">
              <T en={`~${problem.minutes} min`} zh={`约 ${problem.minutes} 分钟`} />
            </span>
            <span className="tag" data-tone={inBrowser ? "accent" : undefined}>
              {inBrowser ? (
                <T en="Runs in the browser" zh="浏览器里能跑" />
              ) : (
                <T en="Run it locally" zh="本机跑" />
              )}
            </span>
          </div>
        </div>

        {/* ---------- §01 题面 ---------- */}
        <Section
          id="brief"
          lede={
            <T
              zh="先把要求读完，再动手。"
              en="Read every requirement before you start."
            />
          }
          n="01"
          title={<T zh="题面" en="The problem" />}
        >
          <div className="cd-brief">{problem.brief}</div>

          <div className="minihead">
            <T zh="验收标准" en="Acceptance criteria" />
          </div>
          <ul className="ws-req">
            <BilingualList
              zh={problem.requirements}
              en={problem.requirementsEn}
            />
          </ul>

          <p className="dimmer" style={{ fontSize: 13.5 }}>
            <T
              zh={`预计 ${problem.minutes} 分钟。这个数字是照「读完题就开始写、不查资料」估的 —— 第一次超时很正常，第二次要压进去。`}
              en={`Budget ${problem.minutes} minutes. Overrunning on the first pass is normal; the second pass should fit.`}
            />
          </p>
        </Section>

        {/* ---------- §02 工作区 + §03 讲解 + §04 答案 ---------- */}
        <CodingWorkspace
          commands={problem.commands}
          explain={
            explain ? (
              <section className="sec" id="explain">
                <div className="sec-head">
                  <span className="sec-n">§03</span>
                  <h2 className="sec-title">
                    <T zh="展开讲解" en="Walkthrough" />
                  </h2>
                </div>
                <p className="sec-lede">
                  <T
                    en={`Below is the actual text of the lesson “${explain.lesson.title}” — the same content as in the course, not a rewritten summary. Expand it when you stall.`}
                    zh={`下面是《${explain.lesson.title}》那一节的原文 —— 和课程里是同一份内容，不是另写的摘要。卡住了再展开。`}
                  />
                </p>

                <details className="cd-fold">
                  <summary>
                    <T
                      en={`Expand “${explain.lesson.title}” (${explain.lesson.concepts.length} sections · ~${explain.lesson.minutes} min)`}
                      zh={`展开《${explain.lesson.title}》（${explain.lesson.concepts.length} 段 · 约 ${explain.lesson.minutes} 分钟）`}
                    />
                  </summary>

                  <div className="cd-fold-body">
                    <p className="dimmer" style={{ fontSize: 13.5 }}>
                      <T
                        en="The full lesson (with exercises, common mistakes and transfer patterns) is at"
                        zh="完整那一节（含练习、常见错误、迁移模式）在"
                      />{" "}
                      <Link href={lessonPath(explain.examId, explain.lesson.id)}>
                        {explain.lesson.title}
                      </Link>
                      。
                    </p>

                    {explain.lesson.concepts.map((c, i) => (
                      <Section
                        id={`explain-${c.id}`}
                        key={c.id}
                        lede={c.lede}
                        n={String(i + 1).padStart(2, "0")}
                        title={c.heading}
                      >
                        {c.bodyEn ? (
                          <AnswerTabs en={c.bodyEn} id={`cd-${c.id}`} zh={c.body} />
                        ) : (
                          c.body
                        )}
                        {c.code?.map((ex, j) => (
                          <CodeBlock ex={ex} key={j} />
                        ))}
                      </Section>
                    ))}
                  </div>
                </details>
              </section>
            ) : undefined
          }
          id={problem.id}
          localWhy={
            LOCAL_WHY[problem.id] ??
            L(
              "这道题在浏览器里跑不了，照下面的命令在本机验收。",
              "This one does not run in the browser — use the commands below on your own machine.",
            )
          }
          solution={
            <section className="sec" id="solution">
              <div className="sec-head">
                <span className="sec-n">§04</span>
                <h2 className="sec-title">
                  <T zh="参考答案" en="Reference solution" />
                </h2>
              </div>

              {hints.length > 0 ? (
                <>
                  <p className="sec-lede">
                    提示是一级一级放的。四级看完还写不出来，再开答案门。
                  </p>
                  <HintPanel hints={hints} />
                </>
              ) : (
                <p className="sec-lede">
                  这道题没有配套的分级提示 —— 卡住了先看上面的讲解那一节。
                </p>
              )}

              <div style={{ marginTop: 26 }}>
                <SolutionGate
                  label={L("我写过了，给我看参考答案", "I wrote it — show me the reference answer")}
                  note={L(
                    "这份答案在本机真跑过测试。但先确认你自己动手写过一遍 —— 读懂答案和写出答案是两种能力，考场上考的是后一种。",
                    "This answer really was run here and its tests passed. But write it yourself first — reading an answer and producing one are two different skills, and the exam tests the second.",
                  )}
                >
                  {problem.solution.map((s: CodeExample, i: number) => (
                    <CodeBlock ex={s} key={i} />
                  ))}
                </SolutionGate>
              </div>
            </section>
          }
          spec={problem.sandbox}
          title={problem.title}
          titleEn={problem.titleEn}
        />

        <nav className="lesson-foot" aria-label="上一道 / 下一道">
          {prev ? (
            <Link className="foot-link" data-dir="prev" href={`/code/${prev.id}`}>
              <span className="foot-dir">← 上一道</span>
              <span className="foot-title">{prev.title}</span>
            </Link>
          ) : (
            <div className="foot-spacer" />
          )}
          {next ? (
            <Link className="foot-link" data-dir="next" href={`/code/${next.id}`}>
              <span className="foot-dir">下一道 →</span>
              <span className="foot-title">{next.title}</span>
            </Link>
          ) : (
            <div className="foot-spacer" />
          )}
        </nav>
      </div>

      <aside className="rail">
        <div className="rail-block">
          <div className="rail-head">
            <T zh="这一页的顺序" en="Page order" />
          </div>
          <ul className="rail-toc">
            <li>
              <a href="#brief">01 题面</a>
            </li>
            <li>
              <a href="#workspace">02 工作区</a>
            </li>
            {explain && (
              <li>
                <a href="#explain">03 展开讲解</a>
              </li>
            )}
            <li>
              <a href="#solution">04 参考答案</a>
            </li>
          </ul>
        </div>

        {explain && (
          <div className="rail-block">
            <div className="rail-head">
              <T zh="出处" en="Comes from" />
            </div>
            <Link href={lessonPath(explain.examId, explain.lesson.id)}>
              {explain.lesson.title}
            </Link>
            <p className="dimmer" style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.6 }}>
              题面、需求、答案全部引用那一节，没有第二份。
            </p>
          </div>
        )}

        {problem.commands && problem.commands.length > 0 && (
          <div className="rail-block">
            <div className="rail-head">
              <T zh="本机验收命令" en="Local commands" />
            </div>
            <div className="mono dimmer" style={{ fontSize: 11.5, lineHeight: 1.7 }}>
              {problem.commands.map((c) => (
                <div key={c.cmd} style={{ marginBottom: 4, wordBreak: "break-all" }}>
                  {c.cmd}
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </main>
  );
}
