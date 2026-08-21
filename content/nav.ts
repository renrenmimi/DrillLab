// 导航用的轻量元数据 —— 由 content/registry 派生。
//
// 为什么要有这个文件：课程内容里带 JSX（ReactNode），只能在客户端组件里 import，
// 而侧栏 / 首页 / 学习路径 / 搜索这些客户端组件只需要标题和计数。
// 如果它们直接 import registry，全部课程的正文都会被打进客户端包（实测 784 KB）。
// 所以这里放一份「只有文字和数字」的镜像，客户端组件只读这个。
//
// 【怎么保持同步】不要手改。改完内容后跑：
//     npm run gen:nav
// 它会重新从真实内容里 dump 一份覆盖这个文件。
// 另外 assertNavInSync() 会在开发模式下检查两边是否一致，不一致直接抛错。

/**
 * 侧栏、首页、路线图这些客户端组件要用的最小课程信息。
 *
 * 【为什么这里这么瘦】
 * 曾经这里还挂着 objectives / whyForAssessment / conceptHeadings /
 * conceptLedes / exerciseTitles / sourcePaths / recap / transfer 八个字段。
 * 它们只有一个消费者 —— 搜索的 haystack。而搜索是 ⌘K 才打开的，
 * 那八个字段却让**每一个页面**都多下 80 kB（gzip 后，实测）。
 * 现在它们搬去了 content/search-index.ts，由 search.tsx 在用户真的
 * 打开搜索时才 import()。改完实测：/drill 首屏 199 kB → 见 README。
 *
 * 所以：**往这里加字段之前先问一句「客户端首屏真的需要它吗」**。
 * 只给搜索用的，加到 search-index 那边去。
 */
export interface NavLesson {
  id: string;
  title: string;
  /** 英文标题。没补就是 undefined，<T> 会回落中文 —— 见 content/types.ts 的 Lesson.titleEn */
  titleEn?: string;
  blurb: string;
  blurbEn?: string;
  minutes: number;
  exerciseCount: number;
}

export interface NavModule {
  id: string;
  title: string;
  titleEn?: string;
  summary: string;
  summaryEn?: string;
  stage?: string;
  lessons: NavLesson[];
}

export interface NavMock {
  id: string;
  title: string;
  scenario: string;
  mirrors: string;
  minutes: number;
  taskCount: number;
  taskTitles: string[];
  outOf: number;
}

export interface NavExam {
  id: string;
  title: string;
  titleEn?: string;
  shortTitle: string;
  shortTitleEn?: string;
  description: string;
  descriptionEn?: string;
  category: string;
  tests: string;
  testsEn?: string;
  stack: string[];
  status: string;
  prerequisites: string[];
  sourceProjects: { path: string; role: string; roleEn?: string }[];
  lessonCount: number;
  exerciseCount: number;
  minutes: number;
  debugLabs: number;
  rebuilds: number;
  rebuildIds: string[];
  modules: NavModule[];
  mockExams: NavMock[];
  checklist: { task: string; covered: string; tested: boolean }[];
}

/* ---------- 刷题层的轻量清单 ----------
   客户端组件（筛选、抽认卡、搜索、列表）只读这几个数组。
   题目正文不在这里 —— 正文由服务端组件从 content/drills 取。 */

export type NavDrillTrack = "html" | "css" | "js" | "react" | "node" | "db" | "web" | "ts";

export interface NavDrill {
  id: string;
  bank: number[];
  zh: string;
  en: string;
  track: NavDrillTrack;
  lessonId: string;
  examId: string;
  /** 这道题有没有英文答案 */
  hasEn: boolean;
}

export interface NavCoding {
  id: string;
  title: string;
  titleEn?: string;
  track: "react" | "js" | "graphql" | "java";
  difficulty: 1 | 2 | 3;
  minutes: number;
  runnable: boolean;
  /** 沙箱填好了没有 —— 没填就只显示「本机跑」卡片 */
  hasSandbox: boolean;
  explainLessonId?: string;
  requirementCount: number;
}

export interface NavArena {
  id: string;
  title: string;
  titleEn?: string;
  scenario: string;
  scenarioEn?: string;
  minutes: number;
  examId: string;
  fromMock: boolean;
  requirementCount: number;
  commandCount: number;
  runnable: boolean;
}

interface NavPayload {
  exams: NavExam[];
  drills: NavDrill[];
  coding: NavCoding[];
  arena: NavArena[];
}

const PAYLOAD: NavPayload = {
  "exams": [
    {
      "id": "foundations",
      "title": "地基 · 项目怎么跑起来，JS/TS 到底要会哪些",
      "titleEn": "Foundations · how a project runs, and the JS/TS you actually need",
      "shortTitle": "地基 · 项目与语言",
      "shortTitleEn": "Foundations · project and language",
      "descriptionEn": "Before starting React or GraphQL, get clear on how a JavaScript project runs: Node, npm, package.json, scripts, the directory layout, how to run the tests, and where to look first when something fails. After that, only the JavaScript and TypeScript that the two exam projects actually use.",
      "description": "在动 React 和 GraphQL 之前，先把「一个 JavaScript 项目是怎么运行的」搞清楚：Node、npm、package.json、scripts、目录结构、怎么跑测试、报错该从哪看起。然后只补两门考试真正会用到的 JavaScript 与 TypeScript。",
      "category": "基础",
      "tests": "这一门本身不是考试，是另外两门的地基。考场上真正会卡住新手的往往不是 React 语法，而是「测试怎么跑」「这个报错是我写错了还是项目本来就坏的」「dependencies 和 devDependencies 有什么区别」这类问题。",
      "testsEn": "This course is not an exam itself. It is the base the other two stand on. What usually stops a beginner in an exam is not React syntax. It is questions like how to run the tests, whether an error is your own mistake or a defect that was already in the project, and what the difference is between dependencies and devDependencies.",
      "stack": [
        "Node.js 22",
        "npm",
        "ESM",
        "JavaScript",
        "TypeScript 5"
      ],
      "status": "ready",
      "prerequisites": [],
      "sourceProjects": [
        {
          "path": "react-notes-app",
          "role": "React Capstone，提供真实 package.json / tsconfig / vite 配置"
        },
        {
          "path": "graphql-federation-practice",
          "role": "Federation Capstone，提供真实 subgraph package.json / pom.xml"
        }
      ],
      "lessonCount": 9,
      "exerciseCount": 16,
      "minutes": 114,
      "debugLabs": 2,
      "rebuilds": 0,
      "rebuildIds": [],
      "modules": [
        {
          "id": "how-projects-run",
          "title": "一个 JavaScript 项目是怎么运行的",
          "titleEn": "How a JavaScript project runs",
          "summary": "从 Node.js 是什么开始，一路讲到「我怎么知道这个项目支持哪些命令」。全部用两个真实 assessment 的文件当例子。",
          "summaryEn": "Starts at what Node.js is and ends at how to find out which commands a project supports. Every example is a real file from one of the two exam projects.",
          "stage": "地基 · 第 1 部分",
          "lessons": [
            {
              "id": "node-and-npm",
              "title": "Node.js、npm、node_modules 和 lockfile",
              "titleEn": "Node.js, npm, node_modules and the lockfile",
              "blurb": "为什么装个 React 项目会多出几万个文件，以及为什么那个 lock 文件不能随便删。",
              "blurbEn": "Why installing a React project adds tens of thousands of files, and why you must not delete that lock file.",
              "minutes": 12,
              "exerciseCount": 2
            },
            {
              "id": "package-json",
              "title": "package.json 逐字段读一遍",
              "titleEn": "package.json, field by field",
              "blurb": "拿两个真实 assessment 的 package.json，一个字段一个字段地读懂。",
              "blurbEn": "Take the package.json of both real exam projects and read them one field at a time.",
              "minutes": 14,
              "exerciseCount": 1
            },
            {
              "id": "npm-scripts",
              "title": "npm scripts：命令到底跑了什么",
              "titleEn": "npm scripts: what the command actually runs",
              "blurb": "npm test 和 npm run test 有什么区别，以及 react-notes-app 为什么根本跑不了 npm test。",
              "blurbEn": "How npm test differs from npm run test, and why npm test cannot run at all in react-notes-app.",
              "minutes": 13,
              "exerciseCount": 2
            },
            {
              "id": "project-layout",
              "title": "两个考试项目的目录，逐个说明",
              "titleEn": "The directory layout of both exam projects",
              "blurb": "哪些文件是你要改的，哪些是给好的，哪些是干扰项。",
              "blurbEn": "Which files you are meant to edit, which are already done for you, and which are there to distract you.",
              "minutes": 12,
              "exerciseCount": 2
            }
          ]
        },
        {
          "id": "js-essentials",
          "title": "JavaScript：只补考试真正会用的那几样",
          "titleEn": "JavaScript: only the parts the exams use",
          "summary": "不做完整 JS 教程。只讲 CRUD 三件事（增删改）背后的数组与对象操作，以及 Q2 和 resolver 都离不开的异步。",
          "summaryEn": "Not a full JavaScript course. It covers the array and object work behind adding, deleting and updating, plus the async parts that both Q2 and the resolvers depend on.",
          "stage": "地基 · 第 2 部分",
          "lessons": [
            {
              "id": "js-immutable-data",
              "title": "数组与对象：不可变更新三件套",
              "titleEn": "Arrays and objects: three ways to update without changing the original",
              "blurb": "增、删、改一个列表，在 React 里为什么必须「造新的」而不是「改旧的」。",
              "blurbEn": "Adding to, deleting from and editing a list: why React needs a new array instead of a changed one.",
              "minutes": 14,
              "exerciseCount": 2
            },
            {
              "id": "js-async",
              "title": "异步：Promise、await、all 和 allSettled",
              "titleEn": "Async: Promise, await, all and allSettled",
              "blurb": "Q2 整道题就是异步，GraphQL resolver 每一个都是 async。这一节把它们讲透。",
              "blurbEn": "All of Q2 is async work, and every GraphQL resolver is async. This lesson covers all of it.",
              "minutes": 15,
              "exerciseCount": 3
            },
            {
              "id": "js-modules",
              "title": "ESM:import / export 与那些莫名其妙的报错",
              "titleEn": "ESM: import / export, and the errors that look strange at first",
              "blurb": "为什么 subgraph 里 import 要写 .js 后缀，为什么 jest 要加一个实验性参数。",
              "blurbEn": "Why an import in the subgraph needs the .js ending, and why jest needs an experimental flag.",
              "minutes": 10,
              "exerciseCount": 1
            }
          ]
        },
        {
          "id": "ts-essentials",
          "title": "TypeScript：够用就好",
          "titleEn": "TypeScript: just enough",
          "summary": "只讲两个考试里真实出现的：基本类型、type 与 interface、组件 props 类型、泛型参数，以及怎么读 tsc 的报错。",
          "summaryEn": "Only what actually appears in the two exams: basic types, type versus interface, typing component props, generic parameters, and how to read a tsc error.",
          "stage": "地基 · 第 3 部分",
          "lessons": [
            {
              "id": "ts-types",
              "title": "类型、type 与 interface",
              "titleEn": "Types, type and interface",
              "blurb": "Note 和 NoteFormProps 这两个真实类型，把该讲的都讲全了。",
              "blurbEn": "Two real types from the project, Note and NoteFormProps, cover everything you need here.",
              "minutes": 12,
              "exerciseCount": 1
            },
            {
              "id": "ts-generics-and-errors",
              "title": "泛型参数，以及怎么读 tsc 的报错",
              "titleEn": "Generic parameters, and how to read a tsc error",
              "blurb": "useState<Note[]> 那对尖括号在说什么，和 react-notes-app 那 10 个构建错误的真相。",
              "blurbEn": "What the angle brackets in useState<Note[]> say, and the real cause of the 10 build errors in react-notes-app.",
              "minutes": 12,
              "exerciseCount": 2
            }
          ]
        }
      ],
      "mockExams": [],
      "checklist": []
    },
    {
      "id": "react",
      "title": "React Capstone",
      "titleEn": "React Capstone",
      "shortTitle": "React 考试",
      "shortTitleEn": "React exam",
      "descriptionEn": "Built on the real react-notes-app project: Q1 is a Notes Manager that adds, deletes and edits notes (CRUD), and Q2 is an async task runner that limits how many tasks run at the same time. It starts at what a component is and ends with rebuilding the whole project in an empty folder.",
      "description": "对应 react-notes-app 这个真实项目：Q1 是一个 Notes Manager 的增删改（CRUD），Q2 是一个带并发上限的异步任务调度器。从「组件是什么」讲到能在空文件夹里重建整个项目。",
      "category": "前端",
      "tests": "Q1 考的是 React 的数据流基本功：state 放在哪、怎么不可变更新、受控输入、useEffect 同步、列表 key、派生数据。Q2 完全不涉及 React，考的是 Promise 语义和并发控制。两道题共同的隐性考点是「能不能读清题」—— 「按 id」和「原位置」这两个词决定了一半的分数。",
      "testsEn": "Q1 tests the basics of how data moves through React: where state lives, how to update it without changing the original, controlled inputs, syncing with useEffect, list keys, and derived data. Q2 has no React in it at all; it tests what a Promise actually does and how to limit how many things run at the same time. Both questions quietly test one more skill: reading the wording closely. Two phrases in the brief decide half the score — by id, and in the original position.",
      "stack": [
        "React 18",
        "TypeScript strict",
        "Vite 5",
        "Vitest + Testing Library",
        "tsx"
      ],
      "status": "ready",
      "prerequisites": [
        "foundations"
      ],
      "sourceProjects": [
        {
          "path": "react-notes-app",
          "role": "参考项目。Vite + React 18 + TS strict + Vitest。本机实测 4 个测试全过（仓库里是完成版）",
          "roleEn": "Reference project. Vite + React 18 + TS strict + Vitest. All four tests pass as measured; the repo holds the finished version"
        }
      ],
      "lessonCount": 21,
      "exerciseCount": 54,
      "minutes": 348,
      "debugLabs": 14,
      "rebuilds": 2,
      "rebuildIds": [
        "r-rebuild-q1",
        "r-rebuild-q2"
      ],
      "modules": [
        {
          "id": "react-mental-model",
          "title": "React 心智模型",
          "titleEn": "The React mental model",
          "summary": "组件、props、state、事件、渲染。每一条都用 react-notes-app 里真实的组件当例子，不用虚构的 Counter。",
          "summaryEn": "Components, props, state, events, rendering. Every example is a real component from react-notes-app, never an invented Counter.",
          "stage": "React · 第 1 部分",
          "lessons": [
            {
              "id": "r-component",
              "title": "组件就是一个返回界面的函数",
              "titleEn": "A component is a function that returns what you see on screen",
              "blurb": "从这个项目最短的两个文件开始：App.tsx 只有 5 行。",
              "blurbEn": "Start with the two shortest files in this project: App.tsx is only 5 lines.",
              "minutes": 11,
              "exerciseCount": 2
            },
            {
              "id": "r-props",
              "title": "props：数据往下流，事件往上报",
              "titleEn": "props: data flows down, events go back up",
              "blurb": "为什么 NoteItem 里的 Delete 按钮，最终改的是 NoteManager 里的数据。",
              "blurbEn": "Why the Delete button inside NoteItem ends up changing data that lives in NoteManager.",
              "minutes": 12,
              "exerciseCount": 2
            },
            {
              "id": "r-state",
              "title": "useState：让界面跟着数据变",
              "titleEn": "useState: making the screen follow the data",
              "blurb": "两个 state 撑起了整道 Q1：notes 和 noteToEdit。",
              "blurbEn": "Two pieces of state carry the whole of Q1: notes and noteToEdit.",
              "minutes": 14,
              "exerciseCount": 2
            }
          ]
        },
        {
          "id": "react-hooks",
          "title": "受控输入、列表渲染与 useEffect",
          "titleEn": "Controlled inputs, rendering lists, and useEffect",
          "summary": "把 NoteForm 从头到尾读懂 —— 它一个文件里就用到了受控输入、useEffect 同步、派生数据和表单提交四件事。",
          "summaryEn": "Read NoteForm from top to bottom. That one file already does four things: controlled inputs, syncing with useEffect, derived data, and form submission.",
          "stage": "React · 第 2 部分",
          "lessons": [
            {
              "id": "r-controlled-input",
              "title": "受控输入：value + onChange 的闭环",
              "titleEn": "Controlled inputs: the loop between value and onChange",
              "blurb": "输入框里的字，其实存在 React 的 state 里，不在 DOM 里。",
              "blurbEn": "The text you type sits in React state, not in the DOM.",
              "minutes": 13,
              "exerciseCount": 2
            },
            {
              "id": "r-lists-keys",
              "title": "列表渲染与 key",
              "titleEn": "Rendering a list, and the key prop",
              "blurb": "notes.map(...) 那三行，以及为什么 key 不能用数组下标。",
              "blurbEn": "Those three lines of notes.map(...), and why key must not be the array index.",
              "minutes": 10,
              "exerciseCount": 2
            },
            {
              "id": "r-useeffect",
              "title": "useEffect：把 props 的变化同步进 state",
              "titleEn": "useEffect: copying a change in props into state",
              "blurb": "Task 3 的「点 Edit 后内容回填到表单」，靠的就是这 9 行。",
              "blurbEn": "In Task 3, clicking Edit puts the note back into the form. These 9 lines are what does it.",
              "minutes": 15,
              "exerciseCount": 2
            },
            {
              "id": "r-derived-lifting",
              "title": "派生数据与状态提升：什么不该做成 state",
              "titleEn": "Values you can compute, and lifting state up: what should not be state",
              "blurb": "isFormInvalid 为什么是一行普通变量，而不是第三个 useState。",
              "blurbEn": "Why isFormInvalid is one plain variable and not a third useState.",
              "minutes": 11,
              "exerciseCount": 3
            }
          ]
        },
        {
          "id": "react-q1",
          "title": "Q1 Notes Manager · 逐题拆解",
          "titleEn": "Q1 Notes Manager · one task at a time",
          "summary": "严格对应 react-notes-app README 的三个 Task。每一题都走同一套流程：读懂题 → 考什么 → 先想再写 → 分步实现 → 完整答案 → 为什么成立 → 常见错法 → 迁移。",
          "summaryEn": "Follows the three tasks in the react-notes-app README exactly. Every task takes the same route: read the wording → see what is being tested → think before you type → build it step by step → read the full answer → understand why it works → look at the common mistakes → apply the same shape elsewhere.",
          "stage": "React · 第 3 部分",
          "lessons": [
            {
              "id": "r-read-q1",
              "title": "先读题：三个任务、一条硬约束、四个测试",
              "titleEn": "Read the question first: three tasks, one rule you must not break, four tests",
              "blurb": "在写第一行代码之前，把题目、约束和判卷标准全部摸清。",
              "blurbEn": "Before writing a single line of code, get clear on the task, the constraints, and how it is graded.",
              "minutes": 13,
              "exerciseCount": 3
            },
            {
              "id": "r-task1-add",
              "title": "Task 1 · Add：提交表单，新笔记进入表格",
              "titleEn": "Task 1 · Add: submit the form and the new note appears in the table",
              "blurb": "三道题里最简单的一道，但它建立了后两道题的全部结构。",
              "blurbEn": "The easiest of the three tasks, but it sets up the whole structure the other two use.",
              "minutes": 12,
              "exerciseCount": 2
            },
            {
              "id": "r-task2-delete",
              "title": "Task 2 · Delete：点 Delete，该行按 id 被移除",
              "titleEn": "Task 2 · Delete: click Delete and that one row is removed by id",
              "blurb": "一行 filter。但「按 id」这三个字是有分量的。",
              "blurbEn": "One line of filter. But the words by id carry weight.",
              "minutes": 11,
              "exerciseCount": 3
            },
            {
              "id": "r-task3-edit",
              "title": "Task 3 · Edit：回填、改文字、就地更新、退出编辑",
              "titleEn": "Task 3 · Edit: refill the form, change the button text, update the row where it is, leave edit mode",
              "blurb": "四个要求串成一条链。这是整道 Q1 的压轴题。",
              "blurbEn": "Four requirements linked into one chain. This is the hardest part of Q1.",
              "minutes": 18,
              "exerciseCount": 3
            },
            {
              "id": "r-tests",
              "title": "四个测试逐条读，以及它们的盲区",
              "titleEn": "The four tests read line by line, and what they fail to catch",
              "blurb": "判卷器长什么样，它查什么，它查不到什么。",
              "blurbEn": "What the grader looks like, what it checks, and what it cannot check.",
              "minutes": 12,
              "exerciseCount": 3
            }
          ]
        },
        {
          "id": "react-q2",
          "title": "Q2 · 带并发上限的异步任务调度器",
          "titleEn": "Q2 · an async task runner that limits how many tasks run at the same time",
          "summary": "react-notes-app 的第二道题，和 React 完全无关。纯 TypeScript + 异步。考的是「你能不能自己实现一个 Promise.allSettled 加节流」。",
          "summaryEn": "The second question in react-notes-app, with no React in it at all. Pure TypeScript and async work. It asks whether you can write your own Promise.allSettled that also caps how many tasks are running at the same time.",
          "stage": "React · 第 4 部分",
          "lessons": [
            {
              "id": "r-q2-read",
              "title": "读题：三条要求，每一条都在指定一种写法",
              "titleEn": "Reading the question: three requirements, and each one decides how you write it",
              "blurb": "题面就写在 taskRunner.ts 的文件头注释里。逐条翻译。",
              "blurbEn": "The question is written in the header comment of taskRunner.ts. Take it one requirement at a time.",
              "minutes": 12,
              "exerciseCount": 2
            },
            {
              "id": "r-q2-implement",
              "title": "实现：worker pool（工人池）",
              "titleEn": "Building it: a worker pool, meaning a fixed number of workers sharing one queue",
              "blurb": "别想复杂了。就是「开 limit 个工人，一起从同一个待办队列里抢活」。",
              "blurbEn": "Do not overthink it. You start limit workers, and they all take jobs from the same to-do queue.",
              "minutes": 16,
              "exerciseCount": 3
            }
          ]
        },
        {
          "id": "react-variants",
          "title": "五道高频变式题",
          "titleEn": "Five variations that come up often",
          "summary": "TodoList、计时器、fetch 取数、递归评论树、主题切换（Context）。第一道是 Q1 的变式，后四道补的是源项目里没有但同类考试常考的东西：useEffect 清理函数、异步三态与竞态、递归组件与树形不可变更新、Context 与 value 记忆化。五道题的参考答案与测试都在本机跑过（36 / 36）。",
          "summaryEn": "A TodoList, a timer, fetching data, a recursive comment tree, and theme switching with Context. The first is a variation on Q1. The other four cover what the source project does not have but exams like this often ask for: the useEffect cleanup function, the three states of an async request and the race between two of them, components that render themselves and updating tree data without changing the original, and Context with its value wrapped in useMemo. Every reference answer and test here was run on a real machine (36 / 36).",
          "stage": "React · 第 5 部分",
          "lessons": [
            {
              "id": "r-var-todo",
              "title": "变式一 · Todo List",
              "titleEn": "Variation 1 · Todo List",
              "blurb": "和 Notes Manager 同一套骨架，多了一个布尔字段、一个筛选、两个批量操作。",
              "blurbEn": "The same skeleton as the Notes Manager, plus one boolean field, one filter, and two bulk actions.",
              "minutes": 14,
              "exerciseCount": 2
            },
            {
              "id": "r-var-timer",
              "title": "变式二 · 计时器：useEffect 的清理函数",
              "titleEn": "Variation 2 · a timer: the useEffect cleanup function",
              "blurb": "这道题真正的考点只有一个 —— 你会不会写 return () => clearInterval(id)。",
              "blurbEn": "This question really tests one thing: can you write return () => clearInterval(id).",
              "minutes": 16,
              "exerciseCount": 3
            },
            {
              "id": "r-var-fetch",
              "title": "变式三 · fetch 取数：loading、error 与竞态",
              "titleEn": "Variation 3 · fetching data: loading, error, and the race between two requests",
              "blurb": "三个状态好写，难的是「用户切换很快时，慢的旧请求把新数据覆盖了」。",
              "blurbEn": "The three states are easy. The hard part is when the user switches quickly and a slow old request overwrites the new data.",
              "minutes": 18,
              "exerciseCount": 3
            },
            {
              "id": "r-var-comment-tree",
              "title": "变式四 · 递归读取评论的评论",
              "titleEn": "Variation 4 · reading replies to replies with recursion",
              "blurb": "组件自己渲染自己；难点其实不在渲染，而在「给第四层加一条回复」怎么不改原树。",
              "blurbEn": "A component renders itself. The hard part is not the rendering, it is adding a reply four levels down without changing the original tree.",
              "minutes": 20,
              "exerciseCount": 3
            },
            {
              "id": "r-var-theme-context",
              "title": "变式五 · 主题切换：Context 怎么用",
              "titleEn": "Variation 5 · theme switching: how to use Context",
              "blurb": "createContext 三行就写完了。真正会挂的地方是「value 每次都是新对象」和「忘了套 Provider」。",
              "blurbEn": "createContext takes three lines. What actually breaks is a value that is a new object every render, and a missing Provider.",
              "minutes": 20,
              "exerciseCount": 3
            }
          ]
        },
        {
          "id": "react-mastery",
          "title": "综合 Debug、从零重写与题型迁移",
          "titleEn": "Mixed debugging, a full rebuild, and the same skills on a new question",
          "summary": "把前面的错误集中练一遍，然后在没有答案的情况下从空文件重建整个 Q1 和 Q2。这一模块是「会看」和「会做」的分界线。",
          "summaryEn": "Practise all the earlier mistakes in one place, then rebuild the whole of Q1 and Q2 from empty files with no answer to look at. This module is the line between being able to follow along and being able to do it yourself.",
          "stage": "React · 第 6 部分",
          "lessons": [
            {
              "id": "r-debug-lab",
              "title": "Debug Lab · React 十种典型故障",
              "titleEn": "Debug Lab · ten typical React failures",
              "blurb": "每一种都给真实报错（或真实的「没有报错」），你来判断、定位、修复、验证。",
              "blurbEn": "Each failure comes with the real error message, or with the real silence. You decide what it is, find it, fix it, and check the fix.",
              "minutes": 20,
              "exerciseCount": 4
            },
            {
              "id": "r-rebuild",
              "title": "从零重写：空文件夹到 4 个测试全过",
              "titleEn": "Write it again yourself: from an empty folder to 4 passing tests",
              "blurb": "不给答案。给需求、文件清单、验证命令和四级提示。这一关是分界线。",
              "blurbEn": "No answer is given. You get the requirements, the file list, the commands to check your work, and hints in four levels. This lesson is the dividing line.",
              "minutes": 60,
              "exerciseCount": 2
            }
          ]
        }
      ],
      "mockExams": [
        {
          "id": "support-tickets",
          "title": "模拟考 A · Support Ticket Board",
          "scenario": "IT 支持工单看板。可以新建工单（标题 + 优先级）、关闭工单、改派（编辑）工单，还能按优先级筛选。业务场景换了，数据结构多了一个枚举字段和一个筛选状态，但底层要你会的东西和 Notes Manager 一模一样。",
          "mirrors": "与真实 Q1 完全相同的考点：受控输入、列表渲染与 key、useState 的三种不可变更新（增 / 删 / 就地替换）、useEffect 同步外部 prop、派生数据、状态提升、双模式按钮与 id 复用。额外增加一个「筛选」考点 —— 这是这类题最常见的变式方向。",
          "minutes": 75,
          "taskCount": 5,
          "taskTitles": [
            "Task 1 · Create",
            "Task 2 · Close",
            "Task 3 · Reassign（就地编辑）",
            "Task 4 · Filter by priority（新增考点）",
            "Task 5 · 工程质量"
          ],
          "outOf": 100
        }
      ],
      "checklist": [
        {
          "task": "Q1 Task 1 · Add（提交表单，新笔记进入表格）",
          "covered": "完整讲解 + 填空 + L3 自写 + 从零重写",
          "tested": true
        },
        {
          "task": "Q1 Task 2 · Delete（按 id 移除）",
          "covered": "完整讲解 + 填空 + L3 自写 + Debug Lab",
          "tested": true
        },
        {
          "task": "Q1 Task 3 · Edit（回填 / 变 Update / 原位置更新 / 退出编辑）",
          "covered": "完整讲解 + 数据流图 + 填空 + L3 自写 + Debug Lab",
          "tested": true
        },
        {
          "task": "Q1 表单校验（空输入时按钮 disabled）",
          "covered": "派生数据那节 + L3 自写",
          "tested": true
        },
        {
          "task": "Q1 约束 · 不得修改 data-testid",
          "covered": "读题那节逐条列出 6 个 testid 及其用途 + Debug Lab",
          "tested": true
        },
        {
          "task": "Q2 · runTasks 并发上限调度器",
          "covered": "读题 + worker pool 完整推导 + 填空 + L3 自写 + 从零重写",
          "tested": false
        },
        {
          "task": "测试怎么跑（项目没有 test script）",
          "covered": "Foundations 的 npm scripts 那节 + 本门读题那节",
          "tested": true
        },
        {
          "task": "npm run build 原生失败（10 个 tsc 错误）",
          "covered": "Foundations 读 tsc 报错那节，判定为脚手架缺陷",
          "tested": true
        },
        {
          "task": "useEffect 的清理函数（源项目没考，同类考试常考）",
          "covered": "变式题「计时器」完整讲解 + 填空 + L3 自写 + Debug Lab（DrillLab 自出）",
          "tested": true
        },
        {
          "task": "异步取数的 loading / error / 竞态（原始需求提到但源项目没有）",
          "covered": "变式题「fetch 取数」完整讲解 + 填空 + L3 自写 + Debug Lab（DrillLab 自出）",
          "tested": true
        },
        {
          "task": "递归组件与树形数据的不可变更新",
          "covered": "变式题「递归评论树」完整讲解 + 填空 + L3 自写 + Debug Lab（DrillLab 自出）",
          "tested": true
        },
        {
          "task": "Context：createContext / Provider / useContext 与 value 记忆化",
          "covered": "变式题「主题切换」完整讲解 + 填空 + L3 自写 + Debug Lab（DrillLab 自出）",
          "tested": true
        }
      ]
    },
    {
      "id": "graphql-federation",
      "title": "GraphQL Federation Capstone",
      "titleEn": "GraphQL Federation Capstone",
      "shortTitle": "Federation 考试",
      "shortTitleEn": "Federation exam",
      "descriptionEn": "Built on the real project graphql-federation-practice: one Apollo Federation subgraph (Node.js), one Spring Boot REST microservice, and two written questions. It starts at what GraphQL is and ends with rebuilding the whole subgraph in an empty directory.",
      "description": "对应 graphql-federation-practice 这个真实项目：一个 Apollo Federation subgraph（Node.js）加一个 Spring Boot REST 微服务，再加两道书面题。从「GraphQL 是什么」讲到能在空目录里重建整个 subgraph。",
      "category": "后端",
      "tests": "Task 1 考 GraphQL 与 Federation 的基本功：schema 的可空性怎么决定 resolver 的兜底、parent 从哪来、entity 与 @key、DataLoader 防 N+1、结构化错误与 correlation id。Task 2 考 REST 语义：状态码选对没有、异常该谁处理。两道书面题考的是「有没有在真实系统里想过延迟传播和生产配置」。贯穿全题的隐性考点是「能不能核对而不是猜」—— starter 里有三处人为埋雷。",
      "testsEn": "Task 1 covers the basics of GraphQL and Federation: how a nullable field in the schema decides what the resolver returns as a fallback, where parent comes from, entity and @key, using DataLoader to avoid N+1, and structured errors with a correlation id. Task 2 covers what the REST rules require: whether the status codes are right, and who should handle the exceptions. The two written questions ask whether you have thought about how delay spreads and how a service is configured in production. One point runs through the whole exam: can you check instead of guess — the starter has three bugs planted on purpose.",
      "stack": [
        "Apollo Server 4",
        "@apollo/subgraph 2.7",
        "GraphQL 16",
        "DataLoader",
        "Node ESM + Jest",
        "Java 17",
        "Spring Boot 3.3",
        "Maven"
      ],
      "status": "ready",
      "prerequisites": [
        "foundations"
      ],
      "sourceProjects": [
        {
          "path": "graphql-federation-practice",
          "role": "参考项目。本机实测基线：subgraph 6 failed / 4 passed，Java 5 run / 2 failures",
          "roleEn": "Reference project. Measured baseline: subgraph 6 failed / 4 passed, Java 5 run / 2 failures"
        }
      ],
      "lessonCount": 17,
      "exerciseCount": 47,
      "minutes": 333,
      "debugLabs": 8,
      "rebuilds": 2,
      "rebuildIds": [
        "g-rebuild-subgraph",
        "g-rebuild-controller"
      ],
      "modules": [
        {
          "id": "gql-basics",
          "title": "GraphQL 基础",
          "titleEn": "GraphQL basics",
          "summary": "schema、type、field、query、resolver、非空与列表。全部用 node-subgraph 的真实 schema.graphql 当例子 —— 这份 schema 的每个细节后面都会变成考点。",
          "summaryEn": "schema, type, field, query, resolver, non-null and lists. Every example is the real schema.graphql from node-subgraph, and every detail in that schema turns into an exam point later.",
          "stage": "Federation · 第 1 部分",
          "lessons": [
            {
              "id": "g-what-is",
              "title": "GraphQL 是什么：一份 schema 加一堆 resolver",
              "titleEn": "What GraphQL is: one schema plus a set of resolvers",
              "blurb": "读真实的 schema.graphql，把 type / field / Query / Mutation 一次讲清。",
              "blurbEn": "Read the real schema.graphql and cover type / field / Query / Mutation in one pass.",
              "minutes": 15,
              "exerciseCount": 3
            },
            {
              "id": "g-resolver",
              "title": "resolver 的四个参数",
              "titleEn": "The four arguments of a resolver",
              "blurb": "(parent, args, context, info) —— 这四个东西是整门考试的操作台。",
              "blurbEn": "(parent, args, context, info) — you use these four in every task of this exam.",
              "minutes": 14,
              "exerciseCount": 3
            },
            {
              "id": "g-nullable",
              "title": "非空、列表，和那个没有 price 的 input",
              "titleEn": "Non-null, lists, and the input that has no price",
              "blurb": "schema 里两处细节，直接决定四个 TODO 里三个的对错。",
              "blurbEn": "Two details in the schema decide whether three of the four TODOs are right.",
              "minutes": 13,
              "exerciseCount": 3
            }
          ]
        },
        {
          "id": "fed-mental-model",
          "title": "Federation 心智模型",
          "titleEn": "A mental model for Federation",
          "summary": "为什么要拆、subgraph 是什么、entity 和 @key 在解决什么问题、Router 怎么把碎片缝起来、DataLoader 为什么必须出现。",
          "summaryEn": "Why one schema gets split up, what a subgraph is, what problem entity and @key solve, how the Router joins the pieces back into a single schema, and why DataLoader is needed.",
          "stage": "Federation · 第 2 部分",
          "lessons": [
            {
              "id": "g-why-federation",
              "title": "为什么会有 Federation",
              "titleEn": "Why Federation exists",
              "blurb": "一张大 schema 拆成几个服务，代价是什么，换来什么。",
              "blurbEn": "One big schema split across several services: what it costs and what you get.",
              "minutes": 11,
              "exerciseCount": 2
            },
            {
              "id": "g-subgraph",
              "title": "subgraph 是怎么跑起来的",
              "titleEn": "How a subgraph starts up",
              "blurb": "buildSubgraphSchema 做了什么，为什么它会凭空多出两个字段。",
              "blurbEn": "What buildSubgraphSchema does, and why two fields appear that you never wrote.",
              "minutes": 13,
              "exerciseCount": 2
            },
            {
              "id": "g-entity",
              "title": "entity、@key 与 __resolveReference",
              "titleEn": "entity, @key and __resolveReference",
              "blurb": "「另一个服务要用哪个字段找到这个对象？」—— 想清这一句，这三个概念全通。",
              "blurbEn": "Which field does another service use to find this object? Answer that one question and all three ideas become clear.",
              "minutes": 16,
              "exerciseCount": 3
            },
            {
              "id": "g-dataloader",
              "title": "N+1 问题与 DataLoader",
              "titleEn": "The N+1 problem and DataLoader",
              "blurb": "客户端一句话，后端 100 次请求 —— 以及一个 30 行的解药。",
              "blurbEn": "One client query, 100 backend requests — and a 30-line fix.",
              "minutes": 14,
              "exerciseCount": 4
            }
          ]
        },
        {
          "id": "fed-task1",
          "title": "Task 1 · subgraph resolver 逐项拆解",
          "titleEn": "Task 1 · the subgraph resolvers, one at a time",
          "summary": "四个 TODO 加三处埋雷。每个 TODO 都走同一套流程：读题 → 考什么 → 先想再写 → 分步实现 → 完整答案 → 为什么成立 → 常见错法 → 迁移。",
          "summaryEn": "Four TODOs plus three planted bugs. Every TODO follows the same steps: read the task, see what it tests, think before writing, build it step by step, read the full answer, understand why it works, look at the common mistakes, then reuse the pattern elsewhere.",
          "stage": "Federation · 第 3 部分",
          "lessons": [
            {
              "id": "g-read-task1",
              "title": "先读题：四个 TODO、三处埋雷、十个测试",
              "titleEn": "Read the task first: four TODOs, three planted bugs, ten tests",
              "blurb": "在写第一行 resolver 之前，把要改什么、别人给了什么、判卷标准是什么全摸清。",
              "blurbEn": "Before writing the first line of a resolver, find out what to change, what is already given, and how it will be graded.",
              "minutes": 15,
              "exerciseCount": 3
            },
            {
              "id": "g-user-orders",
              "title": "TODO 1 · User.orders",
              "titleEn": "TODO 1 · User.orders",
              "blurb": "Federation 链路的终点。三行代码，但每一行都有理由。",
              "blurbEn": "The last step of the Federation path. Three lines of code, and every line has a reason.",
              "minutes": 13,
              "exerciseCount": 2
            },
            {
              "id": "g-shipping-info",
              "title": "TODO 2 · Order.shippingInfo",
              "titleEn": "TODO 2 · Order.shippingInfo",
              "blurb": "两行代码，但选错一行就答不到 N+1 这个考点。",
              "blurbEn": "Two lines of code. Pick the wrong one and you miss the N+1 point entirely.",
              "minutes": 11,
              "exerciseCount": 2
            },
            {
              "id": "g-queries",
              "title": "TODO 3 & 4 · Query.order 与 Query.orders",
              "titleEn": "TODO 3 & 4 · Query.order and Query.orders",
              "blurb": "一个用 loader、一个用数据源；一个可空、一个非空。放一起讲差别最清楚。",
              "blurbEn": "One uses the loader, one uses the data source; one is nullable, one is not. Side by side the difference is clearest.",
              "minutes": 14,
              "exerciseCount": 2
            },
            {
              "id": "g-planted-bugs",
              "title": "三处埋雷：怎么系统地找出来",
              "titleEn": "The three planted bugs: how to find them systematically",
              "blurb": "README 只说「有 integration issues」。这一节教你怎么把它们挖出来。",
              "blurbEn": "The README only says there are integration issues. This lesson shows you how to find them.",
              "minutes": 16,
              "exerciseCount": 2
            }
          ]
        },
        {
          "id": "fed-task2",
          "title": "Task 2 · Spring Boot REST 控制器",
          "titleEn": "Task 2 · the Spring Boot REST controller",
          "summary": "六个端点，业务逻辑全都给好了。真正考的是「HTTP 状态码选对了吗」和「异常该谁处理」—— 而这两点恰好是那五个测试只抓住一半的地方。",
          "summaryEn": "Six endpoints, with all the business logic already written for you. What is really tested is whether you picked the right HTTP status code and who should handle the exceptions — and those are exactly the two things the five tests only check partly.",
          "stage": "Federation · 第 4 部分",
          "lessons": [
            {
              "id": "g-spring-basics",
              "title": "先看懂给你的东西：Spring 的几个注解和一条请求链路",
              "titleEn": "Understand what you are given: a few Spring annotations and the path one request takes",
              "blurb": "没写过 Java 也能看懂 —— 这一节只讲这道题真正需要的那几个概念。",
              "blurbEn": "You do not need Java experience. This lesson covers only the few ideas this task actually needs.",
              "minutes": 16,
              "exerciseCount": 2
            },
            {
              "id": "g-endpoints",
              "title": "六个端点：状态码就是这道题的全部",
              "titleEn": "Six endpoints: the status codes are the whole task",
              "blurb": "五个测试只抓住两个错。另外三个端点全返回 null 也能过 —— 这一节讲怎么真的做对。",
              "blurbEn": "The five tests catch only two mistakes. Three endpoints can return null and still pass. This lesson is about getting them actually right.",
              "minutes": 18,
              "exerciseCount": 5
            }
          ]
        },
        {
          "id": "fed-written",
          "title": "书面题",
          "titleEn": "The written questions",
          "summary": "QUESTIONS.md 里的两道题。它们不考代码，考的是「你有没有在真实系统里想过这些问题」。这一节给出思考框架和一份可以照着写的参考答案。",
          "summaryEn": "The two questions in QUESTIONS.md. They do not test code. They test whether you have thought about these problems in a real system. This module gives a structure for thinking them through, plus one reference answer you can follow.",
          "stage": "Federation · 第 5 部分",
          "lessons": [
            {
              "id": "g-written",
              "title": "两道书面题：延迟传播与生产配置",
              "titleEn": "The two written questions: how delay spreads, and production configuration",
              "blurb": "写代码的题有测试兜底，这两道题只有你自己。给你一套可复用的答题结构。",
              "blurbEn": "The coding tasks have tests to fall back on. These two questions have only you. Here is an answer structure you can reuse.",
              "minutes": 22,
              "exerciseCount": 3
            }
          ]
        },
        {
          "id": "fed-mastery",
          "title": "综合 Debug 与从零重写",
          "titleEn": "Mixed debugging, and rewriting from an empty directory",
          "summary": "把 GraphQL 和 Spring 两边的典型故障集中练一遍，然后在没有答案的情况下从空目录重建整个 subgraph 和整个控制器。",
          "summaryEn": "Practice the common failures on both the GraphQL side and the Spring side in one place, then rebuild the whole subgraph and the whole controller from an empty directory, with no answer to look at.",
          "stage": "Federation · 第 6 部分",
          "lessons": [
            {
              "id": "g-debug-lab",
              "title": "Debug Lab · Federation 十种典型故障",
              "titleEn": "Debug Lab · ten common Federation failures",
              "blurb": "从「resolver 写了但返回 null」到「composition 失败」，每一种都给真实报错。",
              "blurbEn": "From a resolver that runs but returns null, to a composition failure. Every case comes with the real error text.",
              "minutes": 22,
              "exerciseCount": 4
            },
            {
              "id": "g-rebuild",
              "title": "从零重写：空目录到 10 个测试全过",
              "titleEn": "Rewrite it: from an empty directory to all 10 tests passing",
              "blurb": "不给答案。给 schema、给数据源、给测试、给四级提示。这一关是分界线。",
              "blurbEn": "No answer key. You get the schema, the data source, the tests, and four levels of hints. This stage is the dividing line.",
              "minutes": 90,
              "exerciseCount": 2
            }
          ]
        }
      ],
      "mockExams": [
        {
          "id": "book-reviews",
          "title": "模拟考 B · Book Reviews Subgraph",
          "scenario": "图书评论 subgraph。它既不拥有 Author 也不拥有 Book —— 两者都由 Catalog subgraph 提供，本服务只往它们身上挂 reviews 和 averageRating。Book 用的是复合 key（isbn + edition），这是真实项目里很常见、但比单字段 key 更容易写错的情况。",
          "mirrors": "与真实 Task 1 相同的考点：entity 与 @key、__resolveReference、字段 resolver 的 parent、schema 可空性决定的兜底策略、DataLoader 防 N+1 及其长度/顺序契约、结构化错误与 correlation id、以及「catch 不要吞掉已结构化错误」。新增三个考点：复合 @key、可空标量字段（null 与 0 的区别）、以及一处「batch 函数用了 filter」的埋雷。",
          "minutes": 90,
          "taskCount": 6,
          "taskTitles": [
            "Task 1 · Author 上的两个字段",
            "Task 2 · 复合 key 的 entity",
            "Task 3 · Review.reviewer 与 DataLoader 契约",
            "Task 4 · 两个 Query",
            "Task 5 · 修好 Mutation.createReview",
            "Task 6 · 验证"
          ],
          "outOf": 119
        }
      ],
      "checklist": [
        {
          "task": "Task 1 · User.orders",
          "covered": "完整讲解 + entity 数据流图 + 填空 + L3 自写 + 从零重写",
          "tested": true
        },
        {
          "task": "Task 1 · Order.shippingInfo（要求用 DataLoader）",
          "covered": "N+1 与 DataLoader 专章 + 填空 + Debug Lab",
          "tested": true
        },
        {
          "task": "Task 1 · Query.orders",
          "covered": "与 Query.order 对比讲解 + 填空 + L3 自写",
          "tested": true
        },
        {
          "task": "Task 1 · Query.order（README 没提、也没有测试）",
          "covered": "专门指出并完整实现，用上了给好的 ORDER_NOT_FOUND",
          "tested": false
        },
        {
          "task": "埋雷 1 · createOrderLoader 调了不存在的 getOrderById",
          "covered": "DataLoader 那节点出 + 独立 Debug Lab",
          "tested": true
        },
        {
          "task": "埋雷 2 · createOrder 用了不存在的 orderAPI、签名错、缺 price",
          "covered": "埋雷专章逐条拆解 + Debug Lab",
          "tested": true
        },
        {
          "task": "埋雷 3 · catch 把 INVALID_INPUT 吞成 SERVICE_ERROR",
          "covered": "贯穿四个 resolver 的模式讲解 + 独立 Debug Lab",
          "tested": true
        },
        {
          "task": "Task 2 · 六个 Spring 端点（含 201 / 204 / 400 / 404）",
          "covered": "Spring 基础 + 逐端点讲解 + 填空 + L3 自写 + 从零重写",
          "tested": true
        },
        {
          "task": "Task 2 · 六个端点全 return null 也能过 3/5 测试",
          "covered": "实测数据 + 手动 curl 自检清单 + Debug Lab",
          "tested": true
        },
        {
          "task": "书面题 1 · User subgraph 高延迟的影响与缓存策略",
          "covered": "传导路径分析 + 完整参考答案 + 答题结构模板",
          "tested": false
        },
        {
          "task": "书面题 2 · application.properties 的生产隐患",
          "covered": "六面排查清单 + 六个问题的完整参考答案 + L3 练习",
          "tested": false
        }
      ]
    },
    {
      "id": "interview",
      "title": "前端面试八股 · 99 问 + 16 道 coding",
      "titleEn": "Frontend interview preparation · 99 questions + 16 coding problems",
      "shortTitle": "面试八股",
      "shortTitleEn": "Interview questions",
      "descriptionEn": "A set of frontend interview questions the author went through, grouped by HTML / CSS / JavaScript / React / Node / databases / networking. Every question gets a one-sentence answer, a longer explanation, and the follow-up questions to expect. The last part compares the 16 coding problems one by one against the exercises already on this site, and points out which ones are already written up and which ones are gaps.",
      "description": "一份作者做过的前端面试题整理，按 HTML / CSS / JavaScript / React / Node / 数据库 / 网络分好组，每道题给「一句话答案 + 展开 + 会被追问什么」。最后一节把 16 道 coding 题逐题对照本站已有的练习，指出哪些已经写过、哪些是缺口。",
      "category": "全栈",
      "tests": "八股考的是「你有没有想过为什么」。同一道题，说出结论是及格，说出取舍和边界才是好答案 —— 所以每道题都写了「会追问什么」，那才是真正拉开差距的地方。coding 题考的东西和另外两门的真题高度重合，所以这里只补真正的缺口，不重复出题。",
      "testsEn": "These questions test whether you have thought about why, not only what. On any single question, stating the conclusion is a pass; naming the trade-offs and the edge cases is a good answer. That is why every question also lists what the interviewer will ask next — that is where answers really differ. The coding problems overlap heavily with the real tasks in the other two exams, so this course only fills the real gaps instead of repeating problems.",
      "stack": [
        "HTML",
        "CSS",
        "JavaScript",
        "TypeScript",
        "React",
        "Redux",
        "Node.js",
        "Express",
        "SQL",
        "HTTP"
      ],
      "status": "ready",
      "prerequisites": [],
      "sourceProjects": [],
      "lessonCount": 25,
      "exerciseCount": 16,
      "minutes": 568,
      "debugLabs": 0,
      "rebuilds": 0,
      "rebuildIds": [],
      "modules": [
        {
          "id": "iv-basics",
          "title": "HTML 与 CSS",
          "titleEn": "HTML and CSS",
          "summary": "13 道题。这两块最容易被轻视 —— 前端面试第一轮几乎必问，而且问的都是「你平时到底有没有想过为什么」。盒模型、Flex 与 Grid 的分工、事件冒泡与捕获、语义化标签、无障碍。",
          "summaryEn": "13 questions. These two areas are the easiest to underestimate. The first round of a frontend interview almost always covers them, and the questions all check whether you have ever asked why. The box model, the division of work between Flex and Grid, event bubbling and capturing, semantic tags, and accessibility.",
          "stage": "面试 · 第 1 部分",
          "lessons": [
            {
              "id": "iv-html",
              "title": "HTML 五问",
              "titleEn": "5 questions on HTML",
              "blurb": "块级与行内、事件冒泡与捕获、meta、语义化、无障碍。",
              "blurbEn": "Block and inline elements, event bubbling and capturing, meta tags, semantic elements, accessibility.",
              "minutes": 14,
              "exerciseCount": 0
            },
            {
              "id": "iv-css",
              "title": "CSS 八问",
              "titleEn": "8 questions on CSS",
              "blurb": "盒模型、margin vs padding、Flex vs Grid、选择器、预处理器、响应式。",
              "blurbEn": "The box model, margin vs padding, Flex vs Grid, selectors, preprocessors, responsive design.",
              "minutes": 18,
              "exerciseCount": 0
            }
          ]
        },
        {
          "id": "iv-js-core",
          "title": "JavaScript · 引擎、类型与函数",
          "titleEn": "JavaScript · the engine, types and functions",
          "summary": "22 道题。这一组是 JS 面试的地基：值怎么存、类型怎么转、变量怎么提升、闭包到底是什么。闭包、hoisting、== vs === 这三道几乎每场都问。",
          "summaryEn": "22 questions. This group is the base of every JavaScript interview: how values are stored, how types convert, how variables are hoisted, and what a closure actually is. The questions on closure, hoisting, and == vs === come up in almost every interview.",
          "stage": "面试 · 第 2 部分",
          "lessons": [
            {
              "id": "iv-js-types",
              "title": "引擎与类型十问",
              "titleEn": "10 questions on the engine and types",
              "blurb": "引擎、REPL、原始值 vs 引用值、类型转换、== vs ===、短路、var/let/const、传值传引用、Set、Map。",
              "blurbEn": "The engine, REPL, primitive vs reference values, type conversion, == vs ===, short-circuiting, var/let/const, passing values and references, Set, Map.",
              "minutes": 22,
              "exerciseCount": 0
            },
            {
              "id": "iv-js-fn",
              "title": "函数与作用域十二问",
              "titleEn": "12 questions on functions and scope",
              "blurb": "定义方式、一等/一阶/高阶函数、纯函数、use strict、作用域、hoisting、作用域链、闭包、柯里化、IIFE。",
              "blurbEn": "Ways to define a function, first class / first order / higher order functions, pure functions, use strict, scope, hoisting, the scope chain, closure, currying, IIFE.",
              "minutes": 26,
              "exerciseCount": 0
            }
          ]
        },
        {
          "id": "iv-js-async",
          "title": "JavaScript · this、异步与工具链",
          "titleEn": "JavaScript · this, async and tooling",
          "summary": "16 道题。事件循环那道是 JS 面试最能分层次的题 —— 说得出宏任务微任务的执行顺序就上一个档。this 与 call/apply/bind 是老题但仍必问，DOM 事件委托会连到 React 的合成事件。",
          "summaryEn": "16 questions. The event loop question separates candidates more than any other JavaScript question: if you can state the order in which macrotasks and microtasks run, you move up a level. this with call/apply/bind is an old question that is still always asked, and DOM event delegation connects to React synthetic events.",
          "stage": "面试 · 第 3 部分",
          "lessons": [
            {
              "id": "iv-js-this",
              "title": "this 与面向对象三问",
              "titleEn": "3 questions on this and object-oriented programming",
              "blurb": "OOP、this 指向的四条规则、call/apply/bind。",
              "blurbEn": "OOP, the four rules for what this points to, call/apply/bind.",
              "minutes": 16,
              "exerciseCount": 0
            },
            {
              "id": "iv-js-loop",
              "title": "异步与事件循环六问",
              "titleEn": "6 questions on async and the event loop",
              "blurb": "事件循环、async/await vs Promise、回调地狱、finally、错误处理、异步方案总览。",
              "blurbEn": "The event loop, async/await vs Promise, callback hell, finally, error handling, and an overview of the async options.",
              "minutes": 24,
              "exerciseCount": 0
            },
            {
              "id": "iv-js-tooling",
              "title": "DOM、模块与工具链七问",
              "titleEn": "7 questions on the DOM, modules and tooling",
              "blurb": "DOM 与 DOM 事件、事件委托、ES6 新特性、ES6 模块、npm、Webpack、fetch vs axios。",
              "blurbEn": "The DOM and DOM events, event delegation, new ES6 features, ES6 modules, npm, Webpack, fetch vs axios.",
              "minutes": 20,
              "exerciseCount": 0
            }
          ]
        },
        {
          "id": "iv-react-basics",
          "title": "React · 基础与组件",
          "titleEn": "React · basics and components",
          "summary": "18 道题。虚拟 DOM 与 diff、reconciliation 这几道是「你到底懂不懂 React 在干什么」的分水岭；props vs state、受控 vs 非受控、状态提升三道直接对应 Q1 那道真题里写过的代码。",
          "summaryEn": "18 questions. The questions on the virtual DOM, diffing and reconciliation are the dividing line for whether you understand what React is doing; props vs state, controlled vs uncontrolled, and lifting state up map directly onto the code written for the real Q1 task.",
          "stage": "面试 · 第 4 部分",
          "lessons": [
            {
              "id": "iv-react-what",
              "title": "React 是什么 · 七问",
              "titleEn": "7 questions on what React is",
              "blurb": "React vs Angular、优势、SPA、JSX、虚拟 DOM 与 diff、reconciliation、babel 与 webpack。",
              "blurbEn": "React vs Angular, the selling points, SPA, JSX, the virtual DOM and diffing, reconciliation, babel and webpack.",
              "minutes": 22,
              "exerciseCount": 0
            },
            {
              "id": "iv-react-comp",
              "title": "组件与通信 · 十一问",
              "titleEn": "11 questions on components and how they communicate",
              "blurb": "函数 vs 类组件、生命周期、useEffect 对应关系、props vs state、组件通信、受控 vs 非受控、props drilling、PureComponent、Fragment、状态提升、HOC。",
              "blurbEn": "Function vs class components, lifecycle, how useEffect maps onto it, props vs state, talking between components, controlled vs uncontrolled, props drilling, PureComponent, Fragment, lifting state up, HOC.",
              "minutes": 28,
              "exerciseCount": 0
            }
          ]
        },
        {
          "id": "iv-react-hooks",
          "title": "React · Hooks、性能与生态",
          "titleEn": "React · Hooks, performance and the ecosystem",
          "summary": "18 道题。useMemo / useCallback / React.memo 三兄弟的区别几乎每场必问，而且要答得出「什么时候不该用」；Redux 那四道是问 Redux 项目经验的固定套路。",
          "summaryEn": "18 questions. The difference between useMemo, useCallback and React.memo is asked in almost every interview, and a full answer has to include when not to use them; the four Redux questions are the standard set asked of anyone who lists Redux experience.",
          "stage": "面试 · 第 5 部分",
          "lessons": [
            {
              "id": "iv-react-hook",
              "title": "Hooks 四问",
              "titleEn": "4 questions on Hooks",
              "blurb": "hooks 是什么与为什么、useMemo vs useCallback、React.memo vs useMemo、自定义 hook。",
              "blurbEn": "What hooks are and why they exist, useMemo vs useCallback, React.memo vs useMemo, custom hooks.",
              "minutes": 20,
              "exerciseCount": 0
            },
            {
              "id": "iv-react-perf",
              "title": "性能与新特性 · 八问",
              "titleEn": "8 questions on performance and new features",
              "blurb": "性能优化、写样式的几种方式、React 18 新变化、lazy、最佳实践、StrictMode、错误边界、Router。",
              "blurbEn": "Performance work, the ways to write styles, what is new in React 18, lazy, best practices, StrictMode, error boundaries, Router.",
              "minutes": 26,
              "exerciseCount": 0
            },
            {
              "id": "iv-react-redux",
              "title": "Redux 与 TypeScript · 六问",
              "titleEn": "6 questions on Redux and TypeScript",
              "blurb": "Redux vs Context、结构与工作流、三大原则、中间件、JS vs TS、静态类型检查。",
              "blurbEn": "Redux vs Context, the parts and the data flow, the three principles, middleware, JS vs TS, static type checking.",
              "minutes": 22,
              "exerciseCount": 0
            }
          ]
        },
        {
          "id": "iv-backend",
          "title": "Node、数据库与网络",
          "titleEn": "Node, databases and networking",
          "summary": "12 道题。全栈岗和前端岗都会问到这一层：Node 的事件循环、请求响应流程、REST 的 CRUD 映射、关系型 vs 文档型、以及 HTTPS / JWT / CORS / session 这四道安全常客。CORS 那道几乎人人都遇到过，但很多人说不清它到底是谁在拦。",
          "summaryEn": "12 questions. Both full-stack and frontend roles ask about this layer: the Node event loop, the request and response flow, how CRUD maps onto REST, relational vs document databases, and the four regular security questions on HTTPS / JWT / CORS / session. Almost everyone has run into the CORS one, but many cannot say clearly which side is doing the blocking.",
          "stage": "面试 · 第 6 部分",
          "lessons": [
            {
              "id": "iv-node",
              "title": "Node 与 Express 四问",
              "titleEn": "4 questions on Node and Express",
              "blurb": "Node 的事件循环、请求响应周期、查询参数 vs 路径参数、CRUD。",
              "blurbEn": "The Node.js event loop, the request and response cycle, query parameters vs path parameters, CRUD.",
              "minutes": 18,
              "exerciseCount": 0
            },
            {
              "id": "iv-sql",
              "title": "数据库两问",
              "titleEn": "2 questions on databases",
              "blurb": "关系型 vs 非关系型、主键与外键。",
              "blurbEn": "Relational vs non-relational databases, primary keys and foreign keys.",
              "minutes": 12,
              "exerciseCount": 0
            },
            {
              "id": "iv-web",
              "title": "网络、安全与测试 · 六问",
              "titleEn": "6 questions on networking, security and testing",
              "blurb": "测试的种类、HTTPS vs HTTP、JWT、CORS、session vs cookie、HTTP 状态码。",
              "blurbEn": "Kinds of tests, HTTPS vs HTTP, JWT, CORS, session vs cookie, HTTP status codes.",
              "minutes": 24,
              "exerciseCount": 0
            }
          ]
        },
        {
          "id": "iv-coding",
          "title": "Coding 题：对照与补缺",
          "titleEn": "Coding problems: what is covered and what is missing",
          "summary": "16 道 coding 题逐题对照本站已有的练习：9 道已经被 Q1、Q2、五道变式题和两套模拟考覆盖，7 道是真缺口。缺口题的参考解法都在本机跑过测试（24 / 24 加 8 / 8）。",
          "summaryEn": "The 16 coding problems compared one by one against the exercises already on this site: 9 are already covered by Q1, Q2, the five variant tasks and the two mock exams, and 7 are real gaps. The reference solutions for the gap problems were all run against tests on a local machine (24 / 24 plus 8 / 8).",
          "stage": "面试 · 第 7 部分",
          "lessons": [
            {
              "id": "iv-coding-map",
              "title": "16 道题逐题对照",
              "titleEn": "The 16 problems, compared one by one",
              "blurb": "哪些已经写过、哪些是缺口、缺的那道到底在考什么。",
              "blurbEn": "Which ones you have already written, which ones are gaps, and what the missing ones actually test.",
              "minutes": 12,
              "exerciseCount": 1
            },
            {
              "id": "iv-coding-widgets",
              "title": "缺口一 · Dropdown、Tabs、星级评分",
              "titleEn": "Gap 1 · dropdown, tabs and star rating",
              "blurb": "三个小组件，考的是「组件自己的交互状态怎么管」—— 之前五道变式题一个都没覆盖到。",
              "blurbEn": "Three small components. They test how a component manages its own interaction state, which none of the five earlier variant tasks covered.",
              "minutes": 24,
              "exerciseCount": 2
            },
            {
              "id": "iv-coding-ref-hook",
              "title": "缺口二 · useRef 操作 DOM，与写一个自定义 hook",
              "titleEn": "Gap 2 · using useRef on the DOM, and writing a custom hook",
              "blurb": "useRef 的第二种用法（拿 DOM 调命令式 API），以及把 state + effect 打包成可复用的 hook。",
              "blurbEn": "The second use of useRef — holding a DOM node so you can call methods on it directly — and packing state plus an effect into a hook you can reuse.",
              "minutes": 22,
              "exerciseCount": 1
            },
            {
              "id": "iv-coding-rtk",
              "title": "缺口三 · 同一个 Todo 换成 Redux Toolkit",
              "titleEn": "Gap 3 · the same Todo app, moved to Redux Toolkit",
              "blurb": "业务和变式一完全一样，换成 createSlice + selector —— 正好能对比出 Redux 到底多给了什么。",
              "blurbEn": "The same app as variant one, rebuilt with createSlice and selectors — which makes it easy to see what Redux actually adds.",
              "minutes": 24,
              "exerciseCount": 1
            },
            {
              "id": "iv-coding-kanban",
              "title": "缺口四 · Kanban 看板：一次改两个数组",
              "titleEn": "Gap 4 · a Kanban board: changing two arrays in one update",
              "blurb": "跨列移动是 CRUD 的升级版 —— 源列删、目标列加，必须在一次操作里完成。",
              "blurbEn": "Moving a card between columns is CRUD one step up: remove from one column and add to another, in a single update.",
              "minutes": 20,
              "exerciseCount": 1
            }
          ]
        },
        {
          "id": "iv-hand",
          "title": "手写题",
          "titleEn": "Implement it yourself",
          "summary": "Phone screen 的主菜：现场手写 debounce、Promise.all、EventEmitter 这类工具函数。8 道题全部带浏览器沙箱，参考解法 40 / 40 实测。DrillLab 自出，不在原题库里。",
          "summaryEn": "The main item in a phone screen: writing utility functions such as debounce, Promise.all and EventEmitter on the spot. All 8 problems come with a browser sandbox, and the reference solutions passed 40 / 40 in a real run. Written by DrillLab; these are not in the original question bank.",
          "stage": "面试 · 第 8 部分",
          "lessons": [
            {
              "id": "iv-hand-timing",
              "title": "计时两兄弟：debounce 与 throttle",
              "titleEn": "Two timing helpers: debounce and throttle",
              "blurb": "先分清「等你停手」和「匀速放行」，再各写一个。",
              "blurbEn": "First tell the two apart — wait until the calls stop, versus let one through at a steady rate — then write each one.",
              "minutes": 30,
              "exerciseCount": 2
            },
            {
              "id": "iv-hand-data",
              "title": "数据与函数：deepClone、flatten、curry",
              "titleEn": "Data and functions: deepClone, flatten, curry",
              "blurb": "三道递归题。递归的出口、防循环的登记、不污染的攒参数。",
              "blurbEn": "Three recursion problems: where recursion stops, the record that guards against cycles, and collecting arguments without leaking them.",
              "minutes": 35,
              "exerciseCount": 3
            },
            {
              "id": "iv-hand-async",
              "title": "异步与结构：Promise.all、EventEmitter、LRU",
              "titleEn": "Async and structure: Promise.all, EventEmitter, LRU",
              "blurb": "下标写入保顺序、拷贝列表再遍历、Map 的插入序当链表用。",
              "blurbEn": "Write by index to keep the order, copy the list before you walk it, and use the insertion order of a Map as a linked list.",
              "minutes": 35,
              "exerciseCount": 3
            }
          ]
        },
        {
          "id": "iv-ts",
          "title": "TypeScript 深度",
          "titleEn": "TypeScript in depth",
          "summary": "6 道题。senior 面试的 TS 深水区：utility types 不止会用还要会手写，再加泛型约束、判别联合与 unknown / any / never。这 6 道全部是 DrillLab 自出，不在原题库里。",
          "summaryEn": "6 questions. The harder TypeScript topics that senior interviews go into: you have to write utility types yourself, not only use them, plus generic constraints, discriminated unions, and unknown / any / never. All 6 were written by DrillLab and are not in the original question bank.",
          "stage": "面试 · 第 9 部分",
          "lessons": [
            {
              "id": "iv-ts-utility",
              "title": "Utility Types：会用，还要会手写",
              "titleEn": "Utility types: use them, and write them yourself",
              "blurb": "Partial / Pick / Omit / Record 怎么选，mapped type 手写 MyPick 与 MyPartial，conditional type 配 infer 手写 MyReturnType。",
              "blurbEn": "How to choose between Partial / Pick / Omit / Record, how to write MyPick and MyPartial as mapped types, and how to write MyReturnType with a conditional type and infer.",
              "minutes": 28,
              "exerciseCount": 1
            },
            {
              "id": "iv-ts-generics",
              "title": "泛型与收窄：把 any 赶出代码",
              "titleEn": "Generics and narrowing: getting any out of the code",
              "blurb": "getProp 为什么必须约束 K extends keyof T，判别联合加 never 兜底做穷尽检查，unknown / any / never 的三种语义。",
              "blurbEn": "Why getProp must constrain K extends keyof T, exhaustiveness checking with a discriminated union and a never fallback, and what unknown / any / never each mean.",
              "minutes": 26,
              "exerciseCount": 1
            }
          ]
        }
      ],
      "mockExams": [],
      "checklist": [
        {
          "task": "HTML 5 题（#269、#380 ~ #385）",
          "covered": "块级/行内、事件冒泡与捕获、meta、语义化、无障碍",
          "tested": false
        },
        {
          "task": "CSS 8 题（#270 ~ #275、#383、#384）",
          "covered": "盒模型、margin/padding、Flex vs Grid、选择器与优先级、SCSS、预处理器、响应式",
          "tested": false
        },
        {
          "task": "JavaScript 38 题（#276 ~ #312、#386、#387）",
          "covered": "引擎与类型、函数与作用域、this 与 OOP、异步与事件循环、DOM 与工具链，共 5 节",
          "tested": false
        },
        {
          "task": "React 与生态 36 题（#319 ~ #356）",
          "covered": "虚拟 DOM 与 diff、组件与通信、Hooks、性能与 React 18、Redux 与 TypeScript，共 5 节",
          "tested": false
        },
        {
          "task": "Node / Express 4 题（#313 ~ #316）",
          "covered": "Node 事件循环、请求响应周期、参数选择、CRUD 与幂等",
          "tested": false
        },
        {
          "task": "数据库 2 题（#317、#318）",
          "covered": "关系型 vs 非关系型选型、主键与外键及删除行为",
          "tested": false
        },
        {
          "task": "网络、安全与测试 6 题（#357 ~ #362）",
          "covered": "CORS、HTTPS、JWT、session vs cookie、状态码、测试金字塔",
          "tested": false
        },
        {
          "task": "Coding 16 题（#363 ~ #378）",
          "covered": "逐题对照现有练习，9 道已被覆盖，7 道作为缺口补进来（参考解法在本机跑过测试）",
          "tested": true
        }
      ]
    },
    {
      "id": "cab-booking",
      "title": "React Cab Booking（Context 版）",
      "titleEn": "React Cab Booking (Context version)",
      "shortTitle": "Cab Booking",
      "shortTitleEn": "Cab Booking",
      "descriptionEn": "A small cab booking app that keeps its global state in a Context. Four pages, one Context, four tests. The practice here is how to use Context in a real app with several pages: which level the Provider goes on, one action updating two pieces of state at once, and readers of the Context spread across three components.",
      "description": "一个用 Context 管全局状态的打车小应用。四个页面、一个 Context、四个测试。练的是「Context 在一个真实多页应用里怎么用」—— Provider 放在哪一层、一个 action 同时改两个 state、消费者散在三个组件里。",
      "category": "前端",
      "tests": "Context 三件套与 Provider 的层级、一次更新两个 state、页面状态机、数组取尾部三条并反转、useEffect 的 setTimeout 清理、data-testid 契约。附带一个真实的脚手架缺陷：完整答案原样跑不起来。",
      "testsEn": "The three parts of Context and the level the Provider sits at, updating two pieces of state in one action, the page state machine, taking the last three items of an array and reversing them, clearing a setTimeout inside useEffect, and the data-testid contract. Plus one real defect in the provided project: the complete answer does not run as given.",
      "stack": [
        "React 18",
        "Context",
        "Vite",
        "Vitest",
        "React Testing Library"
      ],
      "status": "ready",
      "prerequisites": [
        "foundations"
      ],
      "sourceProjects": [
        {
          "path": "cab-booking-context",
          "role": "参考项目。6 个组件 + 1 个 Context + 4 个测试",
          "roleEn": "Reference project. Six components, one Context, four tests"
        }
      ],
      "lessonCount": 8,
      "exerciseCount": 15,
      "minutes": 155,
      "debugLabs": 2,
      "rebuilds": 1,
      "rebuildIds": [
        "cb-from-scratch"
      ],
      "modules": [
        {
          "id": "cab-context",
          "title": "Context 这一层：放在哪、存什么、怎么改",
          "titleEn": "The Context layer: where to put it, what to store, how to update it",
          "summary": "先把四个测试读清楚，再搭 Context。这一部分的核心是一个位置问题：Provider 到底该包在哪一层 —— 答错这个，App 自己就用不了 Context。",
          "summaryEn": "Read the four tests carefully first, then build the Context. The main point of this part is a question of position: which level of the tree the Provider should wrap. Get that wrong and App itself cannot read the Context.",
          "stage": "Cab Booking · 第 1 部分",
          "lessons": [
            {
              "id": "cb-read-tests",
              "title": "先读四个测试：它们到底要什么",
              "titleEn": "Read the four tests first: what exactly they ask for",
              "blurb": "四个测试全靠 data-testid 找元素。先抄一张 testid 表出来，再动手。",
              "blurbEn": "All four tests find elements by data-testid. Copy out the list of testids first, then start writing.",
              "minutes": 14,
              "exerciseCount": 2
            },
            {
              "id": "cb-provider-layer",
              "title": "Context 放在哪一层 —— 这道题最容易死的地方",
              "titleEn": "Which level the Context goes on — the most common way to fail this task",
              "blurb": "Provider 必须包在 App 外面。包在里面，App 自己就用不了 Context。",
              "blurbEn": "The Provider has to wrap App from the outside. Put it inside App and App itself cannot read the Context.",
              "minutes": 16,
              "exerciseCount": 2
            }
          ]
        },
        {
          "id": "cab-pages",
          "title": "四个页面串起来：状态机、分组、一秒延迟",
          "titleEn": "Connecting the four pages: the state machine, grouping, and the one-second delay",
          "summary": "没有路由，一个 currentPage state 管四个页面。这一部分把页面写出来，顺便撞上两个老考点：effect 的清理函数、和「取最新三条」的数组操作。",
          "summaryEn": "No router: a single currentPage state controls four pages. This part builds the pages, and it also covers two points that come up again and again: the cleanup function of an effect, and the array operation that takes the three newest items.",
          "stage": "Cab Booking · 第 2 部分",
          "lessons": [
            {
              "id": "cb-page-machine",
              "title": "用一个 state 管四个页面",
              "titleEn": "Controlling four pages with one piece of state",
              "blurb": "没有 react-router。currentPage 是个字符串状态机，四个 && 决定谁显示。",
              "blurbEn": "There is no react-router. currentPage is a string state machine, and four && checks decide which page shows.",
              "minutes": 15,
              "exerciseCount": 2
            },
            {
              "id": "cb-options-grid",
              "title": "按类型分组渲染六张卡",
              "titleEn": "Rendering the six cards grouped by type",
              "blurb": "两层 map：外层 Object.keys 出三个类型，内层出每组的车。key 有个坑。",
              "blurbEn": "Two nested maps: Object.keys gives the three types on the outside, the cabs of each group on the inside. The key needs care.",
              "minutes": 13,
              "exerciseCount": 2
            },
            {
              "id": "cb-loading-timer",
              "title": "Loading：一秒之后自己跳走",
              "titleEn": "Loading: it moves to the next page by itself after one second",
              "blurb": "useEffect 里一个 setTimeout，return 里一个 clearTimeout。少了后者会出真问题。",
              "blurbEn": "One setTimeout inside useEffect, one clearTimeout in the return. Leave the second one out and you get a real problem.",
              "minutes": 14,
              "exerciseCount": 2
            },
            {
              "id": "cb-history-three",
              "title": "历史与确认页：两个小而致命的细节",
              "titleEn": "The history and confirmation pages: two small details that decide pass or fail",
              "blurb": "slice(-3).reverse() 一个字符都不能错；bookedCabDetails?.name 少个问号就白屏。",
              "blurbEn": "slice(-3).reverse() has to be exact, character for character; drop the question mark in bookedCabDetails?.name and the screen goes blank.",
              "minutes": 15,
              "exerciseCount": 2
            }
          ]
        },
        {
          "id": "cab-verify",
          "title": "验收：脚手架的坑、面试追问、从零重写",
          "titleEn": "Checking your work: the defect in the provided project, interview follow-up questions, and rewriting in an empty folder",
          "summary": "三件事：修掉那个让「完整答案」原样跑不起来的缺陷；把源项目两处「测试能过但面试会被问」的写法说清楚；然后在空文件夹里重写一遍。",
          "summaryEn": "Three things: fix the defect that stops the complete answer from running as given; explain two places in the source project where the code passes the tests but an interviewer would still ask about it; then write the whole app again in an empty folder.",
          "stage": "Cab Booking · 第 3 部分",
          "lessons": [
            {
              "id": "cb-scaffold-bug",
              "title": "完整答案跑不起来 —— 一个扩展名的事",
              "titleEn": "The complete answer does not run — the cause is one file extension",
              "blurb": "README 说「先运行完整答案熟悉流程」。实测 0 个测试跑起来。",
              "blurbEn": "The README says to run the complete answer first to get used to the flow. In practice 0 tests start.",
              "minutes": 13,
              "exerciseCount": 2
            },
            {
              "id": "cb-rewrite",
              "title": "从零重写：空文件夹里做出来",
              "titleEn": "Rewrite it: build the whole app in an empty folder",
              "blurb": "这一节没有新知识。只有一个要求：不看答案，把整个应用写出来。",
              "blurbEn": "There is nothing new to learn here. There is one requirement: write the whole app without looking at the answer.",
              "minutes": 55,
              "exerciseCount": 1
            }
          ]
        }
      ],
      "mockExams": [],
      "checklist": [
        {
          "task": "首页 + 空历史提示",
          "covered": "第 1 部分 · 先读四个测试",
          "tested": true
        },
        {
          "task": "Context 三件套 + Provider 层级",
          "covered": "第 1 部分 · Context 放在哪一层",
          "tested": true
        },
        {
          "task": "一个 action 改两个 state",
          "covered": "第 1 部分 · 一次更新两个 state",
          "tested": true
        },
        {
          "task": "四个页面的切换",
          "covered": "第 2 部分 · 页面状态机",
          "tested": true
        },
        {
          "task": "按类型分组 + 六张卡的字段",
          "covered": "第 2 部分 · 分组渲染与 testid 契约",
          "tested": true
        },
        {
          "task": "Loading 一秒后自动跳转",
          "covered": "第 2 部分 · setTimeout 与清理函数",
          "tested": true
        },
        {
          "task": "历史只留最新三条、最新在最上",
          "covered": "第 2 部分 · slice(-3).reverse()",
          "tested": true
        },
        {
          "task": "脚手架缺陷：.js 里写 JSX",
          "covered": "第 3 部分 · Debug Lab",
          "tested": true
        },
        {
          "task": "两处能更好的写法（面试会问）",
          "covered": "第 3 部分 · 面试官会追问的两点",
          "tested": false
        },
        {
          "task": "空文件夹里从零重写",
          "covered": "第 3 部分 · 从零重写",
          "tested": true
        }
      ]
    }
  ],
  "drills": [
    {
      "id": "q269",
      "bank": [
        269
      ],
      "zh": "块级元素 vs 行内元素",
      "en": "Block element vs Inline element",
      "track": "html",
      "lessonId": "iv-html",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q380",
      "bank": [
        380
      ],
      "zh": "事件冒泡 vs 事件捕获",
      "en": "Event bubbling vs Event capturing",
      "track": "html",
      "lessonId": "iv-html",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q381",
      "bank": [
        381
      ],
      "zh": "meta 标签有什么用",
      "en": "What is the importance of the meta tag?",
      "track": "html",
      "lessonId": "iv-html",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q382",
      "bank": [
        382
      ],
      "zh": "什么是语义化标签",
      "en": "What are Semantic Elements?",
      "track": "html",
      "lessonId": "iv-html",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q385",
      "bank": [
        385
      ],
      "zh": "无障碍、可用性、包容性",
      "en": "Could you explain accessibility, usability, and inclusion? Give some examples of each one in terms of web design.",
      "track": "html",
      "lessonId": "iv-html",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q271",
      "bank": [
        271
      ],
      "zh": "什么是盒模型",
      "en": "What is the Box Model",
      "track": "css",
      "lessonId": "iv-css",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q272",
      "bank": [
        272
      ],
      "zh": "margin vs padding",
      "en": "Margin vs Padding",
      "track": "css",
      "lessonId": "iv-css",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q273",
      "bank": [
        273
      ],
      "zh": "Flexbox vs Grid",
      "en": "Flexbox vs Grid",
      "track": "css",
      "lessonId": "iv-css",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q383",
      "bank": [
        383
      ],
      "zh": "CSS 选择器有哪些类型",
      "en": "What are the different types of CSS selectors?",
      "track": "css",
      "lessonId": "iv-css",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q270",
      "bank": [
        270
      ],
      "zh": "有几种方式引入 CSS",
      "en": "How many ways to import CSS in your project",
      "track": "css",
      "lessonId": "iv-css",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q275",
      "bank": [
        275
      ],
      "zh": "什么是 SCSS",
      "en": "What is SCSS",
      "track": "css",
      "lessonId": "iv-css",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q384",
      "bank": [
        384
      ],
      "zh": "CSS 预处理器的优缺点",
      "en": "What is a CSS preprocessor? What are the advantages and disadvantages, if any, to using them over plain CSS?",
      "track": "css",
      "lessonId": "iv-css",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q274",
      "bank": [
        274
      ],
      "zh": "什么是响应式设计，怎么做",
      "en": "What is responsive web design and how to achieve this",
      "track": "css",
      "lessonId": "iv-css",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q276",
      "bank": [
        276
      ],
      "zh": "什么是 JavaScript 引擎",
      "en": "What is the JavaScript engine",
      "track": "js",
      "lessonId": "iv-js-types",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q277",
      "bank": [
        277
      ],
      "zh": "什么是 REPL",
      "en": "What is REPL",
      "track": "js",
      "lessonId": "iv-js-types",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q278",
      "bank": [
        278
      ],
      "zh": "原始值 vs 引用值",
      "en": "Primitive data types vs Reference data types",
      "track": "js",
      "lessonId": "iv-js-types",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q279",
      "bank": [
        279,
        386
      ],
      "zh": "隐式转换 vs 显式转换",
      "en": "Type coercion vs Type conversion",
      "track": "js",
      "lessonId": "iv-js-types",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q280",
      "bank": [
        280
      ],
      "zh": "== 和 === 的区别",
      "en": "What is the difference between == and ===",
      "track": "js",
      "lessonId": "iv-js-types",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q281",
      "bank": [
        281
      ],
      "zh": "什么是短路求值",
      "en": "What is short-circuit evaluation",
      "track": "js",
      "lessonId": "iv-js-types",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q282",
      "bank": [
        282
      ],
      "zh": "var、let、const 的区别",
      "en": "What is the difference between var, let and const",
      "track": "js",
      "lessonId": "iv-js-types",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q284",
      "bank": [
        284
      ],
      "zh": "传值 vs 传引用",
      "en": "Pass by Value vs Pass by Reference",
      "track": "js",
      "lessonId": "iv-js-types",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q286",
      "bank": [
        286
      ],
      "zh": "Set vs Array",
      "en": "Set vs Array",
      "track": "js",
      "lessonId": "iv-js-types",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q287",
      "bank": [
        287
      ],
      "zh": "Map vs Object",
      "en": "Map vs Object",
      "track": "js",
      "lessonId": "iv-js-types",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q285",
      "bank": [
        285
      ],
      "zh": "有几种定义函数的方式",
      "en": "How many ways to define a function",
      "track": "js",
      "lessonId": "iv-js-fn",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q290",
      "bank": [
        290
      ],
      "zh": "什么是一等函数",
      "en": "What is a first class function",
      "track": "js",
      "lessonId": "iv-js-fn",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q291",
      "bank": [
        291
      ],
      "zh": "什么是一阶函数",
      "en": "What is a first order function",
      "track": "js",
      "lessonId": "iv-js-fn",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q292",
      "bank": [
        292
      ],
      "zh": "什么是高阶函数",
      "en": "What is a higher order function",
      "track": "js",
      "lessonId": "iv-js-fn",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q293",
      "bank": [
        293
      ],
      "zh": "什么是纯函数",
      "en": "What is a pure function",
      "track": "js",
      "lessonId": "iv-js-fn",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q294",
      "bank": [
        294
      ],
      "zh": "\"use strict\" 是干什么的",
      "en": "What is \"use strict\"",
      "track": "js",
      "lessonId": "iv-js-fn",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q295",
      "bank": [
        295
      ],
      "zh": "作用域有哪几种",
      "en": "What are the different type of scopes",
      "track": "js",
      "lessonId": "iv-js-fn",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q296",
      "bank": [
        296
      ],
      "zh": "什么是变量提升",
      "en": "What is hoisting",
      "track": "js",
      "lessonId": "iv-js-fn",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q297",
      "bank": [
        297
      ],
      "zh": "什么是作用域链",
      "en": "What is the scope chain?",
      "track": "js",
      "lessonId": "iv-js-fn",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q298",
      "bank": [
        298
      ],
      "zh": "什么是闭包",
      "en": "What is a closure",
      "track": "js",
      "lessonId": "iv-js-fn",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q299",
      "bank": [
        299
      ],
      "zh": "什么是柯里化",
      "en": "What is currying",
      "track": "js",
      "lessonId": "iv-js-fn",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q300",
      "bank": [
        300
      ],
      "zh": "什么是 IIFE",
      "en": "What is an IIFE",
      "track": "js",
      "lessonId": "iv-js-fn",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q302",
      "bank": [
        302
      ],
      "zh": "什么是面向对象编程",
      "en": "What is Object-Oriented Programming (OOP)",
      "track": "js",
      "lessonId": "iv-js-this",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q303",
      "bank": [
        303
      ],
      "zh": "this 指向什么",
      "en": "What does 'this' refer to",
      "track": "js",
      "lessonId": "iv-js-this",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q304",
      "bank": [
        304
      ],
      "zh": "call、apply、bind 的区别",
      "en": "What are the differences between call, apply & bind",
      "track": "js",
      "lessonId": "iv-js-this",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q305",
      "bank": [
        305
      ],
      "zh": "事件循环是怎么工作的",
      "en": "What does the event loop",
      "track": "js",
      "lessonId": "iv-js-loop",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q306",
      "bank": [
        306
      ],
      "zh": "async/await vs Promise",
      "en": "Async/await vs Promise",
      "track": "js",
      "lessonId": "iv-js-loop",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q307",
      "bank": [
        307
      ],
      "zh": "什么是回调地狱",
      "en": "What is callback hell",
      "track": "js",
      "lessonId": "iv-js-loop",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q309",
      "bank": [
        309
      ],
      "zh": "Promise 链里的 finally() 有什么用",
      "en": "What is the purpose of the finally() method in a Promise chain",
      "track": "js",
      "lessonId": "iv-js-loop",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q310",
      "bank": [
        310
      ],
      "zh": "错误处理怎么做",
      "en": "Error Handling",
      "track": "js",
      "lessonId": "iv-js-loop",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q311",
      "bank": [
        311
      ],
      "zh": "怎么处理异步操作",
      "en": "Handle asynchronous operations",
      "track": "js",
      "lessonId": "iv-js-loop",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q288",
      "bank": [
        288
      ],
      "zh": "什么是 DOM，什么是 DOM 事件",
      "en": "What is the DOM and what is DOM event",
      "track": "js",
      "lessonId": "iv-js-tooling",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q289",
      "bank": [
        289
      ],
      "zh": "事件传播 vs 事件委托",
      "en": "Event propagation vs Event delegation",
      "track": "js",
      "lessonId": "iv-js-tooling",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q301",
      "bank": [
        301
      ],
      "zh": "ES6 有哪些新特性",
      "en": "Name the new ES6 features",
      "track": "js",
      "lessonId": "iv-js-tooling",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q308",
      "bank": [
        308
      ],
      "zh": "什么是 ES6 模块",
      "en": "What are ES6 modules",
      "track": "js",
      "lessonId": "iv-js-tooling",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q312",
      "bank": [
        312
      ],
      "zh": "什么是 npm",
      "en": "What is npm",
      "track": "js",
      "lessonId": "iv-js-tooling",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q283",
      "bank": [
        283
      ],
      "zh": "Webpack 是怎么工作的",
      "en": "How does Webpack work",
      "track": "js",
      "lessonId": "iv-js-tooling",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q387",
      "bank": [
        387
      ],
      "zh": "fetch 和 axios 的区别",
      "en": "What is the difference between making server requests via fetch and axios?",
      "track": "js",
      "lessonId": "iv-js-tooling",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q321",
      "bank": [
        321
      ],
      "zh": "什么是 SPA",
      "en": "What is a SPA",
      "track": "react",
      "lessonId": "iv-react-what",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q320",
      "bank": [
        320
      ],
      "zh": "React 的优势是什么",
      "en": "React advantage",
      "track": "react",
      "lessonId": "iv-react-what",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q319",
      "bank": [
        319
      ],
      "zh": "React vs Angular",
      "en": "React vs Angular",
      "track": "react",
      "lessonId": "iv-react-what",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q326",
      "bank": [
        326
      ],
      "zh": "什么是 JSX",
      "en": "What is JSX",
      "track": "react",
      "lessonId": "iv-react-what",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q330",
      "bank": [
        330
      ],
      "zh": "虚拟 DOM 和 diff 算法",
      "en": "Virtual DOM and diffing algorithm",
      "track": "react",
      "lessonId": "iv-react-what",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q353",
      "bank": [
        353
      ],
      "zh": "什么是 reconciliation",
      "en": "What is reconciliation",
      "track": "react",
      "lessonId": "iv-react-what",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q337",
      "bank": [
        337
      ],
      "zh": "React 项目里 babel 和 webpack 干什么",
      "en": "What do we use babel and web pack for in React applications",
      "track": "react",
      "lessonId": "iv-react-what",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q322",
      "bank": [
        322
      ],
      "zh": "函数组件 vs 类组件",
      "en": "Functional components vs Class components",
      "track": "react",
      "lessonId": "iv-react-comp",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q323",
      "bank": [
        323
      ],
      "zh": "React 的生命周期有哪些",
      "en": "Explain the React component lifecycle and its methods",
      "track": "react",
      "lessonId": "iv-react-comp",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q325",
      "bank": [
        325
      ],
      "zh": "useEffect 和生命周期怎么对应",
      "en": "UseEffect vs Lifecycle Methods",
      "track": "react",
      "lessonId": "iv-react-comp",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q327",
      "bank": [
        327
      ],
      "zh": "props vs state",
      "en": "props vs state",
      "track": "react",
      "lessonId": "iv-react-comp",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q328",
      "bank": [
        328
      ],
      "zh": "组件之间怎么通信",
      "en": "Communication between components",
      "track": "react",
      "lessonId": "iv-react-comp",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q329",
      "bank": [
        329
      ],
      "zh": "受控组件 vs 非受控组件",
      "en": "Controlled component vs uncontrolled component",
      "track": "react",
      "lessonId": "iv-react-comp",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q345",
      "bank": [
        345
      ],
      "zh": "什么是状态提升",
      "en": "What is Lifting State Up in React",
      "track": "react",
      "lessonId": "iv-react-comp",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q331",
      "bank": [
        331
      ],
      "zh": "什么是 props drilling",
      "en": "What is props drilling",
      "track": "react",
      "lessonId": "iv-react-comp",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q336",
      "bank": [
        336
      ],
      "zh": "什么是 Pure Component",
      "en": "What are Pure Component",
      "track": "react",
      "lessonId": "iv-react-comp",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q338",
      "bank": [
        338
      ],
      "zh": "什么是 Fragment",
      "en": "React Fragment",
      "track": "react",
      "lessonId": "iv-react-comp",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q335",
      "bank": [
        335
      ],
      "zh": "什么是 HOC",
      "en": "What is HOC",
      "track": "react",
      "lessonId": "iv-react-comp",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q324",
      "bank": [
        324
      ],
      "zh": "什么是 hooks，为什么要用",
      "en": "What are hooks in React and Why do we use them",
      "track": "react",
      "lessonId": "iv-react-hook",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q339",
      "bank": [
        339
      ],
      "zh": "useMemo vs useCallback",
      "en": "useMemo vs useCallback",
      "track": "react",
      "lessonId": "iv-react-hook",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q346",
      "bank": [
        346
      ],
      "zh": "React.memo vs useMemo",
      "en": "React.memo vs useMemo",
      "track": "react",
      "lessonId": "iv-react-hook",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q340",
      "bank": [
        340
      ],
      "zh": "自定义 hook 是干什么的，命名有什么约定",
      "en": "What are custom hooks for and what is the naming convention for them",
      "track": "react",
      "lessonId": "iv-react-hook",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q343",
      "bank": [
        343
      ],
      "zh": "怎么优化 React 性能",
      "en": "How could you improve performance in React",
      "track": "react",
      "lessonId": "iv-react-perf",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q342",
      "bank": [
        342
      ],
      "zh": "React 里怎么写样式",
      "en": "How to use styles in React",
      "track": "react",
      "lessonId": "iv-react-perf",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q344",
      "bank": [
        344
      ],
      "zh": "React 18 有哪些新变化",
      "en": "What are the new changes in react 18",
      "track": "react",
      "lessonId": "iv-react-perf",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q347",
      "bank": [
        347
      ],
      "zh": "React.lazy 是干什么的",
      "en": "What is React lazy function",
      "track": "react",
      "lessonId": "iv-react-perf",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q332",
      "bank": [
        332
      ],
      "zh": "什么是 StrictMode",
      "en": "What is React strict mode",
      "track": "react",
      "lessonId": "iv-react-perf",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q333",
      "bank": [
        333
      ],
      "zh": "什么是错误边界，有什么用",
      "en": "What are error boundaries and How are they useful",
      "track": "react",
      "lessonId": "iv-react-perf",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q334",
      "bank": [
        334
      ],
      "zh": "React Router 的意义是什么",
      "en": "React router, What is the point of it",
      "track": "react",
      "lessonId": "iv-react-perf",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q348",
      "bank": [
        348
      ],
      "zh": "写 React 时你会注意哪些最佳实践",
      "en": "When coding React, what are some best practices that you keep in mind",
      "track": "react",
      "lessonId": "iv-react-perf",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q349",
      "bank": [
        349
      ],
      "zh": "Redux vs Context API",
      "en": "Redux vs Context API",
      "track": "react",
      "lessonId": "iv-react-redux",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q350",
      "bank": [
        350
      ],
      "zh": "Redux 的结构和工作流",
      "en": "Redux structure and workflow",
      "track": "react",
      "lessonId": "iv-react-redux",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q352",
      "bank": [
        352
      ],
      "zh": "Redux 的三大原则",
      "en": "Redux 3 main principles",
      "track": "react",
      "lessonId": "iv-react-redux",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q354",
      "bank": [
        354
      ],
      "zh": "解释一下 Redux 中间件",
      "en": "explain Redux Middleware",
      "track": "react",
      "lessonId": "iv-react-redux",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q355",
      "bank": [
        355
      ],
      "zh": "JavaScript vs TypeScript",
      "en": "Javascript vs TypeScript",
      "track": "react",
      "lessonId": "iv-react-redux",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q356",
      "bank": [
        356
      ],
      "zh": "什么是静态类型检查，有什么好处",
      "en": "What is static type checking and how can developers benefit from it",
      "track": "react",
      "lessonId": "iv-react-redux",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q313",
      "bank": [
        313
      ],
      "zh": "Node.js 的事件循环是怎么工作的",
      "en": "How does the event loop work in Node.js",
      "track": "node",
      "lessonId": "iv-node",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q314",
      "bank": [
        314
      ],
      "zh": "请求 - 响应周期是怎样的",
      "en": "Explain the request & response cycle",
      "track": "node",
      "lessonId": "iv-node",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q315",
      "bank": [
        315
      ],
      "zh": "查询参数 vs 路径参数",
      "en": "Query parameters vs Path parameters",
      "track": "node",
      "lessonId": "iv-node",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q316",
      "bank": [
        316
      ],
      "zh": "什么是 CRUD",
      "en": "What is CRUD",
      "track": "node",
      "lessonId": "iv-node",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q317",
      "bank": [
        317
      ],
      "zh": "关系型数据库 vs 非关系型数据库",
      "en": "Relational database vs Non-relational database",
      "track": "db",
      "lessonId": "iv-sql",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q318",
      "bank": [
        318
      ],
      "zh": "主键 vs 外键",
      "en": "Primary key vs Foreign key",
      "track": "db",
      "lessonId": "iv-sql",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q360",
      "bank": [
        360
      ],
      "zh": "什么是 CORS，怎么解决 CORS 错误",
      "en": "What is CORS and how to solve the CORS error",
      "track": "web",
      "lessonId": "iv-web",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q358",
      "bank": [
        358
      ],
      "zh": "HTTPS vs HTTP",
      "en": "HTTPS vs HTTP",
      "track": "web",
      "lessonId": "iv-web",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q359",
      "bank": [
        359
      ],
      "zh": "什么是 JWT",
      "en": "What is JWT",
      "track": "web",
      "lessonId": "iv-web",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q361",
      "bank": [
        361
      ],
      "zh": "session vs cookie",
      "en": "sessions vs cookies",
      "track": "web",
      "lessonId": "iv-web",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q362",
      "bank": [
        362
      ],
      "zh": "常见的 HTTP 状态码",
      "en": "Give some HTTP response status codes",
      "track": "web",
      "lessonId": "iv-web",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "q357",
      "bank": [
        357
      ],
      "zh": "测试有哪几种",
      "en": "What are the different kinds of tests",
      "track": "web",
      "lessonId": "iv-web",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "ts1",
      "bank": [],
      "zh": "Partial、Required、Pick、Omit、Record 分别解决什么问题",
      "en": "What problems do Partial, Required, Pick, Omit and Record each solve",
      "track": "ts",
      "lessonId": "iv-ts-utility",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "ts2",
      "bank": [],
      "zh": "手写 MyPick 和 MyPartial",
      "en": "Implement Pick and Partial by hand",
      "track": "ts",
      "lessonId": "iv-ts-utility",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "ts3",
      "bank": [],
      "zh": "Exclude、Extract、ReturnType 是怎么实现的",
      "en": "How are Exclude, Extract and ReturnType implemented",
      "track": "ts",
      "lessonId": "iv-ts-utility",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "ts4",
      "bank": [],
      "zh": "为什么 getProp 必须写 K extends keyof T",
      "en": "Why does getProp need the constraint K extends keyof T",
      "track": "ts",
      "lessonId": "iv-ts-generics",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "ts5",
      "bank": [],
      "zh": "判别联合怎么配合 switch 做穷尽检查",
      "en": "How do discriminated unions enable exhaustiveness checking",
      "track": "ts",
      "lessonId": "iv-ts-generics",
      "examId": "interview",
      "hasEn": true
    },
    {
      "id": "ts6",
      "bank": [],
      "zh": "unknown、any、never 各自是什么语义",
      "en": "What do unknown, any and never each mean",
      "track": "ts",
      "lessonId": "iv-ts-generics",
      "examId": "interview",
      "hasEn": true
    }
  ],
  "coding": [
    {
      "id": "todo-list",
      "title": "Todo List",
      "track": "react",
      "difficulty": 1,
      "minutes": 25,
      "runnable": true,
      "hasSandbox": true,
      "explainLessonId": "r-var-todo",
      "requirementCount": 8
    },
    {
      "id": "timer",
      "title": "计时器（useEffect 清理函数）",
      "titleEn": "Timer (useEffect cleanup)",
      "track": "react",
      "difficulty": 2,
      "minutes": 25,
      "runnable": true,
      "hasSandbox": true,
      "explainLessonId": "r-var-timer",
      "requirementCount": 6
    },
    {
      "id": "fetch-user",
      "title": "fetch 取数：loading、error 与竞态",
      "titleEn": "Fetching data: loading, error and race conditions",
      "track": "react",
      "difficulty": 3,
      "minutes": 35,
      "runnable": true,
      "hasSandbox": false,
      "explainLessonId": "r-var-fetch",
      "requirementCount": 5
    },
    {
      "id": "comment-tree",
      "title": "递归评论树 + 树形不可变更新",
      "titleEn": "Recursive comment tree, updated without changing the original",
      "track": "react",
      "difficulty": 3,
      "minutes": 35,
      "runnable": true,
      "hasSandbox": true,
      "explainLessonId": "r-var-comment-tree",
      "requirementCount": 8
    },
    {
      "id": "theme-context",
      "title": "主题切换（Context + value 记忆化）",
      "titleEn": "Theme switch (Context plus a memoised value)",
      "track": "react",
      "difficulty": 2,
      "minutes": 30,
      "runnable": true,
      "hasSandbox": true,
      "explainLessonId": "r-var-theme-context",
      "requirementCount": 7
    },
    {
      "id": "star-rating",
      "title": "星级评分（hover 预览 + 受控双模式）",
      "titleEn": "Star rating (hover preview, controlled and uncontrolled)",
      "track": "react",
      "difficulty": 2,
      "minutes": 25,
      "runnable": true,
      "hasSandbox": true,
      "explainLessonId": "iv-coding-widgets",
      "requirementCount": 7
    },
    {
      "id": "use-local-storage",
      "title": "写一个自定义 hook：useLocalStorage",
      "titleEn": "Write a custom hook: useLocalStorage",
      "track": "react",
      "difficulty": 2,
      "minutes": 25,
      "runnable": true,
      "hasSandbox": true,
      "explainLessonId": "iv-coding-ref-hook",
      "requirementCount": 7
    },
    {
      "id": "kanban",
      "title": "Kanban 看板：一次改两个数组",
      "titleEn": "Kanban board: changing two arrays at once",
      "track": "react",
      "difficulty": 3,
      "minutes": 40,
      "runnable": true,
      "hasSandbox": true,
      "explainLessonId": "iv-coding-kanban",
      "requirementCount": 5
    },
    {
      "id": "tabs",
      "title": "Tabs 组件（只用一个 state）",
      "titleEn": "Tabs component (one piece of state only)",
      "track": "react",
      "difficulty": 1,
      "minutes": 20,
      "runnable": true,
      "hasSandbox": true,
      "explainLessonId": "iv-coding-widgets",
      "requirementCount": 5
    },
    {
      "id": "player",
      "title": "播放器（useRef 操作 DOM）",
      "titleEn": "Media player (touching the DOM with useRef)",
      "track": "react",
      "difficulty": 2,
      "minutes": 25,
      "runnable": true,
      "hasSandbox": false,
      "explainLessonId": "iv-coding-ref-hook",
      "requirementCount": 6
    },
    {
      "id": "dropdown",
      "title": "Dropdown：点外面要关掉",
      "titleEn": "Dropdown: close it on an outside click",
      "track": "react",
      "difficulty": 2,
      "minutes": 25,
      "runnable": true,
      "hasSandbox": true,
      "explainLessonId": "iv-coding-widgets",
      "requirementCount": 5
    },
    {
      "id": "rtk-todo",
      "title": "Redux Toolkit 版 Todo",
      "titleEn": "Todo with Redux Toolkit",
      "track": "react",
      "difficulty": 3,
      "minutes": 40,
      "runnable": true,
      "hasSandbox": true,
      "explainLessonId": "iv-coding-rtk",
      "requirementCount": 6
    },
    {
      "id": "cab-booking-app",
      "title": "Cab Booking（Context 版）",
      "titleEn": "Cab Booking (Context version)",
      "track": "react",
      "difficulty": 3,
      "minutes": 45,
      "runnable": true,
      "hasSandbox": true,
      "explainLessonId": "cb-provider-layer",
      "requirementCount": 12
    },
    {
      "id": "notes-manager",
      "title": "Notes Manager 增删改（React 考试 Q1）",
      "titleEn": "Notes Manager: add, edit and delete (React exam Q1)",
      "track": "react",
      "difficulty": 3,
      "minutes": 60,
      "runnable": true,
      "hasSandbox": true,
      "explainLessonId": "r-task1-add",
      "requirementCount": 8
    },
    {
      "id": "run-tasks",
      "title": "带并发上限的异步任务调度器（Q2）",
      "titleEn": "Async task scheduler with a concurrency limit (Q2)",
      "track": "js",
      "difficulty": 3,
      "minutes": 45,
      "runnable": true,
      "hasSandbox": true,
      "explainLessonId": "r-q2-implement",
      "requirementCount": 6
    },
    {
      "id": "hand-debounce",
      "title": "手写 debounce（带 cancel）",
      "titleEn": "Write debounce yourself (with cancel)",
      "track": "js",
      "difficulty": 1,
      "minutes": 15,
      "runnable": true,
      "hasSandbox": true,
      "explainLessonId": "iv-hand-timing",
      "requirementCount": 4
    },
    {
      "id": "hand-throttle",
      "title": "手写 throttle（leading + trailing）",
      "titleEn": "Write throttle yourself (leading and trailing)",
      "track": "js",
      "difficulty": 2,
      "minutes": 20,
      "runnable": true,
      "hasSandbox": true,
      "explainLessonId": "iv-hand-timing",
      "requirementCount": 4
    },
    {
      "id": "hand-deep-clone",
      "title": "手写 deepClone（防循环）",
      "titleEn": "Write deepClone yourself (handling cycles)",
      "track": "js",
      "difficulty": 2,
      "minutes": 25,
      "runnable": true,
      "hasSandbox": true,
      "explainLessonId": "iv-hand-data",
      "requirementCount": 5
    },
    {
      "id": "hand-flatten",
      "title": "手写 flatten（depth 语义对齐原生）",
      "titleEn": "Write flatten yourself (depth behaves like the built-in)",
      "track": "js",
      "difficulty": 1,
      "minutes": 15,
      "runnable": true,
      "hasSandbox": true,
      "explainLessonId": "iv-hand-data",
      "requirementCount": 4
    },
    {
      "id": "hand-curry",
      "title": "手写 curry（部分应用可复用）",
      "titleEn": "Write curry yourself (reusable partial application)",
      "track": "js",
      "difficulty": 1,
      "minutes": 15,
      "runnable": true,
      "hasSandbox": true,
      "explainLessonId": "iv-hand-data",
      "requirementCount": 3
    },
    {
      "id": "hand-promise-all",
      "title": "手写 Promise.all + allSettled",
      "titleEn": "Write Promise.all and allSettled yourself",
      "track": "js",
      "difficulty": 2,
      "minutes": 25,
      "runnable": true,
      "hasSandbox": true,
      "explainLessonId": "iv-hand-async",
      "requirementCount": 5
    },
    {
      "id": "hand-event-emitter",
      "title": "手写 EventEmitter（on/off/once/emit）",
      "titleEn": "Write EventEmitter yourself (on / off / once / emit)",
      "track": "js",
      "difficulty": 2,
      "minutes": 20,
      "runnable": true,
      "hasSandbox": true,
      "explainLessonId": "iv-hand-async",
      "requirementCount": 4
    },
    {
      "id": "hand-lru",
      "title": "手写 LRUCache（用 Map 的插入序）",
      "titleEn": "Write LRUCache yourself (using Map insertion order)",
      "track": "js",
      "difficulty": 2,
      "minutes": 20,
      "runnable": true,
      "hasSandbox": true,
      "explainLessonId": "iv-hand-async",
      "requirementCount": 5
    },
    {
      "id": "orders-subgraph",
      "title": "Orders subgraph：四个 resolver + DataLoader",
      "titleEn": "Orders subgraph: four resolvers and DataLoader",
      "track": "graphql",
      "difficulty": 3,
      "minutes": 90,
      "runnable": false,
      "hasSandbox": false,
      "explainLessonId": "g-read-task1",
      "requirementCount": 13
    },
    {
      "id": "spring-endpoints",
      "title": "六个 Spring Boot REST 端点",
      "titleEn": "Six Spring Boot REST endpoints",
      "track": "java",
      "difficulty": 3,
      "minutes": 75,
      "runnable": false,
      "hasSandbox": false,
      "explainLessonId": "g-endpoints",
      "requirementCount": 11
    }
  ],
  "arena": [
    {
      "id": "r-rebuild-q1",
      "title": "从零重建 Q1 · Notes Manager",
      "scenarioEn": "An empty folder. Start a Vite + React + TS project yourself, install the dependencies yourself, and write the Notes Manager add, edit and delete so all four tests pass. Do not change a single data-testid in the test file.",
      "scenario": "空文件夹。自己起一个 Vite + React + TS 项目，自己装依赖，把 Notes Manager 的增删改写出来并让四个测试全过。测试文件的 data-testid 一个都不能改。",
      "minutes": 75,
      "examId": "react",
      "fromMock": false,
      "requirementCount": 11,
      "commandCount": 4,
      "runnable": false
    },
    {
      "id": "r-rebuild-q2",
      "title": "从零重建 Q2 · 并发任务调度器",
      "scenarioEn": "An empty folder. Implement an async task scheduler with a concurrency limit: never run more than the limit at once, keep results in input order, and report a failed task as rejected instead of letting the whole batch fail.",
      "scenario": "空文件夹。实现一个带并发上限的异步任务调度器：并发数不得超过上限、结果顺序与输入一致、失败的任务以 rejected 出现而不是让整批崩掉。",
      "minutes": 45,
      "examId": "react",
      "fromMock": false,
      "requirementCount": 6,
      "commandCount": 3,
      "runnable": false
    },
    {
      "id": "support-tickets",
      "title": "模拟考 A · Support Ticket Board",
      "titleEn": "Mock exam A · Support Ticket Board",
      "scenarioEn": "The React exam in a different business setting: Support Ticket Board. It tests the same things as Q1, but the problem is new — do not look back at your Q1 answer.",
      "scenario": "换了业务场景的 React 考试：Support Ticket Board。考点和 Q1 一致，但题面是新的 —— 不许回头看 Q1 的答案。",
      "minutes": 60,
      "examId": "react",
      "fromMock": true,
      "requirementCount": 23,
      "commandCount": 3,
      "runnable": false
    },
    {
      "id": "g-rebuild-subgraph",
      "title": "从零重建 Task 1 · Orders subgraph",
      "scenarioEn": "An empty folder. Build an Apollo Federation subgraph yourself: write the schema, write the four resolvers, use DataLoader to avoid N+1, put extensions.code on errors, and make all ten tests pass.",
      "scenario": "空文件夹。自己搭一个 Apollo Federation subgraph：写 schema、写四个 resolver、用 DataLoader 防 N+1、错误带上 extensions.code，并让十个测试全过。",
      "minutes": 90,
      "examId": "graphql-federation",
      "fromMock": false,
      "requirementCount": 13,
      "commandCount": 4,
      "runnable": false
    },
    {
      "id": "g-rebuild-controller",
      "title": "从零重建 Task 2 · Spring Boot 控制器",
      "scenarioEn": "An empty folder, or an empty Spring Initializr skeleton. Write the six REST endpoints: method, path, status code, where each parameter comes from, validation, and exception handling, with all five tests passing.",
      "scenario": "空文件夹（或一个空的 Spring Initializr 骨架）。把六个 REST 端点写出来：方法、路径、状态码、参数来源、校验、异常处理，五个测试全过。",
      "minutes": 75,
      "examId": "graphql-federation",
      "fromMock": false,
      "requirementCount": 11,
      "commandCount": 8,
      "runnable": false
    },
    {
      "id": "book-reviews",
      "title": "模拟考 B · Book Reviews Subgraph",
      "titleEn": "Mock exam B · Book Reviews Subgraph",
      "scenarioEn": "The Federation exam in a different business setting: Book Reviews. A subgraph stitched together with an entity; it tests the same things as Task 1, and the problem is new.",
      "scenario": "换了业务场景的 Federation 考试：Book Reviews。subgraph 加 entity 缝合，考点和 Task 1 一致，题面是新的。",
      "minutes": 90,
      "examId": "graphql-federation",
      "fromMock": true,
      "requirementCount": 25,
      "commandCount": 3,
      "runnable": false
    },
    {
      "id": "cb-from-scratch",
      "title": "空文件夹里做出整个 Cab Booking",
      "scenarioEn": "An empty folder. You get four tests and one data file. Build a Cab Booking app: Context holds the current booking and the ride history, four pages switch through one state machine, and the history keeps only the three most recent with the newest first. All four tests pass.",
      "scenario": "空文件夹。只有四个测试和一份数据文件：搭一个 Cab Booking 应用 —— Context 存「当前预订」和「行程历史」，四个页面用一个状态机切换，历史只留最新三条且最新在最上。四个测试全过。",
      "minutes": 60,
      "examId": "cab-booking",
      "fromMock": false,
      "requirementCount": 10,
      "commandCount": 4,
      "runnable": false
    }
  ]
};

export const NAV: NavExam[] = PAYLOAD.exams;
export const DRILLS: NavDrill[] = PAYLOAD.drills;
export const CODING: NavCoding[] = PAYLOAD.coding;
export const ARENA: NavArena[] = PAYLOAD.arena;

export const DRILL_TRACK_ORDER: NavDrillTrack[] = [
  "html",
  "css",
  "js",
  "react",
  "node",
  "db",
  "web",
  "ts",
];

export const DRILL_TRACK_LABEL: Record<NavDrillTrack, { zh: string; en: string }> = {
  html: { zh: "HTML", en: "HTML" },
  css: { zh: "CSS", en: "CSS" },
  js: { zh: "JavaScript", en: "JavaScript" },
  react: { zh: "React 与生态", en: "React & ecosystem" },
  node: { zh: "Node / Express", en: "Node / Express" },
  db: { zh: "数据库", en: "Databases" },
  web: { zh: "网络与安全", en: "Web & security" },
  ts: { zh: "TypeScript 深度", en: "TypeScript deep dive" },
};

export const drillPath = (id: string) => `/drill/${id}`;
export const codingPath = (id: string) => `/code/${id}`;
export const arenaPath = (id: string) => `/arena/${id}`;

/* ---------- 查找与聚合（和 registry 的同名函数保持一致的语义） ---------- */

export const navExam = (id: string) => NAV.find((e) => e.id === id);

export interface NavLessonRef {
  exam: NavExam;
  module: NavModule;
  lesson: NavLesson;
  index: number;
  total: number;
}

export function navLessonsOf(exam: NavExam): NavLessonRef[] {
  const flat: { module: NavModule; lesson: NavLesson }[] = [];
  exam.modules.forEach((m) => m.lessons.forEach((l) => flat.push({ module: m, lesson: l })));
  return flat.map((x, i) => ({ exam, ...x, index: i + 1, total: flat.length }));
}

export function navStages(): { stage: string; exam: NavExam; module: NavModule }[] {
  const out: { stage: string; exam: NavExam; module: NavModule }[] = [];
  for (const exam of NAV) {
    for (const mod of exam.modules) {
      if (mod.stage) out.push({ stage: mod.stage, exam, module: mod });
    }
  }
  return out;
}

export const examPath = (examId: string) => `/exams/${examId}`;
export const lessonPath = (examId: string, lessonId: string) =>
  `/exams/${examId}/${lessonId}`;
export const mockPath = (examId: string, mockId: string) =>
  `/mock/${examId}/${mockId}`;
