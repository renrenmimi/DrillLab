// 交卷后的复盘页 —— 服务端组件。
//
// 这是四段路由里唯一允许出现提示和答案的一页，所以它才用 arenaById()（完整数据）。
// 隔离靠的是路由：/run 那一页调的是 arenaPublicById()，类型上就没有这两个字段。
//
// 页面顺序是刻意的：
//   ① 逐条勾验收命令的真实结果（自评）→ 写进这次尝试的 checks
//   ② 勾完才解锁四级提示和参考答案
// 先看答案再勾，勾出来的东西就没意义了。所以①没做完，②的内容不进 DOM ——
// 提示和答案是作为 children 交给 ArenaCheckoff 的，它在自评完成前根本不渲染这个插槽。

import Link from "next/link";
import { notFound } from "next/navigation";
import { arenaById } from "@/content/arena";
import { arenaPath, examPath, lessonPath, mockPath, navExam } from "@/content/nav";
import { ArenaCheckoff } from "./arena-checkoff";
import { CodeBlock } from "./code";
import { HintPanel, SolutionGate } from "./hint-panel";
import { L, T } from "./t";

export function ArenaReview({ id }: { id: string }) {
  const a = arenaById(id);
  if (!a) notFound();

  const exam = navExam(a.sourceExamId);

  return (
    <main className="main" data-rail="off">
      <div className="content">
        <nav className="crumb" aria-label="面包屑 / Breadcrumb">
          <Link href="/arena">
            <T zh="考场" en="Arena" />
          </Link>
          <span className="crumb-sep" aria-hidden>
            /
          </span>
          <Link href={arenaPath(a.id)}>
            <T zh={a.title} en={a.titleEn} />
          </Link>
        </nav>

        <div className="page-head">
          <div className="eyebrow">
            <T zh="交卷后 · 自评与复盘" en="Handed in · self-assessment" />
          </div>
          <h1 className="page-title serif">
            <T zh="先自评，再看答案" en="Self-assess first, then read the answer" />
          </h1>
          <p className="page-lede">
            <T
              zh="验收命令的结果只有你自己知道 —— 这个站跑不了你本机的测试。所以这一步是自评：照实勾，勾完才解锁提示和参考答案。"
              en="Only you know what the acceptance commands printed; this site cannot run the tests on your machine. So this step is self-assessment: tick what actually happened, and the hints and reference answer open up afterwards."
            />
          </p>
        </div>

        <div className="callout" data-tone="trap">
          <strong className="callout-title">
            <T zh="别把「跑绿了」和「做对了」当一回事" en="Green is not the same as correct" />
          </strong>
          <p>
            <T
              zh="实测过的：node-subgraph 的基线里有三个测试是「空实现恰好满足断言」而通过的；java-service 六个端点全 return null 也能过三个。所以勾之前先看清楚命令的期望输出，别只看有没有报错。"
              en="Measured on this project: three tests in the node-subgraph baseline pass because an empty implementation happens to satisfy the assertion, and the java-service passes three of five with all six endpoints returning null. So check the expected output of each command, not just the absence of errors."
            />
          </p>
        </div>

        <ArenaCheckoff id={a.id} title={a.title} minutes={a.minutes} commands={a.commands}>
          {/* 这一整块只有自评完成后才会被渲染进 DOM */}
          <div className="minihead">
            <T zh="四级提示 —— 现在可以看了" en="The four hint levels — now open" />
          </div>
          <p className="arena-note">
            <T
              zh="没做出来的话，从提示 1 开始往下看，看到能自己接上就停 —— 别一路点到底。"
              en="If you did not finish, start at hint 1 and stop as soon as you can carry on alone. Do not click straight to the bottom."
            />
          </p>
          <HintPanel hints={a.hints} />

          <div style={{ marginTop: 22 }}>
            <SolutionGate
              note={L(
                "最后一道门。你已经在本机自己写过一遍了 —— 现在对照参考答案，重点看你漏了什么，而不是它比你好看在哪。",
                "The last gate. You have already written it yourself — now compare, and look for what you missed rather than for what reads nicer here.",
              )}
              label={L("打开参考答案", "Open the reference answer")}
            >
              <div className="minihead">
                <T zh="参考答案" en="Reference answer" />
              </div>
              {a.solution.map((s, i) => (
                <CodeBlock key={i} ex={s} />
              ))}
            </SolutionGate>
          </div>

          <div className="minihead">
            <T zh="完整讲解在这里" en="Where the full walkthrough lives" />
          </div>
          <div className="prose">
            <ul>
              {a.explainLessonId && (
                <li>
                  <Link href={lessonPath(a.sourceExamId, a.explainLessonId)}>
                    <T zh="讲这道题的那一节课" en="The lesson that teaches this task" />
                  </Link>
                </li>
              )}
              {a.sourceMockId && (
                <li>
                  <Link href={mockPath(a.sourceExamId, a.sourceMockId)}>
                    <T zh="这套模拟考的逐步讲解与评分标准" en="This mock exam's walkthrough and rubric" />
                  </Link>
                </li>
              )}
              {a.sourceExerciseId && (
                <li>
                  <Link href={`/practice?exam=${a.sourceExamId}&kind=from-scratch`}>
                    <T zh="练习场里同一道从零重写（带脚手架版）" en="The same from-scratch drill in the practice area" />
                  </Link>
                </li>
              )}
              {exam && (
                <li>
                  <Link href={examPath(exam.id)}>
                    <T zh={exam.title} en={exam.titleEn} />
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </ArenaCheckoff>
      </div>
    </main>
  );
}
