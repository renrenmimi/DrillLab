"use client";

// 说明屏上的那一块交互：历史尝试记录 + 开考按钮。
//
// 只有这一块是客户端的，因为只有它要读写 localStorage。题面留在服务端那两页。
//
// 【为什么开考按钮在挂载前是禁用的】
// arenaLive 只有客户端知道。服务端渲染时 ready === false，首次客户端渲染也是
// false —— 两边输出一样，不会有 hydration 警告。挂载后 ready 翻 true，
// 按钮才活过来。这是全站统一的路子（见 lib/theme.tsx / lib/progress.tsx）。

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ARENA, arenaPath } from "@/content/nav";
import { useProgress } from "@/lib/progress";
import { AttemptHistory, bestPass, attemptMs, fmtClock } from "./arena-bits";
import { T } from "./t";

export function ArenaStartPanel({
  id,
  title,
  minutes,
}: {
  id: string;
  title: string;
  minutes: number;
}) {
  const router = useRouter();
  const { ready, arenaAttempts, arenaLive, startArena, abandonArena } = useProgress();
  const [askQuit, setAskQuit] = useState<string | null>(null);

  const live = ready ? arenaLive() : undefined;
  const attempts = ready ? arenaAttempts(id) : [];
  const best = bestPass(attempts);

  const mine = live?.id === id ? live : undefined;
  const other = live && live.id !== id ? live : undefined;
  const otherTitle = other ? (ARENA.find((a) => a.id === other.id)?.title ?? other.id) : "";

  const start = () => {
    // startArena 会同步写 localStorage（persist 里就是 setItem），
    // 所以下一页一定能读到 startedAt，不需要等任何异步。
    startArena(id);
    router.push(`${arenaPath(id)}/run`);
  };

  return (
    <div className="arena-startbox">
      <div className="minihead">
        <T zh="你在这道题上的记录" en="Your record on this one" />
      </div>

      {!ready ? (
        <p className="arena-none">
          <T zh="正在读本机记录…" en="Reading local records…" />
        </p>
      ) : (
        <>
          <AttemptHistory attempts={attempts} />
          {best && (
            <p className="arena-note">
              <T zh="要打破的是 " en="The number to beat is " />
              <span className="mono">{fmtClock(attemptMs(best))}</span>
              <T
                zh="。不过第一优先级永远是「通过」，不是快。"
                en=". Passing still comes first, speed second."
              />
            </p>
          )}
        </>
      )}

      <div className="arena-startbar" data-state={mine ? "live" : other ? "blocked" : "idle"}>
        {!ready && (
          <button type="button" className="btn btn-primary" disabled>
            <T zh="读取本机记录…" en="Reading local records…" />
          </button>
        )}

        {ready && mine && (
          <>
            <div className="arena-startbar-text">
              <strong>
                <T zh="这一场已经在计时了" en="This run is already on the clock" />
              </strong>
              <T
                zh="回到考场继续，或者现在放弃 —— 放弃会记一条，抹不掉。"
                en="Go back and carry on, or give up now. Giving up records an attempt and it stays."
              />
            </div>
            <Link className="btn btn-primary" href={`${arenaPath(id)}/run`}>
              <T zh="回到考场" en="Back to the run" />
            </Link>
            <button type="button" className="btn btn-ghost" onClick={() => setAskQuit(id)}>
              <T zh="放弃这次" en="Give up" />
            </button>
          </>
        )}

        {ready && other && (
          <>
            <div className="arena-startbar-text">
              <strong>
                <T zh="你另有一场考试在计时中" en="Another run is on the clock" />
              </strong>
              {otherTitle}
              <T
                zh=" —— 一次只考一道。先把它交卷或放弃，再开这一场。"
                en=" — one at a time. Hand that one in or give it up before starting this one."
              />
            </div>
            <Link className="btn btn-primary" href={`${arenaPath(other.id)}/run`}>
              <T zh="去那一场" en="Go to that run" />
            </Link>
            <button type="button" className="btn btn-ghost" onClick={() => setAskQuit(other.id)}>
              <T zh="放弃那一场" en="Give that one up" />
            </button>
          </>
        )}

        {ready && !mine && !other && (
          <>
            <div className="arena-startbar-text">
              <strong>
                <T zh={`按下去就开始 ${minutes} 分钟计时`} en={`Pressing start begins the ${minutes} min clock`} />
              </strong>
              <T
                zh="题面在下一页。手机、水杯、要装的依赖，先准备好。"
                en="The paper is on the next page. Sort out your setup before you press it."
              />
            </div>
            <button type="button" className="btn btn-primary" onClick={start}>
              <T zh="开始计时，进考场" en="Start the clock" />
            </button>
          </>
        )}
      </div>

      {askQuit && (
        <div className="arena-confirm" role="alertdialog" aria-label="确认放弃 / Confirm giving up">
          <span>
            <T
              zh="放弃会在记录里留一条「放弃」，而且不会抹掉。确定？"
              en="Giving up leaves a gave-up entry in your record, permanently. Sure?"
            />
          </span>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              abandonArena(askQuit);
              setAskQuit(null);
            }}
          >
            <T zh="确定放弃" en="Yes, give up" />
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAskQuit(null)}>
            <T zh="再想想" en="Never mind" />
          </button>
        </div>
      )}

      <p className="arena-note dimmer">
        <T
          zh={`题目：${title}。记录只存在这台浏览器里，换设备看不到。`}
          en={`Challenge: ${title}. Records live in this browser only.`}
        />
      </p>
    </div>
  );
}
