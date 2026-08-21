// Coding 题库 —— 17 道成型的完整题目。
//
// 【为什么要有这一层】
// 这些题本来就存在，只是被拆成了三种形态散在 67 节课里：
// 有的是 code-completion 练习，有的是 from-scratch，有的只在课文正文里。
// 于是「我想找一道 React 的中等难度题练手」这件事没法做。
// 这里把它们登记成一张表，题面 / 需求 / 参考答案全部**引用**原练习，不复制。
//
// 【sandbox 字段是阶段 D 的事】
// runnable 标的是「这道题原理上能在浏览器里跑」；
// sandbox 有没有填，决定页面上给的是沙箱还是「本机跑」卡片。
// **没在浏览器里真跑绿之前不许填 sandbox** —— 那会让页面上出现一个跑不起来的编辑器。
//
// 【只在服务端 import】

import type {
  CodeCompletionExercise,
  CodingProblem,
  Exercise,
  FromScratchExercise,
  SandboxSpec,
} from "./types";
import { EXAMS } from "./exam-list";
import { tested } from "./helpers";

interface Spec {
  id: string;
  title: string;
  track: CodingProblem["track"];
  difficulty: 1 | 2 | 3;
  minutes: number;
  /** 从哪个练习派生题面、需求和参考答案 */
  from: string;
  /** 「展开讲解」引用哪一节 */
  explain: string;
  runnable: boolean;
  /** 不可运行时的本机命令 */
  commands?: { cmd: string; expect: string }[];
  /**
   * 自带题面。Tabs 和 useRef 播放器没有独立练习，
   * 题面推不出来，所以在这里直接写一句。
   */
  brief?: string;
  /**
   * 显式覆盖验收标准。
   *
   * 为什么需要：来源练习常常只是整道题里的**一块**（一个「写整块」练习），
   * 而 coding 题是整道题。评论树那道就撞上了 —— 来源练习
   * `r-var-comments-write` 只写 `addReply`，所以页面上的验收标准只提 addReply，
   * 可沙箱里的测试还查 `countComments` 和 `maxDepth`。
   * 「页面上写的要求」和「测试实际查的东西」不一致，是最坑人的一种不一致。
   * 有这个字段就在这里把整道题的要求写全，不去改那个练习。
   */
  requirements?: string[];
  /**
   * 显式覆盖参考答案。
   *
   * 为什么需要：沙箱的文件划分不一定和源项目一样。Cab Booking 那道就是 ——
   * 源项目是 index.jsx 包 App.jsx，沙箱里必须是 App.tsx 包 CabApp.tsx
   * （Sandpack 的入口固定渲染 <App />，而 App 自己要用 Context，
   * 所以 Provider 得在它里面再包一层）。
   * 派生出来的答案是源项目那 9 个文件，跟沙箱里的文件名对不上 ——
   * **答案门后必须放真的能让沙箱变绿的代码**，所以这里显式覆盖。
   */
  solution?: CodingProblem["solution"];
  /**
   * 浏览器沙箱。**只有在浏览器里点「跑测试」真的看到绿才准填。**
   * 没填的题页面会自动退回「本机跑」卡片 —— 那比给一个跑不起来的编辑器好。
   */
  sandbox?: SandboxSpec;
}

/**
 * 沙箱的依赖钉版本。
 *
 * react-ts 模板自带的是范围号（^19.0.0），会随 CDN 上的最新版飘。
 * 钉死具体版本，保证浏览器里跑的 React 和本站内容用的是同一代。
 */
export const SANDBOX_DEPS: Record<string, string> = {
  react: "19.0.0",
  "react-dom": "19.0.0",
};

/**
 * 难度口径（对齐题库自己的 Easy / Medium / Hard）：
 *   1 = 一个概念，十几分钟
 *   2 = 两三个概念叠在一起，或有个明确的坑
 *   3 = 完整的多文件功能，或需要自己搭环境
 */

/* ---------- 沙箱规格 ----------
   从 scratchpad 里实测过的实现转写成 jest-like。
   **每一份都在浏览器里点过「跑测试」看到绿才填进来**，而且两头都验：
   起始文件要真的红（证明测试在判分），换成参考实现要真的绿。
   依赖钉死具体版本，不用范围号 —— 范围号会随 CDN 上的最新版飘。

   【十二份沙箱的实测记录】localhost:3480，起始态 / 参考实现态都跑过：

     题目               起始文件            参考实现          备注
     kanban             3F 1P               4 passed          「找不到卡返回同一引用」空实现蒙对
     run-tasks          6F                  6 passed          9.4s，真定时器
     comment-tree       8F                  8 passed          0.02s
     tabs               9F                  9 passed          RTL
     todo-list          8F                  8 passed          RTL
     theme-context      6F **2P**           8 passed          那 2 个「通过」是空实现蒙的 ——
                                                              toggleTheme 什么都不做，于是
                                                              「点两次回到原点」自动成立。
                                                              **主线①「测试通过 ≠ 做对了」的活例子**
     star-rating        9F                  9 passed          RTL
     use-local-storage  4F **3P**           7 passed          那 3 个也是蒙的：从不碰 storage，
                                                              「兜底」自然全对
     dropdown           7F 1P               8 passed          RTL + document 事件
     timer              4F 3P               7 passed          12.7s，见下面「坑四」
     rtk-todo           9F **1P**           10 passed         那 1 个是空 createSlice 仍返回
                                                              initialState 蒙对；@reduxjs/toolkit
                                                              和 react-redux 都能从 CDN 拉到
     notes-manager      8F                  8 passed          React 考试 Q1 原题。2 个要自己写 +
                                                              3 个给定。**测试里那个 tick() 不是
                                                              摆设** —— 见下面「坑六」
     cab-booking-app    9F **1P**           10 passed         5 个要自己写的文件 + 5 个给定文件。
                                                              那 1 个「通过」又是空实现蒙的 ——
                                                              Loading 里一个 effect 都没有，
                                                              于是「卸载后不许再调 onComplete」
                                                              自动成立。浏览器里 7.9s，
                                                              本机 vitest 同一套测试 5.7s，
                                                              两边都是 10 / 10

   剩下 4 道是「本机跑」卡片：
     · fetch-user / player —— **试过，跑不通**，见下面「坑五」
     · orders-subgraph / spring-endpoints —— Node / Java，本来就进不了浏览器

   （notes-manager 原来也在这张「跑不了」的名单上，理由写的是「多文件的大题，
     放考场里更合适」—— 那是个说不通的理由：它就是纯 React 组件加 RTL，
     形状和上面 12 道一样。后来补上了，见表格里那一行。）

   【坑一：测试文件必须是纯 ASCII】
   Sandpack 的测试面板在断言失败下面会打一段源码片段，**那段片段是按 Latin-1
   解码的** —— 测试文件里任何非 ASCII 字节都会变成乱码（`ç»æé¡ºåº…`），
   而它恰好出现在你最需要读它的时候。
   ✕ / ● 那两行的测试名是走 postMessage 的 JS 字符串，中文渲染正常；只有片段坏。
   所以四份测试文件的**测试名和注释全用英文**，中文要求写在起始文件的头注释里
   （起始文件显示在 CodeMirror 里，UTF-8 正常）。
   顺带一说：真实 assessment 的测试本来就是英文的，这样反而更接近考场。
   改完用 `grep -P '[^\x00-\x7F]'` 复查，别靠眼睛看。

   【坑二：RTL 要显式装 @testing-library/dom】
   `@testing-library/react` 16 把 `@testing-library/dom` 列为 peerDependency，
   Sandpack 不会自动装 peer，只报
   「Could not find dependency: '@testing-library/dom'」。
   两个都写进 dependencies 才能跑（见 SB_TABS）。
   **RTL 在 Sandpack 里是可用的** —— render / screen / fireEvent / getAllByRole
   全部正常，组件题因此都能上沙箱。

   【坑三：沙箱不在视口里就永远不启动】
   Sandpack 默认 `initMode: "lazy"`，用 IntersectionObserver 等元素进视口才启动
   iframe。在自动化里如果视口是 0×0 或者从没真正 paint 过，iframe 的 src 一直是
   空字符串，测试面板停在 idle，看起来像「点了没反应」。
   人用是没问题的（点「打开工作区」时它就在眼前）；验证时要先 resize 到真实尺寸
   并截一次图强制 paint。
   另外页面刷新后测试面板是 idle 的，要先让沙箱起来再点「跑测试」。

   【坑四：时间相关的测试要按真实时钟写，而且每个 test 只有 5 秒】
   ① 没有 fake timer。`jest.useFakeTimers` 不存在，只能真等。
   ② 每个 setTimeout 比你要的多花几百毫秒。实测 `wait(1000)` 让 1 秒的
      interval 跳了**两次**。所以**不许断言精确的秒数** ——
      timer 那份测试改成 `until(pred, budget)` 轮询真实时钟。
   ③ **每个 test 有 5000ms 硬上限，而且没法调高。**
      超时的那个 test 还会把后面的 test 一起弄坏（DOM 留在未挂载状态，
      后面全报 "unable to find an element"）。
      所以一个 test 最多等两次。
   ④ 实测的换算：一个 1000ms 的 setTimeout 在浏览器沙箱里落在 **~1900ms**
      （本机 vitest 是 ~1110ms）。所以「等一次 1 秒」是安全的，
      「等四次 1 秒」一定超预算 —— cab-booking 那道的「只留最新三条」因此
      改成直接驱动 Context 连写四条，不走四趟加载页。

   【坑五：测试文件里打的猴子补丁，只有一部分能拦到 app 模块】
   实测（都是在参考实现上验的，不是猜的）：

     能拦到                         拦不到
     JSON.parse                     Storage.prototype.getItem / setItem
     globalThis + window            globalThis / window / self 上的 fetch
       上的 setInterval /            HTMLMediaElement.prototype 上的
       clearInterval                  play / pause / currentTime
     document.addEventListener /
       removeEventListener

   拦不到的那几个，八成是 CodeSandbox 的打包器给 localStorage / fetch /
   媒体元素塞了自己的 shim。后果：
     · fetch-user 那道要 stub fetch 才能测竞态 → **9 条全红，退回「本机跑」**
     · player 那道要 stub play / currentTime → **5 条红，退回「本机跑」**
   两道的测试都在 scratchpad 用 vitest 跑通过（9 / 9 和 7 / 7），
   是环境不行，不是测试写错了。要上沙箱得先想办法注入依赖，
   那会改动题目本身（把 fetch 变成一个 prop），所以不做。
   ---------- 
   【坑六：源项目用 Date.now() 当 id，同一毫秒内会撞】
   notes-manager 的参考答案（= react-notes-app 磁盘上的完成版）里，新笔记的 id 是
   `noteToEdit ? noteToEdit.id : Date.now()`。**连着加两条会拿到同一个 id** ——
   于是 `map(note.id === submittedNote.id ? ... )` 一次替换掉两行。
   浏览器 Sandpack 里实测就是这样：`["a", "b renamed", "b renamed"]`，
   本机 vitest 慢一点、毫秒刚好错开，8 / 8 反而全绿 ——
   **同一份代码同一份测试，两个环境两个结果**。
   源项目自己那 4 个测试永远只加一条就编辑，所以永远抓不到这个。
   这正是全站主线 ①「测试通过 ≠ 做对了」，而且是从源项目里挖出来的，不是编的。

   处理办法：**不改源项目的代码**（那是硬规矩），改成让测试自己保证 id 不撞 ——
   测试里的 `tick()` 空转到 `Date.now()` 跳一格再加下一条，每行最多多花 1ms。
   所以 `tick()` 不是摆设，删了它第 6 条测试会变成随机红。
*/

const SB_KANBAN: SandboxSpec = {
  "files": {
    "/moveCard.ts": "import type { Board, ColumnId } from \"./types\";\n\n/**\n * 把 cardId 这张卡从 from 列移到 to 列，返回全新的 board。\n *\n * 要求（测试逐条查）：\n *   · from 和 to 相同时，返回**同一个引用**（不是 { ...board }）\n *   · 找不到这张卡时，也返回同一个引用\n *   · 不许修改传进来的 board —— 测试会深冻结它\n *   · 没被碰到的列要复用原数组引用\n *   · 不许 push / splice / 深拷贝\n */\nexport function moveCard(\n  board: Board,\n  from: ColumnId,\n  to: ColumnId,\n  cardId: number,\n): Board {\n  // 你的实现\n  return board;\n}\n",
    "/types.ts": "export type ColumnId = \"todo\" | \"doing\" | \"done\";\nexport type Card = { id: number; title: string };\nexport type Board = Record<ColumnId, Card[]>;\n",
    "/App.tsx": "import { moveCard } from \"./moveCard\";\nimport type { Board } from \"./types\";\n\n// 预览区只是让眼睛有东西看，判分看下面的测试。\nconst initial: Board = {\n  todo: [{ id: 1, title: \"写文档\" }, { id: 2, title: \"改 bug\" }],\n  doing: [{ id: 3, title: \"评审\" }],\n  done: [],\n};\n\nexport default function App() {\n  let board = initial;\n  try {\n    board = moveCard(initial, \"todo\", \"doing\", 1) ?? initial;\n  } catch {\n    board = initial;\n  }\n  return (\n    <div style={{ fontFamily: \"system-ui\", padding: 16, display: \"flex\", gap: 24 }}>\n      {([\"todo\", \"doing\", \"done\"] as const).map((col) => (\n        <section key={col}>\n          <h4 style={{ margin: \"0 0 6px\" }}>{col}</h4>\n          <ul style={{ paddingLeft: 18, margin: 0 }}>\n            {(board[col] ?? []).map((c) => (\n              <li key={c.id}>{c.title}</li>\n            ))}\n          </ul>\n        </section>\n      ))}\n    </div>\n  );\n}\n"
  },
  "tests": "// Test names are in English on purpose.\n//\n// Sandpack's test runner decodes the source snippet it prints under a failed\n// assertion as Latin-1, so any non-ASCII byte in THIS file comes out as mojibake\n// exactly when you need to read it. The real assessment's tests are in English\n// anyway, so this is closer to the thing you are training for.\n// The Chinese wording of every requirement is in the starter file's header.\n\nimport { moveCard } from \"./moveCard\";\n\nconst board = () => ({\n  todo: [\n    { id: 1, title: \"Write docs\" },\n    { id: 2, title: \"Fix bug\" },\n  ],\n  doing: [{ id: 3, title: \"Review\" }],\n  done: [],\n});\n\nfunction deepFreeze(o) {\n  Object.freeze(o);\n  Object.values(o).forEach((v) => {\n    if (v && typeof v === \"object\" && !Object.isFrozen(v)) deepFreeze(v);\n  });\n  return o;\n}\n\ntest(\"moves the card into the target column without touching the input\", () => {\n  const original = deepFreeze(board());\n  const next = moveCard(original, \"todo\", \"doing\", 1);\n\n  expect(next.todo.map((c) => c.id)).toEqual([2]);\n  expect(next.doing.map((c) => c.id)).toEqual([3, 1]);\n  expect(original.todo.map((c) => c.id)).toEqual([1, 2]);\n  expect(original.doing.map((c) => c.id)).toEqual([3]);\n});\n\ntest(\"returns the very same reference when nothing moves or the card is missing\", () => {\n  const b = board();\n  expect(moveCard(b, \"todo\", \"todo\", 1)).toBe(b);\n  expect(moveCard(b, \"todo\", \"done\", 999)).toBe(b);\n});\n\ntest(\"reuses the array reference of untouched columns\", () => {\n  const b = board();\n  const next = moveCard(b, \"todo\", \"doing\", 1);\n  expect(next.done).toBe(b.done);\n  expect(next.todo).not.toBe(b.todo);\n});\n\ntest(\"two moves in a row land the card in done\", () => {\n  let b = board();\n  b = moveCard(b, \"todo\", \"doing\", 1);\n  b = moveCard(b, \"doing\", \"done\", 1);\n  expect(b.done.map((c) => c.id)).toEqual([1]);\n  expect(b.doing.map((c) => c.id)).toEqual([3]);\n  expect(b.todo.map((c) => c.id)).toEqual([2]);\n});\n",
  "dependencies": {
    "react": "19.0.0",
    "react-dom": "19.0.0"
  },
  "expect": "4 passed",
  "blankKeep": [
    "/types.ts"
  ]
};

const SB_RUNTASKS: SandboxSpec = {
  "files": {
    "/runTasks.ts": "// Q2: 自己实现一个带并发上限的异步任务运行器。\n//\n// 要求（测试逐条查）：\n// 1. tasks 是一个**函数数组**。每个函数被调用时才启动异步任务并返回 Promise。\n//    —— 所以任务是懒的：没轮到之前不许调用它。\n// 2. 同时最多只能有 limit 个任务在跑。必须等其中一个跑完，才能启动下一个。\n// 3. 运行器**永不抛错**，哪怕有任务 reject。它 resolve 出一个\n//    与 tasks **同序**的结果数组：\n//      { status: \"fulfilled\", value: T }        成功\n//      { status: \"rejected\",  reason: unknown } 失败\n//    （就是 Promise.allSettled，但多了并发节流。）\n\nexport type Task<T> = () => Promise<T>;\n\nexport type SettledResult<T> =\n  | { status: \"fulfilled\"; value: T }\n  | { status: \"rejected\"; reason: unknown };\n\nexport async function runTasks<T>(\n  tasks: Task<T>[],\n  limit: number,\n): Promise<SettledResult<T>[]> {\n  // TODO: 你的实现\n  //\n  // 提示的提示：别想着「一批一批地跑」（那是 chunk，第一批里最慢的会拖住整批）。\n  // 想成「开 limit 个工人，每个工人循环从同一个下标游标上取下一个任务」。\n  void limit;\n  return tasks.map(() => ({ status: \"rejected\", reason: \"not implemented\" }));\n}\n",
    "/App.tsx": "import { useState } from \"react\";\nimport { runTasks } from \"./runTasks\";\nimport type { Task } from \"./runTasks\";\n\n// 预览区只是让眼睛有东西看，判分看下面的测试。\n// 这里把「同时在跑几个」画出来 —— 写对了峰值不会超过 2。\n\nexport default function App() {\n  const [log, setLog] = useState<string[]>([]);\n  const [peak, setPeak] = useState(0);\n\n  const go = async () => {\n    setLog([]);\n    let running = 0;\n    let hi = 0;\n    const lines: string[] = [];\n    const mk =\n      (id: number, ms: number, fail = false): Task<string> =>\n      () =>\n        new Promise((resolve, reject) => {\n          running++;\n          hi = Math.max(hi, running);\n          lines.push(`task ${id} START  (同时在跑 ${running})`);\n          setTimeout(() => {\n            running--;\n            if (fail) reject(new Error(`task ${id} failed`));\n            else resolve(`result of task ${id}`);\n          }, ms);\n        });\n\n    const out = await runTasks(\n      [mk(1, 300), mk(2, 100), mk(3, 200, true), mk(4, 100), mk(5, 150), mk(6, 100)],\n      2,\n    );\n    lines.push(\"--- 结果（必须是输入顺序）---\");\n    out.forEach((r, i) => {\n      lines.push(\n        `#${i + 1} ${r.status}: ${r.status === \"fulfilled\" ? r.value : String(r.reason)}`,\n      );\n    });\n    setPeak(hi);\n    setLog(lines);\n  };\n\n  return (\n    <div style={{ fontFamily: \"system-ui\", padding: 16, fontSize: 13 }}>\n      <button onClick={go} style={{ padding: \"6px 12px\", marginBottom: 10 }}>\n        跑一遍（limit = 2）\n      </button>\n      {peak > 0 && (\n        <p style={{ margin: \"0 0 8px\", fontWeight: 600 }}>\n          并发峰值：{peak} {peak <= 2 ? \"✓\" : \"✕ 超了\"}\n        </p>\n      )}\n      <pre style={{ margin: 0, whiteSpace: \"pre-wrap\", lineHeight: 1.6 }}>\n        {log.join(\"\\n\")}\n      </pre>\n    </div>\n  );\n}\n"
  },
  "tests": "// Test names are in English on purpose.\n//\n// Sandpack's test runner decodes the source snippet it prints under a failed\n// assertion as Latin-1, so any non-ASCII byte in THIS file comes out as mojibake\n// exactly when you need to read it. The real assessment's tests are in English\n// anyway, so this is closer to the thing you are training for.\n// The Chinese wording of every requirement is in the starter file's header.\n\nimport { runTasks } from \"./runTasks\";\nimport type { Task } from \"./runTasks\";\n\n// A task factory that records how many are running at the same time.\n// `peak` is the only hard evidence that the throttle actually works.\nfunction makeTracker() {\n  const state = { running: 0, peak: 0, order: [] as number[] };\n  const task =\n    (id: number, ms: number, fail = false): Task<string> =>\n    () =>\n      new Promise((resolve, reject) => {\n        state.running++;\n        state.peak = Math.max(state.peak, state.running);\n        state.order.push(id);\n        setTimeout(() => {\n          state.running--;\n          if (fail) reject(new Error(`task ${id} failed`));\n          else resolve(`result of task ${id}`);\n        }, ms);\n      });\n  return { state, task };\n}\n\ndescribe(\"runTasks\", () => {\n  test(\"never runs more than `limit` tasks at once\", async () => {\n    const { state, task } = makeTracker();\n    const tasks = [30, 10, 20, 10, 15, 10].map((ms, i) => task(i + 1, ms));\n    await runTasks(tasks, 2);\n    expect(state.peak).toBe(2);\n  });\n\n  test(\"results follow input order, not completion order\", async () => {\n    const { task } = makeTracker();\n    // The first task is the slowest on purpose, so the later ones finish first.\n    const tasks = [task(1, 40), task(2, 5), task(3, 5)];\n    const out = await runTasks(tasks, 3);\n    expect(out.map((r) => (r.status === \"fulfilled\" ? r.value : r.reason))).toEqual([\n      \"result of task 1\",\n      \"result of task 2\",\n      \"result of task 3\",\n    ]);\n  });\n\n  test(\"a rejecting task does not reject the whole run\", async () => {\n    const { task } = makeTracker();\n    const tasks = [task(1, 10), task(2, 10, true), task(3, 10)];\n    const out = await runTasks(tasks, 2);\n    expect(out[0].status).toBe(\"fulfilled\");\n    expect(out[1].status).toBe(\"rejected\");\n    expect(out[2].status).toBe(\"fulfilled\");\n    expect(out[1].status === \"rejected\" && (out[1].reason as Error).message).toBe(\n      \"task 2 failed\",\n    );\n  });\n\n  test(\"calls every task exactly once\", async () => {\n    let calls = 0;\n    const t: Task<number> = async () => {\n      calls++;\n      return calls;\n    };\n    await runTasks([t, t, t, t], 2);\n    expect(calls).toBe(4);\n  });\n\n  test(\"handles limit > tasks.length, and an empty array\", async () => {\n    const { state, task } = makeTracker();\n    const out = await runTasks([task(1, 5), task(2, 5)], 10);\n    expect(out.length).toBe(2);\n    expect(state.peak).toBe(2);\n    expect(await runTasks([], 3)).toEqual([]);\n  });\n\n  test(\"tasks are lazy: none is called before its turn\", async () => {\n    const started: number[] = [];\n    const mk =\n      (id: number, ms: number): Task<number> =>\n      () =>\n        new Promise((res) => {\n          started.push(id);\n          setTimeout(() => res(id), ms);\n        });\n    const p = runTasks([mk(1, 30), mk(2, 30), mk(3, 30)], 1);\n    // At the end of the synchronous phase, limit=1 means only #1 has started.\n    expect(started).toEqual([1]);\n    await p;\n    expect(started).toEqual([1, 2, 3]);\n  });\n});\n",
  "dependencies": {
    "react": "19.0.0",
    "react-dom": "19.0.0"
  },
  "expect": "6 passed"
};

const SB_COMMENTTREE: SandboxSpec = {
  "files": {
    "/commentTree.ts": "export interface Comment {\n  id: number;\n  author: string;\n  body: string;\n  replies: Comment[];\n}\n\n/**\n * 递归统计总条数（含所有层级的回复）。\n * 注意：不是 nodes.length —— 那只数了顶层。\n */\nexport function countComments(nodes: Comment[]): number {\n  // TODO: 你的实现\n  return 0;\n}\n\n/**\n * 往树里某个节点下面加一条回复，返回**全新的**树。\n *\n * 要求（测试逐条查）：\n *   · 不许修改传进来的树 —— 测试会深冻结它，改了直接抛\n *   · 目标可能藏在任意深度，不只是顶层\n *   · parentId 不存在时，树的内容不变\n *   · 同一个 parent 连加两条，按加入顺序排在后面\n *   · 不许 push / splice\n */\nexport function addReply(\n  nodes: Comment[],\n  parentId: number,\n  reply: Comment,\n): Comment[] {\n  // TODO: 你的实现\n  return nodes;\n}\n\n/** 最深那条路径有几层。空数组是 0。 */\nexport function maxDepth(nodes: Comment[]): number {\n  // TODO: 你的实现\n  return 0;\n}\n",
    "/App.tsx": "import { useState } from \"react\";\nimport { addReply, countComments, maxDepth } from \"./commentTree\";\nimport type { Comment } from \"./commentTree\";\n\n// 预览区只是让眼睛有东西看，判分看下面的测试。\n// 一个真的能点「回复」的递归组件 —— 写对了计数和层数会跟着变。\n\nconst seed: Comment[] = [\n  {\n    id: 1,\n    author: \"ann\",\n    body: \"第一条\",\n    replies: [\n      { id: 2, author: \"bob\", body: \"回 ann\", replies: [] },\n      { id: 3, author: \"cat\", body: \"也回 ann\", replies: [] },\n    ],\n  },\n  { id: 4, author: \"dan\", body: \"另起一条\", replies: [] },\n];\n\nfunction Node({\n  node,\n  depth,\n  onReply,\n}: {\n  node: Comment;\n  depth: number;\n  onReply: (parentId: number) => void;\n}) {\n  return (\n    <li style={{ marginLeft: depth * 14, listStyle: \"none\", marginBottom: 4 }}>\n      <b>{node.author}</b> {node.body}{\" \"}\n      <button onClick={() => onReply(node.id)} style={{ fontSize: 11 }}>\n        回复\n      </button>\n      {node.replies.length > 0 && (\n        <ul style={{ paddingLeft: 0, margin: \"4px 0 0\" }}>\n          {node.replies.map((r) => (\n            <Node key={r.id} depth={depth + 1} node={r} onReply={onReply} />\n          ))}\n        </ul>\n      )}\n    </li>\n  );\n}\n\nexport default function App() {\n  const [tree, setTree] = useState<Comment[]>(seed);\n  const [next, setNext] = useState(100);\n\n  const reply = (parentId: number) => {\n    setTree((t) =>\n      addReply(t, parentId, {\n        id: next,\n        author: \"me\",\n        body: `新回复 #${next}`,\n        replies: [],\n      }),\n    );\n    setNext((n) => n + 1);\n  };\n\n  return (\n    <div style={{ fontFamily: \"system-ui\", padding: 16, fontSize: 13 }}>\n      <p style={{ margin: \"0 0 10px\" }}>\n        总条数 <b>{countComments(tree)}</b> · 最大层数 <b>{maxDepth(tree)}</b>\n      </p>\n      <ul style={{ paddingLeft: 0, margin: 0 }}>\n        {tree.map((n) => (\n          <Node key={n.id} depth={0} node={n} onReply={reply} />\n        ))}\n      </ul>\n    </div>\n  );\n}\n"
  },
  "tests": "// Test names are in English on purpose.\n//\n// Sandpack's test runner decodes the source snippet it prints under a failed\n// assertion as Latin-1, so any non-ASCII byte in THIS file comes out as mojibake\n// exactly when you need to read it. The real assessment's tests are in English\n// anyway, so this is closer to the thing you are training for.\n// The Chinese wording of every requirement is in the starter file's header.\n\nimport { addReply, countComments, maxDepth } from \"./commentTree\";\nimport type { Comment } from \"./commentTree\";\n\nconst c = (id: number, replies: Comment[] = []): Comment => ({\n  id,\n  author: `u${id}`,\n  body: `body ${id}`,\n  replies,\n});\n\n// A four-level tree: 1 -> 2 -> 4 -> 5, plus side branches 3 and 6.\nconst tree = (): Comment[] => [c(1, [c(2, [c(4, [c(5)])]), c(3)]), c(6)];\n\nfunction deepFreeze<T>(o: T): T {\n  Object.freeze(o);\n  Object.values(o as object).forEach((v) => {\n    if (v && typeof v === \"object\" && !Object.isFrozen(v)) deepFreeze(v);\n  });\n  return o;\n}\n\ndescribe(\"countComments\", () => {\n  test(\"counts every level, not just the top one\", () => {\n    expect(countComments(tree())).toBe(6);\n  });\n\n  test(\"empty array is 0, a single childless node is 1\", () => {\n    expect(countComments([])).toBe(0);\n    expect(countComments([c(9)])).toBe(1);\n  });\n});\n\ndescribe(\"maxDepth\", () => {\n  test(\"returns the length of the deepest path\", () => {\n    expect(maxDepth(tree())).toBe(4);\n    expect(maxDepth([])).toBe(0);\n    expect(maxDepth([c(1)])).toBe(1);\n  });\n});\n\ndescribe(\"addReply\", () => {\n  test(\"attaches to a deeply nested parent and bumps the total by one\", () => {\n    const t = tree();\n    const next = addReply(t, 4, c(99));\n    expect(countComments(next)).toBe(7);\n    expect(next[0].replies[0].replies[0].replies.map((r) => r.id)).toEqual([5, 99]);\n  });\n\n  test(\"does not mutate the input (the old tree is deep-frozen)\", () => {\n    const original = deepFreeze(tree());\n    const next = addReply(original, 2, c(99));\n    expect(countComments(original)).toBe(6);\n    expect(countComments(next)).toBe(7);\n    expect(next).not.toBe(original);\n  });\n\n  test(\"works for a top-level parent too\", () => {\n    const next = addReply(tree(), 6, c(99));\n    expect(next[1].replies.map((r) => r.id)).toEqual([99]);\n    expect(countComments(next)).toBe(7);\n  });\n\n  test(\"an unknown parentId leaves the content unchanged\", () => {\n    const next = addReply(tree(), 12345, c(99));\n    expect(countComments(next)).toBe(6);\n  });\n\n  test(\"two replies to the same parent keep insertion order\", () => {\n    let t = tree();\n    t = addReply(t, 1, c(77));\n    t = addReply(t, 1, c(88));\n    expect(t[0].replies.map((r) => r.id)).toEqual([2, 3, 77, 88]);\n  });\n});\n",
  "dependencies": {
    "react": "19.0.0",
    "react-dom": "19.0.0"
  },
  "expect": "8 passed"
};

const SB_TABS: SandboxSpec = {
  "files": {
    "/Tabs.tsx": "import { useState } from \"react\";\n\nexport interface TabItem {\n  id: string;\n  label: string;\n  content: string;\n}\n\n/**\n * 实现一个 Tabs：点标签切换面板。\n *\n * 验收标准（测试逐条查，跟页面上那五条一一对应）：\n *\n * 1. 点标签切换面板，默认激活第一个。\n * 2. 支持 initialId 指定初始激活项（给了就用它，没给用第一个）。\n * 3. **只用一个 state** 存 activeId —— 当前面板内容和哪个标签高亮全部从它派生，\n *    不许再存第二份（比如再开一个 activeIndex，或者把 content 也塞进 state）。\n * 4. ARIA 三件套不能漏：\n *      外层 role=\"tablist\"\n *      每个标签 role=\"tab\" + aria-selected=\"true|false\"\n *      面板     role=\"tabpanel\"\n *    面板同一时刻只渲染一个（测试会数 role=\"tabpanel\" 的个数）。\n * 5. 用 aria-controls 和 aria-labelledby 把 tab 和 panel 关联起来 ——\n *    tab 的 id 指向面板的 aria-labelledby，面板的 id 指向 tab 的 aria-controls。\n */\nexport function Tabs({\n  items,\n  initialId,\n}: {\n  items: TabItem[];\n  initialId?: string;\n}) {\n  // TODO: 一个 state，存激活的 id\n\n  return (\n    <div>\n      {/* TODO: role=\"tablist\" + 一排 role=\"tab\" 的按钮 */}\n      {/* TODO: role=\"tabpanel\"，显示当前那一项的 content */}\n    </div>\n  );\n}\n",
    "/App.tsx": "import { Tabs } from \"./Tabs\";\nimport type { TabItem } from \"./Tabs\";\n\n// 预览区只是让眼睛有东西看，判分看下面的测试。\nconst items: TabItem[] = [\n  { id: \"a\", label: \"Overview\", content: \"Overview panel.\" },\n  { id: \"b\", label: \"Details\", content: \"Details panel.\" },\n  { id: \"c\", label: \"Settings\", content: \"Settings panel.\" },\n];\n\nexport default function App() {\n  return (\n    <div style={{ fontFamily: \"system-ui\", padding: 16, fontSize: 13 }}>\n      <p style={{ margin: \"0 0 8px\", opacity: 0.7 }}>默认（激活第一个）</p>\n      <Tabs items={items} />\n      <p style={{ margin: \"20px 0 8px\", opacity: 0.7 }}>initialId = \"c\"</p>\n      <Tabs initialId=\"c\" items={items} />\n    </div>\n  );\n}\n"
  },
  "tests": "// Test names are in English on purpose.\n//\n// Sandpack's test runner decodes the source snippet it prints under a failed\n// assertion as Latin-1, so any non-ASCII byte in THIS file comes out as mojibake\n// exactly when you need to read it. The real assessment's tests are in English\n// anyway, so this is closer to the thing you are training for.\n// The Chinese wording of every requirement is in the starter file's header.\n\nimport { fireEvent, render, screen } from \"@testing-library/react\";\nimport { Tabs } from \"./Tabs\";\nimport type { TabItem } from \"./Tabs\";\n\nconst items: TabItem[] = [\n  { id: \"a\", label: \"Overview\", content: \"Overview panel.\" },\n  { id: \"b\", label: \"Details\", content: \"Details panel.\" },\n  { id: \"c\", label: \"Settings\", content: \"Settings panel.\" },\n];\n\ndescribe(\"Tabs\", () => {\n  // requirement 1 + 4\n  test(\"the first tab is selected by default and only that one\", () => {\n    render(<Tabs items={items} />);\n    const tabs = screen.getAllByRole(\"tab\");\n    expect(tabs.length).toBe(3);\n    expect(tabs.map((t) => t.getAttribute(\"aria-selected\"))).toEqual([\n      \"true\",\n      \"false\",\n      \"false\",\n    ]);\n  });\n\n  // requirement 4\n  test(\"renders one tablist and exactly one panel at a time\", () => {\n    render(<Tabs items={items} />);\n    expect(screen.getAllByRole(\"tablist\").length).toBe(1);\n    expect(screen.getAllByRole(\"tabpanel\").length).toBe(1);\n  });\n\n  // requirement 1\n  test(\"shows the first item's content on mount\", () => {\n    render(<Tabs items={items} />);\n    expect(screen.getByRole(\"tabpanel\").textContent).toBe(\"Overview panel.\");\n  });\n\n  // requirement 2\n  test(\"initialId decides which tab starts active\", () => {\n    render(<Tabs initialId=\"c\" items={items} />);\n    expect(screen.getByRole(\"tabpanel\").textContent).toBe(\"Settings panel.\");\n    expect(\n      screen.getAllByRole(\"tab\").map((t) => t.getAttribute(\"aria-selected\")),\n    ).toEqual([\"false\", \"false\", \"true\"]);\n  });\n\n  // requirement 2 - an id that is not in the list must not blank the component out\n  test(\"an unknown initialId falls back to the first item\", () => {\n    render(<Tabs initialId=\"nope\" items={items} />);\n    expect(screen.getByRole(\"tabpanel\").textContent).toBe(\"Overview panel.\");\n  });\n\n  // requirement 1 + 3: content and highlight both derive from the same single state\n  test(\"clicking the second tab swaps both the content and aria-selected\", () => {\n    render(<Tabs items={items} />);\n    fireEvent.click(screen.getByText(\"Details\"));\n    expect(screen.getByRole(\"tabpanel\").textContent).toBe(\"Details panel.\");\n    const tabs = screen.getAllByRole(\"tab\");\n    expect(tabs.map((t) => t.getAttribute(\"aria-selected\"))).toEqual([\n      \"false\",\n      \"true\",\n      \"false\",\n    ]);\n    // Still exactly one panel after the swap.\n    expect(screen.getAllByRole(\"tabpanel\").length).toBe(1);\n  });\n\n  // requirement 1\n  test(\"clicking the already selected tab changes nothing\", () => {\n    render(<Tabs items={items} />);\n    fireEvent.click(screen.getByText(\"Overview\"));\n    expect(screen.getByRole(\"tabpanel\").textContent).toBe(\"Overview panel.\");\n    expect(screen.getAllByRole(\"tab\")[0].getAttribute(\"aria-selected\")).toBe(\"true\");\n  });\n\n  // requirement 5\n  test(\"aria-controls and aria-labelledby point at each other\", () => {\n    render(<Tabs items={items} />);\n    const panel = screen.getByRole(\"tabpanel\");\n    const activeTab = screen\n      .getAllByRole(\"tab\")\n      .find((t) => t.getAttribute(\"aria-selected\") === \"true\");\n\n    expect(activeTab).toBeTruthy();\n    expect(activeTab.id).toBeTruthy();\n    expect(panel.id).toBeTruthy();\n    // tab -> panel\n    expect(activeTab.getAttribute(\"aria-controls\")).toBe(panel.id);\n    // panel -> tab\n    expect(panel.getAttribute(\"aria-labelledby\")).toBe(activeTab.id);\n  });\n\n  // requirement 5 - the link has to follow the selection, not stay on tab one\n  test(\"the aria link follows the selection after a click\", () => {\n    render(<Tabs items={items} />);\n    fireEvent.click(screen.getByText(\"Settings\"));\n    const panel = screen.getByRole(\"tabpanel\");\n    const activeTab = screen\n      .getAllByRole(\"tab\")\n      .find((t) => t.getAttribute(\"aria-selected\") === \"true\");\n    expect(activeTab.textContent).toBe(\"Settings\");\n    expect(activeTab.getAttribute(\"aria-controls\")).toBe(panel.id);\n    expect(panel.getAttribute(\"aria-labelledby\")).toBe(activeTab.id);\n  });\n});\n",
  "dependencies": {
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "@testing-library/react": "16.1.0",
    "@testing-library/dom": "10.4.0"
  },
  "expect": "9 passed"
};

const SB_HAND_DEBOUNCE: SandboxSpec = {
    "files": {
      "/debounce.ts": "/**\n * debounce(fn, delay)：把一串连续调用压成最后一次。\n *\n * 验收标准（测试逐条查）：\n * 1. 调用 debounced() 不许立刻执行 fn —— 它是「等你停手」，不是「立刻做」。\n * 2. 一串连续调用只在停手 delay 毫秒后执行一次，参数用最后那次的。\n * 3. 两串隔开的调用各自触发一次。\n * 4. cancel() 取消还没发生的那次调用。\n *\n * 现在这个版本是「每次都立刻调用」的半成品 —— 你要让它等。\n */\nexport function debounce<T extends (...args: never[]) => void>(\n  fn: T,\n  delay: number,\n): ((...args: Parameters<T>) => void) & { cancel: () => void } {\n  void delay;\n  // TODO 1: 存一个 timer；每次调用先清掉旧的，再设新的 —— 这就是「重新计时」。\n  const debounced = (...args: Parameters<T>) => {\n    fn(...args);\n  };\n  // TODO 2: cancel 清掉挂着的 timer。\n  debounced.cancel = () => {};\n  return debounced;\n}\n",
      "/App.tsx": "// 手写题没有可看的界面 —— 判分看下面的测试面板。\nexport default function App() {\n  return (\n    <div style={{ fontFamily: \"system-ui\", padding: 16, fontSize: 13, lineHeight: 1.6 }}>\n      <p>这道是手写工具函数题：改左边的文件，然后到下面的测试面板点「跑测试」。</p>\n      <p>Pure-function problem: edit the file on the left, then run the tests below.</p>\n    </div>\n  );\n}\n"
    },
    "tests": "// Test names are in English on purpose (Sandpack decodes failure snippets as\n// Latin-1). No fake timers in Sandpack, and every setTimeout runs a few hundred\n// ms late there - so these tests only assert \"has fired by now\" after generous\n// waits, never \"has not fired yet at time X\" after a wait.\n\nimport { debounce } from \"./debounce\";\n\nconst wait = (ms: number) => new Promise((r) => setTimeout(r, ms));\n\ndescribe(\"debounce\", () => {\n  test(\"does not call the function synchronously\", () => {\n    const calls: number[][] = [];\n    const d = debounce((...a: number[]) => calls.push(a), 100);\n    d(1);\n    d(2);\n    expect(calls.length).toBe(0);\n  });\n\n  test(\"a burst collapses into one trailing call with the last arguments\", async () => {\n    const calls: number[][] = [];\n    const d = debounce((...a: number[]) => calls.push(a), 100);\n    d(1);\n    d(2);\n    d(3);\n    await wait(400);\n    expect(calls).toEqual([[3]]);\n  });\n\n  test(\"two separated bursts produce two calls\", async () => {\n    const calls: number[] = [];\n    const d = debounce((n: number) => calls.push(n), 100);\n    d(1);\n    await wait(400);\n    d(2);\n    await wait(400);\n    expect(calls).toEqual([1, 2]);\n  });\n\n  test(\"cancel prevents the pending call\", async () => {\n    const calls: number[] = [];\n    const d = debounce((n: number) => calls.push(n), 100);\n    d(1);\n    d.cancel();\n    await wait(400);\n    expect(calls).toEqual([]);\n  });\n});\n",
    "dependencies": {
      "react": "19.0.0",
      "react-dom": "19.0.0"
    },
    "expect": "4 passed",
    "blankKeep": [
      "/App.tsx"
    ],
    "activeFile": "/debounce.ts"
  };

const SB_HAND_THROTTLE: SandboxSpec = {
    "files": {
      "/throttle.ts": "/**\n * throttle(fn, interval)：不管调用多密，每 interval 毫秒最多执行一次。\n *\n * 验收标准（leading + trailing 版）：\n * 1. 第一次调用立刻执行（leading）。\n * 2. 窗口内的后续调用不执行。\n * 3. 窗口结束时，把窗口内**最后一次**调用的参数补执行（trailing）。\n * 4. 窗口过了之后再调用，又立刻执行。\n *\n * 现在这个版本是「每次都直接透传」的半成品。\n */\nexport function throttle<T extends (...args: never[]) => void>(\n  fn: T,\n  interval: number,\n): (...args: Parameters<T>) => void {\n  void interval;\n  // TODO: 记 lastTime 和一个 trailing timer。\n  //       没到点 -> 存下参数，挂一个「窗口结束时补一枪」的 timer。\n  return (...args: Parameters<T>) => {\n    fn(...args);\n  };\n}\n",
      "/App.tsx": "// 手写题没有可看的界面 —— 判分看下面的测试面板。\nexport default function App() {\n  return (\n    <div style={{ fontFamily: \"system-ui\", padding: 16, fontSize: 13, lineHeight: 1.6 }}>\n      <p>这道是手写工具函数题：改左边的文件，然后到下面的测试面板点「跑测试」。</p>\n      <p>Pure-function problem: edit the file on the left, then run the tests below.</p>\n    </div>\n  );\n}\n"
    },
    "tests": "// Test names are in English on purpose (Sandpack decodes failure snippets as\n// Latin-1). Leading-edge behavior is synchronous, so it can be asserted without\n// waiting; trailing-edge assertions only run after generous waits.\n\nimport { throttle } from \"./throttle\";\n\nconst wait = (ms: number) => new Promise((r) => setTimeout(r, ms));\n\ndescribe(\"throttle (leading + trailing)\", () => {\n  test(\"the first call fires immediately\", () => {\n    const calls: number[] = [];\n    const t = throttle((n: number) => calls.push(n), 200);\n    t(1);\n    expect(calls).toEqual([1]);\n  });\n\n  test(\"calls inside the window do not fire synchronously\", () => {\n    const calls: number[] = [];\n    const t = throttle((n: number) => calls.push(n), 200);\n    t(1);\n    t(2);\n    t(3);\n    expect(calls).toEqual([1]);\n  });\n\n  test(\"the last suppressed call fires on the trailing edge with its arguments\", async () => {\n    const calls: number[] = [];\n    const t = throttle((n: number) => calls.push(n), 200);\n    t(1);\n    t(2);\n    t(3);\n    await wait(600);\n    expect(calls).toEqual([1, 3]);\n  });\n\n  test(\"after the window has passed, the next call fires immediately again\", async () => {\n    const calls: number[] = [];\n    const t = throttle((n: number) => calls.push(n), 200);\n    t(1);\n    await wait(600);\n    t(2);\n    expect(calls).toEqual([1, 2]);\n  });\n});\n",
    "dependencies": {
      "react": "19.0.0",
      "react-dom": "19.0.0"
    },
    "expect": "4 passed",
    "blankKeep": [
      "/App.tsx"
    ],
    "activeFile": "/throttle.ts"
  };

const SB_HAND_DEEPCLONE: SandboxSpec = {
    "files": {
      "/deepClone.ts": "/**\n * deepClone(value)：递归克隆，克隆里改什么都不影响原对象。\n *\n * 验收标准：\n * 1. 原始值和 null 原样返回。\n * 2. 嵌套对象 / 数组逐层克隆 —— 每一层都是新引用。\n * 3. 改克隆不影响源。\n * 4. Date 克隆成新 Date（同一时间戳）。\n * 5. Map / Set 深克隆。\n * 6. 循环引用不能爆栈 —— 用 WeakMap 记「见过的对象 -> 它的克隆」。\n *\n * 现在这个版本直接返回原值 —— 什么都没克隆。\n */\nexport function deepClone<T>(value: T, seen = new WeakMap<object, unknown>()): T {\n  void seen;\n  // TODO: 先处理原始值，再按 Date / Map / Set / Array / 普通对象分支。\n  //       每造一个新容器，立刻 seen.set(原对象, 新容器) —— 这一步防循环。\n  return value;\n}\n",
      "/App.tsx": "// 手写题没有可看的界面 —— 判分看下面的测试面板。\nexport default function App() {\n  return (\n    <div style={{ fontFamily: \"system-ui\", padding: 16, fontSize: 13, lineHeight: 1.6 }}>\n      <p>这道是手写工具函数题：改左边的文件，然后到下面的测试面板点「跑测试」。</p>\n      <p>Pure-function problem: edit the file on the left, then run the tests below.</p>\n    </div>\n  );\n}\n"
    },
    "tests": "// Test names are in English on purpose (Sandpack decodes failure snippets as Latin-1).\n\nimport { deepClone } from \"./deepClone\";\n\ndescribe(\"deepClone\", () => {\n  test(\"primitives and null pass through\", () => {\n    expect(deepClone(42)).toBe(42);\n    expect(deepClone(\"a\")).toBe(\"a\");\n    expect(deepClone(null)).toBe(null);\n    expect(deepClone(undefined)).toBe(undefined);\n  });\n\n  test(\"nested objects are cloned, not shared\", () => {\n    const src = { a: { b: { c: 1 } }, d: [1, 2] };\n    const out = deepClone(src);\n    expect(out).toEqual(src);\n    expect(out).not.toBe(src);\n    expect(out.a).not.toBe(src.a);\n    expect(out.a.b).not.toBe(src.a.b);\n    expect(out.d).not.toBe(src.d);\n  });\n\n  test(\"mutating the clone leaves the source alone\", () => {\n    const src = { list: [{ done: false }] };\n    const out = deepClone(src);\n    out.list[0].done = true;\n    expect(src.list[0].done).toBe(false);\n  });\n\n  test(\"Date is cloned as a Date with the same time\", () => {\n    const src = new Date(1700000000000);\n    const out = deepClone(src);\n    expect(out instanceof Date).toBe(true);\n    expect(out.getTime()).toBe(1700000000000);\n    expect(out).not.toBe(src);\n  });\n\n  test(\"Map and Set are cloned deeply\", () => {\n    const src = { m: new Map([[\"k\", { n: 1 }]]), s: new Set([{ n: 2 }]) };\n    const out = deepClone(src);\n    expect(out.m instanceof Map).toBe(true);\n    expect(out.m.get(\"k\")).toEqual({ n: 1 });\n    expect(out.m.get(\"k\")).not.toBe(src.m.get(\"k\"));\n    expect(out.s instanceof Set).toBe(true);\n    expect([...out.s][0]).toEqual({ n: 2 });\n    expect([...out.s][0]).not.toBe([...src.s][0]);\n  });\n\n  test(\"circular references do not blow the stack\", () => {\n    type Node = { name: string; self?: Node };\n    const src: Node = { name: \"root\" };\n    src.self = src;\n    const out = deepClone(src);\n    expect(out.name).toBe(\"root\");\n    expect(out.self).toBe(out);\n    expect(out.self).not.toBe(src);\n  });\n});\n",
    "dependencies": {
      "react": "19.0.0",
      "react-dom": "19.0.0"
    },
    "expect": "6 passed",
    "blankKeep": [
      "/App.tsx"
    ],
    "activeFile": "/deepClone.ts"
  };

const SB_HAND_FLATTEN: SandboxSpec = {
    "files": {
      "/flatten.ts": "/**\n * flatten(arr, depth = 1)：把嵌套数组压平 depth 层。\n *\n * 验收标准：\n * 1. 默认压一层（和 Array.prototype.flat 一致）。\n * 2. depth 控制层数；Infinity 全压平。\n * 3. depth 0 返回浅拷贝。\n * 4. 不改输入数组。\n * 5. 空数组压平后消失。\n *\n * 现在这个版本只做了浅拷贝。\n */\nexport function flatten(arr: unknown[], depth = 1): unknown[] {\n  void depth;\n  // TODO: 遍历。是数组且 depth > 0 -> 递归展开（depth - 1）；否则原样收进结果。\n  return [...arr];\n}\n",
      "/App.tsx": "// 手写题没有可看的界面 —— 判分看下面的测试面板。\nexport default function App() {\n  return (\n    <div style={{ fontFamily: \"system-ui\", padding: 16, fontSize: 13, lineHeight: 1.6 }}>\n      <p>这道是手写工具函数题：改左边的文件，然后到下面的测试面板点「跑测试」。</p>\n      <p>Pure-function problem: edit the file on the left, then run the tests below.</p>\n    </div>\n  );\n}\n"
    },
    "tests": "// Test names are in English on purpose (Sandpack decodes failure snippets as Latin-1).\n\nimport { flatten } from \"./flatten\";\n\ndescribe(\"flatten\", () => {\n  test(\"default depth is 1\", () => {\n    expect(flatten([1, [2, [3, [4]]]])).toEqual([1, 2, [3, [4]]]);\n  });\n\n  test(\"depth 2 goes two levels down\", () => {\n    expect(flatten([1, [2, [3, [4]]]], 2)).toEqual([1, 2, 3, [4]]);\n  });\n\n  test(\"Infinity flattens everything\", () => {\n    expect(flatten([1, [2, [3, [4, [5]]]]], Infinity)).toEqual([1, 2, 3, 4, 5]);\n  });\n\n  test(\"depth 0 returns a shallow copy\", () => {\n    const src = [1, [2]];\n    const out = flatten(src, 0);\n    expect(out).toEqual([1, [2]]);\n    expect(out).not.toBe(src);\n  });\n\n  test(\"does not mutate the input\", () => {\n    const src = [1, [2, [3]]];\n    flatten(src, Infinity);\n    expect(src).toEqual([1, [2, [3]]]);\n  });\n\n  test(\"empty arrays disappear when flattened\", () => {\n    expect(flatten([1, [], [2, []]], Infinity)).toEqual([1, 2]);\n  });\n});\n",
    "dependencies": {
      "react": "19.0.0",
      "react-dom": "19.0.0"
    },
    "expect": "6 passed",
    "blankKeep": [
      "/App.tsx"
    ],
    "activeFile": "/flatten.ts"
  };

const SB_HAND_CURRY: SandboxSpec = {
    "files": {
      "/curry.ts": "/**\n * curry(fn)：把 fn(a, b, c) 变成可以 c(1)(2)(3)、c(1, 2)(3)、c(1)(2, 3) 任意分组的版本。\n *\n * 验收标准：\n * 1. 一次给一个参数，攒够 fn.length 个就执行。\n * 2. 参数可以任意分组。\n * 3. 部分应用可以复用 —— const add1 = c(1)，add1(2,3) 和 add1(10,20) 互不污染。\n *    （所以攒参数必须造新数组，不能 push 到共享数组上。）\n *\n * 现在这个版本直接把 fn 返回去了。\n */\nexport function curry<T extends (...args: never[]) => unknown>(fn: T) {\n  // TODO: 递归。args 够长就 fn(...args)，不够就返回\n  //       (...more) => curried(...args, ...more)。\n  return fn as (...args: unknown[]) => unknown;\n}\n",
      "/App.tsx": "// 手写题没有可看的界面 —— 判分看下面的测试面板。\nexport default function App() {\n  return (\n    <div style={{ fontFamily: \"system-ui\", padding: 16, fontSize: 13, lineHeight: 1.6 }}>\n      <p>这道是手写工具函数题：改左边的文件，然后到下面的测试面板点「跑测试」。</p>\n      <p>Pure-function problem: edit the file on the left, then run the tests below.</p>\n    </div>\n  );\n}\n"
    },
    "tests": "// Test names are in English on purpose (Sandpack decodes failure snippets as Latin-1).\n\nimport { curry } from \"./curry\";\n\nconst add3 = (a: number, b: number, c: number) => a + b + c;\n\ndescribe(\"curry\", () => {\n  test(\"one argument at a time\", () => {\n    const c = curry(add3) as (a: number) => (b: number) => (c: number) => number;\n    expect(c(1)(2)(3)).toBe(6);\n  });\n\n  test(\"arguments can be grouped freely\", () => {\n    const c = curry(add3) as (...a: number[]) => unknown;\n    expect((c(1, 2) as (x: number) => number)(3)).toBe(6);\n    expect((c(1) as (...a: number[]) => number)(2, 3)).toBe(6);\n    expect(c(1, 2, 3)).toBe(6);\n  });\n\n  test(\"a partial application can be reused without polluting itself\", () => {\n    const c = curry(add3) as (...a: number[]) => (...b: number[]) => number;\n    const add1 = c(1);\n    expect(add1(2, 3)).toBe(6);\n    expect(add1(10, 20)).toBe(31);\n  });\n});\n",
    "dependencies": {
      "react": "19.0.0",
      "react-dom": "19.0.0"
    },
    "expect": "3 passed",
    "blankKeep": [
      "/App.tsx"
    ],
    "activeFile": "/curry.ts"
  };

const SB_HAND_PROMISEALL: SandboxSpec = {
    "files": {
      "/promiseAll.ts": "/**\n * 手写 Promise.all / Promise.allSettled。不许调用原生的这两个方法。\n *\n * promiseAll 验收标准：\n * 1. 结果按**输入顺序**排，不是完成顺序 —— 用下标写入，别用 push。\n * 2. 空数组立刻 resolve([])。\n * 3. 数组里混普通值也行（Promise.resolve 包一层）。\n * 4. 任何一个 reject，整体立刻 reject（不等慢的那些）。\n *\n * promiseAllSettled：永不 reject，每项报 { status, value | reason }，顺序同输入。\n *\n * 现在这两个版本都直接 resolve 空数组。\n */\nexport function promiseAll<T>(items: (T | Promise<T>)[]): Promise<T[]> {\n  void items;\n  // TODO: new Promise 里 forEach + 下标写入 + 计数器；.then 的第二个参数直接传 reject。\n  return Promise.resolve([]);\n}\n\nexport type Settled<T> =\n  | { status: \"fulfilled\"; value: T }\n  | { status: \"rejected\"; reason: unknown };\n\nexport function promiseAllSettled<T>(items: (T | Promise<T>)[]): Promise<Settled<T>[]> {\n  void items;\n  // TODO: 把每一项包成「永远成功、结果里带 status」的 Promise，再交给 promiseAll。\n  return Promise.resolve([]);\n}\n",
      "/App.tsx": "// 手写题没有可看的界面 —— 判分看下面的测试面板。\nexport default function App() {\n  return (\n    <div style={{ fontFamily: \"system-ui\", padding: 16, fontSize: 13, lineHeight: 1.6 }}>\n      <p>这道是手写工具函数题：改左边的文件，然后到下面的测试面板点「跑测试」。</p>\n      <p>Pure-function problem: edit the file on the left, then run the tests below.</p>\n    </div>\n  );\n}\n"
    },
    "tests": "// Test names are in English on purpose (Sandpack decodes failure snippets as Latin-1).\n\nimport { promiseAll, promiseAllSettled } from \"./promiseAll\";\n\nconst later = <T,>(ms: number, value: T) =>\n  new Promise<T>((r) => setTimeout(() => r(value), ms));\nconst fail = (ms: number, reason: string) =>\n  new Promise((_, rej) => setTimeout(() => rej(new Error(reason)), ms));\n\ndescribe(\"promiseAll\", () => {\n  test(\"resolves with results in input order, not completion order\", async () => {\n    const out = await promiseAll([later(60, \"slow\"), later(10, \"fast\"), \"plain\"]);\n    expect(out).toEqual([\"slow\", \"fast\", \"plain\"]);\n  });\n\n  test(\"an empty array resolves to an empty array\", async () => {\n    expect(await promiseAll([])).toEqual([]);\n  });\n\n  test(\"non-promise values are accepted\", async () => {\n    expect(await promiseAll([1, 2, 3])).toEqual([1, 2, 3]);\n  });\n\n  test(\"rejects with the first rejection reason\", async () => {\n    try {\n      await promiseAll([later(60, \"a\"), fail(10, \"boom\")]);\n      throw new Error(\"should have rejected\");\n    } catch (e) {\n      expect((e as Error).message).toBe(\"boom\");\n    }\n  });\n\n  test(\"one rejection does not wait for the slow ones\", async () => {\n    const t0 = Date.now();\n    try {\n      await promiseAll([later(1500, \"slow\"), fail(10, \"early\")]);\n      throw new Error(\"should have rejected\");\n    } catch (e) {\n      expect((e as Error).message).toBe(\"early\");\n    }\n    expect(Date.now() - t0).toBeLessThan(1400);\n  });\n});\n\ndescribe(\"promiseAllSettled\", () => {\n  test(\"never rejects; reports status per item in order\", async () => {\n    const out = await promiseAllSettled([later(30, 1), fail(10, \"nope\"), 3]);\n    expect(out[0]).toEqual({ status: \"fulfilled\", value: 1 });\n    expect(out[1].status).toBe(\"rejected\");\n    expect(((out[1] as { reason: Error }).reason).message).toBe(\"nope\");\n    expect(out[2]).toEqual({ status: \"fulfilled\", value: 3 });\n  });\n});\n",
    "dependencies": {
      "react": "19.0.0",
      "react-dom": "19.0.0"
    },
    "expect": "6 passed",
    "blankKeep": [
      "/App.tsx"
    ],
    "activeFile": "/promiseAll.ts"
  };

const SB_HAND_EMITTER: SandboxSpec = {
    "files": {
      "/emitter.ts": "/**\n * EventEmitter：on / off / once / emit。\n *\n * 验收标准：\n * 1. on 注册，emit 按注册顺序调用所有监听器并传参。\n * 2. off 只移除指定的那一个监听器。\n * 3. once 只触发一次。\n * 4. once 触发时自我移除，但**不能挤掉同一事件的其他监听器**\n *    —— emit 遍历前先拷贝一份列表。\n * 5. emit 返回「有没有人在听」（boolean）。\n *\n * 现在这个版本是空骨架。\n */\ntype Listener = (...args: unknown[]) => void;\n\nexport class EventEmitter {\n  private listeners = new Map<string, Listener[]>();\n\n  on(event: string, fn: Listener): this {\n    void event; void fn;\n    // TODO\n    return this;\n  }\n\n  off(event: string, fn: Listener): this {\n    void event; void fn;\n    // TODO: filter 掉那一个，别 splice 正在遍历的数组。\n    return this;\n  }\n\n  once(event: string, fn: Listener): this {\n    void event; void fn;\n    // TODO: 包一层 wrapper —— 先 off(自己)，再调 fn。\n    return this;\n  }\n\n  emit(event: string, ...args: unknown[]): boolean {\n    void event; void args;\n    // TODO: 没人听返回 false；有人听就 [...list] 拷贝后遍历，返回 true。\n    return false;\n  }\n}\n",
      "/App.tsx": "// 手写题没有可看的界面 —— 判分看下面的测试面板。\nexport default function App() {\n  return (\n    <div style={{ fontFamily: \"system-ui\", padding: 16, fontSize: 13, lineHeight: 1.6 }}>\n      <p>这道是手写工具函数题：改左边的文件，然后到下面的测试面板点「跑测试」。</p>\n      <p>Pure-function problem: edit the file on the left, then run the tests below.</p>\n    </div>\n  );\n}\n"
    },
    "tests": "// Test names are in English on purpose (Sandpack decodes failure snippets as Latin-1).\n\nimport { EventEmitter } from \"./emitter\";\n\ndescribe(\"EventEmitter\", () => {\n  test(\"on + emit delivers the payload\", () => {\n    const e = new EventEmitter();\n    const got: unknown[][] = [];\n    e.on(\"msg\", (...a) => got.push(a));\n    e.emit(\"msg\", 1, \"two\");\n    expect(got).toEqual([[1, \"two\"]]);\n  });\n\n  test(\"multiple listeners run in registration order\", () => {\n    const e = new EventEmitter();\n    const order: string[] = [];\n    e.on(\"x\", () => order.push(\"first\"));\n    e.on(\"x\", () => order.push(\"second\"));\n    e.emit(\"x\");\n    expect(order).toEqual([\"first\", \"second\"]);\n  });\n\n  test(\"off removes only the given listener\", () => {\n    const e = new EventEmitter();\n    const got: string[] = [];\n    const a = () => got.push(\"a\");\n    const b = () => got.push(\"b\");\n    e.on(\"x\", a).on(\"x\", b);\n    e.off(\"x\", a);\n    e.emit(\"x\");\n    expect(got).toEqual([\"b\"]);\n  });\n\n  test(\"once fires exactly once\", () => {\n    const e = new EventEmitter();\n    let n = 0;\n    e.once(\"x\", () => { n += 1; });\n    e.emit(\"x\");\n    e.emit(\"x\");\n    expect(n).toBe(1);\n  });\n\n  test(\"a once listener does not knock out its neighbors\", () => {\n    const e = new EventEmitter();\n    const got: string[] = [];\n    e.once(\"x\", () => got.push(\"once\"));\n    e.on(\"x\", () => got.push(\"always\"));\n    e.emit(\"x\");\n    expect(got).toEqual([\"once\", \"always\"]);\n  });\n\n  test(\"emit returns whether anyone was listening\", () => {\n    const e = new EventEmitter();\n    expect(e.emit(\"nobody\")).toBe(false);\n    e.on(\"somebody\", () => {});\n    expect(e.emit(\"somebody\")).toBe(true);\n  });\n});\n",
    "dependencies": {
      "react": "19.0.0",
      "react-dom": "19.0.0"
    },
    "expect": "6 passed",
    "blankKeep": [
      "/App.tsx"
    ],
    "activeFile": "/emitter.ts"
  };

const SB_HAND_LRU: SandboxSpec = {
    "files": {
      "/lru.ts": "/**\n * LRUCache(capacity)：容量满了就淘汰「最久没被用过」的那条。\n *\n * 验收标准：\n * 1. get / put 基本读写；get 不到返回 undefined。\n * 2. 超容量时淘汰最久未使用的。\n * 3. get 会刷新「最近用过」。\n * 4. put 已存在的 key：更新值，同样刷新。\n * 5. capacity 1 也要对。\n *\n * 提示：JS 的 Map 按插入序遍历 —— 「删掉再放回」= 挪到最新那头，\n * 「迭代器的第一个键」= 最旧的那条。不需要手写双向链表。\n *\n * 现在这个版本什么都没存。\n */\nexport class LRUCache<K, V> {\n  private map = new Map<K, V>();\n\n  constructor(private capacity: number) {\n    if (capacity < 1) throw new Error(\"capacity must be at least 1\");\n  }\n\n  get(key: K): V | undefined {\n    void key;\n    // TODO: 命中 -> 删掉再放回（刷新），返回值。\n    return undefined;\n  }\n\n  put(key: K, value: V): void {\n    void key; void value;\n    // TODO: 已存在先删；set 之后超容量就删 map.keys().next().value。\n  }\n\n  get size(): number {\n    return this.map.size;\n  }\n}\n",
      "/App.tsx": "// 手写题没有可看的界面 —— 判分看下面的测试面板。\nexport default function App() {\n  return (\n    <div style={{ fontFamily: \"system-ui\", padding: 16, fontSize: 13, lineHeight: 1.6 }}>\n      <p>这道是手写工具函数题：改左边的文件，然后到下面的测试面板点「跑测试」。</p>\n      <p>Pure-function problem: edit the file on the left, then run the tests below.</p>\n    </div>\n  );\n}\n"
    },
    "tests": "// Test names are in English on purpose (Sandpack decodes failure snippets as Latin-1).\n\nimport { LRUCache } from \"./lru\";\n\ndescribe(\"LRUCache\", () => {\n  test(\"get returns what put stored\", () => {\n    const c = new LRUCache<string, number>(2);\n    c.put(\"a\", 1);\n    expect(c.get(\"a\")).toBe(1);\n    expect(c.get(\"missing\")).toBe(undefined);\n  });\n\n  test(\"exceeding capacity evicts the least recently used\", () => {\n    const c = new LRUCache<string, number>(2);\n    c.put(\"a\", 1);\n    c.put(\"b\", 2);\n    c.put(\"c\", 3);\n    expect(c.get(\"a\")).toBe(undefined);\n    expect(c.get(\"b\")).toBe(2);\n    expect(c.get(\"c\")).toBe(3);\n  });\n\n  test(\"get refreshes recency\", () => {\n    const c = new LRUCache<string, number>(2);\n    c.put(\"a\", 1);\n    c.put(\"b\", 2);\n    c.get(\"a\");\n    c.put(\"c\", 3);\n    expect(c.get(\"b\")).toBe(undefined);\n    expect(c.get(\"a\")).toBe(1);\n  });\n\n  test(\"putting an existing key updates the value and refreshes recency\", () => {\n    const c = new LRUCache<string, number>(2);\n    c.put(\"a\", 1);\n    c.put(\"b\", 2);\n    c.put(\"a\", 10);\n    c.put(\"c\", 3);\n    expect(c.get(\"b\")).toBe(undefined);\n    expect(c.get(\"a\")).toBe(10);\n  });\n\n  test(\"capacity 1 keeps only the newest entry\", () => {\n    const c = new LRUCache<string, number>(1);\n    c.put(\"a\", 1);\n    c.put(\"b\", 2);\n    expect(c.get(\"a\")).toBe(undefined);\n    expect(c.get(\"b\")).toBe(2);\n    expect(c.size).toBe(1);\n  });\n});\n",
    "dependencies": {
      "react": "19.0.0",
      "react-dom": "19.0.0"
    },
    "expect": "5 passed",
    "blankKeep": [
      "/App.tsx"
    ],
    "activeFile": "/lru.ts"
  };

const SB_NOTES: SandboxSpec = {
    "files": {
      "/NoteManager.tsx": "import { useState } from \"react\";\nimport type { Note } from \"./types\";\nimport NoteForm from \"./NoteForm\";\nimport NoteTable from \"./NoteTable\";\n\n/**\n * Notes Manager —— React 考试 Q1 的原题。\n *\n * 要改的只有两个文件：这个和 NoteForm.tsx。\n * types.ts / NoteItem.tsx / NoteTable.tsx / App.tsx 都是给定的，不用动。\n *\n * 验收标准（测试逐条查）：\n *\n * 1. 两个框都得有真实内容才能提交 —— 只有空格不算，按钮 disabled。\n * 2. 新增追加到末尾，不是插到开头。\n * 3. 提交成功后两个框都清空。\n * 4. Delete 只删你点的那一条 —— 用 filter，不许 splice。\n * 5. 点 Edit 把那条载进表单，按钮文字变成 Update。\n * 6. **编辑是原地替换** —— 位置不变、总数不变。\n *    「先删再加」会把它挪到末尾，第 6 条测试就是专门抓这个的。\n * 7. 更新完表单清空，按钮变回 Add。\n * 8. 连着点两条的 Edit，表单要跟着换 —— 这一条查的是 effect 的依赖写对没有。\n *\n * 测试靠 data-testid 找元素，这些钩子不能改名：\n *   form-input / form-textarea / form-submit-button / notes-list\n * Edit 和 Delete 两个按钮靠可访问名（按钮文字）定位。\n */\nconst NoteManager: React.FC = () => {\n  const [notes, setNotes] = useState<Note[]>([]);\n  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);\n\n  // TODO 1: 一个函数管两件事 —— 正在编辑就替换那一条，否则追加到末尾。\n  //         替换完要把 noteToEdit 清掉，不然表单会一直停在编辑态。\n  const handleSubmitNote = (submittedNote: Note) => {\n    void submittedNote;\n    void setNotes;\n  };\n\n  // TODO 2: 按 id 删掉一条。不许 splice。\n  const handleDelete = (id: number) => {\n    void id;\n  };\n\n  // TODO 3: 把这条设成「正在编辑」。\n  const handleEdit = (note: Note) => {\n    void note;\n    void setNoteToEdit;\n  };\n\n  return (\n    <div\n      className=\"layout-column align-items-center justify-content-start\"\n      data-testid=\"note-manager\"\n    >\n      <NoteForm onSubmit={handleSubmitNote} noteToEdit={noteToEdit} />\n      <NoteTable notes={notes} onDelete={handleDelete} onEdit={handleEdit} />\n    </div>\n  );\n};\n\nexport default NoteManager;\n",
      "/NoteForm.tsx": "import React, { useState } from \"react\";\nimport type { Note } from \"./types\";\n\ninterface NoteFormProps {\n  onSubmit: (note: Note) => void;\n  noteToEdit: Note | null;\n}\n\n// markup 和 data-testid 都给好了，缺的是逻辑。四个 TODO。\nconst NoteForm: React.FC<NoteFormProps> = ({ onSubmit, noteToEdit }) => {\n  const [title, setTitle] = useState(\"\");\n  const [content, setContent] = useState(\"\");\n\n  // TODO 4: noteToEdit 一变，表单要跟着换成那一条的内容；变回 null 就清空。\n\n  // TODO 5: 两个框都得有真实内容才算有效（只有空格不算）。\n  const isFormInvalid = false;\n\n  // TODO 6: 拦掉默认提交；无效就直接返回；\n  //         组装 note（编辑时沿用原 id，新增时用 Date.now()），\n  //         title / content 都 trim；交出去之后清空两个框。\n  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {\n    event.preventDefault();\n    void onSubmit;\n  };\n\n  return (\n    <div className=\"card w-200 pt-30 pb-8 mt-15 mb-15\">\n      <form onSubmit={handleSubmit} data-testid=\"note-form\">\n        <section className=\"layout-row align-items-center justify-content-center mt-20 mr-20 ml-20\">\n          <label className=\"form-title-label\">Title:</label>\n          <input\n            type=\"text\"\n            placeholder=\"Title\"\n            value={title}\n            onChange={(e) => setTitle(e.target.value)}\n            data-testid=\"form-input\"\n            className=\"form-input\"\n          />\n        </section>\n\n        <section className=\"layout-row align-items-center justify-content-center mt-20 mr-20 ml-20\">\n          <label className=\"form-content-label\">Content:</label>\n          <textarea\n            placeholder=\"Content\"\n            value={content}\n            onChange={(e) => setContent(e.target.value)}\n            data-testid=\"form-textarea\"\n            className=\"form-textarea\"\n          />\n        </section>\n\n        <section className=\"layout-row align-items-center justify-content-center mt-20 mr-20 ml-20\">\n          <button type=\"submit\" disabled={isFormInvalid} data-testid=\"form-submit-button\">\n            {/* TODO 7: 编辑时这里是 Update，新增时是 Add。 */}\n            Add\n          </button>\n        </section>\n      </form>\n    </div>\n  );\n};\n\nexport default NoteForm;\n",
      "/NoteTable.tsx": "import type { Note } from \"./types\";\nimport NoteItem from \"./NoteItem\";\n\nexport interface NoteTableProps {\n  notes: Note[];\n  onDelete: (id: number) => void;\n  onEdit: (note: Note) => void;\n}\n\n// 给定，不用改。data-testid=\"notes-list\" 挂在 tbody 上 ——\n// 测试就是靠它数行、查文本的，别动。\nconst NoteTable: React.FC<NoteTableProps> = ({ notes, onDelete, onEdit }) => {\n  return (\n    <div className=\"card w-30 pt-30 pb-8 mt-2\">\n      <table>\n        <thead>\n          <tr>\n            <th>Title</th>\n            <th>Content</th>\n            <th>Edit</th>\n            <th>Delete</th>\n          </tr>\n        </thead>\n        <tbody data-testid=\"notes-list\">\n          {notes.map((note) => (\n            <NoteItem key={note.id} note={note} onDelete={onDelete} onEdit={onEdit} />\n          ))}\n        </tbody>\n      </table>\n    </div>\n  );\n};\n\nexport default NoteTable;\n",
      "/NoteItem.tsx": "import type { Note } from \"./types\";\n\nexport interface NoteItemProps {\n  note: Note;\n  onDelete: (id: number) => void;\n  onEdit: (note: Note) => void;\n}\n\n// 给定，不用改。注意它只负责显示和把事件往上报 ——\n// 数据在哪、怎么改，是 NoteManager 的事。\nconst NoteItem: React.FC<NoteItemProps> = ({ note, onDelete, onEdit }) => {\n  return (\n    <tr>\n      <td>{note.title}</td>\n      <td>{note.content}</td>\n      <td>\n        <button onClick={() => onEdit(note)} className=\"outlined\">\n          Edit\n        </button>\n      </td>\n      <td>\n        <button onClick={() => onDelete(note.id)} className=\"danger\">\n          Delete\n        </button>\n      </td>\n    </tr>\n  );\n};\n\nexport default NoteItem;\n",
      "/types.ts": "export type Note = {\n  id: number;\n  title: string;\n  content: string;\n};\n",
      "/App.tsx": "import NoteManager from \"./NoteManager\";\n\n// 预览区只是让眼睛有东西看，判分看下面的测试。\nexport default function App() {\n  return (\n    <div style={{ fontFamily: \"system-ui\", padding: 16, fontSize: 13 }}>\n      <NoteManager />\n    </div>\n  );\n}\n"
    },
    "tests": "// Test names are in English on purpose.\n//\n// Sandpack's test runner decodes the source snippet it prints under a failed\n// assertion as Latin-1, so any non-ASCII byte in THIS file comes out as mojibake\n// exactly when you need to read it. The real assessment's tests are in English\n// anyway, so this is closer to the thing you are training for.\n// The Chinese wording of every requirement is in the starter file's header.\n//\n// Also: this runner has no @testing-library/jest-dom, so there is no\n// toBeDisabled / toHaveTextContent here. Plain DOM assertions instead.\n\nimport { fireEvent, render, screen } from \"@testing-library/react\";\nimport NoteManager from \"./NoteManager\";\n\nconst titleBox = () => screen.getByTestId(\"form-input\");\nconst contentBox = () => screen.getByTestId(\"form-textarea\");\nconst submit = () => screen.getByTestId(\"form-submit-button\");\nconst list = () => screen.getByTestId(\"notes-list\");\n\nfunction type(el, value) {\n  fireEvent.change(el, { target: { value: value } });\n}\n\n// The reference answer builds ids with Date.now(). Two rows created inside the\n// same millisecond would therefore share an id, and an edit would rewrite both.\n// That is a real weakness of Date.now() as an id, not something these tests are\n// here to measure - so spin until the clock ticks and every row gets its own id.\n// Costs at most 1 ms per row, and keeps the run deterministic on fast machines.\nfunction tick() {\n  const t0 = Date.now();\n  while (Date.now() === t0) {\n    // spin\n  }\n}\n\nfunction add(title, content) {\n  tick();\n  type(titleBox(), title);\n  type(contentBox(), content);\n  fireEvent.click(submit());\n}\n\nfunction rowTitles() {\n  return Array.from(list().querySelectorAll(\"tr\")).map(function (tr) {\n    return tr.cells[0].textContent;\n  });\n}\n\nfunction byName(name) {\n  return screen.getAllByRole(\"button\", { name: name });\n}\n\ndescribe(\"Notes Manager\", () => {\n  // requirement 1\n  test(\"the submit button stays disabled until both fields hold real text\", () => {\n    render(<NoteManager />);\n    expect(submit().disabled).toBe(true);\n\n    type(titleBox(), \"only a title\");\n    expect(submit().disabled).toBe(true);\n\n    type(contentBox(), \"   \");\n    expect(submit().disabled).toBe(true);\n\n    type(contentBox(), \"real content\");\n    expect(submit().disabled).toBe(false);\n  });\n\n  // requirement 2\n  test(\"adding appends to the end of the list\", () => {\n    render(<NoteManager />);\n    add(\"first\", \"c1\");\n    add(\"second\", \"c2\");\n    add(\"third\", \"c3\");\n    expect(rowTitles()).toEqual([\"first\", \"second\", \"third\"]);\n  });\n\n  // requirement 3\n  test(\"both inputs are cleared after a successful add\", () => {\n    render(<NoteManager />);\n    add(\"some title\", \"some content\");\n    expect(titleBox().value).toBe(\"\");\n    expect(contentBox().value).toBe(\"\");\n  });\n\n  // requirement 4\n  test(\"delete removes only the row you clicked\", () => {\n    render(<NoteManager />);\n    add(\"keep me\", \"c1\");\n    add(\"drop me\", \"c2\");\n    add(\"keep me too\", \"c3\");\n\n    fireEvent.click(byName(\"Delete\")[1]);\n    expect(rowTitles()).toEqual([\"keep me\", \"keep me too\"]);\n  });\n\n  // requirement 5\n  test(\"Edit loads that note into the form and the button becomes Update\", () => {\n    render(<NoteManager />);\n    add(\"old title\", \"old content\");\n\n    fireEvent.click(byName(\"Edit\")[0]);\n    expect(titleBox().value).toBe(\"old title\");\n    expect(contentBox().value).toBe(\"old content\");\n    expect(submit().textContent.trim()).toBe(\"Update\");\n  });\n\n  // requirement 6 - the hard one: in place, same position, same count\n  test(\"an edit updates the row in place, keeping position and count\", () => {\n    render(<NoteManager />);\n    add(\"a\", \"c1\");\n    add(\"b\", \"c2\");\n    add(\"c\", \"c3\");\n\n    fireEvent.click(byName(\"Edit\")[1]);\n    type(titleBox(), \"b renamed\");\n    fireEvent.click(submit());\n\n    expect(rowTitles()).toEqual([\"a\", \"b renamed\", \"c\"]);\n  });\n\n  // requirement 7\n  test(\"after an update the form is cleared and the button says Add again\", () => {\n    render(<NoteManager />);\n    add(\"x\", \"c1\");\n\n    fireEvent.click(byName(\"Edit\")[0]);\n    type(titleBox(), \"x2\");\n    fireEvent.click(submit());\n\n    expect(titleBox().value).toBe(\"\");\n    expect(contentBox().value).toBe(\"\");\n    expect(submit().textContent.trim()).toBe(\"Add\");\n  });\n\n  // requirement 8 - guards the effect dependency: switching target must reload\n  test(\"switching the edit target reloads the form\", () => {\n    render(<NoteManager />);\n    add(\"alpha\", \"one\");\n    add(\"beta\", \"two\");\n\n    fireEvent.click(byName(\"Edit\")[0]);\n    expect(titleBox().value).toBe(\"alpha\");\n\n    fireEvent.click(byName(\"Edit\")[1]);\n    expect(titleBox().value).toBe(\"beta\");\n    expect(contentBox().value).toBe(\"two\");\n  });\n});\n",
    "dependencies": {
      "react": "19.0.0",
      "react-dom": "19.0.0",
      "@testing-library/react": "16.1.0",
      "@testing-library/dom": "10.4.0"
    },
    "expect": "8 passed",
    "blankKeep": [
      "/types.ts",
      "/NoteItem.tsx",
      "/NoteTable.tsx",
      "/App.tsx"
    ],
    "activeFile": "/NoteManager.tsx"
  };
const SB_TODO: SandboxSpec = {
  "files": {
    "/TodoList.tsx": "import { useState } from \"react\";\nimport type { Filter, Todo } from \"./types\";\n\n/**\n * Todo List。\n *\n * 验收标准（测试逐条查，跟页面上那几条一一对应）：\n *\n * 1. 输入框为空（或只有空格）时，Add 按钮 disabled。\n * 2. 提交后清空输入框，新条目追加到末尾。\n * 3. 勾选切换单条的 done —— 用 map + 对象展开，不许改原对象。\n * 4. Delete 删掉单条 —— 用 filter，不许 splice。\n * 5. **这三个都是派生数据，不许再开 state**：\n *      visible    当前筛选下要显示的条目\n *      remaining  还没做完的条数\n *      allDone    是否全部做完\n * 6. 筛选 all / active / done 只影响显示，**不改底层数据** ——\n *    切回 all 时所有条目都还在。\n * 7. Check all / Uncheck all 按「当前是否已全部完成」整体反转。\n * 8. Clear completed 只删已完成的。\n *\n * 测试靠 data-testid 找元素，所以这些钩子不能改名：\n *   todo-input / todo-submit / todo-list / remaining\n *   toggle-all / clear-done / filter-all / filter-active / filter-done\n * 每条 li 上要有 data-done，勾选框的 aria-label 是 `toggle <文本>`，\n * 删除按钮的 aria-label 是 `delete <文本>`。\n */\nexport function TodoList() {\n  const [todos, setTodos] = useState<Todo[]>([]);\n  const [text, setText] = useState(\"\");\n  const [filter, setFilter] = useState<Filter>(\"all\");\n\n  // TODO: 派生数据 —— visible / remaining / allDone\n\n  // TODO: handleSubmit / toggle / remove / toggleAll / clearDone\n\n  void todos;\n  void setTodos;\n  void filter;\n  void setFilter;\n\n  return (\n    <div data-testid=\"todo-app\">\n      {/* TODO: form + input(todo-input) + submit(todo-submit) */}\n      {/* TODO: toggle-all / clear-done / remaining */}\n      {/* TODO: filter-all / filter-active / filter-done */}\n      {/* TODO: ul(todo-list) 里每条 li */}\n      <input onChange={(e) => setText(e.target.value)} value={text} />\n    </div>\n  );\n}\n",
    "/types.ts": "export type Filter = \"all\" | \"active\" | \"done\";\n\nexport type Todo = {\n  id: number;\n  text: string;\n  done: boolean;\n};\n",
    "/App.tsx": "import { TodoList } from \"./TodoList\";\n\n// 预览区只是让眼睛有东西看，判分看下面的测试。\nexport default function App() {\n  return (\n    <div style={{ fontFamily: \"system-ui\", padding: 16, fontSize: 13 }}>\n      <TodoList />\n    </div>\n  );\n}\n"
  },
  "tests": "// Test names are in English on purpose.\n//\n// Sandpack's test runner decodes the source snippet it prints under a failed\n// assertion as Latin-1, so any non-ASCII byte in THIS file comes out as mojibake\n// exactly when you need to read it. The real assessment's tests are in English\n// anyway, so this is closer to the thing you are training for.\n// The Chinese wording of every requirement is in the starter file's header.\n\nimport { fireEvent, render, screen } from \"@testing-library/react\";\nimport { TodoList } from \"./TodoList\";\n\nfunction add(text) {\n  fireEvent.change(screen.getByTestId(\"todo-input\"), { target: { value: text } });\n  fireEvent.click(screen.getByTestId(\"todo-submit\"));\n}\n\nconst rows = () => screen.getByTestId(\"todo-list\").querySelectorAll(\"li\");\nconst texts = () => [...rows()].map((li) => li.querySelector(\"span\").textContent);\n\ndescribe(\"TodoList\", () => {\n  // requirement 1\n  test(\"Add is disabled while the input is empty or blank\", () => {\n    render(<TodoList />);\n    expect(screen.getByTestId(\"todo-submit\").disabled).toBe(true);\n    fireEvent.change(screen.getByTestId(\"todo-input\"), { target: { value: \"   \" } });\n    expect(screen.getByTestId(\"todo-submit\").disabled).toBe(true);\n    fireEvent.change(screen.getByTestId(\"todo-input\"), { target: { value: \"milk\" } });\n    expect(screen.getByTestId(\"todo-submit\").disabled).toBe(false);\n  });\n\n  // requirement 2\n  test(\"submitting appends to the end and clears the input\", () => {\n    render(<TodoList />);\n    add(\"first\");\n    add(\"second\");\n    expect(texts()).toEqual([\"first\", \"second\"]);\n    expect(screen.getByTestId(\"todo-input\").value).toBe(\"\");\n  });\n\n  // requirement 3 + 5\n  test(\"checking a box toggles that one row and updates the remaining count\", () => {\n    render(<TodoList />);\n    add(\"a\");\n    add(\"b\");\n    expect(screen.getByTestId(\"remaining\").textContent).toContain(\"2\");\n    fireEvent.click(screen.getByLabelText(\"toggle a\"));\n    expect(screen.getByTestId(\"remaining\").textContent).toContain(\"1\");\n    expect(rows()[0].getAttribute(\"data-done\")).toBe(\"true\");\n    expect(rows()[1].getAttribute(\"data-done\")).toBe(\"false\");\n  });\n\n  // requirement 4\n  test(\"Delete removes only that row\", () => {\n    render(<TodoList />);\n    add(\"a\");\n    add(\"b\");\n    add(\"c\");\n    fireEvent.click(screen.getByLabelText(\"delete b\"));\n    expect(texts()).toEqual([\"a\", \"c\"]);\n  });\n\n  // requirement 6 - the important one: filtering must not destroy data\n  test(\"filters only change what is shown, never the underlying data\", () => {\n    render(<TodoList />);\n    add(\"a\");\n    add(\"b\");\n    fireEvent.click(screen.getByLabelText(\"toggle a\"));\n\n    fireEvent.click(screen.getByTestId(\"filter-done\"));\n    expect(texts()).toEqual([\"a\"]);\n\n    fireEvent.click(screen.getByTestId(\"filter-active\"));\n    expect(texts()).toEqual([\"b\"]);\n\n    fireEvent.click(screen.getByTestId(\"filter-all\"));\n    expect(texts()).toEqual([\"a\", \"b\"]);\n  });\n\n  // requirement 7\n  test(\"Check all / Uncheck all flips based on whether everything is done\", () => {\n    render(<TodoList />);\n    add(\"a\");\n    add(\"b\");\n    fireEvent.click(screen.getByTestId(\"toggle-all\"));\n    expect([...rows()].map((li) => li.getAttribute(\"data-done\"))).toEqual([\n      \"true\",\n      \"true\",\n    ]);\n    expect(screen.getByTestId(\"remaining\").textContent).toContain(\"0\");\n\n    fireEvent.click(screen.getByTestId(\"toggle-all\"));\n    expect([...rows()].map((li) => li.getAttribute(\"data-done\"))).toEqual([\n      \"false\",\n      \"false\",\n    ]);\n  });\n\n  // requirement 8\n  test(\"Clear completed drops only the finished rows\", () => {\n    render(<TodoList />);\n    add(\"a\");\n    add(\"b\");\n    add(\"c\");\n    fireEvent.click(screen.getByLabelText(\"toggle b\"));\n    fireEvent.click(screen.getByTestId(\"clear-done\"));\n    expect(texts()).toEqual([\"a\", \"c\"]);\n  });\n\n  // requirement 5 - allDone is derived, so the button label has to follow the data\n  test(\"the toggle-all label is derived, not stored\", () => {\n    render(<TodoList />);\n    add(\"a\");\n    expect(screen.getByTestId(\"toggle-all\").textContent).toBe(\"Check all\");\n    fireEvent.click(screen.getByLabelText(\"toggle a\"));\n    expect(screen.getByTestId(\"toggle-all\").textContent).toBe(\"Uncheck all\");\n    fireEvent.click(screen.getByLabelText(\"toggle a\"));\n    expect(screen.getByTestId(\"toggle-all\").textContent).toBe(\"Check all\");\n  });\n});\n",
  "dependencies": {
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "@testing-library/react": "16.1.0",
    "@testing-library/dom": "10.4.0"
  },
  "expect": "8 passed",
  "blankKeep": [
    "/types.ts"
  ]
};

const SB_THEME: SandboxSpec = {
  "files": {
    "/ThemeContext.tsx": "import { createContext, useContext, useState } from \"react\";\nimport type { ReactNode } from \"react\";\n\nexport type Theme = \"light\" | \"dark\";\n\nexport interface ThemeContextValue {\n  theme: Theme;\n  toggleTheme: () => void;\n}\n\n/**\n * Dark / Light 主题 Context。\n *\n * 验收标准（测试逐条查，跟页面上那几条一一对应）：\n *\n * 1. 默认 light。ThemedCard 显示 light，按钮文字是 \"Switch to Dark\"；\n *    切到 dark 之后按钮变 \"Switch to Light\"。\n * 2. 卡片底色跟着主题走：light → #fff，dark → #222。\n * 3. 同一个 Provider 下的**多个**消费者一起变 —— 这才是 Context 的意义。\n * 4. 没套 Provider 就调 useTheme()，**必须立刻抛错**，错误信息里要出现\n *    ThemeProvider 这个词。默认值不许给一个假的 light 主题静默兜住。\n * 5. toggleTheme 是**稳定引用**：theme 变了，函数本身不能变（useCallback）。\n * 6. theme 没变时 context value **不许换新对象**（useMemo）——\n *    不然 Provider 每次渲染都让所有消费者白重渲一遍。\n * 7. 一次事件里连调两次 toggleTheme 要原样回到原点 ——\n *    也就是必须用函数式更新 setTheme(prev => ...)，不能读闭包里的 theme。\n *\n * 测试靠 data-testid 找元素：theme-toggle / themed-card / theme-name。\n */\n\n// TODO: createContext —— 默认值给什么？想清楚第 4 条要求。\nconst ThemeContext = createContext<ThemeContextValue | undefined>(undefined);\n\nexport function ThemeProvider({ children }: { children: ReactNode }) {\n  const [theme, setTheme] = useState<Theme>(\"light\");\n\n  // TODO: toggleTheme —— 注意第 5 条和第 7 条\n  const toggleTheme = () => {};\n\n  // TODO: value —— 注意第 6 条\n  const value = { theme, toggleTheme };\n\n  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;\n}\n\nexport function useTheme(): ThemeContextValue {\n  // TODO: 读 context，并按第 4 条加守卫\n  const ctx = useContext(ThemeContext);\n  return ctx as ThemeContextValue;\n}\n\nexport function ThemeToggleButton() {\n  const { theme, toggleTheme } = useTheme();\n  return (\n    <button data-testid=\"theme-toggle\" onClick={toggleTheme} type=\"button\">\n      {/* TODO: 第 1 条 —— 文字说的是「点了会变成什么」 */}\n      Switch\n    </button>\n  );\n}\n\nexport function ThemedCard({ children }: { children?: ReactNode }) {\n  const { theme } = useTheme();\n  return (\n    <div\n      data-testid=\"themed-card\"\n      data-theme={theme}\n      style={{\n        // TODO: 第 2 条\n        background: \"#fff\",\n        border: \"1px solid #ccc\",\n        padding: 16,\n      }}\n    >\n      <span data-testid=\"theme-name\">{theme}</span>\n      {children}\n    </div>\n  );\n}\n",
    "/App.tsx": "import { ThemedCard, ThemeProvider, ThemeToggleButton } from \"./ThemeContext\";\n\n// 预览区只是让眼睛有东西看，判分看下面的测试。\n// App 整个套在 Provider 里 —— 只有 Provider 的子树才能 useTheme()。\nexport default function App() {\n  return (\n    <ThemeProvider>\n      <div style={{ fontFamily: \"system-ui\", padding: 16, fontSize: 13 }}>\n        <ThemeToggleButton />\n        <div style={{ marginTop: 12 }}>\n          <ThemedCard>\n            <p style={{ margin: \"8px 0 0\" }}>卡片内容</p>\n          </ThemedCard>\n        </div>\n      </div>\n    </ThemeProvider>\n  );\n}\n"
  },
  "tests": "// Test names are in English on purpose.\n//\n// Sandpack's test runner decodes the source snippet it prints under a failed\n// assertion as Latin-1, so any non-ASCII byte in THIS file comes out as mojibake\n// exactly when you need to read it. The real assessment's tests are in English\n// anyway, so this is closer to the thing you are training for.\n// The Chinese wording of every requirement is in the starter file's header.\n//\n// No userEvent and no jest-dom here: Sandpack's runner only ships a jest-like\n// core, so this file sticks to fireEvent plus toBe / toEqual / toContain.\n\nimport { fireEvent, render, screen } from \"@testing-library/react\";\nimport {\n  ThemedCard,\n  ThemeProvider,\n  ThemeToggleButton,\n  useTheme,\n} from \"./ThemeContext\";\n\nconst App = () => (\n  <ThemeProvider>\n    <ThemeToggleButton />\n    <ThemedCard />\n  </ThemeProvider>\n);\n\nconst bg = () => screen.getByTestId(\"themed-card\").style.background;\n\ndescribe(\"theme context\", () => {\n  // requirement 1 + 2\n  test(\"starts on light: card says light, button offers dark, background is #fff\", () => {\n    render(<App />);\n    expect(screen.getByTestId(\"theme-name\").textContent).toBe(\"light\");\n    expect(screen.getByTestId(\"theme-toggle\").textContent).toBe(\"Switch to Dark\");\n    expect(bg()).toContain(\"rgb(255, 255, 255)\");\n  });\n\n  // requirement 1 + 2\n  test(\"one click flips label and background together\", () => {\n    render(<App />);\n    fireEvent.click(screen.getByTestId(\"theme-toggle\"));\n    expect(screen.getByTestId(\"theme-name\").textContent).toBe(\"dark\");\n    expect(screen.getByTestId(\"theme-toggle\").textContent).toBe(\"Switch to Light\");\n    expect(bg()).toContain(\"rgb(34, 34, 34)\");\n  });\n\n  // requirement 1\n  test(\"a second click goes back to light\", () => {\n    render(<App />);\n    fireEvent.click(screen.getByTestId(\"theme-toggle\"));\n    fireEvent.click(screen.getByTestId(\"theme-toggle\"));\n    expect(screen.getByTestId(\"theme-name\").textContent).toBe(\"light\");\n    expect(bg()).toContain(\"rgb(255, 255, 255)\");\n  });\n\n  // requirement 3 - the whole point of context\n  test(\"every consumer under one provider flips together\", () => {\n    render(\n      <ThemeProvider>\n        <ThemeToggleButton />\n        <ThemedCard />\n        <ThemedCard />\n      </ThemeProvider>,\n    );\n    const names = () => screen.getAllByTestId(\"theme-name\").map((n) => n.textContent);\n    expect(names()).toEqual([\"light\", \"light\"]);\n    fireEvent.click(screen.getByTestId(\"theme-toggle\"));\n    expect(names()).toEqual([\"dark\", \"dark\"]);\n  });\n\n  // requirement 4 - forgetting the provider must blow up, not silently default\n  test(\"useTheme without a provider throws and names ThemeProvider\", () => {\n    // React logs the expected error, so silence console.error for this one test.\n    const orig = console.error;\n    console.error = () => {};\n    let message = \"\";\n    try {\n      render(<ThemedCard />);\n    } catch (err) {\n      message = String(err && err.message);\n    } finally {\n      console.error = orig;\n    }\n    expect(message).toContain(\"ThemeProvider\");\n  });\n\n  // requirement 5 - useCallback\n  test(\"toggleTheme keeps the same identity across theme changes\", () => {\n    const seen = [];\n    const Probe = () => {\n      const { toggleTheme } = useTheme();\n      seen.push(toggleTheme);\n      return (\n        <button data-testid=\"probe\" onClick={toggleTheme} type=\"button\">\n          go\n        </button>\n      );\n    };\n    render(\n      <ThemeProvider>\n        <Probe />\n      </ThemeProvider>,\n    );\n    fireEvent.click(screen.getByTestId(\"probe\"));\n    expect(seen.length > 1).toBe(true);\n    expect(new Set(seen).size).toBe(1);\n  });\n\n  // requirement 6 - useMemo on the context value\n  test(\"the context value object is reused while theme is unchanged\", () => {\n    const values = [];\n    const Probe = () => {\n      values.push(useTheme());\n      return null;\n    };\n    const { rerender } = render(\n      <ThemeProvider>\n        <Probe />\n      </ThemeProvider>,\n    );\n    // The parent re-renders but theme did not move.\n    rerender(\n      <ThemeProvider>\n        <Probe />\n      </ThemeProvider>,\n    );\n    expect(values.length > 1).toBe(true);\n    expect(new Set(values).size).toBe(1);\n  });\n\n  // requirement 7 - functional update\n  test(\"calling toggleTheme twice in one event lands back where it started\", () => {\n    const Twice = () => {\n      const { toggleTheme } = useTheme();\n      return (\n        <button\n          data-testid=\"twice\"\n          onClick={() => {\n            toggleTheme();\n            toggleTheme();\n          }}\n          type=\"button\"\n        >\n          go\n        </button>\n      );\n    };\n    render(\n      <ThemeProvider>\n        <Twice />\n        <ThemedCard />\n      </ThemeProvider>,\n    );\n    fireEvent.click(screen.getByTestId(\"twice\"));\n    // Two flips = back to the start. With setTheme(theme === \"light\" ? ...) both\n    // calls read the same stale theme and it would stop on dark.\n    expect(screen.getByTestId(\"theme-name\").textContent).toBe(\"light\");\n  });\n});\n",
  "dependencies": {
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "@testing-library/react": "16.1.0",
    "@testing-library/dom": "10.4.0"
  },
  "expect": "8 passed"
};

const SB_STARS: SandboxSpec = {
  "files": {
    "/StarRating.tsx": "import { useState } from \"react\";\n\nexport interface StarRatingProps {\n  max?: number;\n  /** 传了就是受控组件 */\n  value?: number;\n  onChange?: (v: number) => void;\n}\n\n/**\n * 星级评分。\n *\n * 验收标准（测试逐条查，跟页面上那几条一一对应）：\n *\n * 1. hover 到第 n 颗时，前 n 颗显示为「亮」——这只是**预览**，\n *    不改已选的值。\n * 2. 鼠标移出整个组件后，回到已选值。\n * 3. 点第 n 颗设为 n 分；**再点同一颗清零**。\n * 4. 每颗星是一个 <button>，带 aria-label（格式 `${n} star`），\n *    aria-pressed 标出当前选中的那一颗。\n * 5. **只有两个 state**：已选值 和 hover 值。\n *    「当前该显示几颗亮」是派生的（hover ?? current），不许开第三个 state。\n * 6. 传了 value 就是受控：内部不留自己的值，点击只调 onChange。\n *\n * 测试靠这些钩子找元素，不能改名：\n *   容器 data-testid=\"stars\"，且 data-value 是当前已选值\n *   每颗星 data-testid={`star-${n}`}，亮的那些 data-filled=\"true\"\n *   data-testid=\"stars-value\" 显示当前已选值\n */\nexport function StarRating({ max = 5, value, onChange }: StarRatingProps) {\n  const [inner, setInner] = useState(0);\n  const [hover, setHover] = useState<number | null>(null);\n\n  // TODO: 受控 / 非受控 —— current 该读哪个？\n  // TODO: shown 是派生的（第 5 条）\n  // TODO: set(v) —— 注意第 3 条的「再点清零」和第 6 条的受控分支\n\n  void inner;\n  void setInner;\n  void hover;\n  void setHover;\n  void value;\n  void onChange;\n\n  return (\n    <div data-testid=\"stars\" data-value={0}>\n      {/* TODO: max 颗按钮 */}\n      <output data-testid=\"stars-value\">0</output>\n    </div>\n  );\n}\n",
    "/App.tsx": "import { useState } from \"react\";\nimport { StarRating } from \"./StarRating\";\n\n// 预览区只是让眼睛有东西看，判分看下面的测试。\nexport default function App() {\n  const [v, setV] = useState(3);\n  return (\n    <div style={{ fontFamily: \"system-ui\", padding: 16, fontSize: 13 }}>\n      <p style={{ margin: \"0 0 6px\", opacity: 0.7 }}>非受控（自己存值）</p>\n      <StarRating />\n      <p style={{ margin: \"16px 0 6px\", opacity: 0.7 }}>受控：外面存 {v}</p>\n      <StarRating onChange={setV} value={v} />\n    </div>\n  );\n}\n"
  },
  "tests": "// Test names are in English on purpose.\n//\n// Sandpack's test runner decodes the source snippet it prints under a failed\n// assertion as Latin-1, so any non-ASCII byte in THIS file comes out as mojibake\n// exactly when you need to read it. The real assessment's tests are in English\n// anyway, so this is closer to the thing you are training for.\n// The Chinese wording of every requirement is in the starter file's header.\n\nimport { fireEvent, render, screen } from \"@testing-library/react\";\nimport { StarRating } from \"./StarRating\";\n\nconst star = (n) => screen.getByTestId(`star-${n}`);\nconst filled = () =>\n  [1, 2, 3, 4, 5].map((n) => star(n).getAttribute(\"data-filled\") === \"true\");\nconst shownValue = () => screen.getByTestId(\"stars-value\").textContent;\n\ndescribe(\"StarRating\", () => {\n  // requirement 4\n  test(\"renders five buttons with aria-label and aria-pressed\", () => {\n    render(<StarRating />);\n    for (const n of [1, 2, 3, 4, 5]) {\n      expect(star(n).tagName).toBe(\"BUTTON\");\n      expect(star(n).getAttribute(\"aria-label\")).toBe(`${n} star`);\n    }\n    expect(shownValue()).toBe(\"0\");\n  });\n\n  // requirement 3\n  test(\"clicking the third star sets the value to 3\", () => {\n    render(<StarRating />);\n    fireEvent.click(star(3));\n    expect(shownValue()).toBe(\"3\");\n    expect(screen.getByTestId(\"stars\").getAttribute(\"data-value\")).toBe(\"3\");\n    expect(filled()).toEqual([true, true, true, false, false]);\n    expect(star(3).getAttribute(\"aria-pressed\")).toBe(\"true\");\n    expect(star(2).getAttribute(\"aria-pressed\")).toBe(\"false\");\n  });\n\n  // requirement 3 - clicking the same star again clears it\n  test(\"clicking the selected star again clears back to zero\", () => {\n    render(<StarRating />);\n    fireEvent.click(star(4));\n    expect(shownValue()).toBe(\"4\");\n    fireEvent.click(star(4));\n    expect(shownValue()).toBe(\"0\");\n    expect(filled()).toEqual([false, false, false, false, false]);\n  });\n\n  // requirement 1 - hover is a preview only\n  test(\"hover lights up a preview without changing the value\", () => {\n    render(<StarRating />);\n    fireEvent.click(star(2));\n    fireEvent.mouseEnter(star(5));\n    expect(filled()).toEqual([true, true, true, true, true]);\n    // the stored value is untouched\n    expect(shownValue()).toBe(\"2\");\n    expect(screen.getByTestId(\"stars\").getAttribute(\"data-value\")).toBe(\"2\");\n  });\n\n  // requirement 2\n  test(\"leaving the component drops the preview and shows the stored value\", () => {\n    render(<StarRating />);\n    fireEvent.click(star(2));\n    fireEvent.mouseEnter(star(5));\n    fireEvent.mouseLeave(screen.getByTestId(\"stars\"));\n    expect(filled()).toEqual([true, true, false, false, false]);\n    expect(shownValue()).toBe(\"2\");\n  });\n\n  // requirement 1 + 5 - preview works from zero too, and is derived\n  test(\"hover previews even when nothing is selected yet\", () => {\n    render(<StarRating />);\n    fireEvent.mouseEnter(star(3));\n    expect(filled()).toEqual([true, true, true, false, false]);\n    expect(shownValue()).toBe(\"0\");\n    fireEvent.mouseLeave(screen.getByTestId(\"stars\"));\n    expect(filled()).toEqual([false, false, false, false, false]);\n  });\n\n  // requirement 6 - controlled mode keeps no inner copy\n  test(\"in controlled mode the value comes from the prop, not from inside\", () => {\n    const seen = [];\n    const { rerender } = render(\n      <StarRating onChange={(v) => seen.push(v)} value={1} />,\n    );\n    expect(shownValue()).toBe(\"1\");\n\n    // Clicking must not move the display on its own; only onChange fires.\n    fireEvent.click(star(4));\n    expect(seen).toEqual([4]);\n    expect(shownValue()).toBe(\"1\");\n\n    // The parent feeds the new value back in.\n    rerender(<StarRating onChange={(v) => seen.push(v)} value={4} />);\n    expect(shownValue()).toBe(\"4\");\n    expect(filled()).toEqual([true, true, true, true, false]);\n  });\n\n  // requirement 3 + 6 - \"click the same one again\" also has to work controlled\n  test(\"controlled mode reports 0 when the selected star is clicked again\", () => {\n    const seen = [];\n    render(<StarRating onChange={(v) => seen.push(v)} value={3} />);\n    fireEvent.click(star(3));\n    expect(seen).toEqual([0]);\n  });\n\n  // requirement 4 - max is respected\n  test(\"max changes how many stars are drawn\", () => {\n    render(<StarRating max={3} />);\n    expect(screen.getByTestId(\"star-3\")).toBeTruthy();\n    expect(screen.queryByTestId(\"star-4\")).toBe(null);\n  });\n});\n",
  "dependencies": {
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "@testing-library/react": "16.1.0",
    "@testing-library/dom": "10.4.0"
  },
  "expect": "9 passed"
};

const SB_ULS: SandboxSpec = {
  "files": {
    "/useLocalStorage.ts": "import { useState } from \"react\";\n\n/**\n * 把一个值和 localStorage 绑在一起。\n *\n * 验收标准（测试逐条查，跟页面上那几条一一对应）：\n *\n * 1. 名字必须 use 开头 —— ESLint 靠这个前缀才会检查 hooks 规则。\n * 2. **惰性初始化**：读 localStorage 只在首次渲染做一次，不是每次渲染都读。\n *    useState(读取()) 是每次渲染都执行读取；useState(() => 读取()) 才是一次。\n * 3. localStorage 里没有这个 key 时用 initial。\n * 4. 存进去的是 JSON，取出来要 JSON.parse —— 对象和数组都要能原样回来。\n * 5. localStorage 里是脏数据（parse 不了）时退回 initial，**不许让组件炸**。\n *    隐私模式下 setItem 会抛，也要吞掉 —— 写不进去只影响持久化。\n * 6. 值变了要写回 localStorage。\n * 7. 返回 [value, setValue] 元组，setValue 支持函数式更新。\n *\n * 【一个已知局限，不在验收范围内，但你该知道】\n * 这个 hook 在 key **中途变化**时不会去读新 key —— 初始化那一步只跑一次。\n * 它会把手上那个旧值写进新 key 里。要支持换 key 得再加一个 effect\n * 或者用 key 当组件的 React key 把它整体重建。\n * 这里不要求你处理，因为课文里那份参考答案也没处理。\n */\nexport function useLocalStorage<T>(key: string, initial: T) {\n  // TODO: 惰性初始化 + try/catch（第 2、3、4、5 条）\n  const [value, setValue] = useState<T>(initial);\n\n  // TODO: 值变了写回去（第 6 条）\n\n  return [value, setValue] as const;\n}\n",
    "/App.tsx": "import { useLocalStorage } from \"./useLocalStorage\";\n\n// 预览区只是让眼睛有东西看，判分看下面的测试。\n// 写对了以后：改了输入框再刷新预览，值还在。\nexport default function App() {\n  const [name, setName] = useLocalStorage(\"demo-name\", \"\");\n  const [count, setCount] = useLocalStorage(\"demo-count\", 0);\n\n  return (\n    <div style={{ fontFamily: \"system-ui\", padding: 16, fontSize: 13 }}>\n      <p style={{ margin: \"0 0 8px\" }}>\n        存进 localStorage 的名字：<b>{name || \"(空)\"}</b>\n      </p>\n      <input\n        onChange={(e) => setName(e.target.value)}\n        placeholder=\"随便打点字\"\n        value={name}\n      />\n      <p style={{ margin: \"12px 0 8px\" }}>\n        计数：<b>{count}</b>\n      </p>\n      <button onClick={() => setCount((c) => c + 1)} type=\"button\">\n        +1\n      </button>\n      <p style={{ marginTop: 12, opacity: 0.6 }}>\n        刷新右边的预览，值应该还在。\n      </p>\n    </div>\n  );\n}\n"
  },
  "tests": "// Test names are in English on purpose.\n//\n// Sandpack's test runner decodes the source snippet it prints under a failed\n// assertion as Latin-1, so any non-ASCII byte in THIS file comes out as mojibake\n// exactly when you need to read it. The real assessment's tests are in English\n// anyway, so this is closer to the thing you are training for.\n// The Chinese wording of every requirement is in the starter file's header.\n\nimport { act, renderHook } from \"@testing-library/react\";\nimport { useLocalStorage } from \"./useLocalStorage\";\n\n// Every test starts from a clean store, and any patched method is put back.\nlet restore = null;\nbeforeEach(() => {\n  window.localStorage.clear();\n  restore = null;\n});\nafterEach(() => {\n  if (restore) restore();\n  window.localStorage.clear();\n});\n\ndescribe(\"useLocalStorage\", () => {\n  // requirement 3\n  test(\"falls back to the initial value when the key is missing\", () => {\n    const { result } = renderHook(() => useLocalStorage(\"k\", \"fallback\"));\n    expect(result.current[0]).toBe(\"fallback\");\n  });\n\n  // requirement 4\n  test(\"reads an existing value back through JSON.parse\", () => {\n    window.localStorage.setItem(\"k\", JSON.stringify({ a: 1, b: [2, 3] }));\n    const { result } = renderHook(() => useLocalStorage(\"k\", null));\n    expect(result.current[0]).toEqual({ a: 1, b: [2, 3] });\n  });\n\n  // requirement 6\n  test(\"writes the value back as JSON when it changes\", () => {\n    const { result } = renderHook(() => useLocalStorage(\"k\", 0));\n    act(() => {\n      result.current[1](7);\n    });\n    expect(result.current[0]).toBe(7);\n    expect(window.localStorage.getItem(\"k\")).toBe(\"7\");\n  });\n\n  // requirement 7\n  test(\"setValue supports the functional form\", () => {\n    const { result } = renderHook(() => useLocalStorage(\"k\", 1));\n    act(() => {\n      result.current[1]((n) => n + 41);\n    });\n    expect(result.current[0]).toBe(42);\n    expect(window.localStorage.getItem(\"k\")).toBe(\"42\");\n  });\n\n  // requirement 2 - the whole point: read once, not on every render\n  test(\"parses the stored value only once, not on every render\", () => {\n    window.localStorage.setItem(\"k\", JSON.stringify(\"stored\"));\n\n    // Counting through JSON.parse rather than through localStorage.getItem:\n    // patching Storage.prototype.getItem does NOT intercept the call in this\n    // runner (verified - the patched counter stayed at zero while the value\n    // still came through). JSON is a plain global, so this always works.\n    const real = JSON.parse;\n    let parses = 0;\n    JSON.parse = function (text, reviver) {\n      if (text === JSON.stringify(\"stored\")) parses++;\n      return real.call(JSON, text, reviver);\n    };\n    restore = () => {\n      JSON.parse = real;\n    };\n\n    const { result, rerender } = renderHook(() => useLocalStorage(\"k\", \"x\"));\n    rerender();\n    rerender();\n\n    expect(result.current[0]).toBe(\"stored\");\n    // useState(read()) runs read() on every render; useState(() => read())\n    // runs it once. Three renders, one parse.\n    expect(parses).toBe(1);\n  });\n\n  // requirement 5 - garbage in storage must not crash the component\n  test(\"bad JSON in storage falls back to the initial value instead of throwing\", () => {\n    window.localStorage.setItem(\"k\", \"{not json at all\");\n    let threw = \"\";\n    let value;\n    try {\n      const { result } = renderHook(() => useLocalStorage(\"k\", \"safe\"));\n      value = result.current[0];\n    } catch (err) {\n      threw = String(err && err.message);\n    }\n    expect(threw).toBe(\"\");\n    expect(value).toBe(\"safe\");\n  });\n\n  // requirement 5 - a throwing setItem (private mode) must be swallowed\n  test(\"a throwing setItem does not break the hook\", () => {\n    const real = Storage.prototype.setItem;\n    Storage.prototype.setItem = () => {\n      throw new Error(\"QuotaExceededError\");\n    };\n    restore = () => {\n      Storage.prototype.setItem = real;\n    };\n\n    let threw = \"\";\n    try {\n      const { result } = renderHook(() => useLocalStorage(\"k\", 0));\n      act(() => {\n        result.current[1](5);\n      });\n      expect(result.current[0]).toBe(5);\n    } catch (err) {\n      threw = String(err && err.message);\n    }\n    expect(threw).toBe(\"\");\n  });\n});\n",
  "dependencies": {
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "@testing-library/react": "16.1.0",
    "@testing-library/dom": "10.4.0"
  },
  "expect": "7 passed"
};

const SB_DROPDOWN: SandboxSpec = {
  "files": {
    "/Dropdown.tsx": "import { useRef, useState } from \"react\";\n\nexport interface Option {\n  id: string;\n  label: string;\n}\n\n/**\n * Dropdown：点外面要关掉。\n *\n * 验收标准（测试逐条查，跟页面上那几条一一对应）：\n *\n * 1. 点触发器展开选项列表，选中后收起并把触发器文字换成选中项的 label。\n *    没选过的时候触发器显示「请选择」。\n * 2. 点组件**外面**任何地方都要关掉；点组件**内部**不能关。\n *    判断办法：用 useRef 拿到自己的根节点，看 e.target 在不在这棵子树里\n *    （node.contains(e.target)）。\n * 3. 按 Escape 关闭。\n * 4. **卸载时必须解绑 document 上的监听器。** 不解绑的话每次展开都多一对，\n *    卸载后还会对已卸载组件 setState。\n *    顺带：没展开的时候就不该挂监听器 —— 省一个。\n * 5. 触发器要有 aria-haspopup=\"listbox\" 和 aria-expanded；\n *    列表 role=\"listbox\"，每一项 role=\"option\" + aria-selected。\n *\n * 测试靠这些钩子找元素，不能改名：\n *   dropdown / dropdown-trigger / dropdown-list / option-<id>\n *\n * 注意监听的是 mousedown，不是 click ——\n * click 会在「选项自己的 onClick 之后」才冒到 document，顺序容易咬到自己。\n */\nexport function Dropdown({\n  options,\n  onSelect,\n}: {\n  options: Option[];\n  onSelect?: (id: string) => void;\n}) {\n  const [open, setOpen] = useState(false);\n  const [picked, setPicked] = useState<Option | null>(null);\n  const boxRef = useRef<HTMLDivElement>(null);\n\n  // TODO: useEffect —— 只在 open 时挂 mousedown / keydown，\n  //       清理函数里必须解绑（第 2、3、4 条）\n\n  void boxRef;\n  void onSelect;\n  void setPicked;\n\n  return (\n    <div ref={boxRef} data-testid=\"dropdown\">\n      <button\n        data-testid=\"dropdown-trigger\"\n        onClick={() => setOpen((v) => !v)}\n        type=\"button\"\n      >\n        {/* TODO: 第 1 条 —— 选过就显示 label */}\n        请选择\n      </button>\n      {/* TODO: open 时渲染 role=\"listbox\"，每项 role=\"option\"（第 1、5 条） */}\n      {open && null}\n      {picked ? null : null}\n    </div>\n  );\n}\n",
    "/App.tsx": "import { useState } from \"react\";\nimport { Dropdown } from \"./Dropdown\";\nimport type { Option } from \"./Dropdown\";\n\n// 预览区只是让眼睛有东西看，判分看下面的测试。\nconst options: Option[] = [\n  { id: \"a\", label: \"苹果\" },\n  { id: \"b\", label: \"香蕉\" },\n  { id: \"c\", label: \"橘子\" },\n];\n\nexport default function App() {\n  const [last, setLast] = useState(\"\");\n  return (\n    <div style={{ fontFamily: \"system-ui\", padding: 16, fontSize: 13 }}>\n      <Dropdown onSelect={setLast} options={options} />\n      <p style={{ marginTop: 12, opacity: 0.7 }}>\n        最后选的 id：{last || \"(还没选)\"}\n      </p>\n      <p style={{ marginTop: 24, opacity: 0.6 }}>\n        ↓ 点这块空白，展开的列表应该关掉\n      </p>\n      <div style={{ height: 60, border: \"1px dashed #999\" }} />\n    </div>\n  );\n}\n"
  },
  "tests": "// Test names are in English on purpose.\n//\n// Sandpack's test runner decodes the source snippet it prints under a failed\n// assertion as Latin-1, so any non-ASCII byte in THIS file comes out as mojibake\n// exactly when you need to read it. The real assessment's tests are in English\n// anyway, so this is closer to the thing you are training for.\n// The Chinese wording of every requirement is in the starter file's header.\n\nimport { fireEvent, render, screen } from \"@testing-library/react\";\nimport { Dropdown } from \"./Dropdown\";\n\nconst options = [\n  { id: \"a\", label: \"Apple\" },\n  { id: \"b\", label: \"Banana\" },\n  { id: \"c\", label: \"Orange\" },\n];\n\nconst trigger = () => screen.getByTestId(\"dropdown-trigger\");\nconst list = () => screen.queryByTestId(\"dropdown-list\");\n\ndescribe(\"Dropdown\", () => {\n  // requirement 1 + 5\n  test(\"starts closed, opens on click, and reports state through aria-expanded\", () => {\n    render(<Dropdown options={options} />);\n    expect(list()).toBe(null);\n    expect(trigger().getAttribute(\"aria-haspopup\")).toBe(\"listbox\");\n    expect(trigger().getAttribute(\"aria-expanded\")).toBe(\"false\");\n\n    fireEvent.click(trigger());\n    expect(list()).not.toBe(null);\n    expect(trigger().getAttribute(\"aria-expanded\")).toBe(\"true\");\n    expect(screen.getAllByRole(\"option\").length).toBe(3);\n  });\n\n  // requirement 1\n  test(\"picking an option closes the list and relabels the trigger\", () => {\n    const picked = [];\n    render(<Dropdown onSelect={(id) => picked.push(id)} options={options} />);\n    fireEvent.click(trigger());\n    fireEvent.click(screen.getByTestId(\"option-b\"));\n\n    expect(list()).toBe(null);\n    expect(trigger().textContent).toBe(\"Banana\");\n    expect(picked).toEqual([\"b\"]);\n  });\n\n  // requirement 5\n  test(\"aria-selected marks the picked option when reopened\", () => {\n    render(<Dropdown options={options} />);\n    fireEvent.click(trigger());\n    fireEvent.click(screen.getByTestId(\"option-c\"));\n    fireEvent.click(trigger());\n    expect(\n      screen.getAllByRole(\"option\").map((o) => o.getAttribute(\"aria-selected\")),\n    ).toEqual([\"false\", \"false\", \"true\"]);\n  });\n\n  // requirement 2 - the headline behaviour\n  test(\"a mousedown outside closes it\", () => {\n    render(\n      <div>\n        <Dropdown options={options} />\n        <button data-testid=\"outside\" type=\"button\">\n          outside\n        </button>\n      </div>,\n    );\n    fireEvent.click(trigger());\n    expect(list()).not.toBe(null);\n    fireEvent.mouseDown(screen.getByTestId(\"outside\"));\n    expect(list()).toBe(null);\n  });\n\n  // requirement 2 - and the other half, which naive solutions get wrong\n  test(\"a mousedown inside does NOT close it\", () => {\n    render(<Dropdown options={options} />);\n    fireEvent.click(trigger());\n    fireEvent.mouseDown(screen.getByTestId(\"dropdown\"));\n    expect(list()).not.toBe(null);\n    fireEvent.mouseDown(screen.getByTestId(\"option-a\"));\n    expect(list()).not.toBe(null);\n  });\n\n  // requirement 3\n  test(\"Escape closes it\", () => {\n    render(<Dropdown options={options} />);\n    fireEvent.click(trigger());\n    fireEvent.keyDown(document, { key: \"Escape\" });\n    expect(list()).toBe(null);\n  });\n\n  // requirement 3 - some other key must not close it\n  test(\"another key does not close it\", () => {\n    render(<Dropdown options={options} />);\n    fireEvent.click(trigger());\n    fireEvent.keyDown(document, { key: \"a\" });\n    expect(list()).not.toBe(null);\n  });\n\n  // requirement 4 - no listener left behind, and none added while closed\n  test(\"adds document listeners only while open and removes them on unmount\", () => {\n    const realAdd = document.addEventListener;\n    const realRemove = document.removeEventListener;\n    const live = {};\n    document.addEventListener = function (type, fn, opts) {\n      live[type] = (live[type] || 0) + 1;\n      return realAdd.call(this, type, fn, opts);\n    };\n    document.removeEventListener = function (type, fn, opts) {\n      live[type] = (live[type] || 0) - 1;\n      return realRemove.call(this, type, fn, opts);\n    };\n\n    try {\n      const { unmount } = render(<Dropdown options={options} />);\n      // Closed: nothing on the document yet.\n      expect(live.mousedown || 0).toBe(0);\n      expect(live.keydown || 0).toBe(0);\n\n      fireEvent.click(trigger());\n      expect(live.mousedown).toBe(1);\n      expect(live.keydown).toBe(1);\n\n      // Opening and closing repeatedly must not stack listeners up.\n      fireEvent.keyDown(document, { key: \"Escape\" });\n      fireEvent.click(trigger());\n      fireEvent.keyDown(document, { key: \"Escape\" });\n      fireEvent.click(trigger());\n      expect(live.mousedown).toBe(1);\n      expect(live.keydown).toBe(1);\n\n      unmount();\n      expect(live.mousedown).toBe(0);\n      expect(live.keydown).toBe(0);\n    } finally {\n      document.addEventListener = realAdd;\n      document.removeEventListener = realRemove;\n    }\n  });\n});\n",
  "dependencies": {
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "@testing-library/react": "16.1.0",
    "@testing-library/dom": "10.4.0"
  },
  "expect": "8 passed"
};

const SB_TIMER: SandboxSpec = {
  "files": {
    "/Timer.tsx": "import { useState } from \"react\";\n\nconst pad = (n: number) => String(n).padStart(2, \"0\");\n\n/** 秒数格式化成 mm:ss。已经写好了，不用改。 */\nexport const format = (totalSeconds: number) =>\n  `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`;\n\n/**\n * 计时器。这道题真正考的是 **useEffect 的清理函数**。\n *\n * 验收标准（测试逐条查，跟页面上那几条一一对应）：\n *\n * 1. 显示 format(seconds)，初始 00:00。按钮文字在 Start / Pause 之间切。\n * 2. 跑起来以后每秒 +1。\n * 3. **必须用函数式更新** setSeconds(s => s + 1)。\n *    写成 setSeconds(seconds + 1) 会永远读到建 interval 那次渲染的 seconds\n *    （过期闭包），秒数卡在 1 不动。\n * 4. **effect 必须返回 clearInterval 的清理函数。**\n *    少了它：每次 running 变 true 就多一个 interval，秒数越跳越快；\n *    组件卸载后 interval 还在跑 —— 内存泄漏。\n * 5. 没在跑的时候不该有定时器（if (!running) return 提前退出）。\n * 6. Reset 把秒数归零**并且**停下来。\n *\n * 测试靠这些钩子找元素，不能改名：timer / display / toggle / reset。\n *\n * 【关于测试很慢】\n * 沙箱的测试环境没有 fake timer，所以下面那几条是**真等**几秒。\n * 一次跑完大概十几秒，别以为卡住了。\n */\nexport function Timer() {\n  const [seconds, setSeconds] = useState(0);\n  const [running, setRunning] = useState(false);\n\n  // TODO: useEffect —— 第 2、3、4、5 条全在这里\n\n  const reset = () => {\n    // TODO: 第 6 条\n  };\n\n  return (\n    <div data-testid=\"timer\">\n      <output data-testid=\"display\">{format(seconds)}</output>\n      <button\n        data-testid=\"toggle\"\n        onClick={() => setRunning((r) => !r)}\n        type=\"button\"\n      >\n        {running ? \"Pause\" : \"Start\"}\n      </button>\n      <button data-testid=\"reset\" onClick={reset} type=\"button\">\n        Reset\n      </button>\n    </div>\n  );\n}\n",
    "/App.tsx": "import { useState } from \"react\";\nimport { Timer } from \"./Timer\";\n\n// 预览区只是让眼睛有东西看，判分看下面的测试。\nexport default function App() {\n  const [mounted, setMounted] = useState(true);\n  return (\n    <div style={{ fontFamily: \"system-ui\", padding: 16, fontSize: 13 }}>\n      {mounted ? <Timer /> : <p>已卸载</p>}\n      <p style={{ marginTop: 16, opacity: 0.7 }}>\n        自测：跑起来之后点「卸载」——控制台不该继续有动静。\n      </p>\n      <button onClick={() => setMounted((m) => !m)} type=\"button\">\n        {mounted ? \"卸载\" : \"装回来\"}\n      </button>\n    </div>\n  );\n}\n"
  },
  "tests": "// Test names are in English on purpose.\n//\n// Sandpack's test runner decodes the source snippet it prints under a failed\n// assertion as Latin-1, so any non-ASCII byte in THIS file comes out as mojibake\n// exactly when you need to read it. The real assessment's tests are in English\n// anyway, so this is closer to the thing you are training for.\n// The Chinese wording of every requirement is in the starter file's header.\n//\n// Three hard facts about time in this runner, all measured the hard way:\n//   1. There is no fake timer, so the clock tests really do wait. The whole\n//      file takes ten seconds or so. That is expected, not a hang.\n//   2. Each setTimeout costs a few hundred ms more than you asked for, so a\n//      fixed sleep lands somewhere unpredictable. Nothing below asserts an\n//      exact second count; `until` polls the real clock instead.\n//   3. There is a hard 5000ms budget per test and no way to raise it here.\n//      A test that blows it also wrecks the tests after it (the DOM is left\n//      unmounted and they fail with \"unable to find an element\"). Hence the\n//      tight budgets passed to `until`.\n\nimport { act, fireEvent, render, screen } from \"@testing-library/react\";\nimport { format, Timer } from \"./Timer\";\n\nconst display = () => screen.getByTestId(\"display\").textContent;\nconst toggle = () => screen.getByTestId(\"toggle\");\n\n/** mm:ss back to a number, so readings can be compared. */\nconst secs = () => {\n  const [m, s] = display().split(\":\").map(Number);\n  return m * 60 + s;\n};\n\n/** Let real time pass and let React flush whatever the interval produced. */\nconst settle = (ms) => act(() => new Promise((r) => setTimeout(r, ms)));\n\n/** Poll until pred() holds or the wall-clock budget runs out. */\nasync function until(pred, budget) {\n  if (pred()) return true;\n  const t0 = Date.now();\n  while (Date.now() - t0 < budget) {\n    await settle(150);\n    if (pred()) return true;\n  }\n  return pred();\n}\n\ndescribe(\"format\", () => {\n  // requirement 1\n  test(\"pads both halves and rolls over at 60\", () => {\n    expect(format(0)).toBe(\"00:00\");\n    expect(format(9)).toBe(\"00:09\");\n    expect(format(59)).toBe(\"00:59\");\n    expect(format(60)).toBe(\"01:00\");\n    expect(format(61)).toBe(\"01:01\");\n    expect(format(600)).toBe(\"10:00\");\n  });\n});\n\ndescribe(\"Timer\", () => {\n  // requirement 1\n  test(\"starts at 00:00 with a Start button\", () => {\n    render(<Timer />);\n    expect(display()).toBe(\"00:00\");\n    expect(toggle().textContent).toBe(\"Start\");\n  });\n\n  // requirement 5 - idle means no interval at all\n  test(\"sits still while it has not been started\", async () => {\n    render(<Timer />);\n    await settle(1400);\n    expect(display()).toBe(\"00:00\");\n  });\n\n  // requirement 2 + 3 - the functional-update requirement lives here.\n  // A stale closure sticks on 1 forever, so the second reading catches it.\n  test(\"counts up and does not get stuck on the first tick\", async () => {\n    render(<Timer />);\n    fireEvent.click(toggle());\n    expect(toggle().textContent).toBe(\"Pause\");\n\n    expect(await until(() => secs() >= 1, 1900)).toBe(true);\n    const first = secs();\n    expect(await until(() => secs() > first, 1900)).toBe(true);\n  });\n\n  // requirement 4 - the cleanup function. Without clearInterval the old\n  // interval keeps running after `running` flips to false, which is also why\n  // a restart would end up ticking twice as fast.\n  test(\"pausing really stops it\", async () => {\n    render(<Timer />);\n    fireEvent.click(toggle()); // start\n    expect(await until(() => secs() >= 1, 1900)).toBe(true);\n    fireEvent.click(toggle()); // pause\n    const atPause = secs();\n\n    await settle(1400);\n    expect(secs()).toBe(atPause);\n  });\n\n  // requirement 6\n  test(\"Reset zeroes the clock and stops it\", async () => {\n    render(<Timer />);\n    fireEvent.click(toggle());\n    expect(await until(() => secs() >= 1, 1900)).toBe(true);\n\n    fireEvent.click(screen.getByTestId(\"reset\"));\n    expect(display()).toBe(\"00:00\");\n    expect(toggle().textContent).toBe(\"Start\");\n\n    await settle(1400);\n    expect(display()).toBe(\"00:00\");\n  });\n\n  // requirement 4 - nothing may keep ticking after unmount.\n  // No waiting needed: the effect runs on click, the cleanup runs on unmount.\n  test(\"no interval survives unmount\", () => {\n    // Patch on every handle the module might be using. Bare setInterval in a\n    // bundled module does not always resolve to window.setInterval here.\n    const realSet = globalThis.setInterval;\n    const realClear = globalThis.clearInterval;\n    const alive = new Set();\n    const patchedSet = function (fn, ms) {\n      const id = realSet.call(globalThis, fn, ms);\n      alive.add(id);\n      return id;\n    };\n    const patchedClear = function (id) {\n      alive.delete(id);\n      return realClear.call(globalThis, id);\n    };\n    globalThis.setInterval = patchedSet;\n    globalThis.clearInterval = patchedClear;\n    if (typeof window !== \"undefined\" && window !== globalThis) {\n      window.setInterval = patchedSet;\n      window.clearInterval = patchedClear;\n    }\n\n    try {\n      const { unmount } = render(<Timer />);\n      fireEvent.click(toggle());\n      expect(alive.size).toBe(1);\n      unmount();\n      expect(alive.size).toBe(0);\n    } finally {\n      globalThis.setInterval = realSet;\n      globalThis.clearInterval = realClear;\n      if (typeof window !== \"undefined\" && window !== globalThis) {\n        window.setInterval = realSet;\n        window.clearInterval = realClear;\n      }\n    }\n  });\n});\n",
  "dependencies": {
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "@testing-library/react": "16.1.0",
    "@testing-library/dom": "10.4.0"
  },
  "expect": "7 passed"
};

const SB_RTK: SandboxSpec = {
  "files": {
    "/todosSlice.ts": "import { createSlice, nanoid } from \"@reduxjs/toolkit\";\nimport type { PayloadAction } from \"@reduxjs/toolkit\";\n\nexport type Filter = \"all\" | \"active\" | \"done\";\n\nexport interface Todo {\n  id: string;\n  text: string;\n  done: boolean;\n}\n\nexport interface TodosState {\n  items: Todo[];\n  filter: Filter;\n}\n\nconst initialState: TodosState = { items: [], filter: \"all\" };\n\n/**\n * Redux Toolkit 版 Todo。\n *\n * 验收标准（测试逐条查，跟页面上那几条一一对应）：\n *\n * 1. 用 createSlice 写出五个 reducer：\n *    added / toggled / removed / clearedDone / filterChanged。\n * 2. **id 在 prepare 里生成，不在 reducer 里。**\n *    reducer 必须是纯函数 —— 同样的输入永远同样的输出。\n *    reducer 里出现 nanoid() 就不纯了（每次结果都不一样，没法测）。\n *    added 的 action creator 只收 text，并且要 trim。\n * 3. 看着像在改 state（state.items.push(...)），其实 RTK 内置的 Immer\n *    给的是草稿代理，产出的是新对象 —— 所以不违反「state 只读」。\n *    但**传进来的 state 对象本身不能被改动**，测试会拿冻结的 state 来验。\n * 4. 派生数据用 selector：selectVisible / selectRemaining / selectFilter。\n *    组件只订阅自己要的那部分。\n * 5. **筛选不能改底层数据** —— 切回 all 时全部条目都还在。\n * 6. reducer 要能脱离 React 单独测（这也是为什么这道题的测试里没有 render）。\n */\nconst todosSlice = createSlice({\n  name: \"todos\",\n  initialState,\n  reducers: {\n    // TODO: added —— 注意第 2 条，要用 prepare\n    // TODO: toggled / removed / clearedDone / filterChanged\n  },\n});\n\n// TODO: 把 action creator 导出来\nexport const {} = todosSlice.actions;\nexport default todosSlice.reducer;\n\n/* ---------- selectors（第 4 条） ---------- */\n\n// TODO: selectFilter / selectRemaining / selectVisible\n",
    "/App.tsx": "import { configureStore } from \"@reduxjs/toolkit\";\nimport { Provider, useDispatch, useSelector } from \"react-redux\";\nimport reducer, {\n  added,\n  clearedDone,\n  filterChanged,\n  removed,\n  selectFilter,\n  selectRemaining,\n  selectVisible,\n  toggled,\n} from \"./todosSlice\";\n\n// 预览区只是让眼睛有东西看，判分看下面的测试 ——\n// 这道题的测试**一行 render 都没有**，全部直接测 reducer 和 selector。\n// 那才是「reducer 能脱离 React 单独测」的意思。\nconst store = configureStore({ reducer: { todos: reducer } });\n\nfunction TodoApp() {\n  const dispatch = useDispatch();\n  const visible = useSelector(selectVisible);\n  const remaining = useSelector(selectRemaining);\n  const filter = useSelector(selectFilter);\n\n  return (\n    <div>\n      <form\n        onSubmit={(e) => {\n          e.preventDefault();\n          const input = e.currentTarget.elements.namedItem(\n            \"text\",\n          ) as HTMLInputElement;\n          if (input.value.trim()) {\n            dispatch(added(input.value));\n            input.value = \"\";\n          }\n        }}\n      >\n        <input name=\"text\" placeholder=\"写点什么\" />\n        <button type=\"submit\">Add</button>\n      </form>\n\n      <p>还剩 {remaining} 条</p>\n\n      <div style={{ display: \"flex\", gap: 6, marginBottom: 8 }}>\n        {([\"all\", \"active\", \"done\"] as const).map((f) => (\n          <button\n            key={f}\n            onClick={() => dispatch(filterChanged(f))}\n            style={{ fontWeight: filter === f ? 700 : 400 }}\n            type=\"button\"\n          >\n            {f}\n          </button>\n        ))}\n        <button onClick={() => dispatch(clearedDone())} type=\"button\">\n          清掉已完成\n        </button>\n      </div>\n\n      <ul style={{ paddingLeft: 18, margin: 0 }}>\n        {visible.map((t) => (\n          <li key={t.id}>\n            <input\n              checked={t.done}\n              onChange={() => dispatch(toggled(t.id))}\n              type=\"checkbox\"\n            />\n            <span style={{ textDecoration: t.done ? \"line-through\" : \"none\" }}>\n              {t.text}\n            </span>\n            <button onClick={() => dispatch(removed(t.id))} type=\"button\">\n              删\n            </button>\n          </li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n\nexport default function App() {\n  return (\n    <Provider store={store}>\n      <div style={{ fontFamily: \"system-ui\", padding: 16, fontSize: 13 }}>\n        <TodoApp />\n      </div>\n    </Provider>\n  );\n}\n"
  },
  "tests": "// Test names are in English on purpose.\n//\n// Sandpack's test runner decodes the source snippet it prints under a failed\n// assertion as Latin-1, so any non-ASCII byte in THIS file comes out as mojibake\n// exactly when you need to read it. The real assessment's tests are in English\n// anyway, so this is closer to the thing you are training for.\n// The Chinese wording of every requirement is in the starter file's header.\n//\n// Note what is NOT here: there is no render, no Provider, no React at all.\n// That is the point of requirement 6 - a reducer is a plain function, so test\n// it like one. The Provider wiring lives in App.tsx for you to click around in.\n\nimport reducer, {\n  added,\n  clearedDone,\n  filterChanged,\n  removed,\n  selectFilter,\n  selectRemaining,\n  selectVisible,\n  toggled,\n} from \"./todosSlice\";\n\nconst empty = () => reducer(undefined, { type: \"@@INIT\" });\nconst wrap = (todos) => ({ todos });\n\n// Run a list of actions against the initial state.\nconst run = (...actions) => actions.reduce((s, a) => reducer(s, a), empty());\n\ndescribe(\"todosSlice\", () => {\n  // requirement 1\n  test(\"starts empty with the all filter\", () => {\n    const s = empty();\n    expect(s.items).toEqual([]);\n    expect(s.filter).toBe(\"all\");\n  });\n\n  // requirement 1 + 2\n  test(\"added appends a todo and trims the text\", () => {\n    const s = run(added(\"  buy milk  \"));\n    expect(s.items.length).toBe(1);\n    expect(s.items[0].text).toBe(\"buy milk\");\n    expect(s.items[0].done).toBe(false);\n  });\n\n  // requirement 2 - the id must come from prepare, so the reducer stays pure\n  test(\"the id is generated in prepare, not in the reducer\", () => {\n    const action = added(\"x\");\n    // The action itself already carries a real id.\n    expect(typeof action.payload.id).toBe(\"string\");\n    expect(action.payload.id.length > 0).toBe(true);\n\n    // Feeding the SAME action twice must produce the same id: that is what\n    // \"the reducer is pure\" means. A nanoid() inside the reducer fails here.\n    const a = reducer(empty(), action);\n    const b = reducer(empty(), action);\n    expect(a.items[0].id).toBe(b.items[0].id);\n\n    // Two separate calls to the action creator get different ids.\n    expect(added(\"x\").payload.id).not.toBe(added(\"x\").payload.id);\n  });\n\n  // requirement 3 - the state handed in must not be mutated\n  test(\"does not mutate the state object it is given\", () => {\n    const before = run(added(\"a\"), added(\"b\"));\n    Object.freeze(before);\n    Object.freeze(before.items);\n    before.items.forEach((t) => Object.freeze(t));\n\n    const after = reducer(before, toggled(before.items[0].id));\n    expect(before.items[0].done).toBe(false);\n    expect(after.items[0].done).toBe(true);\n    expect(after).not.toBe(before);\n  });\n\n  // requirement 1\n  test(\"toggled flips exactly one item, and an unknown id changes nothing\", () => {\n    const s = run(added(\"a\"), added(\"b\"));\n    const t = reducer(s, toggled(s.items[1].id));\n    expect(t.items.map((x) => x.done)).toEqual([false, true]);\n\n    const u = reducer(t, toggled(\"nope\"));\n    expect(u.items.map((x) => x.done)).toEqual([false, true]);\n  });\n\n  // requirement 1\n  test(\"removed drops only that item\", () => {\n    const s = run(added(\"a\"), added(\"b\"), added(\"c\"));\n    const r = reducer(s, removed(s.items[1].id));\n    expect(r.items.map((x) => x.text)).toEqual([\"a\", \"c\"]);\n  });\n\n  // requirement 1\n  test(\"clearedDone drops every finished item and keeps the rest\", () => {\n    let s = run(added(\"a\"), added(\"b\"), added(\"c\"));\n    s = reducer(s, toggled(s.items[0].id));\n    s = reducer(s, toggled(s.items[2].id));\n    const c = reducer(s, clearedDone());\n    expect(c.items.map((x) => x.text)).toEqual([\"b\"]);\n  });\n\n  // requirement 4\n  test(\"selectRemaining counts the unfinished ones\", () => {\n    let s = run(added(\"a\"), added(\"b\"), added(\"c\"));\n    expect(selectRemaining(wrap(s))).toBe(3);\n    s = reducer(s, toggled(s.items[0].id));\n    expect(selectRemaining(wrap(s))).toBe(2);\n  });\n\n  // requirement 4 + 5 - filtering is a view, never a delete\n  test(\"filterChanged only changes the view: all items survive\", () => {\n    let s = run(added(\"a\"), added(\"b\"));\n    s = reducer(s, toggled(s.items[0].id));\n\n    s = reducer(s, filterChanged(\"done\"));\n    expect(selectFilter(wrap(s))).toBe(\"done\");\n    expect(selectVisible(wrap(s)).map((t) => t.text)).toEqual([\"a\"]);\n    expect(s.items.length).toBe(2);\n\n    s = reducer(s, filterChanged(\"active\"));\n    expect(selectVisible(wrap(s)).map((t) => t.text)).toEqual([\"b\"]);\n    expect(s.items.length).toBe(2);\n\n    s = reducer(s, filterChanged(\"all\"));\n    expect(selectVisible(wrap(s)).map((t) => t.text)).toEqual([\"a\", \"b\"]);\n    expect(s.items.length).toBe(2);\n  });\n\n  // requirement 4 - selectVisible under the all filter must hand back the\n  // real array, not a fresh copy: a new array every call re-renders forever\n  test(\"selectVisible returns the same array reference under the all filter\", () => {\n    const s = run(added(\"a\"));\n    expect(selectVisible(wrap(s))).toBe(s.items);\n  });\n});\n",
  "dependencies": {
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "@testing-library/react": "16.1.0",
    "@testing-library/dom": "10.4.0",
    "@reduxjs/toolkit": "2.5.0",
    "react-redux": "9.2.0"
  },
  "expect": "10 passed"
};

const SB_CAB: SandboxSpec = {
  "files": {
    "/CabContext.tsx": "import { createContext, useContext, useState } from \"react\";\nimport type { ReactNode } from \"react\";\nimport type { Cab } from \"./data\";\n\n/**\n * Cab Booking —— Context 这一层。\n *\n * 验收标准（测试逐条查，跟页面上那几条一一对应）：\n *\n * 1. Context 存两样东西：bookedCabDetails（当前预订的车，初始 null）、\n *    rideHistory（全部行程，初始 []）。\n * 2. updateBookedCabDetails(cab) 一次干两件事：设成当前预订 + 追加进历史。\n *    追加必须是不可变更新（造新数组），不许 push。\n * 3. useCabContext() 是自定义 hook，**没套 Provider 就抛错**，\n *    错误信息里要出现 CabProvider 这个词。\n *    不许给 createContext 一个假的默认值把错误静默兜住。\n *\n * 【为什么第 3 条要抛错】没有守卫的话，忘了套 Provider 时消费者会收到\n * undefined，然后在解构那一行报「Cannot destructure property of undefined」——\n * 报错指向消费者，而真正的原因在 index/App 那一层。守卫把原因摆在你脸上。\n */\n\nexport interface CabContextValue {\n  bookedCabDetails: Cab | null;\n  rideHistory: Cab[];\n  updateBookedCabDetails: (cab: Cab) => void;\n}\n\n// TODO: 造 Context。默认值给什么？想清楚第 3 条要求。\nconst CabContext = createContext<CabContextValue | undefined>(undefined);\n\nexport function CabProvider({ children }: { children: ReactNode }) {\n  // TODO: 两个 state —— 初值分别是什么？\n  const [bookedCabDetails, setBookedCabDetails] = useState<Cab | null>(null);\n  const [rideHistory, setRideHistory] = useState<Cab[]>([]);\n\n  // TODO: 第 2 条 —— 一次改两个 state，历史用不可变更新\n  const updateBookedCabDetails = (cab: Cab) => {\n    void cab;\n    void setBookedCabDetails;\n    void setRideHistory;\n  };\n\n  const value = { bookedCabDetails, rideHistory, updateBookedCabDetails };\n\n  return <CabContext.Provider value={value}>{children}</CabContext.Provider>;\n}\n\nexport function useCabContext(): CabContextValue {\n  // TODO: 读 context，并按第 3 条加守卫\n  const context = useContext(CabContext);\n  return context as CabContextValue;\n}\n",
    "/CabApp.tsx": "import { useState } from \"react\";\nimport type { Cab } from \"./data\";\nimport Home from \"./Home\";\nimport CabOptions from \"./CabOptions\";\nimport Loading from \"./Loading\";\nimport CabConfirmation from \"./CabConfirmation\";\nimport { useCabContext } from \"./CabContext\";\n\n/**\n * 四个页面的状态机。\n *\n * 验收标准：\n *\n * 4. 一个字符串 state 管四个页面：\"home\" / \"cab-options\" / \"loading\" /\n *    \"cab-confirmation\"，初始是 home。**不要用多个 boolean** ——\n *    那允许两个页面同时出现，getByTestId 找到多个会直接抛错。\n * 5. 点 book-button → cab-options。\n * 6. 点某张卡的 Select → 先把这辆车写进 Context，再进 loading。\n *    这两件事必须在同一个 handler 里，别拆给 CabCard 一半。\n * 7. Loading 完成 → cab-confirmation。\n * 8. 点 confirm-button → 回 home（此时首页的历史里能看到刚订的车）。\n */\nexport default function CabApp() {\n  const [currentPage, setCurrentPage] = useState(\"home\");\n  const { updateBookedCabDetails } = useCabContext();\n\n  // TODO: 第 6 条 —— 写 Context + 切页面\n  const handleSelectCab = (cab: Cab) => {\n    void cab;\n    void updateBookedCabDetails;\n  };\n\n  void currentPage;\n  void setCurrentPage;\n  void handleSelectCab;\n\n  return (\n    <div>\n      <h1>Cab Booking</h1>\n      {/* TODO: 四个页面，每个一行 currentPage === \"...\" && <某页 /> */}\n      {/* Home 要 onBookClick；CabOptions 要 onSelectCab；\n          Loading 要 onComplete；CabConfirmation 要 onConfirm */}\n      <Home onBookClick={() => {}} />\n    </div>\n  );\n}\n",
    "/RideHistory.tsx": "import { useCabContext } from \"./CabContext\";\n\n/**\n * 行程历史。\n *\n * 验收标准：\n *\n * 9.  只显示**最新三条**，而且**最新的排最上面**。\n *     提示：数组是「最旧 → 最新」的（新记录追加在尾部）。\n *     注意 reverse() 是原地修改 —— 直接对 state 调它会翻掉 state 本身。\n * 10. 有记录时：每条一个 <li data-testid=\"history-cabs\">，\n *     里面显示车名和 $价格（$ 不能省，测试查的是 \"$20\"）。\n * 11. 没记录时：<p data-testid=\"no-ride-title\">No ride history yet.</p>\n *     这两种情况**互斥** —— 用三元表达式，别两个都渲染。\n * 12. key 不能只用 ride.id —— 同一辆车可以被订两次。\n */\nexport default function RideHistory() {\n  const { rideHistory } = useCabContext();\n\n  // TODO: 第 9 条 —— 算出要显示的三条\n  const latestRides = rideHistory;\n\n  return (\n    <section>\n      <h3>Ride History</h3>\n      {/* TODO: 第 10 / 11 条 —— 三元表达式：有记录渲染 <ul>，没记录渲染空状态 */}\n      <ul>\n        {latestRides.map((ride) => (\n          <li key={ride.id}>{ride.name}</li>\n        ))}\n      </ul>\n    </section>\n  );\n}\n",
    "/Loading.tsx": "import { useEffect } from \"react\";\n\n/**\n * 加载页 —— 一秒之后自己跳走。\n *\n * 验收标准：\n *\n * 13. 页面上要有 data-testid=\"loading\"。\n * 14. 挂载 1000ms 后调一次 onComplete()。用 setTimeout，不是 setInterval。\n * 15. **effect 要有清理函数**：return () => clearTimeout(timer)。\n *     少了它，组件卸载之后定时器照样到期、照样调 onComplete ——\n *     用户明明已经离开了，页面还会自己往前跳。\n *     React 18 起不再警告「在已卸载组件上更新 state」，所以你不会收到任何提示。\n */\nexport default function Loading({ onComplete }: { onComplete: () => void }) {\n  // TODO: 第 14 / 15 条\n  useEffect(() => {\n    void onComplete;\n  }, [onComplete]);\n\n  return (\n    <main data-testid=\"loading\">\n      <h1>Loading...</h1>\n      <p>We are working on your cab booking. Thanks for your patience.</p>\n    </main>\n  );\n}\n",
    "/CabConfirmation.tsx": "import { useCabContext } from \"./CabContext\";\n\n/**\n * 确认页。\n *\n * 验收标准：\n *\n * 16. <p data-testid=\"confirm-message\"> 里显示\n *     「<车名> is on the way and will arrive shortly.」\n *     bookedCabDetails 初始是 null，所以读它的属性要用可选链 ?. ——\n *     少那个问号，单独渲染这个组件时会抛\n *     「Cannot read properties of null」，整棵树白屏。\n * 17. <button data-testid=\"confirm-button\"> 文字 Okay，点了调 onConfirm()。\n */\nexport default function CabConfirmation({ onConfirm }: { onConfirm: () => void }) {\n  const { bookedCabDetails } = useCabContext();\n\n  void bookedCabDetails;\n  void onConfirm;\n\n  return (\n    <main>\n      <h2>Cab Booked Successfully!</h2>\n      {/* TODO: 第 16 条 —— confirm-message */}\n      {/* TODO: 第 17 条 —— confirm-button */}\n    </main>\n  );\n}\n",
    "/App.tsx": "import { CabProvider } from \"./CabContext\";\nimport CabApp from \"./CabApp\";\n\n// 【这个文件已经写好了，不用改 —— 但它演示了这道题最容易死的地方。】\n//\n// Provider 必须包在 CabApp **外面**。\n// 因为 CabApp 自己就要用 Context 里的写入函数（选车时要写历史），\n// 而一个组件读不到自己 return 里提供的 Context —— useContext 往上找，不往下找。\n//\n// 下面的测试也是这么包的。那不是巧合，是它在告诉你 Provider 该在哪一层。\nexport default function App() {\n  return (\n    <div style={{ fontFamily: \"system-ui\", padding: 16, fontSize: 13 }}>\n      <CabProvider>\n        <CabApp />\n      </CabProvider>\n    </div>\n  );\n}\n",
    "/Home.tsx": "import RideHistory from \"./RideHistory\";\n\n// 【这个文件已经写好了，不用改。】\n// 注意 Home 自己不碰 Context —— 它只是把 RideHistory 放进来。\n// 历史数据从 Context 直接流进 RideHistory，不经过 Home。\nexport default function Home({ onBookClick }: { onBookClick: () => void }) {\n  return (\n    <main>\n      <h2>Book a Safe Ride with HackerRide</h2>\n      <button type=\"button\" data-testid=\"book-button\" onClick={onBookClick}>\n        Book a Cab\n      </button>\n      <RideHistory />\n    </main>\n  );\n}\n",
    "/CabOptions.tsx": "import type { Cab } from \"./data\";\nimport { cabData } from \"./data\";\nimport CabCard from \"./CabCard\";\n\n// 【这个文件已经写好了，不用改。】\n// 注意它没有 sort —— 分组顺序直接来自 data.ts 的键插入顺序。\nexport default function CabOptions({\n  onSelectCab,\n}: {\n  onSelectCab: (cab: Cab) => void;\n}) {\n  return (\n    <main>\n      <h2>Select your desired Car</h2>\n      <div data-testid=\"all-cabs-section\">\n        {Object.keys(cabData).map((type) => (\n          <section key={type}>\n            <h3 data-testid=\"car-type-heading\">{type}</h3>\n            {cabData[type].map((cab) => (\n              <CabCard key={cab.id} cab={cab} onSelectCab={onSelectCab} />\n            ))}\n          </section>\n        ))}\n      </div>\n    </main>\n  );\n}\n",
    "/CabCard.tsx": "import type { Cab } from \"./data\";\n\n// 【这个文件已经写好了，不用改。】\n// 五个 data-testid 都在这儿。照着它的写法就知道测试要什么。\nexport default function CabCard({\n  cab,\n  onSelectCab,\n}: {\n  cab: Cab;\n  onSelectCab: (cab: Cab) => void;\n}) {\n  return (\n    <article className=\"cab-card\">\n      <img src={cab.image} alt={cab.name} data-testid=\"cab-card-img\" />\n      <p data-testid=\"cab-card-name\">{cab.name}</p>\n      <p data-testid=\"cab-card-type\">Type: {cab.type}</p>\n      <p data-testid=\"cab-card-price\">Fare: ${cab.price}</p>\n      <button\n        type=\"button\"\n        data-testid=\"cab-card-select-button\"\n        onClick={() => onSelectCab(cab)}\n      >\n        Select\n      </button>\n    </article>\n  );\n}\n",
    "/data.ts": "// 六辆车，三个类型。源项目是 src/data/data.json，这里改成 .ts 只为省一次 JSON import。\n// 图片换成内联 data URI —— 源项目用的是 /cabs/*.svg 静态文件，沙箱里没有 public 目录。\nexport interface Cab {\n  id: string;\n  name: string;\n  type: string;\n  price: number;\n  image: string;\n}\n\nconst box = (fill: string) =>\n  \"data:image/svg+xml;utf8,\" +\n  encodeURIComponent(\n    `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"72\" height=\"44\"><rect width=\"72\" height=\"44\" rx=\"6\" fill=\"${fill}\"/></svg>`,\n  );\n\n// 【顺序有意义】测试断言的分组顺序就是这里的键顺序：Sedan → SUV → Luxury。\nexport const cabData: Record<string, Cab[]> = {\n  Sedan: [\n    { id: \"sedan-1\", name: \"Ford Fusion\", type: \"Sedan\", price: 20, image: box(\"#9db4d0\") },\n    { id: \"sedan-2\", name: \"Honda Accord\", type: \"Sedan\", price: 24, image: box(\"#a8c3b0\") },\n  ],\n  SUV: [\n    { id: \"suv-1\", name: \"Toyota Highlander\", type: \"SUV\", price: 32, image: box(\"#c8b6a6\") },\n    { id: \"suv-2\", name: \"Ford Explorer\", type: \"SUV\", price: 36, image: box(\"#b9a7c0\") },\n  ],\n  Luxury: [\n    { id: \"luxury-1\", name: \"Mercedes E-Class\", type: \"Luxury\", price: 55, image: box(\"#d0c08a\") },\n    { id: \"luxury-2\", name: \"BMW 5 Series\", type: \"Luxury\", price: 60, image: box(\"#8fb0b8\") },\n  ],\n};\n"
  },
  "tests": "// Test names are in English on purpose.\n//\n// Sandpack's test runner decodes the source snippet it prints under a failed\n// assertion as Latin-1, so any non-ASCII byte in THIS file comes out as mojibake\n// exactly when you need to read it. The real assessment's tests are in English\n// anyway, so this is closer to the thing you are training for.\n// The Chinese wording of every requirement is in the starter files' headers.\n//\n// Two facts about time in this runner, both measured the hard way:\n//   1. There is no fake timer, so the 1000ms Loading delay really is waited out.\n//      Expect this file to take a handful of seconds. That is not a hang.\n//   2. There is a hard 5000ms budget per test and no way to raise it, and a test\n//      that blows it also wrecks the tests after it. So the four-booking history\n//      rule is driven through the context directly instead of through four\n//      trips across the loading page (that would need 4000ms+ of real waiting).\n\nimport { act, fireEvent, render, screen } from \"@testing-library/react\";\nimport App from \"./App\";\nimport CabApp from \"./CabApp\";\nimport Loading from \"./Loading\";\nimport RideHistory from \"./RideHistory\";\nimport { CabProvider, useCabContext } from \"./CabContext\";\nimport { cabData } from \"./data\";\n\nconst wrapped = () => (\n  <CabProvider>\n    <CabApp />\n  </CabProvider>\n);\n\n/** Let real time pass and let React flush whatever the timer produced. */\nconst settle = (ms) => act(() => new Promise((r) => setTimeout(r, ms)));\n\n/** Poll until pred() holds or the wall-clock budget runs out. */\nasync function until(pred, budget) {\n  if (pred()) return true;\n  const t0 = Date.now();\n  while (Date.now() - t0 < budget) {\n    await settle(120);\n    if (pred()) return true;\n  }\n  return pred();\n}\n\nconst flat = [...cabData.Sedan, ...cabData.SUV, ...cabData.Luxury];\n\ndescribe(\"CabContext\", () => {\n  // requirement 3 - the guard\n  test(\"useCabContext throws when used outside a CabProvider\", () => {\n    const Consumer = () => {\n      useCabContext();\n      return null;\n    };\n    const realError = console.error;\n    console.error = () => {};\n    let message = \"\";\n    try {\n      render(<Consumer />);\n    } catch (err) {\n      message = String((err && err.message) || err);\n    }\n    console.error = realError;\n    expect(message).toContain(\"CabProvider\");\n  });\n\n  // requirement 1 + 2 - one call sets the current cab AND appends to history\n  test(\"updateBookedCabDetails sets the current cab and appends to the history\", () => {\n    let ctx = null;\n    const Probe = () => {\n      ctx = useCabContext();\n      return null;\n    };\n    render(\n      <CabProvider>\n        <Probe />\n      </CabProvider>,\n    );\n\n    expect(ctx.bookedCabDetails).toBe(null);\n    expect(ctx.rideHistory).toEqual([]);\n\n    act(() => {\n      ctx.updateBookedCabDetails(flat[0]);\n    });\n    expect(ctx.bookedCabDetails.name).toBe(\"Ford Fusion\");\n    expect(ctx.rideHistory.length).toBe(1);\n\n    act(() => {\n      ctx.updateBookedCabDetails(flat[1]);\n    });\n    expect(ctx.bookedCabDetails.name).toBe(\"Honda Accord\");\n    expect(ctx.rideHistory.map((r) => r.name)).toEqual([\n      \"Ford Fusion\",\n      \"Honda Accord\",\n    ]);\n  });\n});\n\ndescribe(\"RideHistory\", () => {\n  // requirement 11 - the empty state\n  test(\"shows the empty state and no rows before anything is booked\", () => {\n    render(\n      <CabProvider>\n        <RideHistory />\n      </CabProvider>,\n    );\n    expect(screen.getByTestId(\"no-ride-title\").textContent).toBe(\n      \"No ride history yet.\",\n    );\n    expect(screen.queryAllByTestId(\"history-cabs\").length).toBe(0);\n  });\n\n  // requirements 9 + 10 + 11 - the whole point of this problem.\n  // Driven through the context so there is no waiting: four bookings through\n  // the UI would need four real seconds and blow the per-test budget.\n  test(\"keeps only the newest three rides, newest first\", () => {\n    let ctx = null;\n    const Probe = () => {\n      ctx = useCabContext();\n      return null;\n    };\n    render(\n      <CabProvider>\n        <Probe />\n        <RideHistory />\n      </CabProvider>,\n    );\n\n    // One act() per booking, so a render happens in between. That matters:\n    // reversing the state array in place only corrupts the order once a render\n    // has read it, which is exactly the bug this test is here to catch.\n    [0, 1, 2, 3].forEach((i) => {\n      act(() => {\n        ctx.updateBookedCabDetails(flat[i]);\n      });\n    });\n\n    const rows = screen.getAllByTestId(\"history-cabs\");\n    expect(rows.length).toBe(3);\n    expect(rows[0].textContent).toContain(\"Ford Explorer\");\n    expect(rows[1].textContent).toContain(\"Toyota Highlander\");\n    expect(rows[2].textContent).toContain(\"Honda Accord\");\n    // The oldest one must be gone from the DOM, not merely hidden.\n    expect(screen.queryByText(/Ford Fusion/)).toBe(null);\n    // The empty state and the rows are mutually exclusive.\n    expect(screen.queryByTestId(\"no-ride-title\")).toBe(null);\n    // requirement 10 - the price carries a dollar sign\n    expect(rows[0].textContent).toContain(\"$36\");\n  });\n});\n\ndescribe(\"Loading\", () => {\n  // requirement 14\n  test(\"calls onComplete after about a second\", async () => {\n    let calls = 0;\n    render(<Loading onComplete={() => { calls += 1; }} />);\n    expect(screen.getByTestId(\"loading\")).toBeTruthy();\n    expect(calls).toBe(0);\n    expect(await until(() => calls === 1, 2600)).toBe(true);\n  });\n\n  // requirement 15 - the cleanup function\n  test(\"does not fire after it unmounts\", async () => {\n    let calls = 0;\n    const view = render(<Loading onComplete={() => { calls += 1; }} />);\n    view.unmount();\n    await settle(1500);\n    expect(calls).toBe(0);\n  });\n});\n\ndescribe(\"CabApp\", () => {\n  // requirement 4 + 5\n  test(\"starts on the home page and opens the cab list on Book a Cab\", () => {\n    render(wrapped());\n    expect(screen.getByTestId(\"book-button\")).toBeTruthy();\n    expect(screen.queryByTestId(\"all-cabs-section\")).toBe(null);\n\n    fireEvent.click(screen.getByTestId(\"book-button\"));\n\n    expect(screen.getByTestId(\"all-cabs-section\")).toBeTruthy();\n    expect(\n      screen.getAllByTestId(\"car-type-heading\").map((n) => n.textContent),\n    ).toEqual([\"Sedan\", \"SUV\", \"Luxury\"]);\n    expect(screen.getAllByTestId(\"cab-card-select-button\").length).toBe(6);\n    // Only one page at a time - the home page must be gone.\n    expect(screen.queryByTestId(\"book-button\")).toBe(null);\n  });\n\n  // requirements 6 + 7 + 16 - the full flow, one real second of waiting\n  test(\"selecting a cab goes through loading to the confirmation page\", async () => {\n    render(wrapped());\n    fireEvent.click(screen.getByTestId(\"book-button\"));\n    fireEvent.click(screen.getAllByTestId(\"cab-card-select-button\")[0]);\n\n    expect(screen.getByTestId(\"loading\")).toBeTruthy();\n\n    expect(\n      await until(() => screen.queryByTestId(\"confirm-message\") !== null, 2600),\n    ).toBe(true);\n    expect(screen.getByTestId(\"confirm-message\").textContent).toBe(\n      \"Ford Fusion is on the way and will arrive shortly.\",\n    );\n    expect(screen.queryByTestId(\"loading\")).toBe(null);\n  });\n\n  // requirement 8 - confirming returns home and the ride is in the history\n  test(\"confirming returns home with the ride in the history\", async () => {\n    render(wrapped());\n    fireEvent.click(screen.getByTestId(\"book-button\"));\n    fireEvent.click(screen.getAllByTestId(\"cab-card-select-button\")[2]);\n\n    expect(\n      await until(() => screen.queryByTestId(\"confirm-button\") !== null, 2600),\n    ).toBe(true);\n    fireEvent.click(screen.getByTestId(\"confirm-button\"));\n\n    expect(screen.getByTestId(\"book-button\")).toBeTruthy();\n    const rows = screen.getAllByTestId(\"history-cabs\");\n    expect(rows.length).toBe(1);\n    expect(rows[0].textContent).toContain(\"Toyota Highlander\");\n    expect(rows[0].textContent).toContain(\"$32\");\n  });\n});\n\ndescribe(\"App\", () => {\n  // The Provider layering: App must wrap CabApp, so rendering App alone works.\n  test(\"App renders without a Provider of its own\", () => {\n    render(<App />);\n    expect(screen.getByTestId(\"book-button\")).toBeTruthy();\n    expect(screen.getByTestId(\"no-ride-title\")).toBeTruthy();\n  });\n});\n",
  "dependencies": {
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "@testing-library/react": "16.1.0",
    "@testing-library/dom": "10.4.0"
  },
  "expect": "10 passed",
  "activeFile": "/CabContext.tsx",
  "blankKeep": [
    "/data.ts",
    "/CabCard.tsx",
    "/CabOptions.tsx",
    "/Home.tsx",
    "/App.tsx"
  ]
};

const SPECS: Spec[] = [
  /* ---- 五道变式题（react-part5，参考解法实测 36 / 36） ---- */
  {
    id: "todo-list",
    title: "Todo List",
    track: "react",
    difficulty: 1,
    minutes: 25,
    from: "r-var-todo-write",
    explain: "r-var-todo",
    runnable: true,
    sandbox: SB_TODO,
    // 沙箱里的测试查的是整道题，来源练习只是其中一块 —— 所以显式写全。
    requirements: [
      "输入框为空或只有空格时，Add 按钮 disabled",
      "提交后清空输入框，新条目追加到末尾",
      "勾选切换单条的 done —— map + 对象展开，不改原对象",
      "Delete 用 filter 删掉单条，不许 splice",
      "visible / remaining / allDone 三个都是派生数据，不许再开 state",
      "筛选 all / active / done 只影响显示，切回 all 时所有条目都还在",
      "Check all / Uncheck all 按「当前是否已全部完成」整体反转",
      "Clear completed 只删已完成的",
    ],
  },
  {
    id: "timer",
    title: "计时器（useEffect 清理函数）",
    track: "react",
    difficulty: 2,
    minutes: 25,
    from: "r-var-timer-write",
    explain: "r-var-timer",
    runnable: true,
    sandbox: SB_TIMER,
    // 沙箱里的测试查的是整道题，来源练习只是其中一块 —— 所以显式写全。
    requirements: [
      "显示 format(seconds)，初始 00:00；按钮在 Start / Pause 之间切",
      "跑起来每秒 +1",
      "必须用函数式更新 setSeconds(s => s + 1) —— 否则过期闭包会让秒数卡在 1",
      "effect 必须返回 clearInterval 的清理函数：否则重启会叠 interval、卸载后还在跑",
      "没在跑的时候不该有定时器",
      "Reset 归零并且停下",
    ],
  },
  {
    id: "fetch-user",
    title: "fetch 取数：loading、error 与竞态",
    track: "react",
    difficulty: 3,
    minutes: 35,
    from: "r-var-fetch-write",
    explain: "r-var-fetch",
    runnable: true,
    // 沙箱里的测试查的是整道题，来源练习只是其中一块 —— 所以显式写全。
    requirements: [
      "三态：loading / error / 成功显示 name 与 email",
      "fetch 只在网络层失败时 reject —— 404 / 500 要自己查 res.ok，错误文案带 HTTP 和状态码",
      "userId 变了要重新取，并且先回到 loading，不留上一个人的数据在屏幕上",
      "竞态：旧请求晚回来不许覆盖新数据（effect 里立 ignore 开关，清理函数置 true）",
      "切 userId / 卸载时用 AbortController 掐掉在飞的请求；AbortError 不是错误，不给用户看",
    ],
  },
  {
    id: "comment-tree",
    title: "递归评论树 + 树形不可变更新",
    track: "react",
    difficulty: 3,
    minutes: 35,
    from: "r-var-tree-write",
    explain: "r-var-comment-tree",
    runnable: true,
    sandbox: SB_COMMENTTREE,
    // 沙箱里那 8 条测试查的是整道题，不只是来源练习的那一块。
    requirements: [
      "countComments 递归数出总条数 —— 不是 nodes.length（那只数了顶层）",
      "maxDepth 返回最深那条路径的层数，空数组是 0",
      "addReply 找到 id === parentId 的节点，把 reply 追加到它的 replies 末尾",
      "目标可能在任意深度，需要递归往下找；顶层的也要能加",
      "返回全新的树，原树一个字节都不能改 —— 测试会深冻结它，改了直接抛",
      "parentId 不存在时树的内容不变",
      "同一个 parent 连加两条，按加入顺序排在后面",
      "不许 push / splice / 直接赋值，也不许 JSON.parse(JSON.stringify(...)) 深拷贝",
    ],
  },
  {
    id: "theme-context",
    title: "主题切换（Context + value 记忆化）",
    track: "react",
    difficulty: 2,
    minutes: 30,
    from: "r-var-theme-write",
    explain: "r-var-theme-context",
    runnable: true,
    sandbox: SB_THEME,
    // 沙箱里的测试查的是整道题，来源练习只是其中一块 —— 所以显式写全。
    requirements: [
      "默认 light：卡片显示 light，按钮文字是 Switch to Dark；切到 dark 后变 Switch to Light",
      "卡片底色跟着主题走 —— light → #fff，dark → #222",
      "同一个 Provider 下的多个消费者一起变（这才是 Context 的意义）",
      "没套 Provider 就调 useTheme() 必须立刻抛错，信息里要出现 ThemeProvider",
      "toggleTheme 引用稳定：theme 变了它也不变（useCallback）",
      "theme 没变时 context value 不换新对象（useMemo）",
      "一次事件里连调两次 toggleTheme 要回到原点 —— 必须用函数式更新",
    ],
  },

  /* ---- 七道补缺题（iv-coding，实测 24 / 24，RTK 那道 8 / 8） ---- */
  {
    id: "star-rating",
    title: "星级评分（hover 预览 + 受控双模式）",
    track: "react",
    difficulty: 2,
    minutes: 25,
    from: "iv-coding-stars-write",
    explain: "iv-coding-widgets",
    runnable: true,
    sandbox: SB_STARS,
    // 沙箱里的测试查的是整道题，来源练习只是其中一块 —— 所以显式写全。
    requirements: [
      "hover 到第 n 颗时前 n 颗显示为亮 —— 这只是预览，不改已选值",
      "鼠标移出整个组件后回到已选值",
      "点第 n 颗设为 n 分；再点同一颗清零",
      "每颗星是 button，aria-label 是 `${n} star`，aria-pressed 标出选中那颗",
      "只有两个 state（已选值 + hover），要显示几颗亮是派生的",
      "传了 value 就是受控：内部不留自己的值，点击只调 onChange",
      "max 决定画几颗星",
    ],
  },
  {
    id: "use-local-storage",
    title: "写一个自定义 hook：useLocalStorage",
    track: "react",
    difficulty: 2,
    minutes: 25,
    from: "iv-coding-hook-write",
    explain: "iv-coding-ref-hook",
    runnable: true,
    sandbox: SB_ULS,
    // 沙箱里的测试查的是整道题，来源练习只是其中一块 —— 所以显式写全。
    requirements: [
      "名字必须 use 开头 —— ESLint 靠这个前缀才会检查 hooks 规则",
      "惰性初始化：读 localStorage 只在首次渲染做一次，不是每次渲染都读",
      "key 不存在时用 initial",
      "存的是 JSON，取出来 JSON.parse —— 对象和数组要能原样回来",
      "脏数据 parse 不了、或隐私模式下 setItem 抛错，都要吞掉，不许让组件炸",
      "值变了写回 localStorage",
      "返回 [value, setValue] 元组，setValue 支持函数式更新",
    ],
  },
  {
    id: "kanban",
    title: "Kanban 看板：一次改两个数组",
    track: "react",
    difficulty: 3,
    minutes: 40,
    from: "iv-coding-kanban-write",
    explain: "iv-coding-kanban",
    runnable: true,
    sandbox: SB_KANBAN,
  },
  {
    id: "tabs",
    title: "Tabs 组件（只用一个 state）",
    track: "react",
    difficulty: 1,
    minutes: 20,
    from: "iv-coding-stars-write",
    explain: "iv-coding-widgets",
    runnable: true,
    brief:
      "实现一个 Tabs：点标签切换面板。只允许用一个 state 记「哪个是激活的」，当前面板和高亮全部派生出来。ARIA 三件套（tablist / tab + aria-selected / tabpanel）不能漏。",
    sandbox: SB_TABS,
  },
  {
    id: "player",
    title: "播放器（useRef 操作 DOM）",
    track: "react",
    difficulty: 2,
    minutes: 25,
    from: "iv-coding-hook-write",
    explain: "iv-coding-ref-hook",
    runnable: true,
    brief:
      "用 useRef 拿到 <audio> 节点，实现播放 / 暂停 / 停止。play() 返回 Promise 且可能被浏览器策略拒绝；currentTime 直接改 DOM 不经过 state；播完要靠 onEnded 把 state 同步回来。",
    // 沙箱里的测试查的是整道题，来源练习只是其中一块 —— 所以显式写全。
    requirements: [
      "用 useRef 拿到 <audio> 节点，点按钮调它的 play() / pause()",
      "按钮文字随播放状态切换 Play / Pause",
      "Stop 要 pause()、把 currentTime 归零、状态回到 Play —— currentTime 直接改 DOM，不经过 state",
      "play() 可能被浏览器自动播放策略拒绝，被拒绝时不许把状态改成「正在播」",
      "播完靠 onEnded 把状态同步回 Play",
      "进度靠 onTimeUpdate 同步到界面（显示整秒）",
    ],
  },
  {
    id: "dropdown",
    title: "Dropdown：点外面要关掉",
    track: "react",
    difficulty: 2,
    minutes: 25,
    from: "iv-coding-dropdown-blank",
    explain: "iv-coding-widgets",
    runnable: true,
    sandbox: SB_DROPDOWN,
    // 沙箱里的测试查的是整道题，来源练习只是其中一块 —— 所以显式写全。
    requirements: [
      "点触发器展开，选中后收起并把触发器文字换成选中项的 label",
      "点组件外面任何地方都要关掉；点组件内部不能关（useRef + node.contains）",
      "按 Escape 关闭，别的键不关",
      "卸载时必须解绑 document 上的监听器；没展开时不该挂监听器",
      "触发器 aria-haspopup=\"listbox\" + aria-expanded；列表 role=\"listbox\"，每项 role=\"option\" + aria-selected",
    ],
  },
  {
    id: "rtk-todo",
    title: "Redux Toolkit 版 Todo",
    track: "react",
    difficulty: 3,
    minutes: 40,
    from: "iv-coding-rtk-blank",
    explain: "iv-coding-rtk",
    runnable: true,
    sandbox: SB_RTK,
    // 沙箱里的测试查的是整道题，来源练习只是其中一块 —— 所以显式写全。
    requirements: [
      "用 createSlice 写出 added / toggled / removed / clearedDone / filterChanged",
      "id 在 prepare 里生成，不在 reducer 里 —— reducer 必须纯，同一个 action 跑两次结果要一样",
      "Immer 给的是草稿代理，但传进来的 state 对象本身不能被改动（测试用冻结的 state 验）",
      "派生数据用 selector：selectVisible / selectRemaining / selectFilter",
      "筛选不能改底层数据 —— 切回 all 时全部条目都还在",
      "reducer 要能脱离 React 单独测（所以这道题的测试里一行 render 都没有）",
    ],
  },

  /* ---- 真实 assessment 的两道大题 ---- */
  {
    id: "cab-booking-app",
    title: "Cab Booking（Context 版）",
    track: "react",
    difficulty: 3,
    minutes: 45,
    // 需求在下面显式列全 —— 沙箱只覆盖五个要自己写的文件，
    // 而 cb-from-scratch 是整个应用（含 CabOptions / CabCard / data.json）。
    from: "cb-from-scratch",
    explain: "cb-provider-layer",
    runnable: true,
    brief:
      "一个四页面的打车应用。给定数据、卡片和选车页，要你写的是 Context 那一层加三个页面：" +
      "Context 存「当前预订」和「行程历史」，一个 action 同时改两个 state，" +
      "四个页面用一个字符串状态机切换，历史只留最新三条且最新在最上。",
    requirements: [
      "Context 存两样：bookedCabDetails（当前预订，初始 null）、rideHistory（全部行程，初始 []）",
      "updateBookedCabDetails(cab) 一次干两件事：设成当前预订 + 追加进历史。追加要造新数组，不许 push",
      "useCabContext() 自定义 hook 带守卫：没套 Provider 就抛错，信息里要有 CabProvider。不许给 createContext 假默认值把错误兜住",
      "一个字符串 state 管四个页面（home / cab-options / loading / cab-confirmation），初始 home。不要用多个 boolean",
      "点 book-button → cab-options；此时首页必须消失（一次只显示一个页面）",
      "点某张卡的 Select → 先写 Context 再进 loading，两件事在同一个 handler 里",
      "Loading 挂载 1000ms 后调 onComplete；用 setTimeout 不是 setInterval",
      "Loading 的 effect 必须有清理函数 —— 卸载后不许再调 onComplete",
      "确认页 confirm-message 显示「<车名> is on the way and will arrive shortly.」，bookedCabDetails 初始为 null 所以要用 ?.",
      "点 confirm-button 回首页，此时历史里能看到刚订的车",
      "历史只显示最新三条、最新的排最上面；reverse() 原地修改，别翻到 state 上",
      "有记录时每条一个 <li data-testid=\"history-cabs\">（含车名和 $价格）；没记录时只显示 <p data-testid=\"no-ride-title\">No ride history yet.</p>，两者互斥",
    ],
    solution: [
    tested("tsx", "import { createContext, useContext, useState } from \"react\";\nimport type { ReactNode } from \"react\";\nimport type { Cab } from \"./data\";\n\nexport interface CabContextValue {\n  bookedCabDetails: Cab | null;\n  rideHistory: Cab[];\n  updateBookedCabDetails: (cab: Cab) => void;\n}\n\nconst CabContext = createContext<CabContextValue | undefined>(undefined);\n\nexport function CabProvider({ children }: { children: ReactNode }) {\n  const [bookedCabDetails, setBookedCabDetails] = useState<Cab | null>(null);\n  const [rideHistory, setRideHistory] = useState<Cab[]>([]);\n\n  const updateBookedCabDetails = (cab: Cab) => {\n    setBookedCabDetails(cab);\n    setRideHistory((prev) => [...prev, cab]);\n  };\n\n  const value = { bookedCabDetails, rideHistory, updateBookedCabDetails };\n\n  return <CabContext.Provider value={value}>{children}</CabContext.Provider>;\n}\n\nexport function useCabContext(): CabContextValue {\n  const context = useContext(CabContext);\n\n  if (!context) {\n    throw new Error(\"useCabContext must be used within a CabProvider\");\n  }\n\n  return context;\n}\n", {
      filename: "/CabContext.tsx",
    }),
    tested("tsx", "import { useState } from \"react\";\nimport type { Cab } from \"./data\";\nimport Home from \"./Home\";\nimport CabOptions from \"./CabOptions\";\nimport Loading from \"./Loading\";\nimport CabConfirmation from \"./CabConfirmation\";\nimport { useCabContext } from \"./CabContext\";\n\nexport default function CabApp() {\n  const [currentPage, setCurrentPage] = useState(\"home\");\n  const { updateBookedCabDetails } = useCabContext();\n\n  const handleSelectCab = (cab: Cab) => {\n    updateBookedCabDetails(cab);\n    setCurrentPage(\"loading\");\n  };\n\n  return (\n    <div>\n      <h1>Cab Booking</h1>\n\n      {currentPage === \"home\" && (\n        <Home onBookClick={() => setCurrentPage(\"cab-options\")} />\n      )}\n\n      {currentPage === \"cab-options\" && <CabOptions onSelectCab={handleSelectCab} />}\n\n      {currentPage === \"loading\" && (\n        <Loading onComplete={() => setCurrentPage(\"cab-confirmation\")} />\n      )}\n\n      {currentPage === \"cab-confirmation\" && (\n        <CabConfirmation onConfirm={() => setCurrentPage(\"home\")} />\n      )}\n    </div>\n  );\n}\n", {
      filename: "/CabApp.tsx",
    }),
    tested("tsx", "import { useCabContext } from \"./CabContext\";\n\nexport default function RideHistory() {\n  const { rideHistory } = useCabContext();\n  const latestRides = rideHistory.slice(-3).reverse();\n\n  return (\n    <section>\n      <h3>Ride History</h3>\n      {latestRides.length > 0 ? (\n        <ul>\n          {latestRides.map((ride, index) => (\n            <li key={`${ride.id}-${index}`} data-testid=\"history-cabs\">\n              <span>{ride.name}</span>\n              <strong>${ride.price}</strong>\n            </li>\n          ))}\n        </ul>\n      ) : (\n        <p data-testid=\"no-ride-title\">No ride history yet.</p>\n      )}\n    </section>\n  );\n}\n", {
      filename: "/RideHistory.tsx",
    }),
    tested("tsx", "import { useEffect } from \"react\";\n\nexport default function Loading({ onComplete }: { onComplete: () => void }) {\n  useEffect(() => {\n    const timer = setTimeout(() => {\n      if (onComplete) onComplete();\n    }, 1000);\n\n    return () => clearTimeout(timer);\n  }, [onComplete]);\n\n  return (\n    <main data-testid=\"loading\">\n      <h1>Loading...</h1>\n      <p>We are working on your cab booking. Thanks for your patience.</p>\n    </main>\n  );\n}\n", {
      filename: "/Loading.tsx",
    }),
    tested("tsx", "import { useCabContext } from \"./CabContext\";\n\nexport default function CabConfirmation({ onConfirm }: { onConfirm: () => void }) {\n  const { bookedCabDetails } = useCabContext();\n\n  return (\n    <main>\n      <h2>Cab Booked Successfully!</h2>\n      <p data-testid=\"confirm-message\">\n        {bookedCabDetails?.name} is on the way and will arrive shortly.\n      </p>\n      <button type=\"button\" data-testid=\"confirm-button\" onClick={onConfirm}>\n        Okay\n      </button>\n    </main>\n  );\n}\n", {
      filename: "/CabConfirmation.tsx",
    }),
    ],
    sandbox: SB_CAB,
  },
  {
    id: "notes-manager",
    title: "Notes Manager 增删改（React 考试 Q1）",
    track: "react",
    difficulty: 3,
    minutes: 60,
    from: "r-rebuild-q1",
    explain: "r-task1-add",
    runnable: true,
    sandbox: SB_NOTES,
    // 来源练习（考场版）说的是「让下面那四个测试全过」—— 那是源项目自己的
    // 四个测试。沙箱这边把它扩到八条（多查了「追加到末尾」、「提交后清空」、
    // 「原地替换不挪位」、「切换编辑对象要重载表单」），所以题面要自己写，
    // 不能沿用练习里那句，否则页面上「四个」和面板里「8 passed」对不上。
    brief:
      "在下面的工作区里实现 Notes Manager 的增删改，让八个测试全过。两个文件要自己写：NoteManager.tsx（数据和三个 handler）和 NoteForm.tsx（受控输入、校验、编辑态同步）。types.ts / NoteItem.tsx / NoteTable.tsx 给定，不用改。想练「连项目一起从零搭」，去考场那一版。",
    // 沙箱查的是整道题（八条），来源练习只是其中一块 —— 所以显式写全。
    requirements: [
      "两个框都得有真实内容才能提交 —— 只有空格不算，按钮 disabled",
      "新增追加到末尾，不是插到开头",
      "提交成功后两个框都清空",
      "Delete 只删你点的那一条 —— 用 filter，不许 splice",
      "点 Edit 把那条载进表单，按钮文字变成 Update",
      "编辑是原地替换 —— 位置不变、总数不变（「先删再加」会把它挪到末尾）",
      "更新完表单清空，按钮变回 Add",
      "连着点两条的 Edit，表单要跟着换 —— 查 effect 的依赖写对没有",
    ],
  },
  {
    id: "run-tasks",
    title: "带并发上限的异步任务调度器（Q2）",
    track: "js",
    difficulty: 3,
    minutes: 45,
    from: "r-rebuild-q2",
    explain: "r-q2-implement",
    runnable: true,
    sandbox: SB_RUNTASKS,
  },

  /* ---- 手写题（面试 · 第 8 部分，DrillLab 自出，8 道全带沙箱）---- */
  {
    id: "hand-debounce",
    title: "手写 debounce（带 cancel）",
    track: "js",
    difficulty: 1,
    minutes: 15,
    from: "hd-debounce-write",
    explain: "iv-hand-timing",
    runnable: true,
    sandbox: SB_HAND_DEBOUNCE,
  },
  {
    id: "hand-throttle",
    title: "手写 throttle（leading + trailing）",
    track: "js",
    difficulty: 2,
    minutes: 20,
    from: "hd-throttle-write",
    explain: "iv-hand-timing",
    runnable: true,
    sandbox: SB_HAND_THROTTLE,
  },
  {
    id: "hand-deep-clone",
    title: "手写 deepClone（防循环）",
    track: "js",
    difficulty: 2,
    minutes: 25,
    from: "hd-clone-write",
    explain: "iv-hand-data",
    runnable: true,
    sandbox: SB_HAND_DEEPCLONE,
  },
  {
    id: "hand-flatten",
    title: "手写 flatten（depth 语义对齐原生）",
    track: "js",
    difficulty: 1,
    minutes: 15,
    from: "hd-flatten-write",
    explain: "iv-hand-data",
    runnable: true,
    sandbox: SB_HAND_FLATTEN,
  },
  {
    id: "hand-curry",
    title: "手写 curry（部分应用可复用）",
    track: "js",
    difficulty: 1,
    minutes: 15,
    from: "hd-curry-write",
    explain: "iv-hand-data",
    runnable: true,
    sandbox: SB_HAND_CURRY,
  },
  {
    id: "hand-promise-all",
    title: "手写 Promise.all + allSettled",
    track: "js",
    difficulty: 2,
    minutes: 25,
    from: "hd-pall-write",
    explain: "iv-hand-async",
    runnable: true,
    sandbox: SB_HAND_PROMISEALL,
  },
  {
    id: "hand-event-emitter",
    title: "手写 EventEmitter（on/off/once/emit）",
    track: "js",
    difficulty: 2,
    minutes: 20,
    from: "hd-emitter-write",
    explain: "iv-hand-async",
    runnable: true,
    sandbox: SB_HAND_EMITTER,
  },
  {
    id: "hand-lru",
    title: "手写 LRUCache（用 Map 的插入序）",
    track: "js",
    difficulty: 2,
    minutes: 20,
    from: "hd-lru-write",
    explain: "iv-hand-async",
    runnable: true,
    sandbox: SB_HAND_LRU,
  },

  /* ---- 不可运行：需要真的起服务 / JVM ---- */
  {
    id: "orders-subgraph",
    title: "Orders subgraph：四个 resolver + DataLoader",
    track: "graphql",
    difficulty: 3,
    minutes: 90,
    from: "g-rebuild-subgraph",
    explain: "g-read-task1",
    runnable: false,
    commands: [
      { cmd: "npm test", expect: "10 passed" },
      { cmd: "npm start", expect: "服务起在 4000，_service 能返回 SDL" },
    ],
  },
  {
    id: "spring-endpoints",
    title: "六个 Spring Boot REST 端点",
    track: "java",
    difficulty: 3,
    minutes: 75,
    from: "g-rebuild-controller",
    explain: "g-endpoints",
    runnable: false,
    commands: [
      { cmd: "mvn test", expect: "Tests run: 5, Failures: 0" },
      { cmd: "mvn spring-boot:run", expect: "BUILD SUCCESS，服务起在 8080" },
    ],
  },
];

/* ---------- 从练习派生题面、需求、答案 ---------- */

function findExercise(id: string): { ex: Exercise; examId: string } | undefined {
  for (const exam of EXAMS) {
    for (const mod of exam.modules) {
      for (const lesson of mod.lessons) {
        for (const ex of lesson.exercises ?? []) {
          if (ex.id === id) return { ex, examId: exam.id };
        }
      }
    }
  }
  return undefined;
}

function lessonExists(lessonId: string): boolean {
  for (const exam of EXAMS)
    for (const mod of exam.modules)
      for (const lesson of mod.lessons) if (lesson.id === lessonId) return true;
  return false;
}

function build(): CodingProblem[] {
  return SPECS.map((spec) => {
    // explain 只有 SELF_BRIEF 和 fill-blank 两条分支会真去读它取参考答案，
    // 其余分支从来源练习派生，于是一个写错的 lessonId 一路溜到线上：
    // 页面不报错，只是「展开讲解」整块静默消失。orders-subgraph 和
    // spring-endpoints 就这么坏了一阵，所以这里显式查一次。
    if (!lessonExists(spec.explain)) {
      throw new Error(
        `[coding] ${spec.id} 的讲解引用 ${spec.explain} 找不到对应课文。` +
          `「展开讲解」会静默消失，不会报错，所以必须在这里拦住。`,
      );
    }
    const found = findExercise(spec.from);
    if (!found) {
      throw new Error(
        `[coding] ${spec.id} 的来源练习 ${spec.from} 找不到。` +
          `题面和参考答案是从练习派生的，来源不存在就没东西可派生。`,
      );
    }
    const { ex } = found;

    // 需求和答案的形状按练习类型取
    let requirements: string[] = [];
    let solution: CodingProblem["solution"] = [];

    // 显式覆盖优先于一切派生 —— 见 Spec.requirements 的注释。
    // 【顺序很重要】SELF_BRIEF 必须排在最前面。
    // 这里踩过一次：Tabs 和播放器都挂在一个 code-completion 练习上
    // （tabs → iv-coding-stars-write，player → iv-coding-hook-write），
    // 原来 code-completion 那条分支排在前面，于是它们自带的需求列表从来没生效过 ——
    // 页面上 Tabs 那道显示的是**星级评分**的验收标准（hover 第 n 颗、点第 n 颗设为 n 分）。
    // 自带题面的题就是「不从来源练习派生需求」的意思，所以它得先判。
    if (SELF_BRIEF.has(spec.id)) {
      requirements = REQUIREMENTS_FALLBACK[spec.id] ?? [];
      solution = solutionFromLesson(spec.explain);
    } else if (ex.kind === "code-completion") {
      const cc = ex as CodeCompletionExercise;
      requirements = cc.requirements;
      solution = [cc.solution];
    } else if (ex.kind === "from-scratch") {
      const fs = ex as FromScratchExercise;
      requirements = fs.requirements;
      solution = fs.solution;
    } else if (ex.kind === "fill-blank") {
      // Dropdown 和 RTK 那两道只有填空练习 —— 需求从它的空位说明里推不出来，
      // 所以显式在这里列，并从讲解那一节取参考答案。
      requirements = REQUIREMENTS_FALLBACK[spec.id] ?? [];
      solution = solutionFromLesson(spec.explain);
    }

    if (spec.requirements) requirements = spec.requirements;
    if (spec.solution) solution = spec.solution;

    if (requirements.length === 0) {
      throw new Error(`[coding] ${spec.id} 没有需求描述 —— 题面会是空的。`);
    }
    if (solution.length === 0) {
      throw new Error(`[coding] ${spec.id} 没有参考答案。`);
    }

    return {
      id: spec.id,
      title: spec.title,
      track: spec.track,
      difficulty: spec.difficulty,
      minutes: spec.minutes,
      // 自带题面优先；没写就用来源练习的 prompt
      brief: spec.brief ?? ex.prompt,
      requirements,
      runnable: spec.runnable,
      commands: spec.commands,
      explainLessonId: spec.explain,
      sandbox: spec.sandbox,
      solution,
    };
  });
}

/** 自带题面的题 —— 需求和答案都不从来源练习派生 */
const SELF_BRIEF = new Set(["tabs", "player"]);

/** 派生不出需求的题，需求单独列 */
const REQUIREMENTS_FALLBACK: Record<string, string[]> = {
  tabs: [
    "点标签切换面板，默认激活第一个",
    "支持 initialId 指定初始激活项",
    "只用一个 state 存 activeId，当前面板与高亮全部派生",
    "role=\"tablist\" / role=\"tab\" + aria-selected / role=\"tabpanel\"",
    "用 aria-controls 和 aria-labelledby 把 tab 和 panel 关联起来",
  ],
  player: [
    "用 useRef 拿到 <audio> 节点，点按钮调它的 play() / pause()",
    "按钮文字随播放状态切换 Play / Pause",
    "Stop 要把 currentTime 归零并停下",
    "播放结束靠 onEnded 把状态同步回 Play",
    "播放进度用 onTimeUpdate 同步到界面",
  ],
  dropdown: [
    "点触发器展开选项列表，选中后收起并显示选中项",
    "点组件外面任何地方都要关掉，点组件内部不能关",
    "按 Escape 关闭",
    "卸载时必须解绑 document 上的监听器",
    "触发器要有 aria-haspopup 和 aria-expanded",
  ],
  "rtk-todo": [
    "用 createSlice 写出 added / toggled / removed / clearedDone / filterChanged",
    "id 在 prepare 里生成，reducer 必须保持纯函数",
    "context value 之外的派生数据用 selector，组件只订阅自己要的那部分",
    "筛选不能改底层数据 —— 切回 all 时全部条目都还在",
    "reducer 要能脱离 React 单独测",
  ],
};

/** 从某一节课的代码块里取「参考答案」那几段 —— filename 带「参考答案」或「实测」的 */
function solutionFromLesson(lessonId: string): CodingProblem["solution"] {
  for (const exam of EXAMS) {
    for (const mod of exam.modules) {
      for (const lesson of mod.lessons) {
        if (lesson.id !== lessonId) continue;
        const picked = lesson.concepts
          .flatMap((c) => c.code ?? [])
          .filter(
            (c) =>
              c.verified === "verified" &&
              !!c.filename &&
              /参考答案|实测|通过/.test(c.filename),
          );
        if (picked.length > 0) return picked;
      }
    }
  }
  return [];
}

const PROBLEMS = build();

/* ---------- 断言 ---------- */

const EXPECTED = SPECS.length;

if (PROBLEMS.length !== EXPECTED) {
  throw new Error(`[coding] 题目数量不对：期望 ${EXPECTED}，实际 ${PROBLEMS.length}`);
}

for (const p of PROBLEMS) {
  if (!p.runnable && (!p.commands || p.commands.length === 0)) {
    throw new Error(
      `[coding] ${p.id} 标了不可运行，但没给本机命令 —— 那用户就不知道怎么验收了。`,
    );
  }
  if (p.runnable && p.sandbox && !p.sandbox.expect) {
    throw new Error(`[coding] ${p.id} 的沙箱没写 expect（期望看到的测试结果）。`);
  }
}

/* ---------- 查询 ---------- */

export function allCodingProblems(): CodingProblem[] {
  return PROBLEMS;
}

export function codingProblemById(id: string): CodingProblem | undefined {
  return PROBLEMS.find((p) => p.id === id);
}

export const CODING_TRACK_LABEL: Record<CodingProblem["track"], string> = {
  react: "React",
  js: "JavaScript",
  graphql: "GraphQL",
  java: "Java / Spring",
};

export const DIFFICULTY_LABEL: Record<1 | 2 | 3, { zh: string; en: string }> = {
  1: { zh: "简单", en: "Easy" },
  2: { zh: "中等", en: "Medium" },
  3: { zh: "困难", en: "Hard" },
};
