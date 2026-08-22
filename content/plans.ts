// 引导计划 —— 「告诉我下一步做什么」。
//
// 【为什么四个模式还不够】
// 上一轮把导航改成了「先问意图」：顶栏四个模式回答「我现在想做哪一类事」，
// 侧栏回答「在这件事里我在哪」。那一步是对的，但它只解决了一半 ——
// **四个模式里只有 Learn 是线性的**，Review / Practice / Assess 仍然是
// 题库、筛选器和列表。
//
// 于是下面这些话仍然得不到一条完整的路：
//   「我要准备 React 考试。」
//   「我要学 GraphQL Federation。」
//   「我要准备 Spring Boot 那道控制器题。」
//   「我要复习前端面试。」
//   「我要把 Cab Booking 重做一遍。」
//   「我从零开始。」
//
// 每一句都是一个**目标**，而不是一类活动。这个文件把每个目标变成一条
// 有序、可续、跨模式的路径。
//
// 两个入口是互补的，不是替代关系：
//   引导计划   = 「告诉我下一步做什么」
//   四个模式   = 「让我自己挑」
//
// 【最重要的规矩：这里一个字的内容都不许存】
// 计划只写「引用」—— 课程 id、练习 id、八股方向、coding id、考场 id、模拟考 id，
// 或者一句「这门课的全部课文」这种查询。标题、题面、时长全部从 content/nav.ts
// 现取。抄一份出来就有两份真相，改了一边忘了另一边最难查。
// 计划自己只拥有一样东西：**这一档为什么在这儿**（stage 的 why），
// 那句话在别处不存在，所以它必须写在这里。
//
// 【为什么 import 的是 nav 而不是 registry】
// 计划面板要出现在首页和侧栏（都是客户端组件），所以这个文件必须是客户端安全的。
// nav.ts 就是那份「只有文字和数字」的镜像。一旦 import content/registry，
// 全部课程正文会被打进同一个 chunk（实测踩过一次，784 KB）。
//
// 【断言在模块作用域，会真的抛】
// 引用写错（课改名了、coding 题删了、方向拼错了）就当场炸 —— 而不是
// 在页面上安静地少一格。/plans 是预渲染页面，所以 next build 会跑到这里，
// 构建直接失败。dev 下第一次打开也会失败。

import {
  ARENA,
  CODING,
  DRILLS,
  DRILL_TRACK_ORDER,
  NAV,
  arenaPath,
  codingPath,
  drillPath,
  lessonPath,
  mockPath,
  navExam,
  type NavDrillTrack,
} from "./nav";
// 练习清单单独一份 —— 它只被引导计划用，而计划那一套是懒加载的。
// 合进 nav.ts 的实测代价见 content/nav-exercises.ts 顶部那段。
import { EXERCISES } from "./nav-exercises";
import type { ModeId } from "@/lib/modes";

/* ============================================================
   类型
   ============================================================ */

/** 一档的性质。决定徽章文字、颜色和「完成」的判定口径 */
export type PlanPhase =
  | "prereq"
  | "learn"
  | "review"
  | "practice"
  | "code"
  | "rebuild"
  | "assess";

/**
 * 一档从哪儿取内容。
 *
 * 全部是**查询**，不是内容拷贝：
 *   lessons   一门课的全部课文，或指定模块 / 指定几节
 *   exercises 一门课的全部练习，或指定几节 / 指定几个练习
 *   drills    指定几个方向的全部八股题
 *   coding    指定几道 coding 题
 *   arena     指定几道考场题
 *   mock      指定几套模拟考
 */
export type StageSource =
  | { from: "lessons"; examId: string; moduleIds?: string[]; lessonIds?: string[] }
  | {
      from: "exercises";
      examId: string;
      moduleIds?: string[];
      lessonIds?: string[];
      exerciseIds?: string[];
    }
  | { from: "drills"; tracks: NavDrillTrack[] }
  | { from: "coding"; ids: string[] }
  | { from: "arena"; ids: string[] }
  | { from: "mock"; refs: { examId: string; mockId: string }[] };

export interface PlanStage {
  /** 计划内唯一。进度不存 stage，所以这个 id 只用来做 React key 和锚点 */
  id: string;
  phase: PlanPhase;
  zh: string;
  en: string;
  /**
   * 这一档为什么在这儿。
   *
   * 这是计划**唯一**自己拥有的文字 —— 它在 content/exams 里不存在，
   * 因为它说的是「在这条路径上，这一步的作用」，而课文只说自己讲什么。
   */
  whyZh: string;
  whyEn: string;
  source: StageSource;
  /**
   * 摊开的方式。
   *   rows  一行一个（有标题、有时长的东西：课文、coding、考场、模拟考）
   *   chips 一格一个（练习和八股：几十个，一行一个会把页面拉成几屏）
   *
   * 不写就自动选，而且**按内容类型判断，不只看条数**：
   * 课文 21 节也该一行一个 —— 那是一条课程路线，每一节都有名字和估时；
   * 而 54 个练习、36 道八股一行一个会把这一页拉成好几屏。
   */
  layout?: "rows" | "chips";
}

export interface Plan {
  id: string;
  zh: string;
  en: string;
  /** 一句话：走完之后你能做什么 */
  outcomeZh: string;
  outcomeEn: string;
  /** 一句话：谁该走这条 */
  forZh: string;
  forEn: string;
  stages: PlanStage[];
}

/* ============================================================
   六条计划
   ------------------------------------------------------------
   顺序沿用这个站一直在用的那条递进：
     前置 → 学课文 → 背知识点 → 做课内练习 → 写 Coding → 空手重写 → 模拟考
   哪一档在这条计划里没有真实内容就**整档不出现**，不塞充数的东西。
   ============================================================ */

const REACT_CODING = [
  "todo-list",
  "timer",
  "fetch-user",
  "comment-tree",
  "theme-context",
  "notes-manager",
  "run-tasks",
];

const HAND_CODING = [
  "hand-debounce",
  "hand-throttle",
  "hand-deep-clone",
  "hand-flatten",
  "hand-curry",
  "hand-promise-all",
  "hand-event-emitter",
  "hand-lru",
];

const WIDGET_CODING = [
  "tabs",
  "star-rating",
  "dropdown",
  "use-local-storage",
  "player",
  "kanban",
  "rtk-todo",
];

export const PLANS: Plan[] = [
  /* ---------------------------------------------------------- */
  {
    id: "complete",
    zh: "从零完整学习",
    en: "Complete DrillLab",
    outcomeZh: "从「npm install 做了什么」走到在空文件夹里重写三个项目，并把 105 道八股过一遍。",
    outcomeEn:
      "From what npm install actually does, to rebuilding three projects in an empty folder, with all 105 questions covered.",
    forZh: "刚开始接触 npm、React、GraphQL，想要一条完整的路。",
    forEn: "New to npm, React and GraphQL, and wanting one complete route.",
    stages: [
      {
        id: "f-learn",
        phase: "learn",
        zh: "地基：一个项目是怎么跑起来的",
        en: "Foundations: how a project actually runs",
        whyZh: "后面每一门课都假设你会 npm、会读 package.json、会不改原数组地更新数据。这一门就是补这些。",
        whyEn:
          "Every later course assumes you know npm, can read a package.json, and can update data without mutating it. This course is where that comes from.",
        source: { from: "lessons", examId: "foundations" },
      },
      {
        id: "f-practice",
        phase: "practice",
        zh: "地基的课内练习",
        en: "The Foundations exercises",
        whyZh: "读懂和写得出之间差一步，这一步就是这些练习。别攒着最后一起做。",
        whyEn:
          "There is a gap between following an explanation and producing the code. These exercises are that gap. Do not save them up.",
        source: { from: "exercises", examId: "foundations" },
      },
      {
        id: "r-learn",
        phase: "learn",
        zh: "React 考试：课文",
        en: "React exam: the lessons",
        whyZh: "21 节，从「组件是一个函数」讲到 Q1 的三个任务和 Q2 的并发上限。",
        whyEn:
          "21 lessons, from a component being a function to Q1's three tasks and Q2's concurrency limit.",
        source: { from: "lessons", examId: "react" },
      },
      {
        id: "r-practice",
        phase: "practice",
        zh: "React 的课内练习",
        en: "The React exercises",
        whyZh: "填空、写整块、Debug Lab —— 挖好了空等你填，是从「认得出」到「写得对」的过渡。",
        whyEn:
          "Blanks, whole blocks and debug labs: the step between recognising the code and writing it correctly.",
        source: { from: "exercises", examId: "react" },
      },
      {
        id: "r-code",
        phase: "code",
        zh: "React 的 Coding 题",
        en: "The React coding problems",
        whyZh: "文件、依赖、测试都给好了，红变绿才算过。其中大部分能直接在浏览器里跑。",
        whyEn:
          "Files, dependencies and tests are handed to you; red to green is the bar. Most of them run right in the browser.",
        source: { from: "coding", ids: REACT_CODING },
      },
      {
        id: "r-rebuild",
        phase: "rebuild",
        zh: "React：空文件夹里重写",
        en: "React: rebuild in an empty folder",
        whyZh: "沙箱跑绿不等于能空手做出来。这一档没有脚手架、没有提示，只有一个计时器。",
        whyEn:
          "A green sandbox does not mean you can build it from nothing. No scaffold, no hints, just a clock.",
        source: { from: "arena", ids: ["r-rebuild-q1", "r-rebuild-q2"] },
      },
      {
        id: "r-assess",
        phase: "assess",
        zh: "React 模拟考",
        en: "The React mock exam",
        whyZh: "换了业务场景、考点不变。这是检验「你是理解了还是背下来了」最直接的办法。",
        whyEn:
          "Same skills, a different business scenario — the most direct way to find out whether you understood it or memorised it.",
        source: { from: "mock", refs: [{ examId: "react", mockId: "support-tickets" }] },
      },
      {
        id: "g-learn",
        phase: "learn",
        zh: "Federation 考试：课文",
        en: "Federation exam: the lessons",
        whyZh: "17 节，从「GraphQL 是一份 schema 加一组 resolver」讲到 entity 缝合、DataLoader 和六个 Spring 端点。",
        whyEn:
          "17 lessons, from GraphQL being one schema plus a set of resolvers, through entities, DataLoader and the six Spring endpoints.",
        source: { from: "lessons", examId: "graphql-federation" },
      },
      {
        id: "g-practice",
        phase: "practice",
        zh: "Federation 的课内练习",
        en: "The Federation exercises",
        whyZh: "这门课的练习里有 8 个 Debug Lab —— 那三处人为埋雷都在里面。",
        whyEn:
          "Eight of these are debug labs, and the three planted defects all live in them.",
        source: { from: "exercises", examId: "graphql-federation" },
      },
      {
        id: "g-code",
        phase: "code",
        zh: "Federation 与 Spring 的 Coding 题",
        en: "The Federation and Spring coding problems",
        whyZh: "这两道要在本机跑：一道要真起一个 subgraph 服务，一道要 JVM 和 Maven。页面把命令和期望输出写全了。",
        whyEn:
          "These two run locally: one needs a real subgraph process, the other a JVM and Maven. The pages spell out every command and the expected output.",
        source: { from: "coding", ids: ["orders-subgraph", "spring-endpoints"] },
      },
      {
        id: "g-rebuild",
        phase: "rebuild",
        zh: "Federation：空文件夹里重写",
        en: "Federation: rebuild in an empty folder",
        whyZh: "自己搭 subgraph、自己配 Spring 骨架。环境本身就是考点。",
        whyEn:
          "Build the subgraph yourself, wire the Spring skeleton yourself. Setting up the environment is part of what is being tested.",
        source: { from: "arena", ids: ["g-rebuild-subgraph", "g-rebuild-controller"] },
      },
      {
        id: "g-assess",
        phase: "assess",
        zh: "Federation 模拟考",
        en: "The Federation mock exam",
        whyZh: "subgraph 加 entity 缝合，考点和 Task 1 一致，题面是新的。",
        whyEn:
          "A subgraph stitched together with an entity: the same skills as Task 1, on a new problem.",
        source: {
          from: "mock",
          refs: [{ examId: "graphql-federation", mockId: "book-reviews" }],
        },
      },
      {
        id: "cb-learn",
        phase: "learn",
        zh: "Cab Booking：课文",
        en: "Cab Booking: the lessons",
        whyZh: "8 节，讲的是用 Context 管全局状态：放在哪一层、存什么、怎么改。",
        whyEn:
          "Eight lessons on holding global state in Context: which level it goes on, what it stores, how it changes.",
        source: { from: "lessons", examId: "cab-booking" },
      },
      {
        id: "cb-practice",
        phase: "practice",
        zh: "Cab Booking 的课内练习",
        en: "The Cab Booking exercises",
        whyZh: "包含那个「完整答案跑不起来，原因是一个文件扩展名」的 Debug Lab。",
        whyEn:
          "Includes the debug lab where the finished answer does not run, and the cause is one file extension.",
        source: { from: "exercises", examId: "cab-booking" },
      },
      {
        id: "cb-code",
        phase: "code",
        zh: "Cab Booking 的 Coding 题",
        en: "The Cab Booking coding problem",
        whyZh: "整个应用在浏览器里写一遍，四个测试全绿。",
        whyEn: "Write the whole app in the browser and take all four tests green.",
        source: { from: "coding", ids: ["cab-booking-app"] },
      },
      {
        id: "cb-rebuild",
        phase: "rebuild",
        zh: "Cab Booking：空文件夹里重写",
        en: "Cab Booking: rebuild in an empty folder",
        whyZh: "只给四个测试和一份数据文件，其余全部自己建。",
        whyEn: "You get four tests and one data file. Everything else you create yourself.",
        source: { from: "arena", ids: ["cb-from-scratch"] },
      },
      {
        id: "iv-review",
        phase: "review",
        zh: "面试八股：105 道问答",
        en: "Interview questions: all 105",
        whyZh: "这条支线不依赖前面任何一门课，任何时候都能开始 —— 放在最后只是因为它最长。",
        whyEn:
          "This track has no prerequisites and can start at any time. It sits last only because it is the longest.",
        source: { from: "drills", tracks: [...DRILL_TRACK_ORDER] },
      },
      {
        id: "iv-learn",
        phase: "learn",
        zh: "手写题与组件题的讲解",
        en: "The walkthroughs for the hand-written and component problems",
        whyZh: "这 10 节课不是问答题，它们是下面那 15 道 coding 题的讲解。",
        whyEn:
          "These ten lessons are not questions; they are the walkthroughs for the fifteen coding problems below.",
        source: {
          from: "lessons",
          examId: "interview",
          moduleIds: ["iv-coding", "iv-hand", "iv-ts"],
        },
      },
      {
        id: "iv-practice",
        phase: "practice",
        zh: "面试那门课的练习",
        en: "The exercises in the interview course",
        whyZh: "16 个，大部分是「写整块」—— 手写 debounce、curry、EventEmitter 那一类。",
        whyEn:
          "Sixteen of them, mostly write-a-block: debounce, curry, EventEmitter and the like.",
        source: { from: "exercises", examId: "interview" },
      },
      {
        id: "iv-code",
        phase: "code",
        zh: "手写题与组件题",
        en: "The hand-written and component problems",
        whyZh: "面试现场最常出的两类：手写工具函数，和从零搭一个受控组件。",
        whyEn:
          "The two kinds interviews ask for most: implement a utility by hand, and build a controlled component from nothing.",
        source: { from: "coding", ids: [...HAND_CODING, ...WIDGET_CODING] },
      },
    ],
  },

  /* ---------------------------------------------------------- */
  {
    id: "react-assessment",
    zh: "React 考试准备",
    en: "React Assessment",
    outcomeZh: "在空文件夹里做完 Notes Manager 和并发任务调度器，并通过一套换了场景的模拟考。",
    outcomeEn:
      "Build Notes Manager and the concurrent task runner in an empty folder, and pass a mock in a new scenario.",
    forZh: "要考 React：组件、hooks、受控输入、列表、useEffect、Context。",
    forEn: "Facing a React assessment: components, hooks, controlled inputs, lists, useEffect, Context.",
    stages: [
      {
        id: "prereq",
        phase: "prereq",
        zh: "前置：地基",
        en: "Prerequisites: Foundations",
        whyZh: "React 考试假设你会 npm、会读 package.json、会不改原数组地更新数据、会读 tsc 的报错。这一档就是这些。已经会了就直接勾掉。",
        whyEn:
          "The React exam assumes you know npm, can read a package.json, can update an array without mutating it, and can read a tsc error. Tick these off if you already can.",
        source: { from: "lessons", examId: "foundations" },
      },
      {
        id: "learn",
        phase: "learn",
        zh: "学：React 课文",
        en: "Learn: the React lessons",
        whyZh: "按原顺序走。第 3 部分是 Q1 逐题拆解，第 4 部分是 Q2，第 5 部分是五道高频变式。",
        whyEn:
          "In their existing order. Part 3 takes Q1 apart task by task, Part 4 is Q2, and Part 5 is five variations that come up often.",
        source: { from: "lessons", examId: "react" },
      },
      {
        id: "review",
        phase: "review",
        zh: "背：React 方向的八股",
        en: "Review: the React questions",
        whyZh: "面试和考试的口头追问都从这 36 道里来。答不上来就标「不会」，抽认卡下一轮会先抽它。",
        whyEn:
          "The spoken follow-up questions come from these 36. Mark the ones you miss; the next flashcard round puts them first.",
        source: { from: "drills", tracks: ["react"] },
      },
      {
        id: "practice",
        phase: "practice",
        zh: "练：React 的课内练习",
        en: "Practice: the React exercises",
        whyZh: "54 个，含 14 个 Debug Lab。检查是正则匹配，不跑代码 —— 它判得出你用没用 filter，判不出你写的跑不跑得通。",
        whyEn:
          "54 of them, including 14 debug labs. The check is a regex match, not a run: it can tell whether you used filter, not whether your code works.",
        source: { from: "exercises", examId: "react" },
      },
      {
        id: "code",
        phase: "code",
        zh: "写：React 的 Coding 题",
        en: "Code: the React coding problems",
        whyZh: "整块写完并跑绿。第二遍点「空白重来」—— 实现文件全清空、只留测试，那一遍才算验收。",
        whyEn:
          "Write the whole thing and take the tests green. On the second pass hit start blank: every implementation file is emptied and only the tests remain. That pass is the one that counts.",
        source: { from: "coding", ids: REACT_CODING },
      },
      {
        id: "rebuild",
        phase: "rebuild",
        zh: "空手做：从零重写",
        en: "Rebuild: from an empty folder",
        whyZh: "Q1 和 Q2 各一道，计时、无提示、答案锁到交卷之后。这一档才是真实考试的样子。",
        whyEn:
          "One for Q1 and one for Q2: timed, no hints, answers locked until you hand in. This tier is what the real thing looks like.",
        source: { from: "arena", ids: ["r-rebuild-q1", "r-rebuild-q2"] },
      },
      {
        id: "assess",
        phase: "assess",
        zh: "模拟考：Support Ticket Board",
        en: "Assess: Support Ticket Board",
        whyZh: "考点和 Q1 一一对应，题面是新的。不许回头看 Q1 的答案。",
        whyEn:
          "It tests the same things as Q1 on a new problem. Do not look back at your Q1 answer.",
        source: { from: "mock", refs: [{ examId: "react", mockId: "support-tickets" }] },
      },
    ],
  },

  /* ---------------------------------------------------------- */
  {
    id: "federation-assessment",
    zh: "GraphQL Federation 考试准备",
    en: "GraphQL Federation Assessment",
    outcomeZh: "自己搭一个 Apollo Federation subgraph 并让十个测试全过，再通过一套换了场景的模拟考。",
    outcomeEn:
      "Build an Apollo Federation subgraph yourself with all ten tests passing, then pass a mock in a new scenario.",
    forZh: "要考 GraphQL Federation：schema、resolver、entity、DataLoader，外加一个 Spring Boot 服务。",
    forEn:
      "Facing a Federation assessment: schema, resolvers, entities, DataLoader, plus a Spring Boot service.",
    stages: [
      {
        id: "prereq",
        phase: "prereq",
        zh: "前置：地基",
        en: "Prerequisites: Foundations",
        whyZh: "subgraph 是一个 Node 项目：要装依赖、要跑 script、要读 ESM 的报错。这一档就是这些。",
        whyEn:
          "A subgraph is a Node project: dependencies to install, scripts to run, ESM errors to read. That is what this course covers.",
        source: { from: "lessons", examId: "foundations" },
      },
      {
        id: "learn",
        phase: "learn",
        zh: "学：Federation 课文",
        en: "Learn: the Federation lessons",
        whyZh: "17 节。第 3 部分把 Task 1 的四个 TODO 和三处埋雷逐项拆开，第 4 部分是 Spring 的六个端点。",
        whyEn:
          "17 lessons. Part 3 takes Task 1's four TODOs and three planted defects apart one by one; Part 4 is the six Spring endpoints.",
        source: { from: "lessons", examId: "graphql-federation" },
      },
      {
        id: "review",
        phase: "review",
        zh: "背：Node、数据库、网络与安全",
        en: "Review: Node, databases, networking and security",
        whyZh: "题库里没有 GraphQL 这个方向，但这 12 道正好是 subgraph 和 Spring 服务真正会被追问的东西 —— 事件循环、连接、状态码。",
        whyEn:
          "The bank has no GraphQL track, but these 12 are exactly what a subgraph and a Spring service get asked about: the event loop, connections, status codes.",
        source: { from: "drills", tracks: ["node", "db", "web"] },
      },
      {
        id: "practice",
        phase: "practice",
        zh: "练：Federation 的课内练习",
        en: "Practice: the Federation exercises",
        whyZh: "47 个。其中 8 个 Debug Lab 给的是真实报错文本，包括那三处人为埋雷。",
        whyEn:
          "47 of them. Eight are debug labs with real error text, including the three planted defects.",
        source: { from: "exercises", examId: "graphql-federation" },
      },
      {
        id: "code",
        phase: "code",
        zh: "写：subgraph 与 Spring 控制器",
        en: "Code: the subgraph and the Spring controller",
        whyZh: "这两道浏览器里跑不了 —— 一道要真起一个服务进程，一道要 JVM 和 Maven。页面给的是本机命令和期望输出，不给假编辑器。",
        whyEn:
          "Neither runs in a browser: one needs a real server process, the other a JVM and Maven. The pages hand you local commands and the expected output, not a fake editor.",
        source: { from: "coding", ids: ["orders-subgraph", "spring-endpoints"] },
      },
      {
        id: "rebuild",
        phase: "rebuild",
        zh: "空手做：从零重写两道",
        en: "Rebuild: both tasks from an empty folder",
        whyZh: "自己写 schema、自己接 DataLoader、自己配 Spring 骨架。基线是 6 failed / 4 passed，而那 4 个通过里有 3 个是「空实现恰好满足断言」。",
        whyEn:
          "Write the schema yourself, wire DataLoader yourself, set up the Spring skeleton yourself. The baseline is 6 failed / 4 passed, and three of those four passes are empty implementations that happen to satisfy the assertion.",
        source: { from: "arena", ids: ["g-rebuild-subgraph", "g-rebuild-controller"] },
      },
      {
        id: "assess",
        phase: "assess",
        zh: "模拟考：Book Reviews Subgraph",
        en: "Assess: Book Reviews Subgraph",
        whyZh: "换了业务场景的 subgraph 加 entity 缝合，考点和 Task 1 一致。参考解法实测 14 / 14。",
        whyEn:
          "A subgraph stitched with an entity in a different business setting, testing the same things as Task 1. The reference solution measures 14 / 14.",
        source: {
          from: "mock",
          refs: [{ examId: "graphql-federation", mockId: "book-reviews" }],
        },
      },
    ],
  },

  /* ---------------------------------------------------------- */
  {
    id: "spring-controller",
    zh: "Spring Boot 控制器准备",
    en: "Spring Boot Controller",
    outcomeZh: "在一个空的 Spring Initializr 骨架里写出六个 REST 端点，五个测试全过。",
    outcomeEn:
      "Write six REST endpoints in an empty Spring Initializr skeleton, with all five tests passing.",
    forZh: "只准备 Federation 考试里那道 Spring Boot 控制器题。",
    forEn: "Preparing only for the Spring Boot controller task in the Federation assessment.",
    stages: [
      {
        id: "learn",
        phase: "learn",
        zh: "学：这道题要读懂的两节",
        en: "Learn: the two lessons this task needs",
        whyZh: "一节讲给你的骨架里那几个 Spring 注解和一个请求走过的路，一节讲六个端点 —— 状态码就是这道题的全部。",
        whyEn:
          "One covers the Spring annotations in the skeleton you are given and the path a request takes; the other covers the six endpoints, where the status codes are the whole task.",
        source: {
          from: "lessons",
          examId: "graphql-federation",
          lessonIds: ["g-spring-basics", "g-endpoints"],
        },
      },
      {
        id: "practice",
        phase: "practice",
        zh: "练：这两节的练习，加一个 Java Debug Lab",
        en: "Practice: those lessons' exercises, plus one Java debug lab",
        whyZh: "「六个端点全 return null 也过了 3 个」这件事就在这几个练习里 —— 测试通过不等于做对了。",
        whyEn:
          "These exercises are where you meet the fact that returning null from all six endpoints still passes three tests. Green does not mean correct.",
        source: {
          from: "exercises",
          examId: "graphql-federation",
          exerciseIds: [
            "g-spring-exception",
            "g-spring-annotations",
            "g-status-post",
            "g-null-passes",
            "g-endpoints-blank",
            "g-endpoints-write",
            "g-debug-404-swallowed",
            "g-lab-java-500",
          ],
        },
      },
      {
        id: "code",
        phase: "code",
        zh: "写：六个端点",
        en: "Code: the six endpoints",
        whyZh: "本机跑：方法、路径、状态码、参数来源、校验、异常处理。基线是 5 run / 2 failures。",
        whyEn:
          "Run it locally: method, path, status code, where each parameter comes from, validation, exception handling. The baseline is 5 run / 2 failures.",
        source: { from: "coding", ids: ["spring-endpoints"] },
      },
      {
        id: "rebuild",
        phase: "rebuild",
        zh: "空手做：从零重写控制器",
        en: "Rebuild: the controller from nothing",
        whyZh: "空文件夹或一个空的 Spring Initializr 骨架，75 分钟，没有提示。这一档才是真实考试的样子。",
        whyEn:
          "An empty folder or an empty Spring Initializr skeleton, 75 minutes, no hints. This tier is what the real thing looks like.",
        source: { from: "arena", ids: ["g-rebuild-controller"] },
      },
    ],
  },

  /* ---------------------------------------------------------- */
  {
    id: "frontend-interview",
    zh: "前端面试复习",
    en: "Frontend Interview Review",
    outcomeZh: "105 道问答用嘴答一遍，再把 15 道手写题和组件题写一遍。",
    outcomeEn:
      "Answer all 105 questions out loud, then write the 15 hand-written and component problems.",
    forZh: "下周有面试，要的是「说得出」加「当场写得出」。",
    forEn: "An interview next week: you need to say it, and to write it on the spot.",
    stages: [
      {
        id: "rev-markup",
        phase: "review",
        zh: "背：HTML 与 CSS",
        en: "Review: HTML and CSS",
        whyZh: "13 道。开场最常问的一批，答错的代价是面试官对后面的问题降低期待。",
        whyEn:
          "13 questions. The batch most often asked first, and getting them wrong lowers what the interviewer expects from the rest.",
        source: { from: "drills", tracks: ["html", "css"] },
      },
      {
        id: "rev-js",
        phase: "review",
        zh: "背：JavaScript 与 TypeScript",
        en: "Review: JavaScript and TypeScript",
        whyZh: "44 道，是题库里最大的一块：引擎、类型、函数与作用域、this、事件循环，加 6 道 TypeScript 深度。",
        whyEn:
          "44 questions, the largest block: the engine, types, functions and scope, this, the event loop, plus six on TypeScript in depth.",
        source: { from: "drills", tracks: ["js", "ts"] },
      },
      {
        id: "rev-react",
        phase: "review",
        zh: "背：React 与生态",
        en: "Review: React and its ecosystem",
        whyZh: "36 道：React 是什么、组件怎么通信、Hooks、性能、Redux。",
        whyEn:
          "36 questions: what React is, how components communicate, Hooks, performance, Redux.",
        source: { from: "drills", tracks: ["react"] },
      },
      {
        id: "rev-backend",
        phase: "review",
        zh: "背：Node、数据库、网络与安全",
        en: "Review: Node, databases, networking and security",
        whyZh: "12 道。前端面试也会问 —— 尤其是事件循环、状态码和 XSS。",
        whyEn:
          "12 questions. Front-end interviews ask these too, especially the event loop, status codes and XSS.",
        source: { from: "drills", tracks: ["node", "db", "web"] },
      },
      {
        id: "learn",
        phase: "learn",
        zh: "学：手写题与组件题的讲解",
        en: "Learn: the walkthroughs",
        whyZh: "8 节。先读讲解再写，比对着答案抄一遍有用得多。",
        whyEn:
          "Eight lessons. Reading the walkthrough before writing beats copying an answer.",
        source: {
          from: "lessons",
          examId: "interview",
          moduleIds: ["iv-coding", "iv-hand"],
        },
      },
      {
        id: "practice",
        phase: "practice",
        zh: "练：这门课的练习",
        en: "Practice: this course's exercises",
        whyZh: "16 个，其中 11 个是「写整块」—— 和面试白板题的形状最接近。",
        whyEn:
          "16 of them, 11 write-a-block, which is the closest thing here to a whiteboard question.",
        source: { from: "exercises", examId: "interview" },
      },
      {
        id: "code-hand",
        phase: "code",
        zh: "写：手写题",
        en: "Code: implement it yourself",
        whyZh: "debounce、throttle、deepClone、flatten、curry、Promise.all、EventEmitter、LRU。八道都能在浏览器里跑测试。",
        whyEn:
          "debounce, throttle, deepClone, flatten, curry, Promise.all, EventEmitter, LRU. All eight run their tests in the browser.",
        source: { from: "coding", ids: HAND_CODING },
      },
      {
        id: "code-widgets",
        phase: "code",
        zh: "写：组件与状态管理题",
        en: "Code: components and state management",
        whyZh: "Tabs、星级、Dropdown、自定义 hook、媒体播放器、看板、Redux Toolkit。现场最常出的组件题。",
        whyEn:
          "Tabs, star rating, dropdown, a custom hook, a media player, a Kanban board, Redux Toolkit. The component questions asked most often.",
        source: { from: "coding", ids: WIDGET_CODING },
      },
    ],
  },

  /* ---------------------------------------------------------- */
  {
    id: "cab-booking",
    zh: "Cab Booking 完整练习",
    en: "Cab Booking",
    outcomeZh: "在空文件夹里搭出整个 Cab Booking 应用：Context 管全局状态，四个页面一个状态机，四个测试全过。",
    outcomeEn:
      "Build the whole Cab Booking app in an empty folder: Context for global state, four pages on one state machine, all four tests passing.",
    forZh: "要做那道用 Context 管全局状态的 React 应用题。",
    forEn: "Facing the React task that holds global state in Context.",
    stages: [
      {
        id: "prereq-f",
        phase: "prereq",
        zh: "前置：地基",
        en: "Prerequisites: Foundations",
        whyZh: "要自己起一个 Vite + React 项目、要读 ESM 的报错。这一档就是这些。",
        whyEn:
          "You will start a Vite plus React project yourself and read ESM errors. That is what this course covers.",
        source: { from: "lessons", examId: "foundations" },
      },
      {
        id: "prereq-r",
        phase: "prereq",
        zh: "前置：这道题用到的 React 那几节",
        en: "Prerequisites: the React lessons this task leans on",
        whyZh: "这道题只用到 React 里的五样东西：组件、props、useState、useEffect、Context。不用把整门 React 课走完。",
        whyEn:
          "This task uses only five things from React: components, props, useState, useEffect and Context. You do not need the whole React course.",
        source: {
          from: "lessons",
          examId: "react",
          lessonIds: [
            "r-component",
            "r-props",
            "r-state",
            "r-useeffect",
            "r-var-theme-context",
          ],
        },
      },
      {
        id: "learn",
        phase: "learn",
        zh: "学：Cab Booking 课文",
        en: "Learn: the Cab Booking lessons",
        whyZh: "8 节。Context 放在哪一层是这道题最常见的失败方式，第 1 部分专门讲它。",
        whyEn:
          "Eight lessons. Which level the Context goes on is the most common way to fail this task, and Part 1 is about exactly that.",
        source: { from: "lessons", examId: "cab-booking" },
      },
      {
        id: "practice",
        phase: "practice",
        zh: "练：Cab Booking 的课内练习",
        en: "Practice: the Cab Booking exercises",
        whyZh: "15 个。包含那个「脚手架自己跑不起来，原因是一个文件扩展名」的 Debug Lab。",
        whyEn:
          "15 of them, including the debug lab where the provided project does not run and the cause is one file extension.",
        source: { from: "exercises", examId: "cab-booking" },
      },
      {
        id: "code",
        phase: "code",
        zh: "写：Context 版 Cab Booking",
        en: "Code: the Context version",
        whyZh: "带脚手架写一遍，四个测试跑绿。第二遍点「空白重来」才算验收。",
        whyEn:
          "Write it once with the scaffold and take the four tests green. The pass that counts is the second one, with start blank.",
        source: { from: "coding", ids: ["cab-booking-app"] },
      },
      {
        id: "rebuild",
        phase: "rebuild",
        zh: "空手做：整个应用从零重写",
        en: "Rebuild: the whole app from nothing",
        whyZh: "只给四个测试和一份数据文件，60 分钟。历史只留最新三条、最新在最上 —— 这两个细节决定过不过。",
        whyEn:
          "Four tests, one data file, 60 minutes. The history keeps only the three most recent with the newest first, and those two details decide pass or fail.",
        source: { from: "arena", ids: ["cb-from-scratch"] },
      },
    ],
  },
];

/* ============================================================
   解析：把「查询」展开成一串真实条目
   ============================================================ */

export interface PlanItem {
  /** 全站唯一且稳定。进度查询和 React key 都用它 */
  key: string;
  kind: "lesson" | "exercise" | "drill" | "coding" | "arena" | "mock";
  /** 这一条属于哪个模式 —— 条目上那枚小徽章 */
  mode: ModeId;
  href: string;
  zh: string;
  en?: string;
  /** 有估时的才有（课文、coding、考场、模拟考）。练习和八股没有 */
  minutes?: number;
  /** 进度查询用。lesson / exercise / mock 需要它 */
  examId?: string;
  /** 原始 id：lessonId / exerciseId / drillId / codingId / arenaId / mockId */
  id: string;
  /** 只有 exercise 有：练习的题型，决定完成状态查 exercises 还是 rebuilds */
  exerciseKind?: string;
  /** 只有 exercise 有：它在哪一节课里（锚点要用） */
  lessonId?: string;
}

export interface ResolvedStage extends PlanStage {
  items: PlanItem[];
  layout: "rows" | "chips";
}

export interface ResolvedPlan extends Plan {
  stages: ResolvedStage[];
  items: PlanItem[];
  /** 有估时的那些条目的分钟数之和 */
  minutes: number;
}

/** 练习和八股超过这个条数就改用格子摊开 */
const CHIP_THRESHOLD = 14;

/**
 * 自动选摊开方式。
 *
 * 只有练习和八股会变成格子 —— 它们一档几十条，而且单条的名字对
 * 「我走到哪了」没多少信息量。课文、coding、考场、模拟考一律一行一个：
 * 那些是有名字、有估时、值得单独点进去的东西。
 */
function autoLayout(source: StageSource, n: number): "rows" | "chips" {
  const dense = source.from === "exercises" || source.from === "drills";
  return dense && n > CHIP_THRESHOLD ? "chips" : "rows";
}

const examOrThrow = (planId: string, examId: string) => {
  const e = navExam(examId);
  if (!e) throw new Error(`plans: 计划 ${planId} 引用了不存在的课程 ${examId}`);
  return e;
};

function lessonsOfSource(
  planId: string,
  s: Extract<StageSource, { from: "lessons" }>,
): PlanItem[] {
  const exam = examOrThrow(planId, s.examId);
  const mods = s.moduleIds
    ? s.moduleIds.map((id) => {
        const m = exam.modules.find((x) => x.id === id);
        if (!m) throw new Error(`plans: 计划 ${planId} 引用了不存在的模块 ${s.examId}/${id}`);
        return m;
      })
    : exam.modules;

  const flat = mods.flatMap((m) => m.lessons);
  const picked = s.lessonIds
    ? s.lessonIds.map((id) => {
        const l = flat.find((x) => x.id === id);
        if (!l) throw new Error(`plans: 计划 ${planId} 引用了不存在的课文 ${s.examId}/${id}`);
        return l;
      })
    : flat;

  return picked.map((l) => ({
    key: `lesson:${exam.id}/${l.id}`,
    kind: "lesson",
    mode: "learn",
    href: lessonPath(exam.id, l.id),
    zh: l.title,
    en: l.titleEn,
    minutes: l.minutes,
    examId: exam.id,
    id: l.id,
  }));
}

function exercisesOfSource(
  planId: string,
  s: Extract<StageSource, { from: "exercises" }>,
): PlanItem[] {
  const exam = examOrThrow(planId, s.examId);
  const mods = s.moduleIds
    ? s.moduleIds.map((id) => {
        const m = exam.modules.find((x) => x.id === id);
        if (!m) throw new Error(`plans: 计划 ${planId} 引用了不存在的模块 ${s.examId}/${id}`);
        return m;
      })
    : exam.modules;

  const lessons = mods
    .flatMap((m) => m.lessons)
    .filter((l) => (s.lessonIds ? s.lessonIds.includes(l.id) : true));

  if (s.lessonIds) {
    for (const id of s.lessonIds) {
      if (!lessons.some((l) => l.id === id)) {
        throw new Error(`plans: 计划 ${planId} 引用了不存在的课文 ${s.examId}/${id}`);
      }
    }
  }

  // EXERCISES 是按「课程 → 课文 → 练习」的原顺序生成的，所以按 lessonId 过滤
  // 之后顺序仍然是课文顺序 —— 计划里「做练习」那一档的排列因此和课程一致。
  const ids = new Set(lessons.map((l) => l.id));
  const flat = EXERCISES.filter((x) => x.examId === exam.id && ids.has(x.lessonId));

  const picked = s.exerciseIds
    ? s.exerciseIds.map((id) => {
        const hit = flat.find((x) => x.id === id);
        if (!hit) {
          throw new Error(`plans: 计划 ${planId} 引用了不存在的练习 ${s.examId}/${id}`);
        }
        return hit;
      })
    : flat;

  return picked.map((ex) => ({
    key: `exercise:${exam.id}/${ex.id}`,
    kind: "exercise",
    mode: "practice",
    // 练习没有自己的路由 —— 它在课文页尾，锚点是 exercise.tsx 里那个 id
    href: `${lessonPath(exam.id, ex.lessonId)}#ex-${ex.id}`,
    zh: ex.title,
    en: ex.titleEn,
    examId: exam.id,
    id: ex.id,
    exerciseKind: ex.kind,
    lessonId: ex.lessonId,
  }));
}

function drillsOfSource(
  planId: string,
  s: Extract<StageSource, { from: "drills" }>,
): PlanItem[] {
  for (const t of s.tracks) {
    if (!DRILL_TRACK_ORDER.includes(t)) {
      throw new Error(`plans: 计划 ${planId} 引用了不存在的八股方向 ${t}`);
    }
  }
  // 按 DRILL_TRACK_ORDER 排，而不是按 tracks 数组给的顺序 ——
  // 全站只有一个方向顺序，两处不一致的话侧栏和计划页会给出不同的排列。
  const order = DRILL_TRACK_ORDER.filter((t) => s.tracks.includes(t));
  return order.flatMap((t) =>
    DRILLS.filter((d) => d.track === t).map((d) => ({
      key: `drill:${d.id}`,
      kind: "drill" as const,
      mode: "review" as const,
      href: drillPath(d.id),
      zh: d.zh,
      en: d.en,
      id: d.id,
    })),
  );
}

function codingOfSource(
  planId: string,
  s: Extract<StageSource, { from: "coding" }>,
): PlanItem[] {
  return s.ids.map((id) => {
    const c = CODING.find((x) => x.id === id);
    if (!c) throw new Error(`plans: 计划 ${planId} 引用了不存在的 coding 题 ${id}`);
    return {
      key: `coding:${c.id}`,
      kind: "coding" as const,
      mode: "practice" as const,
      href: codingPath(c.id),
      zh: c.title,
      en: c.titleEn,
      minutes: c.minutes,
      id: c.id,
    };
  });
}

function arenaOfSource(
  planId: string,
  s: Extract<StageSource, { from: "arena" }>,
): PlanItem[] {
  return s.ids.map((id) => {
    const a = ARENA.find((x) => x.id === id);
    if (!a) throw new Error(`plans: 计划 ${planId} 引用了不存在的考场题 ${id}`);
    return {
      key: `arena:${a.id}`,
      kind: "arena" as const,
      mode: "assess" as const,
      href: arenaPath(a.id),
      zh: a.title,
      en: a.titleEn,
      minutes: a.minutes,
      id: a.id,
    };
  });
}

function mockOfSource(
  planId: string,
  s: Extract<StageSource, { from: "mock" }>,
): PlanItem[] {
  return s.refs.map(({ examId, mockId }) => {
    const exam = examOrThrow(planId, examId);
    const m = exam.mockExams.find((x) => x.id === mockId);
    if (!m) {
      throw new Error(`plans: 计划 ${planId} 引用了不存在的模拟考 ${examId}/${mockId}`);
    }
    return {
      key: `mock:${examId}/${m.id}`,
      kind: "mock" as const,
      mode: "assess" as const,
      href: mockPath(examId, m.id),
      zh: m.title,
      en: m.titleEn,
      minutes: m.minutes,
      examId,
      id: m.id,
    };
  });
}

function itemsOfStage(planId: string, stage: PlanStage): PlanItem[] {
  switch (stage.source.from) {
    case "lessons":
      return lessonsOfSource(planId, stage.source);
    case "exercises":
      return exercisesOfSource(planId, stage.source);
    case "drills":
      return drillsOfSource(planId, stage.source);
    case "coding":
      return codingOfSource(planId, stage.source);
    case "arena":
      return arenaOfSource(planId, stage.source);
    case "mock":
      return mockOfSource(planId, stage.source);
  }
}

/**
 * 把一条计划展开。
 *
 * 结果缓存 —— 六条计划一共几百个条目，每次渲染都重算是白烧 CPU，
 * 而 NAV 是构建期常量，展开结果不会变。
 */
const CACHE = new Map<string, ResolvedPlan>();

export function resolvePlan(plan: Plan): ResolvedPlan {
  const hit = CACHE.get(plan.id);
  if (hit) return hit;

  const stages: ResolvedStage[] = plan.stages.map((s) => {
    const items = itemsOfStage(plan.id, s);
    return {
      ...s,
      items,
      layout: s.layout ?? autoLayout(s.source, items.length),
    };
  });

  const items = stages.flatMap((s) => s.items);
  const out: ResolvedPlan = {
    ...plan,
    stages,
    items,
    minutes: items.reduce((n, i) => n + (i.minutes ?? 0), 0),
  };
  CACHE.set(plan.id, out);
  return out;
}

export const planById = (id: string | undefined): Plan | undefined =>
  id ? PLANS.find((p) => p.id === id) : undefined;

export const resolvedPlanById = (id: string | undefined): ResolvedPlan | undefined => {
  const p = planById(id);
  return p ? resolvePlan(p) : undefined;
};

/** 一条计划里，某个条目属于哪一档（第几档、总共几档）。页面上的「计划位置」用它 */
export function locateInPlan(
  plan: ResolvedPlan,
  key: string,
): { stage: ResolvedStage; stageIndex: number; itemIndex: number } | undefined {
  for (let i = 0; i < plan.stages.length; i++) {
    const idx = plan.stages[i].items.findIndex((it) => it.key === key);
    if (idx >= 0) return { stage: plan.stages[i], stageIndex: i, itemIndex: idx };
  }
  return undefined;
}

/** 这一档覆盖了哪几个八股方向。「背」那一档要把方向名列出来 */
export function tracksOfStage(stage: PlanStage): NavDrillTrack[] {
  const src = stage.source;
  if (src.from !== "drills") return [];
  return DRILL_TRACK_ORDER.filter((t) => src.tracks.includes(t));
}
