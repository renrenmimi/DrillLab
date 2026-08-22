// 模拟考详情页 —— 服务端组件。
//
// 为什么是服务端：它要 import 完整的模拟考内容（starter、测试、讲解、答案，
// 里面全是 JSX）。如果这个组件是 "use client"，那些内容会被打进客户端包。
// 放服务端之后，内容只以渲染结果的形式出现在这一页的 payload 里，不进 JS。
//
// 需要交互的三处用客户端小岛：SolutionGate（两道答案门）、MockScore（自评分）。

import Link from "next/link";
import { notFound } from "next/navigation";
import { examById } from "@/content/registry";
import { examPath } from "@/content/nav";
import { CodeBlock } from "./code";
import { SolutionGate } from "./hint-panel";
import { L, T } from "./t";
import { AnswerTabs, BilingualList, Section } from "./lesson-kit";
import { LocalSetup } from "./local-setup";
import { MockScore } from "./mock-score";
import { NoteRecent } from "./recent";

export function MockDetail({ examId, mockId }: { examId: string; mockId: string }) {
  const exam = examById(examId);
  const mock = exam?.mockExams.find((m) => m.id === mockId);
  if (!exam || !mock) notFound();

  const outOf = mock.tasks.reduce(
    (n, t) => n + t.rubric.reduce((m, r) => m + r.points, 0),
    0,
  );

  return (
    <main className="main">
      <NoteRecent
        mode="assess"
        href={`/mock/${exam.id}/${mock.id}`}
        title={mock.title}
        titleEn={mock.titleEn}
        sub="模拟考 · 自评"
        subEn="Mock exam · self-scoring"
      />
      <div className="content">
        <nav className="crumb">
          <Link href="/mock">
            <T en="Mock exams" zh="模拟考" />
          </Link>
          <span className="crumb-sep">/</span>
          <Link href={examPath(exam.id)}>{exam.shortTitle}</Link>
        </nav>

        <div className="page-head">
          <h1 className="page-title serif">
            <T zh={mock.title} en={mock.titleEn} />
          </h1>
          <p className="page-lede">
            <T zh={mock.scenario} en={mock.scenarioEn} />
          </p>
          <div className="lesson-meta" style={{ marginTop: 14 }}>
            <span className="tag" data-tone="warn">
              <T en="Written by DrillLab" zh="DrillLab 自出" />
            </span>
            <span className="tag">
              <T en={`~${mock.minutes} min`} zh={`建议 ${mock.minutes} 分钟`} />
            </span>
            <span className="tag">
              <T
                en={`${mock.tasks.length} tasks`}
                zh={`${mock.tasks.length} 个任务`}
              />
            </span>
            <span className="tag">
              <T en={`${outOf} points total`} zh={`满分 ${outOf}`} />
            </span>
          </div>
        </div>

        <div className="workspace">
          <div className="ws-brief">
            <div className="ws-brief-head">
              <T en="What this paper tests" zh="这套题在考什么" />
            </div>
            <p style={{ fontSize: 15.5, color: "var(--ink-2)", margin: 0 }}><T zh={mock.mirrors} en={mock.mirrorsEn} /></p>
          </div>

          <div className="minihead">
            <T en="Tasks and rubric" zh="任务与评分标准" />
          </div>
          {mock.tasks.map((task, i) => {
            const pts = task.rubric.reduce((n, r) => n + r.points, 0);
            return (
              <div className="ws-task" key={task.id}>
                <div className="ws-task-head">
                  <span className="ws-task-n">TASK {i + 1}</span>
                  <span className="ws-task-title">
                    <T zh={task.title} en={task.titleEn} />
                  </span>
                  <span className="tag" style={{ marginLeft: "auto" }}>
                    <T en={`${pts} pts`} zh={`${pts} 分`} />
                  </span>
                </div>
                <ul className="ws-req">
                  <BilingualList zh={task.requirement} en={task.requirementEn} />
                </ul>
                <div className="rubric">
                  {task.rubric.map((r, j) => (
                    <div className="rubric-row" key={j}>
                      <span className="rubric-pt">
                        <T en={`${r.points} pts`} zh={`${r.points} 分`} />
                      </span>
                      <span>
                        <T zh={r.label} en={r.labelEn} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* 怎么在本机跑起来。
              这一块排在 starter 前面 —— 先把环境搭好，再看代码。
              为什么这一页没有运行按钮，LocalSetup 自己会讲。 */}
          <LocalSetup
            baseline={mock.setup.baseline}
            bootstrap={mock.setup.bootstrap}
            commands={mock.commands}
            deps={mock.setup.deps}
            files={mock.setup.files}
            stackblitz={examId === "graphql-federation" ? "node" : "react"}
            target={mock.setup.target}
          />

          <div className="minihead">
            <T en="Starter code" zh="Starter 代码" />
          </div>
          {mock.starter.map((s, i) => (
            <CodeBlock key={i} ex={s} />
          ))}

          {mock.tests && mock.tests.length > 0 && (
            <>
              <div className="minihead">
                <T en="Tests — your own grader" zh="测试（你的判卷器）" />
              </div>
              {mock.tests.map((t, i) => (
                <CodeBlock key={i} ex={t} />
              ))}
            </>
          )}

          <MockScore examId={exam.id} mockId={mock.id} outOf={outOf} />

          {/* 讲解与答案：必须显式打开 */}
          <div style={{ marginTop: 34 }}>
            <SolutionGate
              note={L(
                "讲解里会直接说出每一处陷阱在哪。请确认你已经在本机把这套题做完、跑过测试、按 rubric 自评过，再打开。",
                "The walkthrough names every trap outright. Only open it once you have finished the paper locally, run the tests, and scored yourself against the rubric.",
              )}
              label={L("我做完了，打开讲解", "I am done — open the walkthrough")}
            >
              <div className="minihead">
                <T en="Walkthrough" zh="讲解" />
              </div>
              {mock.walkthrough.map((c, i) => (
                <Section
                  key={c.id}
                  id={c.id}
                  n={String(i + 1).padStart(2, "0")}
                  title={c.heading}
                  lede={c.lede}
                >
                  {c.bodyEn ? (
                    <AnswerTabs en={c.bodyEn} id={`mk-${c.id}`} zh={c.body} />
                  ) : (
                    c.body
                  )}
                  {c.code?.map((ex, j) => (
                    <CodeBlock key={j} ex={ex} />
                  ))}
                </Section>
              ))}

              <div style={{ marginTop: 24 }}>
                <SolutionGate
                  note={L(
                    "最后一道门：参考答案。看之前请确认你自己的实现已经跑过测试 —— 哪怕没全过，自己的版本也比直接读答案有价值。",
                    "The last gate: the reference answer. Run your own implementation against the tests first — even a partly failing version of your own is worth more than reading this.",
                  )}
                  label={L("打开参考答案", "Open the reference answer")}
                >
                  <div className="minihead">
                    <T en="Reference answer" zh="参考答案" />
                  </div>
                  {mock.solution.map((s, i) => (
                    <CodeBlock key={i} ex={s} />
                  ))}
                </SolutionGate>
              </div>
            </SolutionGate>
          </div>
        </div>
      </div>

      <aside className="rail">
        <div className="rail-block">
          <div className="rail-head">
            <T en="Tasks" zh="任务" />
          </div>
          <ul className="rail-toc">
            {mock.tasks.map((t, i) => (
              <li key={t.id}>
                <span
                  style={{ display: "block", padding: "3px 0 3px 11px", color: "var(--ink-2)" }}
                >
                  {i + 1}. <T zh={t.title} en={t.titleEn} />
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rail-block">
          <div className="rail-head">
            <T en="The real exam it mirrors" zh="对应的真实考试" />
          </div>
          <Link href={examPath(exam.id)}>
            <T zh={exam.title} en={exam.titleEn} />
          </Link>
          <p className="dimmer" style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.6 }}>
            <T
              en="Stuck? Go back to the matching lesson — every point this paper tests is covered in that course."
              zh="卡住了就回去看对应那一节 —— 这套题的每个考点都在那门课里讲过。"
            />
          </p>
        </div>
      </aside>
    </main>
  );
}
