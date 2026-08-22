"use client";

// 模拟考列表页（客户端：要读进度）。
// 详情页在 mock-detail.tsx —— 那是服务端组件，因为它要 import 全文内容。

import Link from "next/link";
import { NAV } from "@/content/nav";
import { useProgress } from "@/lib/progress";
import { T } from "./t";

/* ---------- 列表页 ---------- */

export function MockList() {
  const { mockRecord, ready } = useProgress();
  const all = NAV.flatMap((exam) => exam.mockExams.map((mock) => ({ exam, mock })));

  return (
    <main className="main" data-rail="off">
      <div className="content">
        <div className="page-head">
          <div className="eyebrow">
            <T en="Mock exams" zh="模拟考" />
          </div>
          <h1 className="page-title">
            <T en="Do it once with no answer in front of you" zh="在没有答案的情况下做一遍" />
          </h1>
          <p className="page-lede">
            <T
              en="Each mock swaps the business scenario but keeps a one-to-one match with what the real assessment tests. It is the most direct way to find out whether you understood it or memorised it."
              zh="每套模拟考都换了业务场景，但考点和真实 assessment 一一对应。这是检验「你是理解了还是背下来了」最直接的办法。"
            />
          </p>
        </div>

        <div className="callout" data-tone="warn">
          <strong className="callout-title">
            <T en="DrillLab wrote these papers" zh="这些题是 DrillLab 自己出的" />
          </strong>
          <p>
            <T
              en={
                <>
                  They are <strong>not</strong> from the source projects and not
                  real exam questions. Their job is to test the same things in a
                  different scenario.
                  <br />
                  Both reference answers really were run here and passed their own
                  tests: 5/5 for React, 14/14 for Federation. From the starter,
                  the measured baselines are 5 failed / 5 total and 10 failed /
                  4 passed.
                </>
              }
              zh={
                <>
                  它们<strong>不是</strong>源项目里的内容，也不是任何真实考题。
                  它们的作用是「换一个场景考同样的东西」。
                  <br />
                  两套模拟题的参考答案都在本机跑通过自己的测试：
                  React 那套 5/5，Federation 那套 14/14。
                  starter 状态下的基线实测是 5 failed / 5 total 和 10 failed / 4 passed。
                </>
              }
            />
          </p>
        </div>

        <div className="minihead">
          <T en="How to use them" zh="怎么用" />
        </div>
        <div className="prose">
          <ol>
            <T
              en={
                <>
                  <li>
                    <strong>Read every requirement and the rubric first</strong>,
                    before you look at the starter.
                  </li>
                  <li>
                    <strong>Make a fresh directory on your machine</strong> and
                    copy the starter and the tests into it.
                  </li>
                  <li>
                    <strong>Work to the suggested time limit</strong>. Do not open
                    the walkthrough on the way.
                  </li>
                  <li>
                    <strong>Run the tests and do the manual checks</strong>, then
                    score yourself against the rubric.
                  </li>
                  <li>
                    <strong>Only then open the walkthrough and the answer</strong>{" "}
                    and see what you missed.
                  </li>
                </>
              }
              zh={
                <>
                  <li>
                    <strong>读完全部需求和评分标准</strong>，别急着看 starter。
                  </li>
                  <li>
                    <strong>在本机新建一个目录</strong>，把 starter 和测试抄进去。
                  </li>
                  <li>
                    <strong>按建议时长计时做完</strong>。中途不要打开讲解。
                  </li>
                  <li>
                    <strong>跑测试 + 做手动自检</strong>，按 rubric 给自己打分。
                  </li>
                  <li>
                    <strong>最后才打开讲解和参考答案</strong>，对照你漏掉了什么。
                  </li>
                </>
              }
            />
          </ol>
        </div>

        <div className="minihead">
          <T en="The two papers" zh="两套模拟考" />
        </div>
        {all.map(({ exam, mock }) => {
          const rec = ready ? mockRecord(exam.id, mock.id) : undefined;
          const total = mock.outOf;
          return (
            <div className="exam-row" key={`${exam.id}-${mock.id}`}>
              <span className="exam-idx">M</span>
              <div>
                <Link className="exam-name" href={`/mock/${exam.id}/${mock.id}`}>
                  {mock.title}
                </Link>
                <p className="exam-desc">{mock.scenario}</p>
                <div className="exam-tags">
                  <span className="tag" data-tone="accent">
                    <T
                      en={`Mirrors ${exam.shortTitle}`}
                      zh={`对应 ${exam.shortTitle}`}
                    />
                  </span>
                  <span className="tag" data-tone="warn">
                    <T en="Written by DrillLab" zh="DrillLab 自出" />
                  </span>
                  <span className="tag">
                    <T en={`~${mock.minutes} min`} zh={`建议 ${mock.minutes} 分钟`} />
                  </span>
                  <span className="tag">
                    <T
                      en={`${mock.taskCount} tasks`}
                      zh={`${mock.taskCount} 个任务`}
                    />
                  </span>
                  <span className="tag">
                    <T en={`${total} points total`} zh={`满分 ${total}`} />
                  </span>
                </div>
              </div>
              <div className="exam-side">
                {rec ? (
                  <>
                    <span className="tag" data-tone="ok">
                      <T en="Attempted" zh="做过" />
                    </span>
                    {rec.score !== undefined && (
                      <>
                        <br />
                        <span className="num">
                          {rec.score} / {rec.outOf}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <T en="Not started" zh="未开始" />
                )}
              </div>
            </div>
          );
        })}

        {all.length === 0 && (
          <p className="empty">
            <T en="No mock exams yet." zh="还没有模拟考。" />
          </p>
        )}
      </div>
    </main>
  );
}
