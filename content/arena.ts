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
// 7 道题的来源：
//   · 5 个现成的 from-scratch 练习（已经有 requirements / fileList /
//     commands / 四级提示 / 门后答案，中英两份）
//   · 2 套模拟考（文件清单取自它的 setup.files；四级提示单独写在下面的 MOCK_HINTS）
// 缺的只是「计时 + 不许看 + 记录尝试」这层壳，那是页面的事，不是内容的事。
//
// 【只在服务端 import】

import type { ArenaChallenge, FromScratchExercise, MockExam } from "./types";
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
      "空文件夹。自己搭一个 Apollo Federation subgraph：读 schema（照抄源项目的）、写四个 resolver、用 DataLoader 防 N+1、错误带上 extensions.code，并让十个测试全过。",
    scenarioEn:
      "An empty folder. Build an Apollo Federation subgraph yourself: read the schema (copied from the source project), write the four resolvers, use DataLoader to avoid N+1, put extensions.code on errors, and make all ten tests pass.",
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

type Hints = [string, string, string, string];

/**
 * 两套模拟考的四级提示，中英各一份。
 *
 * 【为什么手写】这里原来用 walkthrough 的小节标题套固定句式，拼出「第一步是：和真实 Q1 的对应关系」
 * 这样的句子。考场里看不到 walkthrough 正文，只剩标题，读不成提示，也不递进。
 * 现在按 from-scratch 那五套的写法：① 思考方向 ② 该动哪里、用什么 ③ 伪代码 ④ 局部代码，
 * 与 HintPanel 的四级标签一一对应。④ 里的代码逐行取自该模拟考的参考答案。
 */
const MOCK_HINTS: Record<string, { zh: Hints; en: Hints }> = {
  "support-tickets": {
    zh: [
      "先别写组件，先回答三个问题：工单列表归哪个组件管？表单怎么知道自己是在新建还是在改派？筛选后的列表要不要单独存一份？然后把 data-testid 和两个按钮的文字（Reassign、Close）抄成一张表 —— 测试就靠它们找元素。",
      `TicketBoard 放三个 state：tickets、正在改派的那张 ticketToEdit（没有就是 null）、筛选值 filter（"all" 或某个 Priority）；再写三个 handler：提交（Create 与 Save 共用）、Close、Reassign。TicketForm 自己管 subject 与 priority 两个受控输入，用 useEffect 盯住 ticketToEdit 回填或清空。可见列表由 filter 派生，不另开 state。`,
      `TicketBoard:
  tickets: Ticket[] = []
  ticketToEdit: Ticket | null = null
  filter: "all" | Priority = "all"
  visibleTickets = filter 为 all 时就是 tickets，否则只留 priority 等于 filter 的
  handleSubmitTicket(submitted):
    正在改派 → 用 map 按 id 原位替换 → 再把 ticketToEdit 设回 null
    否则 → 用展开语法追加到末尾
  handleClose(id): 用 filter 留下 id 不相等的
  handleReassign(ticket): 把 ticketToEdit 设成这一张
TicketForm:
  subject = ""，priority = "medium"
  ticketToEdit 变化时：有就回填，没有就清空
  提交：id 用 ticketToEdit 的，没有才生成新的；提交后清空，priority 回到 medium
  按钮：subject.trim() 为空时 disabled；文字是 ticketToEdit ? "Save" : "Create"
TicketList:
  ul[data-testid=ticket-list] 里每张一个 li（key 用 ticket.id）：subject、priority、Reassign 与 Close 两个按钮`,
      `// ① 可见列表是派生的；所有写操作都作用于 tickets —— 别拿 visibleTickets 去 setTickets
const visibleTickets =
  filter === "all" ? tickets : tickets.filter((t) => t.priority === filter);

// ② 改派：按 id 原位替换，替换完退出改派模式
setTickets((prev) => prev.map((t) => (t.id === submitted.id ? submitted : t)));
setTicketToEdit(null);

// ③ TicketForm 提交时复用旧 id
id: ticketToEdit ? ticketToEdit.id : Date.now(),`,
    ],
    en: [
      "Do not write components yet. Answer three questions first: which component owns the ticket list? How does the form know whether it is creating or reassigning? Does the filtered list need a copy of its own? Then copy the data-testids and the two button texts (Reassign, Close) into a table — the tests find their elements through them.",
      `TicketBoard holds three pieces of state: tickets, the ticket being reassigned (ticketToEdit, null when there is none), and the filter ("all" or a Priority); then three handlers: submit (shared by Create and Save), Close and Reassign. TicketForm owns its two controlled inputs, subject and priority, and uses useEffect on ticketToEdit to fill them in or clear them. The visible list is derived from the filter, with no state of its own.`,
      `TicketBoard:
  tickets: Ticket[] = []
  ticketToEdit: Ticket | null = null
  filter: "all" | Priority = "all"
  visibleTickets = tickets when filter is all, otherwise only those whose priority equals filter
  handleSubmitTicket(submitted):
    if reassigning → replace in place by id with map → then set ticketToEdit back to null
    otherwise → append to the end with the spread syntax
  handleClose(id): keep the ones whose id is not equal, with filter
  handleReassign(ticket): set ticketToEdit to this one
TicketForm:
  subject = "", priority = "medium"
  when ticketToEdit changes: fill in if there is one, clear if not
  on submit: take the id from ticketToEdit and generate one only when there is none; then clear, with priority back to medium
  button: disabled while subject.trim() is empty; the text is ticketToEdit ? "Save" : "Create"
TicketList:
  one li per ticket inside ul[data-testid=ticket-list] (key: ticket.id): subject, priority, and the Reassign and Close buttons`,
      `// ① The visible list is derived; every write acts on tickets — never setTickets from visibleTickets
const visibleTickets =
  filter === "all" ? tickets : tickets.filter((t) => t.priority === filter);

// ② Reassigning: replace in place by id, then leave reassign mode
setTickets((prev) => prev.map((t) => (t.id === submitted.id ? submitted : t)));
setTicketToEdit(null);

// ③ TicketForm reuses the old id on submit
id: ticketToEdit ? ticketToEdit.id : Date.now(),`,
    ],
  },
  "book-reviews": {
    zh: [
      "先别动 resolver。先在 schema 上标出四处：两个 reviews 都是 [Review!]!，averageRating 是可空的 Float，reviewer 可空，Book 的 @key 是 isbn 和 edition 两个字段。再给三个数据源各抄一张方法名表（方法名和参数）。每个字段兜底返回什么由可空性决定，调哪个方法、怎么传参由这张表决定。",
      "全部改动都在 reviewResolvers.js。七个 TODO 照 schema 填：两个 reviews 兜底 []，averageRating 与 reviewer 兜底 null，Book.__resolveReference 两个 key 字段都要留，Query.review 找不到时抛 REVIEW_NOT_FOUND。另有两处现成的代码要修：createReviewerLoader（方法名，以及那个 filter），createReview（数据源键名、insertReview 的调用方式、吞掉结构化错误的 catch、返回值缺 reviewer）。",
      `Author.reviews(author) → reviewDataSource.fetchByAuthor(author.id)，兜底 []
Author.averageRating(author) → ratingDataSource.computeAverage(author.id)，用 ?? null 兜底（不能用 ||，0 是合法的平均分）
Book.__resolveReference(book) → { isbn, edition }，两个都留
Book.reviews(book) → reviewDataSource.fetchByBook(book.isbn, book.edition)，兜底 []
Review.reviewer(parent) → loaders.reviewerLoader.load(parent.authorId)，兜底 null
Query.review(id) → loaders.reviewLoader.load(id)；没有就抛 REVIEW_NOT_FOUND
Query.reviews(authorId) → 没有 authorId 就抛 INVALID_INPUT；否则 fetchByAuthor，兜底 []
Mutation.createReview → 校验 → 用 reviewerLoader 查 reviewer → insertReview（五个位置参数）→ 返回 { ...review, reviewer }
每个 catch → GraphQLError 原样再抛；其他错误带 correlationId 记日志，再包成带 code 的 GraphQLError`,
      `// ① batch 函数：方法名是 lookupReviewer；不许 filter —— 返回的数组必须与 authorIds 等长、同序
const reviewers = await Promise.all(
  authorIds.map(id => reviewerDataSource.lookupReviewer(id))
);
return reviewers;

// ② createReview：先查 reviewer（参数里要解构出 loaders），再按五个位置参数插入，最后附到返回值上
const reviewer = await loaders.reviewerLoader.load(authorId);
const review = await dataSources.reviewDataSource.insertReview(
  authorId, isbn, edition, rating, body
);
return { ...review, reviewer };

// ③ 每个 catch 的第一行
if (error instanceof GraphQLError) throw error;`,
    ],
    en: [
      "Leave the resolvers alone for now. First mark four things on the schema: both reviews fields are [Review!]!, averageRating is a nullable Float, reviewer is nullable, and Book's @key is the two fields isbn and edition. Then copy out a method table for each of the three data sources (names and parameters). Nullability decides what each field falls back to; the table decides which method you call and how you pass the arguments.",
      "Every change is in reviewResolvers.js. Fill the seven TODOs from the schema: both reviews fall back to [], averageRating and reviewer fall back to null, Book.__resolveReference keeps both key fields, and Query.review throws REVIEW_NOT_FOUND when there is no match. Two pieces of existing code also need fixing: createReviewerLoader (the method name, and that filter) and createReview (the data source key name, how insertReview is called, the catch that swallows a structured error, and the reviewer missing from the return value).",
      `Author.reviews(author) → reviewDataSource.fetchByAuthor(author.id), falling back to []
Author.averageRating(author) → ratingDataSource.computeAverage(author.id), falling back with ?? null (not ||: 0 is a valid average)
Book.__resolveReference(book) → { isbn, edition }, keeping both
Book.reviews(book) → reviewDataSource.fetchByBook(book.isbn, book.edition), falling back to []
Review.reviewer(parent) → loaders.reviewerLoader.load(parent.authorId), falling back to null
Query.review(id) → loaders.reviewLoader.load(id); throw REVIEW_NOT_FOUND when there is none
Query.reviews(authorId) → throw INVALID_INPUT without an authorId; otherwise fetchByAuthor, falling back to []
Mutation.createReview → validate → look the reviewer up with reviewerLoader → insertReview (five positional arguments) → return { ...review, reviewer }
every catch → rethrow a GraphQLError as it is; log anything else with the correlationId and wrap it in a GraphQLError with a code`,
      `// ① The batch function: the method is lookupReviewer, and no filter — the array must be as long as authorIds and in the same order
const reviewers = await Promise.all(
  authorIds.map(id => reviewerDataSource.lookupReviewer(id))
);
return reviewers;

// ② createReview: look the reviewer up first (destructure loaders from the context), insert with five positional arguments, then attach it
const reviewer = await loaders.reviewerLoader.load(authorId);
const review = await dataSources.reviewDataSource.insertReview(
  authorId, isbn, edition, rating, body
);
return { ...review, reviewer };

// ③ The first line of every catch
if (error instanceof GraphQLError) throw error;`,
    ],
  },
};

function mockHints(mock: MockExam): { zh: Hints; en: Hints } {
  const h = MOCK_HINTS[mock.id];
  if (!h) {
    throw new Error(`[arena] 模拟考 ${mock.id} 没有在 MOCK_HINTS 里写四级提示。`);
  }
  return h;
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
            // 来源练习这三样都已经有英文，只是原来没派生出来
            requirementsEn: fs.requirementsEn,
            fileList: fs.fileList,
            commands: fs.commands,
            sourceExerciseId: fs.id,
            sourceExamId: exam.id,
            hints: fs.hints,
            hintsEn: fs.hintsEn,
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
        // 英文侧同样平铺。
        //
        // 【条件为什么只看 requirementEn】
        // 原来要求每个 task 都有 titleEn，结果 React 那套模拟考整段都没英文 ——
        // 它有两个 task 叫「Task 1 · Create」「Task 2 · Close」，本来就是英文，
        // 所以从来没人给它们加 titleEn。标题缺英文回落中文没问题（就是同一个词），
        // 但**需求**的条数必须每个 task 都对得上，否则平铺后整体错位。
        requirementsEn: mock.tasks.every(
          (t) => t.requirementEn && t.requirementEn.length === t.requirement.length,
        )
          ? mock.tasks.flatMap((t) => [
              `【${t.titleEn ?? t.title}】`,
              ...(t.requirementEn ?? []),
            ])
          : undefined,
        // 模拟考没有 fileList，用它自己 setup 里列的文件（路径 + 中英两版说明）。
        // 原来拿 starter 代码块的标题拼：那些标题带批注、不是纯路径，还漏了判卷的测试文件
        fileList: mock.setup.files.map((file) => ({
          path: file.path,
          role: file.role.zh,
          roleEn: file.role.en,
        })),
        commands: mock.commands ?? [],
        sourceMockId: mock.id,
        sourceExamId: exam.id,
        hints: mockHints(mock).zh,
        hintsEn: mockHints(mock).en,
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
  if (!a.hintsEn || a.hintsEn.length !== 4) {
    throw new Error(`[arena] ${a.id} 缺四级英文提示 —— 英文界面会整组回落中文。`);
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
 * 交卷前能给客户端看的部分 —— **刻意不包含 hints / hintsEn / solution**。
 *
 * /arena/[id]/run 页面只能拿这个。类型上就把答案摘掉，
 * 这样「不小心把答案渲染进 run 页」会变成编译错误，而不是靠人肉 review。
 */
export type ArenaPublic = Omit<ArenaChallenge, "hints" | "hintsEn" | "solution">;

export function arenaPublicById(id: string): ArenaPublic | undefined {
  const a = arenaById(id);
  if (!a) return undefined;
  // 显式解构，别用 delete —— 漏掉一个字段时 TS 会报
  const { hints: _h, hintsEn: _he, solution: _s, ...pub } = a;
  void _h;
  void _he;
  void _s;
  return pub;
}
