// 课程页面原语：课头 / 学习目标 / 编号段 / 提示框 / 文件树 /
// 「先想再写」/ 常见错误 / 迁移模式 / 要点 / 测试结果 / 页脚。
//
// 这些都是纯展示件，层级靠留白与细线，不套多层圆角卡片。

import Link from "next/link";
import { Loc, T, type LocalizedString } from "./t";
import type { ReactNode } from "react";
import type {
  Callout as CalloutData,
  CodeExample,
  ConceptTone,
} from "@/content/types";
import { CodeBlock } from "./code";
import { snapshotOf } from "@/content/source-files";

/* ---------- 课头 ---------- */

export function LessonHeader({
  crumbs,
  index,
  total,
  title,
  blurb,
  minutes,
  tags,
}: {
  crumbs: { label: string; href?: string }[];
  index: number;
  total: number;
  title: string;
  blurb: string;
  minutes: number;
  tags?: ReactNode;
}) {
  return (
    <header className="lesson-head">
      <nav aria-label="面包屑 / Breadcrumb" className="crumb">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: "inline-flex", gap: 7 }}>
            {i > 0 && (
              <span className="crumb-sep" aria-hidden>
                /
              </span>
            )}
            {c.href ? (
              <Link href={c.href}>{c.label}</Link>
            ) : (
              <span>{c.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="lesson-n">
        LESSON {String(index).padStart(2, "0")} /{" "}
        {String(total).padStart(2, "0")}
      </div>
      <h1 className="lesson-title serif">{title}</h1>
      <p className="lesson-blurb">{blurb}</p>

      <div className="lesson-meta">
        <span className="tag">
          <T en={`~${minutes} min`} zh={`约 ${minutes} 分钟`} />
        </span>
        {tags}
      </div>
    </header>
  );
}

/* ---------- 学习目标 + 考点 ---------- */

export function LearningObjective({
  objectives,
  whyForAssessment,
}: {
  objectives: string[];
  whyForAssessment: string;
}) {
  return (
    <div className="objectives">
      <div className="obj-block">
        <div className="obj-head">
          <T en="After this lesson you can" zh="学完这节你会" />
        </div>
        <ul className="obj-list">
          {objectives.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
      </div>
      <div className="obj-block" data-kind="assessment">
        <div className="obj-head">
          <T en="What the exam does with this" zh="这在考试里考什么" />
        </div>
        <p>{whyForAssessment}</p>
      </div>
    </div>
  );
}

/* ---------- 编号段 ---------- */

/**
 * 「中文 / English」两个 tab —— 纯 CSS，零 JS。
 *
 * 【为什么不用 React state】
 * 这个组件包的是课程正文。如果做成客户端组件并把正文当 props/children
 * 传进去，正文就会被打进客户端 chunk —— 那正是 README 里记的 784 KB 教训。
 * 用「两个 radio + 兄弟选择器」做 tab，整块留在服务端，HTML 里两版都有，
 * 切换只是 :checked 状态变化，不需要一行 JS，也不会有 hydration 问题。
 *
 * radio 必须排在 label 和 panel 之前，~ 选择器才能生效。
 */
export function AnswerTabs({
  id,
  zh,
  en,
}: {
  id: string;
  zh: ReactNode;
  en: ReactNode;
}) {
  const name = `ans-${id}`;
  return (
    <div className="ans-tabs">
      <input
        type="radio"
        name={name}
        id={`${name}-zh`}
        className="ans-radio ans-radio-zh"
        defaultChecked
      />
      <input
        type="radio"
        name={name}
        id={`${name}-en`}
        className="ans-radio ans-radio-en"
      />

      <div
        aria-label="答案语言 / Answer language"
        className="ans-tablist"
        role="group"
      >
        <label htmlFor={`${name}-zh`} className="ans-tab">
          中文
        </label>
        <label htmlFor={`${name}-en`} className="ans-tab">
          English
        </label>
      </div>

      <div className="ans-panel ans-panel-zh">{zh}</div>
      <div className="ans-panel ans-panel-en" lang="en">
        {en}
      </div>
    </div>
  );
}

export function Section({
  id,
  n,
  title,
  lede,
  children,
}: {
  id: string;
  n: string;
  title: string;
  lede?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="sec" id={id}>
      <div className="sec-head">
        <span className="sec-n">§{n}</span>
        <h2 className="sec-title">{title}</h2>
      </div>
      {lede && <p className="sec-lede">{lede}</p>}
      <div className="prose">{children}</div>
    </section>
  );
}

export function MiniHead({ children }: { children: ReactNode }) {
  return <div className="minihead">{children}</div>;
}

/* ---------- 提示框 ---------- */

const TONE_LABEL: Record<ConceptTone, { zh: string; en: string }> = {
  note: { zh: "顺带一说", en: "By the way" },
  why: { zh: "为什么是这样", en: "Why it works this way" },
  warn: { zh: "小心", en: "Careful" },
  trap: { zh: "这是个坑", en: "This is a trap" },
  transfer: { zh: "换个题也能用", en: "Transfers to other problems" },
};

export function Callout({ tone, title, body }: CalloutData) {
  return (
    <aside className="callout" data-tone={tone}>
      <strong className="callout-title">
        {title || <T en={TONE_LABEL[tone].en} zh={TONE_LABEL[tone].zh} />}
      </strong>
      {typeof body === "string" ? <p>{body}</p> : body}
    </aside>
  );
}

/* ---------- 「先想再写」 ---------- */

export function ThinkFirst({ questions }: { questions: string[] }) {
  return (
    <div className="think">
      <MiniHead>
        <T
          en="Before you write code · answer these first"
          zh="先别写代码 · 先回答这几个问题"
        />
      </MiniHead>
      {questions.map((q, i) => (
        <div key={i} className="think-q">
          <b>{i + 1}.</b>
          <span>{q}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- 文件树 ---------- */

export function FileExplorer({
  title,
  files,
  showContent = false,
}: {
  title: string;
  /** role 可以是普通字符串（两种语言都用它），也可以是 L(zh, en) */
  files: { path: string; role: LocalizedString; edit?: boolean }[];
  /**
   * 每一行能不能展开看文件原文。
   *
   * 【默认关掉，这一点很重要】
   * 考场的「文件清单」也用这个组件，那些是**要你自己建的文件** ——
   * 它们在源项目磁盘上恰好是做完的版本，展开就等于把答案贴在题面上。
   * 所以只有课程页显式传 showContent 才会展开。
   * （生成器那边还有第二道闸：裸相对路径根本不会被收进快照。）
   */
  showContent?: boolean;
}) {
  const expandable = showContent
    ? files.filter((f) => snapshotOf(f.path)).length
    : 0;

  return (
    <div className="filetree">
      <div className="filetree-bar">
        <span>{title}</span>
        <span
          className="dimmer"
          style={{ marginLeft: "auto", fontWeight: 500 }}
        >
          {files.some((f) => f.edit) ? (
            <T
              en="Highlighted rows are the files you edit"
              zh="高亮行 = 需要你动手改的文件"
            />
          ) : expandable > 0 ? (
            <T
              en={`${files.length} items · ${expandable} can be opened`}
              zh={`${files.length} 项 · ${expandable} 个可以展开看原文`}
            />
          ) : (
            <T en={`${files.length} items`} zh={`${files.length} 项`} />
          )}
        </span>
      </div>
      <div className="filetree-body">
        {files.map((f) => {
          const snap = showContent ? snapshotOf(f.path) : undefined;

          // 没有原文快照的（目录、项目根、要自己建的文件）保持原样，
          // 不长出一个点了没反应的展开箭头。
          // 三列栅格的第一列是展开箭头。不能展开的行也要占住这一列，
          // 否则两种行的路径左边界差 15px，看着像没对齐。
          const inner = (
            <>
              <span aria-hidden className="ft-mark">
                {snap ? "\u25B8" : ""}
              </span>
              <span className="ft-path">{f.path}</span>
              <span className="ft-role">
                <Loc v={f.role} />
              </span>
            </>
          );

          if (!snap) {
            return (
              <div
                key={f.path}
                className="ft-row"
                data-edit={f.edit ? "true" : undefined}
              >
                {inner}
              </div>
            );
          }

          const isTree = snap.kind === "tree";

          return (
            <details
              key={f.path}
              className="ft-item"
              data-edit={f.edit ? "true" : undefined}
            >
              <summary className="ft-row ft-row-open">{inner}</summary>
              <div className="ft-content">
                {/* 【为什么 edit 行要先警告一句】
                    react-notes-app 和 cab-booking 在磁盘上都是**做完的版本**
                    （CLAUDE.md 事实基准第一行：TODO 都填好了、4/4 通过）。
                    所以「要你改的文件」展开看到的就是答案本身。
                    默认收起 + 展开前说清楚，选择权交给读者；
                    偷偷展示或者干脆不给看，两种都比这个差。 */}
                {f.edit && !isTree && (
                  <p className="ft-warn">
                    <T
                      en="Heads up: on disk this project is the finished version — what follows is the answer. Close this if you want to write it yourself first."
                      zh="提醒：源项目在磁盘上是做完的版本 —— 下面就是答案。想自己先写一遍的话，现在关上。"
                    />
                  </p>
                )}
                {/* verified: "source" —— 这就是源项目里那个文件的原文，
                    由 scripts/gen-source-files.mjs 在构建时从磁盘读出来的。 */}
                <CodeBlock
                  ex={{
                    language: snap.lang,
                    code: snap.content,
                    // 目录树标 tree，别让它看起来像某个叫 "src" 的文件
                    filename: isTree
                      ? `${f.path.replace(/\/+$/, "").split("/").pop()}/  ·  tree`
                      : f.path.split("/").pop(),
                    sourceFile: f.path,
                    verified: "source",
                  }}
                />
                {snap.truncated && (
                  <p className="ft-truncated">
                    <T
                      en={
                        isTree
                          ? `First 120 of ${snap.lines} entries. node_modules, dist and target are left out.`
                          : `First 120 of ${snap.lines} lines — open the file locally for the rest.`
                      }
                      zh={
                        isTree
                          ? `只列了前 120 行，整棵树共 ${snap.lines} 行。node_modules、dist、target 这些装出来编出来的没有列进去。`
                          : `只显示前 120 行，整个文件共 ${snap.lines} 行 —— 其余在本机打开看。`
                      }
                    />
                  </p>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- 分层结构图 ---------- */

export function LayerMap({
  layers,
}: {
  layers: {
    name: string;
    items: { label: string; tone?: "edit" | "given" }[];
    note?: string;
  }[];
}) {
  return (
    <div className="layers">
      {layers.map((l) => (
        <div key={l.name} className="layer">
          <div className="layer-name">{l.name}</div>
          <div className="layer-items">
            {l.items.map((it) => (
              <span key={it.label} className="layer-item" data-tone={it.tone}>
                {it.label}
              </span>
            ))}
            {l.note && <span className="layer-note">{l.note}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- 常见错误 ---------- */

export function MistakeList({
  items,
}: {
  items: { wrong: CodeExample; why: ReactNode }[];
}) {
  return (
    <>
      {items.map((m, i) => (
        <div key={i} className="mistake">
          <CodeBlock ex={m.wrong} />
          <div className="mistake-why">{m.why}</div>
        </div>
      ))}
    </>
  );
}

/* ---------- 迁移模式 ---------- */

export function TransferTable({
  rows,
}: {
  rows: { signal: string; reachFor: string }[];
}) {
  return (
    <div>
      {rows.map((r, i) => (
        <div key={i} className="transfer-row">
          <div className="transfer-sig">{r.signal}</div>
          <div className="transfer-arrow" aria-hidden>
            →
          </div>
          <div className="transfer-do">{r.reachFor}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- 要点回顾 ---------- */

export function Recap({ items }: { items: string[] }) {
  return (
    <div className="recap">
      <div className="recap-head">
        <T en="What to take away" zh="这节的要点" />
      </div>
      <ol>
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ol>
    </div>
  );
}

/* ---------- 页脚 ---------- */

/**
 * 一节课的页脚。
 *
 * 【为什么「下一节」是实心大按钮，「上一节」只是一行小字】
 * 读完一节之后，用户唯一想做的事就是往下走。两个同等权重的链接
 * 会让人多花一秒判断该点哪个 —— 所以只留一个视觉重心。
 * 走到最后一节时，下一步换成「去考场验收」，不留死路。
 */
export function NextLesson({
  prev,
  next,
  arenaHref,
}: {
  prev?: { href: string; title: string };
  next?: { href: string; title: string };
  /** 没有下一节时，往哪儿去 */
  arenaHref?: string;
}) {
  return (
    <nav aria-label="上一节 / 下一节 · Previous / next" className="lesson-foot">
      {prev ? (
        <Link className="foot-back" href={prev.href}>
          ← <span className="foot-back-title">{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}

      {next ? (
        <Link className="foot-next" href={next.href}>
          <span className="foot-next-label">
            <T en="Keep going" zh="接着往下看" />
          </span>
          <span className="foot-next-title">{next.title}</span>
        </Link>
      ) : (
        <Link className="foot-next" href={arenaHref ?? "/arena"}>
          <span className="foot-next-label">
            <T
              en="Course finished · go get checked"
              zh="这一门读完了 · 去验收"
            />
          </span>
          <span className="foot-next-title">
            <T
              en="Arena: write it yourself in an empty folder"
              zh="考场：空文件夹里自己写一遍"
            />
          </span>
        </Link>
      )}
    </nav>
  );
}
