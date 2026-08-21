// 考场的公用零件 —— 纯函数 + 不带 hook 的展示件。
//
// 【为什么单独一个文件，又故意不写 "use client"】
// 考场四页里两页是服务端组件（说明屏、进行中），两页要读 localStorage 所以是
// 客户端小岛（列表、交卷后自评）。这些零件两边都要用。
// 不带 "use client" 的模块会跟着 import 它的那一侧走 —— 服务端页面里它留在
// 服务端，客户端小岛里它才进 chunk。所以这一份代码不会把内容拖进客户端包。
//
// 这里只放「不需要 localStorage 也能算出来」的东西。凡是要读进度的都在小岛里。

import type { ArenaAttempt } from "@/lib/progress";
import { T } from "./t";

/* ============================================================
   时间
   ============================================================ */

/**
 * 毫秒 → `mm:ss`，超过一小时给 `h:mm:ss`。
 * 计时器、用时、历史记录三处都用它，显示格式才不会打架。
 */
export function fmtClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** 差值 → 「快了 9 分 20 秒」里的那截文字 */
export function fmtGap(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const s = total % 60;
  const m = Math.floor(total / 60);
  if (m === 0) return `${s} 秒`;
  if (s === 0) return `${m} 分`;
  return `${m} 分 ${s} 秒`;
}

/** 时限的毫秒数 */
export const limitMs = (minutes: number) => minutes * 60_000;

/** 一次尝试真正花了多久 */
export function attemptMs(a: ArenaAttempt): number {
  return Math.max(0, (a.endedAt ?? a.startedAt) - a.startedAt);
}

/** 「2026-08-03 14:07」这种格式。
 *  没用 toLocaleString —— 它在服务端和客户端会因时区、语言给出不同结果。
 *  即便如此这个函数也只在客户端小岛里调用，服务端渲染不碰它。 */
export function fmtWhen(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

/* ============================================================
   一次尝试怎么判
   ============================================================ */

/**
 * 这次算不算「过了」。
 *
 * 只认「验收命令逐条勾过」这一件事 —— 不认「我觉得写完了」。
 * 全站主线之一是「测试通过 ≠ 做对了」，这里反过来：没跑过验收命令，
 * 就不算过。checks 是空数组（放弃、或者一条都没勾）时一律不算。
 */
export function attemptPassed(a: ArenaAttempt): boolean {
  return a.checks.length > 0 && a.checks.every(Boolean);
}

/** 用时最短的那次通过。没通过过就返回 undefined。 */
export function bestPass(list: ArenaAttempt[]): ArenaAttempt | undefined {
  let best: ArenaAttempt | undefined;
  for (const a of list) {
    if (!attemptPassed(a)) continue;
    if (!best || attemptMs(a) < attemptMs(best)) best = a;
  }
  return best;
}

type Tone = "ok" | "warn" | "danger" | "accent" | "info";

const OUTCOME: Record<ArenaAttempt["outcome"], { zh: string; en: string; tone: Tone }> = {
  passed: { zh: "通过", en: "Passed", tone: "ok" },
  failed: { zh: "没过", en: "Not passed", tone: "danger" },
  "gave-up": { zh: "放弃", en: "Gave up", tone: "warn" },
  timeout: { zh: "超时", en: "Over time", tone: "warn" },
};

/**
 * 一次尝试的结论标签。
 *
 * outcome 是单值，但「超时」和「过没过」是两件事：超时交卷而且全勾过了，
 * 记录里应该同时看到「超时」和「通过」。所以超时那一支额外按 checks 补一个标签。
 */
export function AttemptTags({ a }: { a: ArenaAttempt }) {
  const main = OUTCOME[a.outcome];
  const extra =
    a.outcome === "timeout" ? (attemptPassed(a) ? OUTCOME.passed : OUTCOME.failed) : undefined;

  return (
    <>
      <span className="tag" data-tone={main.tone}>
        <T zh={main.zh} en={main.en} />
      </span>
      {extra && (
        <span className="tag" data-tone={extra.tone}>
          <T zh={extra.zh} en={extra.en} />
        </span>
      )}
    </>
  );
}

/** 历史尝试记录 —— 难看也照实列，记录能抹掉就没有约束力了 */
export function AttemptHistory({ attempts }: { attempts: ArenaAttempt[] }) {
  if (attempts.length === 0) {
    return (
      <p className="arena-none">
        <T
          zh="这道题你还没试过。它是这一页最该点的那个按钮。"
          en="You have never attempted this one. That makes it the button to press."
        />
      </p>
    );
  }

  const best = bestPass(attempts);

  return (
    <div className="arena-hist">
      {attempts
        .map((a, i) => ({ a, n: i + 1 }))
        .reverse()
        .map(({ a, n }) => (
          <div className="arena-hist-row" key={`${a.startedAt}-${n}`} data-best={a === best || undefined}>
            <span className="arena-hist-n">#{n}</span>
            <span className="arena-hist-time mono">{fmtClock(attemptMs(a))}</span>
            <span className="arena-hist-tags">
              <AttemptTags a={a} />
              {a === best && (
                <span className="tag" data-tone="accent">
                  <T zh="最好一次" en="Best" />
                </span>
              )}
            </span>
            <span className="arena-hist-when">{fmtWhen(a.startedAt)}</span>
            {a.checks.length > 0 && (
              <span className="arena-hist-checks">
                <T
                  zh={`验收 ${a.checks.filter(Boolean).length} / ${a.checks.length}`}
                  en={`checks ${a.checks.filter(Boolean).length} / ${a.checks.length}`}
                />
              </span>
            )}
          </div>
        ))}
    </div>
  );
}

/* ============================================================
   考场规则
   ============================================================ */

/** 开考前的规则屏。说明屏和列表页都用同一份，规则只写一遍。 */
export function ArenaRules() {
  return (
    <ol className="arena-rules">
      <li>
        <T
          zh="从空文件夹开始。自己 npm init、自己装依赖、自己配脚本。脚手架是考试内容的一部分。"
          en="Start from an empty folder. Run npm init yourself, install deps yourself, wire the scripts yourself."
        />
      </li>
      <li>
        <T
          zh="计时期间不许打开对应的课、练习场、模拟考讲解。提示和参考答案要交卷才解锁。"
          en="While the clock runs, no lessons, no practice page, no walkthroughs. Hints and the reference answer unlock only after you hand in."
        />
      </li>
      <li>
        <T
          zh="查官方文档、查报错、查 API 签名都允许 —— 真实考试也允许。抄这个站里的答案不允许。"
          en="Official docs, error messages and API signatures are fair game, same as the real assessment. Copying this site's answers is not."
        />
      </li>
      <li>
        <T
          zh="时限到了不会强制打断。计时器变红，交卷记录里标「超时」—— 什么时候停由你决定，但记录如实。"
          en="Hitting the limit does not stop you. The clock turns red and the attempt is tagged over-time. You decide when to stop, the record stays honest."
        />
      </li>
      <li>
        <T
          zh="交卷后先逐条勾验收命令的真实结果，再看提示和答案。顺序不能反。"
          en="After handing in, tick the real result of each acceptance command first. Hints and answers come after that, not before."
        />
      </li>
      <li>
        <T
          zh="中途放弃也会记一条「放弃」，而且抹不掉。记录难看才有约束力。"
          en="Giving up records a gave-up attempt, and it stays. A record you can quietly delete constrains nobody."
        />
      </li>
    </ol>
  );
}

/** 「为什么要有考场」—— 列表页和说明屏共用 */
export function ArenaWhy() {
  return (
    <p>
      <T
        zh="沙箱跑绿不等于能在空文件夹里做出来。练习场的题文件建好了、依赖装好了、测试写好了，点一下就跑；真实考试是空文件夹、自己配环境、自己读 schema、没有提示按钮。考场就是用来堵这个缺口的："
        en="A green sandbox is not the same as building it in an empty folder. In the practice pages the files exist, the deps are installed, the tests are written, and one click runs them. The real assessment is an empty folder, your own setup, your own reading of the schema, and no hint button. The arena closes that gap:"
      />{" "}
      <strong>
        <T
          zh="计时、无提示、答案锁到交卷之后。"
          en="timed, no hints, answers locked until you hand in."
        />
      </strong>
    </p>
  );
}
