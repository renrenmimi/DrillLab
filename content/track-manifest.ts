// 首页仪表盘用的**轨道清单** —— 生成物，不要手改。改完内容跑 `npm run gen:nav`。
//
// 【为什么不直接读 content/nav.ts】
// 首页要显示每门课的进度和「接着上次那一节」，需要的只有：课程名、一句话、
// 按顺序排好的课文 id / 标题 / 链接。而 nav.ts 是 134 KB —— 它还带着
// 模块结构、练习计数、八股清单、coding 清单、考场清单、模拟考题目名。
// 首页首屏用不上那些。
//
// 实测：把 nav 拉进首页首屏，First Load JS 从 178 kB 涨到两百多；
// 这一份只有几 KB。
//
// 【为什么不复用 content/plan-manifest.ts】
// 那一份只包含「出现在某条计划里」的课文，实测覆盖 65 / 80 节 ——
// 面试八股那门课有 15 节不在任何计划的课文档里（计划是通过八股题覆盖它的）。
// 首页仪表盘要的是**全部** 80 节。

export interface TrackLesson {
  id: string;
  href: string;
  zh: string;
  en?: string;
}

export interface Track {
  id: string;
  zh: string;
  en?: string;
  /** 一句话：这门课是干什么的 */
  blurbZh: string;
  blurbEn?: string;
  /** 主线还是平行支线。平行支线任何时候都能开始 */
  parallel?: boolean;
  /** 全部课文，按学习顺序 */
  lessons: TrackLesson[];
}

/** 除课文之外的几个练习面，只有计数 —— 它们没有「读到第几节」这回事 */
export interface SurfaceCounts {
  drills: number;
  exercises: number;
  coding: number;
  arena: number;
  mocks: number;
}

export const TRACKS: Track[] = [
  {
    "id": "foundations",
    "zh": "地基 · 项目与语言",
    "en": "Foundations · project and language",
    "blurbZh": "在动 React 和 GraphQL 之前，先把「一个 JavaScript 项目是怎么运行的」搞清楚：Node、npm、package.json、scripts、目录结构、怎么跑测试、报错该从哪看起。然后只补两门考试真正会用到的 JavaScript 与 TypeScript。",
    "blurbEn": "Before starting React or GraphQL, get clear on how a JavaScript project runs: Node, npm, package.json, scripts, the directory layout, how to run the tests, and where to look first when something fails. After that, only the JavaScript and TypeScript that the two exam projects actually use.",
    "lessons": [
      {
        "id": "node-and-npm",
        "href": "/exams/foundations/node-and-npm",
        "zh": "Node.js、npm、node_modules 和 lockfile",
        "en": "Node.js, npm, node_modules and the lockfile"
      },
      {
        "id": "package-json",
        "href": "/exams/foundations/package-json",
        "zh": "package.json 逐字段读一遍",
        "en": "package.json, field by field"
      },
      {
        "id": "npm-scripts",
        "href": "/exams/foundations/npm-scripts",
        "zh": "npm scripts：命令到底跑了什么",
        "en": "npm scripts: what the command actually runs"
      },
      {
        "id": "project-layout",
        "href": "/exams/foundations/project-layout",
        "zh": "两个考试项目的目录，逐个说明",
        "en": "The directory layout of both exam projects"
      },
      {
        "id": "js-immutable-data",
        "href": "/exams/foundations/js-immutable-data",
        "zh": "数组与对象：不可变更新三件套",
        "en": "Arrays and objects: three ways to update without changing the original"
      },
      {
        "id": "js-async",
        "href": "/exams/foundations/js-async",
        "zh": "异步：Promise、await、all 和 allSettled",
        "en": "Async: Promise, await, all and allSettled"
      },
      {
        "id": "js-modules",
        "href": "/exams/foundations/js-modules",
        "zh": "ESM:import / export 与那些莫名其妙的报错",
        "en": "ESM: import / export, and the errors that look strange at first"
      },
      {
        "id": "ts-types",
        "href": "/exams/foundations/ts-types",
        "zh": "类型、type 与 interface",
        "en": "Types, type and interface"
      },
      {
        "id": "ts-generics-and-errors",
        "href": "/exams/foundations/ts-generics-and-errors",
        "zh": "泛型参数，以及怎么读 tsc 的报错",
        "en": "Generic parameters, and how to read a tsc error"
      }
    ]
  },
  {
    "id": "react",
    "zh": "React 考试",
    "en": "React exam",
    "blurbZh": "对应 react-notes-app 这个真实项目：Q1 是一个 Notes Manager 的增删改（CRUD），Q2 是一个带并发上限的异步任务调度器。从「组件是什么」讲到能在空文件夹里重建整个项目。",
    "blurbEn": "Built on the real react-notes-app project: Q1 is a Notes Manager that adds, deletes and edits notes (CRUD), and Q2 is an async task runner that limits how many tasks run at the same time. It starts at what a component is and ends with rebuilding the whole project in an empty folder.",
    "lessons": [
      {
        "id": "r-component",
        "href": "/exams/react/r-component",
        "zh": "组件就是一个返回界面的函数",
        "en": "A component is a function that returns what you see on screen"
      },
      {
        "id": "r-props",
        "href": "/exams/react/r-props",
        "zh": "props：数据往下流，事件往上报",
        "en": "props: data flows down, events go back up"
      },
      {
        "id": "r-state",
        "href": "/exams/react/r-state",
        "zh": "useState：让界面跟着数据变",
        "en": "useState: making the screen follow the data"
      },
      {
        "id": "r-controlled-input",
        "href": "/exams/react/r-controlled-input",
        "zh": "受控输入：value + onChange 的闭环",
        "en": "Controlled inputs: the loop between value and onChange"
      },
      {
        "id": "r-lists-keys",
        "href": "/exams/react/r-lists-keys",
        "zh": "列表渲染与 key",
        "en": "Rendering a list, and the key prop"
      },
      {
        "id": "r-useeffect",
        "href": "/exams/react/r-useeffect",
        "zh": "useEffect：把 props 的变化同步进 state",
        "en": "useEffect: copying a change in props into state"
      },
      {
        "id": "r-derived-lifting",
        "href": "/exams/react/r-derived-lifting",
        "zh": "派生数据与状态提升：什么不该做成 state",
        "en": "Values you can compute, and lifting state up: what should not be state"
      },
      {
        "id": "r-read-q1",
        "href": "/exams/react/r-read-q1",
        "zh": "先读题：三个任务、一条硬约束、四个测试",
        "en": "Read the question first: three tasks, one rule you must not break, four tests"
      },
      {
        "id": "r-task1-add",
        "href": "/exams/react/r-task1-add",
        "zh": "Task 1 · Add：提交表单，新笔记进入表格",
        "en": "Task 1 · Add: submit the form and the new note appears in the table"
      },
      {
        "id": "r-task2-delete",
        "href": "/exams/react/r-task2-delete",
        "zh": "Task 2 · Delete：点 Delete，该行按 id 被移除",
        "en": "Task 2 · Delete: click Delete and that one row is removed by id"
      },
      {
        "id": "r-task3-edit",
        "href": "/exams/react/r-task3-edit",
        "zh": "Task 3 · Edit：回填、改文字、就地更新、退出编辑",
        "en": "Task 3 · Edit: refill the form, change the button text, update the row where it is, leave edit mode"
      },
      {
        "id": "r-tests",
        "href": "/exams/react/r-tests",
        "zh": "四个测试逐条读，以及它们的盲区",
        "en": "The four tests read line by line, and what they fail to catch"
      },
      {
        "id": "r-q2-read",
        "href": "/exams/react/r-q2-read",
        "zh": "读题：三条要求，每一条都在指定一种写法",
        "en": "Reading the question: three requirements, and each one decides how you write it"
      },
      {
        "id": "r-q2-implement",
        "href": "/exams/react/r-q2-implement",
        "zh": "实现：worker pool（工人池）",
        "en": "Building it: a worker pool, meaning a fixed number of workers sharing one queue"
      },
      {
        "id": "r-var-todo",
        "href": "/exams/react/r-var-todo",
        "zh": "变式一 · Todo List",
        "en": "Variation 1 · Todo List"
      },
      {
        "id": "r-var-timer",
        "href": "/exams/react/r-var-timer",
        "zh": "变式二 · 计时器：useEffect 的清理函数",
        "en": "Variation 2 · a timer: the useEffect cleanup function"
      },
      {
        "id": "r-var-fetch",
        "href": "/exams/react/r-var-fetch",
        "zh": "变式三 · fetch 取数：loading、error 与竞态",
        "en": "Variation 3 · fetching data: loading, error, and the race between two requests"
      },
      {
        "id": "r-var-comment-tree",
        "href": "/exams/react/r-var-comment-tree",
        "zh": "变式四 · 递归读取评论的评论",
        "en": "Variation 4 · reading replies to replies with recursion"
      },
      {
        "id": "r-var-theme-context",
        "href": "/exams/react/r-var-theme-context",
        "zh": "变式五 · 主题切换：Context 怎么用",
        "en": "Variation 5 · theme switching: how to use Context"
      },
      {
        "id": "r-debug-lab",
        "href": "/exams/react/r-debug-lab",
        "zh": "Debug Lab · React 十种典型故障",
        "en": "Debug Lab · ten typical React failures"
      },
      {
        "id": "r-rebuild",
        "href": "/exams/react/r-rebuild",
        "zh": "从零重写：空文件夹到 4 个测试全过",
        "en": "Write it again yourself: from an empty folder to 4 passing tests"
      }
    ]
  },
  {
    "id": "graphql-federation",
    "zh": "Federation 考试",
    "en": "Federation exam",
    "blurbZh": "对应 graphql-federation-practice 这个真实项目：一个 Apollo Federation subgraph（Node.js）加一个 Spring Boot REST 微服务，再加两道书面题。从「GraphQL 是什么」讲到能在空目录里重建整个 subgraph。",
    "blurbEn": "Built on the real project graphql-federation-practice: one Apollo Federation subgraph (Node.js), one Spring Boot REST microservice, and two written questions. It starts at what GraphQL is and ends with rebuilding the whole subgraph in an empty directory.",
    "lessons": [
      {
        "id": "g-what-is",
        "href": "/exams/graphql-federation/g-what-is",
        "zh": "GraphQL 是什么：一份 schema 加一堆 resolver",
        "en": "What GraphQL is: one schema plus a set of resolvers"
      },
      {
        "id": "g-resolver",
        "href": "/exams/graphql-federation/g-resolver",
        "zh": "resolver 的四个参数",
        "en": "The four arguments of a resolver"
      },
      {
        "id": "g-nullable",
        "href": "/exams/graphql-federation/g-nullable",
        "zh": "非空、列表，和那个没有 price 的 input",
        "en": "Non-null, lists, and the input that has no price"
      },
      {
        "id": "g-why-federation",
        "href": "/exams/graphql-federation/g-why-federation",
        "zh": "为什么会有 Federation",
        "en": "Why Federation exists"
      },
      {
        "id": "g-subgraph",
        "href": "/exams/graphql-federation/g-subgraph",
        "zh": "subgraph 是怎么跑起来的",
        "en": "How a subgraph starts up"
      },
      {
        "id": "g-entity",
        "href": "/exams/graphql-federation/g-entity",
        "zh": "entity、@key 与 __resolveReference",
        "en": "entity, @key and __resolveReference"
      },
      {
        "id": "g-dataloader",
        "href": "/exams/graphql-federation/g-dataloader",
        "zh": "N+1 问题与 DataLoader",
        "en": "The N+1 problem and DataLoader"
      },
      {
        "id": "g-read-task1",
        "href": "/exams/graphql-federation/g-read-task1",
        "zh": "先读题：四个 TODO、三处埋雷、十个测试",
        "en": "Read the task first: four TODOs, three planted bugs, ten tests"
      },
      {
        "id": "g-user-orders",
        "href": "/exams/graphql-federation/g-user-orders",
        "zh": "TODO 1 · User.orders",
        "en": "TODO 1 · User.orders"
      },
      {
        "id": "g-shipping-info",
        "href": "/exams/graphql-federation/g-shipping-info",
        "zh": "TODO 2 · Order.shippingInfo",
        "en": "TODO 2 · Order.shippingInfo"
      },
      {
        "id": "g-queries",
        "href": "/exams/graphql-federation/g-queries",
        "zh": "TODO 3 & 4 · Query.order 与 Query.orders",
        "en": "TODO 3 & 4 · Query.order and Query.orders"
      },
      {
        "id": "g-planted-bugs",
        "href": "/exams/graphql-federation/g-planted-bugs",
        "zh": "三处埋雷：怎么系统地找出来",
        "en": "The three planted bugs: how to find them systematically"
      },
      {
        "id": "g-spring-basics",
        "href": "/exams/graphql-federation/g-spring-basics",
        "zh": "先看懂给你的东西：Spring 的几个注解和一条请求链路",
        "en": "Understand what you are given: a few Spring annotations and the path one request takes"
      },
      {
        "id": "g-endpoints",
        "href": "/exams/graphql-federation/g-endpoints",
        "zh": "六个端点：状态码就是这道题的全部",
        "en": "Six endpoints: the status codes are the whole task"
      },
      {
        "id": "g-written",
        "href": "/exams/graphql-federation/g-written",
        "zh": "两道书面题：延迟传播与生产配置",
        "en": "The two written questions: how delay spreads, and production configuration"
      },
      {
        "id": "g-debug-lab",
        "href": "/exams/graphql-federation/g-debug-lab",
        "zh": "Debug Lab · Federation 十种典型故障",
        "en": "Debug Lab · ten common Federation failures"
      },
      {
        "id": "g-rebuild",
        "href": "/exams/graphql-federation/g-rebuild",
        "zh": "从零重写：空目录到 10 个测试全过",
        "en": "Rewrite it: from an empty directory to all 10 tests passing"
      }
    ]
  },
  {
    "id": "interview",
    "zh": "面试八股",
    "en": "Interview questions",
    "blurbZh": "一份作者做过的前端面试题整理，按 HTML / CSS / JavaScript / React / Node / 数据库 / 网络分好组，每道题给「一句话答案 + 展开 + 会被追问什么」。最后一节把 16 道 coding 题逐题对照本站已有的练习，指出哪些已经写过、哪些是缺口。",
    "blurbEn": "A set of frontend interview questions the author went through, grouped by HTML / CSS / JavaScript / React / Node / databases / networking. Every question gets a one-sentence answer, a longer explanation, and the follow-up questions to expect. The last part compares the 16 coding problems one by one against the exercises already on this site, and points out which ones are already written up and which ones are gaps.",
    "parallel": true,
    "lessons": [
      {
        "id": "iv-html",
        "href": "/exams/interview/iv-html",
        "zh": "HTML 五问",
        "en": "5 questions on HTML"
      },
      {
        "id": "iv-css",
        "href": "/exams/interview/iv-css",
        "zh": "CSS 八问",
        "en": "8 questions on CSS"
      },
      {
        "id": "iv-js-types",
        "href": "/exams/interview/iv-js-types",
        "zh": "引擎与类型十问",
        "en": "10 questions on the engine and types"
      },
      {
        "id": "iv-js-fn",
        "href": "/exams/interview/iv-js-fn",
        "zh": "函数与作用域十二问",
        "en": "12 questions on functions and scope"
      },
      {
        "id": "iv-js-this",
        "href": "/exams/interview/iv-js-this",
        "zh": "this 与面向对象三问",
        "en": "3 questions on this and object-oriented programming"
      },
      {
        "id": "iv-js-loop",
        "href": "/exams/interview/iv-js-loop",
        "zh": "异步与事件循环六问",
        "en": "6 questions on async and the event loop"
      },
      {
        "id": "iv-js-tooling",
        "href": "/exams/interview/iv-js-tooling",
        "zh": "DOM、模块与工具链七问",
        "en": "7 questions on the DOM, modules and tooling"
      },
      {
        "id": "iv-react-what",
        "href": "/exams/interview/iv-react-what",
        "zh": "React 是什么 · 七问",
        "en": "7 questions on what React is"
      },
      {
        "id": "iv-react-comp",
        "href": "/exams/interview/iv-react-comp",
        "zh": "组件与通信 · 十一问",
        "en": "11 questions on components and how they communicate"
      },
      {
        "id": "iv-react-hook",
        "href": "/exams/interview/iv-react-hook",
        "zh": "Hooks 四问",
        "en": "4 questions on Hooks"
      },
      {
        "id": "iv-react-perf",
        "href": "/exams/interview/iv-react-perf",
        "zh": "性能与新特性 · 八问",
        "en": "8 questions on performance and new features"
      },
      {
        "id": "iv-react-redux",
        "href": "/exams/interview/iv-react-redux",
        "zh": "Redux 与 TypeScript · 六问",
        "en": "6 questions on Redux and TypeScript"
      },
      {
        "id": "iv-node",
        "href": "/exams/interview/iv-node",
        "zh": "Node 与 Express 四问",
        "en": "4 questions on Node and Express"
      },
      {
        "id": "iv-sql",
        "href": "/exams/interview/iv-sql",
        "zh": "数据库两问",
        "en": "2 questions on databases"
      },
      {
        "id": "iv-web",
        "href": "/exams/interview/iv-web",
        "zh": "网络、安全与测试 · 六问",
        "en": "6 questions on networking, security and testing"
      },
      {
        "id": "iv-coding-map",
        "href": "/exams/interview/iv-coding-map",
        "zh": "16 道题逐题对照",
        "en": "The 16 problems, compared one by one"
      },
      {
        "id": "iv-coding-widgets",
        "href": "/exams/interview/iv-coding-widgets",
        "zh": "缺口一 · Dropdown、Tabs、星级评分",
        "en": "Gap 1 · dropdown, tabs and star rating"
      },
      {
        "id": "iv-coding-ref-hook",
        "href": "/exams/interview/iv-coding-ref-hook",
        "zh": "缺口二 · useRef 操作 DOM，与写一个自定义 hook",
        "en": "Gap 2 · using useRef on the DOM, and writing a custom hook"
      },
      {
        "id": "iv-coding-rtk",
        "href": "/exams/interview/iv-coding-rtk",
        "zh": "缺口三 · 同一个 Todo 换成 Redux Toolkit",
        "en": "Gap 3 · the same Todo app, moved to Redux Toolkit"
      },
      {
        "id": "iv-coding-kanban",
        "href": "/exams/interview/iv-coding-kanban",
        "zh": "缺口四 · Kanban 看板：一次改两个数组",
        "en": "Gap 4 · a Kanban board: changing two arrays in one update"
      },
      {
        "id": "iv-hand-timing",
        "href": "/exams/interview/iv-hand-timing",
        "zh": "计时两兄弟：debounce 与 throttle",
        "en": "Two timing helpers: debounce and throttle"
      },
      {
        "id": "iv-hand-data",
        "href": "/exams/interview/iv-hand-data",
        "zh": "数据与函数：deepClone、flatten、curry",
        "en": "Data and functions: deepClone, flatten, curry"
      },
      {
        "id": "iv-hand-async",
        "href": "/exams/interview/iv-hand-async",
        "zh": "异步与结构：Promise.all、EventEmitter、LRU",
        "en": "Async and structure: Promise.all, EventEmitter, LRU"
      },
      {
        "id": "iv-ts-utility",
        "href": "/exams/interview/iv-ts-utility",
        "zh": "Utility Types：会用，还要会手写",
        "en": "Utility types: use them, and write them yourself"
      },
      {
        "id": "iv-ts-generics",
        "href": "/exams/interview/iv-ts-generics",
        "zh": "泛型与收窄：把 any 赶出代码",
        "en": "Generics and narrowing: getting any out of the code"
      }
    ]
  },
  {
    "id": "cab-booking",
    "zh": "Cab Booking",
    "en": "Cab Booking",
    "blurbZh": "一个用 Context 管全局状态的打车小应用。四个页面、一个 Context、四个测试。练的是「Context 在一个真实多页应用里怎么用」—— Provider 放在哪一层、一个 action 同时改两个 state、消费者散在三个组件里。",
    "blurbEn": "A small cab booking app that keeps its global state in a Context. Four pages, one Context, four tests. The practice here is how to use Context in a real app with several pages: which level the Provider goes on, one action updating two pieces of state at once, and readers of the Context spread across three components.",
    "lessons": [
      {
        "id": "cb-read-tests",
        "href": "/exams/cab-booking/cb-read-tests",
        "zh": "先读四个测试：它们到底要什么",
        "en": "Read the four tests first: what exactly they ask for"
      },
      {
        "id": "cb-provider-layer",
        "href": "/exams/cab-booking/cb-provider-layer",
        "zh": "Context 放在哪一层 —— 这道题最容易死的地方",
        "en": "Which level the Context goes on — the most common way to fail this task"
      },
      {
        "id": "cb-page-machine",
        "href": "/exams/cab-booking/cb-page-machine",
        "zh": "用一个 state 管四个页面",
        "en": "Controlling four pages with one piece of state"
      },
      {
        "id": "cb-options-grid",
        "href": "/exams/cab-booking/cb-options-grid",
        "zh": "按类型分组渲染六张卡",
        "en": "Rendering the six cards grouped by type"
      },
      {
        "id": "cb-loading-timer",
        "href": "/exams/cab-booking/cb-loading-timer",
        "zh": "Loading：一秒之后自己跳走",
        "en": "Loading: it moves to the next page by itself after one second"
      },
      {
        "id": "cb-history-three",
        "href": "/exams/cab-booking/cb-history-three",
        "zh": "历史与确认页：两个小而致命的细节",
        "en": "The history and confirmation pages: two small details that decide pass or fail"
      },
      {
        "id": "cb-scaffold-bug",
        "href": "/exams/cab-booking/cb-scaffold-bug",
        "zh": "完整答案跑不起来 —— 一个扩展名的事",
        "en": "The complete answer does not run — the cause is one file extension"
      },
      {
        "id": "cb-rewrite",
        "href": "/exams/cab-booking/cb-rewrite",
        "zh": "从零重写：空文件夹里做出来",
        "en": "Rewrite it: build the whole app in an empty folder"
      }
    ]
  }
];

export const SURFACES: SurfaceCounts = {
  "drills": 105,
  "exercises": 148,
  "coding": 25,
  "arena": 7,
  "mocks": 2
};
