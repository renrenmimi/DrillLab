"use client";

// 考场计时器 + 交卷 / 放弃 —— 进行中那一页唯一的客户端小岛。
//
// ============================================================
// 【计时怎么算】
// 存的只有一个数：开考那一刻的时间戳（startArena 写进 localStorage 的
// arenaLive.startedAt）。显示的时候现算 now - startedAt。
//
// setInterval 只做一件事：每秒把 now 换成新的 Date.now()，触发一次重渲染。
// 它**不参与计数** —— 没有 elapsed += 1 这种东西。
// 理由：标签页切到后台时定时器会被节流到一分钟一次甚至完全停掉，累加法会漂，
// 现算法不会。这个站已经因为 rAF 在后台不触发卡死过一次（lib/use-active-heading.ts）。
//
// 【刷新为什么不会重置】
// 这一页什么都不存。刷新后 ProgressProvider 从 localStorage 读回 arenaLive,
// startedAt 还是开考那一刻，接着算就是了。
//
// 【hydration】
// arenaLive 只有客户端知道，所以第一次渲染必须和服务端一致：
// ready === false 且 now === 0 时渲染占位条，挂载后才换成真实数字。
// ============================================================

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ARENA, arenaPath } from "@/content/nav";
import { useProgress } from "@/lib/progress";
import { fmtClock, limitMs } from "./arena-bits";
import { T } from "./t";

export function ArenaClock({ id, minutes }: { id: string; minutes: number }) {
  const router = useRouter();
  const { ready, arenaLive, abandonArena } = useProgress();
  const [now, setNow] = useState(0); // 0 = 还没挂载
  const [ask, setAsk] = useState<"none" | "submit" | "quit">("none");

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const t = window.setInterval(tick, 1000);
    // 从后台标签页切回来时，被节流的 interval 可能还要等一整分钟才响。
    // 这个监听让「切回来」那一瞬间数字就对上。
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  const live = ready ? arenaLive() : undefined;
  const mine = live?.id === id ? live : undefined;
  const other = live && live.id !== id ? live : undefined;
  const otherTitle = other ? (ARENA.find((x) => x.id === other.id)?.title ?? other.id) : "";

  const limit = limitMs(minutes);
  const elapsed = mine && now > 0 ? now - mine.startedAt : 0;
  const over = elapsed > limit;

  /* ---------- 挂载前：占位，和服务端渲染的一致 ---------- */
  if (!ready || now === 0) {
    return (
      <div className="arena-clockbar" aria-live="off">
        <span className="arena-clock mono">--:--</span>
        <span className="arena-clock-sub">
          <T zh="正在读本机的开考时间…" en="Reading the start timestamp…" />
        </span>
      </div>
    );
  }

  /* ---------- 这道题不在计时中 ---------- */
  if (!mine) {
    return (
      <div className="arena-clockbar" data-state="idle">
        <span className="arena-clock mono">--:--</span>
        <span className="arena-clock-sub">
          {other ? (
            <T
              zh={`这道题没在计时。你正在考的是「${otherTitle}」。`}
              en={`This one is not running. Your live run is “${otherTitle}”.`}
            />
          ) : (
            <T
              zh="这道题还没开考 —— 计时器是空的，这次不会记进记录。"
              en="This one has not been started, so nothing here will be recorded."
            />
          )}
        </span>
        <span className="arena-clock-actions">
          <Link className="btn btn-sm btn-primary" href={arenaPath(id)}>
            <T zh="去开考" en="Start it" />
          </Link>
          {other && (
            <Link className="btn btn-sm" href={`${arenaPath(other.id)}/run`}>
              <T zh="回到那一场" en="Back to that run" />
            </Link>
          )}
        </span>
      </div>
    );
  }

  /* ---------- 正在计时 ---------- */
  return (
    <div className="arena-clockbar" data-state="live" data-over={over || undefined}>
      <span className="arena-clock mono" role="timer" aria-live="off">
        {fmtClock(elapsed)}
      </span>

      <span className="arena-clock-sub">
        <span className="arena-clock-limit">
          <T zh={`限时 ${minutes} 分钟`} en={`${minutes} min limit`} />
        </span>
        {over ? (
          <strong className="arena-clock-over">
            <T zh={`已超时 ${fmtClock(elapsed - limit)}`} en={`over by ${fmtClock(elapsed - limit)}`} />
          </strong>
        ) : (
          <span>
            <T zh={`还剩 ${fmtClock(limit - elapsed)}`} en={`${fmtClock(limit - elapsed)} left`} />
          </span>
        )}
      </span>

      <span className="arena-clock-actions">
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => setAsk(ask === "submit" ? "none" : "submit")}
        >
          <T zh="交卷" en="Hand in" />
        </button>
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => setAsk(ask === "quit" ? "none" : "quit")}
        >
          <T zh="放弃" en="Give up" />
        </button>
      </span>

      {ask === "submit" && (
        <div className="arena-confirm" role="alertdialog" aria-label="确认交卷 / Confirm hand-in">
          <span>
            <strong>
              <T zh="交卷后才会解锁答案，确定？" en="Answers unlock only after you hand in. Sure?" />
            </strong>{" "}
            <T
              zh={`已用 ${fmtClock(elapsed)}。下一页先逐条勾验收命令的真实结果，再看提示和参考答案。`}
              en={`${fmtClock(elapsed)} spent. On the next page you tick the real result of each acceptance command, then the hints and the reference answer open up.`}
            />
          </span>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => {
              // 【为什么这里不调 finishArena】
              // finishArena 需要 checks，而 checks 要在下一页逐条勾。
              // 所以这一步只做导航，arenaLive 先留着 —— 它就是「交了卷但还没自评」
              // 这个状态的标记。记录在自评页按「记下这次」时一次性写入，
              // startedAt 用的还是同一个 arenaLive.startedAt，时间不会丢。
              // 代价：记录里的 endedAt 是「按下记录」那一刻，比真正交卷晚了勾选的
              // 那几十秒。要精确到交卷那一秒，需要 progress 支持传入 endedAt ——
              // 见报告里那条请求。
              router.push(`${arenaPath(id)}/review`);
            }}
          >
            <T zh="确定，交卷" en="Yes, hand in" />
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAsk("none")}>
            <T zh="再写一会儿" en="Keep working" />
          </button>
        </div>
      )}

      {ask === "quit" && (
        <div className="arena-confirm" role="alertdialog" aria-label="确认放弃 / Confirm giving up">
          <span>
            <strong>
              <T zh="放弃会记一条「放弃」，抹不掉。确定？" en="This records a gave-up attempt, permanently. Sure?" />
            </strong>{" "}
            <T
              zh="放弃之后也能看答案 —— 但记录里就是放弃。写了一半也算写了，不如先交卷再自评。"
              en="You can still read the answer afterwards, but the record says you gave up. Half-done still counts as done: consider handing in and self-assessing instead."
            />
          </span>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              abandonArena(id);
              router.push(`${arenaPath(id)}/review`);
            }}
          >
            <T zh="确定放弃" en="Yes, give up" />
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAsk("none")}>
            <T zh="继续做" en="Carry on" />
          </button>
        </div>
      )}
    </div>
  );
}
