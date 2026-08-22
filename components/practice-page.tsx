// 练习场 —— 服务端组件。
//
// 【为什么改成服务端 + URL 参数筛选】
// 这一页要遍历全站 103 个练习。以前它是 "use client" 并 import registry，
// 于是全部课程内容都被打进客户端包。改成服务端之后：
//   · 筛选条件放在 URL 里（?exam=&kind=&level=&page=），按钮就是普通链接
//   · 只渲染当前这一批（12 个），payload 小
//   · 顺带得到「筛选状态可以分享、可以后退」这个好处
// 代价是点筛选会走一次导航，不是纯前端瞬时切换 —— 对这个页面是可以接受的。

import Link from "next/link";
import { NAV } from "@/content/nav";
import { T } from "./t";
import { allExercises, lessonPath } from "@/content/registry";
import type { Exercise } from "@/content/types";
import { ExerciseView } from "./exercise";
import { Ladder } from "./ladder";
import { PracticeFocus } from "./practice-focus";
import { PracticeProgress } from "./practice-progress";
import { PlanStripSlot } from "./plan-slots";
import { NoteRecent } from "./recent";
import { KIND_LABEL } from "@/lib/exercise-labels";
// 筛选链接的拼法在 lib/list-query.ts —— Practice 模式的侧栏是客户端组件，
// 它也要拼同样的链接，而它不能 import 这个文件（会把练习正文拖进客户端包）。
import { practiceHref, type PracticeQuery } from "@/lib/list-query";

export type { PracticeQuery };

// 筛选器的题型标签**从 lib/exercise-labels.ts 派生**，不在这里抄第二份 ——
// 抄一份出来就会出现「筛选器叫写整块、题头叫别的」。
const KINDS: { id: Exercise["kind"] | "all"; zh: string; en: string }[] = [
  { id: "all", zh: "全部类型", en: "All kinds" },
  ...(Object.entries(KIND_LABEL) as [Exercise["kind"], { zh: string; en: string }][]).map(
    ([id, l]) => ({ id, zh: l.zh, en: l.en }),
  ),
];

const LEVELS: { id: string; zh: string; en: string }[] = [
  { id: "all", zh: "全部难度", en: "All levels" },
  { id: "1", zh: "L1", en: "L1" },
  { id: "2", zh: "L2", en: "L2" },
  { id: "3", zh: "L3", en: "L3" },
  { id: "4", zh: "L4", en: "L4" },
];

const PAGE = 12;

export function PracticePage({ query }: { query: PracticeQuery }) {
  const exam = query.exam ?? "all";
  const kind = query.kind ?? "all";
  const level = query.level ?? "all";
  const page = Math.max(1, Number(query.page ?? "1") || 1);

  const all = allExercises();
  const shown = all.filter((r) => {
    if (exam !== "all" && r.exam.id !== exam) return false;
    if (kind !== "all" && r.exercise.kind !== kind) return false;
    if (level !== "all" && String(r.exercise.level) !== level) return false;
    return true;
  });

  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const current = Math.min(page, pages);
  const visible = shown.slice((current - 1) * PAGE, current * PAGE);

  const scoped = exam === "all" ? undefined : NAV.find((e) => e.id === exam);

  return (
    <main className="main">
      {/* Practice 模式里的落点。href 带上全部筛选条件 ——
          Practice 侧栏靠它给筛选项打高亮（见 components/recent.tsx）。 */}
      <NoteRecent
        mode="practice"
        href={practiceHref(query, {})}
        title="课内练习"
        titleEn="Lesson exercises"
        sub={scoped ? scoped.shortTitle : "全部课程"}
        subEn={scoped ? (scoped.shortTitleEn ?? scoped.shortTitle) : "All courses"}
      />
      <div className="content">
        <div className="page-head">
          <div className="eyebrow">
            <T en="Practice" zh="练习" />
          </div>
          <h1 className="page-title display">
            <T en="Get your hands on it" zh="动手做" />
          </h1>
          {/* 【第三轮改动】这一句原来是「全站 123 个练习都在这里，可以按考试、
              难度、类型筛」—— 先说的是「怎么筛」，等于让人先学分类。
              现在先说清「练习的正常入口在课文页尾，这一页是集中刷题时才来的」。
              见 docs/ia-audit-round3.md 线索 4。 */}
          <p className="page-lede">
            <T
              en={
                <>
                  <strong>
                    Practice follows the lessons — every lesson ends with the
                    exercises for that lesson.
                  </strong>{" "}
                  This page is the whole library, for when you want to drill in one
                  sitting. Each exercise names the lesson it came from, so you can go
                  back when you stall.
                </>
              }
              zh={
                <>
                  <strong>练习跟着课文走 —— 每节课尾都有本课的练习。</strong>
                  这一页是全部练习的总库，想集中刷题的时候来。
                  每个练习都写清了它来自哪一节，卡住了就回去看那一节。
                </>
              }
            />
          </p>
        </div>

        {/* 四档在这里只出现一次，且**完整解释在 components/ladder.tsx 里**，
            这一页不重讲。

            【第三轮删掉的东西】这下面原来还有一整块「按难度往上走，别停在 L2」的
            callout，把 L1 / L2 / L3 / Debug Lab / L4 五个档逐个解释了一遍。
            删掉的原因不是它写得不好，是它构成了**第二套需要用户学习的分类体系**：
            四档（说得出/认得出/写得对/空手做）已经在首页和 Ladder 里立住了，
            再叠一套 L1–L4，加上右栏的六种「练习类型」，新用户面对的是
            4 档 × 4 级 × 6 类的选择矩阵 —— 分类学本身变成了要先学的内容。
            更糟的是「认出来」在 L1 里指一个难度档、在练习类型里指一种题型，
            同名不同义。

            L1–L4 没有从数据模型里删（Exercise.level 还在用，难度筛选也还需要它），
            只是不再作为一套世界观去解释 —— 它现在只是筛选器上的刻度。
            见 docs/ia-audit-round3.md。 */}
        <PlanStripSlot mode="practice" />

        <Ladder current="exercises" />

        {/* 【三维一起收起来】
            课程 / 难度 / 题型这三维现在也在 Practice 模式的侧栏里。
            两处并列摊开就是同一个控件在一屏里出现两遍。
            但**不能删**：窄屏侧栏在抽屉后面，删了就得先开抽屉才能筛。
            所以三排一起收进这个 <details>；有筛选生效时自动展开
            （open 由 URL 参数在服务端算出来），不会「筛完看不到自己筛了什么」。

            原来「考试」那一排是摊开的、另两排收着 —— 现在侧栏已经把常用
            那一维摆在眼前了，页面这份只需要在你想改的时候点一下。

            【难度保留 L1–L4】它只是筛选器上的刻度，不是第二套世界观 ——
            含义一行挂到四档语言上（见 docs/ia-audit-round3.md）。 */}
        <details
          className="filters-more"
          open={exam !== "all" || level !== "all" || kind !== "all"}
        >
          <summary className="filters-more-head">
            <T en="Filter these" zh="筛一下" />
            {(exam !== "all" || level !== "all" || kind !== "all") && (
              <span className="filters-more-on">
                {[
                  exam !== "all"
                    ? (() => {
                        const e = NAV.find((x) => x.id === exam);
                        return e ? { id: e.id, zh: e.shortTitle, en: e.shortTitleEn ?? e.shortTitle } : null;
                      })()
                    : null,
                  level !== "all" ? LEVELS.find((l) => l.id === level) : null,
                  kind !== "all" ? KINDS.find((k) => k.id === kind) : null,
                ]
                  .filter(Boolean)
                  .map((x) => (
                    // 每项自己套一个 span —— 两个 <T> 直接相邻会渲染成
                    // 「L3Debug Lab」（双语机制把两份文字都放进 HTML，
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
              <T en="Course" zh="课程" />
            </span>
            <Link
              className="filter-btn"
              data-on={exam === "all"}
              href={practiceHref(query, { exam: "all", page: "1" })}
            >
              <T en="All" zh="全部" />
            </Link>
            {NAV.map((e) => (
              <Link
                key={e.id}
                className="filter-btn"
                data-on={exam === e.id}
                href={practiceHref(query, { exam: e.id, page: "1" })}
              >
                <T zh={e.shortTitle} en={e.shortTitleEn} />
              </Link>
            ))}
          </div>

          <div className="filters">
            <span className="filter-label">
              <T en="Level" zh="难度" />
              <span className="filter-hint">
                <T
                  en="L1 → L4: the same idea as the four tiers above — less is handed to you"
                  zh="L1 → L4 和上面四档同一个意思：给你的东西越来越少"
                />
              </span>
            </span>
            {LEVELS.map((l) => (
              <Link
                key={l.id}
                className="filter-btn"
                data-on={level === l.id}
                href={practiceHref(query, { level: l.id, page: "1" })}
              >
                <T en={l.en} zh={l.zh} />
              </Link>
            ))}
          </div>

          <div className="filters">
            <span className="filter-label">
              <T en="Kind" zh="类型" />
            </span>
            {KINDS.map((k) => (
              <Link
                key={k.id}
                className="filter-btn"
                data-on={kind === k.id}
                href={practiceHref(query, { kind: k.id, page: "1" })}
              >
                <T en={k.en} zh={k.zh} />
              </Link>
            ))}
          </div>
        </details>

        {/* 有进度的人不看全站平铺 —— 这个小岛只换 URL，内容仍在服务端。
            见 components/practice-focus.tsx 的注释。 */}
        <PracticeFocus activeExam={exam} />

        <p className="dim" style={{ fontSize: 14.5 }}>
          <T
            en={`Showing ${shown.length}${
              shown.length !== all.length ? ` of ${all.length}` : ""
            }${pages > 1 ? ` · page ${current} / ${pages}` : ""}.`}
            zh={`筛出 ${shown.length} 个练习${
              shown.length !== all.length ? `（共 ${all.length} 个）` : ""
            }${pages > 1 ? ` · 第 ${current} / ${pages} 页` : ""}。`}
          />
        </p>

        {shown.length === 0 ? (
          <p className="empty">
            <T
              en="No exercises match that combination. Loosen a filter."
              zh="这个组合下没有练习。换个筛选条件试试。"
            />
          </p>
        ) : (
          <>
            {visible.map((r) => (
              <div key={`${r.exam.id}-${r.exercise.id}`}>
                <span className="ex-origin">
                  <T en="From" zh="来自" />{" "}
                  <Link href={lessonPath(r.exam.id, r.lesson.id)}>
                    <T zh={r.lesson.title} en={r.lesson.titleEn} />
                  </Link>
                  <span className="crumb-sep"> · </span>
                  <T zh={r.exam.shortTitle} en={r.exam.shortTitleEn} />
                </span>
                <ExerciseView ex={r.exercise} examId={r.exam.id} />
              </div>
            ))}

            {pages > 1 && (
              <nav aria-label="分页 / Pagination" className="pager">
                {current > 1 ? (
                  <Link
                    className="btn btn-sm"
                    href={practiceHref(query, { page: String(current - 1) })}
                  >
                    ← <T en="Previous" zh="上一页" />
                  </Link>
                ) : (
                  <span />
                )}
                <span className="pager-nums">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                    <Link
                      key={n}
                      className="pager-num"
                      data-on={n === current || undefined}
                      href={practiceHref(query, { page: String(n) })}
                    >
                      {n}
                    </Link>
                  ))}
                </span>
                {current < pages ? (
                  <Link
                    className="btn btn-sm"
                    href={practiceHref(query, { page: String(current + 1) })}
                  >
                    <T en="Next" zh="下一页" /> →
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        )}
      </div>

      {/* 「练习类型」那一块搬走了 —— Practice 模式的侧栏里就是这份清单，
          而且那份带筛选状态。右栏只留「你做对过多少」。 */}
      <aside className="rail">
        <PracticeProgress total={all.length} />
      </aside>
    </main>
  );
}
