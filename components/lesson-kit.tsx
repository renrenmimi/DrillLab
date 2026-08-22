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

/**
 * 课头 —— 不用往下滚就能看清六件事：
 * 在哪门课、哪个模块、第几节 / 共几节、大概多久、标记完成没有、前后是哪一节。
 *
 * 【为什么这六件事必须一起给】
 * 另外七个同系列的 app 之所以「点左边一步一步做就不会错过任何信息」，
 * 靠的就是「章节位置 + 进度 + 一个明确的下一步」这三样一直在眼前。
 * 这个站以前只给了「第 6 / 21 节」和面包屑，估时挤在一排徽章里，
 * 「学完没有」要滚到页尾才知道，上一节 / 下一节也只在页尾 ——
 * 于是读到一半想跳回去，只能先滚到底。
 */
export function LessonHeader({
  crumbs,
  index,
  total,
  title,
  blurb,
  minutes,
  tags,
  status,
  jump,
}: {
  // label / title / blurb 收 ReactNode，是为了能直接塞 <T zh en />。
  // 课程和课文标题现在是双语的（content/types.ts 的 titleEn），
  // 而 <T> 渲染的是两个 span，不是字符串。
  crumbs: { label: ReactNode; href?: string }[];
  index: number;
  total: number;
  title: ReactNode;
  blurb: ReactNode;
  minutes: number;
  tags?: ReactNode;
  /** 「学完没有」的徽章。它要读 localStorage，所以由客户端小岛传进来 */
  status?: ReactNode;
  /** 上一节 / 下一节。长课文读到一半想跳，不该先滚到页尾 */
  jump?: ReactNode;
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

      <div className="lesson-pos">
        <span className="lesson-n">
          <T
            en={`LESSON ${String(index).padStart(2, "0")} / ${String(total).padStart(2, "0")}`}
            zh={`第 ${String(index).padStart(2, "0")} / ${String(total).padStart(2, "0")} 节`}
          />
        </span>
        <span className="lesson-pos-sep" aria-hidden>
          ·
        </span>
        <span className="lesson-pos-time tabular">
          <T en={`~${minutes} min`} zh={`约 ${minutes} 分钟`} />
        </span>
        {status}
      </div>

      <h1 className="lesson-title display">{title}</h1>
      <p className="lesson-blurb">{blurb}</p>

      {tags && <div className="lesson-meta">{tags}</div>}

      {jump}
    </header>
  );
}

/**
 * 上一节 / 下一节的一行式导航。页首用。
 *
 * 页尾不再放第二个 <nav> —— 那会在无障碍树里留下两个同名地标。
 * 页尾的「下一节」是 LessonNextPanel 里的主按钮，「上一节」是它页脚那行小字。
 */
export function LessonJump({
  prev,
  next,
}: {
  prev?: { href: string; title: ReactNode };
  next?: { href: string; title: ReactNode };
}) {
  if (!prev && !next) return null;
  return (
    <nav className="lesson-jump" aria-label="上一节 / 下一节 · Previous and next lesson">
      {prev ? (
        <Link className="lesson-jump-link" data-dir="prev" href={prev.href}>
          <span className="lesson-jump-dir" aria-hidden>
            ←
          </span>
          <span className="lesson-jump-title">{prev.title}</span>
        </Link>
      ) : (
        <span className="lesson-jump-none">
          <T zh="这是第一节" en="First lesson" />
        </span>
      )}
      {next ? (
        <Link className="lesson-jump-link" data-dir="next" href={next.href}>
          <span className="lesson-jump-title">{next.title}</span>
          <span className="lesson-jump-dir" aria-hidden>
            →
          </span>
        </Link>
      ) : (
        <span className="lesson-jump-none">
          <T zh="这是最后一节" en="Last lesson" />
        </span>
      )}
    </nav>
  );
}

/**
 * 一对平行的中英文数组，逐项渲染成双语列表项。
 *
 * 【为什么长度不等就整段回落中文】
 * 对齐靠的是下标，不是内容。少一条英文，从那一条起后面全部错位 ——
 * 第 3 条中文配第 4 条的英文，看起来还挺像那么回事，但说的是别的事。
 * 这种错比缺英文难发现得多，所以宁可全中文。
 */
export function BilingualList({ zh, en }: { zh: string[]; en?: string[] }) {
  const paired = en && en.length === zh.length ? en : undefined;
  return (
    <>
      {zh.map((item, i) => (
        <li key={i}>{paired ? <T zh={item} en={paired[i]} /> : item}</li>
      ))}
    </>
  );
}

/* ---------- 学习目标 + 考点 ---------- */

export function LearningObjective({
  objectives,
  objectivesEn,
  whyForAssessment,
  whyForAssessmentEn,
}: {
  objectives: string[];
  objectivesEn?: string[];
  whyForAssessment: string;
  whyForAssessmentEn?: string;
}) {
  return (
    <div className="objectives">
      <div className="obj-block">
        <div className="obj-head">
          <T en="After this lesson you can" zh="学完这节你会" />
        </div>
        <ul className="obj-list">
          <BilingualList zh={objectives} en={objectivesEn} />
        </ul>
      </div>
      <div className="obj-block" data-kind="assessment">
        <div className="obj-head">
          <T en="What the exam does with this" zh="这在考试里考什么" />
        </div>
        <p>
          <T zh={whyForAssessment} en={whyForAssessmentEn} />
        </p>
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
  /** 收 ReactNode 是为了能直接塞 <T zh en /> —— 段标题现在是双语的 */
  title: ReactNode;
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

export function Callout({ tone, title, titleEn, body, bodyEn }: CalloutData) {
  return (
    <aside className="callout" data-tone={tone}>
      <strong className="callout-title">
        {title ? (
          <T zh={title} en={titleEn} />
        ) : (
          <T en={TONE_LABEL[tone].en} zh={TONE_LABEL[tone].zh} />
        )}
      </strong>
      {typeof body === "string" ? (
        <p>
          <T zh={body} en={bodyEn} />
        </p>
      ) : (
        <T zh={body} en={bodyEn} />
      )}
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
  // 收 ReactNode，好塞 <T zh en /> —— 原来是硬编码的「中文 / English」，
  // 在已经全英文的界面里显得像没做完
  title: ReactNode;
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
  items: { wrong: CodeExample; why: ReactNode; whyEn?: ReactNode }[];
}) {
  return (
    <>
      {items.map((m, i) => (
        <div key={i} className="mistake">
          <CodeBlock ex={m.wrong} />
          <div className="mistake-why">
            <T zh={m.why} en={m.whyEn} />
          </div>
        </div>
      ))}
    </>
  );
}

/* ---------- 迁移模式 ---------- */

export function TransferTable({
  rows,
}: {
  rows: {
    signal: string;
    reachFor: string;
    signalEn?: string;
    reachForEn?: string;
  }[];
}) {
  return (
    <div>
      {rows.map((r, i) => (
        <div key={i} className="transfer-row">
          <div className="transfer-sig">
            <T zh={r.signal} en={r.signalEn} />
          </div>
          <div className="transfer-arrow" aria-hidden>
            →
          </div>
          <div className="transfer-do">
            <T zh={r.reachFor} en={r.reachForEn} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- 要点回顾 ---------- */

export function Recap({ items, itemsEn }: { items: string[]; itemsEn?: string[] }) {
  return (
    <div className="recap">
      <div className="recap-head">
        <T en="What to take away" zh="这节的要点" />
      </div>
      <ol>
        <BilingualList zh={items} en={itemsEn} />
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
/**
 * 课尾唯一的「接下来」面板。
 *
 * 【为什么合成一块】
 * 以前这里是两块：一条「学完这节」的打勾条，和一个「上一节 / 下一节」的页脚
 * （下一节是个实心大按钮）。两块之间没有关系，而且打勾条和大按钮在视觉上
 * 权重接近 —— 读完一节课，眼前有两个都说得通的下一步。
 *
 * 现在是一份有序清单，顺序就是建议的顺序：
 *   1  把这一节的练习做掉      —— 没有练习的课这一步不出现
 *   2  接着看下一节            —— **整块里唯一的实心按钮**
 *   3  可选：这一节的八股 / 对应的 coding 题
 * 页脚放「标记学完」和「上一节」—— 一个是状态，一个是回头路，都不跟第 2 步抢。
 *
 * 编号用 CSS counter 生成，所以第 1 步不出现时第 2 步会自动变成 1。
 */
export function LessonNextPanel({
  exerciseCount,
  prev,
  next,
  drill,
  coding,
  arenaHref,
  doneBar,
  primaryStep,
}: {
  exerciseCount: number;
  // title 收 ReactNode —— 课文标题是双语的，传进来的是 <T zh en />
  prev?: { href: string; title: ReactNode };
  next?: { href: string; title: ReactNode };
  /** 这一节的八股题：有几道、去哪看 */
  drill?: { href: string; n: number };
  /** 这一节对应的 coding 题 */
  coding?: { href: string; title: ReactNode };
  /** 没有下一节时，往哪儿去 */
  arenaHref?: string;
  /** 「标记这节学完」—— 要读 localStorage，由客户端小岛传进来 */
  doneBar?: ReactNode;
  /**
   * 第 2 步那一整个 <li>。
   *
   * 跟着引导计划走的时候这一步要换说法（「接着走计划」而不是「接着看下一节」），
   * 而「这一节在不在当前计划里」只有 localStorage 知道 —— 所以整步交给
   * 客户端小岛渲染（components/lesson-plan.tsx）。不传就用下面那份默认的。
   * 必须是一个 <li>：编号是 CSS counter，靠的是它是 <ol> 的直接子元素。
   */
  primaryStep?: ReactNode;
}) {
  return (
    <section className="lnext" aria-labelledby="lnext-h">
      <h2 className="lnext-h" id="lnext-h">
        <T zh="接下来" en="What next" />
      </h2>

      <ol className="lnext-steps">
        {exerciseCount > 0 && (
          <li className="lnext-step">
            <div className="lnext-step-body">
              <span className="lnext-step-title">
                <T zh="把这一节的练习做掉" en="Do this lesson’s exercises" />
              </span>
              <span className="lnext-step-sub">
                <T
                  zh={`${exerciseCount} 个，就在这一页上面 —— 别攒着最后一起做`}
                  en={`${exerciseCount} of them, further up this page — do not save them for later`}
                />
              </span>
            </div>
            <a className="lnext-step-link" href="#exercises">
              <T zh="回到练习 ↑" en="Back up to them ↑" />
            </a>
          </li>
        )}

        {primaryStep ?? (
          <li className="lnext-step" data-primary>
            <div className="lnext-step-body">
              <span className="lnext-step-title">
                {next ? (
                  <T zh="接着看下一节" en="Continue to the next lesson" />
                ) : (
                  <T zh="这一门读完了 —— 去验收" en="Course finished — go get checked" />
                )}
              </span>
              <span className="lnext-step-sub">
                {next ? (
                  next.title
                ) : (
                  <T
                    zh="考场：空文件夹、计时、没有提示按钮"
                    en="The arena: an empty folder, a clock, no hint button"
                  />
                )}
              </span>
            </div>
            <Link className="lnext-cta" href={next ? next.href : (arenaHref ?? "/arena")}>
              {next ? <T zh="下一节" en="Next lesson" /> : <T zh="去考场" en="To the arena" />}
            </Link>
          </li>
        )}

        {(drill || coding) && (
          <li className="lnext-step">
            <div className="lnext-step-body">
              <span className="lnext-step-title">
                <T zh="可选：再巩固一下" en="Optional: reinforce it" />
              </span>
              <span className="lnext-step-sub lnext-step-links">
                {drill && (
                  <Link href={drill.href}>
                    <T
                      zh={`这一节的 ${drill.n} 道八股`}
                      en={`${drill.n} question${drill.n > 1 ? "s" : ""} from this lesson`}
                    />
                  </Link>
                )}
                {coding && (
                  <Link href={coding.href}>
                    <T zh="对应的 Coding 题：" en="The coding problem: " />
                    {coding.title}
                  </Link>
                )}
              </span>
            </div>
          </li>
        )}
      </ol>

      <div className="lnext-foot">
        {doneBar}
        {prev && (
          <Link className="lnext-back" href={prev.href}>
            <span aria-hidden>←</span>{" "}
            <T zh="上一节：" en="Previous: " />
            {prev.title}
          </Link>
        )}
      </div>
    </section>
  );
}
