"use client";

// 抽认卡 —— 客户端组件（要键盘、要计数、要写 localStorage）。
//
// ============================================================
// 【正文是怎么进来的】—— 这是这一页最要紧的一件事
// ============================================================
// 答案正文带 JSX，客户端组件不许 import content/drills。
// 所以 app/drill/session/page.tsx 是**服务端**页面：它按 URL 上的 ids
// 把那几道题的答案渲染好，作为 cards={[{ id, body: ReactNode }]} 传进来。
// 这些 body 走 RSC payload，不进 JS 包。
//
// 【为什么范围（ids）在 URL 上，而不是进来之后再选】
// 一次把 99 道题的正文全塞进这一页，HTML 会很大（六个 iv-*.tsx 源文件
// 加起来 391 KB，问答正文占大头），而一轮实际只看十几张。
// 所以流程反过来：
//   1. /drill/session 不带参数 = 选范围页，**一道正文都不发**；
//   2. 选好范围（含「模糊 + 不会」这种只有浏览器知道的范围）之后，
//      客户端把算好的题目 id 列表拼进 URL 再导航；
//   3. 服务端只渲染这些 id 的正文。
// 顺带三个好处：顺序也在 URL 里（服务端按 URL 顺序渲染，SSR 与客户端
// 首帧完全一致，没有 hydration 不一致的风险）、刷新能恢复、能分享。
//
// 【复习调度就一条规则，不做 SM-2】
// 排序桶：不会 → 模糊 → 还没做 → 会（低频池排最后）；
// 同一桶里「上次自评时间越早的排前面」，时间相同回落到题库顺序。
// 就这样。SM-2 那套间隔算法在这里没有可验证的行为，不做。

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DRILLS,
  DRILL_TRACK_LABEL,
  DRILL_TRACK_ORDER,
  drillPath,
  type NavDrill,
  type NavDrillTrack,
} from "@/content/nav";
import { useLocale } from "@/lib/locale";
import { useProgress, type DrillMark, type DrillRecord } from "@/lib/progress";
import { MARK_BY_ID, MARK_META, DrillMarks } from "./drill-marks";
import { T } from "./t";

/** 服务端渲染好的一张卡 */
export interface DrillCardData {
  id: string;
  body: ReactNode;
}

const META = new Map<string, NavDrill>(DRILLS.map((d) => [d.id, d]));

/** 一轮做到哪了 —— 只是 UI 状态，刷新能接上就够，所以放 sessionStorage */
const ROUND_KEY = "drilllab-drill-round";

interface RoundMark {
  search: string;
  i: number;
  total: number;
}

/* ============================================================
   排序
   ============================================================ */

/** 排序桶。数字越小越先复习 */
const BUCKET: Record<DrillMark | "untouched", number> = {
  unknown: 0,
  fuzzy: 1,
  untouched: 2,
  known: 3,
};

function reviewOrder(ids: string[], recs: Record<string, DrillRecord>) {
  const natural = new Map(ids.map((id, i) => [id, i]));
  return [...ids].sort((a, b) => {
    const ba = BUCKET[recs[a]?.mark ?? "untouched"];
    const bb = BUCKET[recs[b]?.mark ?? "untouched"];
    if (ba !== bb) return ba - bb;
    // 同一桶：上次自评越久的排前面（没自评过的算 0，也就是最久）
    const ta = recs[a]?.at ?? 0;
    const tb = recs[b]?.at ?? 0;
    if (ta !== tb) return ta - tb;
    return (natural.get(a) ?? 0) - (natural.get(b) ?? 0);
  });
}

/** Fisher–Yates。只在点击事件和 effect 里调，不在渲染期调 */
function shuffled(ids: string[]) {
  const a = [...ids];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ============================================================
   选范围
   ============================================================ */

type Scope = "all" | "weak" | "fresh" | `track:${NavDrillTrack}`;

function poolOf(scope: Scope, recs: Record<string, DrillRecord>): string[] {
  if (scope === "all") return DRILLS.map((d) => d.id);
  if (scope === "weak") {
    return DRILLS.filter((d) => {
      const m = recs[d.id]?.mark;
      return m === "fuzzy" || m === "unknown";
    }).map((d) => d.id);
  }
  if (scope === "fresh") return DRILLS.filter((d) => !recs[d.id]).map((d) => d.id);
  const track = scope.slice("track:".length) as NavDrillTrack;
  return DRILLS.filter((d) => d.track === track).map((d) => d.id);
}

function sessionHref(scope: Scope, ids: string[], random: boolean) {
  const p = new URLSearchParams();
  p.set("scope", scope);
  if (random) p.set("random", "1");
  p.set("ids", ids.join(","));
  return `/drill/session?${p.toString()}`;
}

function SessionSetup({ emptyScope }: { emptyScope?: string }) {
  const router = useRouter();
  const { data, ready } = useProgress();
  const [scope, setScope] = useState<Scope>("all");
  const [random, setRandom] = useState(false);
  const [resume, setResume] = useState<RoundMark | null>(null);

  // 上一轮做到哪了 —— 同一个标签页里退出再回来能接上
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(ROUND_KEY);
      if (!raw) return;
      const r = JSON.parse(raw) as RoundMark;
      if (r && typeof r.i === "number" && typeof r.search === "string" && r.i < r.total) {
        setResume(r);
      }
    } catch {
      /* 读不到就当没有 */
    }
  }, []);

  const counts = useMemo(() => {
    const recs = data.drills;
    return {
      all: DRILLS.length,
      weak: poolOf("weak", recs).length,
      fresh: poolOf("fresh", recs).length,
    };
  }, [data.drills]);

  const pool = ready ? poolOf(scope, data.drills) : [];

  const start = () => {
    const ids = random ? shuffled(pool) : reviewOrder(pool, data.drills);
    if (ids.length === 0) return;
    router.push(sessionHref(scope, ids, random));
  };

  const num = (n: number) => (ready ? String(n) : "—");

  const options: { id: Scope; zh: string; en: string; note?: ReactNode; n: string }[] = [
    {
      id: "all",
      zh: "全部题目",
      en: "Everything",
      n: num(counts.all),
      note: (
        <T
          zh="按复习优先级排：不会的在最前，会的在最后"
          en="Ordered by priority: misses first, solid ones last"
        />
      ),
    },
    {
      id: "weak",
      zh: "只抽模糊 + 不会",
      en: "Only shaky + missed",
      n: num(counts.weak),
      note: <T zh="上考场前一晚就抽这一堆" en="This is the pile to run the night before" />,
    },
    {
      id: "fresh",
      zh: "只抽还没做过的",
      en: "Only unseen",
      n: num(counts.fresh),
    },
  ];

  return (
    <main className="main" data-rail="off">
      <div className="content">
        <div className="page-head">
          <div className="eyebrow">
            <T zh="抽认卡" en="Flashcards" />
          </div>
          <h1 className="page-title">
            <T zh="先选范围" en="Pick a range" />
          </h1>
          <p className="page-lede">
            <T
              zh="一次一题，先只给问题。心里答完再翻面，然后诚实自评 —— 自评结果直接决定下一轮先抽谁。"
              en="One question at a time, question side first. Answer it in your head, flip, then rate yourself honestly — that rating decides what comes first next round."
            />
          </p>
        </div>

        {emptyScope && (
          <div className="callout" data-tone="warn">
            <strong className="callout-title">
              <T zh="这个范围现在是空的" en="That range is empty right now" />
            </strong>
            <p style={{ marginBottom: 0 }}>
              <T
                zh="没有题目能对上刚才那个范围（可能是标记被清空了，或者链接里的题目 id 已经不存在）。重新选一个吧。"
                en="Nothing matched that range — marks may have been cleared, or the ids in the link no longer exist. Pick again."
              />
            </p>
          </div>
        )}

        {resume && (
          <div className="callout" data-tone="note">
            <strong className="callout-title">
              <T zh="上一轮还没做完" en="You left a round unfinished" />
            </strong>
            <p style={{ marginBottom: 0 }}>
              <T
                zh={`做到第 ${resume.i + 1} / ${resume.total} 题。`}
                en={`You were on card ${resume.i + 1} of ${resume.total}.`}
              />{" "}
              <Link href={`/drill/session${resume.search}`}>
                <T zh="接着做 →" en="Resume →" />
              </Link>
            </p>
          </div>
        )}

        <div className="minihead">
          <T zh="范围" en="Range" />
        </div>
        <div className="dsess-scopes">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              className="dsess-scope"
              data-on={scope === o.id || undefined}
              aria-pressed={scope === o.id}
              onClick={() => setScope(o.id)}
            >
              <span className="dsess-scope-name">
                <T zh={o.zh} en={o.en} />
              </span>
              <span className="dsess-scope-n tabular">{o.n}</span>
              {o.note && <span className="dsess-scope-note">{o.note}</span>}
            </button>
          ))}
        </div>

        <div className="minihead">
          <T zh="或者只抽一个方向" en="Or a single topic" />
        </div>
        <div className="filters" style={{ borderBottom: 0, marginBottom: 14 }}>
          {DRILL_TRACK_ORDER.map((t) => {
            const id: Scope = `track:${t}`;
            const n = DRILLS.filter((d) => d.track === t).length;
            return (
              <button
                key={t}
                type="button"
                className="filter-btn"
                data-on={scope === id}
                aria-pressed={scope === id}
                onClick={() => setScope(id)}
              >
                <T zh={DRILL_TRACK_LABEL[t].zh} en={DRILL_TRACK_LABEL[t].en} /> {n}
              </button>
            );
          })}
        </div>

        <label className="dsess-check">
          <input type="checkbox" checked={random} onChange={(e) => setRandom(e.target.checked)} />
          <span>
            <T zh="随机顺序" en="Shuffle" />
            <span className="dimmer" style={{ fontSize: "var(--fs-meta)" }}>
              {" "}
              <T
                zh="（不勾就按复习优先级排）"
                en="(off = review priority order)"
              />
            </span>
          </span>
        </label>

        <div className="dsess-start">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!ready || pool.length === 0}
            aria-describedby={pool.length === 0 ? "dsess-why-disabled" : undefined}
            onClick={start}
          >
            <T
              zh={ready ? `开始（${pool.length} 张）` : "读取标记中…"}
              en={ready ? `Start (${pool.length} cards)` : "Loading marks…"}
            />
          </button>
          {ready && pool.length === 0 && (
            <span className="why-disabled" id="dsess-why-disabled">
              <T
                zh="这个范围下一道题都没有 —— 换一个范围"
                en="No cards in this range — pick another"
              />
            </span>
          )}
          <Link className="btn btn-ghost" href="/drill">
            <T zh="回题库" en="Back to the bank" />
          </Link>
        </div>

        <p className="dimmer" style={{ fontSize: "var(--fs-meta)", marginTop: 20 }}>
          <T
            zh="键盘全程可用：空格翻面，1 / 2 / 3 自评，← → 前后翻，Esc 退出。"
            en="Keyboard throughout: space flips, 1 / 2 / 3 rate, ← → move, Esc exits."
          />
        </p>
      </div>
    </main>
  );
}

/* ============================================================
   一轮的结果
   ============================================================ */

function RoundResult({
  order,
  tally,
  onAgain,
}: {
  order: string[];
  tally: Record<string, DrillMark>;
  onAgain: (ids: string[]) => void;
}) {
  const rated = order.filter((id) => tally[id]);
  const of = (m: DrillMark) => rated.filter((id) => tally[id] === m);
  const missed = of("unknown");
  const shaky = of("fuzzy");

  return (
    <main className="main" data-rail="off">
      <div className="content">
        <div className="page-head">
          <div className="eyebrow">
            <T zh="这一轮结束" en="Round done" />
          </div>
          <h1 className="page-title">
            <T zh={`过了 ${order.length} 张，自评了 ${rated.length} 张`} en={`${order.length} cards, ${rated.length} rated`} />
          </h1>
          <p className="page-lede">
            <T
              zh="自评已经存进这台浏览器了。下一轮再来时，「不会」的会排在最前面。"
              en="Your ratings are saved in this browser. Next round puts the missed ones first."
            />
          </p>
        </div>

        <div className="dsess-tally">
          {MARK_META.map((m) => (
            <div key={m.id} className="dsess-tally-cell" data-kind={m.id}>
              <b className="tabular">{of(m.id).length}</b>
              <span>
                <T zh={m.zh} en={m.en} />
              </span>
            </div>
          ))}
          <div className="dsess-tally-cell" data-kind="untouched">
            <b className="tabular">{order.length - rated.length}</b>
            <span>
              <T zh="没评" en="Skipped" />
            </span>
          </div>
        </div>

        {missed.length > 0 && (
          <>
            <div className="minihead">
              <T zh="这些你标了「不会」" en="You marked these “no idea”" />
            </div>
            <ul className="dsess-missed">
              {missed.map((id) => {
                const meta = META.get(id);
                if (!meta) return null;
                return (
                  <li key={id}>
                    <Link href={drillPath(id)}>{meta.zh}</Link>
                    <span className="dimmer mono" style={{ fontSize: "var(--fs-meta)" }}>
                      {" "}
                      {meta.bank.map((n) => `#${n}`).join(" / ")}
                    </span>
                    <div className="dsess-missed-en" lang="en">
                      {meta.en}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <div className="dsess-start">
          {missed.length + shaky.length > 0 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onAgain([...missed, ...shaky])}
            >
              <T
                zh={`再过一遍这轮的不会 + 模糊（${missed.length + shaky.length} 张）`}
                en={`Redo the missed + shaky (${missed.length + shaky.length})`}
              />
            </button>
          )}
          <Link className="btn" href="/drill/session">
            <T zh="换个范围" en="Pick another range" />
          </Link>
          <Link className="btn btn-ghost" href="/drill">
            <T zh="回题库" en="Back to the bank" />
          </Link>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   一轮进行中
   ============================================================ */

type QLang = "both" | "zh" | "en";

function Round({ cards, search }: { cards: DrillCardData[]; search: string }) {
  const router = useRouter();
  const { locale } = useLocale();
  const { setDrillMark, drillMark, ready } = useProgress();

  const bodies = useMemo(() => new Map(cards.map((c) => [c.id, c.body])), [cards]);
  const [order, setOrder] = useState<string[]>(() => cards.map((c) => c.id));
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [tally, setTally] = useState<Record<string, DrillMark>>({});
  const [done, setDone] = useState(false);
  const [qLang, setQLang] = useState<QLang>("both");
  // 「再过一遍不会的」之后这一轮就不再对应 URL 了，位置不该再写进 sessionStorage
  const [derived, setDerived] = useState(false);

  const id = order[i];
  const meta = id ? META.get(id) : undefined;

  /* —— 刷新 / 退出后能接上：位置存 sessionStorage —— */
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(ROUND_KEY);
      if (!raw) return;
      const r = JSON.parse(raw) as RoundMark;
      if (r?.search === search && r.i > 0 && r.i < order.length) setI(r.i);
    } catch {
      /* 读不到就从头开始 */
    }
    // 只在挂载时恢复一次，之后 i 由用户操作决定
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      if (done) window.sessionStorage.removeItem(ROUND_KEY);
      else {
        const r: RoundMark = { search, i, total: order.length };
        window.sessionStorage.setItem(ROUND_KEY, JSON.stringify(r));
      }
    } catch {
      /* 隐私模式写不进去：只影响「接着做」，不影响这一轮 */
    }
  }, [done, i, order.length, search]);

  /* —— 操作 —— */

  const flip = useCallback(() => setFlipped((f) => !f), []);

  // 注意别在 setI 的 updater 里调 setDone —— updater 必须是纯函数，
  // StrictMode 下会跑两次。所以先算好再决定调哪个。
  const goNext = useCallback(() => {
    setFlipped(false);
    if (i + 1 >= order.length) setDone(true);
    else setI(i + 1);
  }, [i, order.length]);

  const goPrev = useCallback(() => {
    setFlipped(false);
    setI((prev) => Math.max(0, prev - 1));
  }, []);

  /** 记一笔这一轮的自评，然后自动进下一张。localStorage 由谁写见下面两处 */
  const record = useCallback(
    (mark: DrillMark) => {
      if (!id) return;
      setTally((t) => ({ ...t, [id]: mark }));
      // 用鼠标点完「会」之后焦点还留在那个按钮上，下一张再按空格就会
      // **再次触发这个按钮** —— 下一题被莫名标成「会」。
      // 所以进下一张之前先把焦点松开。
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      goNext();
    },
    [id, goNext],
  );

  /** 键盘走的这条路要自己写 localStorage（按钮那条由 <DrillMarks> 写） */
  const assess = useCallback(
    (mark: DrillMark) => {
      if (!id) return;
      setDrillMark(id, mark);
      record(mark);
    },
    [id, setDrillMark, record],
  );

  const exit = useCallback(() => router.push("/drill"), [router]);

  /* —— 键盘：全程可用 —— */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || el?.isContentEditable) return;

      // 空格：焦点在按钮上时让按钮自己响应，不然会翻两次
      if (e.key === " " || e.key === "Spacebar") {
        if (tag === "BUTTON" || tag === "SUMMARY" || tag === "A") return;
        e.preventDefault();
        flip();
        return;
      }
      if (e.key === "1") {
        e.preventDefault();
        assess("known");
      } else if (e.key === "2") {
        e.preventDefault();
        assess("fuzzy");
      } else if (e.key === "3") {
        e.preventDefault();
        assess("unknown");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape") {
        e.preventDefault();
        exit();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [assess, exit, flip, goNext, goPrev]);

  const again = (ids: string[]) => {
    // 「再过一遍」不重新导航：这些题的正文已经在这一页上了
    setOrder(ids);
    setI(0);
    setFlipped(false);
    setTally({});
    setDone(false);
  };

  if (done) return <RoundResult order={order} tally={tally} onAgain={again} />;

  if (!meta) {
    return (
      <main className="main" data-rail="off">
        <div className="content">
          <p className="empty">
            <T zh="这张卡的题面找不到了。" en="This card lost its question text." />
          </p>
          <Link href="/drill/session">
            <T zh="重新选范围 →" en="Pick a range again →" />
          </Link>
        </div>
      </main>
    );
  }

  const track = DRILL_TRACK_LABEL[meta.track];
  const saved = ready ? drillMark(id) : undefined;
  const savedMeta = saved ? MARK_BY_ID.get(saved) : undefined;
  const thisRound = tally[id];
  const en = locale === "en";

  return (
    <main className="main" data-rail="off">
      <div className="content dsess">
        <div className="dsess-top">
          <span className="dsess-n tabular">
            <T zh={`第 ${i + 1} / ${order.length} 张`} en={`${i + 1} / ${order.length}`} />
          </span>
          <span className="bar dsess-bar">
            <i style={{ width: `${((i + 1) / order.length) * 100}%` }} />
          </span>

          <span className="dsess-top-right">
            <span className="dsess-langs" role="group" aria-label={en ? "Question language" : "题面语言"}>
              {(
                [
                  { id: "both", zh: "中英", en: "Both" },
                  { id: "zh", zh: "中文", en: "中文" },
                  { id: "en", zh: "English", en: "English" },
                ] as { id: QLang; zh: string; en: string }[]
              ).map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className="dsess-lang"
                  data-on={qLang === l.id || undefined}
                  aria-pressed={qLang === l.id}
                  onClick={() => setQLang(l.id)}
                >
                  <T zh={l.zh} en={l.en} />
                </button>
              ))}
            </span>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                // 只打乱还没过的部分，已经过掉的不倒回来
                const head = order.slice(0, i + 1);
                setOrder([...head, ...shuffled(order.slice(i + 1))]);
              }}
            >
              <T zh="打乱剩下的" en="Shuffle rest" />
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={exit}>
              <T zh="退出" en="Exit" />
            </button>
          </span>
        </div>

        <article className="dsess-card">
          <div className="dsess-card-top">
            <span className="tag">
              <T zh={track.zh} en={track.en} />
            </span>
            <span className="drill-bank mono">{meta.bank.map((n) => `#${n}`).join(" / ")}</span>
            <span className="dsess-card-top-right">
              {thisRound && (
                <span className="tag" data-tone={MARK_BY_ID.get(thisRound)?.tone}>
                  <T
                    zh={`这轮标了：${MARK_BY_ID.get(thisRound)?.zh}`}
                    en={`This round: ${MARK_BY_ID.get(thisRound)?.en}`}
                  />
                </span>
              )}
              {!thisRound && savedMeta && (
                <span className="tag" data-tone={savedMeta.tone}>
                  <T zh={`上次：${savedMeta.zh}`} en={`Last time: ${savedMeta.en}`} />
                </span>
              )}
            </span>
          </div>

          {qLang !== "en" && <h2 className="dsess-q display">{meta.zh}</h2>}
          {qLang !== "zh" && (
            <p className="dsess-q-en" lang="en">
              {meta.en}
            </p>
          )}

          {flipped ? (
            <>
              <div className="dsess-answer">{bodies.get(id)}</div>
              <button type="button" className="btn btn-sm dsess-hide" onClick={flip}>
                <T zh="盖回去" en="Hide answer" />
              </button>
            </>
          ) : (
            <button type="button" className="dsess-flip" onClick={flip}>
              <span className="dsess-flip-main">
                <T zh="翻面看答案" en="Flip to the answer" />
              </span>
              <span className="dsess-flip-sub">
                <T
                  zh="先在心里把整段答案说完，再翻 —— 想不起来就是「不会」"
                  en="Say the whole answer out loud first. If it doesn’t come, that’s a miss."
                />
              </span>
            </button>
          )}
        </article>

        <div className="dsess-rate">
          <span className="strip-label">
            <T zh="自评（会自动进下一张）" en="Rate yourself (auto-advances)" />
          </span>
          <DrillMarks id={id} mode="set" showKeys onMarked={record} />
        </div>

        <div className="dsess-foot">
          <button type="button" className="btn btn-sm" disabled={i === 0} onClick={goPrev}>
            <T zh="← 上一张" en="← Previous" />
          </button>
          <button type="button" className="btn btn-sm" onClick={goNext}>
            {i + 1 >= order.length ? (
              <T zh="看结果 →" en="See results →" />
            ) : (
              <T zh="跳过 →" en="Skip →" />
            )}
          </button>
          <Link className="btn btn-sm btn-ghost" href={drillPath(id)}>
            <T zh="这道题的单题页" en="Open its own page" />
          </Link>
        </div>

        <div className="dsess-keys">
          <span>
            <kbd className="dsess-kbd">Space</kbd> <T zh="翻面" en="flip" />
          </span>
          <span>
            <kbd className="dsess-kbd">1</kbd>
            <kbd className="dsess-kbd">2</kbd>
            <kbd className="dsess-kbd">3</kbd> <T zh="会 / 模糊 / 不会" en="got it / shaky / no idea" />
          </span>
          <span>
            <kbd className="dsess-kbd">←</kbd>
            <kbd className="dsess-kbd">→</kbd> <T zh="前后翻" en="move" />
          </span>
          <span>
            <kbd className="dsess-kbd">Esc</kbd> <T zh="退出（自评已存）" en="exit (ratings saved)" />
          </span>
        </div>
      </div>
    </main>
  );
}

export function DrillSession({
  cards,
  scope,
  search,
}: {
  cards: DrillCardData[];
  scope?: string;
  search: string;
}) {
  if (cards.length === 0) return <SessionSetup emptyScope={scope} />;
  return <Round cards={cards} search={search} />;
}
