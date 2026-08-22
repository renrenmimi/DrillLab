// 八股题库列表 —— 服务端组件。
//
// 【页面骨架】和 /practice、/code、/arena 完全一样，见
// styles/layout.css（ui-* 原语）与 styles/lesson.css 里 .mode-page 那一段：
//   眉题 → 大标题 → 一句话 → 计划上下文 → 进度摘要 → 筛选行 → 内容
// 这一页不再自己写容器宽度、标题字号、进度条、空状态。
//
// 【筛选的分工】（详见 components/drill-card.tsx 顶部那段）
//   track + q  → 这里真筛，还分页，URL 可以分享、可以后退；
//   mark       → 存在 localStorage 里，服务端读不到，只能由客户端小岛
//                把不符合的整张卡摘掉。mark 生效时这里不分页。
//
// 【为什么是服务端】答案正文带 JSX。做成 "use client" 就会把 99 道题的正文
// 打进客户端包（784 KB 那个坑）。所以正文在这里渲染，作为 children 交给
// 客户端小岛 <DrillCard>，交互只包一层壳。

import Link from "next/link";
import { allDrills, drillTrackCounts, TRACK_LABEL, TRACK_ORDER } from "@/content/drills";
import type { DrillTrack } from "@/content/types";
import { DrillAnswer } from "./drill-answer";
import { DrillCard, DrillEmptyIfNone, DrillListStatus, DrillSearchBox, type MarkFilter } from "./drill-card";
import { DrillProgressStrip } from "./drill-marks";
import { lessonRef } from "@/content/path";
import { lessonPath } from "@/content/nav";
import { DRILL_PAGE, drillListHref, drillMatchesKeyword, type DrillQuery } from "./drill-query";
import { PlanStripSlot } from "./plan-slots";
import { NoteRecent } from "./recent";
import { T } from "./t";
import { Ladder } from "./ladder";

const MARK_FILTERS: { id: MarkFilter; zh: string; en: string }[] = [
  { id: "all", zh: "全部", en: "All" },
  { id: "none", zh: "还没做", en: "Not seen" },
  // 「模糊 + 不会」合成一档。Review 侧栏的「要复习」指向它 ——
  // 那一档是考前一晚真正要过的堆，不该让人点两次筛选才凑出来。
  { id: "review", zh: "要复习", en: "Needs review" },
  { id: "unknown", zh: "不会", en: "No idea" },
  { id: "fuzzy", zh: "模糊", en: "Shaky" },
  { id: "known", zh: "会", en: "Got it" },
];

function readMark(v?: string): MarkFilter {
  const hit = MARK_FILTERS.find((m) => m.id === v);
  return hit ? hit.id : "all";
}

function readTrack(v?: string): DrillTrack | "all" {
  return TRACK_ORDER.includes(v as DrillTrack) ? (v as DrillTrack) : "all";
}

export function DrillList({ query }: { query: DrillQuery }) {
  const all = allDrills();
  const track = readTrack(query.track);
  const markFilter = readMark(query.mark);
  const kw = (query.q ?? "").trim();
  // 侧栏送过来的「只看这一节」。id 不认识就当没传，不报错 —— 手改 URL 不该白屏。
  const lesson = query.lesson && lessonRef(query.lesson) ? query.lesson : undefined;
  const lessonInfo = lesson ? lessonRef(lesson) : undefined;

  // 【为什么要有 base】
  // 按课文筛选时，「全部 105」「node 18」这些数字全是全站的，而列表里只有 12 道。
  // 分母和列表不是同一批东西，读起来就是错的。所以筛选按钮和「N / M」
  // 一律以当前基准集为分母：没筛课文时是全库，筛了就是这一节。
  const base = lesson ? all.filter((q) => q.lessonId === lesson) : all;

  const matched = base.filter((q) => {
    if (track !== "all" && q.track !== track) return false;
    if (kw && !drillMatchesKeyword(kw, q)) return false;
    return true;
  });

  // mark 生效时不分页：服务端不知道谁符合，算出来的页码只会是错的
  const paging = markFilter === "all";
  const pages = paging ? Math.max(1, Math.ceil(matched.length / DRILL_PAGE)) : 1;
  const page = paging ? Math.min(Math.max(1, Number(query.page ?? "1") || 1), pages) : 1;
  const visible = paging ? matched.slice((page - 1) * DRILL_PAGE, page * DRILL_PAGE) : matched;

  // 全库时直接用现成的统计；筛了课文就从 base 现算，并且只列真的出现过的方向
  // （一节课通常只覆盖两三个方向，把 0 的也排出来是纯噪音）。
  const counts = lesson
    ? TRACK_ORDER.map((t) => ({ track: t, count: base.filter((q) => q.track === t).length })).filter(
        (c) => c.count > 0,
      )
    : drillTrackCounts();

  const trackLabel = track === "all" ? undefined : TRACK_LABEL[track];

  return (
    // 四个模式列表页一律 data-rail="off"：一个容器宽度、一条左对齐轴。
    // 原来右栏那块「这些题从哪来」搬到页尾的安静分区里了。
    <main className="main" data-rail="off">
      {/* 记下「Review 模式里我上次在哪」—— 顶栏的「继续」和 Review 侧栏的
          方向高亮都读这一条。href 带上当前 query，所以侧栏不用去读 URL
          （在根 layout 的客户端组件里读 query 会让 252 个静态页面构建失败，
          见 components/recent.tsx）。 */}
      <NoteRecent
        mode="review"
        href={drillListHref(query, {})}
        title="八股题库"
        titleEn="Interview drills"
        sub={trackLabel ? `${trackLabel.zh} 方向` : "全部方向"}
        subEn={trackLabel ? trackLabel.en : "All topics"}
      />
      <div className="content">
        <div className="ui-page mode-page">
          <div className="ui-head">
            <div className="ui-eyebrow">
              <T zh="八股题库" en="Question bank" />
            </div>
            <h1 className="ui-h1">
              <T zh={`${all.length} 道问答题，一道一卡`} en={`${all.length} questions, one card each`} />
            </h1>
            <p className="ui-lede">
              <T
                zh="默认只显示问题 —— 先自己在心里答一遍，再展开对答案。答不上来就标「不会」，下次抽认卡会先抽它。"
                en="Only the question shows by default. Answer it in your head first, then open the answer. Mark the ones you miss; the flashcard round puts those first."
              />
            </p>
          </div>

          {/* 侧栏点进来的「这一节的八股题」。
              必须给一条回全库的路 —— 不然筛完就出不去了，只能按后退。 */}
          {lessonInfo && (
            <div className="lesson-scope">
              <span className="lesson-scope-label">
                <T zh="只看这一节" en="One lesson only" />
              </span>
              <Link href={lessonPath(lessonInfo.examId, lesson!)}>{lessonInfo.title}</Link>
              <span className="lesson-scope-n tabular">
                <T zh={`${base.length} 道`} en={`${base.length} questions`} />
              </span>
              <Link className="lesson-scope-clear" href={drillListHref({}, {})}>
                <T zh={`看全部 ${all.length} 道 →`} en={`All ${all.length} questions →`} />
              </Link>
            </div>
          )}

          <PlanStripSlot mode="review" />

          <DrillProgressStrip total={all.length} />

          {/* 收起来：这段第一次读有用，回头客每次都得跨过它。
              实测这一页在卡片之上堆了 713px 的前置块，900px 视口下一道题都看不到。
              纯 <details>，零 JS。 */}
          <details className="callout callout-fold" data-tone="transfer">
            <summary className="callout-title callout-fold-head">
              <T zh="标记不是打分，是给下一轮排队" en="Marks are a queue, not a score" />
            </summary>
            <p style={{ marginBottom: 0, marginTop: 8 }}>
              <T
                zh={
                  <>
                    标「不会」的题会排到抽认卡最前面，标「会」的进低频池排最后。所以别客气 ——
                    觉得答得磕磕巴巴就标「模糊」。准备好了就去<Link href="/drill/session">抽认卡</Link>。
                  </>
                }
                en={
                  <>
                    &ldquo;No idea&rdquo; jumps to the front of the next round; &ldquo;got it&rdquo; drops to the back.
                    So be honest — if it came out shaky, mark it shaky. Then go{" "}
                    <Link href="/drill/session">run a flashcard round</Link>.
                  </>
                }
              />
            </p>
          </details>

          <Ladder current="drill" />

          {/* 筛选 / 动作行。四页共用同一个 .ui-toolbar：同一个高度、同一个圆角。
              搜索框留在外面 —— 侧栏里没有它，而按编号查题（`#279`）是这一页
              最常用的动作之一。

              【方向和掌握状态收起来了】
              这两维现在也在 Review 模式的侧栏里。两处并列摊开就是同一个控件
              在一屏里出现两遍。
              但**不能删**：窄屏侧栏在抽屉后面，删了就得先开抽屉才能筛；
              而且这里的掌握状态比侧栏细（侧栏把「模糊 + 不会」并成「要复习」，
              这里还能单独筛某一档）。
              所以收进一个 <details>，有筛选生效时自动展开（open 在服务端算）。 */}
          <div className="ui-toolbar">
            <span className="filter-label">
              <T zh="找一道题" en="Find one" />
            </span>
            <DrillSearchBox query={query} />

            <details className="filters-more" open={track !== "all" || markFilter !== "all"}>
              <summary className="filters-more-head">
                <T zh="按方向、掌握状态筛" en="Filter by topic and mark" />
                {(track !== "all" || markFilter !== "all") && (
                  <span className="filters-more-on">
                    {[
                      track !== "all"
                        ? { id: track, zh: TRACK_LABEL[track].zh, en: TRACK_LABEL[track].en }
                        : null,
                      markFilter !== "all"
                        ? MARK_FILTERS.find((m) => m.id === markFilter) ?? null
                        : null,
                    ]
                      .filter(Boolean)
                      .map((x) => (
                        // 每项自己套一个 span —— 两个 <T> 直接相邻会渲染成
                        // 「ReactShaky」（双语机制把两份文字都放进 HTML，
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
                  <T zh="方向" en="Track" />
                </span>
                <Link
                  className="filter-btn"
                  data-on={track === "all"}
                  href={drillListHref(query, { track: "all", page: "1" })}
                >
                  <T zh={`全部 ${base.length}`} en={`All ${base.length}`} />
                </Link>
                {counts.map((c) => (
                  <Link
                    key={c.track}
                    className="filter-btn"
                    data-on={track === c.track}
                    href={drillListHref(query, { track: c.track, page: "1" })}
                  >
                    <T zh={TRACK_LABEL[c.track].zh} en={TRACK_LABEL[c.track].en} /> {c.count}
                  </Link>
                ))}
              </div>

              <div className="filters">
                <span className="filter-label">
                  <T zh="掌握状态" en="Mark" />
                </span>
                {MARK_FILTERS.map((m) => (
                  <Link
                    key={m.id}
                    className="filter-btn"
                    data-on={markFilter === m.id}
                    href={drillListHref(query, { mark: m.id, page: "1" })}
                  >
                    <T zh={m.zh} en={m.en} />
                  </Link>
                ))}
              </div>
            </details>
          </div>

          <div className="ui-sec">
            <div className="ui-sec-head">
              <h2 className="ui-sec-title">
                <T zh="题目" en="Questions" />
              </h2>
              <DrillListStatus
                ids={visible.map((q) => q.id)}
                matched={matched.length}
                total={base.length}
                markFilter={markFilter}
                page={page}
                pages={pages}
              />
            </div>

            {matched.length === 0 ? (
              <div className="ui-empty">
                <span className="ui-empty-title">
                  <T zh="这里没有题" en="Nothing here" />
                </span>
                <T
                  zh={
                    kw
                      ? `没有题面或编号能对上「${kw}」。换个词试试，或者直接输题库编号。`
                      : "这个组合下没有题。"
                  }
                  en={kw ? `Nothing matches “${kw}”. Try another word, or a bank number.` : "Nothing matches."}
                />
              </div>
            ) : (
              <>
                <DrillEmptyIfNone ids={visible.map((q) => q.id)} markFilter={markFilter} />

                <div className="drill-cards">
                  {visible.map((q) => (
                    <DrillCard key={q.id} id={q.id} markFilter={markFilter}>
                      <DrillAnswer q={q} scope="list" />
                    </DrillCard>
                  ))}
                </div>

                {pages > 1 && (
                  <nav className="pager" aria-label="分页 / Pagination">
                    {page > 1 ? (
                      <Link className="btn btn-sm" href={drillListHref(query, { page: String(page - 1) })}>
                        <T zh="← 上一页" en="← Prev" />
                      </Link>
                    ) : (
                      <span />
                    )}
                    <span className="pager-nums">
                      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                        <Link
                          key={n}
                          className="pager-num"
                          data-on={n === page || undefined}
                          href={drillListHref(query, { page: String(n) })}
                        >
                          {n}
                        </Link>
                      ))}
                    </span>
                    {page < pages ? (
                      <Link className="btn btn-sm" href={drillListHref(query, { page: String(page + 1) })}>
                        <T zh="下一页 →" en="Next →" />
                      </Link>
                    ) : (
                      <span />
                    )}
                  </nav>
                )}
              </>
            )}
          </div>

          {/* 【右栏没了】四页统一 data-rail="off"，所以原来右栏那块
              「这些题从哪来」落到页尾这个明显低一档的分区里
              （.ui-sec[data-quiet] 会把标题压小、压淡）。
              它是这一页独有的信息，侧栏装不下也不该装。 */}
          <div className="ui-sec" data-quiet>
            <div className="ui-sec-head">
              <h2 className="ui-sec-title">
                <T zh="这些题从哪来" en="Where these come from" />
              </h2>
            </div>
            <span className="ui-sec-note">
              <T
                zh="99 道来自面试题库 #269–#387；TypeScript 深度那 6 道是 DrillLab 自出的（senior 补强，卡片上有标注）。答案都是 DrillLab 写的，所以讲解里的代码块一律标「示意」。每道题都能点回它出处的那一节课。"
                en="99 questions come from the interview bank (#269–#387); the 6 TypeScript deep-dive ones are DrillLab-made (marked on the card). All answers are written by DrillLab, so every code block here is labelled “demo”. Each card links back to the lesson it came from."
              />
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
