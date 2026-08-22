"use client";

// 列表页上的三个客户端小岛：一张题卡的外壳、「筛出多少道」、搜索框。
//
// 【正文怎么进来的】
// 题卡的答案是**服务端渲染好的 children**（见 components/drill-list.tsx）。
// 这个文件只读 content/nav 里的题面元数据 —— 一行内容正文都不 import。
// 反过来做（客户端 import content/drills）会把 99 道题的正文打进 JS 包，
// 那就是 README 里记的 784 KB 那个坑。
//
// 【掌握状态这一维为什么只能在客户端筛】
// 「会 / 模糊 / 不会」存在 localStorage 里，服务端渲染时根本读不到。
// 所以分工是：
//   · track（方向）+ q（关键词）→ 服务端真筛，还分页，链接可以分享；
//   · mark（掌握状态）→ 服务端把这一批全发过来，客户端把不符合的整张卡
//     从 DOM 里摘掉（return null，不是 CSS 隐藏）。
// 代价写在明面上：mark 生效时列表页不分页（服务端不知道谁符合，没法算页），
// 于是那种情况下 HTML 会带上当前 track 下全部题目的正文。
// 常见路径（先选方向、再翻页）是轻的。

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { DRILLS, DRILL_TRACK_LABEL, drillPath, lessonPath } from "@/content/nav";
import { useLocale } from "@/lib/locale";
import { useProgress, type DrillMark } from "@/lib/progress";
import { drillListHref, type DrillQuery } from "./drill-query";
import { DrillMarkBadge, DrillMarks } from "./drill-marks";
import { T } from "./t";

const META = new Map(DRILLS.map((d) => [d.id, d]));

/**
 * 掌握状态筛选的取值。
 *   "none"   还没做过
 *   "review" 「模糊 + 不会」并成一档 —— 这是考前一晚真正要过的那一堆，
 *            也是 Review 侧栏「要复习」那一项指向的值。
 *            拆成两次点击（先筛模糊、再筛不会）是把一件事说成两件。
 */
export type MarkFilter = "all" | DrillMark | "none" | "review";

function hit(mark: DrillMark | undefined, filter: MarkFilter) {
  if (filter === "all") return true;
  if (filter === "none") return mark === undefined;
  if (filter === "review") return mark === "fuzzy" || mark === "unknown";
  return mark === filter;
}

export function DrillCard({
  id,
  markFilter,
  children,
}: {
  id: string;
  markFilter: MarkFilter;
  /** 服务端渲染好的答案正文 */
  children: ReactNode;
}) {
  const { drillMark, ready } = useProgress();
  const meta = META.get(id);
  if (!meta) return null;

  const mark = ready ? drillMark(id) : undefined;

  // 还没读到 localStorage 时先别显示：否则筛「不会」会先闪出全部题目再消失
  if (markFilter !== "all" && (!ready || !hit(mark, markFilter))) return null;

  const track = DRILL_TRACK_LABEL[meta.track];

  return (
    // 骨架是共享的 .ui-card[data-rows]：头 / 正文 / 页脚三层，正文占 1fr。
    // 所以头上的标签换行、答案展开，都不会让页脚离开那条底线。
    <article className="ui-card drill-card" data-rows id={`d-${id}`} data-mark={mark}>
      <div className="drill-card-top">
        <span className="tag">
          <T zh={track.zh} en={track.en} />
        </span>
        {meta.bank.length > 0 ? (
          <span className="drill-bank mono">{meta.bank.map((n) => `#${n}`).join(" / ")}</span>
        ) : (
          /* bank 为空 = DrillLab 自出（drills.ts 的断言保证只有 generated 题才为空） */
          <span className="drill-bank">
            <T zh="DrillLab 自出" en="By DrillLab" />
          </span>
        )}
        <span className="drill-card-top-right">
          <DrillMarkBadge id={id} />
        </span>
      </div>

      <div className="drill-card-body">
        <h3 className="drill-q">
          <Link href={drillPath(id)}>{meta.zh}</Link>
        </h3>
        <p className="drill-q-en" lang="en">
          {meta.en}
        </p>

        {/* 展开用原生 details —— 零 JS，答案整块留在服务端渲染的 children 里 */}
        <details className="drill-ans">
          <summary className="drill-ans-sum">
            <span className="drill-ans-arrow" aria-hidden>
              →
            </span>
            <T zh="看答案" en="Show answer" />
          </summary>
          <div className="drill-ans-body">{children}</div>
        </details>
      </div>

      <div className="drill-card-foot">
        <DrillMarks id={id} />
        <span className="drill-card-links">
          <Link href={drillPath(id)}>
            <T zh="单题页 →" en="Question page →" />
          </Link>
          <Link href={lessonPath(meta.examId, meta.lessonId)}>
            <T zh="出处那一节 →" en="Where it comes from →" />
          </Link>
        </span>
      </div>
    </article>
  );
}

/**
 * 「筛出多少道」。
 * ids 是服务端已经按 track + q 筛完的这一批，这里只再叠一层掌握状态。
 */
export function DrillListStatus({
  ids,
  matched,
  total,
  markFilter,
  page,
  pages,
}: {
  /** 当前页上真的渲染了哪些题 */
  ids: string[];
  /** 服务端筛完（未分页）一共多少道 */
  matched: number;
  total: number;
  markFilter: MarkFilter;
  page: number;
  pages: number;
}) {
  const { drillMark, ready } = useProgress();

  if (markFilter === "all") {
    return (
      <span className="ui-sec-note">
        <T
          zh={`筛出 ${matched} 道${matched !== total ? `（共 ${total} 道）` : ""}${
            pages > 1 ? ` · 第 ${page} / ${pages} 页` : ""
          }。`}
          en={`${matched} of ${total} questions${pages > 1 ? ` · page ${page} / ${pages}` : ""}.`}
        />
      </span>
    );
  }

  if (!ready) {
    return (
      <span className="ui-sec-note">
        <T zh="正在读这台浏览器里的标记…" en="Reading your marks from this browser…" />
      </span>
    );
  }

  const n = ids.filter((id) => hit(drillMark(id), markFilter)).length;

  return (
    <span className="ui-sec-note">
      <T
        zh={`按掌握状态筛出 ${n} 道（这一档是在你的浏览器里筛的，所以不分页）。`}
        en={`${n} match this mark (filtered in your browser, so no paging here).`}
      />
    </span>
  );
}

/** 掌握状态没筛出东西时的空状态 —— 也得是客户端才知道 */
export function DrillEmptyIfNone({
  ids,
  markFilter,
}: {
  ids: string[];
  markFilter: MarkFilter;
}) {
  const { drillMark, ready } = useProgress();
  if (markFilter === "all" || !ready) return null;
  if (ids.some((id) => hit(drillMark(id), markFilter))) return null;
  return (
    <div className="ui-empty">
      <span className="ui-empty-title">
        <T zh="这一档现在是空的" en="Nothing in this mark" />
      </span>
      <T
        zh="换个方向，或者把掌握状态改成「全部」。"
        en="Try another track, or set the mark filter back to all."
      />
    </div>
  );
}

/**
 * 关键词 / 编号搜索。
 *
 * 是个真的 <form action="/drill" method="get">：没 JS 也能用（浏览器自己
 * 拼 query string 整页跳转）。有 JS 时 onSubmit 拦下来走 router.push，
 * 这样是客户端导航，不整页刷新 —— 两条路拼出来的 URL 完全一样。
 */
export function DrillSearchBox({ query }: { query: DrillQuery }) {
  const router = useRouter();
  const { locale } = useLocale();

  return (
    <form
      className="drill-search"
      action="/drill"
      method="get"
      role="search"
      aria-label={locale === "en" ? "Search questions" : "搜索题目"}
      onSubmit={(e) => {
        e.preventDefault();
        const raw = new FormData(e.currentTarget).get("q");
        router.push(drillListHref(query, { q: typeof raw === "string" ? raw : "", page: "1" }));
      }}
    >
      {/* 隐藏字段：搜索时保留已选的方向和掌握状态 */}
      {query.track && query.track !== "all" && (
        <input type="hidden" name="track" value={query.track} />
      )}
      {query.mark && query.mark !== "all" && (
        <input type="hidden" name="mark" value={query.mark} />
      )}
      <input
        className="drill-search-input"
        type="search"
        name="q"
        defaultValue={query.q ?? ""}
        placeholder={locale === "en" ? "Search, or type #279" : "搜题面，或直接输 #279"}
        aria-label={locale === "en" ? "Search question text or bank number" : "搜索题面或题库编号"}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
      <button type="submit" className="btn btn-sm">
        <T zh="搜" en="Search" />
      </button>
      {(query.q ?? "").trim() && (
        <Link className="btn btn-sm btn-ghost" href={drillListHref(query, { q: "", page: "1" })}>
          <T zh="清空" en="Clear" />
        </Link>
      )}
    </form>
  );
}
