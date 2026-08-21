// 考场 —— 计时、无提示、答案锁死的从零重写。
//
// 【这一层为什么必须存在】
// 本项目自己定的验收标准是「在空文件夹里、没有答案的情况下写出来」。
// /drill 和 /code 都练不到这个：沙箱是带脚手架的 —— 文件建好了、依赖装好了、
// 测试写好了、点一下就跑。真实考试是空文件夹、自己配环境、自己读 schema。
//
// **沙箱跑绿 ≠ 能在空文件夹里做出来。**
// 这和全站主线「测试通过 ≠ 做对了」是同一类陷阱，考场就是用来堵它的。
//
// 【全部派生，不新写题】
// 6 道题的来源：
//   · 4 个现成的 from-scratch 练习（已经有 requirements / fileList /
//     commands / 四级提示 / 门后答案）
//   · 2 套模拟考（提示从它的 walkthrough 段落标题派生）
// 缺的只是「计时 + 不许看 + 记录尝试」这层壳，那是页面的事，不是内容的事。
//
// 【只在服务端 import】

import type { ArenaChallenge, CodeExample, FromScratchExercise, MockExam } from "./types";
import { EXAMS } from "./exam-list";

/** 每道考场题的时限与场景 —— 时限按源题的实际规模诚实估，不往短了写 */
const META: Record<string, { minutes: number; scenario: string; scenarioEn: string }> = {
  "r-rebuild-q1": {
    minutes: 75,
    scenario:
      "空文件夹。自己起一个 Vite + React + TS 项目，自己装依赖，把 Notes Manager 的增删改写出来并让四个测试全过。测试文件的 data-testid 一个都不能改。",
    scenarioEn:
      "An empty folder. Start a Vite + React + TS project yourself, install the dependencies yourself, and write the Notes Manager add, edit and delete so all four tests pass. Do not change a single data-testid in the test file.",
  },
  "r-rebuild-q2": {
    minutes: 45,
    scenario:
      "空文件夹。实现一个带并发上限的异步任务调度器：并发数不得超过上限、结果顺序与输入一致、失败的任务以 rejected 出现而不是让整批崩掉。",
    scenarioEn:
      "An empty folder. Implement an async task scheduler with a concurrency limit: never run more than the limit at once, keep results in input order, and report a failed task as rejected instead of letting the whole batch fail.",
  },
  "g-rebuild-subgraph": {
    minutes: 90,
    scenario:
      "空文件夹。自己搭一个 Apollo Federation subgraph：写 schema、写四个 resolver、用 DataLoader 防 N+1、错误带上 extensions.code，并让十个测试全过。",
    scenarioEn:
      "An empty folder. Build an Apollo Federation subgraph yourself: write the schema, write the four resolvers, use DataLoader to avoid N+1, put extensions.code on errors, and make all ten tests pass.",
  },
  "g-rebuild-controller": {
    minutes: 75,
    scenario:
      "空文件夹（或一个空的 Spring Initializr 骨架）。把六个 REST 端点写出来：方法、路径、状态码、参数来源、校验、异常处理，五个测试全过。",
    scenarioEn:
      "An empty folder, or an empty Spring Initializr skeleton. Write the six REST endpoints: method, path, status code, where each parameter comes from, validation, and exception handling, with all five tests passing.",
  },
  "cb-from-scratch": {
    minutes: 60,
    scenario:
      "空文件夹。只有四个测试和一份数据文件：搭一个 Cab Booking 应用 —— Context 存「当前预订」和「行程历史」，四个页面用一个状态机切换，历史只留最新三条且最新在最上。四个测试全过。",
    scenarioEn:
      "An empty folder. You get four tests and one data file. Build a Cab Booking app: Context holds the current booking and the ride history, four pages switch through one state machine, and the history keeps only the three most recent with the newest first. All four tests pass.",
  },
  "support-tickets": {
    minutes: 60,
    scenario:
      "换了业务场景的 React 考试：Support Ticket Board。考点和 Q1 一致，但题面是新的 —— 不许回头看 Q1 的答案。",
    scenarioEn:
      "The React exam in a different business setting: Support Ticket Board. It tests the same things as Q1, but the problem is new — do not look back at your Q1 answer.",
  },
  "book-reviews": {
    minutes: 90,
    scenario:
      "换了业务场景的 Federation 考试：Book Reviews。subgraph 加 entity 缝合，考点和 Task 1 一致，题面是新的。",
    scenarioEn:
      "The Federation exam in a different business setting: Book Reviews. A subgraph stitched together with an entity; it tests the same things as Task 1, and the problem is new.",
  },
};

/** 从模拟考的 walkthrough 段落标题派生四级提示 —— 不新写内容 */
function hintsFromMock(mock: MockExam): [string, string, string, string] {
  const heads = mock.walkthrough.map((w) => w.heading);
  const pick = (i: number, fallback: string) => heads[i] ?? fallback;
  return [
    `先把题面读完，列出每个任务要动哪几个文件。第一步是：${pick(0, "读清需求")}`,
    `卡在结构上就回想这一步：${pick(1, "想清楚数据放哪、谁负责改")}`,
    `具体实现顺序：${pick(2, "一个任务一个任务来，写完一个跑一次测试")}`,
    `还是过不了就看这一段的思路：${pick(3, "对着测试的断言反推自己漏了什么")}`,
  ];
}

function build(): ArenaChallenge[] {
  const out: ArenaChallenge[] = [];

  for (const exam of EXAMS) {
    // ① 5 个 from-scratch 练习
    for (const mod of exam.modules) {
      for (const lesson of mod.lessons) {
        for (const ex of lesson.exercises ?? []) {
          if (ex.kind !== "from-scratch") continue;
          const fs = ex as FromScratchExercise;
          const meta = META[fs.id];
          if (!meta) {
            throw new Error(
              `[arena] from-scratch 练习 ${fs.id} 没有在 META 里登记时限和场景。` +
                `新增 from-scratch 时要同时补 META，否则考场会漏题。`,
            );
          }
          out.push({
            id: fs.id,
            title: fs.title,
            titleEn: fs.titleEn,
            scenario: meta.scenario,
            scenarioEn: meta.scenarioEn,
            minutes: meta.minutes,
            requirements: fs.requirements,
            fileList: fs.fileList,
            commands: fs.commands,
            sourceExerciseId: fs.id,
            sourceExamId: exam.id,
            hints: fs.hints,
            solution: fs.solution,
            explainLessonId: lesson.id,
          });
        }
      }
    }

    // ② 模拟考
    for (const mock of exam.mockExams) {
      const meta = META[mock.id];
      if (!meta) {
        throw new Error(`[arena] 模拟考 ${mock.id} 没有在 META 里登记时限和场景。`);
      }
      out.push({
        id: mock.id,
        title: mock.title,
        titleEn: mock.titleEn,
        scenario: meta.scenario,
        scenarioEn: meta.scenarioEn,
        minutes: meta.minutes,
        // 把每个任务的需求平铺，前面加上任务标题
        requirements: mock.tasks.flatMap((t) => [
          `【${t.title}】`,
          ...t.requirement,
        ]),
        // 模拟考没有 fileList，用 starter 的文件名当清单
        fileList: mock.starter
          .filter((c): c is CodeExample & { filename: string } => !!c.filename)
          .map((c) => ({ path: c.filename, role: "起始文件（考场模式下自己从空文件建）" })),
        commands: mock.commands ?? [],
        sourceMockId: mock.id,
        sourceExamId: exam.id,
        hints: hintsFromMock(mock),
        solution: mock.solution,
      });
    }
  }

  return out;
}

const ARENA = build();

/* ---------- 断言 ---------- */

const EXPECTED = 7;

if (ARENA.length !== EXPECTED) {
  throw new Error(
    `[arena] 考场题数量不对：期望 ${EXPECTED} 道（5 个从零重写 + 2 套模拟考），实际 ${ARENA.length} 道。`,
  );
}

for (const a of ARENA) {
  if (a.hints.length !== 4) {
    throw new Error(`[arena] ${a.id} 的提示不是四级递进。`);
  }
  if (a.solution.length === 0) {
    throw new Error(`[arena] ${a.id} 没有参考答案 —— 交卷后就没东西可解锁了。`);
  }
  if (a.requirements.length === 0) {
    throw new Error(`[arena] ${a.id} 没有需求描述。`);
  }
}

/* ---------- 查询 ---------- */

export function allArena(): ArenaChallenge[] {
  return ARENA;
}

export function arenaById(id: string): ArenaChallenge | undefined {
  return ARENA.find((a) => a.id === id);
}

/**
 * 交卷前能给客户端看的部分 —— **刻意不包含 hints / solution**。
 *
 * /arena/[id]/run 页面只能拿这个。类型上就把答案摘掉，
 * 这样「不小心把答案渲染进 run 页」会变成编译错误，而不是靠人肉 review。
 */
export type ArenaPublic = Omit<ArenaChallenge, "hints" | "solution">;

export function arenaPublicById(id: string): ArenaPublic | undefined {
  const a = arenaById(id);
  if (!a) return undefined;
  // 显式解构，别用 delete —— 漏掉一个字段时 TS 会报
  const { hints: _h, solution: _s, ...pub } = a;
  void _h;
  void _s;
  return pub;
}
