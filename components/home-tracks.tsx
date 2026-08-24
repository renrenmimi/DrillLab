"use client";

// 首页 —— 一张仪表盘，**不问任何问题**。
//
// 【为什么把「你想为什么做好准备？」删掉】
// 那一屏问的是一个长期承诺（三个答案分别是 42 / 15 / 若干小时），
// 而一个人今天打开这个站，最常见的念头是「我有二十分钟，让我刷点八股」。
// 那个意图在那一屏上一个入口都没有。
//
// 更糟的是它是一扇**单向门**：选中之后 `plan` 永远有值，那一屏再也回不来 ——
// 点 logo、点「今天」、手输 `/` 都回不去。
//
// 现在首页就是几条轨道的进度盘：你在每条上走到哪、点一下就接着上回那一节。
// 承诺是零。参考的是同一套壳的另外几个 app（DataData / AlgoAlgo / APIer /
// RedisVisual / AgentLab）—— 它们的首页从来不问你打算学多久。
//
// 【为什么读 track-manifest 而不是 content/nav】
// 这一页要的只有：课程名、一句话、按顺序排好的课文。nav 是 134 KB，
// 还带着模块结构、练习计数、八股与 coding 清单 —— 首屏用不上。
// 见 content/track-manifest.ts 顶部。

import Link from "next/link";
import { SURFACES, TRACKS, type Track } from "@/content/track-manifest";
import { useProgress } from "@/lib/progress";
import { trackCopy } from "@/lib/track-copy";
import { T } from "./t";

/** 这条轨道走到哪了，下一节是哪一节 */
function useTrackState(track: Track) {
  const { ready, lessonDone } = useProgress();
  if (!ready) return { done: 0, next: track.lessons[0], fresh: true };
  let done = 0;
  let next: Track["lessons"][number] | undefined;
  for (const l of track.lessons) {
    if (lessonDone(track.id, l.id)) done++;
    else if (!next) next = l;
  }
  return { done, next, fresh: done === 0 };
}

/**
 * 圆形仪表盘。
 *
 * 【为什么是环而不是条】五张卡并排时，横条读的是「长度」——五条长度不同的
 * 线要互相比较才看得出差别。环读的是「转了多少」，一眼就能对比，
 * 而且它把「几 / 几」放在了自己中间，不用再单独占一行。
 *
 * 实现要点：
 * ① 起点转到 12 点方向（-90deg），不然从 3 点开始转，读起来别扭；
 * ② 进度靠 stroke-dashoffset，所以变化时能走 --t-prog 的过渡；
 * ③ 走完了换成 --ok，并且中间那个数字换成一个对勾 —— 「9 / 9」要读一下才
 *    知道是满的，对勾一眼就是。计数仍然在 aria-label 里，不丢信息；
 * ④ 一格没走时不画弧，环底也细一档 —— 那时候这张卡该安静，
 *    有进度之后柠檬绿那道弧才是主角。
 */
function Dial({
  done,
  total,
  label,
}: {
  done: number;
  total: number;
  label: string;
}) {
  const R = 30;
  const C = 2 * Math.PI * R;
  const p = total > 0 ? done / total : 0;
  const complete = total > 0 && done === total;

  return (
    <span className="dial" role="img" aria-label={label}>
      <svg viewBox="0 0 72 72" aria-hidden>
        <circle className="dial-track" cx="36" cy="36" r={R} />
        {/* 一格都没走时**不画弧**。零长度的 dash 配 round 端帽在某些引擎里
            会渲染成一个小圆点，看着像「走了一点点」。 */}
        {done > 0 && (
          <circle
            className="dial-arc"
            data-complete={complete || undefined}
            cx="36"
            cy="36"
            r={R}
            style={{ strokeDasharray: C, strokeDashoffset: C * (1 - p) }}
          />
        )}
      </svg>

      <span className="dial-mid" aria-hidden>
        {complete ? (
          <svg className="dial-check" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 12.6 9.2 18 20 6.6"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <>
            <span className="dial-done">{done}</span>
            <span className="dial-total">/{total}</span>
          </>
        )}
      </span>
    </span>
  );
}

/** 分类标签的英文对照。中文来自 content/types.ts 的四个值 */
const CATEGORY_EN: Record<string, string> = {"基础": "Foundations", "前端": "Frontend", "后端": "Backend", "全栈": "Full stack"};

function TrackCard({ track }: { track: Track }) {
  const { done, next, fresh } = useTrackState(track);
  const total = track.lessons.length;
  const complete = done === total;
  const copy = trackCopy(track.id);

  // 走完了就指向课程总览（回头查用），否则指向下一节没读的
  const href = complete ? `/exams/${track.id}` : (next?.href ?? `/exams/${track.id}`);

  return (
    <li className="trk" data-wide={track.parallel || undefined}>
      <Link
        className="trk-hit"
        href={href}
        data-complete={complete || undefined}
        data-fresh={fresh || undefined}
      >
        <Dial
          done={done}
          total={total}
          label={
            complete
              ? `${track.zh}：${total} 节全部读完`
              : `${track.zh}：${total} 节读了 ${done} 节`
          }
        />

        <span className="trk-head">
          <span className="trk-cat">
            <T zh={track.category} en={CATEGORY_EN[track.category] ?? track.category} />
            {track.parallel && (
              <span className="trk-flag">
                <T zh="平行支线" en="Parallel" />
              </span>
            )}
          </span>
          <span className="trk-name display">
            <T zh={track.zh} en={track.en} />
          </span>
          {/* 手写的一句话（lib/track-copy.ts）。没写的分类退回课程简介 ——
              **不用 CSS 截断**，截断只会造出半截句子。 */}
          <span className="trk-blurb">
            <T zh={copy?.zh ?? track.blurbZh} en={copy?.en ?? track.blurbEn ?? track.blurbZh} />
          </span>
        </span>

        {/* 这一行就是「点了会去哪」。它是这张卡唯一的承诺，所以
            **不许省略号** —— 长标题换行到第二行，两行的高度四张卡都预留了，
            于是那条分隔线在同一排里落在同一条水平线上。 */}
        <span className="trk-next">
          {complete ? (
            <span className="trk-next-name">
              <T zh="这一类读完了 · 回头查" en="Finished — open it to look things up" />
            </span>
          ) : (
            <>
              <span className="trk-next-label">
                {fresh ? <T zh="从这里开始" en="Start here" /> : <T zh="接着读" en="Pick up at" />}
              </span>
              <span className="trk-next-name">
                <T zh={next!.zh} en={next!.en} />
              </span>
            </>
          )}
        </span>
      </Link>
    </li>
  );
}

/**
 * 除课文之外的几个练习面。
 *
 * 【为什么它们只有计数，没有进度条】
 * 「读到第几节」对课文成立，对它们不成立 —— 八股是按掌握状态排队的，
 * coding 是二十五道独立的题，考场是七场各自计时的考试。给它们画一条
 * 「走了百分之多少」的进度条是在编一个不存在的顺序。
 */
function Surfaces() {
  const { ready, data } = useProgress();
  const rated = ready ? Object.keys(data.drills).length : 0;
  const coded = ready ? Object.keys(data.coding).length : 0;
  const passed = ready
    ? Object.values(data.arena).filter((a) => a.some((x) => x.outcome === "passed")).length
    : 0;
  const mocked = ready ? Object.keys(data.mocks).length : 0;

  const rows = [
    {
      href: "/drill",
      zh: "八股题库",
      en: "Question bank",
      n: `${rated} / ${SURFACES.drills}`,
      subZh: "自评过的",
      subEn: "rated",
    },
    {
      href: "/practice",
      zh: "课内练习",
      en: "Lesson exercises",
      n: `${SURFACES.exercises}`,
      subZh: "题，散在各节课尾",
      subEn: "spread across the lessons",
    },
    {
      href: "/code",
      zh: "Coding 题",
      en: "Coding problems",
      n: `${coded} / ${SURFACES.coding}`,
      subZh: "做完的",
      subEn: "done",
    },
    {
      href: "/arena",
      zh: "考场",
      en: "Arena",
      n: `${passed} / ${SURFACES.arena}`,
      subZh: "通过的",
      subEn: "passed",
    },
    {
      href: "/mock",
      zh: "模拟考自评",
      en: "Mock scoring",
      n: `${mocked} / ${SURFACES.mocks}`,
      subZh: "记过分的",
      subEn: "scored",
    },
  ];

  return (
    <ul className="srf">
      {rows.map((r) => (
        <li key={r.href}>
          <Link className="srf-row" href={r.href}>
            <span className="srf-name">
              <T zh={r.zh} en={r.en} />
            </span>
            <span className="srf-n tabular">{r.n}</span>
            <span className="srf-sub">
              <T zh={r.subZh} en={r.subEn} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function HomeTracks() {
  const main = TRACKS.filter((t) => !t.parallel);
  const parallel = TRACKS.filter((t) => t.parallel);

  return (
    <>
      <section className="ui-sec trk-sec">
        <div className="ui-sec-head">
          <h2 className="ui-sec-title">
            <T zh="五个分类" en="Five categories" />
          </h2>
          <Link className="ui-quiet" href="/path">
            <T zh="看整条路线 →" en="See the whole route →" />
          </Link>
        </div>
        <ul className="trk-grid">
          {main.map((t) => (
            <TrackCard key={t.id} track={t} />
          ))}
          {parallel.map((t) => (
            <TrackCard key={t.id} track={t} />
          ))}
        </ul>
      </section>

      <section className="ui-sec trk-sec" data-quiet>
        <div className="ui-sec-head">
          <h2 className="ui-sec-title">
            <T zh="只想单练某一类" en="Just drill one kind" />
          </h2>
        </div>
        <Surfaces />
      </section>
    </>
  );
}
