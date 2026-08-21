"use client";

// 一门考试的首页：考什么 → 源项目在哪 → 任务覆盖清单 → 模块与课程 → 模拟考。
// 所有考试共用这一个版式，新增考试不用写页面。

import Link from "next/link";
import { navExam, lessonPath, mockPath } from "@/content/nav";
import { useProgress } from "@/lib/progress";
import { T } from "./t";
import { FileExplorer } from "./lesson-kit";

export function ExamOverview({ examId }: { examId: string }) {
  const exam = navExam(examId);
  const { lessonDone, countLessons, countExercises, rebuildDone, mockRecord, ready } =
    useProgress();

  if (!exam) {
    return (
      <main className="main" data-rail="off">
        <div className="content">
          <p className="empty">
            <T en="No such course." zh="没有这门考试。" />
          </p>
        </div>
      </main>
    );
  }

  const doneLessons = ready ? countLessons(exam.id) : 0;
  const firstLesson = exam.modules[0]?.lessons[0];

  // 逐个数，别用 some() —— 一门考试可能有多个从零重写，做完一个不等于全做完
  const doneRebuilds = ready
    ? exam.rebuildIds.filter((id) => rebuildDone(exam.id, id)).length
    : 0;
  const doneMocks = ready
    ? exam.mockExams.filter((m) => mockRecord(exam.id, m.id)).length
    : 0;

  return (
    <main className="main">
      <div className="content">
        <div className="page-head">
          <div className="eyebrow">
            {exam.category} · <T en="Course" zh="考试" />
          </div>
          <h1 className="page-title serif">{exam.title}</h1>
          <p className="page-lede">{exam.description}</p>
          <div className="lesson-meta" style={{ marginTop: 16 }}>
            {exam.stack.map((s) => (
              <span key={s} className="tag">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="obj-block" style={{ marginBottom: 30, maxWidth: "var(--measure)" }}>
          <div className="obj-head">
              <T en="What this exam actually tests" zh="这门考试到底考什么" />
            </div>
          <p>{exam.tests}</p>
        </div>

        {exam.sourceProjects.length > 0 && (
          <>
            <div className="minihead">
                <T
                  en="Where the content comes from · the real project on your machine"
                  zh="内容来源 · 你本机上的真实项目"
                />
              </div>
            {/* showContent：项目根路径在快照里是一棵目录树（只有文件名，
                没有内容），所以这里展开看到的是「这个项目长什么样」，
                不是任何一道题的答案。 */}
            <FileExplorer
              showContent
              title="源项目 / Source project"
              files={exam.sourceProjects.map((p) => ({ path: p.path, role: p.role }))}
            />
          </>
        )}

        {exam.prerequisites.length > 0 && (
          <div className="callout" data-tone="note">
            <strong className="callout-title">
                <T en="Prerequisite" zh="先修" />
              </strong>
            <p>
              <T en="Work through" zh="建议先过一遍" />{" "}
              {exam.prerequisites.map((id, i) => {
                const pre = navExam(id);
                return pre ? (
                  <span key={id}>
                    {i > 0 && "、"}
                    <Link href={`/exams/${pre.id}`}>{pre.shortTitle}</Link>
                  </span>
                ) : null;
              })}
              <T
                en=" first. If you already know npm and can read a package.json, start here directly."
                zh="。如果你已经会 npm、会读 package.json，可以直接开始这一门。"
              />
            </p>
          </div>
        )}

        {exam.checklist && exam.checklist.length > 0 && (
          <>
            <div className="minihead">
                <T en="Coverage of the real tasks" zh="真实任务覆盖清单" />
              </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>
                      <T en="Task in the real project" zh="真实项目里的任务" />
                    </th>
                    <th>
                      <T en="Where DrillLab covers it" zh="DrillLab 讲到哪" />
                    </th>
                    <th>
                      <T en="Tested" zh="有测试" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {exam.checklist.map((c) => (
                    <tr key={c.task}>
                      <td>{c.task}</td>
                      <td>{c.covered}</td>
                      <td>
                        {c.tested ? (
                          <span className="tag" data-tone="ok">
                            <T en="Yes" zh="有" />
                          </span>
                        ) : (
                          <span className="tag" data-tone="warn">
                            <T en="No" zh="无" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="minihead">
          <T en="Lessons" zh="课程" />
        </div>
        {exam.modules.map((mod, mi) => (
          <div className="stage" key={mod.id}>
            <div className="stage-label">
              {mod.stage ?? `模块 ${mi + 1} / Module ${mi + 1}`}
              <div className="stage-exam">
                <T
                  en={`${mod.lessons.length} lessons`}
                  zh={`${mod.lessons.length} 节`}
                />
              </div>
            </div>
            <div>
              <div className="stage-title">{mod.title}</div>
              <p className="stage-summary">{mod.summary}</p>
              <div className="stage-lessons">
                {mod.lessons.map((l) => (
                  <Link
                    key={l.id}
                    className="chip"
                    href={lessonPath(exam.id, l.id)}
                    data-done={ready && lessonDone(exam.id, l.id) ? "true" : undefined}
                  >
                    {l.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}

        {exam.mockExams.length > 0 && (
          <>
            <div className="minihead" style={{ marginTop: 34 }}>
              <T
                en="Mock exams · different scenario, same skills"
                zh="模拟考 · 换了场景，考点一致"
              />
            </div>
            {exam.mockExams.map((m) => {
              const rec = ready ? mockRecord(exam.id, m.id) : undefined;
              return (
                <div className="exam-row" key={m.id}>
                  <span className="exam-idx">M</span>
                  <div>
                    <Link className="exam-name" href={mockPath(exam.id, m.id)}>
                      {m.title}
                    </Link>
                    <p className="exam-desc">{m.scenario}</p>
                    <div className="exam-tags">
                      <span className="tag" data-tone="warn">
                        <T en="Written by DrillLab" zh="DrillLab 自出" />
                      </span>
                      <span className="tag">
                        <T en={`~${m.minutes} min`} zh={`建议 ${m.minutes} 分钟`} />
                      </span>
                      <span className="tag">
                        <T en={`${m.taskCount} tasks`} zh={`${m.taskCount} 个任务`} />
                      </span>
                    </div>
                  </div>
                  <div className="exam-side">
                    {rec ? (
                      <span className="tag" data-tone="ok">
                        <T en="Attempted" zh="做过" />
                      </span>
                    ) : (
                      <T en="Not started" zh="未开始" />
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <aside className="rail">
        <div className="rail-block">
          <div className="rail-head">
            <T en="Your progress" zh="你的进度" />
          </div>
          <div className="progress-row">
            <span>
              <T en="Lessons" zh="课程" />
            </span>
            <span className="bar">
              <i style={{ width: `${(doneLessons / Math.max(1, exam.lessonCount)) * 100}%` }} />
            </span>
            <span className="progress-num">
              {doneLessons}/{exam.lessonCount}
            </span>
          </div>
          <div className="progress-row">
            <span>
              <T en="Exercises" zh="练习" />
            </span>
            <span className="bar">
              <i
                style={{
                  width: `${((ready ? countExercises(exam.id) : 0) / Math.max(1, exam.exerciseCount)) * 100}%`,
                }}
              />
            </span>
            <span className="progress-num">
              {ready ? countExercises(exam.id) : 0}/{exam.exerciseCount}
            </span>
          </div>
          {exam.rebuilds > 0 && (
            <div className="progress-row">
              <span>
                <T en="Rebuilds" zh="从零重写" />
              </span>
              <span className="bar">
                <i style={{ width: `${(doneRebuilds / exam.rebuilds) * 100}%` }} />
              </span>
              <span className="progress-num">
                {doneRebuilds}/{exam.rebuilds}
              </span>
            </div>
          )}
          {exam.mockExams.length > 0 && (
            <div className="progress-row">
              <span>
                <T en="Mocks" zh="模拟考" />
              </span>
              <span className="bar">
                <i
                  style={{
                    width: `${(doneMocks / exam.mockExams.length) * 100}%`,
                  }}
                />
              </span>
              <span className="progress-num">
                {doneMocks}/{exam.mockExams.length}
              </span>
            </div>
          )}
        </div>

        <div className="rail-block">
          <div className="rail-head">
            <T en="What is in this course" zh="这门考试有什么" />
          </div>
          <div style={{ color: "var(--ink-2)", lineHeight: 1.8 }}>
            <T
              en={`${exam.modules.length} modules · ${exam.lessonCount} lessons`}
              zh={`${exam.modules.length} 个模块 · ${exam.lessonCount} 节课`}
            />
            <br />
            <T en={`${exam.exerciseCount} exercises`} zh={`${exam.exerciseCount} 个练习`} />
            <br />
            <T en={`${exam.debugLabs} debug labs`} zh={`${exam.debugLabs} 个 Debug Lab`} />
            <br />
            <T en={`${exam.rebuilds} rebuilds`} zh={`${exam.rebuilds} 个从零重写`} />
            <br />
            <T en={`${exam.mockExams.length} mock exams`} zh={`${exam.mockExams.length} 套模拟考`} />
            <br />
            <span className="dimmer">
              <T en={`~${exam.minutes} min of reading`} zh={`合计约 ${exam.minutes} 分钟阅读`} />
            </span>
          </div>
        </div>

        {firstLesson && (
          <div className="rail-block">
            <Link className="btn btn-primary" href={lessonPath(exam.id, firstLesson.id)}>
              <T en="Start from lesson one" zh="从第一节开始" /> →
            </Link>
          </div>
        )}
      </aside>
    </main>
  );
}
