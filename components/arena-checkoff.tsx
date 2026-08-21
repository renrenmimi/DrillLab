"use client";

// 交卷后的自评 + 解锁 —— 复盘页唯一的客户端小岛。
//
// ============================================================
// 【交卷 → 自评 → 落记录，这个顺序怎么处理的】
//
// 问题：finishArena(id, outcome, checks) 需要 checks，但 checks 是在这一页勾的，
// 而「交卷」这个动作发生在上一页（/run）。
//
// 方案（两种里选了后一种）：
//   A. 交卷时先写一条 outcome 待定的记录，自评完再回填 checks。
//      要给 progress 加一个「改最后一条记录」的方法，而且中途关页面会留下
//      一条永远待定的记录 —— 记录里有半成品，比没有更糟。
//   B. 交卷时只做导航，arenaLive 先不删；arenaLive 还在就等于
//      「交了卷、还没自评」。自评完在这一页一次性 finishArena，
//      startedAt 用的还是同一个 arenaLive.startedAt。
//
// 选 B 的三个理由：
//   ① 只写一次，不存在「半条记录」的中间态；
//   ② outcome 本来就该由 checks 推出来（勾全了才是通过），B 正好等到 checks 齐了再判；
//   ③ 中途关掉页面，arenaLive 还在 —— 下次进列表页会看到「有一场还在计时中」，
//      必须显式交卷或放弃才能收尾。跑掉了不算自动作废，这正是想要的约束。
//
// B 的代价：finishArena 里的 endedAt 是 Date.now()，也就是「按下记录」那一刻，
// 比真正交卷晚了勾选的那几十秒。所以这一页显示的用时以**进这一页时**冻结的
// 时间戳为准（见 stopped），而落进记录的时间会略长一点。
// 要让两者完全一致，需要 progress 那边支持 finishArena(..., endedAt) ——
// 报告里写了这条请求，没有自己去改 lib/progress.tsx。
// ============================================================

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { arenaPath } from "@/content/nav";
import { useProgress } from "@/lib/progress";
import {
  AttemptHistory,
  AttemptTags,
  attemptMs,
  attemptPassed,
  bestPass,
  fmtClock,
  fmtGap,
  limitMs,
} from "./arena-bits";
import { T } from "./t";

export function ArenaCheckoff({
  id,
  title,
  minutes,
  commands,
  children,
}: {
  id: string;
  title: string;
  minutes: number;
  commands: { cmd: string; expect: string; expectEn?: string }[];
  /** 提示 + 参考答案 + 讲解链接。自评完成前**不渲染**，不是隐藏。 */
  children: ReactNode;
}) {
  const { ready, arenaLive, arenaAttempts, finishArena } = useProgress();

  // 进这一页的时刻 = 交卷时刻（上一页点「确定，交卷」就直接跳过来了）。
  // 冻结在 state 里，勾选花掉的时间不算进用时。
  const [stopped, setStopped] = useState(0);
  useEffect(() => setStopped(Date.now()), []);

  const [checks, setChecks] = useState<boolean[]>(() => commands.map(() => false));
  const [unlocked, setUnlocked] = useState(false);

  const live = ready ? arenaLive() : undefined;
  const pending = live?.id === id ? live : undefined;
  const attempts = ready ? arenaAttempts(id) : [];
  const last = attempts.length > 0 ? attempts[attempts.length - 1] : undefined;

  /* ---------- 挂载前：占位。服务端和首次客户端渲染走同一支 ---------- */
  if (!ready) {
    return (
      <div className="arena-box">
        <p className="arena-none">
          <T zh="正在读本机记录…" en="Reading local records…" />
        </p>
      </div>
    );
  }

  /* ---------- ① 交了卷，还没自评 ---------- */
  if (pending) {
    const at = stopped > 0 ? stopped : Date.now();
    const elapsed = Math.max(0, at - pending.startedAt);
    const over = elapsed > limitMs(minutes);
    const hit = checks.filter(Boolean).length;
    const passed = checks.length > 0 && checks.every(Boolean);

    return (
      <div className="arena-box" data-step="checkoff">
        <div className="arena-verdict">
          <span className="arena-verdict-time mono" data-over={over || undefined}>
            {fmtClock(elapsed)}
          </span>
          <span className="arena-verdict-sub">
            <T zh={`本次用时（限时 ${minutes} 分钟）`} en={`this attempt (limit ${minutes} min)`} />
            {over && (
              <>
                {" "}
                <span className="tag" data-tone="warn">
                  <T zh="超时" en="Over time" />
                </span>
              </>
            )}
          </span>
        </div>

        <div className="minihead">
          <T zh="逐条勾：这条真的过了吗" en="Tick each one: did it really pass" />
        </div>

        <div className="arena-checks">
          {commands.map((c, i) => (
            <label className="arena-check" key={i} data-on={checks[i] || undefined}>
              <input
                type="checkbox"
                checked={checks[i]}
                onChange={(e) =>
                  setChecks((prev) => prev.map((v, j) => (j === i ? e.target.checked : v)))
                }
              />
              <span className="arena-check-cmd mono">{c.cmd}</span>
              <span className="arena-check-exp">
                <T zh="期望：" en="expected: " />
                <T zh={c.expect} en={c.expectEn} />
              </span>
            </label>
          ))}
        </div>

        <div className="arena-submit">
          <span className="arena-submit-text">
            <T
              zh={`勾了 ${hit} / ${commands.length} 条 —— 这次会记成`}
              en={`${hit} of ${commands.length} ticked — this will be recorded as`}
            />{" "}
            <span className="tag" data-tone={passed ? "ok" : "danger"}>
              <T zh={passed ? "通过" : "没过"} en={passed ? "Passed" : "Not passed"} />
            </span>
            {over && (
              <>
                {" "}
                <span className="tag" data-tone="warn">
                  <T zh="超时" en="Over time" />
                </span>
              </>
            )}
          </span>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              // outcome 是单值，超时会盖掉过没过 —— 所以 checks 也一起存，
              // 显示的时候由 attemptPassed(checks) 把「超时但过了」还原出来。
              const outcome = over ? "timeout" : passed ? "passed" : "failed";
              finishArena(id, outcome, checks);
            }}
          >
            <T zh="记下这次，解锁提示和答案" en="Record it, unlock hints and answer" />
          </button>
        </div>

        <p className="arena-note dimmer">
          <T
            zh="还没勾完想回去接着写也行 —— 记录是按下上面那个按钮才落的。"
            en="You can go back and keep working; nothing is recorded until you press that button."
          />{" "}
          <Link href={`${arenaPath(id)}/run`}>
            <T zh="回到考场（计时还在跑）" en="Back to the run (clock still running)" />
          </Link>
        </p>
      </div>
    );
  }

  /* ---------- ② 从没交过卷，直接开了这一页 ---------- */
  if (!last && !unlocked) {
    return (
      <div className="arena-box" data-step="locked">
        <div className="callout" data-tone="warn">
          <strong className="callout-title">
            <T zh="你还没在这道题上交过卷" en="You have not handed this one in" />
          </strong>
          <p>
            <T
              zh={`「${title}」在你的记录里一次都没有。这一页是交卷之后的复盘页 —— 现在打开就等于先看答案再做题，那这道题以后就不能用来验收了。`}
              en={`“${title}” has no attempts in your record. This is the after-you-hand-in page: opening it now means reading the answer before doing the work, and then this challenge can never be used to check yourself again.`}
            />
          </p>
        </div>
        <div className="arena-submit">
          <Link className="btn btn-primary" href={arenaPath(id)}>
            <T zh="去开考" en="Start it properly" />
          </Link>
          <button type="button" className="btn btn-ghost" onClick={() => setUnlocked(true)}>
            <T zh="我知道后果，直接看提示和答案" en="I understand, show hints and answer anyway" />
          </button>
        </div>
      </div>
    );
  }

  /* ---------- ③ 有记录（或用户自己旁路了）→ 解锁 ---------- */
  const prevBest = last ? bestPass(attempts.slice(0, -1)) : undefined;
  const thisMs = last ? attemptMs(last) : 0;

  return (
    <div className="arena-box" data-step="open">
      {last && (
        <>
          <div className="arena-verdict">
            <span className="arena-verdict-time mono">{fmtClock(thisMs)}</span>
            <span className="arena-verdict-sub">
              <T zh="本次用时" en="this attempt" />
              <AttemptTags a={last} />
            </span>
          </div>

          <p className="arena-note">
            {prevBest ? (
              attemptPassed(last) ? (
                thisMs < attemptMs(prevBest) ? (
                  <T
                    zh={`之前最好是 ${fmtClock(attemptMs(prevBest))}，这次快了 ${fmtGap(
                      attemptMs(prevBest) - thisMs,
                    )}。`}
                    en={`Previous best was ${fmtClock(attemptMs(prevBest))}; this run was ${fmtGap(
                      attemptMs(prevBest) - thisMs,
                    )} faster.`}
                  />
                ) : (
                  <T
                    zh={`之前最好是 ${fmtClock(attemptMs(prevBest))}，这次慢了 ${fmtGap(
                      thisMs - attemptMs(prevBest),
                    )} —— 慢不是问题，通过才是。`}
                    en={`Previous best was ${fmtClock(attemptMs(prevBest))}; this run was ${fmtGap(
                      thisMs - attemptMs(prevBest),
                    )} slower. Slower is fine, passing is the point.`}
                  />
                )
              ) : (
                <T
                  zh={`这道题你之前最好一次是 ${fmtClock(attemptMs(prevBest))}（通过）。这次没过，说明上次能过里有一部分是记住了而不是会了。`}
                  en={`Your best pass on this one is ${fmtClock(attemptMs(prevBest))}. This run did not pass, which means part of the last pass was memory rather than skill.`}
                />
              )
            ) : attemptPassed(last) ? (
              <T
                zh="这是你第一次在这道题上全条通过。下一个目标不是更快，是换一道题也能做出来。"
                en="First clean pass on this one. The next target is not speed, it is doing a different challenge cold."
              />
            ) : (
              <T
                zh="这次没通过。看完答案之后，隔一两天再空手来一遍 —— 隔天重做才是检验，不是当天照着答案再抄一次。"
                en="Not a pass this time. After reading the answer, come back cold in a day or two: redoing it later is the check, retyping the answer today is not."
              />
            )}
          </p>

          {last.checks.length > 0 && (
            <>
              <div className="minihead">
                <T zh="你的自评" en="Your self-assessment" />
              </div>
              <div className="arena-checks" data-readonly="true">
                {commands.map((c, i) => (
                  <label className="arena-check" key={i} data-on={last.checks[i] || undefined}>
                    <input type="checkbox" checked={last.checks[i] ?? false} disabled readOnly />
                    <span className="arena-check-cmd mono">{c.cmd}</span>
                    <span className="arena-check-exp">
                      <T zh="期望：" en="expected: " />
                      <T zh={c.expect} en={c.expectEn} />
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {children}

      <div className="minihead">
        <T zh="这道题的全部记录" en="Every attempt on this one" />
      </div>
      <AttemptHistory attempts={attempts} />

      <div className="arena-submit">
        <Link className="btn" href={arenaPath(id)}>
          <T zh="再考一次" en="Run it again" />
        </Link>
        <Link className="btn btn-ghost" href="/arena">
          <T zh="回考场列表" en="Back to the arena" />
        </Link>
      </div>
    </div>
  );
}
