// React 考试 —— 模块 4（Q2 并发任务调度器）与模块 5（Debug Lab + 从零重写 + 迁移）。

import type { Module } from "../types";
import { demo, real } from "../helpers";

// NoteManager 的完整参考实现（从零重写那一关的参考答案要用）
const NOTE_MANAGER_FULL_REF = `import { useState } from "react";
import type { Note } from "../../types/Note";
import NoteForm from "../NoteForm";
import NoteTable from "../NoteTable";

const NoteManager: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);

  const handleSubmitNote = (submittedNote: Note) => {
    if (noteToEdit) {
      setNotes((prev) =>
        prev.map((note) =>
          note.id === submittedNote.id ? submittedNote : note,
        ),
      );
      setNoteToEdit(null);
    } else {
      setNotes((prev) => [...prev, submittedNote]);
    }
  };

  const handleDelete = (id: number) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const handleEdit = (note: Note) => {
    setNoteToEdit(note);
  };

  return (
    <div
      className="layout-column align-items-center justify-content-start"
      data-testid="note-manager"
    >
      <NoteForm onSubmit={handleSubmitNote} noteToEdit={noteToEdit} />
      <NoteTable notes={notes} onDelete={handleDelete} onEdit={handleEdit} />
    </div>
  );
};

export default NoteManager;`;

const TASK_RUNNER_HEADER = `// Q2: Implement a custom asynchronous task runner.
//
// Requirements:
// 1. \`tasks\` is an array of FUNCTIONS. Each function, when called,
//    starts an async job and returns a Promise.
// 2. At most \`limit\` tasks may be RUNNING at the same time.
//    A new task may only start after one of the running tasks finishes.
// 3. The runner NEVER throws, even if some tasks reject.
//    It resolves with an array of results IN THE SAME ORDER as \`tasks\`:
//      { status: "fulfilled", value: T }        for tasks that succeeded
//      { status: "rejected",  reason: unknown } for tasks that failed
//    (This mimics Promise.allSettled, but with a concurrency throttle.)

export type Task<T> = () => Promise<T>;

export type SettledResult<T> =
  | { status: "fulfilled"; value: T }
  | { status: "rejected"; reason: unknown };

export async function runTasks<T>(
  tasks: Task<T>[],
  limit: number,
): Promise<SettledResult<T>[]> {
  // TODO: implement me
}`;

const TASK_RUNNER_SOLUTION = `export async function runTasks<T>(
  tasks: Task<T>[],
  limit: number,
): Promise<SettledResult<T>[]> {
  const results: SettledResult<T>[] = new Array(tasks.length);

  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < tasks.length) {
      const i = nextIndex;
      nextIndex++;

      try {
        const value = await tasks[i]();
        results[i] = { status: "fulfilled", value };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  };
  if (tasks.length === 0) return [];

  const workerCount = Math.min(limit, tasks.length);
  const workers: Promise<void>[] = [];
  for (let w = 0; w < workerCount; w++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}`;

export const reactQ2: Module = {
  id: "react-q2",
  stage: "React · 第 4 部分",
  title: "Q2 · 带并发上限的异步任务调度器",
  titleEn: "Q2 · an async task runner that limits how many tasks run at the same time",
  summary:
    "react-notes-app 的第二道题，和 React 完全无关。纯 TypeScript + 异步。考的是「你能不能自己实现一个 Promise.allSettled 加节流」。",
  summaryEn:
    "The second question in react-notes-app, with no React in it at all. Pure TypeScript and async work. It asks whether you can write your own Promise.allSettled that also caps how many tasks are running at the same time.",
  lessons: [
    /* ---------- 4.1 ---------- */
    {
      id: "r-q2-read",
      title: "读题：三条要求，每一条都在指定一种写法",
      titleEn: "Reading the question: three requirements, and each one decides how you write it",
      blurb: "题面就写在 taskRunner.ts 的文件头注释里。逐条翻译。",
      blurbEn: "The question is written in the header comment of taskRunner.ts. Take it one requirement at a time.",
      minutes: 12,
      objectives: [
        "复述三条要求，并说清每条排除了哪种实现",
        "解释为什么参数是「函数数组」而不是「Promise 数组」",
        "看懂 SettledResult 这个可辨识联合类型",
        "知道怎么跑 demo.ts 以及怎么读它的输出",
      ],
      objectivesEn: [
        "Restate the three requirements, and say which implementation each one rules out",
        "Explain why the parameter is an array of functions and not an array of Promise values",
        "Read the SettledResult type and see that it is a discriminated union",
        "Know how to run demo.ts and how to read its output",
      ],
      whyForAssessment:
        "这道题没有断言测试，只有一个打印实时并发数的 demo.ts。也就是说：验收全靠你自己会不会读那段输出。读不懂输出，就不知道自己做对没有。",
      whyForAssessmentEn:
        "This question has no assertion tests. It has one demo.ts that prints how many tasks are running at each moment. So the only check is whether you can read that output. If you cannot read it, you do not know whether your answer is right.",
      sourceFiles: [
        { path: "react-notes-app/q2/taskRunner.ts", role: "题面 + 类型 + 要实现的函数", roleEn: "The question, the types, and the function you must write", edit: true },
        { path: "react-notes-app/q2/demo.ts", role: "验证台，打印实时并发数与最终结果", roleEn: "The check harness: it prints how many tasks run at each moment, then the final results" },
      ],
      concepts: [
        {
          id: "the-brief",
          heading: "题面原文",
          headingEn: "The question, word for word",
          lede: "注意它是英文的，而且每一条都很精确。",
          ledeEn: "Note that it is written in English, and every line is precise.",
          body: (
            <>
              <p>
                这段注释就在 <code>q2/taskRunner.ts</code> 的最上面。
                下面的 <code>{"// TODO: implement me"}</code> 就是你要填的地方
                （磁盘上的项目里这一句注释还留着，但下面已经有完整实现了）：
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                This comment sits right at the top of <code>q2/taskRunner.ts</code>.
                The <code>{"// TODO: implement me"}</code> underneath is the spot you fill
                in (in the project on disk that comment is still there, but a complete
                implementation already sits below it):
              </p>
            </>
          ),
          code: [
            real("ts", TASK_RUNNER_HEADER, {
              filename: "q2/taskRunner.ts（题面与签名）",
              filenameEn: "q2/taskRunner.ts (the question and the signature)",
              sourceFile: "react-notes-app/q2/taskRunner.ts",
              highlight: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
            }),
          ],
        },
        {
          id: "translate",
          heading: "三条要求逐条翻译",
          headingEn: "The three requirements, one at a time",
          body: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>原文</th>
                      <th>中文</th>
                      <th>它排除了什么写法</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>tasks</code> is an array of <strong>FUNCTIONS</strong>
                      </td>
                      <td>
                        传进来的是一堆<strong>还没被调用</strong>的函数，
                        调用它才会开始干活
                      </td>
                      <td>
                        排除了「直接 <code>await</code> 数组元素」——
                        必须先 <code>tasks[i]()</code> 调用
                      </td>
                    </tr>
                    <tr>
                      <td>
                        At most <code>limit</code> tasks may be RUNNING at the same time
                      </td>
                      <td>
                        同一时刻最多 <code>limit</code> 个在跑。
                        必须等其中一个结束，才能开下一个
                      </td>
                      <td>
                        排除了 <code>Promise.allSettled(tasks.map(t =&gt; t()))</code>
                        —— 那会一次全开
                      </td>
                    </tr>
                    <tr>
                      <td>
                        NEVER throws … results IN THE SAME ORDER
                      </td>
                      <td>
                        任何任务失败都不能让整体抛错；
                        结果数组的顺序必须和输入一致
                      </td>
                      <td>
                        排除了 <code>Promise.all</code>（一个失败就整体炸）；
                        也排除了「谁先完成谁先 push」（顺序会乱）
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                注释最后一句直接给了答案的形状：
                <em>This mimics Promise.allSettled, but with a concurrency throttle.</em>
                —— <strong>「allSettled 的语义 + 一个并发节流」</strong>。
                题面已经把要做什么说清楚了，剩下的是怎么做。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Original</th>
                      <th>In plain words</th>
                      <th>What it rules out</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <code>tasks</code> is an array of <strong>FUNCTIONS</strong>
                      </td>
                      <td>
                        What arrives is a pile of functions that{" "}
                        <strong>have not been called yet</strong>;
                        calling one is what starts the work
                      </td>
                      <td>
                        Rules out a plain <code>await</code> on the array elements —
                        you have to call <code>tasks[i]()</code> first
                      </td>
                    </tr>
                    <tr>
                      <td>
                        At most <code>limit</code> tasks may be RUNNING at the same time
                      </td>
                      <td>
                        At most <code>limit</code> of them run at any moment.
                        One has to finish before the next can start
                      </td>
                      <td>
                        Rules out <code>Promise.allSettled(tasks.map(t =&gt; t()))</code>
                        — that opens all of them at once
                      </td>
                    </tr>
                    <tr>
                      <td>
                        NEVER throws … results IN THE SAME ORDER
                      </td>
                      <td>
                        No failing task may make the whole thing throw;
                        the result array must be in the same order as the input
                      </td>
                      <td>
                        Rules out <code>Promise.all</code> (one failure fails the whole
                        batch), and also &ldquo;push whoever finishes first&rdquo;
                        (the order scrambles)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                The last line of the comment hands you the shape of the answer:{" "}
                <em>This mimics Promise.allSettled, but with a concurrency throttle.</em>
                — <strong>&ldquo;allSettled semantics plus one concurrency
                throttle&rdquo;</strong>.
                The brief already says what to build; the rest is how.
              </p>
            </>
          ),
        },
        {
          id: "fn-not-promise",
          heading: "为什么是函数数组：这是整道题的支点",
          headingEn: "Why it is an array of functions: this is what the whole question turns on",
          lede: "如果传进来的是 Promise，这道题根本无解。",
          ledeEn: "If you were handed Promise values, this question would have no answer at all.",
          body: (
            <>
              <p>
                <strong>Promise 一旦被创建，就已经在跑了，没有暂停键。</strong>
              </p>
              <p>
                所以如果签名是 <code>runTasks(promises: Promise&lt;T&gt;[], limit)</code>，
                那么调用方写 <code>runTasks([fetch(a), fetch(b), fetch(c)], 2)</code>
                的那一瞬间，三个请求就已经<strong>同时</strong>发出去了。
                你在函数内部再怎么排队都没意义 —— 网络请求早出去了。
              </p>
              <p>
                改成 <code>() =&gt; Promise&lt;T&gt;</code> 之后，
                调用方交给你的是<strong>「怎么开始」的说明书</strong>，
                而不是「已经开始的事」。什么时候撕开说明书、
                撕几张，完全由你决定。<strong>这才有并发控制的余地。</strong>
              </p>
              <p>
                这个设计在真实世界里到处都是：批量上传文件时限制同时上传数、
                爬虫限制并发请求、数据库连接池。
                <strong>看到「限制同时进行的数量」，
                第一反应就该是「参数得是工厂函数，不能是已启动的任务」。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <strong>Once a Promise exists it is already running. There is no pause
                button.</strong>
              </p>
              <p>
                So if the signature were{" "}
                <code>runTasks(promises: Promise&lt;T&gt;[], limit)</code>,
                then the instant the caller writes{" "}
                <code>runTasks([fetch(a), fetch(b), fetch(c)], 2)</code>{" "}
                all three requests are already out the door{" "}
                <strong>at the same time</strong>.
                Queueing inside your function means nothing — the network calls left long
                ago.
              </p>
              <p>
                Switch to <code>() =&gt; Promise&lt;T&gt;</code> and what the caller
                hands you is <strong>instructions for how to start</strong>,
                not a thing that already started. When you tear an instruction sheet off,
                and how many you tear off, is entirely your call.{" "}
                <strong>That is what leaves room for concurrency control.</strong>
              </p>
              <p>
                This design is everywhere in the real world: capping simultaneous uploads
                in a batch, throttling a crawler&rsquo;s parallel requests, a database
                connection pool.{" "}
                <strong>When you see &ldquo;limit how many run at once&rdquo;, the first
                thought should be &ldquo;the parameter has to be factory functions, not
                tasks that already started&rdquo;.</strong>
              </p>
            </>
          ),
          code: [
            demo(
              "ts",
              `// 调用方在 demo.ts 里是这么用的（真实代码）
const makeTask = (id: number, ms: number, shouldFail = false): Task<string> => {
  return () =>                          // ← 注意这里返回的是一个函数
    new Promise((resolve, reject) => {
      running++;
      console.log(\`task \${id} START   (running now: \${running})\`);
      ...
    });
};

const tasks = [
  makeTask(1, 300),     // 只是造好了「说明书」，一个请求都还没发
  makeTask(2, 100),
  makeTask(3, 200, true),
  ...
];`,
              {
                filename: "q2/demo.ts 里 Task 是怎么造出来的",
                filenameEn: "How Task is built inside q2/demo.ts",
                codeEn: `// This is how the caller uses it in demo.ts (real code)
const makeTask = (id: number, ms: number, shouldFail = false): Task<string> => {
  return () =>                          // ← note that this returns a function
    new Promise((resolve, reject) => {
      running++;
      console.log(\`task \${id} START   (running now: \${running})\`);
      ...
    });
};

const tasks = [
  makeTask(1, 300),     // only builds the instructions; no request sent yet
  makeTask(2, 100),
  makeTask(3, 200, true),
  ...
];`,
                sourceFile: "react-notes-app/q2/demo.ts",
                explanation:
                  "makeTask 返回的是「一个函数」，而不是「一个 Promise」。里面的 new Promise 只有在这个函数被调用时才执行 —— 这就是为什么 running++ 那一行在你调 tasks[i]() 之前不会跑。",
                explanationEn:
                  "makeTask returns a function, not a Promise. The new Promise inside it runs only when that function is called. That is why the running++ line does not run until you call tasks[i]().",
              },
            ),
          ],
        },
        {
          id: "settled-result",
          heading: "SettledResult：一个可辨识联合",
          headingEn: "SettledResult: a discriminated union",
          body: (
            <>
              <p>
                <code>SettledResult&lt;T&gt;</code> 是两个对象形状的联合：
                要么有 <code>value</code>，要么有 <code>reason</code>，
                两者<strong>不会同时存在</strong>。
              </p>
              <p>
                <code>status</code> 这个字段是<strong>判别标签</strong>：
                它的值是字面量 <code>&quot;fulfilled&quot;</code> 或
                <code>&quot;rejected&quot;</code>。
                写了 <code>if (r.status === &quot;fulfilled&quot;)</code> 之后，
                TypeScript 就知道<strong>这个分支里一定有 <code>value</code>
                且一定没有 <code>reason</code></strong>。这叫
                <strong>类型收窄</strong>，这种类型叫
                <strong>可辨识联合（discriminated union）</strong>。
              </p>
              <p>
                这也是为什么这里必须用 <code>type</code> 而不能用
                <code>interface</code> —— interface 不能表达「A 或 B」。
              </p>
              <p>
                实用含义：你写结果时必须<strong>严格</strong>按这两种形状之一来。
                写成 <code>{"{ status: \"fulfilled\", value, reason: undefined }"}</code>
                会类型报错。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>SettledResult&lt;T&gt;</code> is a union of two object shapes:
                either there is a <code>value</code> or there is a <code>reason</code>,
                and the two <strong>never coexist</strong>.
              </p>
              <p>
                The <code>status</code> field is the <strong>discriminant tag</strong>:
                its value is the literal <code>&quot;fulfilled&quot;</code> or{" "}
                <code>&quot;rejected&quot;</code>.
                Once you write <code>if (r.status === &quot;fulfilled&quot;)</code>,
                TypeScript knows <strong>this branch definitely has <code>value</code>{" "}
                and definitely has no <code>reason</code></strong>. That is called{" "}
                <strong>narrowing</strong>, and this kind of type is a{" "}
                <strong>discriminated union</strong>.
              </p>
              <p>
                It is also why this has to be a <code>type</code> and cannot be an{" "}
                <code>interface</code> — an interface cannot express &ldquo;A or B&rdquo;.
              </p>
              <p>
                Practical consequence: when you write a result it must match one of those
                two shapes <strong>exactly</strong>.
                Writing <code>{"{ status: \"fulfilled\", value, reason: undefined }"}</code>
                is a type error.
              </p>
            </>
          ),
          code: [
            demo(
              "ts",
              `const results = await runTasks(tasks, 2);

for (const r of results) {
  if (r.status === "fulfilled") {
    console.log(r.value);     // ✓ TypeScript 知道这里有 value
    // console.log(r.reason); // ✗ 报错：这个分支里没有 reason
  } else {
    console.log(r.reason);    // ✓ 这个分支里有 reason
  }
}`,
              {
                filename: "可辨识联合怎么用",
                filenameEn: "How to use a discriminated union",
                codeEn: `const results = await runTasks(tasks, 2);

for (const r of results) {
  if (r.status === "fulfilled") {
    console.log(r.value);     // ✓ TypeScript knows value exists here
    // console.log(r.reason); // ✗ error: this branch has no reason
  } else {
    console.log(r.reason);    // ✓ this branch has reason
  }
}`,
              },
            ),
          ],
        },
        {
          id: "the-harness",
          heading: "验证台 demo.ts 怎么读",
          headingEn: "How to read demo.ts, the check harness",
          lede: "这道题没有断言测试。会读输出，等于会判卷。",
          ledeEn: "This question has no assertion tests. Reading the output is the grading.",
          body: (
            <>
              <p>
                <code>demo.ts</code> 用一个模块级变量 <code>running</code>
                记录「此刻有几个任务在跑」：任务开始时 <code>running++</code>，
                结束时 <code>running--</code>，并且每次都打印出来。
              </p>
              <p>
                它准备了 6 个任务，其中<strong>第 3 个会 reject</strong>，
                然后用 <code>limit = 2</code> 调用。
              </p>
              <p>
                所以验收标准是三条，全靠肉眼：
              </p>
              <ol>
                <li>
                  <strong><code>running now</code> 永远不超过 2。</strong>
                  出现 3 就是并发控制失效。
                </li>
                <li>
                  <strong>最终 6 条结果的顺序与输入一致。</strong>
                  <code>#1</code> 必须是 task 1 的结果，即使它跑得最慢。
                </li>
                <li>
                  <strong>task 3 以 <code>rejected</code> 出现，
                  而且 4、5、6 照样跑完了。</strong>
                  如果程序在 task 3 之后就崩了，说明没接住错误。
                </li>
              </ol>
            </>
          ),
          bodyEn: (
            <>
              <p>
                <code>demo.ts</code> keeps one module-level variable{" "}
                <code>running</code> to track how many tasks are in flight right now:{" "}
                <code>running++</code> when a task starts, <code>running--</code> when it
                ends, and it prints the number every time.
              </p>
              <p>
                It sets up 6 tasks, <strong>the third of which rejects</strong>,
                then calls with <code>limit = 2</code>.
              </p>
              <p>
                So there are three acceptance criteria, all judged with your eyes:
              </p>
              <ol>
                <li>
                  <strong><code>running now</code> never goes above 2.</strong>{" "}
                  A 3 means the throttle is broken.
                </li>
                <li>
                  <strong>The final 6 results come back in the input order.</strong>
                  <code>#1</code> has to be task 1&rsquo;s result even though it is the
                  slowest.
                </li>
                <li>
                  <strong>Task 3 shows up as <code>rejected</code>,
                  and 4, 5, 6 still run to completion.</strong>{" "}
                  If the program dies after task 3, the error was never caught.
                </li>
              </ol>
            </>
          ),
          code: [
            real(
              "ts",
              `let running = 0;

const makeTask = (id: number, ms: number, shouldFail = false): Task<string> => {
  return () =>
    new Promise((resolve, reject) => {
      running++;
      console.log(\`task \${id} START   (running now: \${running})\`);
      setTimeout(() => {
        running--;
        if (shouldFail) {
          console.log(\`task \${id} FAIL    (running now: \${running})\`);
          reject(new Error(\`task \${id} failed\`));
        } else {
          console.log(\`task \${id} DONE    (running now: \${running})\`);
          resolve(\`result of task \${id}\`);
        }
      }, ms);
    });
};

const tasks = [
  makeTask(1, 300),
  makeTask(2, 100),
  makeTask(3, 200, true), // this one rejects
  makeTask(4, 100),
  makeTask(5, 150),
  makeTask(6, 100),
];

runTasks(tasks, 2).then((results) => {
  console.log("\\n=== FINAL RESULTS (must be in original order) ===");
  results.forEach((r, i) => console.log(\`#\${i + 1}\`, r));
});`,
              {
                filename: "q2/demo.ts（全文）",
                filenameEn: "q2/demo.ts (the whole file)",
                sourceFile: "react-notes-app/q2/demo.ts",
                collapsible: true,
              },
            ),
            real(
              "bash",
              `$ npm run q2      # → tsx q2/demo.ts`,
              {
                explanation: "package.json 里的 q2 script 用 tsx 直接跑 TypeScript，不需要先编译。",
                explanationEn:
                  "The q2 script in package.json uses tsx to run TypeScript directly, so there is no compile step first.",
              },
            ),
          ],
        },
      ],
      exercises: [
        {
          kind: "recognition",
          id: "r-q2-why-fn",
          title: "如果参数改成 Promise 数组会怎样",
          titleEn: "What happens if the parameter becomes an array of Promises",
          level: 1,
          prompt: (
            <p>
              假设签名改成{" "}
              <code>runTasks(promises: Promise&lt;T&gt;[], limit: number)</code>，
              调用方写 <code>runTasks([task1(), task2(), task3()], 2)</code>。
              会发生什么？
            </p>
          ),
          promptEn: (
            <p>
              Suppose the signature becomes{" "}
              <code>runTasks(promises: Promise&lt;T&gt;[], limit: number)</code>{" "}
              and the caller writes{" "}
              <code>runTasks([task1(), task2(), task3()], 2)</code>. What
              happens?
            </p>
          ),
          options: [
            { id: "a", label: "一样能工作，只是写法不同", labelEn: "It works the same way; only the spelling is different" },
            { id: "b", label: "三个任务在调用 runTasks 之前就全开始跑了，并发上限无法实现", labelEn: "All three tasks start before runTasks is even called, so the concurrency limit cannot be applied" },
            { id: "c", label: "结果顺序会乱", labelEn: "The results come back out of order" },
            { id: "d", label: "TypeScript 会编译报错", labelEn: "TypeScript reports a compile error" },
          ],
          answer: ["b"],
          explain: (
            <>
              <code>task1()</code> 这个括号一写，任务就启动了。
              等 <code>runTasks</code> 拿到参数时，三个都已经在跑 ——
              你在函数内部无论怎么排队，都改变不了「它们已经并发开始」这个事实。
              <br />
              <strong>并发控制的前提是「我说了才开始」，
              所以参数必须是还没被调用的函数。</strong>
            </>
          ),
          explainEn: (
            <>
              The moment you write the parentheses in <code>task1()</code>, the
              task starts. By the time <code>runTasks</code> receives the
              parameter, all three are already running. No amount of queueing
              inside the function can change the fact that they already started
              together.
              <br />
              <strong>
                Controlling concurrency requires that nothing starts until you
                say so, so the parameter must be functions that have not been
                called yet.
              </strong>
            </>
          ),
        },
        {
          kind: "recognition",
          id: "r-q2-not-allsettled",
          title: "为什么不能直接用 Promise.allSettled",
          titleEn: "Why Promise.allSettled on its own is not the answer",
          level: 1,
          prompt: (
            <p>
              有人写{" "}
              <code>return Promise.allSettled(tasks.map((t) =&gt; t()))</code>。
              它满足几条要求？
            </p>
          ),
          promptEn: (
            <p>
              Someone writes{" "}
              <code>return Promise.allSettled(tasks.map((t) =&gt; t()))</code>.
              How many of the requirements does it meet?
            </p>
          ),
          options: [
            { id: "a", label: "三条全满足，这就是答案", labelEn: "All three, so this is the answer" },
            { id: "b", label: "满足「不抛错」和「保序」，但违反「并发上限」", labelEn: "It meets never throwing and keeping the order, but it breaks the concurrency limit" },
            { id: "c", label: "满足「并发上限」，但顺序会乱", labelEn: "It meets the concurrency limit, but the order is lost" },
            { id: "d", label: "一条都不满足", labelEn: "None of them" },
          ],
          answer: ["b"],
          explain: (
            <>
              <code>allSettled</code> 本身确实「不抛错」而且「保序」。
              问题在 <code>tasks.map((t) =&gt; t())</code> ——
              这一行<strong>把所有任务一次性全调用了</strong>，
              6 个任务同时开跑，<code>running now</code> 会冲到 6。
              <br />
              所以这道题的全部难点就在<strong>那个节流</strong>上：
              怎么做到「一次只开 limit 个」。
            </>
          ),
          explainEn: (
            <>
              <code>allSettled</code> itself really does never throw and really
              does keep the order. The problem is{" "}
              <code>tasks.map((t) =&gt; t())</code>: that line{" "}
              <strong>calls every task at once</strong>, so all 6 start
              together and <code>running now</code> climbs to 6.
              <br />
              So the whole difficulty of this question is{" "}
              <strong>the throttling</strong>: how to keep only limit tasks
              running at a time.
            </>
          ),
        },
      ],
      transfer: [
        { signal: "「限制同时进行的数量」", signalEn: "The wording: limit how many run at the same time", reachFor: "参数必须是工厂函数数组，不能是已启动的 Promise", reachForEn: "The parameter must be an array of functions that create the work, not Promise values that already started" },
        { signal: "「不管失败都要拿到全部结果」", signalEn: "The wording: collect every result even when some fail", reachFor: "allSettled 的语义：try/catch 每一个，都记下来", reachForEn: "This is what allSettled means: wrap each one in try/catch and record what happened" },
        { signal: "「结果顺序与输入一致」", signalEn: "The wording: results must be in the same order as the input", reachFor: "按下标写回预分配的数组，别用 push", reachForEn: "Write into an array you created up front, at the matching index; do not use push" },
        { signal: "看到 status: \"a\" | \"b\" 这种字段", signalEn: "You see a field like status: \"a\" | \"b\"", reachFor: "可辨识联合，if 之后类型自动收窄", reachForEn: "A discriminated union: inside the if, the type narrows on its own" },
      ],
      recap: [
        "三条要求：函数数组、并发上限 limit、绝不抛错且保序。",
        "参数是 () => Promise<T> 而不是 Promise<T>，因为 Promise 一创建就没法暂停。",
        "Promise.allSettled(tasks.map(t => t())) 满足两条但违反并发上限 —— 难点全在节流。",
        "SettledResult 是可辨识联合，靠 status 字段收窄类型，必须用 type 不能用 interface。",
        "这道题没有断言测试，验收靠读 demo.ts 的三条输出特征。",
      ],
      recapEn: [
        "Three requirements: an array of functions, a concurrency limit called limit, and never throwing while keeping the order.",
        "The parameter is () => Promise<T> and not Promise<T>, because once a Promise exists you cannot pause it.",
        "Promise.allSettled(tasks.map(t => t())) meets two requirements but breaks the concurrency limit. All the difficulty is in the throttling.",
        "SettledResult is a discriminated union: the status field narrows the type, and it must be declared with type, not interface.",
        "This question has no assertion tests. You check it by reading three things in the demo.ts output.",
      ],
    },

    /* ---------- 4.2 ---------- */
    {
      id: "r-q2-implement",
      title: "实现：worker pool（工人池）",
      titleEn: "Building it: a worker pool, meaning a fixed number of workers sharing one queue",
      blurb: "别想复杂了。就是「开 limit 个工人，一起从同一个待办队列里抢活」。",
      blurbEn: "Do not overthink it. You start limit workers, and they all take jobs from the same to-do queue.",
      minutes: 16,
      objectives: [
        "独立实现 runTasks，并解释每一行为什么这么写",
        "说清「共享游标」为什么天然保证了并发上限",
        "说清「按下标写回」为什么天然保证了顺序",
        "会读 npm run q2 的输出并判断实现是否正确",
      ],
      objectivesEn: [
        "Implement runTasks without help, and explain why each line is written that way",
        "Explain why one shared cursor already guarantees the concurrency limit",
        "Explain why writing results back by index already guarantees the order",
        "Read the output of npm run q2 and decide whether the implementation is correct",
      ],
      whyForAssessment:
        "这是 Q2 的完整答案。而且 worker pool 是一个可迁移的模式 —— 任何「限制并发」的题都是这个骨架。",
      whyForAssessmentEn:
        "This is the full answer to Q2. The worker pool is also a pattern you can carry to other problems: every question about limiting concurrency has this same skeleton.",
      sourceFiles: [
        { path: "react-notes-app/q2/taskRunner.ts", role: "要实现的 runTasks", edit: true },
      ],
      concepts: [
        {
          id: "wrong-idea",
          heading: "先排除一个直觉上的错解：分批",
          headingEn: "First rule out the answer that feels obvious: fixed batches",
          lede: "「6 个任务、上限 2，那就切成 3 批」—— 这个想法能跑，但不对。",
          ledeEn: "Six tasks, a limit of 2, so cut them into 3 batches. That idea runs, but it is wrong.",
          body: (
            <>
              <p>
                分批的写法是：取前 2 个跑完，再取接下来 2 个，再取最后 2 个。
                并发数确实不会超过 2。
              </p>
              <p>
                <strong>问题在于它浪费时间。</strong>
                每一批都要等<strong>那一批里最慢的</strong>结束，
                才能开始下一批。用 demo 里的真实耗时算一下：
              </p>
              <p>
                分批要 650ms，worker pool 只要 450ms。
                更重要的是它违反了题目原文：
                <em>A new task may only start after one of the running tasks
                finishes</em> —— 「<strong>其中一个</strong>结束就能开下一个」，
                不是「这一批都结束」。
              </p>
              <p>
                所以要的不是分批，是<strong>「谁空了谁接着干」</strong>。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Batching means: take the first 2 and wait for both, then the next 2,
                then the last 2. Concurrency really never goes above 2.
              </p>
              <p>
                <strong>The problem is that it wastes time.</strong>{" "}
                Every batch has to wait for <strong>the slowest task in that
                batch</strong> before the next batch can start. Do the arithmetic with the
                real durations from the demo:
              </p>
              <p>
                Batching needs 650ms; the worker pool needs only 450ms.
                More importantly it breaks the wording of the brief:{" "}
                <em>A new task may only start after one of the running tasks
                finishes</em> — &ldquo;<strong>one of them</strong> finishing lets the
                next one start&rdquo;, not &ldquo;the whole batch finishes&rdquo;.
              </p>
              <p>
                So what you want is not batching, it is{" "}
                <strong>&ldquo;whoever is free takes the next job&rdquo;</strong>.
              </p>
            </>
          ),
          code: [
            demo(
              "text",
              `任务耗时：1→300ms  2→100ms  3→200ms  4→100ms  5→150ms  6→100ms

✗ 分批（每批等最慢的）
  批1: [1(300), 2(100)]  → 等 300ms
  批2: [3(200), 4(100)]  → 等 200ms
  批3: [5(150), 6(100)]  → 等 150ms
  总计 650ms，而且中间有大量空闲槽位

✓ worker pool（谁空了谁补上）
  t=0    开 1、2
  t=100  2 完 → 立刻开 3
  t=300  1 完 → 立刻开 4         3 还在跑
  t=300  3 完 → 立刻开 5
  t=400  4 完 → 立刻开 6
  t=450  5、6 陆续完
  总计 ~450ms，槽位几乎没空过`,
              {
                filename: "两种思路的耗时对比",
                filenameEn: "How long the two approaches take",
                codeEn: `Task durations: 1→300ms  2→100ms  3→200ms  4→100ms  5→150ms  6→100ms

✗ Batching (each batch waits for its slowest task)
  batch 1: [1(300), 2(100)]  → wait 300ms
  batch 2: [3(200), 4(100)]  → wait 200ms
  batch 3: [5(150), 6(100)]  → wait 150ms
  650ms in total, and many slots sit idle in between

✓ worker pool (whoever is free takes the next job)
  t=0    start 1 and 2
  t=100  2 done → start 3 at once
  t=300  1 done → start 4 at once      3 still running
  t=300  3 done → start 5 at once
  t=400  4 done → start 6 at once
  t=450  5 and 6 finish one after the other
  ~450ms in total, and a slot is almost never idle`,
              },
            ),
          ],
        },
        {
          id: "the-idea",
          heading: "worker pool 的四个零件",
          headingEn: "The four parts of a worker pool",
          lede: "拆开看，一共只有四样东西。",
          ledeEn: "Taken apart, there are only four things.",
          body: (
            <>
              <ol>
                <li>
                  <strong>一个预分配的结果数组</strong>{" "}
                  <code>new Array(tasks.length)</code>。
                  长度一开始就定好，之后按下标填 ——
                  <strong>这就是顺序保证的全部秘密</strong>，
                  不需要任何排序。
                </li>
                <li>
                  <strong>一个共享游标</strong> <code>let nextIndex = 0</code>。
                  它记录「下一个该做的是第几号任务」。
                  所有 worker 共用这一个变量（靠闭包共享）。
                </li>
                <li>
                  <strong>一个 worker 函数</strong>。
                  它是个循环：抢一个任务号 → 游标 +1 → 跑它 →
                  结果写回对应下标 → 回到循环开头再抢。
                  队列空了就退出。
                </li>
                <li>
                  <strong>启动 <code>limit</code> 个 worker，
                  然后 <code>await Promise.all</code> 等它们全收工。</strong>
                  <strong>同时存在的 worker 只有 limit 个，
                  所以同时在跑的任务也只有 limit 个 ——
                  并发上限是这么来的，不需要任何计数器。</strong>
                </li>
              </ol>
              <p>
                <strong>这两个「天然保证」是这个解法漂亮的地方：</strong>
                并发上限来自「worker 的个数」，
                顺序来自「按下标写回」。
                两件难事都不需要额外代码。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <ol>
                <li>
                  <strong>A pre-allocated result array</strong>{" "}
                  <code>new Array(tasks.length)</code>.
                  The length is fixed up front and you fill it by index afterwards —
                  <strong>that is the entire secret of the ordering guarantee</strong>,
                  no sorting anywhere.
                </li>
                <li>
                  <strong>A shared cursor</strong> <code>let nextIndex = 0</code>.
                  It records which task number comes next.
                  Every worker shares this one variable, through the closure.
                </li>
                <li>
                  <strong>A worker function</strong>.
                  It is a loop: grab a task number → bump the cursor → run the task →
                  write the result back at that index → loop around and grab again.
                  When the queue is empty it exits.
                </li>
                <li>
                  <strong>Start <code>limit</code> workers,
                  then <code>await Promise.all</code> until they all clock out.</strong>
                  <strong>Only limit workers exist at a time, so only limit tasks run at
                  a time — that is where the concurrency cap comes from, and it needs no
                  counter at all.</strong>
                </li>
              </ol>
              <p>
                <strong>Those two free guarantees are what makes this solution
                pretty:</strong>{" "}
                the concurrency cap comes from the number of workers,
                the ordering comes from writing back by index.
                Neither hard part needs extra code.
              </p>
            </>
          ),
        },
        {
          id: "why-safe",
          heading: "游标不会被抢乱吗",
          headingEn: "Can two workers grab the same cursor value?",
          lede: "不会。JavaScript 是单线程的。",
          ledeEn: "No. JavaScript runs on one thread.",
          body: (
            <>
              <p>
                看这两行：
              </p>
              <p>
                在多线程语言里，两个线程可能同时读到 <code>nextIndex = 3</code>，
                然后都去做第 3 号任务 —— 这叫竞态条件，得加锁。
              </p>
              <p>
                但 <strong>JavaScript 是单线程的</strong>。
                只有遇到 <code>await</code> 时才会把控制权交出去。
                <code>const i = nextIndex; nextIndex++;</code> 这两行中间
                <strong>没有 await</strong>，所以它们是一口气执行完的，
                不可能被打断。
              </p>
              <p>
                <strong>所以不需要锁。</strong>这是 JavaScript 并发模型的一个
                实实在在的好处，也是这道题能写得这么短的原因。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Look at these two lines:
              </p>
              <p>
                In a multi-threaded language two threads could read{" "}
                <code>nextIndex = 3</code> at the same moment and both go do task 3 —
                that is a race condition, and it needs a lock.
              </p>
              <p>
                But <strong>JavaScript is single-threaded</strong>.
                It only hands control away when it hits an <code>await</code>.
                There is <strong>no await</strong> between{" "}
                <code>const i = nextIndex; nextIndex++;</code>,
                so those two lines run in one breath and cannot be interrupted.
              </p>
              <p>
                <strong>So no lock is needed.</strong> This is a real, concrete benefit of
                the JavaScript concurrency model, and the reason this task can be written
                so short.
              </p>
            </>
          ),
          code: [
            real(
              "ts",
              `const i = nextIndex;   // 记下我抢到的号
nextIndex++;           // 立刻把游标推进，别人抢不到同一个
                       // ↑ 这两行之间没有 await，不会被打断`,
              {
                sourceFile: "react-notes-app/q2/taskRunner.ts",
                codeEn: `const i = nextIndex;   // remember the number I grabbed
nextIndex++;           // move the cursor at once so nobody grabs the same one
                       // ↑ no await between these two lines, so nothing interrupts them`,
              },
            ),
          ],
        },
        {
          id: "step-by-step",
          heading: "分步写出来",
          headingEn: "Writing it one step at a time",
          body: (
            <>
              <p><strong>第一步：结果数组和游标。</strong></p>
              <p>
                <strong>第二步：worker 的循环体。</strong>
                注意 <code>await tasks[i]()</code> —— 那对括号不能少，
                <code>tasks[i]</code> 是函数，要调用它才产生 Promise。
                <code>try/catch</code> 把失败接住写成 <code>rejected</code>，
                <strong>然后循环继续</strong> —— 这就是「NEVER throws」的实现方式。
              </p>
              <p>
                <strong>第三步：启动 worker 并等待。</strong>
                <code>Math.min(limit, tasks.length)</code> 是个细节：
                3 个任务、上限 10，只需要开 3 个 worker，
                多开的会立刻发现队列空了然后退出 —— 没坏处，但没必要。
              </p>
              <p>
                <strong>第四步：空数组早退。</strong>
                <code>tasks.length === 0</code> 时直接返回 <code>[]</code>。
                其实不加也对（0 个 worker，Promise.all([]) 立刻 resolve，
                返回空数组），但显式写出来更清楚。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p><strong>Step one: the result array and the cursor.</strong></p>
              <p>
                <strong>Step two: the body of the worker loop.</strong>{" "}
                Watch <code>await tasks[i]()</code> — that pair of parentheses is not
                optional. <code>tasks[i]</code> is a function; calling it is what produces
                a Promise.{" "}
                <code>try/catch</code> catches the failure and writes it as{" "}
                <code>rejected</code>, <strong>and then the loop keeps going</strong> —
                that is how &ldquo;NEVER throws&rdquo; gets implemented.
              </p>
              <p>
                <strong>Step three: start the workers and wait.</strong>
                <code>Math.min(limit, tasks.length)</code> is a small detail:
                3 tasks with a cap of 10 only needs 3 workers,
                and any extras would immediately find the queue empty and exit —
                harmless, but pointless.
              </p>
              <p>
                <strong>Step four: the early return for an empty array.</strong>{" "}
                When <code>tasks.length === 0</code>, return <code>[]</code> straight away.
                Leaving it out is also correct (0 workers, Promise.all([]) resolves
                instantly, empty array back), but writing it out says so plainly.
              </p>
            </>
          ),
          code: [
            demo(
              "ts",
              `// 第一步
const results: SettledResult<T>[] = new Array(tasks.length);
let nextIndex = 0;`,
              {
                filename: "推导 · 第一步",
                filenameEn: "Working it out · step one",
                codeEn: `// Step one
const results: SettledResult<T>[] = new Array(tasks.length);
let nextIndex = 0;`,
              },
            ),
            demo(
              "ts",
              `// 第二步：一个 worker 不停地抢活
const worker = async () => {
  while (nextIndex < tasks.length) {
    const i = nextIndex;
    nextIndex++;

    try {
      const value = await tasks[i]();          // ← 括号！调用它才开始跑
      results[i] = { status: "fulfilled", value };
    } catch (reason) {
      results[i] = { status: "rejected", reason };
    }
    // catch 之后不 return，循环继续 → 一个失败不连累别人
  }
};`,
              {
                filename: "推导 · 第二步",
                filenameEn: "Working it out · step two",
                codeEn: `// Step two: one worker keeps taking the next job
const worker = async () => {
  while (nextIndex < tasks.length) {
    const i = nextIndex;
    nextIndex++;

    try {
      const value = await tasks[i]();          // ← the parentheses! calling it is what starts it
      results[i] = { status: "fulfilled", value };
    } catch (reason) {
      results[i] = { status: "rejected", reason };
    }
    // no return after catch, the loop keeps going → one failure does not stop the others
  }
};`,
              },
            ),
            demo(
              "ts",
              `// 第三步：开 limit 个 worker，等它们全收工
const workerCount = Math.min(limit, tasks.length);
const workers: Promise<void>[] = [];
for (let w = 0; w < workerCount; w++) {
  workers.push(worker());        // 这里的括号是「启动这个 worker」
}
await Promise.all(workers);
return results;`,
              {
                filename: "推导 · 第三步",
                filenameEn: "Working it out · step three",
                codeEn: `// Step three: start limit workers and wait for all of them
const workerCount = Math.min(limit, tasks.length);
const workers: Promise<void>[] = [];
for (let w = 0; w < workerCount; w++) {
  workers.push(worker());        // these parentheses mean "start this worker"
}
await Promise.all(workers);
return results;`,
              },
            ),
          ],
        },
        {
          id: "full-solution",
          heading: "完整答案",
          headingEn: "The complete answer",
          lede: "这就是项目里的实现，已实测跑通。",
          ledeEn: "This is the implementation in the project, and it has been run and checked.",
          body: (
            <>
              <p>
                把四步拼起来。这份代码和 <code>react-notes-app/q2/taskRunner.ts</code>
                里的实现完全一致，<code>npm run q2</code> 实测通过三条验收标准。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Put the four steps together. This code is identical to the implementation
                in <code>react-notes-app/q2/taskRunner.ts</code>, and <code>npm run q2</code>{" "}
                was run here and met all three acceptance criteria.
              </p>
            </>
          ),
          code: [
            real("ts", TASK_RUNNER_SOLUTION, {
              filename: "q2/taskRunner.ts（完整实现）",
              filenameEn: "q2/taskRunner.ts (the complete implementation)",
              sourceFile: "react-notes-app/q2/taskRunner.ts",
              highlight: [5, 7, 11, 12, 15, 20, 26, 27, 28, 30],
            }),
          ],
        },
        {
          id: "verify",
          heading: "验证：读懂这段输出",
          headingEn: "Checking your work: how to read this output",
          body: (
            <>
              <p>本机实测的完整输出。三条验收标准逐条对照：</p>
              <ul>
                <li>
                  <strong>并发不超 2</strong> ——
                  盯住 <code>running now</code> 那一列，
                  它在 1 和 2 之间来回，从来没到 3。✓
                </li>
                <li>
                  <strong>顺序与输入一致</strong> ——
                  <code>#1</code> 是 task 1 的结果，尽管它耗时 300ms、
                  是第二个完成的。✓
                </li>
                <li>
                  <strong>失败不连累别人</strong> ——
                  task 3 FAIL 之后，5、6 照常启动并完成，
                  <code>#3</code> 是 <code>rejected</code>，其余是 <code>fulfilled</code>。✓
                </li>
              </ul>
              <p>
                另外注意 <code>task 3 FAIL (running now: 1)</code> 这一行：
                失败也让槽位空了出来，紧接着 task 5 就启动了。
                <strong>失败和成功对调度器是一样的 —— 都只是「一个槽位空了」。</strong>
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>The full output as measured on this machine. Check the three criteria one by one:</p>
              <ul>
                <li>
                  <strong>Concurrency never above 2</strong> —
                  follow the <code>running now</code> column;
                  it bounces between 1 and 2 and never reaches 3. ✓
                </li>
                <li>
                  <strong>Order matches the input</strong> —
                  <code>#1</code> is task 1&rsquo;s result even though it took 300ms and
                  finished second. ✓
                </li>
                <li>
                  <strong>A failure does not drag the others down</strong> —
                  after task 3 FAIL, 5 and 6 start and finish as usual,
                  <code>#3</code> is <code>rejected</code> and the rest are{" "}
                  <code>fulfilled</code>. ✓
                </li>
              </ul>
              <p>
                Also look at the line <code>task 3 FAIL (running now: 1)</code>:
                a failure frees a slot too, and task 5 starts right after it.{" "}
                <strong>Failure and success look the same to the scheduler — both are just
                &ldquo;a slot opened up&rdquo;.</strong>
              </p>
            </>
          ),
          code: [
            real(
              "text",
              `$ npm run q2

task 1 START   (running now: 1)
task 2 START   (running now: 2)     ← 到上限，3 号排队
task 2 DONE    (running now: 1)
task 3 START   (running now: 2)     ← 有槽位立刻补
task 1 DONE    (running now: 1)
task 4 START   (running now: 2)
task 3 FAIL    (running now: 1)     ← 失败也只是空出槽位
task 5 START   (running now: 2)
task 4 DONE    (running now: 1)
task 6 START   (running now: 2)
task 5 DONE    (running now: 1)
task 6 DONE    (running now: 0)

=== FINAL RESULTS (must be in original order) ===
#1 { status: 'fulfilled', value: 'result of task 1' }
#2 { status: 'fulfilled', value: 'result of task 2' }
#3 {
  status: 'rejected',
  reason: Error: task 3 failed
      at Timeout._onTimeout (.../q2/demo.ts:18:18)
}
#4 { status: 'fulfilled', value: 'result of task 4' }
#5 { status: 'fulfilled', value: 'result of task 5' }
#6 { status: 'fulfilled', value: 'result of task 6' }`,
              {
                filename: "本机实测输出",
                codeEn: `$ npm run q2

task 1 START   (running now: 1)
task 2 START   (running now: 2)     ← at the limit, task 3 waits
task 2 DONE    (running now: 1)
task 3 START   (running now: 2)     ← a slot opened, filled at once
task 1 DONE    (running now: 1)
task 4 START   (running now: 2)
task 3 FAIL    (running now: 1)     ← a failure frees a slot too
task 5 START   (running now: 2)
task 4 DONE    (running now: 1)
task 6 START   (running now: 2)
task 5 DONE    (running now: 1)
task 6 DONE    (running now: 0)

=== FINAL RESULTS (must be in original order) ===
#1 { status: 'fulfilled', value: 'result of task 1' }
#2 { status: 'fulfilled', value: 'result of task 2' }
#3 {
  status: 'rejected',
  reason: Error: task 3 failed
      at Timeout._onTimeout (.../q2/demo.ts:18:18)
}
#4 { status: 'fulfilled', value: 'result of task 4' }
#5 { status: 'fulfilled', value: 'result of task 5' }
#6 { status: 'fulfilled', value: 'result of task 6' }`,
                filenameEn: "The real output from running it here",
                sourceFile: "react-notes-app",
              },
            ),
          ],
        },
      ],
      exercises: [
        {
          kind: "fill-blank",
          id: "r-q2-blanks",
          title: "补全 worker pool 的五个关键位置",
          level: 2,
          prompt: (
            <p>
              五个空。第 2 个和第 4 个是最容易写错的 ——
              一个关系到「顺序」，一个关系到「任务到底有没有被启动」。
            </p>
          ),
          language: "ts",
          filename: "q2/taskRunner.ts",
          sourceFile: "react-notes-app/q2/taskRunner.ts",
          template: `export async function runTasks<T>(
  tasks: Task<T>[],
  limit: number,
): Promise<SettledResult<T>[]> {
  const results: SettledResult<T>[] = new Array(tasks.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex ___1___ tasks.length) {
      const i = nextIndex;
      nextIndex++;

      try {
        const value = await ___2___;
        results[___3___] = { status: "fulfilled", value };
      } catch (reason) {
        results[i] = { status: "___4___", reason };
      }
    }
  };

  const workerCount = Math.___5___(limit, tasks.length);
  const workers: Promise<void>[] = [];
  for (let w = 0; w < workerCount; w++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}`,
          blanks: [
            {
              n: 1,
              accept: ["<"],
              hint: "游标从 0 开始，最后一个有效下标是 length - 1。",
              why: (
                <>
                  <code>&lt;</code>。下标从 0 到 <code>length - 1</code>，
                  所以条件是 <code>nextIndex &lt; tasks.length</code>。
                  <br />
                  写成 <code>&lt;=</code> 会多跑一轮，
                  <code>tasks[length]</code> 是 <code>undefined</code>，
                  调用它会抛 <code>TypeError: tasks[i] is not a function</code>——
                  然后被 catch 接住，静默产生一条多余的 rejected 结果。
                  <strong>一个不报错但结果多一条的 bug。</strong>
                </>
              ),
              width: 4,
            },
            {
              n: 2,
              accept: ["tasks[i]()"],
              hint: "tasks[i] 是一个函数。要让它开始跑，还差什么？",
              why: (
                <>
                  <code>tasks[i]()</code> —— <strong>括号不能少</strong>。
                  <br />
                  <code>await tasks[i]</code>（没括号）是在 await 一个函数对象。
                  <code>await</code> 遇到非 Promise 会立刻放行，
                  于是 <code>value</code> 变成那个函数本身，
                  而任务<strong>根本没被执行过</strong>。
                  症状：<code>npm run q2</code> 一行 START 都不打印，
                  结果里全是函数。
                </>
              ),
              width: 12,
            },
            {
              n: 3,
              accept: ["i"],
              hint: "顺序保证的秘密就在这里。结果要写到哪个位置？",
              why: (
                <>
                  <code>i</code> —— 也就是这个任务在<strong>输入数组里的原始下标</strong>。
                  <br />
                  <strong>这一个字母就是「顺序与输入一致」的全部实现。</strong>
                  换成 <code>results.push(...)</code> 会变成「谁先完成谁在前」，
                  顺序就乱了。
                </>
              ),
              width: 4,
            },
            {
              n: 4,
              accept: ["rejected"],
              hint: "看 SettledResult 类型定义里失败分支的 status 字面量。",
              why: (
                <>
                  <code>rejected</code>。必须<strong>一字不差</strong> ——
                  它是可辨识联合的判别标签，
                  写成 <code>&quot;reject&quot;</code> 或
                  <code>&quot;failed&quot;</code> 都会类型报错。
                </>
              ),
              width: 10,
            },
            {
              n: 5,
              accept: ["min"],
              hint: "3 个任务、上限 10，应该开几个 worker?",
              why: (
                <>
                  <code>min</code>。开 <code>Math.min(limit, tasks.length)</code> 个。
                  <br />
                  用 <code>max</code> 就成了「3 个任务开 10 个 worker」——
                  多出来的 7 个会立刻发现队列空了然后退出，
                  结果仍然正确，但白开了 7 个。
                </>
              ),
              width: 5,
            },
          ],
        },
        {
          kind: "code-completion",
          id: "r-q2-write",
          title: "从签名开始，自己写出整个 runTasks",
          level: 3,
          prompt: (
            <p>
              只给签名。这是 Q2 的完整答案，写对了这道题就通了。
              写完可以在本机 <code>npm run q2</code> 验证。
            </p>
          ),
          language: "ts",
          filename: "q2/taskRunner.ts",
          sourceFile: "react-notes-app/q2/taskRunner.ts",
          starter: `export type Task<T> = () => Promise<T>;

export type SettledResult<T> =
  | { status: "fulfilled"; value: T }
  | { status: "rejected"; reason: unknown };

export async function runTasks<T>(
  tasks: Task<T>[],
  limit: number,
): Promise<SettledResult<T>[]> {

}`,
          requirements: [
            "同一时刻最多 limit 个任务在运行",
            "某个任务结束后，立刻启动下一个（不是等一批都结束）",
            "任何任务失败都不能让整体抛错",
            "返回数组的顺序必须与 tasks 一致",
            "成功写 { status: \"fulfilled\", value }，失败写 { status: \"rejected\", reason }",
          ],
          checks: [
            { label: "预分配了结果数组（new Array 或等价写法）", must: "new Array\\s*\\(|results\\s*:\\s*SettledResult" },
            { label: "有一个共享游标（let 声明的下标变量）", must: "let\\s+\\w*[Ii]ndex" },
            { label: "调用了任务函数（tasks[...] 后面有括号）", must: "tasks\\s*\\[[^\\]]+\\]\\s*\\(" },
            { label: "用 try/catch 接住失败", must: "try[\\s\\S]*catch" },
            { label: "按下标写回结果，保证顺序", must: "results\\s*\\[" },
            { label: "没有用 push 收集结果（会打乱顺序）", mustNot: "results\\.push" },
            { label: "写了 fulfilled 状态", must: '"fulfilled"' },
            { label: "写了 rejected 状态", must: '"rejected"' },
            { label: "用 Promise.all 等所有 worker 收工", must: "Promise\\.all" },
            { label: "没有一次性全部启动（不是 tasks.map(t => t())）", mustNot: "tasks\\.map\\s*\\(\\s*\\(?\\s*\\w+\\s*\\)?\\s*=>\\s*\\w+\\s*\\(\\s*\\)" },
          ],
          hints: [
            "并发上限怎么天然实现？如果你只开 limit 个「工人」，每个工人同时只做一件事，那同时在跑的任务自然不会超过 limit。",
            "需要四样东西：① 长度固定的结果数组 ② 一个所有工人共用的游标 ③ 一个循环着抢任务的 async 函数 ④ 启动 limit 个然后 Promise.all 等它们。顺序靠「按原始下标写回」保证。",
            `const results = 长度为 tasks.length 的数组；
let nextIndex = 0;
const worker = async () => {
  while (还有没做的) {
    const i = nextIndex; nextIndex++;
    try { results[i] = 成功结果 } catch { results[i] = 失败结果 }
  }
};
开 min(limit, 长度) 个 worker，await Promise.all，return results`,
            `const results: SettledResult<T>[] = new Array(tasks.length);
let nextIndex = 0;
const worker = async () => {
  while (nextIndex < tasks.length) {
    const i = nextIndex;
    nextIndex++;
    try {
      const value = await tasks[i]();
      results[i] = { status: "fulfilled", value };
    } catch (reason) {
      results[i] = { status: "rejected", reason };
    }
  }
};
// 剩下的：开 worker、Promise.all、return`,
          ],
          solution: real("ts", TASK_RUNNER_SOLUTION, {
            filename: "参考答案（与项目实现一致，npm run q2 实测通过）",
            sourceFile: "react-notes-app/q2/taskRunner.ts",
          }),
        },
        {
          kind: "debug",
          id: "r-debug-q2-no-parens",
          title: "Debug Lab · 一行 START 都没打印",
          level: 2,
          prompt: (
            <p>
              跑 <code>npm run q2</code>，没有报错，但一行
              <code>task N START</code> 都没有，直接就出结果了 ——
              而且结果里的 value 长得很奇怪。
            </p>
          ),
          errorOutput: `$ npm run q2

=== FINAL RESULTS (must be in original order) ===
#1 { status: 'fulfilled', value: [Function (anonymous)] }
#2 { status: 'fulfilled', value: [Function (anonymous)] }
#3 { status: 'fulfilled', value: [Function (anonymous)] }
#4 { status: 'fulfilled', value: [Function (anonymous)] }
#5 { status: 'fulfilled', value: [Function (anonymous)] }
#6 { status: 'fulfilled', value: [Function (anonymous)] }

# 注意：
#   - 一行 "task N START" 都没有
#   - 应该 reject 的 task 3 也变成了 fulfilled
#   - value 是函数，不是 "result of task N"`,
          broken: demo(
            "ts",
            `const worker = async () => {
  while (nextIndex < tasks.length) {
    const i = nextIndex;
    nextIndex++;

    try {
      const value = await tasks[i];
      results[i] = { status: "fulfilled", value };
    } catch (reason) {
      results[i] = { status: "rejected", reason };
    }
  }
};`,
            { filename: "有问题的 worker", highlight: [7] },
          ),
          classify: {
            options: [
              { id: "a", label: "并发控制错误 —— worker 数量算错了" },
              { id: "b", label: "函数与返回值混淆 —— await 了函数本身，任务从未被调用" },
              { id: "c", label: "顺序错误 —— 用了 push 而不是下标" },
              { id: "d", label: "类型错误 —— SettledResult 写错了" },
            ],
            answer: "b",
          },
          locate: {
            question: "第 7 行少了什么？",
            options: [
              { id: "a", label: "少了一对调用括号：应该是 await tasks[i]()" },
              { id: "b", label: "少了 async 关键字" },
              { id: "c", label: "少了 .then()" },
              { id: "d", label: "应该写成 await Promise.resolve(tasks[i])" },
            ],
            answer: "a",
          },
          fixed: real(
            "ts",
            `const value = await tasks[i]();
//                          ↑ 括号：调用它，任务才真的开始跑`,
            {
              filename: "改对之后",
              sourceFile: "react-notes-app/q2/taskRunner.ts",
            },
          ),
          rootCause: (
            <>
              <p>
                <code>tasks[i]</code> 的类型是 <code>Task&lt;T&gt;</code>，
                也就是 <code>() =&gt; Promise&lt;T&gt;</code> ——
                <strong>一个函数</strong>，不是 Promise。
              </p>
              <p>
                <code>await</code> 一个非 Promise 的值时，
                它会<strong>立刻放行并把这个值原样返回</strong>。
                所以 <code>value</code> 变成了那个函数对象，
                而函数体（里面的 <code>running++</code>、
                <code>console.log</code>、<code>setTimeout</code>）
                <strong>一次都没执行过</strong>。
              </p>
              <p>
                三个症状互相印证：没有 START 打印（函数体没跑）、
                task 3 没 reject（reject 在函数体里）、
                value 是函数（await 原样返回）。
              </p>
              <p>
                <strong>这个 bug 完全不报错</strong>，
                TypeScript 也拦不住（<code>await</code> 非 Promise 是合法的，
                只会有个 lint 提示）。识别特征：
                <strong>「结果里出现 [Function] 或 Promise 对象」
                = 少写了括号，或者多写了括号。</strong>
              </p>
            </>
          ),
          verify: "npm run q2   # 应该看到 task N START，且 running now 不超过 2",
        },
      ],
      mistakes: [
        {
          wrong: demo(
            "ts",
            `// ✗ 用 push 收集结果 —— 顺序按完成时间排，不是按输入顺序
try {
  const value = await tasks[i]();
  results.push({ status: "fulfilled", value });
} catch (reason) {
  results.push({ status: "rejected", reason });
}`,
          ),
          why: (
            <>
              <code>push</code> 按<strong>完成时间</strong>追加。
              task 2（100ms）会排在 task 1（300ms）前面，
              于是 <code>#1</code> 变成了 task 2 的结果。
              违反「IN THE SAME ORDER as tasks」。
              <br />
              <strong>正解是预分配数组 + 按原始下标 <code>results[i]</code> 写回。</strong>
            </>
          ),
          whyEn: (
            <>
              <code>push</code> appends in <strong>finish order</strong>. Task 2 (100ms)
              lands before task 1 (300ms), so <code>#1</code> holds the result of task 2.
              That breaks the requirement to return results IN THE SAME ORDER as tasks.
              <br />
              <strong>
                The right answer: create the array up front and write each result to its
                original index, <code>results[i]</code>.
              </strong>
            </>
          ),
        },
        {
          wrong: demo(
            "ts",
            `// ✗ catch 之后 return，一个失败就停掉整个 worker
try {
  const value = await tasks[i]();
  results[i] = { status: "fulfilled", value };
} catch (reason) {
  results[i] = { status: "rejected", reason };
  return;                       // ← 这个 worker 死了
}`,
          ),
          why: (
            <>
              task 3 失败后，那个 worker 直接退出，
              剩下的任务只能靠另一个 worker 慢慢做 ——
              并发实际降到 1，而且如果两个 worker 都遇到失败，
              后面的任务永远不会被执行，
              <code>results</code> 里留下 <code>undefined</code> 的洞。
              <br />
              <strong>catch 里只记录，不中断循环。</strong>
            </>
          ),
          whyEn: (
            <>
              After task 3 fails, that worker exits. The remaining tasks are left to the
              other worker alone, so the real concurrency drops to 1. And if both workers
              hit a failure, the later tasks never run at all, which leaves{" "}
              <code>undefined</code> holes in <code>results</code>.
              <br />
              <strong>
                In the catch block, record what happened and let the loop continue.
              </strong>
            </>
          ),
        },
        {
          wrong: demo(
            "ts",
            `// ✗ 每个 worker 各自维护一份游标
const worker = async () => {
  let nextIndex = 0;            // ← let 写在了函数里面
  while (nextIndex < tasks.length) { ... }
};`,
          ),
          why: (
            <>
              游标写在 worker 内部，每个 worker 就有<strong>自己的一份</strong>，
              于是每个 worker 都从 0 开始把所有任务做一遍 ——
              limit=2 时每个任务被执行两次，并发数冲到 2 倍。
              <br />
              <strong>游标必须在 worker 外面声明，
              靠闭包被所有 worker 共享。</strong>
            </>
          ),
          whyEn: (
            <>
              With the cursor declared inside the worker, every worker gets{" "}
              <strong>its own copy</strong>, so every worker starts at 0 and runs all the
              tasks. With limit=2 each task runs twice, and the number running at once is
              double what it should be.
              <br />
              <strong>
                Declare the cursor outside the worker, so the closure shares one cursor
                between all workers.
              </strong>
            </>
          ),
        },
      ],
      transfer: [
        { signal: "「限制并发数」「连接池」「批量上传限速」", signalEn: "Wording like: limit concurrency, a connection pool, rate-limited bulk upload", reachFor: "worker pool：共享游标 + limit 个 worker", reachForEn: "A worker pool: one shared cursor plus limit workers" },
        { signal: "「结果顺序必须与输入一致」", signalEn: "The wording: results must be in the same order as the input", reachFor: "预分配数组 + results[i] 写回，别用 push", reachForEn: "Create the array up front and write results[i]; do not use push" },
        { signal: "「失败也要继续」", signalEn: "The wording: keep going even when one fails", reachFor: "try/catch 在循环体内，catch 里不 return", reachForEn: "Put try/catch inside the loop body, and do not return from the catch" },
        { signal: "结果里出现 [Function] 或 Promise {}", signalEn: "A result prints as [Function] or as Promise {}", reachFor: "括号写少了或写多了", reachForEn: "You left out a pair of call parentheses, or added an extra pair" },
        { signal: "任务被重复执行", signalEn: "A task runs more than once", reachFor: "游标是不是被声明在了 worker 内部", reachForEn: "Check whether the cursor was declared inside the worker" },
      ],
      recap: [
        "worker pool 四个零件：预分配结果数组、共享游标、循环抢活的 worker、limit 个 worker + Promise.all。",
        "并发上限来自「worker 的个数」，顺序来自「按原始下标写回」—— 两件难事都不需要额外代码。",
        "JavaScript 单线程，游标那两行之间没有 await，所以不需要加锁。",
        "await tasks[i]() 的括号是关键；少了它任务根本不会被执行，而且不报错。",
        "catch 里只记录不中断，这才叫「NEVER throws」。",
      ],
      recapEn: [
        "The four parts of a worker pool: a result array created up front, one shared cursor, a worker that loops and takes the next job, and limit workers run with Promise.all.",
        "The concurrency limit comes from how many workers you start. The order comes from writing each result to its original index. Neither needs extra code.",
        "JavaScript runs on one thread, and there is no await between the two cursor lines, so no lock is needed.",
        "The parentheses in await tasks[i]() matter. Without them the task never runs, and nothing reports an error.",
        "The catch block records and keeps going. That is what NEVER throws means.",
      ],
    },
  ],
};

/* ================================================================
   模块 5：Debug Lab + 从零重写 + 迁移
   ================================================================ */

export const reactMastery: Module = {
  id: "react-mastery",
  stage: "React · 第 6 部分",
  title: "综合 Debug、从零重写与题型迁移",
  titleEn: "Mixed debugging, a full rebuild, and the same skills on a new question",
  summary:
    "把前面的错误集中练一遍，然后在没有答案的情况下从空文件重建整个 Q1 和 Q2。这一模块是「会看」和「会做」的分界线。",
  summaryEn:
    "Practise all the earlier mistakes in one place, then rebuild the whole of Q1 and Q2 from empty files with no answer to look at. This module is the line between being able to follow along and being able to do it yourself.",
  lessons: [
    /* ---------- 5.1 ---------- */
    {
      id: "r-debug-lab",
      title: "Debug Lab · React 十种典型故障",
      titleEn: "Debug Lab · ten typical React failures",
      blurb: "每一种都给真实报错（或真实的「没有报错」），你来判断、定位、修复、验证。",
      blurbEn: "Each failure comes with the real error message, or with the real silence. You decide what it is, find it, fix it, and check the fix.",
      minutes: 20,
      objectives: [
        "看到报错能先判断类型，再决定去哪个文件找",
        "认出「不报错」的那几类 bug 的特征症状",
        "养成「改完必须跑一遍验证」的习惯",
        "把错误信息和根因建立稳定的对应关系",
      ],
      objectivesEn: [
        "See an error and first decide its type, then decide which file to open",
        "Recognise the symptoms of the bugs that report no error at all",
        "Build the habit of running a check after every fix",
        "Build a reliable link between an error message and its root cause",
      ],
      whyForAssessment:
        "考场上大部分时间不是在写新代码，是在查为什么不对。会读报错的人和不会读的人，同样的知识水平能差出一倍速度。",
      whyForAssessmentEn:
        "During the exam most of your time is not spent writing new code. It is spent finding out why the code is wrong. With the same knowledge, someone who reads error messages well works about twice as fast as someone who does not.",
      sourceFiles: [
        { path: "react-notes-app/src/", role: "所有故障都基于这个项目的真实代码" },
      ],
      concepts: [
        {
          id: "triage",
          heading: "先分诊：这个报错属于哪一类",
          headingEn: "Sort it first: which kind of error is this?",
          lede: "拿到报错的第一件事不是改代码，是归类。",
          ledeEn: "The first thing to do with an error is not to change code. It is to put the error in a category.",
          body: (
            <>
              <p>React 项目的故障基本就这五类。归对类，排查范围立刻缩小：</p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>类别</th>
                      <th>典型信号</th>
                      <th>去哪找</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>模块 / 路径</strong></td>
                      <td>Failed to resolve import、Cannot find module</td>
                      <td>import 语句、文件是否存在、大小写</td>
                    </tr>
                    <tr>
                      <td><strong>类型</strong></td>
                      <td>TS2345 / TS2339 / TS2322</td>
                      <td>类型定义文件、props 接口</td>
                    </tr>
                    <tr>
                      <td><strong>渲染循环</strong></td>
                      <td>Maximum update depth exceeded、页面卡死</td>
                      <td>useEffect 依赖数组、onClick 是否被立刻调用</td>
                    </tr>
                    <tr>
                      <td><strong>状态更新</strong></td>
                      <td><strong>没有报错</strong>，但界面不动</td>
                      <td>是否改了原对象（push / splice / 直接赋值）</td>
                    </tr>
                    <tr>
                      <td><strong>测试查询</strong></td>
                      <td>Unable to find an element / found multiple</td>
                      <td>testid 拼写、元素是否存在、await 是否漏了</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>最难的是第四类 —— 没有报错的那一类。</strong>
                它的特征是「<code>console.log</code> 数据是对的，
                但屏幕上没反应」。看到这个组合，
                直接去查有没有修改原对象。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>Faults in a React project come in five kinds. Get the kind right and the search space shrinks immediately:</p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Kind</th>
                      <th>Typical signal</th>
                      <th>Where to look</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Module / path</strong></td>
                      <td>Failed to resolve import, Cannot find module</td>
                      <td>The import statement, whether the file exists, letter case</td>
                    </tr>
                    <tr>
                      <td><strong>Types</strong></td>
                      <td>TS2345 / TS2339 / TS2322</td>
                      <td>Type definition files, props interfaces</td>
                    </tr>
                    <tr>
                      <td><strong>Render loop</strong></td>
                      <td>Maximum update depth exceeded, the page freezes</td>
                      <td>The useEffect dependency array, whether onClick is called immediately</td>
                    </tr>
                    <tr>
                      <td><strong>State update</strong></td>
                      <td><strong>No error</strong>, but the UI does not move</td>
                      <td>Whether the original object was mutated (push / splice / direct assignment)</td>
                    </tr>
                    <tr>
                      <td><strong>Test query</strong></td>
                      <td>Unable to find an element / found multiple</td>
                      <td>testid spelling, whether the element exists, whether an await is missing</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                <strong>The fourth kind is the hard one — the one with no error.</strong>{" "}
                Its signature is &ldquo;<code>console.log</code> shows the right data,
                but nothing happens on screen&rdquo;. See that combination and go straight
                to looking for a mutated original object.
              </p>
            </>
          ),
        },
        {
          id: "no-error-bugs",
          heading: "「不报错」的四种 bug，记住它们的症状",
          headingEn: "Four bugs that report no error: learn their symptoms",
          body: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>症状</th>
                      <th>根因</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>数据变了，界面不动</td>
                      <td>改了原数组/对象（push、splice、直接赋值）</td>
                    </tr>
                    <tr>
                      <td>组件完全不显示，控制台干净</td>
                      <td>组件名小写开头，被当成 HTML 标签</td>
                    </tr>
                    <tr>
                      <td>列表空白，但数据有值</td>
                      <td>map 回调用了花括号却忘了 return</td>
                    </tr>
                    <tr>
                      <td>点了「更新」毫无反应</td>
                      <td>匹配用的 id 被改过，map 一条都匹配不上</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                这四种在前面的课里都各自练过一次。
                下面的练习是把它们放在一起，不告诉你是哪一种。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Symptom</th>
                      <th>Root cause</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>The data changed, the UI did not</td>
                      <td>The original array or object was mutated (push, splice, direct assignment)</td>
                    </tr>
                    <tr>
                      <td>The component does not show at all, console is clean</td>
                      <td>The component name starts lowercase, so it is treated as an HTML tag</td>
                    </tr>
                    <tr>
                      <td>The list is blank although the data has values</td>
                      <td>The map callback uses braces and forgets to return</td>
                    </tr>
                    <tr>
                      <td>Clicking Update does nothing</td>
                      <td>The id used for matching was changed, so map matches nothing</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Each of these four was practised once in an earlier lesson.
                The exercises below mix them together without telling you which is which.
              </p>
            </>
          ),
        },
        {
          id: "verify-habit",
          heading: "改完必须验证 —— 而且要验证到题面要求那一层",
          headingEn: "Always check a fix, and check it against what the question asked for",
          body: (
            <>
              <p>
                这个项目的验证有两层，缺一不可：
              </p>
              <ol>
                <li>
                  <code>npx vitest run</code> —— 及格线。
                  4 个测试全过说明没有低级错误。
                </li>
                <li>
                  <code>npm run dev</code> + 手动三个场景 —— 真正的正确性。
                  加三条同名笔记删中间那条（验「按 id」）、
                  编辑中间那条（验「原位置」）、
                  更新完看按钮是否回到 Add（验「退出编辑模式」）。
                </li>
              </ol>
              <p>
                Q2 那边的验证是 <code>npm run q2</code>，
                盯 <code>running now</code> 不超过 limit、
                最终顺序与输入一致、失败的那条以 rejected 出现。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Verification in this project has two layers, and you need both:
              </p>
              <ol>
                <li>
                  <code>npx vitest run</code> — the pass mark.
                  4 tests green means there are no basic mistakes.
                </li>
                <li>
                  <code>npm run dev</code> plus three manual scenarios — actual correctness.
                  Add three same-named notes and delete the middle one (checks &ldquo;by
                  id&rdquo;), edit the middle one (checks &ldquo;in place&rdquo;),
                  and after an update see whether the button is Add again (checks
                  &ldquo;leave edit mode&rdquo;).
                </li>
              </ol>
              <p>
                Over on the Q2 side the check is <code>npm run q2</code>:
                watch that <code>running now</code> never exceeds limit,
                that the final order matches the input,
                and that the failing task appears as rejected.
              </p>
            </>
          ),
        },
      ],
      exercises: [
        {
          kind: "debug",
          id: "r-lab-import-path",
          title: "故障 1 · 路径大小写",
          level: 2,
          prompt: (
            <p>
              新建了组件之后启动开发服务器，Vite 直接报错，页面白屏。
            </p>
          ),
          errorOutput: `[plugin:vite:import-analysis] Failed to resolve import
  "./components/notemanager" from "src/App.tsx". Does the file exist?

  /Users/me/react-notes-app/src/App.tsx:1:24
  1  |  import NoteManager from "./components/notemanager";
     |                          ^`,
          broken: demo(
            "tsx",
            `import NoteManager from "./components/notemanager";

function App() {
  return <NoteManager />;
}`,
            { filename: "src/App.tsx", highlight: [1] },
          ),
          classify: {
            options: [
              { id: "a", label: "模块解析错误 —— 路径写错了" },
              { id: "b", label: "类型错误" },
              { id: "c", label: "渲染循环" },
              { id: "d", label: "状态更新错误" },
            ],
            answer: "a",
          },
          locate: {
            question: "具体错在哪？",
            options: [
              { id: "a", label: "目录名大小写不对，实际是 NoteManager" },
              { id: "b", label: "应该写 ../components/NoteManager" },
              { id: "c", label: "应该加 .tsx 后缀" },
              { id: "d", label: "应该用花括号：import { NoteManager }" },
            ],
            answer: "a",
          },
          fixed: real(
            "tsx",
            `import NoteManager from "./components/NoteManager";`,
            { filename: "改对之后", sourceFile: "react-notes-app/src/App.tsx" },
          ),
          rootCause: (
            <>
              <p>
                目录的真实名字是 <code>NoteManager</code>（大写 N 和 M）。
              </p>
              <p>
                <strong>这个 bug 在 macOS 上特别阴险</strong>：
                macOS 默认文件系统<strong>不区分大小写</strong>，
                所以有时候本地能跑；但 Vite 的模块解析、
                以及 Linux 上的 CI，<strong>都是区分的</strong>。
                于是出现「我这里好的，一提交就挂」。
              </p>
              <p>
                注意选项 C：这个项目走 Vite，
                <strong>可以</strong>省略扩展名（Vite 会自动补
                <code>/index.tsx</code>）。所以加后缀不是必需的 ——
                不像上一门课讲的原生 ESM 那样强制。
                <strong>同一件事在不同环境下规则不同，
                这正是要读构建配置的原因。</strong>
              </p>
            </>
          ),
          verify: "npm run dev   # 页面应该正常显示表单和表格",
        },
        {
          kind: "debug",
          id: "r-lab-props-undefined",
          title: "故障 2 · props 名字对不上",
          level: 2,
          prompt: (
            <p>
              重构时把父组件传的 prop 名改了，子组件忘了跟着改。
              页面能显示，但点 Delete 直接崩。
            </p>
          ),
          errorOutput: `Uncaught TypeError: onDelete is not a function
    at onClick (NoteItem/index.tsx:18:29)
    at HTMLUnknownElement.callCallback

# 另外 TypeScript 那边也在报：
src/components/NoteTable/index.tsx(20,7): error TS2322: Type
  '{ key: number; note: Note; onRemove: (id: number) => void; onEdit: ... }'
  is not assignable to type 'IntrinsicAttributes & NoteItemProps'.
  Property 'onDelete' is missing in type ... but required in type 'NoteItemProps'.`,
          broken: demo(
            "tsx",
            `// NoteTable 里传下去的名字：
<NoteItem
  key={note.id}
  note={note}
  onRemove={onDelete}       // ← 传的是 onRemove
  onEdit={onEdit}
/>

// NoteItem 的 props 接口和解构：
export interface NoteItemProps {
  note: Note;
  onDelete: (id: number) => void;   // ← 期望的是 onDelete
  onEdit: (note: Note) => void;
}
const NoteItem: React.FC<NoteItemProps> = ({ note, onDelete, onEdit }) => {`,
            { filename: "两处不一致", highlight: [5, 12] },
          ),
          classify: {
            options: [
              { id: "a", label: "模块解析错误" },
              { id: "b", label: "类型 / 契约错误 —— props 名字两边不一致" },
              { id: "c", label: "渲染循环" },
              { id: "d", label: "测试查询错误" },
            ],
            answer: "b",
          },
          locate: {
            question: "该改哪一边？",
            options: [
              { id: "a", label: "改 NoteTable：把 onRemove 改回 onDelete（子组件接口是契约，不该为调用方妥协）" },
              { id: "b", label: "改 NoteItem 的接口，把 onDelete 改成 onRemove" },
              { id: "c", label: "两边都保留，在 NoteItem 里写 onDelete ?? onRemove" },
              { id: "d", label: "把 NoteItemProps 里的 onDelete 改成可选的" },
            ],
            answer: "a",
          },
          fixed: real(
            "tsx",
            `<NoteItem
  key={note.id}
  note={note}
  onDelete={onDelete}
  onEdit={onEdit}
/>`,
            {
              filename: "改对之后",
              sourceFile: "react-notes-app/src/components/NoteTable/index.tsx",
            },
          ),
          rootCause: (
            <>
              <p>
                <strong>props 的名字就是组件的接口契约。</strong>
                <code>NoteItemProps</code> 声明了它需要 <code>onDelete</code>，
                调用方就必须传 <code>onDelete</code>。
              </p>
              <p>
                再看<strong>报错的顺序</strong>：
                TypeScript 的 TS2322 在<strong>编译期</strong>就报了，
                而 <code>onDelete is not a function</code> 是
                <strong>运行时</strong>才炸。
                <strong>先看编译期报错</strong> ——
                它更准确地指出了「哪一行传错了」。
              </p>
              <p>
                选项 D（把 <code>onDelete</code> 改成可选）是典型的
                「让编译器闭嘴」式修法：类型错误消失了，
                但运行时崩溃还在，而且更难查。
                <strong>类型报错是在帮你，别绕过它。</strong>
              </p>
            </>
          ),
          verify: "npx tsc --noEmit   # 不应再有 TS2322；然后 npx vitest run",
        },
        {
          kind: "debug",
          id: "r-lab-testid-typo",
          title: "故障 3 · 测试找不到元素",
          level: 2,
          prompt: (
            <p>
              代码看起来完全正确，手动点也没问题，但两个测试挂了。
            </p>
          ),
          errorOutput: `FAIL  src/NoteManager.test.tsx > adds a note
TestingLibraryElementError: Unable to find an element by:
  [data-testid="form-input"]

Ignored nodes: comments, script, style
<body>
  <div>
    <div class="layout-column ..." data-testid="note-manager">
      <div class="card ...">
        <form data-testid="note-form">
          <section class="layout-row ...">
            <label class="form-title-label">Title:</label>
            <input type="text" placeholder="Title" data-testid="title-input" ... />
            ...`,
          broken: demo(
            "tsx",
            `<input
  type="text"
  placeholder="Title"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  data-testid="title-input"
  className="form-input"
/>`,
            { filename: "src/components/NoteForm/index.tsx", highlight: [6] },
          ),
          classify: {
            options: [
              { id: "a", label: "受控输入错误" },
              { id: "b", label: "测试查询错误 —— data-testid 被改动了" },
              { id: "c", label: "状态更新错误" },
              { id: "d", label: "异步错误 —— 漏了 await" },
            ],
            answer: "b",
          },
          locate: {
            question: "第 6 行该是什么？",
            options: [
              { id: "a", label: 'data-testid="form-input"' },
              { id: "b", label: 'data-testid="input-title"' },
              { id: "c", label: 'testid="form-input"' },
              { id: "d", label: 'id="form-input"' },
            ],
            answer: "a",
          },
          fixed: real(
            "tsx",
            `data-testid="form-input"`,
            {
              filename: "改对之后",
              sourceFile: "react-notes-app/src/components/NoteForm/index.tsx",
            },
          ),
          rootCause: (
            <>
              <p>
                README 明确写了「<strong>不得修改任何 data-testid</strong>」。
                <code>form-input</code> 被改成了 <code>title-input</code>，
                测试的 <code>getByTestId(&quot;form-input&quot;)</code>
                自然找不到。
              </p>
              <p>
                <strong>读这个报错的技巧：</strong>
                Testing Library 失败时会<strong>把整个 DOM 打出来</strong>。
                在那段 DOM 里搜一下你期望的 testid，
                如果搜不到但看到一个长得很像的 —— 就是它被改名了。
                这比猜快得多。
              </p>
              <p>
                注意 <code>data-</code> 前缀不能省（选项 C），
                <code>data-*</code> 是 HTML 的自定义属性规范。
              </p>
            </>
          ),
          verify: "npx vitest run   # 4 passed",
        },
        {
          kind: "debug",
          id: "r-lab-silent-mutation",
          title: "故障 4 · 编辑后列表毫无变化（综合题）",
          level: 3,
          prompt: (
            <p>
              这一题不告诉你是哪一类。控制台干净，
              <code>console.log</code> 显示数据是对的。
              自己分诊。
            </p>
          ),
          errorOutput: `# 没有任何报错。
# 复现：添加 "A"、"B" 两条 → 点 B 的 Edit → 改成 "B2" → 点 Update
# 期望：列表变成 A、B2
# 实际：列表还是 A、B

# 在 handleSubmitNote 里插了日志：
console.log("submitted:", submittedNote);
// → submitted: { id: 1785737900978, title: 'B2', content: '...' }   ← 数据是对的
console.log("after:", notes);
// → after: [ {title:'A'...}, {title:'B2'...} ]                       ← 数组里也是对的！

# 但屏幕上还是 B。

# 测试结果：
#   ✕ edits a note in place`,
          broken: demo(
            "tsx",
            `const handleSubmitNote = (submittedNote: Note) => {
  if (noteToEdit) {
    const i = notes.findIndex((n) => n.id === submittedNote.id);
    notes[i] = submittedNote;
    setNotes(notes);
    setNoteToEdit(null);
  } else {
    setNotes((prev) => [...prev, submittedNote]);
  }
};`,
            { filename: "有问题的 handleSubmitNote", highlight: [4, 5] },
          ),
          classify: {
            options: [
              { id: "a", label: "模块解析错误" },
              { id: "b", label: "渲染循环" },
              { id: "c", label: "状态更新错误 —— 改了原数组，React 认为值没变" },
              { id: "d", label: "测试查询错误 —— 漏了 await" },
            ],
            answer: "c",
          },
          locate: {
            question: "病灶是哪两行的组合？",
            options: [
              { id: "a", label: "第 4、5 行：notes[i] = ... 改了原数组，setNotes(notes) 传的还是同一个引用" },
              { id: "b", label: "第 3 行：findIndex 应该用 find" },
              { id: "c", label: "第 6 行：setNoteToEdit(null) 应该在 setNotes 之前" },
              { id: "d", label: "第 8 行：新增分支写错了" },
            ],
            answer: "a",
          },
          fixed: real(
            "tsx",
            `const handleSubmitNote = (submittedNote: Note) => {
  if (noteToEdit) {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === submittedNote.id ? submittedNote : note,
      ),
    );
    setNoteToEdit(null);
  } else {
    setNotes((prev) => [...prev, submittedNote]);
  }
};`,
            {
              filename: "改对之后",
              sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
            },
          ),
          rootCause: (
            <>
              <p>
                <code>notes[i] = submittedNote</code> 修改了
                <strong>原数组本身</strong>。内容确实变了 ——
                这正是 <code>console.log</code> 显示正确的原因，
                也是这个 bug 最迷惑人的地方。
              </p>
              <p>
                但 <code>setNotes(notes)</code> 传进去的还是
                <strong>同一个数组对象</strong>。React 比较新旧值，
                发现是同一个引用，判断「没变化」，跳过重新渲染。
              </p>
              <p>
                <strong>这个组合症状值得背下来：</strong>
                「没有报错」+「日志里数据是对的」+「屏幕不动」
                = <strong>改了原对象</strong>。
                去找 <code>push</code>、<code>splice</code>、
                <code>arr[i] =</code>、<code>obj.x =</code> 这四种写法。
              </p>
              <p>
                顺带说：就算加上 <code>setNotes([...notes])</code>
                强行造个新数组也能「修好」这个 bug，
                但那是治症状不治病 —— 原数组已经被污染了，
                在有多处引用同一份数据时会引发更难查的问题。
                <strong>正解是从头到尾都不碰原数组。</strong>
              </p>
            </>
          ),
          verify: "npx vitest run   # 然后 npm run dev 手动加三条，编辑中间那条，确认位置不变",
        },
      ],
      transfer: [
        { signal: "Failed to resolve import", reachFor: "路径拼写 / 大小写 / 文件是否存在", reachForEn: "Check the spelling of the path, the upper and lower case, and whether the file exists" },
        { signal: "TS2322 Property 'x' is missing", reachFor: "props 名字两边对不上，改调用方", reachForEn: "The prop names do not match on the two sides; fix the caller" },
        { signal: "Unable to find an element by [data-testid=…]", reachFor: "在报错打印的 DOM 里搜相似 testid", reachForEn: "Search the DOM printed with the error for a similar data-testid" },
        { signal: "没报错 + 日志对 + 屏幕不动", signalEn: "No error, the logs look right, and the screen does not change", reachFor: "改了原对象：push / splice / arr[i]= / obj.x=", reachForEn: "You changed the original object: push / splice / arr[i]= / obj.x=" },
        { signal: "Maximum update depth exceeded", reachFor: "useEffect 依赖，或 onClick 写成了 fn()", reachForEn: "Look at the useEffect dependencies, or an onClick written as fn()" },
      ],
      recap: [
        "先分诊后动手：模块路径 / 类型 / 渲染循环 / 状态更新 / 测试查询。",
        "「不报错」的 bug 靠症状识别，其中最常见的是「改了原对象」。",
        "Testing Library 失败时会打印整个 DOM —— 在里面搜你期望的 testid。",
        "编译期报错比运行时报错更精确，先修编译期的。",
        "验证要到题面那一层：测试过 ≠ 做对，还得手动跑三个场景。",
      ],
      recapEn: [
        "Sort the error before you touch anything: module path, type, render loop, state update, or test query.",
        "Bugs with no error message are found by their symptoms, and the most common one is changing the original object.",
        "When Testing Library fails it prints the whole DOM. Search that output for the data-testid you expected.",
        "A compile-time error is more precise than a runtime one, so fix the compile-time errors first.",
        "Check your work against the question, not against the tests: passing tests do not mean it is right, so run the three cases by hand.",
      ],
    },

    /* ---------- 5.2 ---------- */
    {
      id: "r-rebuild",
      title: "从零重写：空文件夹到 4 个测试全过",
      titleEn: "Write it again yourself: from an empty folder to 4 passing tests",
      blurb: "不给答案。给需求、文件清单、验证命令和四级提示。这一关是分界线。",
      blurbEn: "No answer is given. You get the requirements, the file list, the commands to check your work, and hints in four levels. This lesson is the dividing line.",
      minutes: 60,
      objectives: [
        "在没有参考代码的情况下从空文件建出整个项目",
        "自己把 React 项目的构建与测试配置搭起来",
        "独立实现 Q1 三个任务和 Q2 调度器",
        "用测试和手动场景验证自己的实现",
      ],
      objectivesEn: [
        "Build the whole project from empty files, with no code to copy from",
        "Set up the build and test configuration of a React project yourself",
        "Implement the three Q1 tasks and the Q2 task runner without help",
        "Check your implementation with the tests and by trying it by hand",
      ],
      whyForAssessment:
        "填空和跟写只能证明你「看懂了」。真正的考试是打开一个空编辑器。这一关就是模拟那个时刻 —— 而且它比真实考试更难，因为连脚手架都要你自己搭。",
      whyForAssessmentEn:
        "Filling in blanks and copying along only proves you followed the explanation. The real exam starts with an empty editor. This lesson recreates that moment, and it is harder than the real exam, because here you also set up the project yourself.",
      sourceFiles: [
        { path: "react-notes-app/", role: "参考项目 —— 做完之后再对照，不要提前看" },
      ],
      concepts: [
        {
          id: "why-rebuild",
          heading: "为什么必须做这一关",
          headingEn: "Why you have to do this lesson",
          lede: "读代码用的是识别能力，写代码用的是生成能力。两者不是一回事。",
          ledeEn: "Reading code means recognising it. Writing code means producing it. These are two different abilities.",
          body: (
            <>
              <p>
                看着答案点头「嗯，这里用 map」很容易。
                面对空文件想起「我该建几个文件、state 放哪、
                useEffect 的依赖写什么」，是完全不同的一件事。
              </p>
              <p>
                前面几节课里，你已经在 L3 练习里分别写过
                <code>handleSubmitNote</code>、<code>handleDelete</code>、
                <code>runTasks</code>。这一关是把它们
                <strong>放回一个完整项目里</strong>，
                加上你自己搭的配置、你自己划分的组件。
              </p>
              <p>
                <strong>不要跳过这一关直接看参考答案。</strong>
                答案就在那个门后面，跑不掉。先自己撞一遍墙 ——
                撞墙的地方才是你真正的薄弱点。
              </p>
            </>
          ),
          bodyEn: (
            <>
              <p>
                Nodding at an answer and thinking &ldquo;right, map goes here&rdquo; is
                easy. Facing an empty file and recalling how many files to create, where
                the state goes, what the useEffect dependency should be — that is an
                entirely different thing.
              </p>
              <p>
                In the earlier lessons you already wrote{" "}
                <code>handleSubmitNote</code>, <code>handleDelete</code> and{" "}
                <code>runTasks</code> in the L3 exercises. This stage puts them{" "}
                <strong>back into a whole project</strong>,
                on top of config you set up and components you divided yourself.
              </p>
              <p>
                <strong>Do not skip this stage and jump to the reference answer.</strong>{" "}
                The answer is behind that door and it is not going anywhere. Walk into the
                wall yourself first — where you hit the wall is where you are actually
                weak.
              </p>
            </>
          ),
        },
        {
          id: "how-to",
          heading: "建议的做法",
          headingEn: "A suggested way to work through it",
          body: (
            <>
              <ol>
                <li>
                  <strong>新建一个目录，不要在 react-notes-app 里改。</strong>
                  比如 <code>~/Downloads/my-notes-manager</code>。
                  源项目要留着最后对照。
                </li>
                <li>
                  <strong>先把项目跑起来再写业务。</strong>
                  <code>npm init</code> → 装依赖 → 建
                  <code>index.html</code> / <code>main.tsx</code> /
                  <code>App.tsx</code> → <code>npm run dev</code>
                  看到「Hello」再往下走。
                  <strong>先让空架子能跑，是所有项目的正确起手式。</strong>
                </li>
                <li>
                  <strong>把测试文件先抄进去。</strong>
                  它是你的判卷器。有它在，你随时知道离终点多远。
                </li>
                <li>
                  <strong>一个测试一个测试地攻。</strong>
                  先让第 1 个过（Add），再第 2 个（disabled），
                  依次推进。别想一次写完所有东西。
                </li>
                <li>
                  <strong>卡住超过 15 分钟再看提示。</strong>
                  提示是四级递进的，从「想什么方向」到「给局部代码」。
                </li>
                <li>
                  <strong>最后做手动三场景验证。</strong>
                  测试全过之后，加三条同名笔记、删中间、编辑中间 ——
                  这一步才是真正证明你做对了。
                </li>
              </ol>
            </>
          ),
          bodyEn: (
            <>
              <ol>
                <li>
                  <strong>Make a fresh directory. Do not edit inside react-notes-app.</strong>{" "}
                  Something like <code>~/Downloads/my-notes-manager</code>.
                  Keep the source project intact so you can compare at the end.
                </li>
                <li>
                  <strong>Get the project running before writing any features.</strong>
                  <code>npm init</code> → install dependencies → create{" "}
                  <code>index.html</code> / <code>main.tsx</code> /{" "}
                  <code>App.tsx</code> → <code>npm run dev</code>{" "}
                  and only move on once you see &ldquo;Hello&rdquo;.{" "}
                  <strong>Getting an empty shell to run first is the correct opening move
                  for any project.</strong>
                </li>
                <li>
                  <strong>Copy the test file in first.</strong>{" "}
                  It is your grader. With it in place you always know how far the finish
                  line is.
                </li>
                <li>
                  <strong>Attack one test at a time.</strong>{" "}
                  Get the first one green (Add), then the second (disabled), and keep
                  going. Do not try to write everything at once.
                </li>
                <li>
                  <strong>Only open a hint after 15 minutes stuck.</strong>{" "}
                  The hints escalate through four levels, from &ldquo;which direction to
                  think&rdquo; to &ldquo;here is part of the code&rdquo;.
                </li>
                <li>
                  <strong>Finish with the three manual scenarios.</strong>{" "}
                  Once the tests are all green, add three same-named notes, delete the
                  middle one, edit the middle one — that step is what actually proves you
                  got it right.
                </li>
              </ol>
            </>
          ),
        },
      ],
      exercises: [
        {
          kind: "from-scratch",
          id: "r-rebuild-q1",
          title: "从零重建 Q1 · Notes Manager",
          level: 4,
          prompt: (
            <p>
              空目录开始，建出一个 React + TypeScript + Vite 项目，
              实现 Notes Manager 的增删改，让下面那四个测试全过。
              <strong>不要打开 react-notes-app 参考。</strong>
            </p>
          ),
          requirements: [
            "页面上方是表单：Title 输入框、Content 文本域、一个提交按钮",
            "页面下方是表格：表头 Title / Content / Edit / Delete，每条笔记一行",
            "两个输入框都必须是受控的（value + onChange）",
            "标题或内容为空（含只有空格）时，提交按钮 disabled",
            "Task 1 Add：提交后新笔记出现在表格末尾，原有的都还在",
            "Task 2 Delete：点某行的 Delete，该行按 id 被移除（同名笔记只删对的那条）",
            "Task 3 Edit：点某行的 Edit → 内容回填进表单、按钮文字变成 Update",
            "Task 3 提交后：该笔记在原位置被更新（顺序不变），然后退出编辑模式（表单清空、按钮回到 Add）",
            "必须带上这些 data-testid：note-manager / note-form / form-input / form-textarea / form-submit-button / notes-list",
            "行内按钮的文字必须正好是 Edit 和 Delete",
            "Note 的类型是 { id: number; title: string; content: string }",
          ],
          fileList: [
            { path: "package.json", role: "自己写 scripts 与依赖（react / react-dom / vite / @vitejs/plugin-react / typescript / vitest / jsdom / @testing-library/*）" },
            { path: "index.html", role: "一个 <div id=\"root\"> 加一行 module script" },
            { path: "tsconfig.json", role: "strict、jsx: react-jsx、moduleResolution: bundler" },
            { path: "vite.config.ts", role: "React 插件 + 内联 vitest 配置（environment: jsdom、globals、setupFiles）" },
            { path: "vitest.setup.ts", role: "import \"@testing-library/jest-dom\"" },
            { path: "src/main.tsx", role: "createRoot().render(<App />)" },
            { path: "src/App.tsx", role: "渲染顶层组件" },
            { path: "src/types/Note.ts", role: "Note 类型" },
            { path: "src/components/NoteManager/index.tsx", role: "★ 状态所有者：notes + noteToEdit + 三个 handler" },
            { path: "src/components/NoteForm/index.tsx", role: "★ 受控表单、编辑回填、Add/Update 切换、提交时 id 的取舍" },
            { path: "src/components/NoteTable/index.tsx", role: "表格骨架 + map + notes-list 的 testid" },
            { path: "src/components/NoteItem/index.tsx", role: "单行 + Edit / Delete 按钮" },
            { path: "src/NoteManager.test.tsx", role: "把四个测试抄进来当判卷器（见下方参考答案区）" },
          ],
          commands: [
            {
              cmd: "npm install",
              expect: "装完依赖，node_modules 与 package-lock.json 出现",
            },
            {
              cmd: "npm run dev",
              expect: "打开提示的 localhost 地址，能看到表单和空表格",
            },
            {
              cmd: "npx vitest run",
              expect: "Test Files 1 passed (1) / Tests 4 passed (4)",
            },
            {
              cmd: "npm run dev",
              expect:
                "手动验证三件事：① 加三条同名笔记，删中间那条，只消失一条 ② 编辑中间那条，它还在第二行 ③ 更新完按钮回到 Add、表单清空",
            },
          ],
          hints: [
            "先想清楚「谁持有数据」。表单和表格是兄弟，它们都要碰同一份笔记列表 —— 那这份数据只能放在它们的共同父组件里。先把这个结构画出来，再动手。",
            "四个组件、两个 state（notes 和「正在编辑哪条」）、三个 handler（提交 / 删除 / 进入编辑）。表单内部还需要两个自己的 state 存输入框内容。编辑回填要用 useEffect 监听「正在编辑哪条」的变化。提交时新增和更新要用不同的 id 策略。",
            `NoteManager:
  notes: Note[] = []
  noteToEdit: Note | null = null
  handleSubmit(note):
    如果正在编辑 → 用 map 按 id 就地替换 → 然后把 noteToEdit 设回 null
    否则 → 用展开语法追加到末尾
  handleDelete(id): 用 filter 保留 id 不等于它的
  handleEdit(note): 把 noteToEdit 设成这条

NoteForm:
  title, content 两个 state
  useEffect(依赖 = [noteToEdit]):
    有 noteToEdit → 填入它的 title/content
    没有 → 都清空
  isFormInvalid = 两者任一 trim 后为空
  handleSubmit(e):
    e.preventDefault()
    无效则返回
    造 note，id = 正在编辑 ? 复用旧 id : Date.now()
    上报，然后清空两个输入框`,
            `// NoteManager 的三个 handler（这是 Q1 的核心，其余都是骨架）
const handleSubmitNote = (submittedNote: Note) => {
  if (noteToEdit) {
    setNotes((prev) =>
      prev.map((note) => (note.id === submittedNote.id ? submittedNote : note)),
    );
    setNoteToEdit(null);
  } else {
    setNotes((prev) => [...prev, submittedNote]);
  }
};
const handleDelete = (id: number) => {
  setNotes((prev) => prev.filter((note) => note.id !== id));
};
const handleEdit = (note: Note) => setNoteToEdit(note);

// NoteForm 里最关键的两处
useEffect(() => { /* 有就填，没有就清 */ }, [noteToEdit]);
const newNote = { id: noteToEdit ? noteToEdit.id : Date.now(), ... };`,
          ],
          solution: [
            real(
              "tsx",
              `import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NoteManager from "./components/NoteManager";

test("adds a note", async () => {
  render(<NoteManager />);
  await userEvent.type(screen.getByTestId("form-input"), "My Title");
  await userEvent.type(screen.getByTestId("form-textarea"), "My Content");
  await userEvent.click(screen.getByTestId("form-submit-button"));

  expect(screen.getByTestId("notes-list")).toHaveTextContent("My Title");
});

test("submit button disabled when inputs empty", () => {
  render(<NoteManager />);
  expect(screen.getByTestId("form-submit-button")).toBeDisabled();
});

test("deletes a note", async () => {
  render(<NoteManager />);
  await userEvent.type(screen.getByTestId("form-input"), "ToDelete");
  await userEvent.type(screen.getByTestId("form-textarea"), "x");
  await userEvent.click(screen.getByTestId("form-submit-button"));
  await userEvent.click(screen.getByRole("button", { name: "Delete" }));

  expect(screen.getByTestId("notes-list")).not.toHaveTextContent("ToDelete");
});

test("edits a note in place", async () => {
  render(<NoteManager />);
  await userEvent.type(screen.getByTestId("form-input"), "Old");
  await userEvent.type(screen.getByTestId("form-textarea"), "c1");
  await userEvent.click(screen.getByTestId("form-submit-button"));

  await userEvent.click(screen.getByRole("button", { name: "Edit" }));
  expect(screen.getByTestId("form-submit-button")).toHaveTextContent("Update");

  const input = screen.getByTestId("form-input");
  await userEvent.clear(input);
  await userEvent.type(input, "New");
  await userEvent.click(screen.getByTestId("form-submit-button"));

  expect(screen.getByTestId("notes-list")).toHaveTextContent("New");
  expect(screen.getByTestId("notes-list")).not.toHaveTextContent("Old");
});`,
              {
                filename: "src/NoteManager.test.tsx（判卷器，先抄这个）",
                sourceFile: "react-notes-app/src/NoteManager.test.tsx",
                collapsible: true,
              },
            ),
            real("tsx", NOTE_MANAGER_FULL_REF, {
              filename: "src/components/NoteManager/index.tsx",
              sourceFile: "react-notes-app/src/components/NoteManager/index.tsx",
              collapsible: true,
            }),
            real(
              "tsx",
              `import React, { useState, useEffect } from "react";
import type { Note } from "../../types/Note";

interface NoteFormProps {
  onSubmit: (note: Note) => void;
  noteToEdit: Note | null;
}

const NoteForm: React.FC<NoteFormProps> = ({ onSubmit, noteToEdit }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title);
      setContent(noteToEdit.content);
    } else {
      setTitle("");
      setContent("");
    }
  }, [noteToEdit]);

  const isFormInvalid = title.trim() === "" || content.trim() === "";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isFormInvalid) return;
    const newNote = {
      id: noteToEdit ? noteToEdit.id : Date.now(),
      title: title.trim(),
      content: content.trim(),
    };
    onSubmit(newNote);
    setTitle("");
    setContent("");
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit} data-testid="note-form">
        <section>
          <label>Title:</label>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            data-testid="form-input"
          />
        </section>
        <section>
          <label>Content:</label>
          <textarea
            placeholder="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            data-testid="form-textarea"
          />
        </section>
        <section>
          <button type="submit" disabled={isFormInvalid} data-testid="form-submit-button">
            {noteToEdit ? "Update" : "Add"}
          </button>
        </section>
      </form>
    </div>
  );
};

export default NoteForm;`,
              {
                filename: "src/components/NoteForm/index.tsx（去掉了排版类名）",
                sourceFile: "react-notes-app/src/components/NoteForm/index.tsx",
                collapsible: true,
              },
            ),
            real(
              "json",
              `{
  "name": "my-notes-manager",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^7.0.0",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^29.1.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.0",
    "vitest": "^4.1.10"
  }
}`,
              {
                filename: "package.json（比源项目多了一条 test script）",
                explanation:
                  "源项目没有 test script，这里加上是合理的 —— 这是你自己的项目。但在真实考试里别擅自改配置。",
              },
            ),
          ],
        },
        {
          kind: "from-scratch",
          id: "r-rebuild-q2",
          title: "从零重建 Q2 · 并发任务调度器",
          level: 4,
          prompt: (
            <p>
              只给类型定义和三条要求。自己写出 <code>runTasks</code>，
              并自己写一个验证台来证明它对。
            </p>
          ),
          requirements: [
            "runTasks(tasks, limit) 接收一个「函数数组」，每个函数被调用后返回 Promise",
            "同一时刻最多 limit 个任务在运行；某个结束后立刻启动下一个",
            "任何任务失败都不能让 runTasks 抛错",
            "返回数组顺序必须与 tasks 一致",
            "成功写 { status: \"fulfilled\", value }，失败写 { status: \"rejected\", reason }",
            "自己写一个 demo：6 个任务（其中至少 1 个 reject）、limit = 2，打印实时并发数与最终结果",
          ],
          fileList: [
            { path: "package.json", role: "装 tsx 和 typescript，加一条跑 demo 的 script" },
            { path: "tsconfig.json", role: "strict: true 就够了" },
            { path: "q2/taskRunner.ts", role: "★ Task / SettledResult 类型 + runTasks 实现" },
            { path: "q2/demo.ts", role: "★ 自己写验证台：一个 running 计数器 + 6 个任务 + 打印" },
          ],
          commands: [
            { cmd: "npm install", expect: "装好 tsx 和 typescript" },
            {
              cmd: "npm run q2",
              expect:
                "输出里 running now 从不超过 2；最终 6 条结果顺序与输入一致；reject 的那条是 { status: 'rejected', reason: Error }",
            },
            {
              cmd: "npx tsc --noEmit",
              expect: "没有类型错误",
            },
          ],
          hints: [
            "先问自己：为什么参数是「函数数组」而不是「Promise 数组」？想通这一点，并发上限的实现方式就自己浮出来了。",
            "并发上限不需要计数器。如果你只启动 limit 个「工人」，每个工人同一时刻只做一件事，那同时在跑的任务自然不超过 limit。顺序也不需要排序 —— 预先分配好结果数组，按原始下标写回就行。",
            `预分配 results（长度 = tasks.length）
共享一个 nextIndex = 0
worker = async () => {
  while (nextIndex < 总数) {
    抢下标 i，nextIndex++
    try { results[i] = 成功 } catch { results[i] = 失败 }
    // 不 return，继续抢下一个
  }
}
启动 min(limit, 总数) 个 worker
await Promise.all(它们)
return results`,
            `const results: SettledResult<T>[] = new Array(tasks.length);
let nextIndex = 0;
const worker = async () => {
  while (nextIndex < tasks.length) {
    const i = nextIndex;
    nextIndex++;
    try {
      const value = await tasks[i]();   // ← 括号！
      results[i] = { status: "fulfilled", value };
    } catch (reason) {
      results[i] = { status: "rejected", reason };
    }
  }
};
// 剩下的：开 worker、Promise.all、return results`,
          ],
          solution: [
            real("ts", TASK_RUNNER_SOLUTION, {
              filename: "q2/taskRunner.ts",
              sourceFile: "react-notes-app/q2/taskRunner.ts",
            }),
            real(
              "ts",
              `import { runTasks, type Task } from "./taskRunner";

let running = 0;

const makeTask = (id: number, ms: number, shouldFail = false): Task<string> => {
  return () =>
    new Promise((resolve, reject) => {
      running++;
      console.log(\`task \${id} START   (running now: \${running})\`);
      setTimeout(() => {
        running--;
        if (shouldFail) {
          console.log(\`task \${id} FAIL    (running now: \${running})\`);
          reject(new Error(\`task \${id} failed\`));
        } else {
          console.log(\`task \${id} DONE    (running now: \${running})\`);
          resolve(\`result of task \${id}\`);
        }
      }, ms);
    });
};

const tasks = [
  makeTask(1, 300),
  makeTask(2, 100),
  makeTask(3, 200, true),
  makeTask(4, 100),
  makeTask(5, 150),
  makeTask(6, 100),
];

runTasks(tasks, 2).then((results) => {
  console.log("\\n=== FINAL RESULTS (must be in original order) ===");
  results.forEach((r, i) => console.log(\`#\${i + 1}\`, r));
});`,
              {
                filename: "q2/demo.ts",
                sourceFile: "react-notes-app/q2/demo.ts",
                collapsible: true,
              },
            ),
          ],
        },
      ],
      transfer: [
        { signal: "拿到空目录", signalEn: "You are handed an empty folder", reachFor: "先让空架子能跑起来，再写业务", reachForEn: "Get the empty project running first, then write the features" },
        { signal: "有测试文件", signalEn: "There is a test file", reachFor: "先抄进来当判卷器，一个一个攻", reachForEn: "Copy it in first and use it as your grader, then take one test at a time" },
        { signal: "不知道 state 放哪", signalEn: "You do not know where to put the state", reachFor: "画组件树，找需要它的组件的共同祖先", reachForEn: "Draw the component tree and find the closest shared parent of the components that need it" },
        { signal: "写完了", signalEn: "You think you are finished", reachFor: "跑测试 + 手动跑测试覆盖不到的场景", reachForEn: "Run the tests, then try the cases the tests do not cover by hand" },
      ],
      recap: [
        "识别能力和生成能力是两回事 —— 只有从空文件写过，才算真会。",
        "起手式：先让空架子跑起来（能看到 Hello），再写业务逻辑。",
        "有测试就先抄进来，它是你唯一客观的进度条。",
        "卡住 15 分钟再看提示，提示是四级递进的。",
        "最后一定要手动验证「按 id」「原位置」「退出编辑模式」这三条。",
      ],
      recapEn: [
        "Recognising code and producing code are two different abilities. You only really know it once you have written it from empty files.",
        "Opening move: get the empty project running first, so you can see Hello on screen, then write the features.",
        "If there is a test, copy it in first. It is your only objective progress bar.",
        "Stay stuck for 15 minutes before opening a hint. The hints go in four levels, each one more specific.",
        "At the end, check three things by hand: it edits by id, the note stays in place, and edit mode closes.",
      ],
    },
  ],
};
