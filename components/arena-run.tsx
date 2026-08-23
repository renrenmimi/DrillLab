// 进行中的考场 —— 服务端组件。
//
// 【这一页最硬的一条规矩】
// HTML 里不许出现提示和答案。做法不是折叠、不是 display: none，是
// **服务端根本拿不到它们**：这一页只调 arenaPublicById()，返回的
// ArenaPublic = Omit<ArenaChallenge, "hints" | "solution">。
// 所以写 a.hints 或 a.solution 会直接编译不过 —— 防线在类型上，不在自觉上。
//
// 【这一页故意没有回课程的链接】
// 计时期间不该有一键点回讲解的入口。要看提示只有一条路：交卷。
//
// 交互只有一块：顶上的计时器和交卷/放弃按钮（ArenaClock，客户端小岛）。

import { notFound } from "next/navigation";
import { arenaPublicById } from "@/content/arena";
import { navExam } from "@/content/nav";
import { ArenaClock } from "./arena-clock";
import { TerminalCommand } from "./code";
import { FileExplorer } from "./lesson-kit";
import { NoRunnerNote } from "./local-setup";
import { itemKey } from "@/lib/plan-progress";
import { PlanItemBannerSlot } from "./plan-slots";
import { NoteRecent } from "./recent";
import { T } from "./t";

/** 模拟考派生的题会把「【任务标题】」平铺进 requirements，这里拆回分组 */
function groupRequirements(reqs: string[]) {
  const groups: { title?: string; items: string[] }[] = [];
  for (const r of reqs) {
    const m = /^【(.+)】$/.exec(r.trim());
    if (m) {
      groups.push({ title: m[1], items: [] });
      continue;
    }
    if (groups.length === 0) groups.push({ items: [] });
    groups[groups.length - 1].items.push(r);
  }
  return groups;
}

export function ArenaRun({ id }: { id: string }) {
  const a = arenaPublicById(id);
  if (!a) notFound();

  const exam = navExam(a.sourceExamId);
  // 【为什么整份数组按语言选，而不是逐条配对】
  // 分组是从「【任务标题】」这种标记行解析出来的，中英两份的分组边界可能
  // 落在不同位置。逐条配对会让标题和它下面的条目错开，所以两份各自分组，
  // 由 <T> 整块切换。长度不等时英文那份就不给 —— 宁可全中文，不要错位。
  const groups = groupRequirements(a.requirements);
  const groupsEn =
    a.requirementsEn && a.requirementsEn.length === a.requirements.length
      ? groupRequirements(a.requirementsEn)
      : undefined;
  const reqBlock = (gs: ReturnType<typeof groupRequirements>) =>
    gs.map((g, i) => (
      <div className="arena-reqs" key={i}>
        {g.title && <div className="arena-req-group">{g.title}</div>}
        <ul className="ws-req">
          {g.items.map((r, j) => (
            <li key={j}>{r}</li>
          ))}
        </ul>
      </div>
    ));

  return (
    <main className="main" data-rail="off">
      {/* 计时中的这一场就是「最近那件事」—— 顶栏的「继续」该直接带回考场。
          只传标题：这一页在类型上拿不到 hints / solution，传不出去也传不进去。 */}
      <NoteRecent
        mode="assess"
        href={`/arena/${a.id}/run`}
        title={a.title}
        titleEn={a.titleEn}
        sub="考场 · 正在计时"
        subEn="Arena · on the clock"
      />
      <div className="content ui-page">
        <ArenaClock id={a.id} minutes={a.minutes} />

        {/* compact：计时已经在跑，只说「你在计划的哪一步」，不给别处的按钮 ——
            这一页故意没有任何离开的入口，规矩不能因为计划就破。 */}
        <PlanItemBannerSlot itemKey={itemKey("arena", a.id)} compact />

        <div className="page-head arena-run-head">
          <div className="eyebrow">
            <T zh="考场 · 进行中" en="Arena · in progress" />
          </div>
          <h1 className="page-title">
            <T zh={a.title} en={a.titleEn} />
          </h1>
          <p className="page-lede">{a.scenario}</p>
          <div className="lesson-meta">
            <span className="tag" data-tone="danger">
              <T zh={`限时 ${a.minutes} 分钟`} en={`${a.minutes} min limit`} />
            </span>
            {exam && <span className="tag">{exam.shortTitle}</span>}
            <span className="tag">
              <T zh="没有提示，没有答案" en="No hints, no answers" />
            </span>
          </div>
        </div>

        <div className="callout" data-tone="warn">
          <strong className="callout-title">
            <T zh="这一页上没有答案，也没有提示" en="No answers and no hints on this page" />
          </strong>
          <p>
            <T
              zh="不是藏起来了 —— 是服务端根本没渲染。这一页拿到的数据在类型上就没有 hints 和 solution 这两个字段，View Source 也翻不出来。要看它们，只有交卷这一条路。"
              en="They are not hidden, they were never rendered. The data this page receives has no hints or solution field at the type level, so View Source will not turn them up either. The only way to see them is to hand in."
            />
          </p>
        </div>

        <div className="minihead">
          <T zh="你的任务" en="Your task" />
        </div>
        {groupsEn ? (
          <T zh={<>{reqBlock(groups)}</>} en={<>{reqBlock(groupsEn)}</>} />
        ) : (
          reqBlock(groups)
        )}

        {/* 计时已经在跑，所以这里用 compact —— 只说「在哪写」和「为什么没编辑器」，
            不塞设计说明。完整版在模拟考页上。 */}
        <NoRunnerNote compact stackblitz={a.sourceExamId === "graphql-federation" ? "node" : "react"} />

        <div className="minihead">
          <T zh="要自己建的文件" en="Files you create yourself" />
        </div>
        <FileExplorer
          title={
            <T
              zh="文件清单（目录可以不一样，接口要对得上）"
              en="File list (the layout may differ, the interfaces must match)"
            />
          }
          // FileExplorer 收 LocalizedString；补了 roleEn 的映射成双语
          files={a.fileList.map((f) => ({
            ...f,
            role: f.roleEn ? { zh: f.role, en: f.roleEn } : f.role,
          }))}
        />

        <div className="minihead">
          <T zh="验收命令 —— 交卷后要逐条自评" en="Acceptance commands — you will self-assess each one" />
        </div>
        <TerminalCommand
          steps={a.commands.map((c) => ({
            cmd: c.cmd,
            out: c.expectEn ? { zh: c.expect, en: c.expectEn } : c.expect,
          }))}
        />

        <div className="callout" data-tone="note">
          <strong className="callout-title">
            <T zh="卡住了怎么办" en="If you get stuck" />
          </strong>
          <p>
            <T
              zh="先回去读需求和验收命令的期望输出 —— 大半的卡点是没读清要求，不是不会写。查官方文档、查报错都允许。真的写不动了就放弃，记一条比假装做完有用。"
              en="Reread the requirements and the expected output of each command. Most stalls are misread requirements, not missing skill. Official docs and error messages are fair game. If you truly cannot move, give up: one honest record beats a pretend finish."
            />
          </p>
        </div>
      </div>
    </main>
  );
}
