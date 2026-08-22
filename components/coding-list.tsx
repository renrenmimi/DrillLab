// Coding 题列表 —— 服务端组件。
//
// 和 /practice 一个路子：筛选条件放 URL，按钮就是普通链接。
// 这样筛选状态能分享、能后退，而且这一页不用把全部题面塞进客户端包。
//
// 「可运行」这一维必须从 content/coding 现算，不能读 nav 的 hasSandbox ——
// nav.ts 是生成物，改完 sandbox 之后不跑 gen:nav 它就是旧的。

import Link from "next/link";
import { allCodingProblems, CODING_TRACK_LABEL, DIFFICULTY_LABEL } from "@/content/coding";
import { codingPath } from "@/content/nav";
import type { CodingProblem } from "@/content/types";
// 筛选链接的拼法在 lib/list-query.ts —— 理由同 practice-page.tsx
import { codingHref, type CodingQuery } from "@/lib/list-query";

export type { CodingQuery };
import { CodingCount, CodingDoneBadge } from "./coding-progress";
import { PlanStripSlot } from "./plan-slots";
import { NoteRecent } from "./recent";
import { T } from "./t";
import { Ladder } from "./ladder";

// 筛选器标签。方向名（React / JavaScript / GraphQL / Java）两种语言一样。
const TRACKS: { id: string; zh: string; en: string }[] = [
  { id: "all", zh: "全部方向", en: "All tracks" },
  { id: "react", zh: CODING_TRACK_LABEL.react, en: CODING_TRACK_LABEL.react },
  { id: "js", zh: CODING_TRACK_LABEL.js, en: CODING_TRACK_LABEL.js },
  { id: "graphql", zh: CODING_TRACK_LABEL.graphql, en: CODING_TRACK_LABEL.graphql },
  { id: "java", zh: CODING_TRACK_LABEL.java, en: CODING_TRACK_LABEL.java },
];

const DIFFS: { id: string; zh: string; en: string }[] = [
  { id: "all", zh: "全部难度", en: "All levels" },
  { id: "1", zh: DIFFICULTY_LABEL[1].zh, en: DIFFICULTY_LABEL[1].en },
  { id: "2", zh: DIFFICULTY_LABEL[2].zh, en: DIFFICULTY_LABEL[2].en },
  { id: "3", zh: DIFFICULTY_LABEL[3].zh, en: DIFFICULTY_LABEL[3].en },
];

const RUNS: { id: string; zh: string; en: string }[] = [
  { id: "all", zh: "不限", en: "Either" },
  { id: "browser", zh: "浏览器里能跑", en: "Runs in the browser" },
  { id: "local", zh: "只能本机跑", en: "Local only" },
];

const runnableInBrowser = (p: CodingProblem) => p.runnable && !!p.sandbox;

export function CodingList({ query }: { query: CodingQuery }) {
  const track = query.track ?? "all";
  const diff = query.diff ?? "all";
  const run = query.run ?? "all";

  const all = allCodingProblems();
  const shown = all.filter((p) => {
    if (track !== "all" && p.track !== track) return false;
    if (diff !== "all" && String(p.difficulty) !== diff) return false;
    if (run === "browser" && !runnableInBrowser(p)) return false;
    if (run === "local" && runnableInBrowser(p)) return false;
    return true;
  });

  const browserCount = all.filter(runnableInBrowser).length;

  const trackName = track === "all" ? undefined : CODING_TRACK_LABEL[track as CodingProblem["track"]];

  return (
    <main className="main">
      <NoteRecent
        mode="practice"
        href={codingHref(query, {})}
        title="Coding 题"
        titleEn="Coding problems"
        sub={trackName ?? "全部方向"}
        subEn={trackName ?? "All topics"}
      />
      <div className="content">
        <div className="page-head">
          <div className="eyebrow">
            <T zh="Coding 题" en="Coding problems" />
          </div>
          <h1 className="page-title display">
            <T zh="一道一道写" en="One problem at a time" />
          </h1>
          <p className="page-lede">
            <T
              zh={`全站 ${all.length} 道成型的 coding 题都在这儿。题面、需求、参考答案全部引用原来那一节，不是另抄一份。其中 ${browserCount} 道能直接在浏览器里写完并跑测试。`}
              en={`All ${all.length} coding problems, pulled from the lessons rather than copied. ${browserCount} of them run in the browser.`}
            />
          </p>
        </div>

        <PlanStripSlot mode="practice" />

        <Ladder current="code" />

        <div className="callout" data-tone="transfer">
          <strong className="callout-title">
            <T en="Read the problem before the answer" zh="先读题，别先看答案" />
          </strong>
          <p>
            <T
              en={
                <>
                  Each page shows only the problem by default — the workspace
                  opens on a click, and the walkthrough and answer sit behind
                  gates. That order is deliberate:{" "}
                  <strong>
                    getting stuck for a while first is what makes the walkthrough
                    worth reading.
                  </strong>
                </>
              }
              zh={
                <>
                  每道题的页面默认只有题面 —— 工作区要点一下才开，讲解和答案在门后面。
                  这个顺序是故意的：
                  <strong>先自己卡住一会儿，后面看讲解才有用。</strong>
                </>
              }
            />
          </p>
          <p style={{ marginBottom: 0 }}>
            <T
              en={
                <>
                  The sandbox has two modes. Learn it the first time{" "}
                  <strong>with the scaffold</strong>; the second time hit{" "}
                  <strong>start blank</strong> — every implementation file is
                  emptied and only the tests remain. That pass is the one that
                  counts.
                </>
              }
              zh={
                <>
                  沙箱有两档。第一遍用<strong>带脚手架</strong>学会；第二遍点
                  <strong>空白重来</strong>，实现文件全清空，只留测试 ——
                  那一遍才算验收。
                </>
              }
            />
          </p>
        </div>

        {/* 【为什么三排 chip 收起来了】
            同样这三维现在也在 Practice 模式的侧栏里（方向 / 难度 / 怎么跑），
            两处并列摊开就是同一个控件在一屏里出现两遍 —— 正是这次要修的毛病。
            但**不能删**：窄屏侧栏在抽屉后面，删了就得先开抽屉才能筛。
            所以收进一个 <details>：有筛选生效时自动展开（open 由 URL 参数
            在服务端算出来），所以不会「筛完看不到自己筛了什么」。
            纯 <details>，零 JS，筛选仍然是服务端 <Link>。 */}
        <details
          className="filters-more"
          open={track !== "all" || diff !== "all" || run !== "all"}
        >
          <summary className="filters-more-head">
            <T en="Filter these" zh="筛一下" />
            {(track !== "all" || diff !== "all" || run !== "all") && (
              <span className="filters-more-on">
                {[
                  track !== "all" ? TRACKS.find((t) => t.id === track) : null,
                  diff !== "all" ? DIFFS.find((d) => d.id === diff) : null,
                  run !== "all" ? RUNS.find((r) => r.id === run) : null,
                ]
                  .filter(Boolean)
                  .map((x) => (
                    // 每项自己套一个 span —— 两个 <T> 直接相邻会渲染成
                    // 「ReactEasy」（双语机制把两份文字都放进 HTML，
                    // 中间没有可换行的空白）。
                    <span key={x!.id}>
                      <T en={x!.en} zh={x!.zh} />
                    </span>
                  ))}
              </span>
            )}
          </summary>

          <div className="filters">
            <span className="filter-label">
              <T en="Track" zh="方向" />
            </span>
            {TRACKS.map((t) => (
              <Link
                className="filter-btn"
                data-on={track === t.id}
                href={codingHref(query, { track: t.id })}
                key={t.id}
              >
                <T en={t.en} zh={t.zh} />
              </Link>
            ))}
          </div>

          <div className="filters">
            <span className="filter-label">
              <T en="Level" zh="难度" />
            </span>
            {DIFFS.map((d) => (
              <Link
                className="filter-btn"
                data-on={diff === d.id}
                href={codingHref(query, { diff: d.id })}
                key={d.id}
              >
                <T en={d.en} zh={d.zh} />
              </Link>
            ))}
          </div>

          <div className="filters">
            <span className="filter-label">
              <T en="How it runs" zh="怎么跑" />
            </span>
            {RUNS.map((r) => (
              <Link
                className="filter-btn"
                data-on={run === r.id}
                href={codingHref(query, { run: r.id })}
                key={r.id}
              >
                <T en={r.en} zh={r.zh} />
              </Link>
            ))}
          </div>
        </details>

        <p className="dim" style={{ fontSize: 14.5 }}>
          <T
            zh={`筛出 ${shown.length} 道${shown.length === all.length ? "" : `（共 ${all.length} 道）`}。`}
            en={`${shown.length} of ${all.length} problems.`}
          />
        </p>

        {shown.length === 0 ? (
          <p className="empty">
            <T
              zh="这个组合下没有题。换个筛选条件试试。"
              en="Nothing matches. Try another combination."
            />
          </p>
        ) : (
          <ol className="cd-list">
            {shown.map((p) => (
              <li className="cd-row" key={p.id}>
                <Link className="cd-row-main" href={codingPath(p.id)}>
                  <span className="cd-row-title">
                    <T zh={p.title} en={p.titleEn} />
                  </span>
                  <span className="cd-row-meta">
                    <span className="tag">{CODING_TRACK_LABEL[p.track]}</span>
                    <span className="tag" data-tone={p.difficulty === 3 ? "warn" : undefined}>
                      <T
                        en={DIFFICULTY_LABEL[p.difficulty].en}
                        zh={DIFFICULTY_LABEL[p.difficulty].zh}
                      />
                    </span>
                    <span className="tag">
                      <T en={`~${p.minutes} min`} zh={`约 ${p.minutes} 分钟`} />
                    </span>
                    <span className="tag" data-tone={runnableInBrowser(p) ? "accent" : undefined}>
                      {runnableInBrowser(p) ? (
                        <T en="Runs in the browser" zh="浏览器里能跑" />
                      ) : (
                        <T en="Run it locally" zh="本机跑" />
                      )}
                    </span>
                    <span className="dimmer">
                      <T
                        en={`${p.requirements.length} acceptance criteria`}
                        zh={`${p.requirements.length} 条验收标准`}
                      />
                    </span>
                  </span>
                </Link>
                <CodingDoneBadge id={p.id} />
              </li>
            ))}
          </ol>
        )}
      </div>

      <aside className="rail">
        <CodingCount total={all.length} />

        {/* 「按方向」那一块搬走了 —— Practice 模式的侧栏里就是这份清单，
            而且那份还带筛选状态。同一份东西不摆两遍。 */}
        <div className="rail-block">
          <div className="rail-head">
            <T zh="为什么有的跑不了" en="Why some can't run here" />
          </div>
          <p className="dimmer" style={{ fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>
            <T
              zh={
                <>
                  GraphQL subgraph 要真起一个服务，Spring 那道要 JVM 和 Maven ——
                  浏览器里都办不到。这两道给的是本机命令和期望输出，
                  <strong>不给假编辑器</strong>。
                </>
              }
              en={
                <>
                  The GraphQL subgraph needs a real server process, and the
                  Spring one needs a JVM and Maven — neither can happen in a
                  browser. Those two hand you local commands and the expected
                  output,{" "}
                  <strong>not a fake editor</strong>.
                </>
              }
            />
          </p>
        </div>
      </aside>
    </main>
  );
}
