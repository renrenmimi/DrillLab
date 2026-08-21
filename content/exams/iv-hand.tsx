// 面试 · 第 8 部分 —— 手写题。
//
// 【为什么有这个模块】
// 美国面试第一轮（phone screen）最常见的形态就是手写工具函数：
// debounce、Promise.all、EventEmitter 这类。第 7 部分对照过题库里的
// 16 道 coding 题，但那份题库没有覆盖这一类 —— 所以这 8 道全部是
// **DrillLab 自出**，不带题库编号。
//
// 【可信度】
// 8 道参考解法和测试都在 scratchpad 用 vitest 真跑过：40 / 40。
// 起始态也跑过：33 failed / 7 passed —— 那 7 个是「半成品恰好满足断言」
// 的假通过（比如 flatten 的浅拷贝恰好过了 depth 0 那条），故意留着，
// 是主线①「测试通过 ≠ 做对了」的又一批活例子。
// 所以参考解法标 tested()，示意与反例标 demo()。
//
// 【这些 concept 不进八股题库】
// concept id 用 hd- 前缀 —— drills.ts 只认 q\d+ / ts\d+，这里是题不是问答。

import type { Module } from "../types";
import { demo, tested } from "../helpers";

/* ================================================================
   参考解法 —— 与 content/coding.ts 的沙箱共用同一份字符串的**内容**。
   这里只放讲解里引用的核心片段；完整版在练习的 solution 里。
   ================================================================ */

const REF_DEBOUNCE = `export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timer !== null) clearTimeout(timer);   // 关键：先清旧的 —— 这就是「重新计时」
    timer = setTimeout(() => {
      timer = null;
      fn(...args);                             // 只有最后一次的参数活到这里
    }, delay);
  };

  debounced.cancel = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  return debounced;
}`;

const REF_DEBOUNCE_EN = `export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timer !== null) clearTimeout(timer);   // The key line: clear the old timer, so the clock restarts
    timer = setTimeout(() => {
      timer = null;
      fn(...args);                             // Only the last call's arguments get this far
    }, delay);
  };

  debounced.cancel = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  return debounced;
}`;

const REF_THROTTLE = `export function throttle<T extends (...args: never[]) => void>(
  fn: T,
  interval: number,
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = interval - (now - lastTime);

    if (remaining <= 0) {
      lastTime = now;
      fn(...args);                    // leading：到点了，立刻执行
    } else {
      lastArgs = args;                // 记住窗口内最后一次的参数
      if (timer === null) {
        timer = setTimeout(() => {    // trailing：窗口结束补一枪
          timer = null;
          lastTime = Date.now();
          if (lastArgs !== null) fn(...lastArgs);
          lastArgs = null;
        }, remaining);
      }
    }
  };
}`;

const REF_THROTTLE_EN = `export function throttle<T extends (...args: never[]) => void>(
  fn: T,
  interval: number,
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = interval - (now - lastTime);

    if (remaining <= 0) {
      lastTime = now;
      fn(...args);                    // leading: the window is open, run now
    } else {
      lastArgs = args;                // keep the args of the last call inside the window
      if (timer === null) {
        timer = setTimeout(() => {    // trailing: run once more when the window closes
          timer = null;
          lastTime = Date.now();
          if (lastArgs !== null) fn(...lastArgs);
          lastArgs = null;
        }, remaining);
      }
    }
  };
}`;

const REF_CLONE_CORE = `export function deepClone<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  if (value === null || typeof value !== "object") return value;

  const obj = value as unknown as object;
  if (seen.has(obj)) return seen.get(obj) as T;   // 见过 -> 直接还它的克隆（防循环）

  if (value instanceof Date) return new Date(value.getTime()) as unknown as T;

  if (Array.isArray(value)) {
    const out: unknown[] = [];
    seen.set(obj, out);               // 【先登记再递归】—— 循环引用就是靠这一行不爆栈
    for (const v of value) out.push(deepClone(v, seen));
    return out as unknown as T;
  }

  const out: Record<string, unknown> = {};
  seen.set(obj, out);
  for (const key of Object.keys(value)) {
    out[key] = deepClone((value as Record<string, unknown>)[key], seen);
  }
  return out as T;
}`;

const REF_PALL = `export function promiseAll<T>(items: (T | Promise<T>)[]): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) {
      resolve(results);               // 空数组：立刻完成，别让计数器等一个永远不来的 0
      return;
    }
    items.forEach((item, i) => {
      Promise.resolve(item).then((value) => {
        results[i] = value;           // 按下标写 —— 顺序由输入决定，不是完成先后
        remaining -= 1;
        if (remaining === 0) resolve(results);
      }, reject);                     // 任何一个失败，整体立刻失败
    });
  });
}`;

const REF_EMITTER_CORE = `emit(event: string, ...args: unknown[]): boolean {
  const list = this.listeners.get(event);
  if (!list || list.length === 0) return false;
  // 拷贝一份再遍历 —— once 触发时会 off 自己，
  // 直接遍历原数组会让它旁边的监听器被跳过
  for (const fn of [...list]) fn(...args);
  return true;
}`;

const REF_CURRY = `export function curry<T extends (...args: never[]) => unknown>(fn: T) {
  return function curried(...args: unknown[]): unknown {
    if (args.length >= fn.length) {
      return fn(...(args as never[]));
    }
    // 每次都返回新函数、拼出新数组 —— add1 复用一百次也互不污染
    return (...more: unknown[]) => curried(...args, ...more);
  };
}`;

const REF_LRU = `export class LRUCache<K, V> {
  private map = new Map<K, V>();

  constructor(private capacity: number) {
    if (capacity < 1) throw new Error("capacity must be at least 1");
  }

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key) as V;
    this.map.delete(key);       // 删掉再放回 = 挪到「最新」那头
    this.map.set(key, value);
    return value;
  }

  put(key: K, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      // Map 按插入序遍历 —— 迭代器的第一个键就是最久没被碰过的
      const oldest = this.map.keys().next().value as K;
      this.map.delete(oldest);
    }
  }
}`;

/* ================================================================
   模块
   ================================================================ */

export const ivHand: Module = {
  id: "iv-hand",
  title: "手写题",
  titleEn: "Implement it yourself",
  summary:
    "Phone screen 的主菜：现场手写 debounce、Promise.all、EventEmitter 这类工具函数。8 道题全部带浏览器沙箱，参考解法 40 / 40 实测。DrillLab 自出，不在原题库里。",
  summaryEn:
    "The main item in a phone screen: writing utility functions such as debounce, Promise.all and EventEmitter on the spot. All 8 problems come with a browser sandbox, and the reference solutions passed 40 / 40 in a real run. Written by DrillLab; these are not in the original question bank.",
  stage: "面试 · 第 8 部分",
  lessons: [
    /* ============================================================
       第 1 课 · 计时两兄弟
       ============================================================ */
    {
      id: "iv-hand-timing",
      title: "计时两兄弟：debounce 与 throttle",
      titleEn: "Two timing helpers: debounce and throttle",
      blurb: "先分清「等你停手」和「匀速放行」，再各写一个。",
      blurbEn:
        "First tell the two apart — wait until the calls stop, versus let one through at a steady rate — then write each one.",
      minutes: 30,
      objectives: [
        "一句话说清 debounce 和 throttle 的语义差别，并各举一个正确的使用场景",
        "手写 trailing debounce，带 cancel",
        "手写 leading + trailing 的 throttle",
        "说清为什么两者都必须用闭包存状态",
      ],
      objectivesEn: [
        "Say in one sentence how debounce and throttle differ, and give one correct use case for each",
        "Write a trailing debounce by hand, with a cancel method",
        "Write a throttle by hand that fires on both the first and the last call",
        "Explain why both of them have to keep their state in a closure",
      ],
      whyForAssessment:
        "美国面试 phone screen 的头号手写题。考的不只是写出来 —— 面试官会先问「这俩有什么区别、各用在哪」，答错场景直接扣分：搜索框用 throttle、滚动埋点用 debounce 都是反着的。",
      whyForAssessmentEn:
        "This is the number one write-it-yourself question in a phone screen. Writing the code is not the whole test — the interviewer asks first how the two differ and where each one belongs, and naming the wrong scenario costs you points right away: a search box with throttle, or scroll tracking with debounce, are both the wrong way round.",
      concepts: [
        {
          id: "hd-debounce",
          heading: "debounce：把一串调用压成最后一次",
          headingEn: "debounce: squeeze a burst of calls down to the last one",
          lede: "Write a debounce; when do you reach for it",
          body: (
            <>
              <p>
                <strong>一句话：</strong>debounce 的语义是<strong>「等你停手」</strong>
                —— 连续调用只在最后一次之后 delay 毫秒执行一次。
                典型场景：搜索框输入（停止输入才发请求）、窗口 resize 结束后重排。
              </p>
              <p>
                实现只有三个关键决定：
              </p>
              <ul>
                <li>
                  <strong>状态放闭包里。</strong>timer 必须在返回的函数外面 ——
                  放在里面每次调用都是新的，永远清不掉上一次。
                </li>
                <li>
                  <strong>先 <code>clearTimeout</code> 再 <code>setTimeout</code>。</strong>
                  这一清一设就是「重新计时」—— debounce 的全部灵魂。
                </li>
                <li>
                  <strong>参数跟着 timer 走。</strong>最后一次调用的 args
                  被闭包捕获，之前的全部作废。
                </li>
              </ul>
              <p>
                <strong>会追问：</strong>「加一个 leading 选项怎么改？」——
                进来时 timer 为空且 leading 为真，先立刻执行一次，
                再设一个只负责「解锁」的 timer。追问的追问：「cancel 和
                flush 有什么区别」—— cancel 丢弃挂着的调用，flush 立刻执行它。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> debounce means{" "}
                <strong>&ldquo;wait until you stop&rdquo;</strong> — a burst of calls
                runs once, delay ms after the last one. Typical uses: search-as-you-type
                (fire the request when typing pauses), re-layout after window resize
                settles.
              </p>
              <p>The implementation comes down to three decisions:</p>
              <ul>
                <li>
                  <strong>State lives in the closure.</strong> The timer must sit
                  outside the returned function — inside, every call would get a fresh
                  one and nothing could ever be cleared.
                </li>
                <li>
                  <strong>
                    <code>clearTimeout</code> first, then <code>setTimeout</code>.
                  </strong>{" "}
                  That clear-and-reset pair is the whole soul of debounce: the clock
                  restarts on every call.
                </li>
                <li>
                  <strong>Arguments ride along with the timer.</strong> The closure
                  captures the last call&rsquo;s args; every earlier set is discarded.
                </li>
              </ul>
              <p>
                <strong>Follow-up:</strong> &ldquo;Add a leading option&rdquo; — if the
                timer is empty and leading is on, fire immediately, then set a timer
                whose only job is to unlock. And the follow-up&rsquo;s follow-up:
                &ldquo;cancel vs flush&rdquo; — cancel drops the pending call, flush
                runs it right now.
              </p>
            </>
          ),
          code: [
            tested("ts", REF_DEBOUNCE, {
              filename: "debounce.ts（参考解法 —— scratchpad vitest 4 / 4）",
              filenameEn: "debounce.ts (reference solution — scratchpad vitest 4 / 4)",
              codeEn: REF_DEBOUNCE_EN,
            }),
          ],
        },
        {
          id: "hd-throttle",
          heading: "throttle：不管多密，每个窗口最多一次",
          headingEn: "throttle: however dense the calls, at most one per window",
          lede: "Write a throttle with leading and trailing calls",
          body: (
            <>
              <p>
                <strong>一句话：</strong>throttle 的语义是<strong>「匀速放行」</strong>
                —— 调用再密，每 interval 毫秒最多执行一次。典型场景：滚动位置上报、
                拖拽跟随、按住按钮连点。
              </p>
              <p>
                标准版是 <strong>leading + trailing</strong>：窗口开头立刻执行一次
                （用户第一下操作马上有反馈），窗口里被压掉的调用，
                在窗口结束时用<strong>最后一次的参数</strong>补执行一枪
                （不丢最终状态）。所以要存两样东西：上次执行的时间戳
                <code>lastTime</code>，和窗口内最后一次的参数 <code>lastArgs</code>。
              </p>
              <p>
                <strong>和 debounce 的分界线一句话说死：</strong>
                debounce 在连续事件流里<strong>可能永远不执行</strong>
                （只要不停手）；throttle <strong>保证按节奏执行</strong>。
                滚动进度条用 debounce 会直到停下才动 —— 那就是选错了。
              </p>
              <p>
                <strong>会追问：</strong>「用 setTimeout 一个变量能不能写？」——
                能写 leading-only 或 trailing-only 的简版；两头都要就得
                时间戳 + timer 双状态。「CSS 里有类似的东西吗」——
                没有直接等价物，但 <code>scroll</code> 事件配
                <code>IntersectionObserver</code> 常常能把节流的需求整个消掉。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> throttle means{" "}
                <strong>&ldquo;let it through at a steady rate&rdquo;</strong> — no
                matter how dense the calls, it runs at most once per interval. Typical
                uses: reporting scroll position, drag tracking, rapid button presses.
              </p>
              <p>
                The standard version is <strong>leading + trailing</strong>: fire once
                at the start of the window (the user&rsquo;s first action gets instant
                feedback), and when the window closes, fire once more with{" "}
                <strong>the last suppressed call&rsquo;s arguments</strong> (so the
                final state is not lost). That means two pieces of state: the timestamp
                of the last run, <code>lastTime</code>, and the window&rsquo;s last
                arguments, <code>lastArgs</code>.
              </p>
              <p>
                <strong>The dividing line, said once and hard:</strong> in a continuous
                event stream debounce <strong>may never run</strong> (as long as the
                stream never pauses); throttle <strong>guarantees a steady beat</strong>
                . A scroll progress bar built on debounce only moves when scrolling
                stops — that is the wrong pick.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Can you write it with one setTimeout
                variable?&rdquo; — yes for leading-only or trailing-only; both edges
                need the timestamp-plus-timer pair. &ldquo;Anything similar in
                CSS?&rdquo; — no direct equivalent, but <code>scroll</code> plus{" "}
                <code>IntersectionObserver</code> often removes the need to throttle at
                all.
              </p>
            </>
          ),
          code: [
            tested("ts", REF_THROTTLE, {
              filename: "throttle.ts（参考解法 —— scratchpad vitest 4 / 4）",
              filenameEn: "throttle.ts (reference solution — scratchpad vitest 4 / 4)",
              codeEn: REF_THROTTLE_EN,
            }),
          ],
        },
      ],
      callouts: [
        {
          tone: "trap",
          title: "测试环境的一个真实限制",
          body: (
            <>
              浏览器沙箱里没有 fake timer，而且每个 <code>setTimeout</code>
              实际会晚几百毫秒。所以这两道的测试
              <strong>
                只在充分等待之后断言「已经发生」，从不在等待之后断言「还没发生」
              </strong>
              —— 后者在慢环境里必然抖。你自己写计时类测试时也该这么设计。
            </>
          ),
        },
      ],
      exercises: [
        {
          id: "hd-debounce-write",
          kind: "code-completion",
          level: 3,
          title: "手写 debounce（带 cancel）",
          titleEn: "Write debounce by hand (with cancel)",
          prompt: (
            <>
              把「每次都立刻调用」的半成品改成真正的 debounce：
              连续调用只在停手 delay 毫秒后执行最后一次，
              <code>cancel()</code> 能取消挂着的那次。
            </>
          ),
          promptEn: (
            <>
              Turn this half-finished version, which calls through immediately every
              time, into a real debounce: a burst of calls runs only once, delay ms
              after the last one, and <code>cancel()</code> drops the pending run.
            </>
          ),
          language: "ts",
          filename: "debounce.ts",
          starter: `export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  void delay;
  // TODO 1: 存一个 timer；每次调用先清掉旧的，再设新的 —— 这就是「重新计时」。
  const debounced = (...args: Parameters<T>) => {
    fn(...args);
  };
  // TODO 2: cancel 清掉挂着的 timer。
  debounced.cancel = () => {};
  return debounced;
}`,
          starterEn: `export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  void delay;
  // TODO 1: keep a timer; on every call clear the old one and set a new one — that restarts the clock.
  const debounced = (...args: Parameters<T>) => {
    fn(...args);
  };
  // TODO 2: cancel clears the pending timer.
  debounced.cancel = () => {};
  return debounced;
}`,
          requirements: [
            "调用 debounced() 不许立刻执行 fn",
            "一串连续调用只在停手 delay 毫秒后执行一次，参数用最后那次的",
            "两串隔开的调用各自触发一次",
            "cancel() 取消还没发生的那次调用",
          ],
          requirementsEn: [
            "Calling debounced() must not run fn right away",
            "A burst of calls runs once, delay ms after the last call, with the arguments of that last call",
            "Two bursts separated by a pause each fire once",
            "cancel() drops the call that has not happened yet",
          ],
          checks: [
            { label: "有 timer 状态且先清后设（重新计时）", labelEn: "Keeps a timer, clears it before setting a new one (restarts the clock)", must: "clearTimeout" },
            { label: "用 setTimeout 延迟执行", labelEn: "Uses setTimeout to delay the call", must: "setTimeout\\(" },
            { label: "cancel 里也清 timer", labelEn: "cancel clears the timer too", must: "cancel[\\s\\S]*?clearTimeout" },
            { label: "没有把 fn 直接同步调用留在外面", labelEn: "No leftover synchronous call to fn at the top level", mustNot: "^\\s*fn\\(\\.\\.\\.args\\);\\s*$" },
          ],
          hints: [
            "timer 必须存在返回的函数外面（闭包里），不然每次调用都是新的、清不掉旧的。",
            "debounced 里两步：if (timer !== null) clearTimeout(timer)，然后 timer = setTimeout(..., delay)。",
            "setTimeout 的回调里先把 timer 置回 null，再 fn(...args) —— args 是闭包捕获的最后一次参数。",
            "cancel：if (timer !== null) clearTimeout(timer); timer = null。",
          ],
          hintsEn: [
            "The timer has to live outside the returned function, in the closure. Inside, every call gets a fresh one and the old one can never be cleared.",
            "Two steps inside debounced: if (timer !== null) clearTimeout(timer), then timer = setTimeout(..., delay).",
            "In the setTimeout callback, set timer back to null first, then call fn(...args) — args is the last set of arguments the closure captured.",
            "cancel: if (timer !== null) clearTimeout(timer); timer = null.",
          ],
          solution: tested("ts", REF_DEBOUNCE, {
            filename: "debounce.ts（scratchpad vitest 4 / 4）",
            filenameEn: "debounce.ts (scratchpad vitest 4 / 4)",
            codeEn: REF_DEBOUNCE_EN,
          }),
        },
        {
          id: "hd-throttle-write",
          kind: "code-completion",
          level: 3,
          title: "手写 throttle（leading + trailing）",
          titleEn: "Write throttle by hand (leading + trailing)",
          prompt: (
            <>
              把「直接透传」的半成品改成真正的 throttle：窗口开头立刻执行，
              窗口内压住，窗口结束用最后一次的参数补一枪。
            </>
          ),
          promptEn: (
            <>
              Turn this pass-everything-through version into a real throttle: run once
              at the start of the window, hold back the calls inside it, then run once
              more at the end of the window with the arguments of the last call.
            </>
          ),
          language: "ts",
          filename: "throttle.ts",
          starter: `export function throttle<T extends (...args: never[]) => void>(
  fn: T,
  interval: number,
): (...args: Parameters<T>) => void {
  void interval;
  // TODO: 记 lastTime 和一个 trailing timer。
  //       没到点 -> 存下参数，挂一个「窗口结束时补一枪」的 timer。
  return (...args: Parameters<T>) => {
    fn(...args);
  };
}`,
          starterEn: `export function throttle<T extends (...args: never[]) => void>(
  fn: T,
  interval: number,
): (...args: Parameters<T>) => void {
  void interval;
  // TODO: keep a lastTime and a trailing timer.
  //       Window still open -> store the args and set a timer that runs when it closes.
  return (...args: Parameters<T>) => {
    fn(...args);
  };
}`,
          requirements: [
            "第一次调用立刻执行（leading）",
            "窗口内的后续调用不执行",
            "窗口结束时用窗口内最后一次的参数补执行（trailing）",
            "窗口过了之后再调用，又立刻执行",
          ],
          requirementsEn: [
            "The first call runs immediately (leading)",
            "Later calls inside the same window do not run",
            "When the window closes, run once more with the arguments of the last call in it (trailing)",
            "A call after the window has passed runs immediately again",
          ],
          checks: [
            { label: "用时间戳判断窗口", labelEn: "Uses a timestamp to decide where the window is", must: "Date\\.now\\(\\)" },
            { label: "trailing 用 setTimeout 补执行", labelEn: "The trailing run goes through setTimeout", must: "setTimeout\\(" },
            { label: "存了窗口内最后一次的参数", labelEn: "Stores the arguments of the last call in the window", must: "lastArgs|latest" },
          ],
          hints: [
            "三个闭包变量：lastTime（上次执行的时间戳）、timer、lastArgs。",
            "每次调用算 remaining = interval - (Date.now() - lastTime)。remaining <= 0 就立刻执行并更新 lastTime。",
            "remaining > 0：lastArgs = args；如果 timer 还没挂，setTimeout(补枪, remaining)。",
            "补枪回调里：timer = null、lastTime = Date.now()、fn(...lastArgs)、lastArgs = null。",
          ],
          hintsEn: [
            "Three closure variables: lastTime (the timestamp of the last run), timer, and lastArgs.",
            "On every call compute remaining = interval - (Date.now() - lastTime). If remaining <= 0, run now and update lastTime.",
            "If remaining > 0: set lastArgs = args, and if no timer is pending, setTimeout(the trailing run, remaining).",
            "Inside the trailing callback: timer = null, lastTime = Date.now(), fn(...lastArgs), lastArgs = null.",
          ],
          solution: tested("ts", REF_THROTTLE, {
            filename: "throttle.ts（scratchpad vitest 4 / 4）",
            filenameEn: "throttle.ts (scratchpad vitest 4 / 4)",
            codeEn: REF_THROTTLE_EN,
          }),
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "ts",
            `// ✕ timer 放进了返回的函数里 —— 每次调用都是新变量，永远清不掉上一次
export function debounce(fn: (...a: unknown[]) => void, delay: number) {
  return (...args: unknown[]) => {
    let timer: ReturnType<typeof setTimeout> | null = null;  // 每次都是 null
    if (timer !== null) clearTimeout(timer);                 // 永远不成立
    timer = setTimeout(() => fn(...args), delay);
  };
}`,
            {
              filename: "状态放错了地方",
              filenameEn: "The state is in the wrong place",
              codeEn: `// ✕ the timer moved inside the returned function — every call gets a new variable, so the old one can never be cleared
export function debounce(fn: (...a: unknown[]) => void, delay: number) {
  return (...args: unknown[]) => {
    let timer: ReturnType<typeof setTimeout> | null = null;  // null every single time
    if (timer !== null) clearTimeout(timer);                 // never true
    timer = setTimeout(() => fn(...args), delay);
  };
}`,
            },
          ),
          why: (
            <>
              这是 debounce 手写题挂掉率最高的一个错。<code>timer</code>
              声明在返回函数<strong>里面</strong>，每次调用都拿到一个全新的
              <code>null</code>，<code>clearTimeout</code> 永远清不到上一次的 ——
              结果是每次调用都各自触发一次，和没写一样。
              <strong>闭包状态必须声明在「造函数的那一层」。</strong>
            </>
          ),
          whyEn: (
            <>
              This is the most common way the debounce question fails.{" "}
              <code>timer</code> is declared <strong>inside</strong> the returned
              function, so every call gets a brand new <code>null</code> and{" "}
              <code>clearTimeout</code> never reaches the previous timer. Every call
              then fires on its own, exactly as if you had written no debounce at all.{" "}
              <strong>
                Closure state has to be declared in the outer function, the one that
                builds the returned function.
              </strong>
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "「停止输入后再搜索」「resize 结束后」",
          signalEn: "\"search after the typing stops\", \"after the resize ends\"",
          reachFor: "debounce —— 等你停手",
          reachForEn: "debounce — wait until the calls stop",
        },
        {
          signal: "「滚动时持续上报」「拖拽跟随」",
          signalEn: "\"report while scrolling\", \"follow the drag\"",
          reachFor: "throttle —— 匀速放行",
          reachForEn: "throttle — let one through at a steady rate",
        },
        {
          signal: "手写题要在多次调用之间记住东西",
          signalEn: "A write-it-yourself question has to remember something between calls",
          reachFor: "闭包变量声明在「造函数的那一层」",
          reachForEn: "Declare the closure variable in the outer function that builds the returned one",
        },
        {
          signal: "计时类测试在慢环境里抖",
          signalEn: "Timing tests come out flaky on a slow machine",
          reachFor: "只断言「等待后已发生」，别断言「等待后还没发生」",
          reachForEn: "Only assert that it has happened after the wait; never assert that it has not happened yet",
        },
      ],
      recap: [
        "debounce = 等你停手：清旧 timer + 设新 timer 就是「重新计时」。",
        "throttle = 匀速放行：时间戳管 leading，timer + lastArgs 管 trailing。",
        "连续事件流里 debounce 可能永远不执行，throttle 保证节奏 —— 场景选错直接扣分。",
        "状态放闭包（造函数那一层），放进返回函数里就全废了。",
        "追问点：leading 选项、cancel vs flush、单变量简版的取舍。",
      ],
      recapEn: [
        "debounce = wait until the calls stop: clearing the old timer and setting a new one is what restarts the clock.",
        "throttle = let one through at a steady rate: a timestamp handles the first call, a timer plus lastArgs handles the last one.",
        "In a continuous stream of events debounce may never run at all, while throttle keeps a fixed rate — picking the wrong one costs you points.",
        "Keep the state in the closure, in the outer function; move it inside the returned function and nothing works.",
        "Follow-ups: a leading option, cancel versus flush, and the trade-off of the short one-variable version.",
      ],
    },

    /* ============================================================
       第 2 课 · 数据与函数
       ============================================================ */
    {
      id: "iv-hand-data",
      title: "数据与函数：deepClone、flatten、curry",
      titleEn: "Data and functions: deepClone, flatten, curry",
      blurb: "三道递归题。递归的出口、防循环的登记、不污染的攒参数。",
      blurbEn:
        "Three recursion problems: where recursion stops, the record that guards against cycles, and collecting arguments without leaking them.",
      minutes: 35,
      objectives: [
        "手写 deepClone：分支覆盖 Date / Map / Set / 数组 / 对象，循环引用不爆栈",
        "说清 JSON.parse(JSON.stringify(x)) 为什么不算深拷贝的答案",
        "手写 flatten，depth 语义与 Array.prototype.flat 一致",
        "手写 curry，部分应用可复用、互不污染",
      ],
      objectivesEn: [
        "Write deepClone by hand, with branches for Date / Map / Set / array / object, and no stack overflow on a circular reference",
        "Explain why JSON.parse(JSON.stringify(x)) does not count as an answer to deep clone",
        "Write flatten by hand, with depth behaving the same way as Array.prototype.flat",
        "Write curry by hand, so a partly applied function can be reused and does not affect the others",
      ],
      whyForAssessment:
        "deepClone 是「递归 + 分支 + 防循环」三合一的经典题，面试官用它一次看三个能力。flatten 考递归出口的干净程度。curry 考闭包攒参数 —— 写成共享数组就会在「复用部分应用」这一问上当场翻车。",
      whyForAssessmentEn:
        "deepClone packs three things into one classic problem — recursion, type branches, and guarding against cycles — so the interviewer sees three skills at once. flatten tests how cleanly you stop the recursion. curry tests collecting arguments in a closure: write it with one shared array and you fail on the spot when asked to reuse a partly applied function.",
      concepts: [
        {
          id: "hd-clone",
          heading: "deepClone：先登记，再递归",
          headingEn: "deepClone: record it first, then recurse",
          lede: "Write a deepClone that survives circular references",
          body: (
            <>
              <p>
                <strong>一句话：</strong>按类型分支递归克隆；每造出一个新容器，
                <strong>立刻</strong>在 <code>WeakMap</code> 里登记
                「原对象 → 它的克隆」，循环引用一进来就直接还登记过的克隆 ——
                这就是不爆栈的全部原理。
              </p>
              <p>
                分支顺序：原始值和 <code>null</code> 原样返回 →
                查 <code>seen</code> → <code>Date</code> → <code>Map</code> /
                <code>Set</code> → 数组 → 普通对象。
                <strong>「先登记再递归子节点」的次序不能反</strong>：
                反了，<code>a.self = a</code> 这种结构会在登记之前就递归回自己。
              </p>
              <p>
                <strong>会追问（必问）：</strong>「为什么不用
                <code>JSON.parse(JSON.stringify(x))</code>？」——
                丢 <code>undefined</code> 和函数、<code>Date</code> 变字符串、
                <code>Map</code> / <code>Set</code> 变空对象、循环引用直接抛
                <code>TypeError</code>。「那 <code>structuredClone</code> 呢？」——
                生产代码优先用它（原生、支持循环引用），但它克隆不了函数和
                DOM 节点，而且这道题考的就是你自己会不会写。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> recurse by type, and the moment you create
                a new container, register &ldquo;original → its clone&rdquo; in a{" "}
                <code>WeakMap</code> — when a circular reference comes back around, you
                hand out the registered clone instead of recursing forever. That is the
                entire trick.
              </p>
              <p>
                Branch order: primitives and <code>null</code> pass through → check{" "}
                <code>seen</code> → <code>Date</code> → <code>Map</code> /{" "}
                <code>Set</code> → arrays → plain objects.{" "}
                <strong>
                  &ldquo;Register first, recurse into children second&rdquo; must not be
                  flipped
                </strong>
                : flipped, a structure like <code>a.self = a</code> recurses back into
                itself before the registration exists.
              </p>
              <p>
                <strong>Follow-up (always asked):</strong> &ldquo;Why not{" "}
                <code>JSON.parse(JSON.stringify(x))</code>?&rdquo; — it drops{" "}
                <code>undefined</code> and functions, turns <code>Date</code> into a
                string, turns <code>Map</code> / <code>Set</code> into empty objects,
                and throws a <code>TypeError</code> on circular references. &ldquo;And{" "}
                <code>structuredClone</code>?&rdquo; — prefer it in production code
                (native, handles cycles), but it cannot clone functions or DOM nodes,
                and this question exists to see whether you can write the thing
                yourself.
              </p>
            </>
          ),
          code: [
            tested("ts", REF_CLONE_CORE, {
              filename: "deepClone.ts（核心分支 —— 完整版含 Map/Set，scratchpad vitest 6 / 6）",
            }),
          ],
        },
        {
          id: "hd-flatten",
          heading: "flatten：递归的出口就是 depth",
          headingEn: "flatten: depth is what stops the recursion",
          lede: "Write a flatten with a depth parameter",
          body: (
            <>
              <p>
                <strong>一句话：</strong>遍历数组，遇到「是数组且 depth &gt; 0」
                就递归展开（depth 减一），否则原样收进结果 ——
                <code>depth</code> 本身就是递归的出口。
              </p>
              <p>
                两个语义细节要和原生 <code>Array.prototype.flat</code> 对齐，
                面试官就在这两处等你：<strong>默认 depth 是 1</strong>（不是
                Infinity），<strong>depth 0 返回浅拷贝</strong>（不是原数组的引用
                —— 不改输入是底线）。
              </p>
              <p>
                <strong>会追问：</strong>「不用递归写一遍」—— 用栈：
                <code>{"[...arr.map(v => [v, depth])]"}</code> 形式的工作栈，
                弹出时是数组且层数没用完就把子项带着层数压回去。
                递归版清晰、迭代版不吃调用栈，说得出取舍就够了。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> walk the array; when an item &ldquo;is an
                array and depth &gt; 0&rdquo;, recurse into it with depth minus one,
                otherwise push it as-is — <code>depth</code> itself is the recursion
                exit.
              </p>
              <p>
                Two semantic details must match the native{" "}
                <code>Array.prototype.flat</code>, and this is exactly where the
                interviewer waits for you: <strong>the default depth is 1</strong> (not
                Infinity), and <strong>depth 0 returns a shallow copy</strong> (not the
                original reference — never mutate the input).
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;Now without recursion&rdquo; — use a
                work stack of <code>[value, remainingDepth]</code> pairs; when you pop
                an array with depth left, push its children back with depth minus one.
                Recursion reads better, iteration does not consume the call stack —
                naming that trade-off is all they want.
              </p>
            </>
          ),
        },
        {
          id: "hd-curry",
          heading: "curry：攒参数必须造新数组",
          headingEn: "curry: collecting arguments means building a new array each time",
          lede: "Write a curry; why must partial applications not share state",
          body: (
            <>
              <p>
                <strong>一句话：</strong>攒到的参数够 <code>fn.length</code>
                就执行，不够就返回一个「接着攒」的新函数 ——
                攒的动作必须是 <code>(...more) =&gt; curried(...args, ...more)</code>
                这种<strong>拼新数组</strong>，不能往共享数组上 <code>push</code>。
              </p>
              <p>
                为什么这么严：<code>const add1 = curried(1)</code> 之后，
                <code>add1(2, 3)</code> 和 <code>add1(10, 20)</code>
                必须都从 <code>[1]</code> 出发。push 版第一次调用后共享数组变成
                <code>[1, 2, 3]</code>，第二次 <code>add1(10, 20)</code>
                实际拿到五个参数 —— <strong>部分应用被污染了</strong>。
                测试里专门有一条抓这个。
              </p>
              <p>
                <strong>会追问：</strong>「<code>fn.length</code> 有什么坑？」——
                它数不到默认参数和 rest 参数（<code>(a, b = 1) =&gt; {}</code> 的
                length 是 1），所以带默认参数的函数 curry 不动；说得出这一句，
                这道题就答干净了。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> once the collected arguments reach{" "}
                <code>fn.length</code>, run; otherwise return a new collector — and
                collecting must build a fresh array,{" "}
                <code>(...more) =&gt; curried(...args, ...more)</code>, never a{" "}
                <code>push</code> onto something shared.
              </p>
              <p>
                Why so strict: after <code>const add1 = curried(1)</code>, both{" "}
                <code>add1(2, 3)</code> and <code>add1(10, 20)</code> must start from{" "}
                <code>[1]</code>. With push, the shared array becomes{" "}
                <code>[1, 2, 3]</code> after the first call, so the second call really
                receives five arguments — <strong>the partial application is polluted</strong>
                . One test exists specifically to catch this.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;What is the catch with{" "}
                <code>fn.length</code>?&rdquo; — it does not count default or rest
                parameters (<code>(a, b = 1) =&gt; {"{}"}</code> has length 1), so
                functions with defaults do not curry cleanly. Saying that one sentence
                closes the question.
              </p>
            </>
          ),
          code: [
            tested("ts", REF_CURRY, {
              filename: "curry.ts（参考解法 —— scratchpad vitest 3 / 3）",
            }),
          ],
        },
      ],
      exercises: [
        {
          id: "hd-clone-write",
          kind: "code-completion",
          level: 3,
          title: "手写 deepClone（防循环）",
          prompt: (
            <>
              把「直接返回原值」的半成品写成完整的 deepClone：分支覆盖
              Date / Map / Set / 数组 / 普通对象，循环引用不爆栈。
              <strong>不许用 JSON.parse(JSON.stringify(x))。</strong>
            </>
          ),
          language: "ts",
          filename: "deepClone.ts",
          starter: `export function deepClone<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  void seen;
  // TODO: 先处理原始值，再按 Date / Map / Set / Array / 普通对象分支。
  //       每造一个新容器，立刻 seen.set(原对象, 新容器) —— 这一步防循环。
  return value;
}`,
          requirements: [
            "原始值和 null 原样返回",
            "嵌套对象 / 数组逐层克隆，每一层都是新引用",
            "Date 克隆成新 Date；Map / Set 深克隆",
            "循环引用不爆栈（WeakMap 登记「原对象 → 克隆」）",
            "不许用 JSON.parse(JSON.stringify(x))",
          ],
          checks: [
            { label: "用 WeakMap（或 seen）防循环", must: "seen\\.(has|get|set)" },
            { label: "处理了 Date", must: "instanceof Date" },
            { label: "区分数组与对象", must: "Array\\.isArray" },
            { label: "没有用 JSON 大法", mustNot: "JSON\\.parse" },
            { label: "没有用原生 structuredClone 代劳", mustNot: "structuredClone" },
          ],
          hints: [
            "第一行先把非对象挡回去：value === null || typeof value !== \"object\" 就原样返回。",
            "接着查 seen：seen.has(obj) 就直接 return seen.get(obj) —— 循环引用从这里出去。",
            "每个容器分支的固定节奏：造新容器 → seen.set(原对象, 新容器) → 再递归填内容。次序不能反。",
            "普通对象分支：for (const key of Object.keys(value)) out[key] = deepClone(value[key], seen)。",
          ],
          solution: tested("ts", REF_CLONE_CORE, {
            filename: "deepClone.ts（核心 —— 完整版含 Map/Set 分支，vitest 6 / 6）",
          }),
        },
        {
          id: "hd-flatten-write",
          kind: "code-completion",
          level: 3,
          title: "手写 flatten（depth 语义对齐原生 flat）",
          prompt: (
            <>
              把「只做浅拷贝」的半成品写成真正的 flatten：默认压一层，
              depth 控制层数，Infinity 全压平，不改输入。
              <strong>不许调用原生 <code>.flat()</code>。</strong>
            </>
          ),
          language: "ts",
          filename: "flatten.ts",
          starter: `export function flatten(arr: unknown[], depth = 1): unknown[] {
  void depth;
  // TODO: 遍历。是数组且 depth > 0 -> 递归展开（depth - 1）；否则原样收进结果。
  return [...arr];
}`,
          requirements: [
            "默认 depth 为 1，与 Array.prototype.flat 一致",
            "depth 控制展开层数，Infinity 全压平",
            "depth 0 返回浅拷贝，不是原数组引用",
            "不改输入数组；不许调用原生 .flat()",
          ],
          checks: [
            { label: "判断了「是数组且还有层数」", must: "Array\\.isArray[\\s\\S]*depth" },
            { label: "递归时层数减一", must: "depth - 1" },
            { label: "没有调用原生 flat", mustNot: "\\.flat\\(" },
          ],
          hints: [
            "外层一个结果数组，for...of 遍历输入。",
            "分支条件是「Array.isArray(item) && depth > 0」—— 两个条件缺一不可。",
            "递归展开用 out.push(...flatten(item, depth - 1))。",
            "否则 out.push(item) 原样收进去 —— 空数组会在展开分支里自然消失。",
          ],
          solution: tested(
            "ts",
            `export function flatten(arr: unknown[], depth = 1): unknown[] {
  const out: unknown[] = [];
  for (const item of arr) {
    if (Array.isArray(item) && depth > 0) {
      out.push(...flatten(item, depth - 1));
    } else {
      out.push(item);
    }
  }
  return out;
}`,
            { filename: "flatten.ts（scratchpad vitest 6 / 6）" },
          ),
        },
        {
          id: "hd-curry-write",
          kind: "code-completion",
          level: 3,
          title: "手写 curry（部分应用可复用）",
          prompt: (
            <>
              把「直接返回 fn」的半成品写成真正的 curry：参数攒够
              <code>fn.length</code> 就执行，可任意分组，
              部分应用复用互不污染。
            </>
          ),
          language: "ts",
          filename: "curry.ts",
          starter: `export function curry<T extends (...args: never[]) => unknown>(fn: T) {
  // TODO: 递归。args 够长就 fn(...args)，不够就返回
  //       (...more) => curried(...args, ...more)。
  return fn as (...args: unknown[]) => unknown;
}`,
          requirements: [
            "攒够 fn.length 个参数就执行",
            "参数可以任意分组：c(1)(2)(3) / c(1, 2)(3) / c(1)(2, 3)",
            "部分应用可复用：const add1 = c(1) 之后多次调用互不污染",
          ],
          checks: [
            { label: "用 fn.length 判断攒够没有", must: "fn\\.length" },
            { label: "攒参数是拼新数组（展开），不是 push", must: "\\.\\.\\.args" },
            { label: "没有往共享数组上 push", mustNot: "\\.push\\(" },
          ],
          hints: [
            "写一个内部递归函数 curried(...args)。",
            "args.length >= fn.length 就 return fn(...args)。",
            "不够就 return (...more) => curried(...args, ...more) —— 注意是拼出新数组。",
            "共 6 行。写完自测一下 const add1 = c(1); add1(2,3); add1(10,20) 两次结果对不对。",
          ],
          solution: tested("ts", REF_CURRY, {
            filename: "curry.ts（scratchpad vitest 3 / 3）",
          }),
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "ts",
            `// ✕ 「JSON 大法」—— 面试里给出这个答案基本等于没写
const clone = JSON.parse(JSON.stringify(source));

// 它悄悄弄丢 / 改坏的东西：
// { a: undefined }        -> {}            （键直接消失）
// { fn: () => {} }        -> {}            （函数消失）
// { d: new Date() }       -> { d: "2026-..." }（Date 变字符串）
// { m: new Map([...]) }   -> { m: {} }     （Map/Set 变空对象）
// a.self = a              -> TypeError     （循环引用直接抛错）`,
            { filename: "JSON.parse(JSON.stringify(x)) 的全部代价" },
          ),
          why: (
            <>
              这个写法在面试里不是「简洁的答案」，是<strong>暴露你没写过深拷贝</strong>。
              它的每一条代价都可能在生产里变成静默数据损坏 —— 尤其是
              <code>undefined</code> 键消失和 <code>Date</code> 变字符串这两条，
              坏了都没报错。练习的检查器直接把它列为禁用写法。
            </>
          ),
          whyEn: (
            <>
              In an interview this is not a short answer, it{" "}
              <strong>shows you have never written a deep clone</strong>. Every cost on
              that list can turn into data that is quietly wrong in production — above
              all the two where a <code>undefined</code> key disappears and a{" "}
              <code>Date</code> becomes a string, because neither reports an error. The
              checker in the exercise rejects this form outright.
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "克隆 / 序列化类题目提到「循环引用」",
          signalEn: "A clone or serialize problem mentions circular references",
          reachFor: "WeakMap 登记「原对象 → 结果」，先登记再递归",
          reachForEn: "Record source object to result in a WeakMap; record first, then recurse",
        },
        {
          signal: "「和原生 API 行为一致」",
          signalEn: "\"behave the same way as the built-in API\"",
          reachFor: "先把原生的默认值和边界抄下来（flat 默认 1、depth 0 浅拷贝）",
          reachForEn: "Write down the built-in defaults and edge cases first (flat defaults to 1, depth 0 is a shallow copy)",
        },
        {
          signal: "闭包攒东西 + 要求可复用",
          signalEn: "A closure collects values and the result has to be reusable",
          reachFor: "造新数组 / 新对象，绝不 push 共享的",
          reachForEn: "Build a new array or object every time; never push into a shared one",
        },
      ],
      recap: [
        "deepClone 的灵魂：先登记再递归。分支顺序：原始值 → seen → Date → Map/Set → 数组 → 对象。",
        "JSON.parse(JSON.stringify(x)) 的五宗罪要背下来 —— 这是必问的追问。",
        "flatten 的出口就是 depth；默认 1、depth 0 浅拷贝，语义对齐原生。",
        "curry 攒参数必须拼新数组 —— push 版会污染部分应用，有测试专门抓。",
        "fn.length 数不到默认参数和 rest 参数 —— 说得出这句就答干净了。",
      ],
      recapEn: [
        "The heart of deepClone: record first, then recurse. Branch order: primitive value, then seen, then Date, then Map/Set, then array, then object.",
        "Memorise the five things JSON.parse(JSON.stringify(x)) breaks — the follow-up on this always comes.",
        "depth is what stops flatten; the default is 1, depth 0 is a shallow copy, matching the built-in.",
        "curry has to join arguments into a new array — the push version leaks into other partly applied functions, and a test looks for exactly that.",
        "fn.length does not count default parameters or a rest parameter — saying that line finishes the answer cleanly.",
      ],
    },

    /* ============================================================
       第 3 课 · 异步与结构
       ============================================================ */
    {
      id: "iv-hand-async",
      title: "异步与结构：Promise.all、EventEmitter、LRU",
      titleEn: "Async and structure: Promise.all, EventEmitter, LRU",
      blurb: "下标写入保顺序、拷贝列表再遍历、Map 的插入序当链表用。",
      blurbEn:
        "Write by index to keep the order, copy the list before you walk it, and use the insertion order of a Map as a linked list.",
      minutes: 35,
      objectives: [
        "手写 Promise.all：按输入顺序收结果、首个失败立刻整体失败",
        "手写 Promise.allSettled，并说清它和 all 的语义差别",
        "手写 EventEmitter：on / off / once / emit，once 不挤掉邻居",
        "手写 LRUCache：利用 Map 的插入序，不手搓双向链表",
      ],
      objectivesEn: [
        "Write Promise.all by hand: results in input order, and the first failure fails the whole thing at once",
        "Write Promise.allSettled by hand, and say how it differs from all",
        "Write an EventEmitter by hand with on / off / once / emit, where once does not drop its neighbours",
        "Write an LRUCache by hand using the insertion order of a Map, with no hand-built doubly linked list",
      ],
      whyForAssessment:
        "Promise.all 是异步手写题的第一名，考点全在两个细节：结果顺序和短路失败。EventEmitter 考「遍历中修改列表」这个老陷阱。LRU 是数据结构题里最常见的一道 —— 知道 Map 按插入序遍历，就能把它从 40 行压到 15 行。",
      whyForAssessmentEn:
        "Promise.all is the most common async write-it-yourself question, and it turns on two details: the order of the results, and failing immediately on the first error. EventEmitter tests an old trap, changing a list while you walk it. LRU is the data structure question you see most often — once you know a Map iterates in insertion order, it drops from 40 lines to 15.",
      concepts: [
        {
          id: "hd-pall",
          heading: "Promise.all：下标写入 + 计数器",
          headingEn: "Promise.all: write by index, and count how many are done",
          lede: "Implement Promise.all and Promise.allSettled by hand",
          body: (
            <>
              <p>
                <strong>一句话：</strong>结果数组按<strong>输入下标</strong>写入
                （<code>results[i] = value</code>，不是 push），
                一个计数器数还剩几个没完成，归零时 resolve ——
                <strong>顺序由输入决定，不是完成先后</strong>。
              </p>
              <p>
                三个细节，每个都有测试：
              </p>
              <ul>
                <li>
                  <strong>空数组立刻 resolve。</strong>计数器从 0 开始等归零，
                  会等一个永远不来的事件 —— 先判空。
                </li>
                <li>
                  <strong>混普通值。</strong>每一项先 <code>Promise.resolve(item)</code>
                  包一层，普通值和 thenable 就都统一了。
                </li>
                <li>
                  <strong>短路失败。</strong><code>.then(onOk, reject)</code>
                  的第二个参数直接传 <code>reject</code> ——
                  第一个失败立刻让整体失败，<strong>不等慢的那些</strong>。
                </li>
              </ul>
              <p>
                <strong>allSettled 就是一层变换：</strong>把每一项包成
                「永远成功、结果里带 <code>status</code>」的 Promise，
                再交给自己写的 <code>promiseAll</code>。
                <strong>会追问：</strong>「all 和 allSettled 各用在哪」——
                结果互相依赖、缺一不可用 all（一败即停止等待）；
                各自独立、要逐个报告成败用 allSettled（比如批量上传的结果面板）。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> write results by{" "}
                <strong>input index</strong> (<code>results[i] = value</code>, never
                push), keep one counter of how many are still pending, resolve when it
                hits zero — <strong>order comes from the input, not from who finishes first</strong>
                .
              </p>
              <p>Three details, each with its own test:</p>
              <ul>
                <li>
                  <strong>An empty array resolves immediately.</strong> A counter that
                  starts at zero and waits to reach zero waits forever — check for empty
                  first.
                </li>
                <li>
                  <strong>Plain values are allowed.</strong> Wrap every item in{" "}
                  <code>Promise.resolve(item)</code> and plain values and thenables
                  become one case.
                </li>
                <li>
                  <strong>Fail fast.</strong> Pass <code>reject</code> straight in as
                  the second argument of <code>.then(onOk, reject)</code> — the first
                  rejection fails the whole thing,{" "}
                  <strong>without waiting for the slow ones</strong>.
                </li>
              </ul>
              <p>
                <strong>allSettled is one transformation away:</strong> wrap each item
                into a promise that always fulfills and carries a <code>status</code>,
                then feed those to your own <code>promiseAll</code>.{" "}
                <strong>Follow-up:</strong> &ldquo;when do you use which&rdquo; —
                results that depend on each other and are useless when incomplete: all
                (stop waiting on first failure); independent jobs that each need a
                success report: allSettled (a batch-upload results panel).
              </p>
            </>
          ),
          code: [
            tested("ts", REF_PALL, {
              filename: "promiseAll.ts（参考解法 —— scratchpad vitest 6 / 6，含 allSettled）",
            }),
          ],
        },
        {
          id: "hd-emitter",
          heading: "EventEmitter：拷贝一份再遍历",
          headingEn: "EventEmitter: copy the list, then walk the copy",
          lede: "Implement an EventEmitter with on, off, once and emit",
          body: (
            <>
              <p>
                <strong>一句话：</strong><code>Map&lt;事件名, 监听器数组&gt;</code>
                存订阅；唯一的坑在 <code>emit</code> ——
                <strong>遍历前先 <code>[...list]</code> 拷贝一份</strong>。
              </p>
              <p>
                为什么：<code>once</code> 的实现是包一层 wrapper，
                触发时先 <code>off</code> 掉自己再调原函数。如果 emit
                直接遍历原数组，wrapper 自删会让数组当场缩短，
                <strong>它旁边的监听器被跳过</strong> ——
                测试里「once 不挤掉邻居」那条抓的就是这个。
                这是「遍历中修改集合」这个通用陷阱在面试题里的标准形态。
              </p>
              <p>
                <strong>会追问：</strong>「off 传的函数和 on 的不是同一个引用怎么办」
                —— 匿名函数没法 off，这是 API 设计的固有约束，和 DOM 的
                <code>removeEventListener</code> 一样；所以 once 的 wrapper
                必须在内部持有自己的引用。「监听器抛错要不要影响后面的」——
                Node 的 EventEmitter 会直接抛断；健壮版本可以 try/catch
                逐个隔离，说出取舍即可。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> subscriptions live in a{" "}
                <code>Map&lt;event, listener[]&gt;</code>; the only trap is in{" "}
                <code>emit</code> —{" "}
                <strong>
                  copy the list with <code>[...list]</code> before iterating
                </strong>
                .
              </p>
              <p>
                Why: <code>once</code> is a wrapper that first <code>off</code>s itself,
                then calls the real function. If emit iterates the original array, that
                self-removal shortens the array mid-loop and{" "}
                <strong>the listener next to it gets skipped</strong> — the &ldquo;once
                does not knock out its neighbors&rdquo; test exists precisely for this.
                It is the classic &ldquo;mutating a collection while iterating it&rdquo;
                trap in its interview form.
              </p>
              <p>
                <strong>Follow-up:</strong> &ldquo;what if off receives a different
                reference than on did&rdquo; — anonymous functions cannot be removed;
                that is an inherent constraint of the API, same as DOM&rsquo;s{" "}
                <code>removeEventListener</code>, which is why the once wrapper must
                hold its own reference internally. &ldquo;should one throwing listener
                stop the rest&rdquo; — Node&rsquo;s EventEmitter lets it throw through;
                a hardened version isolates each call in try/catch. Naming the trade-off
                is enough.
              </p>
            </>
          ),
          code: [
            tested("ts", REF_EMITTER_CORE, {
              filename: "emitter.ts（emit 的关键 —— 完整版 6 / 6）",
            }),
          ],
        },
        {
          id: "hd-lru",
          heading: "LRU：Map 的插入序就是现成的链表",
          headingEn: "LRU: the insertion order of a Map is already the linked list you need",
          lede: "Implement an LRU cache without writing a linked list",
          body: (
            <>
              <p>
                <strong>一句话：</strong>JS 的 <code>Map</code> 按插入序遍历，
                所以「删掉再放回 = 挪到最新那头」「迭代器第一个键 = 最旧的那条」——
                两条性质拼起来，LRU 十五行写完，<strong>不需要手搓双向链表</strong>。
              </p>
              <p>
                两个操作各自的责任：<code>get</code> 命中时删掉再放回（读也算「用过」）；
                <code>put</code> 已存在先删再放（更新也刷新），放完超容量就删
                <code>map.keys().next().value</code>。
              </p>
              <p>
                <strong>会追问（区分 senior 的一问）：</strong>
                「教科书版为什么用哈希表 + 双向链表？」——
                因为那是语言无关的答案：O(1) 查找靠哈希表，O(1) 挪位和淘汰靠链表。
                JS 的 Map 恰好把两者捏在一起了（规范保证插入序）。
                能先给 Map 版、再讲清教科书版的数据结构原理，
                比只会背链表版强得多 —— 这说明你知道自己在用什么。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>In one line:</strong> a JS <code>Map</code> iterates in
                insertion order, so &ldquo;delete then re-set = move to the fresh
                end&rdquo; and &ldquo;the iterator&rsquo;s first key = the stalest
                entry&rdquo; — put those two properties together and LRU is fifteen
                lines, <strong>no hand-rolled doubly linked list required</strong>.
              </p>
              <p>
                Each operation&rsquo;s duty: <code>get</code> on a hit deletes and
                re-sets (reading counts as use); <code>put</code> deletes first if the
                key exists (updates refresh too), and after setting, evicts{" "}
                <code>map.keys().next().value</code> when over capacity.
              </p>
              <p>
                <strong>Follow-up (the senior separator):</strong> &ldquo;why does the
                textbook version use a hash map plus a doubly linked list?&rdquo; —
                because that is the language-agnostic answer: O(1) lookup from the hash
                map, O(1) reordering and eviction from the list. JS&rsquo;s Map happens
                to fuse the two (insertion order is guaranteed by the spec). Giving the
                Map version first and then explaining the textbook structure beats
                reciting the linked-list version cold — it shows you know what you are
                standing on.
              </p>
            </>
          ),
          code: [
            tested("ts", REF_LRU, {
              filename: "lru.ts（参考解法 —— scratchpad vitest 5 / 5）",
            }),
          ],
        },
      ],
      exercises: [
        {
          id: "hd-pall-write",
          kind: "code-completion",
          level: 3,
          title: "手写 Promise.all + allSettled",
          prompt: (
            <>
              把两个「直接 resolve 空数组」的半成品写成真的。
              <strong>不许调用原生 Promise.all / Promise.allSettled。</strong>
            </>
          ),
          language: "ts",
          filename: "promiseAll.ts",
          starter: `export function promiseAll<T>(items: (T | Promise<T>)[]): Promise<T[]> {
  void items;
  // TODO: new Promise 里 forEach + 下标写入 + 计数器；.then 的第二个参数直接传 reject。
  return Promise.resolve([]);
}

export type Settled<T> =
  | { status: "fulfilled"; value: T }
  | { status: "rejected"; reason: unknown };

export function promiseAllSettled<T>(items: (T | Promise<T>)[]): Promise<Settled<T>[]> {
  void items;
  // TODO: 把每一项包成「永远成功、结果里带 status」的 Promise，再交给 promiseAll。
  return Promise.resolve([]);
}`,
          requirements: [
            "结果按输入顺序排，不是完成顺序（下标写入，不许 push）",
            "空数组立刻 resolve([])",
            "数组里混普通值也行",
            "任何一个 reject，整体立刻 reject，不等慢的",
            "allSettled 永不 reject，逐项报 { status, value | reason }",
          ],
          checks: [
            { label: "手写了 executor", must: "new Promise" },
            { label: "按下标写入结果", must: "results\\[i\\]|results\\[index\\]" },
            { label: "普通值包了一层", must: "Promise\\.resolve\\(" },
            { label: "没有调用原生 Promise.all", mustNot: "Promise\\.all\\(" },
            { label: "没有调用原生 allSettled", mustNot: "Promise\\.allSettled\\(" },
          ],
          hints: [
            "promiseAll 的骨架：new Promise((resolve, reject) => { ... })，里面 results 数组 + remaining 计数器。",
            "先判空：remaining === 0 直接 resolve(results)。",
            "items.forEach((item, i) => Promise.resolve(item).then(value => { results[i] = value; remaining -= 1; if (remaining === 0) resolve(results); }, reject))。",
            "allSettled：items.map(item => Promise.resolve(item).then(v => ({status:\"fulfilled\",value:v}), r => ({status:\"rejected\",reason:r})))，再交给 promiseAll。",
          ],
          solution: tested("ts", REF_PALL, {
            filename: "promiseAll.ts（vitest 6 / 6，allSettled 在完整版里）",
          }),
        },
        {
          id: "hd-emitter-write",
          kind: "code-completion",
          level: 3,
          title: "手写 EventEmitter",
          prompt: (
            <>
              把空骨架填成完整的 EventEmitter：on / off / once / emit。
              重点：once 触发时不能挤掉同一事件的其他监听器。
            </>
          ),
          language: "ts",
          filename: "emitter.ts",
          starter: `type Listener = (...args: unknown[]) => void;

export class EventEmitter {
  private listeners = new Map<string, Listener[]>();

  on(event: string, fn: Listener): this {
    void event; void fn;
    // TODO
    return this;
  }

  off(event: string, fn: Listener): this {
    void event; void fn;
    // TODO: filter 掉那一个，别 splice 正在遍历的数组。
    return this;
  }

  once(event: string, fn: Listener): this {
    void event; void fn;
    // TODO: 包一层 wrapper —— 先 off(自己)，再调 fn。
    return this;
  }

  emit(event: string, ...args: unknown[]): boolean {
    void event; void args;
    // TODO: 没人听返回 false；有人听就 [...list] 拷贝后遍历，返回 true。
    return false;
  }
}`,
          requirements: [
            "on 注册；emit 按注册顺序调用所有监听器并传参",
            "off 只移除指定的那一个监听器",
            "once 只触发一次，且不挤掉同一事件的其他监听器",
            "emit 返回「有没有人在听」",
          ],
          checks: [
            { label: "emit 遍历前拷贝了列表", must: "\\[\\.\\.\\." },
            { label: "once 包了 wrapper 并自我移除", must: "once[\\s\\S]*off\\(" },
            { label: "off 用 filter（不改正在遍历的数组）", must: "\\.filter\\(" },
          ],
          hints: [
            "on：取出（或新建）该事件的数组，push 进去，存回 Map。",
            "off：this.listeners.set(event, list.filter(l => l !== fn))。",
            "once 的 wrapper：const wrapper = (...args) => { this.off(event, wrapper); fn(...args); }; 然后 on(event, wrapper)。",
            "emit：没人听返回 false；否则 for (const fn of [...list]) fn(...args)，返回 true —— 拷贝那步是 once 不挤掉邻居的关键。",
          ],
          solution: tested(
            "ts",
            `type Listener = (...args: unknown[]) => void;

export class EventEmitter {
  private listeners = new Map<string, Listener[]>();

  on(event: string, fn: Listener): this {
    const list = this.listeners.get(event) ?? [];
    list.push(fn);
    this.listeners.set(event, list);
    return this;
  }

  off(event: string, fn: Listener): this {
    const list = this.listeners.get(event);
    if (list) {
      this.listeners.set(
        event,
        list.filter((l) => l !== fn),
      );
    }
    return this;
  }

  once(event: string, fn: Listener): this {
    const wrapper: Listener = (...args) => {
      this.off(event, wrapper);
      fn(...args);
    };
    return this.on(event, wrapper);
  }

  emit(event: string, ...args: unknown[]): boolean {
    const list = this.listeners.get(event);
    if (!list || list.length === 0) return false;
    for (const fn of [...list]) fn(...args);
    return true;
  }
}`,
            { filename: "emitter.ts（scratchpad vitest 6 / 6）" },
          ),
        },
        {
          id: "hd-lru-write",
          kind: "code-completion",
          level: 3,
          title: "手写 LRUCache（用 Map，不写链表）",
          prompt: (
            <>
              把「什么都没存」的骨架写成真正的 LRU：超容量淘汰最久未使用，
              get 和 put 都要刷新「最近用过」。
            </>
          ),
          language: "ts",
          filename: "lru.ts",
          starter: `export class LRUCache<K, V> {
  private map = new Map<K, V>();

  constructor(private capacity: number) {
    if (capacity < 1) throw new Error("capacity must be at least 1");
  }

  get(key: K): V | undefined {
    void key;
    // TODO: 命中 -> 删掉再放回（刷新），返回值。
    return undefined;
  }

  put(key: K, value: V): void {
    void key; void value;
    // TODO: 已存在先删；set 之后超容量就删 map.keys().next().value。
  }

  get size(): number {
    return this.map.size;
  }
}`,
          requirements: [
            "get / put 基本读写；get 不到返回 undefined",
            "超容量时淘汰最久未使用的那条",
            "get 命中要刷新「最近用过」",
            "put 已存在的 key：更新值并刷新",
            "capacity 为 1 也要正确",
          ],
          checks: [
            { label: "刷新 = 删掉再放回", must: "delete\\(" },
            { label: "淘汰迭代器的第一个键", must: "keys\\(\\)\\.next\\(\\)" },
          ],
          hints: [
            "核心洞察：Map 按插入序遍历。「删掉再 set」= 挪到最新；keys().next().value = 最旧。",
            "get：!has 返回 undefined；否则取值、delete、set 回去、返回值。",
            "put：has 就先 delete；set；然后 size > capacity 时删 keys().next().value。",
            "先写 get 后写 put，两个都围绕「删掉再放回」这一个动作。",
          ],
          solution: tested("ts", REF_LRU, {
            filename: "lru.ts（scratchpad vitest 5 / 5）",
          }),
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "ts",
            `// ✕ 用 push 收结果 —— 顺序变成「谁先完成谁在前」
items.forEach((item) => {
  Promise.resolve(item).then((value) => {
    results.push(value);              // 快的插队了
    if (results.length === items.length) resolve(results);
  }, reject);
});

// promiseAll([slow("a"), fast("b")]) 会得到 ["b", "a"] —— 测试第一条就红`,
            { filename: "Promise.all 手写题的第一名错法" },
          ),
          why: (
            <>
              <code>Promise.all</code> 的合同是<strong>结果顺序 = 输入顺序</strong>，
              和完成先后无关 —— 调用方靠下标对应输入和输出。push
              版在并发下顺序随机，而且这个 bug 在「恰好都一样快」的本地测试里
              经常测不出来，上了生产才炸。<strong>永远用
              <code>results[i] = value</code> 按下标写。</strong>
            </>
          ),
          whyEn: (
            <>
              The contract of <code>Promise.all</code> is that{" "}
              <strong>the results come back in input order</strong>, no matter which one
              finishes first — the caller matches input to output by index. The push
              version gives a random order once the calls really run in parallel, and
              this bug often does not show up in a local test where every call takes the
              same time, so it only appears in production.{" "}
              <strong>
                Always write by index with <code>results[i] = value</code>.
              </strong>
            </>
          ),
        },
      ],
      transfer: [
        {
          signal: "「结果要和输入对得上」的并发题",
          signalEn: "A parallel problem where the results have to line up with the input",
          reachFor: "下标写入 + 计数器，别 push",
          reachForEn: "Write by index and keep a counter; do not push",
        },
        {
          signal: "回调 / 监听器列表在触发中会变",
          signalEn: "A list of callbacks or listeners changes while it is being run",
          reachFor: "遍历前拷贝一份（[...list]）",
          reachForEn: "Copy it before you walk it ([...list])",
        },
        {
          signal: "要 O(1) 的「最近使用」语义",
          signalEn: "You need O(1) most-recently-used behaviour",
          reachFor: "JS 里先想 Map 的插入序，再讲教科书的哈希 + 链表",
          reachForEn: "In JavaScript reach for the insertion order of a Map first, then explain the textbook hash map plus linked list",
        },
        {
          signal: "「XX 和 XX 的语义差别」式追问",
          signalEn: "A follow-up of the form \"how do X and Y differ\"",
          reachFor: "一败即停 vs 逐项报告 —— 用场景答，不用定义答",
          reachForEn: "Stop on the first failure versus report on every item — answer with a scenario, not a definition",
        },
      ],
      recap: [
        "Promise.all 三件套：下标写入、空数组先判、reject 直接当 then 的第二参 —— 短路失败。",
        "allSettled = 每项包成「永远成功带 status」再交给 all；场景差别要用例子答。",
        "EventEmitter 唯一的坑：emit 拷贝列表再遍历，once 的自删才不会挤掉邻居。",
        "LRU 用 Map 的插入序：删掉再放回 = 刷新，迭代器第一个键 = 最旧。",
        "教科书版哈希表 + 双向链表是语言无关的答案 —— 两个版本都要会讲。",
      ],
      recapEn: [
        "Three parts to Promise.all: write by index, check for an empty array first, and pass reject as the second argument of then so the first failure ends it.",
        "allSettled = wrap every item so it always succeeds and carries a status, then hand them to all; answer the difference with an example.",
        "The one trap in EventEmitter: emit copies the list before walking it, so a once listener removing itself does not drop its neighbours.",
        "LRU with the insertion order of a Map: delete then set again to refresh, and the first key from the iterator is the oldest.",
        "The textbook hash map plus doubly linked list is the language-independent answer — be able to explain both versions.",
      ],
    },
  ],
};
