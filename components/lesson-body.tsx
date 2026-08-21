// 一节课的完整渲染 —— 服务端组件。
//
// 所有课都走这一条路径，所以教学节奏是统一的：
//   课头 → 学完你会 / 考什么 → 涉及的真实文件 → 编号讲解段（含真实代码）
//   → 提示框 → 练习 → 常见错误 → 迁移模式 → 要点 → 学完打勾 → 上下节
//
// 【为什么是服务端组件】课程内容里带 JSX。以前这个文件是 "use client"，
// 结果 42 节课的全文全被打进客户端包（实测单个 chunk 784 KB，每页都下载）。
// 现在正文在服务端渲染，只有真正需要交互的部分是客户端小岛：
//   LessonVisit / LessonDoneBar / LessonToc（本文件下方引用）
//   CodeBlock / ExerciseView / DataFlowDiagram（各自文件里标了 "use client"）

import Link from "next/link";
import { examPath, findLesson, lessonPath, prevNextLesson } from "@/content/registry";
import { stageEn } from "@/content/path";
import { CodeBlock } from "./code";
import { ExerciseView } from "./exercise";
import { LessonDoneBar, LessonToc, LessonVisit } from "./lesson-islands";
import {
  AnswerTabs,
  Callout,
  FileExplorer,
  LearningObjective,
  LessonHeader,
  MistakeList,
  NextLesson,
  Recap,
  Section,
  TransferTable,
} from "./lesson-kit";
import { T } from "./t";

export function LessonBody({ examId, lessonId }: { examId: string; lessonId: string }) {
  const ref = findLesson(examId, lessonId);

  if (!ref) {
    return (
      <main className="main" data-rail="off">
        <div className="content">
          <p className="empty">
            <T en="Lesson not found." zh="找不到这节课。" />
          </p>
          <Link href="/path">
            <T en="Back to all courses" zh="回到课程" />
          </Link>
        </div>
      </main>
    );
  }

  const { exam, module, lesson, index, total } = ref;
  const { prev, next } = prevNextLesson(examId, lessonId);

  // 右栏目录的锚点，顺序要和下面渲染的顺序一致
  const tocItems = [
    ...lesson.concepts.map((c, i) => ({
      id: c.id,
      label: `${String(i + 1).padStart(2, "0")} ${c.heading}`,
    })),
    ...(lesson.exercises?.length ? [{ id: "exercises", label: "练习 · 动手做 / Practice" }] : []),
    ...(lesson.mistakes?.length ? [{ id: "mistakes", label: "常见错误 / Common mistakes" }] : []),
    ...(lesson.transfer?.length ? [{ id: "transfer", label: "迁移模式 / Transfer" }] : []),
  ];

  return (
    <main className="main">
      <LessonVisit examId={examId} lessonId={lessonId} title={lesson.title} />

      <div className="content">
        <LessonHeader
          crumbs={[
            { label: "路线图 / Roadmap", href: "/path" },
            {
              label: <T zh={exam.shortTitle} en={exam.shortTitleEn} />,
              href: examPath(exam.id),
            },
            { label: <T zh={module.title} en={module.titleEn} /> },
          ]}
          index={index}
          total={total}
          title={<T zh={lesson.title} en={lesson.titleEn} />}
          blurb={lesson.blurb}
          minutes={lesson.minutes}
          tags={
            <>
              {lesson.exercises && lesson.exercises.length > 0 && (
                <span className="tag" data-tone="accent">
                  <T
                    en={`${lesson.exercises.length} exercises`}
                    zh={`${lesson.exercises.length} 个练习`}
                  />
                </span>
              )}
              {module.stage && (
                <span className="tag">
                  <T zh={module.stage} en={stageEn(module.stage)} />
                </span>
              )}
            </>
          }
        />

        <LearningObjective
          objectives={lesson.objectives}
          whyForAssessment={lesson.whyForAssessment}
        />

        {lesson.sourceFiles && lesson.sourceFiles.length > 0 && (
          <FileExplorer
            files={lesson.sourceFiles}
            showContent
            title="这节课要看的真实文件 / Real files this lesson looks at"
          />
        )}

        {lesson.concepts.map((c, i) => (
          <Section
            key={c.id}
            id={c.id}
            n={String(i + 1).padStart(2, "0")}
            title={c.heading}
            lede={c.lede}
          >
            {c.bodyEn ? (
              <AnswerTabs id={c.id} zh={c.body} en={c.bodyEn} />
            ) : (
              c.body
            )}
            {c.code?.map((ex, j) => (
              <CodeBlock key={j} ex={ex} />
            ))}
          </Section>
        ))}

        {lesson.callouts?.map((c, i) => (
          <Callout key={i} {...c} />
        ))}

        {lesson.exercises && lesson.exercises.length > 0 && (
          <section className="sec" id="exercises">
            <div className="sec-head">
              <span className="sec-n">
                <T en="Practice" zh="练习" />
              </span>
              <h2 className="sec-title">
                <T en="Get your hands on it" zh="动手做" />
              </h2>
            </div>
            <p className="sec-lede">
              <T
                en="Filling blanks is a stepping stone. The real bar is writing it from nothing, so once L2 is comfortable, push on to L3 and L4."
                zh="填空只是过渡。真正掌握的标准，是在没有答案的时候从头写出来 —— 所以做完 L2 之后一定要往 L3、L4 走。"
              />
            </p>
            {lesson.exercises.map((ex) => (
              <ExerciseView key={ex.id} ex={ex} examId={exam.id} />
            ))}
          </section>
        )}

        {lesson.mistakes && lesson.mistakes.length > 0 && (
          <section className="sec" id="mistakes">
            <div className="sec-head">
              <span className="sec-n">
                <T en="Wrong" zh="错例" />
              </span>
              <h2 className="sec-title">
                <T en="Mistakes beginners actually make" zh="初学者常见的几种写法错误" />
              </h2>
            </div>
            <p className="sec-lede">
              <T
                en="Every snippet below either compiles and gives the wrong answer, or blows up on the first run. Spot the problem yourself before reading the explanation."
                zh="下面每一段都是「能编译、但结果不对」或者「一跑就炸」的真实写法。先自己看出问题在哪，再看解释。"
              />
            </p>
            <MistakeList items={lesson.mistakes} />
          </section>
        )}

        {lesson.transfer && lesson.transfer.length > 0 && (
          <section className="sec" id="transfer">
            <div className="sec-head">
              <span className="sec-n">
                <T en="Transfer" zh="迁移" />
              </span>
              <h2 className="sec-title">
                <T en="Works on other problems too" zh="换一道题也能用" />
              </h2>
            </div>
            <p className="sec-lede">
              <T
                en="The exam will not reuse the same question. What you take away is the reflex: see this signal, reach for that solution."
                zh="考试不会原题重考。真正能带走的是「看到这种信号 → 伸手去拿这个解法」。"
              />
            </p>
            <TransferTable rows={lesson.transfer} />
          </section>
        )}

        {lesson.recap && lesson.recap.length > 0 && <Recap items={lesson.recap} />}

        <LessonDoneBar examId={examId} lessonId={lessonId} />

        <NextLesson
          prev={
            prev
              ? {
                  href: lessonPath(examId, prev.lesson.id),
                  title: <T zh={prev.lesson.title} en={prev.lesson.titleEn} />,
                }
              : undefined
          }
          next={
            next
              ? {
                  href: lessonPath(examId, next.lesson.id),
                  title: <T zh={next.lesson.title} en={next.lesson.titleEn} />,
                }
              : undefined
          }
        />
      </div>

      <aside aria-label="本节目录 / On this page" className="rail">
        <div className="rail-block">
          <div className="rail-head">
            <T en="On this page" zh="本节目录" />
          </div>
          <LessonToc items={tocItems} />
        </div>

        {/* 【第三轮改动】「当前位置」和「真实来源」折叠起来。
            默认只留「本节目录」。

            为什么：实测第一课的首屏同时有面包屑、双卡片、真实文件表、
            侧栏 18 个链接、右栏三块 —— 对第一课的新手是驾驶舱不是教室。
            见 docs/ia-audit-round3.md 线索 3。

            为什么是「一律折叠」而不是「新用户才折叠」：
            右栏是**服务端渲染**的，而「这个人有没有进度」只有客户端知道
            （localStorage）。按进度区分要么让客户端小岛控制折叠（首屏会闪一次
            「展开 → 收起」），要么把内容搬进客户端（违反「课文不进客户端 chunk」）。
            而「第一课信息过载」对老学员其实也成立，所以一律折叠、点一下就开。

            用原生 <details>：零 JS，键盘和屏幕阅读器都免费得到正确行为。 */}
        <details className="rail-block rail-fold">
          <summary className="rail-head rail-fold-head">
            <T en="Where you are · real source" zh="当前位置 · 真实来源" />
          </summary>

          <div style={{ color: "var(--ink-2)", marginTop: 8 }}>
            <T zh={exam.shortTitle} en={exam.shortTitleEn} />
            <br />
            <span className="dimmer">
              <T en={`Lesson ${index} of ${total}`} zh={`第 ${index} / ${total} 节`} />
            </span>
          </div>

          {lesson.sourceFiles && lesson.sourceFiles.length > 0 && (
            <div
              className="mono dimmer"
              style={{ fontSize: 11.5, lineHeight: 1.6, marginTop: 12 }}
            >
              {lesson.sourceFiles.slice(0, 4).map((f) => (
                <div key={f.path} style={{ marginBottom: 4, wordBreak: "break-all" }}>
                  {f.path}
                </div>
              ))}
            </div>
          )}
        </details>
      </aside>
    </main>
  );
}
