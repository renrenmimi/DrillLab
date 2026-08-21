// 开考前的说明屏 —— 服务端组件。
//
// 【为什么这一页也用 arenaPublicById】
// 它只需要标题、场景、时限和几个计数。用摘掉了 hints / solution 的
// ArenaPublic，就算以后有人手滑在这里加一段「提示预览」，也会先撞上编译错误。
// 防呆放在类型上，不放在人肉 review 上。
//
// 【这一页故意不列需求】
// 需求在 /arena/[id]/run，也就是计时开始之后才出现。读题本身就是考试的一部分：
// 真实考试不会让你先把题读完再决定什么时候开始计时。

import Link from "next/link";
import { notFound } from "next/navigation";
import { arenaPublicById } from "@/content/arena";
import { examPath, navExam } from "@/content/nav";
import { ArenaRules } from "./arena-bits";
import { ArenaStartPanel } from "./arena-start";
import { T } from "./t";

export function ArenaBrief({ id }: { id: string }) {
  const a = arenaPublicById(id);
  if (!a) notFound();

  const exam = navExam(a.sourceExamId);

  return (
    <main className="main" data-rail="off">
      <div className="content">
        <nav className="crumb" aria-label="面包屑 / Breadcrumb">
          <Link href="/arena">
            <T zh="考场" en="Arena" />
          </Link>
          {exam && (
            <>
              <span className="crumb-sep" aria-hidden>
                /
              </span>
              <span>{exam.shortTitle}</span>
            </>
          )}
        </nav>

        <div className="page-head">
          <div className="eyebrow">
            <T zh="开考前" en="Before you start" />
          </div>
          <h1 className="page-title serif">{a.title}</h1>
          <p className="page-lede">{a.scenario}</p>
          <div className="lesson-meta" style={{ marginTop: 14 }}>
            <span className="tag" data-tone="danger">
              <T zh={`限时 ${a.minutes} 分钟`} en={`${a.minutes} min limit`} />
            </span>
            <span className="tag">
              <T
                zh={`${a.requirements.length} 条需求`}
                en={`${a.requirements.length} requirements`}
              />
            </span>
            <span className="tag">
              <T zh={`${a.fileList.length} 个文件要自己建`} en={`${a.fileList.length} files to create`} />
            </span>
            <span className="tag">
              <T zh={`${a.commands.length} 条验收命令`} en={`${a.commands.length} acceptance commands`} />
            </span>
            {a.sourceMockId && (
              <span className="tag" data-tone="warn">
                <T zh="DrillLab 自出" en="DrillLab-authored" />
              </span>
            )}
          </div>
        </div>

        <div className="callout" data-tone="trap">
          <strong className="callout-title">
            <T zh="按下去就开始计时了" en="Pressing start starts the clock" />
          </strong>
          <p>
            <T
              zh="题面在下一页。计时基准是「开考那一刻」的时间戳，存在本机 —— 刷新、切标签页、关掉浏览器再回来都不会重置，也不会把你踢回这一屏。"
              en="The paper is on the next page. The clock is anchored to the timestamp taken when you start and lives in this browser: refreshing, switching tabs or closing the window and coming back will not reset it, and will not throw you back to this screen."
            />
          </p>
          <p>
            <T
              zh="所以别用它当预览 —— 想先看题的话，那已经不是考场了。"
              en="So do not use it as a preview. If you look at the paper first, this stops being an exam."
            />
          </p>
        </div>

        <div className="minihead">
          <T zh="考场规则" en="Arena rules" />
        </div>
        <ArenaRules />

        <div className="minihead">
          <T zh="这道题从哪来" en="Where this one comes from" />
        </div>
        <div className="prose">
          <p>
            {a.sourceMockId ? (
              <T
                zh="它是一套模拟考换成考场模式 —— 题面是 DrillLab 自己出的，考点和真实 assessment 对应。参考答案在本机跑通过自己的测试。"
                en="It is a mock exam turned into arena mode. The paper is DrillLab-authored; the skills map onto the real assessment, and the reference answer was run against its own tests on this machine."
              />
            ) : (
              <T
                zh="它是源项目里那道题的「从零重写」版：不给脚手架、不给起始代码，只给需求和验收命令。参考答案就是源项目里的真实实现。"
                en="It is the from-scratch version of a task in the source project: no scaffold, no starter code, only requirements and acceptance commands. The reference answer is the real implementation from that project."
              />
            )}
          </p>
          {exam && (
            <p>
              <T zh="还没准备好？先回去过一遍" en="Not ready yet? Go back through" />{" "}
              <Link href={examPath(exam.id)}>{exam.title}</Link>
              <T
                zh="。考场里没有提示按钮，卡住了只能靠已经会的东西。"
                en=". There is no hint button in here; if you get stuck, you get stuck with what you already know."
              />
            </p>
          )}
        </div>

        <ArenaStartPanel id={a.id} title={a.title} minutes={a.minutes} />
      </div>
    </main>
  );
}
