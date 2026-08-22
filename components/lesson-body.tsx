// 一节课的完整渲染 —— 服务端组件。
//
// 所有课都走这一条路径，所以教学节奏是统一的：
//   课头（位置 / 估时 / 学完没有 / 上下节）→ 学完你会 / 考什么 →
//   涉及的真实文件 → 编号讲解段（含真实代码）→ 提示框 → 练习 →
//   常见错误 → 迁移模式 → 要点 → 一块「接下来」面板
//
// 【为什么是服务端组件】课程内容里带 JSX。以前这个文件是 "use client"，
// 结果 42 节课的全文全被打进客户端包（实测单个 chunk 784 KB，每页都下载）。
// 现在正文在服务端渲染，只有真正需要交互的部分是客户端小岛：
//   LessonVisit / LessonStatusChip / LessonDoneBar / LessonToc（本文件下方引用）
//   CodeBlock / ExerciseView / DataFlowDiagram（各自文件里标了 "use client"）

import Link from "next/link";
import { examPath, findLesson, lessonPath, prevNextLesson } from "@/content/registry";
import { CODING, codingPath } from "@/content/nav";
import { drillsOfLesson, stageEn } from "@/content/path";
import { CodeBlock } from "./code";
import { drillListHref } from "./drill-query";
import { ExerciseView } from "./exercise";
import { LessonDoneBar, LessonStatusChip, LessonToc, LessonVisit } from "./lesson-islands";
import { LessonPlanStep } from "./lesson-plan";
// 【只许用 Slot，不许直接 import plan-kit】
// 直接 import 会把计划清单（85 KB）打进课程页的初始 chunk ——
// 实测 First Load JS 因此从 142 涨到 168 kB。Slot 里那层 next/dynamic
// 才是「只有真的在跟计划的人才下载」。
import { PlanItemBannerSlot } from "./plan-slots";
import {
  AnswerTabs,
  Callout,
  FileExplorer,
  LearningObjective,
  LessonHeader,
  LessonJump,
  LessonNextPanel,
  MistakeList,
  Recap,
  Section,
  TransferTable,
} from "./lesson-kit";
import { itemKey } from "@/lib/plan-progress";
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

  // 上一节 / 下一节。页首那条一行式导航和页尾的「接下来」面板共用同一份，
  // 免得两处对「下一节是哪一节」给出两个答案。
  const prevRef = prev
    ? {
        href: lessonPath(examId, prev.lesson.id),
        title: <T zh={prev.lesson.title} en={prev.lesson.titleEn} />,
      }
    : undefined;
  const nextRef = next
    ? {
        href: lessonPath(examId, next.lesson.id),
        title: <T zh={next.lesson.title} en={next.lesson.titleEn} />,
      }
    : undefined;

  // 这一节自己的八股题和 coding 题。以前八股挂在侧栏每一行课文后面，
  // 而侧栏现在只放路线图 —— 所以这条连线搬到课尾的「接下来」里，
  // 出现在「读完了，接下来干什么」这个念头真的发生的地方。
  const lessonDrills = drillsOfLesson(lessonId);
  const relatedCoding = CODING.find((c) => c.explainLessonId === lessonId);

  // 右栏目录的锚点，顺序要和下面渲染的顺序一致
  const tocItems = [
    ...lesson.concepts.map((c, i) => ({
      id: c.id,
      label: (
        <>
          {String(i + 1).padStart(2, "0")} <T zh={c.heading} en={c.headingEn} />
        </>
      ),
    })),
    // 这三条原来是硬编码的「中文 / English」斜杠格式。段标题双语化之后，
    // 目录里其余每一条在英文模式下都是纯英文，只有这三条还带着中文 ——
    // 一列干净的英文里夹三条中英并排，看起来像没做完。改成 <T>。
    ...(lesson.exercises?.length
      ? [{ id: "exercises", label: <T zh="练习 · 动手做" en="Practice" /> }]
      : []),
    ...(lesson.mistakes?.length
      ? [{ id: "mistakes", label: <T zh="常见错误" en="Common mistakes" /> }]
      : []),
    ...(lesson.transfer?.length
      ? [{ id: "transfer", label: <T zh="迁移模式" en="Transfer" /> }]
      : []),
  ];

  return (
    <main className="main">
      <LessonVisit
        examId={examId}
        lessonId={lessonId}
        title={lesson.title}
        titleEn={lesson.titleEn}
        course={exam.shortTitle}
        courseEn={exam.shortTitleEn}
      />

      <div className="content">
        <LessonHeader
          crumbs={[
            { label: <T zh="课程" en="Courses" />, href: "/path" },
            {
              label: <T zh={exam.shortTitle} en={exam.shortTitleEn} />,
              href: examPath(exam.id),
            },
            { label: <T zh={module.title} en={module.titleEn} /> },
          ]}
          index={index}
          total={total}
          title={<T zh={lesson.title} en={lesson.titleEn} />}
          blurb={<T zh={lesson.blurb} en={lesson.blurbEn} />}
          minutes={lesson.minutes}
          status={<LessonStatusChip examId={examId} lessonId={lessonId} />}
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
          jump={<LessonJump prev={prevRef} next={nextRef} />}
        />

        {/* 「你在计划的第几步」。不在当前计划里（或者没跟计划）就什么都不渲染 ——
            自由浏览的人不该被计划的横幅打扰。 */}
        <PlanItemBannerSlot itemKey={itemKey("lesson", lessonId, examId)} />

        {/* 【窄于 1280px 时的目录】右栏只在 ≥1280px 出现，所以这里给一个
            折叠的「这一页有什么」。

            两个要点，别改：
            ① 它和右栏那一份**任何时刻只有一个在无障碍树里** ——
               另一份是 display: none，而 display: none 会把整棵子树移出
               无障碍树。所以不存在「两个同名地标」的问题。
            ② 这一份**不带 scroll-spy**，是一段纯服务端 HTML。
               它的用途是「跳到某一节」，不是「我读到哪了」；
               而且再挂一个 useActiveHeading 等于把同一份计算跑两遍。 */}
        {tocItems.length > 2 && (
          <details className="toc-fold">
            <summary className="toc-fold-head">
              <T zh="这一页有什么" en="On this page" />
              <span className="toc-fold-n tabular">{tocItems.length}</span>
            </summary>
            <ul className="toc-fold-list">
              {tocItems.map((it) => (
                <li key={it.id}>
                  <a href={`#${it.id}`}>{it.label}</a>
                </li>
              ))}
            </ul>
          </details>
        )}

        <LearningObjective
          objectives={lesson.objectives}
          objectivesEn={lesson.objectivesEn}
          whyForAssessment={lesson.whyForAssessment}
          whyForAssessmentEn={lesson.whyForAssessmentEn}
        />

        {lesson.sourceFiles && lesson.sourceFiles.length > 0 && (
          <FileExplorer
            // role 在内容里是普通字符串，FileExplorer 收的是 LocalizedString ——
            // 补了 roleEn 的映射成双语，没补的原样传（<Loc> 会当纯中文渲染）
            files={lesson.sourceFiles.map((f) => ({
              ...f,
              role: f.roleEn ? { zh: f.role, en: f.roleEn } : f.role,
            }))}
            showContent
            title={
              <T
                zh="这节课要看的真实文件"
                en="Real files this lesson looks at"
              />
            }
          />
        )}

        {lesson.concepts.map((c, i) => (
          <Section
            key={c.id}
            id={c.id}
            n={String(i + 1).padStart(2, "0")}
            title={<T zh={c.heading} en={c.headingEn} />}
            lede={c.lede ? <T zh={c.lede} en={c.ledeEn} /> : undefined}
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

        {lesson.recap && lesson.recap.length > 0 && (
          <Recap items={lesson.recap} itemsEn={lesson.recapEn} />
        )}

        <LessonNextPanel
          exerciseCount={lesson.exercises?.length ?? 0}
          prev={prevRef}
          next={nextRef}
          drill={
            lessonDrills.length > 0
              ? { href: drillListHref({}, { lesson: lessonId }), n: lessonDrills.length }
              : undefined
          }
          coding={
            relatedCoding
              ? {
                  href: codingPath(relatedCoding.id),
                  title: <T zh={relatedCoding.title} en={relatedCoding.titleEn} />,
                }
              : undefined
          }
          doneBar={<LessonDoneBar examId={examId} lessonId={lessonId} />}
          primaryStep={
            <LessonPlanStep
              examId={examId}
              lessonId={lessonId}
              next={
                next
                  ? {
                      href: lessonPath(examId, next.lesson.id),
                      zh: next.lesson.title,
                      en: next.lesson.titleEn,
                    }
                  : undefined
              }
            />
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
