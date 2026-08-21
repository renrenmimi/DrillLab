// 这个文件是生成物，不要手改。生成器：scripts/gen-nav.mjs（模板在 search-index-template.txt）。
//
// 【它为什么单独一个文件】
// 里面是搜索 haystack 需要的重字段：objectives / whyForAssessment /
// conceptHeadings / conceptLedes / exerciseTitles / sourcePaths / recap / transfer。
// 加起来 130 KB 出头，而唯一的消费者是 components/search.tsx。
// 搜索要按 ⌘K 才打开，所以这份数据**不该进任何页面的首屏包** ——
// search.tsx 用 await import() 在第一次打开搜索时才拉它。
//
// 实测：拆出去之前，装着这些字段的 nav chunk 在 /drill 上是 80 kB（gzip 后），
// 占该页 JS 的 40%，而绝大多数访问根本不会打开搜索。
//
// 往这里加字段可以随意（它是懒加载的）；往 content/nav.ts 加要三思。

export interface SearchLesson {
  examId: string;
  lessonId: string;
  objectives: string[];
  whyForAssessment: string;
  conceptHeadings: string[];
  conceptLedes: string[];
  exerciseTitles: string[];
  sourcePaths: string[];
  recap: string[];
  transfer: string[];
}

export const SEARCH_LESSONS: SearchLesson[] = [
  {
    "examId": "foundations",
    "lessonId": "node-and-npm",
    "objectives": [
      "说清 Node.js 和浏览器里的 JavaScript 是什么关系",
      "知道 npm install 到底做了什么，node_modules 从哪来",
      "知道 lockfile 是什么、为什么不能随便删或换成别的包管理器",
      "知道 dependencies 和 devDependencies 的区别在哪里体现"
    ],
    "whyForAssessment": "两个 assessment 的第一步都是 npm install。装不上、装错版本、或者手滑生成了第二个 lockfile，后面全都跑不起来 —— 这时候不是你 React 写得不好，是根本没进考场。",
    "conceptHeadings": [
      "Node.js：让 JavaScript 离开浏览器",
      "npm：替你去把别人写好的代码搬回来",
      "lockfile：把「大概哪个版本」钉成「就是这个版本」",
      "dependencies 和 devDependencies 差在哪"
    ],
    "conceptLedes": [
      "JavaScript 最早只能在网页里跑。Node.js 把它搬到了你的终端里。",
      "npm 是 package manager（包管理器）。它管的是「这个项目需要哪些别人写的代码」。",
      "package.json 写的是范围，lockfile 记的是事实。"
    ],
    "exerciseTitles": [
      "这个包该放哪边？",
      "lockfile 该怎么对待"
    ],
    "sourcePaths": [
      "react-notes-app/package.json",
      "react-notes-app/package-lock.json",
      "graphql-federation-practice/node-subgraph/package.json"
    ],
    "recap": [
      "Node.js = 能在终端里跑 JavaScript 的运行时；npm 一般随它一起装。",
      "npm install 读 package.json，把依赖（以及依赖的依赖）下载到 node_modules。",
      "package.json 里的 ^18.3.1 是范围，lockfile 才是「实际装了哪个版本」的事实。",
      "别删 lockfile，别在有 package-lock.json 的项目里跑 pnpm/yarn。",
      "dependencies = 产品运行时要用；devDependencies = 只在开发/构建/测试时用。"
    ],
    "transfer": [
      "拿到一个新项目，不知道从哪开始 先看 package.json，再 npm install",
      "「我这里跑得过，他那里跑不过」 先比 Node 版本和 lockfile",
      "看到 node_modules 很大 正常，它是下载产物，不进版本库"
    ]
  },
  {
    "examId": "foundations",
    "lessonId": "package-json",
    "objectives": [
      "认得 name / version / private / type / main / scripts 各是干什么的",
      "知道 \"type\": \"module\" 会怎样改变 import 的写法",
      "能从一个陌生的 package.json 判断出这个项目怎么跑、用什么测试",
      "知道配置也可以内嵌在 package.json 里（subgraph 的 jest 配置就是）"
    ],
    "whyForAssessment": "考场上没人会告诉你「这个项目怎么跑」。package.json 就是答案本身。看懂它，等于拿到了考场地图。",
    "conceptHeadings": [
      "先读 React 考试的这一份",
      "字段逐条解释",
      "再读 Federation 考试那一份",
      "拿到陌生 package.json 的三步读法"
    ],
    "conceptLedes": [
      "整个文件只有 7 个顶层字段。逐个看。",
      "同样的读法，但多了两个新东西：main 和内嵌配置。"
    ],
    "exerciseTitles": [
      "补全 subgraph 的 package.json 关键字段"
    ],
    "sourcePaths": [
      "react-notes-app/package.json",
      "graphql-federation-practice/node-subgraph/package.json"
    ],
    "recap": [
      "package.json 的 scripts 决定你能跑什么命令，是拿到项目第一个要读的字段。",
      "\"type\": \"module\" 决定源码用 ESM 还是 CommonJS，直接影响 import 能不能写。",
      "private: true 只是防止误发布，与能不能跑无关。",
      "配置可以内嵌：subgraph 的 jest 配置就在 package.json 里，不在单独文件。",
      "dependencies 里出现 dataloader 这种特征包，基本等于告诉你考点在哪。"
    ],
    "transfer": [
      "不知道项目怎么跑 读 package.json 的 scripts",
      "不知道这题要考什么 读 dependencies，特殊的包就是考点",
      "找不到 jest / eslint 配置文件 看 package.json 里有没有同名内嵌字段",
      "import 报 Cannot use import statement 检查 \"type\": \"module\""
    ]
  },
  {
    "examId": "foundations",
    "lessonId": "npm-scripts",
    "objectives": [
      "看懂 scripts 里每条命令实际调用了什么程序",
      "解释 npm test 和 npm run test 的区别，以及为什么有些命令不用加 run",
      "知道项目里没有 test script 时该怎么跑测试",
      "拿到报错时知道先看哪一层"
    ],
    "whyForAssessment": "react-notes-app 的 package.json 里没有 test script —— 直接跑 npm test 会报 Missing script。判卷靠的却正是那四个测试。跑不起来测试，等于蒙着眼睛答题。",
    "conceptHeadings": [
      "npm run 做的事情比你想的简单",
      "npm test 和 npm run test：为什么有的能省掉 run",
      "实测：react-notes-app 跑不了 npm test",
      "script 报错了，先看哪一层"
    ],
    "conceptLedes": [
      "它就是在 node_modules/.bin 加进 PATH 之后，执行你写的那行字符串。",
      "这不是你的错，是这个项目的 scripts 里真的没有 test。"
    ],
    "exerciseTitles": [
      "怎么跑 react-notes-app 的测试",
      "script 报错了，按什么顺序排查"
    ],
    "sourcePaths": [
      "react-notes-app/package.json",
      "graphql-federation-practice/node-subgraph/package.json"
    ],
    "recap": [
      "npm run <名字> = 把 node_modules/.bin 加进 PATH 后执行那行字符串。",
      "只有 test/start/stop/restart 能省掉 run，其他都要写 npm run。",
      "跑 npm run 不带名字，会列出这个项目所有可用命令。",
      "react-notes-app 没有 test script，要用 npx vitest run。",
      "报错先分层：npm 层 → 工具层 → 代码层。别一看红字就改业务代码。"
    ],
    "transfer": [
      "Missing script: \"test\" npx <工具> 或先跑 npm run 看清单",
      "command not found: vite 先 npm install，再确认目录",
      "npm build 报 Unknown command 只有 test/start/stop/restart 能省 run，其余都要写 npm run <名字>",
      "build 失败但 dev 正常 大概是类型检查（tsc）那一步，不是打包"
    ]
  },
  {
    "examId": "foundations",
    "lessonId": "project-layout",
    "objectives": [
      "看懂两个 assessment 的完整目录结构",
      "分清「入口文件」「配置文件」「源码」「测试」各在哪",
      "知道 index.html → main.tsx → App.tsx → 组件 这条前端启动链",
      "认出项目里的干扰项"
    ],
    "whyForAssessment": "两个考试都明确标了「EDIT THIS」和「PROVIDED」。改错文件不加分；而找不到该改的文件会直接丢分。",
    "conceptHeadings": [
      "react-notes-app 的完整结构",
      "前端项目的启动链：谁调用谁",
      "Federation 项目：两个服务，两个语言",
      "认出干扰项"
    ],
    "conceptLedes": [
      "浏览器打开一个空 div，最后长出整个界面 —— 中间这几跳要看清。",
      "考试项目里经常有「看起来很重要但其实没用」的东西。"
    ],
    "exerciseTitles": [
      "Q1 的 state 应该放在哪个文件",
      "哪个是干扰项"
    ],
    "sourcePaths": [
      "react-notes-app/",
      "graphql-federation-practice/"
    ],
    "recap": [
      "react-notes-app 有两道独立的题：src/ 是 React 的 Q1,q2/ 是纯 TS 的 Q2。",
      "前端启动链：index.html → main.tsx → App.tsx → NoteManager → 子组件。",
      "兄弟组件不能直接通话，所以共享数据必须放在共同父组件里。",
      "Federation 项目只有两个文件要改：orderResolvers.js 和 OrderController.java。",
      "orders.db、@shareable、getInventoryStatus、MetricsConfig 都是干扰项。"
    ],
    "transfer": [
      "两个兄弟组件要共享数据 把 state 提升到共同父组件",
      "不确定某文件要不要改 看 README 的 EDIT THIS / PROVIDED 标注",
      "看到一个可疑的资源文件 搜一下有没有代码引用它，没有就是干扰项"
    ]
  },
  {
    "examId": "foundations",
    "lessonId": "js-immutable-data",
    "objectives": [
      "熟练用展开语法新增、filter 删除、map 就地替换",
      "解释「不可变更新」是什么意思，以及为什么 React 需要它",
      "会用解构从对象里取值、给组件 props 取值",
      "看到一段列表操作，能判断它改的是原数组还是新数组"
    ],
    "whyForAssessment": "Q1 的三道题，本质就是这三个操作各一次：Add 用展开、Delete 用 filter、Edit 用 map。GraphQL 那边的 createOrder 也要用 map 给每个 item 补价格。学会这一节，两门考试的数据操作部分就都通了。",
    "conceptHeadings": [
      "为什么不能直接改",
      "三件套：新增 / 删除 / 就地替换",
      "map / filter / find：三个都返回什么",
      "对象展开：改一个字段，其他原样",
      "解构：从对象里一次取好几个值"
    ],
    "conceptLedes": [
      "React 判断「要不要重新渲染」的方法，是比较「新旧是不是同一个东西」。",
      "Q1 的三道题就是这三行。"
    ],
    "exerciseTitles": [
      "补全 Q1 的三个数据操作",
      "Debug Lab · 数据加进去了，界面没反应"
    ],
    "sourcePaths": [
      "react-notes-app/src/components/NoteManager/index.tsx"
    ],
    "recap": [
      "React 靠「是不是同一个对象」判断变化，所以必须造新的、不改旧的。",
      "增用展开 [...prev, x]，删用 filter（!==），改用 map（三元）。",
      "map 长度不变、filter 可能变短、find 返回单个或 undefined。",
      "map 里用 async，外面一定要套 Promise.all。",
      "「数据对但界面不动」是改了原对象的典型症状，而且不会报错。"
    ],
    "transfer": [
      "「新增一条到列表」 [...prev, item]",
      "「删除某一条」 prev.filter(x => x.id !== id)",
      "「更新某一条，位置不变」 prev.map(x => x.id === id ? next : x)",
      "「给每一项补上一个字段」 map + 对象展开（异步就再套 Promise.all）",
      "数据变了但界面不动 查是不是 push / splice / 直接赋值改了原对象"
    ]
  },
  {
    "examId": "foundations",
    "lessonId": "js-async",
    "objectives": [
      "说清 Promise 的三种状态，以及 await 到底在等什么",
      "分清 Promise.all 和 Promise.allSettled 的行为差别",
      "知道「函数」和「函数的返回值」在异步里为什么必须分清",
      "会用 try/catch 包住 await"
    ],
    "whyForAssessment": "Q2 要你手写一个「allSettled + 并发上限」；Federation 的每个 resolver 都是 async 且要求 try/catch。这一节是两道题共同的地基。",
    "conceptHeadings": [
      "Promise：一张「以后会给你结果」的凭据",
      "最关键的一个区分：函数，还是函数的返回值",
      "Promise.all 和 Promise.allSettled：差别在「一个失败了怎么办」",
      "并发上限的实现思路：共享一个游标的 worker",
      "try/catch 包住 await"
    ],
    "conceptLedes": [
      "它有三种状态，而且只会变一次。",
      "Q2 整道题都建立在这个区分上。",
      "别想复杂了。就是「开 limit 个工人，一起从同一个待办队列里抢活」。"
    ],
    "exerciseTitles": [
      "该用 all 还是 allSettled",
      "为什么 tasks 是「函数数组」而不是「Promise 数组」",
      "补全 DataLoader 的批量函数"
    ],
    "sourcePaths": [
      "react-notes-app/q2/taskRunner.ts",
      "react-notes-app/q2/demo.ts"
    ],
    "recap": [
      "Promise 三态，只定一次；await 成功给值、失败抛异常。",
      "() => Promise<T> 是函数，Promise<T> 是已经在跑的事 —— 并发控制只能靠前者。",
      "all 一个失败就整体失败；allSettled 全等完再汇总。两者都保证顺序。",
      "并发上限 = 开 limit 个 worker 抢同一个游标，结果按下标写回自动保序。",
      "await 要用 try/catch 接；catch 之后循环继续，才叫「不抛错」。"
    ],
    "transfer": [
      "「不管有没有失败都要拿到全部结果」 Promise.allSettled 的语义",
      "「限制同时进行的数量」 传函数数组 + worker pool 共享游标",
      "「一批 id 换一批数据」 map + Promise.all，长度与顺序不变",
      "「proper error handling」出现在 TODO 里 try { await ... } catch"
    ]
  },
  {
    "examId": "foundations",
    "lessonId": "js-modules",
    "objectives": [
      "分清 default export 和 named export，以及各自怎么 import",
      "知道 ESM 里相对路径必须带扩展名",
      "看懂 import type 是干什么的",
      "认出「模块系统不匹配」这一类报错"
    ],
    "whyForAssessment": "两个项目都是 ESM。subgraph 的 import 少一个 .js 就跑不起来；React 项目里 import type 用错会让构建失败。这类错误的报错信息通常很不友好。",
    "conceptHeadings": [
      "default 和 named：一个模块只能有一个 default",
      "ESM 里相对路径必须带 .js —— 哪怕源文件是 .ts",
      "import type：只要类型，不要运行时代码",
      "为什么 subgraph 的 test script 那么长"
    ],
    "conceptLedes": [
      "这是 Node 原生 ESM 的硬规定，不是可选风格。"
    ],
    "exerciseTitles": [
      "Debug Lab · ERR_MODULE_NOT_FOUND"
    ],
    "sourcePaths": [],
    "recap": [
      "default 导出一个文件只能有一个，import 时名字随意、不加花括号。",
      "具名导出可以多个，import 时名字必须一致、要加花括号。",
      "原生 ESM 里相对路径必须带 .js；走 Vite 这类打包器时可以省。",
      "import type 只借类型，编译后整行消失。",
      "subgraph 那条长 test script 是为了让 jest 能跑 ESM，不需要改但要认得。"
    ],
    "transfer": [
      "ERR_MODULE_NOT_FOUND 相对路径漏了 .js 扩展名",
      "Cannot use import statement outside a module 缺 \"type\":\"module\" 或缺 --experimental-vm-modules",
      "jest 说 No tests found 对照 testMatch，看文件位置和命名",
      "只用到某个类型 写 import type，编译后整行消失"
    ]
  },
  {
    "examId": "foundations",
    "lessonId": "ts-types",
    "objectives": [
      "会给变量、函数参数、返回值标类型",
      "分清 type 和 interface 各自的场合（以及为什么这题里两个都用了）",
      "会写可选字段、联合类型、函数类型",
      "知道 strict: true 意味着什么"
    ],
    "whyForAssessment": "react-notes-app 是 strict 模式的 TypeScript 项目。props 类型写错、少写一个字段，构建就过不去。而两个考试的核心数据结构（Note、Order）都是从类型定义读起的。",
    "conceptHeadings": [
      "从这个项目最重要的 3 行代码开始",
      "type 和 interface：这个项目里两个都用了",
      "strict: true 意味着什么"
    ],
    "conceptLedes": [
      "整个 Q1 的数据结构就这么多。"
    ],
    "exerciseTitles": [
      "补全 NoteTable 的 props 类型"
    ],
    "sourcePaths": [
      "react-notes-app/src/types/Note.ts",
      "react-notes-app/src/components/NoteForm/index.tsx",
      "react-notes-app/tsconfig.json"
    ],
    "recap": [
      "读项目先读类型定义：Note 的 3 行决定了 Q1 全部的数据操作。",
      "type 和 interface 大多可互换；联合类型只能用 type。",
      "(note: Note) => void 是函数类型；Note | null 是联合类型。",
      "strict: true 打开后，null 必须显式处理、参数必须有类型。",
      "! 是非空断言，是你在替编译器担保，用错了运行时才炸。"
    ],
    "transfer": [
      "读一个陌生项目 先找 types/ 或 *.d.ts，类型比 README 准",
      "「要么是 X 要么没有」 X | null，用之前先 if 判断",
      "需要联合类型 只能用 type,interface 做不到",
      "Object is possibly 'null' 先判断，或者确实安全时用 !"
    ]
  },
  {
    "examId": "foundations",
    "lessonId": "ts-generics-and-errors",
    "objectives": [
      "看懂 useState<Note[]>([]) 和 Task<T> 里的尖括号",
      "会读 tsc 报错的四个部分：文件、位置、错误码、说明",
      "能分辨「我的代码错了」和「项目配置本身有问题」",
      "知道常见错误码 TS2304 / TS2582 / TS2345 各是什么意思"
    ],
    "whyForAssessment": "react-notes-app 的 npm run build 在原始状态下就是失败的 —— 10 个 tsc 错误，全部来自测试文件的类型配置缺失。能不能认出「这不是我的问题」，直接决定你会不会浪费半小时。",
    "conceptHeadings": [
      "尖括号：告诉泛型「这次装的是什么」",
      "tsc 报错的四个部分",
      "实测：这 10 个错误不是你写的代码的问题",
      "几个会真的遇到的错误码"
    ],
    "conceptLedes": [
      "泛型（generic）就是一个「留了洞的类型」，调用的人负责填。",
      "这是 react-notes-app 自带的配置缺陷。认出它，别去改业务代码。"
    ],
    "exerciseTitles": [
      "这是谁的问题",
      "补全泛型参数"
    ],
    "sourcePaths": [
      "react-notes-app/tsconfig.json",
      "react-notes-app/src/NoteManager.test.tsx"
    ],
    "recap": [
      "泛型是「留洞的类型」，尖括号是你在填洞。",
      "初始值看不出类型（空数组、null）时必须显式写泛型参数。",
      "tsc 报错四件套：文件、行列、错误码、说明。永远先看第一条。",
      "react-notes-app 的 npm run build 原生失败，10 个错全在测试文件，与你的实现无关。",
      "分辨「我的错」和「项目的错」：看报错位置、报的是谁的名字、测试跑不跑得过。"
    ],
    "transfer": [
      "useState 初始值是 [] 或 null 显式写泛型参数",
      "一堆 tsc 报错 只看第一条，后面可能是连锁",
      "报错全在测试文件、说全局名字找不到 缺测试框架类型，不是你的逻辑问题",
      "TS2345 参数类型不匹配 回去看类型定义，通常是 id 的 number/string 搞混"
    ]
  },
  {
    "examId": "react",
    "lessonId": "r-component",
    "objectives": [
      "说清「组件」在 React 里到底是什么",
      "看懂 JSX 里的标签、花括号、className",
      "知道组件名必须大写开头，以及为什么",
      "能画出这个项目的组件树"
    ],
    "whyForAssessment": "Q1 的四个组件是给好的骨架，你要在里面填逻辑。填之前必须先看懂「谁渲染谁、数据从哪来」，否则会把代码写在错误的组件里。",
    "conceptHeadings": [
      "一个组件 = 一个返回 JSX 的函数",
      "JSX 的几条硬规则",
      "这个项目的组件树",
      "React.FC 是什么"
    ],
    "conceptLedes": [
      "没有别的了。它不是类、不是模板、不是配置。",
      "四个组件，一条主干。记住这张图，Q1 的三道题就都有落点了。"
    ],
    "exerciseTitles": [
      "哪一行会把变量的值显示出来",
      "三道题的代码该写在哪个文件"
    ],
    "sourcePaths": [
      "react-notes-app/src/App.tsx",
      "react-notes-app/src/components/NoteItem/index.tsx"
    ],
    "recap": [
      "组件就是返回 JSX 的普通函数，名字必须大写开头。",
      "花括号是切回 JavaScript 的开关；class 要写 className。",
      "JSX 只能返回一个根元素，需要并列时用 <>…</>。",
      "这个项目的组件树：App → NoteManager →（NoteForm + NoteTable → NoteItem）。",
      "NoteManager 是唯一能同时影响表单和表格的地方，三道题都落在它里面。"
    ],
    "transfer": [
      "组件不显示但控制台干净 检查组件名是否大写开头",
      "变量名原样显示在页面上 漏了花括号",
      "不知道逻辑该写在哪个组件 找持有相关 state 的那个组件",
      "JSX expressions must have one parent 用 <>…</> 包住多个同级元素"
    ]
  },
  {
    "examId": "react",
    "lessonId": "r-props",
    "objectives": [
      "说清 props 是什么、方向是什么",
      "看懂「把函数当 props 传下去」这个模式",
      "分清 onClick={fn} 和 onClick={fn()} 的区别",
      "知道为什么子组件不能直接改父组件的数据"
    ],
    "whyForAssessment": "Q1 的三个任务全都是「子组件报告事件 → 父组件改 state」。props 传函数这个模式如果没想通，Delete 和 Edit 两题都会卡住。",
    "conceptHeadings": [
      "props 就是函数参数",
      "数据单向往下：NoteTable 只是个中转站",
      "事件往上报：把函数当 props 传下去",
      "onClick={fn} 和 onClick={fn()}：差一对括号，行为天差地别"
    ],
    "conceptLedes": [
      "组件是函数，props 是传给它的那个对象。",
      "这是 React 里子组件影响父组件的唯一正当方式。",
      "这是新手最高频的错误之一，而且症状很奇怪。"
    ],
    "exerciseTitles": [
      "补全 NoteItem 的两个按钮",
      "Debug Lab · 页面一打开，所有笔记就消失了"
    ],
    "sourcePaths": [
      "react-notes-app/src/components/NoteTable/index.tsx",
      "react-notes-app/src/components/NoteItem/index.tsx"
    ],
    "recap": [
      "props 就是传给组件函数的那个对象，只读，只能从上往下传。",
      "子组件通过调用父组件传下来的 onXxx 函数来上报事件。",
      "命名习惯：props 叫 onXxx，父组件里的实现叫 handleXxx。",
      "需要传参数就包一层箭头函数；onClick={fn()} 会在渲染时立刻执行。",
      "props 名字是契约，两边必须一致 —— 好在 TypeScript 会替你检查。"
    ],
    "transfer": [
      "子组件要影响父组件的数据 父组件传一个 onXxx 函数下去",
      "事件处理器要传参数 包一层箭头函数 () => fn(arg)",
      "Maximum update depth exceeded 先查有没有在渲染时调用了处理函数",
      "点了按钮毫无反应 查 onClick 里是不是写成了 fn() 而不是 fn"
    ]
  },
  {
    "examId": "react",
    "lessonId": "r-state",
    "objectives": [
      "说清 useState 返回的两个东西各是什么",
      "知道为什么必须用 setter 而不能直接赋值",
      "会用函数式更新 setX(prev => ...) 并说清它比 setX(newValue) 好在哪",
      "看懂一次点击是怎么最终变成新界面的"
    ],
    "whyForAssessment": "Q1 的判卷标准就是「点了按钮之后界面对不对」。state 用错，四个测试全挂。这是整门考试最核心的一节。",
    "conceptHeadings": [
      "普通变量为什么不行",
      "useState 返回一个数组，里面两样东西",
      "为什么用 setNotes(prev => ...) 而不是 setNotes([...notes, n])",
      "一次点击的完整旅程"
    ],
    "conceptLedes": [
      "组件函数每次渲染都会重新执行一遍。普通变量活不过这一遍。",
      "两种都能用。但前者在一种情况下明显更安全。",
      "把这条链走通，你就真的懂 React 了。"
    ],
    "exerciseTitles": [
      "把一次点击的顺序排对",
      "自己写出 NoteManager 的两个 state 和删除逻辑"
    ],
    "sourcePaths": [
      "react-notes-app/src/components/NoteManager/index.tsx"
    ],
    "recap": [
      "组件函数会被反复执行，所以普通变量存不住数据 —— 这是 useState 存在的原因。",
      "useState 返回 [当前值， setter]；初始值只在第一次渲染生效。",
      "setter 是唯一合法的修改途径，调用它等于「预约一次重新渲染」。",
      "setX(prev => ...) 比 setX(新值) 稳，项目里统一用前者。",
      "你只管改数据，DOM 由 React 对比后自动更新 —— 不要自己操作 DOM。"
    ],
    "transfer": [
      "「界面要跟着某个数据变」 把它做成 useState",
      "初始值是 [] 或 null 显式写泛型参数",
      "「基于当前值算出新值」 setX(prev => ...)",
      "setState 之后 console.log 是旧值 正常，新值在下次渲染才有"
    ]
  },
  {
    "examId": "react",
    "lessonId": "r-controlled-input",
    "objectives": [
      "说清「受控」到底控的是什么",
      "写出 value + onChange 的完整闭环",
      "知道只写 value 不写 onChange 会怎样",
      "看懂表单提交里 event.preventDefault() 的必要性"
    ],
    "whyForAssessment": "判卷测试用 userEvent.type() 往输入框里打字，然后断言表格内容。如果输入框不是受控的，打进去的字拿不到，Task 1 直接挂。",
    "conceptHeadings": [
      "「受控」的意思是：唯一真相在 state 里",
      "只写 value 不写 onChange 会怎样",
      "表单提交：preventDefault 不是可选项",
      "把整个 NoteForm 读一遍"
    ],
    "conceptLedes": [
      "输入框自己不做主，它只显示 state 告诉它的东西。",
      "输入框会变成只读的。这是个很容易踩的坑。",
      "这是这道题最密集的一个文件。上面讲的四件事都在里面。"
    ],
    "exerciseTitles": [
      "补全受控输入的闭环",
      "Debug Lab · 点 Add 之后页面闪一下，笔记没了"
    ],
    "sourcePaths": [
      "react-notes-app/src/components/NoteForm/index.tsx"
    ],
    "recap": [
      "受控输入 = 显示由 state 决定（value），输入写回 state（onChange），形成闭环。",
      "e.target.value 才是内容；e.target 是元素，e 是事件。",
      "只写 value 不写 onChange，输入框会变成只读。",
      "form 提交必须 event.preventDefault()，否则页面刷新、state 归零。",
      "id: noteToEdit ? noteToEdit.id : Date.now() 一行同时服务新增和更新。"
    ],
    "transfer": [
      "「输入内容变化时同步更新页面」 受控输入：value + onChange + state",
      "「点了提交按钮页面就刷新」 event.preventDefault()",
      "输入框敲不进字 有 value 但漏了 onChange",
      "「表单要能被外部填充」 必须受控，非受控做不到"
    ]
  },
  {
    "examId": "react",
    "lessonId": "r-lists-keys",
    "objectives": [
      "会用 map 把数组渲染成一串组件",
      "说清 key 是给谁看的、React 用它做什么",
      "知道为什么 key={index} 在有删除的列表里是错的",
      "知道空列表要不要特殊处理"
    ],
    "whyForAssessment": "Q1 的表格是 map 出来的，key 用错在这道题里会造成「删了一行，剩下的行内容串位」这种诡异现象 —— 而测试可能抓不到。",
    "conceptHeadings": [
      "map 把「一串数据」变成「一串组件」",
      "key 是给 React 用来「认人」的",
      "为什么 key={index} 是个陷阱",
      "空列表需要特殊处理吗"
    ],
    "conceptLedes": [
      "它不是给你看的，也不会出现在 DOM 里。",
      "在「只往后加」的列表里它没问题。一旦有删除或插入，就会串位。"
    ],
    "exerciseTitles": [
      "这个列表该用什么当 key",
      "哪一段什么都不会渲染"
    ],
    "sourcePaths": [
      "react-notes-app/src/components/NoteTable/index.tsx"
    ],
    "recap": [
      "map 把数据数组变成 JSX 数组，React 会平铺渲染。",
      "key 是给 React 认人用的，要求「本串唯一 + 跟着数据走」。",
      "永远别用 index 当 key，更别用 Math.random()。",
      "空数组 map 出空数组，不需要特殊处理 —— 也不要因此改动 testid 元素的结构。",
      "箭头函数用花括号就必须 return，否则渲染空白且不报错。"
    ],
    "transfer": [
      "「把一个数组显示成列表」 map + key={稳定 id}",
      "Each child should have a unique key 补 key，用数据自带的 id",
      "删了一行，其他行状态串位 key 用了 index，换成 id",
      "列表空白但数据有值 查 map 回调是不是花括号忘了 return"
    ]
  },
  {
    "examId": "react",
    "lessonId": "r-useeffect",
    "objectives": [
      "说清 useEffect 什么时候跑",
      "看懂依赖数组的三种写法各代表什么",
      "解释 NoteForm 里那个 useEffect 为什么必须存在",
      "知道 useEffect 无限循环是怎么造成的"
    ],
    "whyForAssessment": "Task 3 要求「点 Edit → 内容回填进表单」。表单的 title/content 是 NoteForm 自己的 state，而触发源 noteToEdit 是外面传进来的 prop —— 把外部变化同步进内部 state，这正是 useEffect 的活。",
    "conceptHeadings": [
      "useEffect 在「渲染完成之后」跑",
      "读懂项目里这个 useEffect",
      "依赖数组写错的三种后果"
    ],
    "conceptLedes": [
      "它不是渲染的一部分，是渲染的后续动作。",
      "9 行代码，把 Task 3 的一半工作做完了。"
    ],
    "exerciseTitles": [
      "补全编辑回填的 useEffect",
      "Debug Lab · 点 Edit 之后页面卡死"
    ],
    "sourcePaths": [
      "react-notes-app/src/components/NoteForm/index.tsx"
    ],
    "recap": [
      "useEffect 在渲染完成后跑，依赖数组决定它跑不跑。",
      "[] 只跑一次；[a] 在 a 变化时跑；不写则每次渲染都跑（通常是错的）。",
      "NoteForm 那个 effect 的职责是「把外部的 noteToEdit 同步进内部两个 state」。",
      "else 分支负责在退出编辑时清空表单，不能省。",
      "effect 里改的 state 不能放进它自己的依赖数组，否则死循环。"
    ],
    "transfer": [
      "「外部数据变了，内部状态要跟上」 useEffect(fn, [那个外部数据])",
      "「组件加载时做一次某事」 useEffect(fn, [])",
      "Maximum update depth exceeded 查依赖数组：是不是漏了，或含了自己改的 state",
      "「点了却没反应，但别的地方变了」 查依赖数组是不是写成了 []"
    ]
  },
  {
    "examId": "react",
    "lessonId": "r-derived-lifting",
    "objectives": [
      "判断一个值该做成 state 还是当场算出来",
      "说清「多余 state」会带来什么问题",
      "解释为什么 notes 必须住在 NoteManager 而不是 NoteTable",
      "看懂按钮文字 Add/Update 是怎么来的"
    ],
    "whyForAssessment": "第二个测试断言「输入为空时提交按钮 disabled」。它靠的是 isFormInvalid 这个派生值。把它做成 state 是新手常见的过度设计，还容易出现「和实际输入不同步」的 bug。",
    "conceptHeadings": [
      "能算出来的，就不要存",
      "按钮文字：同一个 prop 决定三件事",
      "状态提升：数据放在「需要它的组件的最近共同祖先」"
    ],
    "conceptLedes": [
      "state 越少，能出错的地方越少。"
    ],
    "exerciseTitles": [
      "哪个应该做成 state",
      "这个 state 该住哪",
      "写出派生数据与按钮文字"
    ],
    "sourcePaths": [
      "react-notes-app/src/components/NoteForm/index.tsx",
      "react-notes-app/src/components/NoteManager/index.tsx"
    ],
    "recap": [
      "能从现有 state / props 算出来的值，不要做成 state。",
      "多余 state 的代价是「状态不一致」，而且是最难查的一类 bug。",
      "isFormInvalid 是派生数据，每次渲染重算，永远和输入一致。",
      "state 放在「需要它的组件的最近共同祖先」，不要一律提到顶层。",
      "按钮文字 Add / Update 大小写必须一致 —— 测试会直接断言字符串。"
    ],
    "transfer": [
      "「显示筛选/排序后的列表」 一个 state 存条件 + 一个派生数组，别存结果",
      "「显示总数 / 是否为空 / 是否可提交」 派生数据，当场算",
      "两个兄弟组件都要用同一份数据 提升到最近共同祖先",
      "「同一个事实存了两份」 删掉一份，改成派生"
    ]
  },
  {
    "examId": "react",
    "lessonId": "r-read-q1",
    "objectives": [
      "用自己的话复述三个 Task 的验收标准",
      "知道「不得修改任何 data-testid」具体意味着什么不能动",
      "会跑测试，并且知道跑的是哪四条",
      "认出题目里没写但测试在查的那一条"
    ],
    "whyForAssessment": "这一节本身就是考点。考场上最贵的错误不是写错代码，是「没读清题就开始写」——比如把删除写成按 title 删、把更新写成删了再加。",
    "conceptHeadings": [
      "题目原文",
      "用初学者能看懂的话重写一遍",
      "「不得修改任何 data-testid」具体是什么意思",
      "先跑一遍测试，拿到基线",
      "三道题的落点：一个文件，三个函数"
    ],
    "conceptLedes": [
      "先看没有加工过的版本。",
      "题目里每个词都是要求。挑出来逐条对应。",
      "不只是「别改那串字符」，还包括「别让那个元素消失」。",
      "改代码之前先知道现在是什么状态 —— 这个习惯值几十分。",
      "先把要改的地方框出来，再动手。"
    ],
    "exerciseTitles": [
      "哪一处改动会让测试挂掉",
      "题目没写但测试在查的是哪一条",
      "把上手顺序排对"
    ],
    "sourcePaths": [
      "react-notes-app/README.md",
      "react-notes-app/src/NoteManager.test.tsx",
      "react-notes-app/src/components/NoteManager/index.tsx"
    ],
    "recap": [
      "三个 Task 的分水岭是「按 id」和「原位置」两个词。",
      "data-testid 不能改字符串，也不能让那个元素条件性消失。",
      "行内按钮文字 Delete / Edit / Update 是测试依赖的隐性契约。",
      "第 2 个测试查的 disabled 是 README 没写的要求 —— 测试也是题面。",
      "三道题全部落在 NoteManager 的三个 handler 上，其余三个组件不用改。"
    ],
    "transfer": [
      "题目里出现「按 X」 比较依据必须是 X，别用别的字段凑",
      "题目里出现「原位置」「顺序不变」 用 map 替换，不能删了再加",
      "看到 data-testid 字符串和元素存在性都不能动",
      "拿到新项目 先跑基线测试，再读题，再读类型"
    ]
  },
  {
    "examId": "react",
    "lessonId": "r-task1-add",
    "objectives": [
      "独立写出 handleSubmitNote 的新增分支",
      "说清 note 是在哪里被构造出来的、id 从哪来",
      "解释为什么这里必须造新数组",
      "知道对应的测试在断言什么"
    ],
    "whyForAssessment": "第 1 个测试直接查它。而且它确立了「子组件 onSubmit 上报 → 父组件改 notes」这条链 —— Task 3 的后半复用同一个函数。",
    "conceptHeadings": [
      "这一问在要求什么",
      "这一问真正考什么",
      "先看现有代码：note 是谁造的",
      "先想再写",
      "分步实现",
      "为什么这样就成立了",
      "对应的测试"
    ],
    "conceptLedes": [
      "NoteForm 已经把整条 note 造好了，包括 id。",
      "下面五个问题都能答上来，代码自然就出来了。"
    ],
    "exerciseTitles": [
      "补全新增逻辑",
      "不看答案，自己写出 Task 1"
    ],
    "sourcePaths": [
      "react-notes-app/src/components/NoteManager/index.tsx",
      "react-notes-app/src/components/NoteForm/index.tsx"
    ],
    "recap": [
      "note 由 NoteForm 构造（含 id 和 trim），NoteManager 只负责存。",
      "onSubmit 这个 prop 接的就是 handleSubmitNote —— 顺着 props 能找到调用链。",
      "setNotes(prev => [...prev, note]) 是标准写法：新数组、旧的全留、新的在末尾。",
      "不要在 handleSubmitNote 里重新生成 id，那会毁掉 Task 3。",
      "第 1 个测试只查文字出现，比题目要求宽松 —— 别因此偷懒。"
    ],
    "transfer": [
      "「新增一条到列表」 setX(prev => [...prev, item])",
      "「加在最前面」 setX(prev => [item, ...prev])",
      "子组件已经把数据造好了 父组件别再加工，直接存",
      "表单提交后要影响别处 onSubmit 上报到共同祖先"
    ]
  },
  {
    "examId": "react",
    "lessonId": "r-task2-delete",
    "objectives": [
      "独立写出 handleDelete",
      "解释为什么必须按 id 比较而不是 title 或下标",
      "说清 filter 的条件为什么是 !== 而不是 ===",
      "知道这个测试为什么测不出「按 id」这个要求"
    ],
    "whyForAssessment": "第 3 个测试查它。但那个测试只有一条数据，用 title 比较也能过 —— 这是本项目「测试过了不等于做对了」的第一个实例。",
    "conceptHeadings": [
      "这一问在要求什么",
      "先想再写",
      "实现",
      "测试的盲区：为什么它测不出「按 id」",
      "怎么自己验证「按 id」真的做对了"
    ],
    "conceptLedes": [
      "这是这个项目最值得记住的一课。"
    ],
    "exerciseTitles": [
      "补全删除逻辑",
      "不看答案，自己写出 Task 2",
      "Debug Lab · 删一条，同名的全没了"
    ],
    "sourcePaths": [
      "react-notes-app/src/components/NoteManager/index.tsx",
      "react-notes-app/src/components/NoteItem/index.tsx"
    ],
    "recap": [
      "handleDelete 就一行：setNotes(prev => prev.filter(n => n.id !== id))。",
      "filter 的语义是「留下」，所以删除要用不等号。",
      "必须按 id 比较：title 不唯一，下标会变，splice 还会改原数组。",
      "第 3 个测试只有一条数据，硬编码甚至清空列表都能过 —— 测试不是正确性证明。",
      "验证「按 id」的办法是手动加三条同名笔记，删中间那条。"
    ],
    "transfer": [
      "「删除某一条」 filter + 保留不匹配的（！==）",
      "题目强调「按 X」 比较依据只能是 X",
      "回调参数只给了 id 说明设计上就要求你按 id 操作",
      "测试过了但心里没底 手动造一个测试覆盖不到的场景（同名、多条、空列表）"
    ]
  },
  {
    "examId": "react",
    "lessonId": "r-task3-edit",
    "objectives": [
      "独立写出 handleEdit 和 handleSubmitNote 的编辑分支",
      "说清 noteToEdit 这一个 state 同时控制了哪四件事",
      "解释为什么必须复用旧 id，以及不复用会发生什么",
      "解释为什么必须用 map 而不能「先删再加」"
    ],
    "whyForAssessment": "第 4 个测试查它，而且是四个测试里最长的一条。它同时验证「按钮文字变 Update」和「新内容替换旧内容」。「原位置」这个要求测试查不到，但它是题面明写的。",
    "conceptHeadings": [
      "这一问在要求什么",
      "noteToEdit 这一个 state，同时干了四件事",
      "把整条链走一遍",
      "为什么必须复用旧 id",
      "为什么必须用 map，不能「先删再加」",
      "完整答案",
      "对应的测试，逐行读"
    ],
    "conceptLedes": [
      "这是这道题设计上最漂亮的地方。",
      "六步。每一步都点开看。",
      "这一行是整道题的枢纽。"
    ],
    "exerciseTitles": [
      "补全编辑逻辑的四个关键位置",
      "不看答案，自己写出完整的 Task 3",
      "Debug Lab · 点 Update 之后毫无反应"
    ],
    "sourcePaths": [
      "react-notes-app/src/components/NoteManager/index.tsx",
      "react-notes-app/src/components/NoteForm/index.tsx"
    ],
    "recap": [
      "noteToEdit 一个 state 控制四件事：回填、按钮文字、提交时的 id、提交走哪个分支。",
      "handleEdit 只 setNoteToEdit(note)，绝不碰 notes。",
      "编辑分支用 map + === 就地替换，长度和顺序都不变。",
      "必须复用旧 id，否则 map 匹配不上，更新静默失败。",
      "setNoteToEdit(null) 不能漏 —— 测试查不到，但题目明写了「退出编辑模式」。"
    ],
    "transfer": [
      "「更新某一条，位置不变」 map + 三元，用 === 匹配",
      "「进入编辑态 / 选中某一项」 一个 selected: T | null 的 state",
      "「点了更新但毫无反应」 查匹配用的 id 是不是被改过",
      "「更新完要恢复初始态」 把那个 T | null 的 state 设回 null",
      "一个函数服务两种模式 改动前把所有分支都想一遍"
    ]
  },
  {
    "examId": "react",
    "lessonId": "r-tests",
    "objectives": [
      "读懂 Testing Library 的三件套：render / screen / userEvent",
      "说清 getByTestId 和 getByRole 各在什么时候用",
      "知道为什么每个 userEvent 前面都有 await",
      "列出这四个测试的三个盲区，以及怎么自己补上"
    ],
    "whyForAssessment": "测试就是判卷器。看懂它 = 知道及格线在哪。而看懂它的盲区 = 知道题目要求里哪些是测试之外还得自己保证的。",
    "conceptHeadings": [
      "测试环境是怎么搭起来的",
      "Testing Library 三件套",
      "getByTestId 和 getByRole：为什么两种都用",
      "为什么每个 userEvent 都要 await",
      "三个盲区，以及怎么自己补"
    ],
    "conceptLedes": [
      "三个文件，各管一段。",
      "这一段是本节的重点。"
    ],
    "exerciseTitles": [
      "哪个实现能骗过全部四个测试但其实是错的",
      "这个测试失败是因为什么",
      "自己补一个测试，覆盖「按 id 删除」这个盲区"
    ],
    "sourcePaths": [
      "react-notes-app/src/NoteManager.test.tsx",
      "react-notes-app/vite.config.ts",
      "react-notes-app/vitest.setup.ts"
    ],
    "recap": [
      "vitest 配置内联在 vite.config.ts 里；jest-dom 的断言靠 vitest.setup.ts 引入。",
      "四个测试都 render 顶层 NoteManager，所以任何一环断掉都表现为同一个失败。",
      "testid 用于无文字的表单元素，role + name 用于行内按钮 —— 两者都是契约。",
      "userEvent 都要 await，否则断言跑在重新渲染之前。",
      "三个盲区：按 id 删、原位置更新、退出编辑模式。都得手动验证。"
    ],
    "transfer": [
      "测试说找不到元素/文字，但代码看着没错 先数 await",
      "getByRole 报「找到多个」 换 getAllByRole + 下标",
      "toBeDisabled is not a function 缺 jest-dom 的 setupFiles",
      "测试全过但心里没底 找测试的盲区，手动造场景补上"
    ]
  },
  {
    "examId": "react",
    "lessonId": "r-q2-read",
    "objectives": [
      "复述三条要求，并说清每条排除了哪种实现",
      "解释为什么参数是「函数数组」而不是「Promise 数组」",
      "看懂 SettledResult 这个可辨识联合类型",
      "知道怎么跑 demo.ts 以及怎么读它的输出"
    ],
    "whyForAssessment": "这道题没有断言测试，只有一个打印实时并发数的 demo.ts。也就是说：验收全靠你自己会不会读那段输出。读不懂输出，就不知道自己做对没有。",
    "conceptHeadings": [
      "题面原文",
      "三条要求逐条翻译",
      "为什么是函数数组：这是整道题的支点",
      "SettledResult：一个可辨识联合",
      "验证台 demo.ts 怎么读"
    ],
    "conceptLedes": [
      "注意它是英文的，而且每一条都很精确。",
      "如果传进来的是 Promise，这道题根本无解。",
      "这道题没有断言测试。会读输出，等于会判卷。"
    ],
    "exerciseTitles": [
      "如果参数改成 Promise 数组会怎样",
      "为什么不能直接用 Promise.allSettled"
    ],
    "sourcePaths": [
      "react-notes-app/q2/taskRunner.ts",
      "react-notes-app/q2/demo.ts"
    ],
    "recap": [
      "三条要求：函数数组、并发上限 limit、绝不抛错且保序。",
      "参数是 () => Promise<T> 而不是 Promise<T>，因为 Promise 一创建就没法暂停。",
      "Promise.allSettled(tasks.map(t => t())) 满足两条但违反并发上限 —— 难点全在节流。",
      "SettledResult 是可辨识联合，靠 status 字段收窄类型，必须用 type 不能用 interface。",
      "这道题没有断言测试，验收靠读 demo.ts 的三条输出特征。"
    ],
    "transfer": [
      "「限制同时进行的数量」 参数必须是工厂函数数组，不能是已启动的 Promise",
      "「不管失败都要拿到全部结果」 allSettled 的语义：try/catch 每一个，都记下来",
      "「结果顺序与输入一致」 按下标写回预分配的数组，别用 push",
      "看到 status: \"a\" | \"b\" 这种字段 可辨识联合，if 之后类型自动收窄"
    ]
  },
  {
    "examId": "react",
    "lessonId": "r-q2-implement",
    "objectives": [
      "独立实现 runTasks，并解释每一行为什么这么写",
      "说清「共享游标」为什么天然保证了并发上限",
      "说清「按下标写回」为什么天然保证了顺序",
      "会读 npm run q2 的输出并判断实现是否正确"
    ],
    "whyForAssessment": "这是 Q2 的完整答案。而且 worker pool 是一个可迁移的模式 —— 任何「限制并发」的题都是这个骨架。",
    "conceptHeadings": [
      "先排除一个直觉上的错解：分批",
      "worker pool 的四个零件",
      "游标不会被抢乱吗",
      "分步写出来",
      "完整答案",
      "验证：读懂这段输出"
    ],
    "conceptLedes": [
      "「6 个任务、上限 2，那就切成 3 批」—— 这个想法能跑，但不对。",
      "拆开看，一共只有四样东西。",
      "不会。JavaScript 是单线程的。",
      "这就是项目里的实现，已实测跑通。"
    ],
    "exerciseTitles": [
      "补全 worker pool 的五个关键位置",
      "从签名开始，自己写出整个 runTasks",
      "Debug Lab · 一行 START 都没打印"
    ],
    "sourcePaths": [
      "react-notes-app/q2/taskRunner.ts"
    ],
    "recap": [
      "worker pool 四个零件：预分配结果数组、共享游标、循环抢活的 worker、limit 个 worker + Promise.all。",
      "并发上限来自「worker 的个数」，顺序来自「按原始下标写回」—— 两件难事都不需要额外代码。",
      "JavaScript 单线程，游标那两行之间没有 await，所以不需要加锁。",
      "await tasks[i]() 的括号是关键；少了它任务根本不会被执行，而且不报错。",
      "catch 里只记录不中断，这才叫「NEVER throws」。"
    ],
    "transfer": [
      "「限制并发数」「连接池」「批量上传限速」 worker pool：共享游标 + limit 个 worker",
      "「结果顺序必须与输入一致」 预分配数组 + results[i] 写回，别用 push",
      "「失败也要继续」 try/catch 在循环体内，catch 里不 return",
      "结果里出现 [Function] 或 Promise {} 括号写少了或写多了",
      "任务被重复执行 游标是不是被声明在了 worker 内部"
    ]
  },
  {
    "examId": "react",
    "lessonId": "r-var-todo",
    "objectives": [
      "用 map + 对象展开就地翻转一条数据的布尔字段",
      "把「剩余几项」「是否全部完成」「筛选后的列表」都写成派生数据",
      "实现全选 / 取消全选和「清除已完成」",
      "说清筛选态下的删除为什么必须作用于原始数据"
    ],
    "whyForAssessment": "Todo List 是 React 面试与 assessment 出现频率最高的一道题。它考的东西和真实 Q1 完全重合（受控输入、三种不可变更新、派生数据），只是多了 toggle 和 filter 两个变式。做完这道题，Q1 那类题就不会再有陌生感。",
    "conceptHeadings": [
      "数据形状：只比 Note 多一个布尔字段",
      "翻转一条：map + 对象展开",
      "三个派生数据，一个 state 都不加",
      "两个批量操作",
      "完整答案",
      "怎么验证"
    ],
    "conceptLedes": [
      "先看类型，其余都是从它推出来的。",
      "这是三件套之外的第四个动作，但底层还是 map。",
      "7 个测试全过。",
      "这就是跑出 7/7 的那个测试文件，原样贴在这里。"
    ],
    "exerciseTitles": [
      "补全翻转与批量操作",
      "自己写出筛选与「清除已完成」"
    ],
    "sourcePaths": [],
    "recap": [
      "Todo 比 Note 只多一个布尔字段，于是多出「翻转」这个动作。",
      "翻转用 map + 对象展开；不可变要一路到底，不能只换外层数组。",
      "visible / remaining / allDone 三个都是派生数据，一个 state 都不加。",
      "全选是「统一目标值」，不是「各自翻转」，否则变成反选。",
      "筛选态下的写操作必须作用于完整数据，否则会丢掉被筛掉的项。"
    ],
    "transfer": [
      "「翻转某一项的开关」 map + { ...item, flag: !item.flag }",
      "「显示剩余 N 项」 派生数据，filter().length",
      "「全选 / 全不选」 先算统一目标值，再整体套上去",
      "有筛选又有增删改 读用 visible，写一律用完整数据"
    ]
  },
  {
    "examId": "react",
    "lessonId": "r-var-timer",
    "objectives": [
      "说清 useEffect 的清理函数什么时候跑、为什么必须有",
      "解释「过期闭包」为什么让 setSeconds(seconds + 1) 卡在 1",
      "独立实现 start / pause / reset 的计时器",
      "看懂「忘了清理」造成的两种后果：越跳越快、卸载后泄漏"
    ],
    "whyForAssessment": "源项目里没有任何定时器，所以前面的课没讲过清理函数 —— 但它是 useEffect 的另一半，同类考试（计时器、轮询、订阅、事件监听、WebSocket）几乎必考。这道题是这个知识点最短的载体。",
    "conceptHeadings": [
      "清理函数：effect 的另一半",
      "为什么必须用 setSeconds(s => s + 1)",
      "忘了清理会怎样：两种后果，都实测过",
      "完整答案",
      "怎么验证"
    ],
    "conceptLedes": [
      "useEffect 里 return 出去的那个函数，React 会在「下一次执行之前」和「卸载时」调用它。",
      "写成 setSeconds(seconds + 1) 会卡在 1 不动。这个坑叫「过期闭包」。",
      "我把 clearInterval 那行删掉真跑了一遍，8 个测试挂了 4 个。",
      "8 个测试全过，其中两条专门验证清理生效。",
      "定时器怎么测？把时间也 mock 掉。"
    ],
    "exerciseTitles": [
      "补全计时器的 effect",
      "自己写出整个计时器",
      "Debug Lab · 计时器越跑越快"
    ],
    "sourcePaths": [],
    "recap": [
      "清理函数在「依赖变化前」和「卸载时」执行 —— 它负责拆掉这次 effect 建立的东西。",
      "effect 里出现定时器/监听器/订阅/连接/请求，就一定要 return。",
      "定时器回调必须用函数式更新，否则闭包里的 state 永远是旧的。",
      "漏掉 clearInterval 的实测后果：start/pause 四次得到 10 秒而不是 4 秒，卸载后定时器还活着。",
      "reset 要同时停表和清零；定时器 id 不该放 state。"
    ],
    "transfer": [
      "effect 里出现 setInterval / setTimeout return () => clear…",
      "effect 里 addEventListener return () => removeEventListener（同一个函数引用）",
      "effect 里 subscribe / new WebSocket return () => unsubscribe / close",
      "定时器回调里要用到 state 函数式更新，别读闭包里的值",
      "「数值卡在第一次的结果不动」 过期闭包",
      "「越跑越快」「重复触发」 漏了清理函数"
    ]
  },
  {
    "examId": "react",
    "lessonId": "r-var-fetch",
    "objectives": [
      "写出 loading / error / data 三态的标准骨架",
      "知道 fetch 遇到 404 不会 reject，必须自己检查 res.ok",
      "解释竞态（race condition）怎么发生，并用清理函数解决",
      "分清 AbortController 和 ignore 标志各解决什么"
    ],
    "whyForAssessment": "原始需求里就写了「API request / loading state / error state」，但源项目里没有任何网络请求，所以前面没讲。这道题补上，而且直接给到「竞态」这一层 —— 只写三态谁都会，竞态才是区分度所在。",
    "conceptHeadings": [
      "三态骨架",
      "fetch 的第一个坑：404 不会 reject",
      "真正的考点：竞态",
      "AbortController 和 ignore 解决的不是同一件事",
      "完整答案",
      "怎么验证"
    ],
    "conceptLedes": [
      "loading / error / data。顺序和优先级都有讲究。",
      "这是所有 fetch 题的必考点。",
      "用户飞快切换 id，两个请求同时在飞，谁后回来谁说话 —— 而后回来的可能是旧的。",
      "两个都要，各管一头。",
      "6 个测试全过，包含竞态和 abort 两条。",
      "竞态这种「偶尔才出现」的 bug，怎么稳定地测出来？答案是自己控制谁先回来。"
    ],
    "exerciseTitles": [
      "补全取数 effect 的四个关键位置",
      "自己写出带竞态防护的取数 effect",
      "Debug Lab · URL 上是用户 2，界面显示用户 1"
    ],
    "sourcePaths": [],
    "recap": [
      "三态骨架：loading 初始为 true，渲染顺序 loading → error → 空 → 数据。",
      "fetch 只在网络层失败时 reject，404/500 必须自己检查 res.ok。",
      "竞态：慢的旧请求后回来会覆盖新数据。解法是每次 effect 一个 ignore 局部变量 + 清理函数置 true。",
      "AbortController 掐网络，ignore 挡 state 写入 —— 两个都要，AbortError 不算错误。",
      "effect 不能是 async；关 loading 放 finally；依赖数组里必须有 id。"
    ],
    "transfer": [
      "「按 id 取数并展示」 三态 + effect 依赖 [id]",
      "用了 fetch 必须检查 res.ok，404 不会 reject",
      "「切换很快时数据错乱」 竞态，用 ignore 标志 + 清理函数",
      "「卸载后 setState 警告」 同一套 ignore 写法就解决了",
      "「网络面板疯狂刷屏」 effect 漏了依赖数组",
      "「出错后卡在 Loading」 setLoading(false) 要放 finally"
    ]
  },
  {
    "examId": "react",
    "lessonId": "r-var-comment-tree",
    "objectives": [
      "写出一个递归渲染自身的组件，并说清终止条件在哪",
      "递归统计树里的总条数",
      "实现「往任意深度的节点下加回复」的不可变更新",
      "解释为什么只重建路径上的节点、而不是深拷贝整棵树"
    ],
    "whyForAssessment": "评论嵌套、目录树、组织架构、文件夹 —— 树形数据是 assessment 里的常客，而且它同时考「递归组件」和「嵌套结构的不可变更新」两件事。后者是前面所有 CRUD 题的升级版：数组的不可变更新大家都会了，树的还得再想一层。",
    "conceptHeadings": [
      "数据形状：一个类型引用自己",
      "递归组件：终止条件不用写 if",
      "递归统计：一行 reduce",
      "真正的难点：给第四层加一条回复",
      "完整答案",
      "怎么验证"
    ],
    "conceptLedes": [
      "评论的评论，本质上就是一个字段指回自己的类型。",
      "很多人卡在「递归怎么停」，其实 map 已经帮你停了。",
      "数组的不可变更新大家都会了。树的还要再想一层。",
      "7 个测试全过，含「深层回复落在正确位置」和「原树未被修改」。",
      "「有没有偷偷改原树」这件事，用深冻结一测就知道。"
    ],
    "exerciseTitles": [
      "补全递归统计与递归渲染",
      "写出树形数据的不可变更新",
      "Debug Lab · 回复加进去了，界面不动"
    ],
    "sourcePaths": [],
    "recap": [
      "「评论的评论」= 类型里有个字段指回自己；深度不存数据，渲染时用参数传。",
      "递归组件在自己的 JSX 里渲染自己；空 replies 让 map 什么都不产出，递归自然终止。",
      "递归统计的骨架是「自己 1 条 + 子树全部」，同一模式能算深度、查找、拍平。",
      "树的不可变更新：map 递归，命中就 { ...node, replies: [...replies, reply] }，未命中也要造新节点并递归子树。",
      "只重建从根到目标的路径，不要深拷贝整棵树 —— 否则 React.memo 全失效。"
    ],
    "transfer": [
      "「评论的评论」「目录树」「组织架构」 类型自引用 + 递归组件",
      "递归组件怎么停 空数组 map 什么都不产出，天然终止",
      "「统计/查找/拍平树」 reduce 递归：自己 + 子树",
      "「给树里某个节点加/改/删」 map 递归，只重建路径上的节点",
      "需要缩进或层级样式 depth 参数往下传，别存进数据",
      "没报错 + 日志对 + 界面不动 改了原对象（数组和树都一样）"
    ]
  },
  {
    "examId": "react",
    "lessonId": "r-var-theme-context",
    "objectives": [
      "说清什么时候该上 Context、什么时候不该",
      "写出 createContext + Provider + useContext 这一套，并包成自定义 hook",
      "解释 context value 为什么必须 useMemo、toggleTheme 为什么要 useCallback",
      "看懂「忘了套 Provider」的真实报错，并知道怎么让它报得更清楚"
    ],
    "whyForAssessment": "主题切换是 Context 最常见的考法，同一套骨架换个壳就是「当前登录用户」「语言」「购物车」。源项目里一个 Context 都没有，所以前面没讲。这道题除了考 API 会不会写，更考两个细节：value 有没有记忆化、忘了 Provider 时错误信息够不够清楚 —— 这两点是区分「抄过教程」和「真写过」的地方。",
    "conceptHeadings": [
      "为什么要 Context：props 传不动了",
      "Context 只有三个动作，加一个自定义 hook",
      "toggleTheme：又是函数式更新",
      "最容易漏的一步：value 必须记忆化",
      "两个消费者",
      "完整答案",
      "怎么验证"
    ],
    "conceptLedes": [
      "Context 解决的是「跨很多层传同一个值」，不是「状态管理」。",
      "createContext 造管道、Provider 灌值、useContext 取值。第四步是自己包一层。",
      "和计时器那道题同一个道理，只是这次藏在 context 里。",
      "这行代码看着无害，会让整棵子树每次都重渲染。",
      "按钮和卡片都只做一件事：取值、用值。",
      "8 个测试全过。",
      "Context 怎么测？测的是「消费者看到了什么」，不是 context 本身。"
    ],
    "exerciseTitles": [
      "补全 ThemeContext 的四个关键位置",
      "自己写出 ThemeProvider 和 useTheme",
      "Debug Lab · Cannot destructure property 'theme'"
    ],
    "sourcePaths": [],
    "recap": [
      "Context 解决跨层传值，适合「整棵树都读、又不常变」的东西；它不是状态管理器。",
      "三个动作：createContext 造管道、Provider 灌值、useContext 取值；第四步自己包 hook 加守卫。",
      "默认值给 undefined + hook 里 throw，比给个假默认值好 —— 宁可炸也别静默地对。",
      "toggleTheme 用函数式更新 + useCallback([])；一次事件连调两次也能正确翻回来。",
      "value 必须 useMemo，否则所有消费者每次都重渲染，而功能测试全绿查不出来。",
      "按钮文字是「要切到哪」，不是「现在是哪」—— 这是读题分。"
    ],
    "transfer": [
      "「整棵树都要读同一个值」 Context：createContext + Provider + useContext",
      "「当前登录用户 / 语言 / 购物车」 和主题同一套骨架，换个类型",
      "写 Provider value 一律 useMemo，函数一律 useCallback",
      "Cannot destructure property … of undefined 消费者不在 Provider 子树里",
      "「一部分组件正常、一部分拿到 undefined」 Provider 范围不够大，往上提",
      "「切换毫无反应但也不报错」 createContext 给了假默认值，把它换成 undefined + 守卫",
      "值每秒都在变（鼠标位置、播放进度） 别放 Context，或拆成两个 Context"
    ]
  },
  {
    "examId": "react",
    "lessonId": "r-debug-lab",
    "objectives": [
      "看到报错能先判断类型，再决定去哪个文件找",
      "认出「不报错」的那几类 bug 的特征症状",
      "养成「改完必须跑一遍验证」的习惯",
      "把错误信息和根因建立稳定的对应关系"
    ],
    "whyForAssessment": "考场上大部分时间不是在写新代码，是在查为什么不对。会读报错的人和不会读的人，同样的知识水平能差出一倍速度。",
    "conceptHeadings": [
      "先分诊：这个报错属于哪一类",
      "「不报错」的四种 bug，记住它们的症状",
      "改完必须验证 —— 而且要验证到题面要求那一层"
    ],
    "conceptLedes": [
      "拿到报错的第一件事不是改代码，是归类。"
    ],
    "exerciseTitles": [
      "故障 1 · 路径大小写",
      "故障 2 · props 名字对不上",
      "故障 3 · 测试找不到元素",
      "故障 4 · 编辑后列表毫无变化（综合题）"
    ],
    "sourcePaths": [
      "react-notes-app/src/"
    ],
    "recap": [
      "先分诊后动手：模块路径 / 类型 / 渲染循环 / 状态更新 / 测试查询。",
      "「不报错」的 bug 靠症状识别，其中最常见的是「改了原对象」。",
      "Testing Library 失败时会打印整个 DOM —— 在里面搜你期望的 testid。",
      "编译期报错比运行时报错更精确，先修编译期的。",
      "验证要到题面那一层：测试过 ≠ 做对，还得手动跑三个场景。"
    ],
    "transfer": [
      "Failed to resolve import 路径拼写 / 大小写 / 文件是否存在",
      "TS2322 Property 'x' is missing props 名字两边对不上，改调用方",
      "Unable to find an element by [data-testid=…] 在报错打印的 DOM 里搜相似 testid",
      "没报错 + 日志对 + 屏幕不动 改了原对象：push / splice / arr[i]= / obj.x=",
      "Maximum update depth exceeded useEffect 依赖，或 onClick 写成了 fn()"
    ]
  },
  {
    "examId": "react",
    "lessonId": "r-rebuild",
    "objectives": [
      "在没有参考代码的情况下从空文件建出整个项目",
      "自己把 React 项目的构建与测试配置搭起来",
      "独立实现 Q1 三个任务和 Q2 调度器",
      "用测试和手动场景验证自己的实现"
    ],
    "whyForAssessment": "填空和跟写只能证明你「看懂了」。真正的考试是打开一个空编辑器。这一关就是模拟那个时刻 —— 而且它比真实考试更难，因为连脚手架都要你自己搭。",
    "conceptHeadings": [
      "为什么必须做这一关",
      "建议的做法"
    ],
    "conceptLedes": [
      "读代码用的是识别能力，写代码用的是生成能力。两者不是一回事。"
    ],
    "exerciseTitles": [
      "从零重建 Q1 · Notes Manager",
      "从零重建 Q2 · 并发任务调度器"
    ],
    "sourcePaths": [
      "react-notes-app/"
    ],
    "recap": [
      "识别能力和生成能力是两回事 —— 只有从空文件写过，才算真会。",
      "起手式：先让空架子跑起来（能看到 Hello），再写业务逻辑。",
      "有测试就先抄进来，它是你唯一客观的进度条。",
      "卡住 15 分钟再看提示，提示是四级递进的。",
      "最后一定要手动验证「按 id」「原位置」「退出编辑模式」这三条。"
    ],
    "transfer": [
      "拿到空目录 先让空架子能跑起来，再写业务",
      "有测试文件 先抄进来当判卷器，一个一个攻",
      "不知道 state 放哪 画组件树，找需要它的组件的共同祖先",
      "写完了 跑测试 + 手动跑测试覆盖不到的场景"
    ]
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-what-is",
    "objectives": [
      "说清 schema 在 GraphQL 里的地位",
      "读懂 type / field / 标量 / enum / input 各是什么",
      "分清 Query 和 Mutation",
      "知道「客户端决定返回形状」意味着什么"
    ],
    "whyForAssessment": "这份 schema 决定了你的 resolver 必须返回什么形状。审计发现有两处细节（双重非空、input 里没有 price）直接决定实现对错 —— 不读 schema 就写 resolver，必错。",
    "conceptHeadings": [
      "GraphQL 服务只有两半",
      "读真实的 schema.graphql",
      "type 和 field",
      "Query 和 Mutation：两个特殊的入口类型",
      "客户端决定返回形状",
      "一次查询的完整执行流程"
    ],
    "conceptLedes": [
      "一半是「有什么」，一半是「怎么拿到」。",
      "先整体看一遍，再逐块拆。",
      "这是 GraphQL 和 REST 最本质的区别。"
    ],
    "exerciseTitles": [
      "哪些字段是标量",
      "这个操作该放哪",
      "补全 schema 的关键声明"
    ],
    "sourcePaths": [
      "graphql-federation-practice/node-subgraph/src/schema.graphql"
    ],
    "recap": [
      "GraphQL = schema（有什么）+ resolver（怎么拿到），两半必须对得上。",
      "字段类型分标量 / 对象 / enum；ID 序列化成字符串，别当数字用。",
      "Query 是读入口（字段并行），Mutation 是写入口（字段串行）。",
      "input 只能当参数，不能有 resolver —— 而这个项目的 OrderItemInput 里没有 price。",
      "客户端决定返回形状，所以 resolver 是按需调用的，也因此产生 N+1 问题。"
    ],
    "transfer": [
      "拿到一个 GraphQL 项目 先读 schema，它是唯一的契约",
      "「这个字段能为空吗」 看有没有 !，这决定 resolver 能不能返回 null",
      "resolver 写了但返回 null 查名字和 schema 字段名是否一字不差",
      "看到 enum 返回值必须是列出来的那几个之一，大小写敏感"
    ]
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-resolver",
    "objectives": [
      "说清四个参数各是什么，什么时候用哪个",
      "解释 parent 是从哪来的",
      "从真实 index.js 里读出 context 的确切结构",
      "知道字段没有 resolver 时会发生什么"
    ],
    "whyForAssessment": "你要写的四个 TODO，全部是「从 context 里取数据源、用 parent 或 args 里的 id 去取数」。context 的键名写错（orderAPI vs orderDataSource）是这个项目里真实存在的埋雷之一。",
    "conceptHeadings": [
      "四个参数",
      "parent 是怎么来的",
      "context：读 index.js 拿到确切的键名",
      "correlationId：为什么每个 TODO 都提到它"
    ],
    "conceptLedes": [
      "上一层返回什么，下一层的 parent 就是什么。",
      "这一段是全门考试最该抄在纸上的东西。"
    ],
    "exerciseTitles": [
      "从 context 里取订单数据源，正确写法是",
      "这个 resolver 该用哪个参数",
      "把 resolver 的调用顺序排对"
    ],
    "sourcePaths": [
      "graphql-federation-practice/node-subgraph/src/index.js",
      "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js"
    ],
    "recap": [
      "四个参数：parent（上一层返回值）、args（查询参数）、context（请求级袋子）、info（这个项目没用）。",
      "顶层 Query/Mutation 的 parent 无意义，写成 _；字段 resolver 的 parent 至关重要。",
      "context 的确切键名：dataSources.{orderDataSource, inventoryDataSource, shippingDataSource}、loaders.{shippingInfoLoader, orderLoader}、correlationId。",
      "数据源上有同名属性的字段不用写 resolver；shippingInfo 没有，所以必须写。",
      "DataLoader 必须每请求新建，否则缓存跨请求泄漏。"
    ],
    "transfer": [
      "字段 resolver 需要「是哪一个」 用 parent",
      "查询传了参数 用 args，通常直接解构",
      "需要数据源 / loader / 请求级信息 用 context，键名以 index.js 为准",
      "数据源上已经有同名属性 不用写 resolver，默认 resolver 会取",
      "TODO 里提到 correlation id 日志和 error extensions 里都带上它"
    ]
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-nullable",
    "objectives": [
      "读懂 ! 和 [] 的四种组合各是什么意思",
      "解释为什么 [Order!]! 的 resolver 必须写 ?? []",
      "看出 OrderItemInput 少了 price 会导致什么",
      "知道非空字段返回 null 时错误会怎样向上冒泡"
    ],
    "whyForAssessment": "这一节讲的两处细节，是这门考试最典型的「不读 schema 就必错」的地方。审计时实测确认：createOrder 不补 price，测试直接失败。",
    "conceptHeadings": [
      "! 和 [] 的四种组合",
      "非空字段返回 null 会怎样：错误向上冒泡",
      "OrderItemInput 少了 price —— 这是个陷阱"
    ],
    "conceptLedes": [
      "默认可空，加 ! 才不可空。列表和元素各有自己的可空性。",
      "不是「那个字段变成 null」，是整块数据被丢掉。",
      "两个文件放在一起看，才能发现问题。"
    ],
    "exerciseTitles": [
      "这个 resolver 找不到数据时该返回什么",
      "createOrder 为什么必须查价格",
      "给四个 TODO 各自选对兜底策略"
    ],
    "sourcePaths": [
      "graphql-federation-practice/node-subgraph/src/schema.graphql",
      "graphql-federation-practice/node-subgraph/src/dataSources/orderDataSource.js"
    ],
    "recap": [
      "GraphQL 默认可空，加上 ! 才不可空；列表和元素各有自己的可空性。",
      "[Order!]! 的 resolver 必须 ?? [] —— 「没有」的正确表达是空数组。",
      "非空字段返回 null 会向上冒泡，可能让整个 data 变成 null。",
      "shippingInfo 可空，测试断言 toBeNull —— 所以要显式 ?? null，别让 undefined 漏出去。",
      "OrderItemInput 没有 price，而数据源要用它算总价 → resolver 必须先查 getProductPrice。"
    ],
    "transfer": [
      "字段类型是 [T!]! resolver 必须 ?? [] 兜底，绝不返回 null",
      "字段类型没有 ! 返回 null 是合法的，但要显式写 ?? null",
      "input 里少了某个字段但下游需要它 resolver 负责补齐，去对应数据源查",
      "整个 data 变成了 null 某个非空字段返回了 null，往上冒泡了"
    ]
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-why-federation",
    "objectives": [
      "说清单体 GraphQL 在大团队里的具体痛点",
      "用 Users / Products / Reviews 这个经典例子解释拆分",
      "说清 Federation 相比「客户端自己拼」好在哪",
      "认出本项目里那个不在仓库里的第三方 subgraph"
    ],
    "whyForAssessment": "书面题 1 直接问「User subgraph 高延迟时如何影响依赖它的 subgraph」。答这道题的前提是理解 Router 的查询计划是串行的。",
    "conceptHeadings": [
      "单体 GraphQL 的痛点",
      "经典例子：Users / Products / Reviews",
      "为什么不让客户端自己拼",
      "本项目里哪些东西不在仓库里"
    ],
    "conceptLedes": [
      "不是技术问题，是组织问题。",
      "这一点必须诚实说清楚，否则你会花时间找不存在的文件。"
    ],
    "exerciseTitles": [
      "Federation 主要解决的是什么问题",
      "哪些东西不在这个仓库里"
    ],
    "sourcePaths": [],
    "recap": [
      "Federation 首先解决的是 schema 所有权的组织问题，不是性能问题。",
      "每个 subgraph 独立部署、可用不同语言；Router 组合成一张 supergraph。",
      "本仓库只有 Orders subgraph；Accounts subgraph 和 Router 都不在。",
      "java-service 是纯 REST，不是 subgraph，也不被 subgraph 调用。",
      "本地验证 Federation 的两个办法：{ _service { sdl } } 和 _entities 查询。"
    ],
    "transfer": [
      "「多团队共享一个 API」 Federation：各自 subgraph + Router 组合",
      "「我这个服务要引用别人的类型」 声明一个只有 @key 字段的类型，标 @external",
      "找不到某个「应该存在」的文件 先确认它是不是本来就不在仓库里",
      "书面题问「某个 subgraph 慢了会怎样」 从「查询计划可能串行」入手"
    ]
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-subgraph",
    "objectives": [
      "读懂 index.js 的启动流程",
      "说清 buildSubgraphSchema 和普通 makeExecutableSchema 的区别",
      "知道 _service 和 _entities 这两个字段从哪来",
      "会用进程内方式验证 subgraph（不需要起服务器）"
    ],
    "whyForAssessment": "启动流程决定了 context 长什么样（你的 resolver 全靠它）。而 _service / _entities 是本地唯一能验证 federation 部分的手段。",
    "conceptHeadings": [
      "启动的五步",
      "buildSubgraphSchema 凭空加了两个字段",
      "本地验证：两种办法",
      "两个 ESM 细节"
    ],
    "conceptLedes": [
      "这是 subgraph 和普通 GraphQL 服务唯一的技术差别。",
      "审计时端口 4000 被占，所以我用了第二种 —— 它其实更好用。"
    ],
    "exerciseTitles": [
      "_entities 这个字段是谁加的",
      "本地怎么验证 federation 部分"
    ],
    "sourcePaths": [
      "graphql-federation-practice/node-subgraph/src/index.js",
      "graphql-federation-practice/node-subgraph/package.json"
    ],
    "recap": [
      "启动五步：读 schema → buildSubgraphSchema → 建 server → 监听 → 每请求造 context。",
      "buildSubgraphSchema 认识 federation directive，并自动加 _service 和 _entities 两个字段。",
      "formatError 原样返回错误，所以你放进 extensions 的东西客户端能看到。",
      "本地验证优选「进程内执行」：不占端口，能一次跑一串查询，包括 _entities。",
      "原生 ESM：import 带 .js，顶层 await 可用，jest 需要 --experimental-vm-modules。"
    ],
    "transfer": [
      "写 subgraph 用 buildSubgraphSchema，不是 makeExecutableSchema",
      "想在本地验 federation 但没有 Router 进程内执行 _service 和 _entities 查询",
      "context 里的键名不确定 读 index.js 的 context 函数",
      "ESM 项目里 import 报 MODULE_NOT_FOUND 补 .js 扩展名"
    ]
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-entity",
    "objectives": [
      "用一句话解释 @key 在声明什么",
      "说清 @external 标在什么场合",
      "读懂 __resolveReference 的输入和输出",
      "画出 Router 做实体解析的完整链路"
    ],
    "whyForAssessment": "User.orders 这个 TODO 就长在这套机制上。不理解 __resolveReference 的返回值会流向哪里，就不知道自己的 orders resolver 里 user.id 从何而来。",
    "conceptHeadings": [
      "entity：可以被多个服务共同描述的类型",
      "@external：这个字段不是我的",
      "__resolveReference：把「引用」变成「本地对象」",
      "完整链路：从客户端一句话到两个服务"
    ],
    "conceptLedes": [
      "不是所有类型都是 entity。判据是「别的服务需不需要引用它」。",
      "它是 entity 解析的入口，也是 User.orders 的上游。"
    ],
    "exerciseTitles": [
      "@key 在声明什么",
      "User.orders 里的 user 参数上有什么",
      "补全 entity 声明与引用解析"
    ],
    "sourcePaths": [
      "graphql-federation-practice/node-subgraph/src/schema.graphql",
      "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js"
    ],
    "recap": [
      "entity = 多个 subgraph 共同描述的类型；@key 声明「靠哪个字段跨服务认人」。",
      "@key 和数据库主键无关，可以复合、可以有多个。",
      "@external 表示「这个字段是别人的，我只借来做身份识别」。",
      "__resolveReference 把 representation 变成本地对象，它的返回值就是下游 parent。",
      "本项目的 __resolveReference 只返回 { id }，所以 User.orders 里只有 user.id 可用。"
    ],
    "transfer": [
      "看到 @key 先问「别的服务用哪个字段找到这个对象」",
      "「我要给别人的类型加字段」 声明 @key + 把借来的字段标 @external",
      "字段 resolver 拿不到某个属性 看 __resolveReference 返回了什么",
      "想验证 entity 解析 查 _entities，representation 要带 __typename"
    ]
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-dataloader",
    "objectives": [
      "解释 N+1 问题在 GraphQL 里为什么天然会发生",
      "说清 DataLoader 靠什么把 N 次合并成 1 次",
      "知道 batch 函数的两条硬约束（长度与顺序）",
      "解释为什么 loader 必须每请求新建"
    ],
    "whyForAssessment": "Order.shippingInfo 那个 TODO 原文就写着「using DataLoader to prevent N+1 queries」。绕过 loader 直接调数据源能过测试，但答不到考点。",
    "conceptHeadings": [
      "N+1 是怎么产生的",
      "DataLoader 靠什么合并",
      "batch 函数的两条硬约束",
      "为什么 loader 必须每请求新建",
      "顺带说：另一个 loader 里有个埋雷"
    ],
    "conceptLedes": [
      "不是谁写错了。是 GraphQL 的执行模型天然如此。",
      "靠 JavaScript 事件循环的一个特性：同一个 tick 里的调用可以攒起来。",
      "违反了会出现「A 拿到 B 的数据」这种最难查的 bug。",
      "现在你已经有能力看出来了。"
    ],
    "exerciseTitles": [
      "DataLoader 靠什么把 N 次合并成 1 次",
      "batch 函数里哪种写法是错的",
      "修好 createOrderLoader 并写出 shippingInfo",
      "Debug Lab · DataLoader 报 is not a function"
    ],
    "sourcePaths": [
      "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
      "graphql-federation-practice/node-subgraph/package.json"
    ],
    "recap": [
      "N+1 是 GraphQL 执行模型的天然产物：1 次列表查询 + N 次字段 resolver。",
      "DataLoader 攒同一个 tick 里的所有 load()，tick 结束时调一次 batch 函数。",
      "batch 函数的两条硬约束：返回长度等于 keys 长度、顺序一一对应，缺失填 null。",
      "loader 必须每请求新建 —— 否则数据不刷新，还可能跨用户泄漏。",
      "createOrderLoader 里的 getOrderById 是埋雷，真实方法名是 getOrder。"
    ],
    "transfer": [
      "「一个列表里每项都要查关联数据」 N+1 风险，上 DataLoader",
      "TODO 里出现「prevent N+1」 必须走 loader.load()，不能直接调数据源",
      "写 batch 函数 keys.map + Promise.all；长度和顺序必须对齐，缺失填 null",
      "「数据不刷新」或「看到了别人的数据」 查 loader 是不是建在了模块顶层",
      "xxx is not a function 去被调对象的定义里核对方法名"
    ]
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-read-task1",
    "objectives": [
      "复述四个 TODO 各自的要求",
      "抄出一张「数据源方法名 + context 键名」的对照表",
      "跑出基线测试并读懂那 6 个失败",
      "认出「4 个通过里有 3 个是假通过」这件事"
    ],
    "whyForAssessment": "这一节本身就是考点。README 有一句「The starter code also contains related TODOs and integration issues that may need attention」—— 那三处埋雷不会有人告诉你在哪，只能靠核对。",
    "conceptHeadings": [
      "题面原文",
      "四个 TODO：README 只列了三个，代码里有四个",
      "写代码前先抄这张表",
      "跑基线：6 failed / 4 passed",
      "4 个通过里有 3 个是假通过",
      "只改一个文件"
    ],
    "conceptLedes": [
      "这是第一个需要自己发现的地方。",
      "三个埋雷里有两个就是「名字对不上」。抄一遍表，两个都能避掉。",
      "改代码之前先知道起点。而且这个起点本身就在教你东西。",
      "这是这门考试最重要的一课。"
    ],
    "exerciseTitles": [
      "为什么基线里有 4 个测试是通过的",
      "埋雷 1 该在哪个文件修",
      "把 Task 1 的推进顺序排对"
    ],
    "sourcePaths": [
      "graphql-federation-practice/README.md",
      "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
      "graphql-federation-practice/node-subgraph/__tests__/resolvers.test.js"
    ],
    "recap": [
      "四个 TODO，README 只列了三个 —— Query.order 既没被提到也没有测试，但代码里要求实现。",
      "开始写之前抄两张表：context 的键名、三个数据源的方法名。",
      "基线是 6 failed / 4 passed，其中 3 个通过是「空实现恰好满足断言」的假通过。",
      "只改 orderResolvers.js；其余文件 PROVIDED，判卷时可能被换回原版。",
      "先修埋雷再写 TODO，否则埋雷的报错会干扰你判断自己的代码对不对。"
    ],
    "transfer": [
      "README 说有「integration issues」 逐个核对方法名、键名、签名",
      "看到 EDIT THIS / PROVIDED 标注 只改 EDIT THIS 的文件",
      "基线里有测试是绿的 判断是真通过还是「空实现恰好满足」",
      "代码里的 TODO 比 README 多 以代码为准，README 可能不全"
    ]
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-user-orders",
    "objectives": [
      "独立写出 User.orders",
      "解释 user.id 是从哪来的",
      "说清为什么必须 ?? [] 兜底",
      "写出符合 TODO 要求的错误处理和 correlation id 日志"
    ],
    "whyForAssessment": "这是 Federation 那部分唯一一个要你写的 entity 字段。它的正确性直接决定「Router 能不能把用户和订单缝起来」。两个测试查它。",
    "conceptHeadings": [
      "这一问在要求什么",
      "这一问真正考什么",
      "先想再写",
      "分步实现",
      "catch 里为什么要先判断 instanceof GraphQLError",
      "完整答案",
      "怎么验证"
    ],
    "conceptLedes": [
      "这是本门考试贯穿三处的一个模式，值得单独理解。",
      "审计时实测：这样写之后两个相关测试通过。"
    ],
    "exerciseTitles": [
      "补全 User.orders",
      "不看答案，自己写出 User.orders"
    ],
    "sourcePaths": [
      "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js"
    ],
    "recap": [
      "user.id 来自 __resolveReference 的返回值，parent 上只有这一个属性。",
      "方法名是 getOrdersByUserId —— 去数据源核对，别凭直觉。",
      "[Order!]! 决定必须 ?? [] 兜底，按 schema 契约写而不是按数据源当前行为。",
      "catch 第一行先放行已结构化的 GraphQLError，否则会把业务错误降级成系统错误。",
      "单元测试直接调 resolver；想验 federation 链路要用 _entities 查询。"
    ],
    "transfer": [
      "entity 上的字段 resolver 数据来自 parent 里 @key 声明的那个字段",
      "TODO 说 proper error handling try/catch + GraphQLError + extensions.code",
      "TODO 说 correlation ID tracing 日志和 error extensions 都带上它",
      "字段是 [T!]! ?? [] 兜底，按 schema 契约而非数据源行为",
      "catch 里要重新包装错误 先 if (error instanceof GraphQLError) throw error"
    ]
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-shipping-info",
    "objectives": [
      "独立写出 Order.shippingInfo",
      "解释为什么必须走 loader 而不是直接调数据源",
      "说清为什么这里要 ?? null 而不是 ?? []",
      "知道测试为什么抓不到「绕过 loader」这个错"
    ],
    "whyForAssessment": "TODO 原文点名了 DataLoader。这是全项目唯一明确指定实现手段的一处 —— 说明出题人就是要看你会不会用它。",
    "conceptHeadings": [
      "这一问在要求什么",
      "先想再写",
      "两种写法都能过测试，但只有一种答对了",
      "为什么必须显式 ?? null",
      "完整答案",
      "验证合并真的发生了"
    ],
    "conceptLedes": [
      "这是本项目最典型的「测试抓不到」的地方。",
      "第二个测试用的是 toBeNull()，不是 toBeUndefined()。"
    ],
    "exerciseTitles": [
      "补全 Order.shippingInfo",
      "为什么不能直接调数据源"
    ],
    "sourcePaths": [
      "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js"
    ],
    "recap": [
      "TODO 点名了 DataLoader —— 这是四个 TODO 里唯一指定实现手段的，考点就在这。",
      "走 loaders.shippingInfoLoader.load(parent.id)，不是 dataSources.shippingDataSource。",
      "两种写法都能过测试，因为测试一次只调一个 order —— 抓不到合并与否。",
      "可空字段要显式 ?? null，因为测试断言的是 toBeNull()，undefined 会挂。",
      "resolver 里别插多余的 await，会把 load() 推到不同 tick，合并失效。"
    ],
    "transfer": [
      "TODO 指定了实现手段 那个手段本身就是考点，别用别的方式绕过",
      "列表里每项都要查关联数据 loader.load(parent.id)",
      "可空字段 ?? null，别让 undefined 漏出去",
      "想确认 DataLoader 生效 数日志里 Batching 的行数和 N"
    ]
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-queries",
    "objectives": [
      "独立写出两个 Query resolver",
      "说清为什么一个用 loader、一个用数据源",
      "写出「找不到」时的结构化错误",
      "知道 Query.order 没有测试意味着什么"
    ],
    "whyForAssessment": "Query.orders 有两条测试。Query.order 一条测试都没有，但 TODO 明确要求实现 —— 这种「没测试但有要求」的地方最能区分认真读题的人。",
    "conceptHeadings": [
      "两个 TODO 的要求对比",
      "Query.order：用 loader + 找不到要抛错",
      "这里最能看出 instanceof 检查为什么必要",
      "Query.orders：用数据源 + 校验参数",
      "Query.order 没有测试意味着什么"
    ],
    "conceptLedes": [
      "同一个 try 块里既抛业务错误又要接系统错误 —— 不判断就必然出错。"
    ],
    "exerciseTitles": [
      "补全两个 Query resolver",
      "不看答案，自己写出两个 Query resolver"
    ],
    "sourcePaths": [
      "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js"
    ],
    "recap": [
      "Query.order 用 orderLoader（TODO 点名了），Query.orders 用数据源（signature 里没给 loaders）。",
      "Query.order 可空 → 找不到抛 ORDER_NOT_FOUND；Query.orders 双重非空 → 兜底 []。",
      "同一个 userId，在 User.orders 里来自 parent，在 Query.orders 里来自 args。",
      "catch 第一行的 instanceof 判断在 Query.order 里最关键 —— 同一个 try 里既抛业务错又接系统错。",
      "Query.order 没有测试但 TODO 明确要求 —— 实现它，这是拉开差距的地方。"
    ],
    "transfer": [
      "参数签名里没有解构某个东西 那是提示：这个字段不需要它",
      "starter 给了没用上的常量 找它对应的场景，那里大概有个 TODO",
      "同一个 try 里既抛业务错又要接系统错 catch 第一行 instanceof 判断",
      "字段可空 vs 非空列表 前者可以抛错/返 null，后者必须 ?? []",
      "某个 TODO 没有测试 照样实现 —— 人工 review 会看"
    ]
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-planted-bugs",
    "objectives": [
      "掌握一套「核对而非猜测」的排查流程",
      "独立找出并修复三处埋雷",
      "把 Mutation.createOrder 改到测试通过",
      "解释为什么这三个错误都「看起来很合理」"
    ],
    "whyForAssessment": "三处埋雷各挂一个测试。而且它们的错法很典型 —— 名字对不上、签名对不上、错误被吞掉。这三类问题在任何后端代码里都会遇到。",
    "conceptHeadings": [
      "排查方法：三张对照表",
      "埋雷 1 · getOrderById 不存在",
      "埋雷 2 · orderAPI 不存在，而且签名也错了",
      "埋雷 3 · catch 把 INVALID_INPUT 吞成了 SERVICE_ERROR",
      "Mutation.createOrder 的完整修复版",
      "为什么这三个错都「看起来很合理」"
    ],
    "conceptLedes": [
      "不要靠读代码「感觉哪里怪」。逐项核对。",
      "这一处其实是三个错叠在一起。",
      "这一处不报错，只是错误码不对。",
      "三处埋雷有两处在这个函数里。"
    ],
    "exerciseTitles": [
      "Debug Lab · Cannot read properties of undefined",
      "Debug Lab · 错误码不对（不报错的那种 bug）"
    ],
    "sourcePaths": [
      "graphql-federation-practice/node-subgraph/src/resolvers/orderResolvers.js",
      "graphql-federation-practice/node-subgraph/src/dataSources/orderDataSource.js"
    ],
    "recap": [
      "三处埋雷：getOrderById 不存在、orderAPI 不存在且签名错且缺 price、catch 吞掉 INVALID_INPUT。",
      "排查靠核对三张表，不靠「读一遍感觉哪里怪」—— 这三个错都看起来很合理。",
      "只改 EDIT THIS 的文件；给数据源加方法是错的修法。",
      "自己包装错误时保留 originalError，否则真实原因彻底丢失。",
      "catch 里统一包装错误时，第一行必须先放行已结构化的错误。"
    ],
    "transfer": [
      "README 说有「integration issues」 核对三张表：context 键名、方法名与签名、throw/catch 配对",
      "xxx is not a function 去被调对象的定义里核对方法名",
      "Cannot read properties of undefined 上一级路径写错了，逐段核对",
      "自己包装的错误掩盖了真实原因 往上翻原始 message；包装时保留 originalError",
      "catch 里统一包装错误 第一行先 if (error instanceof XxxError) throw error"
    ]
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-spring-basics",
    "objectives": [
      "认得 @RestController / @GetMapping / @PathVariable / @RequestBody 等注解",
      "说清构造器注入是什么、OrderService 是怎么进到控制器里的",
      "读懂 OrderService 提供了哪些方法、抛什么异常",
      "说清 GlobalExceptionHandler 和 CorrelationIdFilter 各自在做什么"
    ],
    "whyForAssessment": "业务逻辑全部 PROVIDED。你要写的只是「调用 + 选状态码 + 记日志」。所以读懂已给的部分，这道题就做完一半了。",
    "conceptHeadings": [
      "这道题会用到的注解，一张表说完",
      "OrderService 是怎么进到控制器里的",
      "OrderService 给了你什么",
      "GlobalExceptionHandler：为什么你不该 try/catch",
      "@Valid 与 DTO 上的约束",
      "CorrelationIdFilter：Java 版的 correlation id",
      "两个干扰项"
    ],
    "conceptLedes": [
      "Java 的注解就是「贴在代码上的标签」，框架读这些标签决定怎么处理。",
      "构造器注入 —— 一行代码就能理解。",
      "这张表就是你的工具箱。写代码前抄一遍。",
      "这是这道题最容易做反的一处设计。"
    ],
    "exerciseTitles": [
      "找不到订单时该怎么处理",
      "这三个参数注解各从哪取值"
    ],
    "sourcePaths": [
      "graphql-federation-practice/java-service/src/main/java/com/techflow/orders/service/OrderService.java",
      "graphql-federation-practice/java-service/src/main/java/com/techflow/orders/exception/GlobalExceptionHandler.java",
      "graphql-federation-practice/java-service/src/main/java/com/techflow/orders/config/CorrelationIdFilter.java",
      "graphql-federation-practice/java-service/src/main/java/com/techflow/orders/controller/OrderController.java"
    ],
    "recap": [
      "构造器注入已经写好，orderService 随时可用，不要 new。",
      "OrderService 的三个方法会抛 EntityNotFoundException —— 别 try/catch，交给全局处理器转 404。",
      "deleteOrder 返回 void，暗示端点该返回 204。",
      "@Valid 必须保留，格式校验靠它；MDC.get(\"correlationId\") 用来打结构化日志。",
      "orders.db 和 MetricsConfig 都是干扰项 —— pom.xml 里没有数据库依赖。"
    ],
    "transfer": [
      "项目里有 @RestControllerAdvice 控制器里不要 try/catch，让异常冒出去",
      "参数上有 @Valid 格式校验交给 Bean Validation，别自己写",
      "service 方法返回 void 端点大概该返回 204",
      "看到一个可疑的资源文件（.db 之类） 查 pom.xml 有没有对应依赖，没有就是干扰项",
      "需要 correlation id Java 用 MDC.get()，别自己一层层传参"
    ]
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-endpoints",
    "objectives": [
      "独立写出六个端点",
      "说清 200 / 201 / 204 / 400 / 404 各在什么时候用",
      "解释为什么 return null 能骗过三个测试",
      "写出 PATCH 端点里字符串转 enum 的安全处理"
    ],
    "whyForAssessment": "审计实测：baseline 状态下六个端点全部 return null，五个测试通过了三个。只有 201 和 204 那两条抓住了错。这是整门考试「测试通过 ≠ 做对了」最夸张的一个实例。",
    "conceptHeadings": [
      "题面与 starter",
      "实测：六个端点全返回 null，五个测试过了三个",
      "五个状态码，各自什么时候用",
      "GET /api/orders 的可选过滤",
      "PATCH 端点：字符串转 enum 是唯一需要动脑的地方",
      "六个端点的完整实现",
      "五个测试怎么读",
      "测试之外的自检清单"
    ],
    "conceptLedes": [
      "这是本项目最值得记住的一个事实。",
      "这个端点收 Map 而不是 DTO，所以没有 Bean Validation 保护。",
      "审计实测：这样写之后 5 个测试全过，BUILD SUCCESS。"
    ],
    "exerciseTitles": [
      "POST 创建成功该返回什么",
      "为什么 return null 能骗过三个测试",
      "补全三个关键端点的状态码与调用",
      "不看答案，自己写出全部六个端点",
      "Debug Lab · 查一个不存在的订单，返回了 200"
    ],
    "sourcePaths": [
      "graphql-federation-practice/java-service/src/main/java/com/techflow/orders/controller/OrderController.java",
      "graphql-federation-practice/java-service/src/test/java/com/techflow/orders/OrderControllerTest.java"
    ],
    "recap": [
      "六个端点全 return null 也能过 3/5 测试 —— Spring 里返回 null 会给出 200 + 空 body。",
      "201 Created 给 POST，204 No Content 给 DELETE，这是被测试抓住的两个点。",
      "EntityNotFoundException 交给 GlobalExceptionHandler，控制器里不要 catch。",
      "PATCH 收 Map 没有校验保护：null 和非法枚举值都要自己挡成 400，valueOf 大小写敏感。",
      "测试用 @MockBean 替换了 service，所以完全不验证业务逻辑 —— 必须手动 curl 自检。"
    ],
    "transfer": [
      "创建成功 201 Created",
      "service 方法返回 void 204 No Content + .build()",
      "项目里有全局异常处理器 别 try/catch，让异常冒出去",
      "要把某异常转成不同状态码 唯一该 try/catch 的场合，用 ResponseStatusException",
      "收 Map 而不是 DTO 的端点 没有 Bean Validation 保护，自己挡 null 和非法值",
      "签名里有个没用到的参数 那是提示：它要求你实现某个功能"
    ]
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-written",
    "objectives": [
      "解释联邦图里某个 subgraph 高延迟为什么会拖慢整体",
      "说出至少一种缓存策略，并说清它的失效策略和代价",
      "从一段 application.properties 里指出三个以上生产隐患",
      "掌握一个「风险 → 后果 → 修正 → 理由」的答题结构"
    ],
    "whyForAssessment": "这两道题占的分不小，而且完全没有测试。很多人在这里写两句话就交了 —— 而它恰恰是最容易通过「结构化表达」拿分的地方。",
    "conceptHeadings": [
      "先说答题结构",
      "第 1 题 · 题面与要点拆解",
      "第 1 题 · 一份可以照着写的答案",
      "第 2 题 · 题面与那段配置",
      "第 2 题 · 找问题的清单",
      "第 2 题 · 一份可以照着写的答案",
      "写这两道题时的几条实操建议"
    ],
    "conceptLedes": [
      "这两道题都能套同一个模板。",
      "这是 DrillLab 写的参考答案，不是官方标准答案。",
      "按这几个面扫一遍，三个问题很容易凑够，而且不会漏掉重要的。"
    ],
    "exerciseTitles": [
      "哪一行是最严重的安全问题",
      "为什么 User subgraph 慢会拖慢 Orders subgraph",
      "写出 actuator 那一条的修正配置"
    ],
    "sourcePaths": [
      "graphql-federation-practice/QUESTIONS.md",
      "graphql-federation-practice/java-service/src/main/resources/application.properties"
    ],
    "recap": [
      "答题结构：结论 → 机制 → 方案 → 代价与边界。最后一段最能区分水平。",
      "第 1 题的核心是「Router 的查询计划里 @key 那一步是前置依赖，所以串行」。",
      "缓存答案要包含四件事：缓存键、TTL、主动失效、一致性代价。",
      "第 2 题按六个面扫：暴露面 / 凭据 / 传输 / 资源韧性 / 可观测性 / 配置管理。",
      "actuator 全开是最严重的（/actuator/env 直接泄漏口令）；server.address=0.0.0.0 在容器里不是问题。"
    ],
    "transfer": [
      "「某个服务慢了会怎样」 先找串行依赖，再讲资源放大",
      "「给一种缓存策略」 缓存键 + TTL + 失效策略 + 一致性代价，四件套",
      "审查配置 六个面：暴露 / 凭据 / 传输 / 资源韧性 / 可观测 / 配置管理",
      "看到 include=* 白名单代替通配符，默认拒绝",
      "看到 0.0.0.0 就想报警 容器里这是必须的，别当成问题",
      "书面题要求 justification 每条都写理由，只给配置会丢分"
    ]
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-debug-lab",
    "objectives": [
      "看到 GraphQL 报错能先归类，再决定去哪个文件找",
      "认出「不报错但返回 null」这一类最难查的故障",
      "掌握 composition 失败的排查顺序",
      "把错误信息和根因建立稳定的对应关系"
    ],
    "whyForAssessment": "这门考试有一半时间花在「为什么测试还是红的」。GraphQL 的报错比 React 更隐蔽 —— 很多错误表现为「静默返回 null」而不是抛异常。",
    "conceptHeadings": [
      "先分诊：GraphQL 故障的六类",
      "「静默返回 null」的三种成因",
      "composition 失败怎么排",
      "一个脚本把该验的全验一遍"
    ],
    "conceptLedes": [
      "看到某个字段是 null 而你确信写了 resolver，按这三条查。",
      "本仓库没有 Router，但这类问题值得知道 —— 而且 _service 能测出一半。",
      "做完 Task 1 之后，跑这个比反复 npm test 有用。"
    ],
    "exerciseTitles": [
      "故障 1 · resolver 写了，字段还是 null",
      "故障 2 · Cannot return null for non-nullable field",
      "故障 3 · A 拿到了 B 的数据",
      "故障 4 · PATCH 传了小写状态，返回 500"
    ],
    "sourcePaths": [
      "graphql-federation-practice/node-subgraph/src/"
    ],
    "recap": [
      "GraphQL 故障六类：schema 校验 / 非空违约 / 跨模块契约 / 名字不匹配 / 错误语义 / composition。",
      "「名字不匹配」是 GraphQL 特有的静默故障 —— resolver 键名错了就等于不存在。",
      "排查静默 null 的第一步：在 resolver 第一行 log，看它有没有被调用。",
      "DataLoader 的 batch 函数永远不要 filter —— 长度和顺序都是硬契约。",
      "「服务能起来 + _service 查得出 SDL」已经排除了大部分 composition 问题。"
    ],
    "transfer": [
      "字段静默返回 null 在 resolver 第一行 log，确认它有没有被调用",
      "Cannot return null for non-nullable field ?? [] 兜底，别改 schema",
      "数据串了但不报错 查 DataLoader batch 函数有没有 filter 或改顺序",
      "xxx is not a function 核对方法名与 context 键名",
      "Unknown directive @link 的 import 列表里漏了它",
      "客户端输入问题返回 500 在最靠近的地方转成 400，别加 catch-all"
    ]
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-rebuild",
    "objectives": [
      "在没有参考代码的情况下从空目录搭出一个 federation subgraph",
      "独立实现四个 resolver 并自己发现三处埋雷",
      "独立实现六个 Spring 端点并选对状态码",
      "用测试 + verify 脚本 + curl 三种方式验证自己的实现"
    ],
    "whyForAssessment": "填空和跟写只证明你看懂了。真正的考试是打开一个空编辑器。这一关比真实考试更难 —— 连脚手架都要你自己搭。",
    "conceptHeadings": [
      "为什么必须做这一关",
      "建议的做法"
    ],
    "conceptLedes": [],
    "exerciseTitles": [
      "从零重建 Task 1 · Orders subgraph",
      "从零重建 Task 2 · Spring Boot 控制器"
    ],
    "sourcePaths": [
      "graphql-federation-practice/"
    ],
    "recap": [
      "起手式：先让空服务器能起来（能看到 ready 日志），再写业务逻辑。",
      "schema、数据源、测试是「题目」，抄进来等于搭好考场；resolver 和 index.js 是「答案」，自己写。",
      "写跨模块调用之前先抄方法名与签名表 —— 这能挡掉 starter 里那两处埋雷同类的错误。",
      "10 个测试全绿只是及格线，还要用 verify 脚本验 _service 和 _entities。",
      "Java 那半和 subgraph 无代码关联，可以完全独立做。"
    ],
    "transfer": [
      "拿到空目录 先让空服务能起来，再写业务",
      "有测试文件 先抄进来当判卷器，一条一条攻",
      "跨模块调用 先抄一张方法名 + 签名对照表",
      "写完了 测试 + verify 脚本 + curl，三层都过才算完"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-html",
    "objectives": [
      "说清块级和行内元素的三处实际差别",
      "画出事件从 window 到目标再回到 window 的完整路径",
      "说明语义化标签除了「好看」之外的两个真实收益",
      "举出无障碍（a11y）的具体做法，而不是空谈概念"
    ],
    "whyForAssessment": "HTML 题是筛人题：答不上来直接出局，答得好也拿不到加分。所以目标不是讲深，而是每道都能在 30 秒内说清楚，并且举得出一个例子。事件冒泡/捕获那道除外 —— 它常被追问到事件委托和 React 的合成事件，值得往深里准备。",
    "conceptHeadings": [
      "块级元素 vs 行内元素",
      "事件冒泡 vs 事件捕获",
      "meta 标签有什么用",
      "什么是语义化标签",
      "无障碍、可用性、包容性"
    ],
    "conceptLedes": [
      "#269 Block element vs Inline element",
      "#380 Event bubbling vs Event capturing",
      "#381 What is the importance of the meta tag?",
      "#382 What are Semantic Elements?",
      "#385 Could you explain accessibility, usability, and inclusion? Give some examples of each one in terms of web design."
    ],
    "exerciseTitles": [],
    "sourcePaths": [],
    "recap": [
      "块级 vs 行内看三处：换行、宽高、上下 margin；img/input 是替换元素所以能设宽高。",
      "事件三阶段：捕获（外→内）→ 目标 → 冒泡（内→外）；默认监听冒泡。",
      "stopPropagation 管传播，preventDefault 管默认行为，两回事。",
      "meta 里真正重要的是 charset（防乱码）和 viewport（移动端前提）。",
      "语义化的收益是读屏导航和搜索权重，不是「代码好看」。",
      "无障碍 ⊂ 包容性；答题一定要给具体例子和测试工具。"
    ],
    "transfer": [
      "问「为什么行内元素设不了高」 行内跟文字流走；替换元素例外",
      "问事件顺序 捕获从外到内 → 目标 → 冒泡从内到外",
      "混淆 stopPropagation / preventDefault 一个管传播，一个管默认行为",
      "问语义化的好处 读屏能导航 + 搜索引擎分得清正文，别答「好看」",
      "问无障碍 举具体例子：alt、label、键盘焦点、对比度"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-css",
    "objectives": [
      "说清标准盒模型和 border-box 的差别，并解释为什么大家都改成后者",
      "在「一维排列」和「二维布局」之间正确地选 Flex 或 Grid",
      "背出选择器优先级的计算规则",
      "说明预处理器解决了什么、以及今天它的哪些功能已经被原生 CSS 取代"
    ],
    "whyForAssessment": "CSS 题里只有两道有区分度：盒模型（考你有没有真的调过布局）和 Flex vs Grid（考你选型的判断）。其余几道是背诵题，但答错了很掉分。响应式那道常被追问到 rem / vw / 媒体查询断点怎么定。",
    "conceptHeadings": [
      "什么是盒模型",
      "margin vs padding",
      "Flexbox vs Grid",
      "CSS 选择器有哪些类型",
      "有几种方式引入 CSS",
      "什么是 SCSS",
      "CSS 预处理器的优缺点",
      "什么是响应式设计，怎么做"
    ],
    "conceptLedes": [
      "#271 What is the Box Model",
      "#272 Margin vs Padding",
      "#273 Flexbox vs Grid",
      "#383 What are the different types of CSS selectors?",
      "#270 How many ways to import CSS in your project",
      "#275 What is SCSS",
      "#384 What is a CSS preprocessor? What are the advantages and disadvantages, if any, to using them over plain CSS?",
      "#274 What is responsive web design and how to achieve this"
    ],
    "exerciseTitles": [],
    "sourcePaths": [],
    "recap": [
      "盒模型四层 content/padding/border/margin；border-box 让 width 包含 padding 和 border，margin 永远在外面。",
      "margin 会上下折叠、可以为负、点不到；padding 不折叠、不能为负、属于点击区。",
      "Flex 一维内容驱动，Grid 二维布局驱动；实战是 Grid 搭骨架 + Flex 排内容。",
      "优先级按 (id, class, 标签) 三位比大小，高位压倒低位；同分后写的赢。",
      "@import 会串行请求拖慢首屏，用 link 或构建工具合并。",
      "SCSS 的变量和嵌套已被原生 CSS 取代，mixin 和循环生成还有价值。",
      "响应式四件套：viewport meta、弹性单位、媒体查询、弹性布局；断点按内容定。"
    ],
    "transfer": [
      "「三列 33.3% 一加 padding 就换行」 box-sizing: border-box",
      "「间距怎么调都差一点」 margin 折叠，改用 padding 或 gap",
      "要同时对齐行和列 Grid；只排一行/一列用 Flex",
      "「固定侧栏 + 自适应主体」 flex: 0 0 240px 配 flex: 1",
      "样式覆盖不掉 先算 (id, class, 标签) 优先级，别直接上 !important",
      "问要不要用 SCSS 变量和嵌套原生已有，剩 mixin 和循环生成还值钱",
      "问断点怎么定 按内容定，不按设备型号定"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-js-types",
    "objectives": [
      "说清原始值和引用值在内存里的差别，并解释它怎么导致「改一个另一个也变」",
      "背出隐式转换的规则，并说明为什么 == 不该用",
      "分清 var / let / const 在作用域、提升、重复声明三个维度上的差别",
      "在 Set vs Array、Map vs Object 之间给出选型理由"
    ],
    "whyForAssessment": "类型和内存这一组是所有「诡异行为」的根源：为什么 [] == false 是 true、为什么函数里改了对象外面也变、为什么循环里的 var 拿到的都是最后一个值。答不清这些，后面闭包和异步的题也会答不稳。",
    "conceptHeadings": [
      "什么是 JavaScript 引擎",
      "什么是 REPL",
      "原始值 vs 引用值",
      "隐式转换 vs 显式转换",
      "== 和 === 的区别",
      "什么是短路求值",
      "var、let、const 的区别",
      "传值 vs 传引用",
      "Set vs Array",
      "Map vs Object"
    ],
    "conceptLedes": [
      "#276 What is the JavaScript engine",
      "#277 What is REPL",
      "#278 Primitive data types vs Reference data types",
      "#279 Type coercion vs Type conversion（题库里 #386 是同一题）",
      "#280 What is the difference between == and ===",
      "#281 What is short-circuit evaluation",
      "#282 What is the difference between var, let and const",
      "#284 Pass by Value vs Pass by Reference",
      "#286 Set vs Array",
      "#287 Map vs Object"
    ],
    "exerciseTitles": [],
    "sourcePaths": [],
    "recap": [
      "七种原始类型存值，其余存地址；typeof null 是 \"object\"（历史 bug），判数组用 Array.isArray。",
      "隐式转换记两条：+ 有字符串就拼接，其他转数字；六个假值 false/0/\"\"/null/undefined/NaN。",
      "一律用 ===，唯一例外是 x == null；NaN 和自己不相等，React 用 Object.is。",
      "&&、|| 返回操作数本身；要默认值用 ??，React 条件渲染写 length > 0 &&。",
      "var 函数作用域会提升成 undefined，let/const 块作用域有 TDZ；const 锁绑定不锁内容。",
      "JS 永远传值，对象传的是地址值 —— 所以改属性外面变、换指向外面不变。",
      "Set 查找 O(1) 但去不掉重复对象；Map 键可任意类型、保序、无原型污染，但不能直接 JSON。"
    ],
    "transfer": [
      "「改了对象外面也变」 引用值只复制地址；先浅拷贝或 structuredClone",
      "「界面不更新但 log 是对的」 React 比引用，必须造新对象",
      "看到 [] == false 这类怪题 + 看字符串、其他看数字、六个假值",
      "「count 是 0 却拿到了默认值」 把 || 换成 ??",
      "循环里 setTimeout 拿到最后一个值 var 只有一个绑定，换 let",
      "循环里反复 includes 换 Set.has，O(n²) 变 O(n)",
      "拿对象当字典且键来自用户输入 用 Map，避免原型污染"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-js-fn",
    "objectives": [
      "说清闭包是什么、为什么会「记住」外层变量，并举出两个真实用途",
      "画出一段代码的作用域链",
      "区分函数声明和函数表达式在提升上的差别",
      "说明纯函数的两个条件，并解释它为什么让代码好测"
    ],
    "whyForAssessment": "闭包是 JS 面试出现频率第一的题，而且它不是背概念就能过 —— 会让你解释循环里的 setTimeout、或者写一个计数器。hoisting 和作用域链是它的前置知识。纯函数那道会直接连到 React（为什么组件要写成纯的、为什么不能改 props）。",
    "conceptHeadings": [
      "有几种定义函数的方式",
      "什么是一等函数",
      "什么是一阶函数",
      "什么是高阶函数",
      "什么是纯函数",
      "\"use strict\" 是干什么的",
      "作用域有哪几种",
      "什么是变量提升",
      "什么是作用域链",
      "什么是闭包",
      "什么是柯里化",
      "什么是 IIFE"
    ],
    "conceptLedes": [
      "#285 How many ways to define a function",
      "#290 What is a first class function",
      "#291 What is a first order function",
      "#292 What is a higher order function",
      "#293 What is a pure function",
      "#294 What is \"use strict\"",
      "#295 What are the different type of scopes",
      "#296 What is hoisting",
      "#297 What is the scope chain?",
      "#298 What is a closure",
      "#299 What is currying",
      "#300 What is an IIFE"
    ],
    "exerciseTitles": [],
    "sourcePaths": [],
    "recap": [
      "函数声明整体提升，函数表达式只提升变量名；箭头函数没有自己的 this、arguments，不能 new。",
      "一等（函数能当值）→ 一阶（不碰函数）→ 高阶（收或返函数），这三题是一组。",
      "纯函数两条件：同输入同输出 + 无副作用；React 渲染函数和 Redux reducer 都必须纯。",
      "严格模式主要价值是禁隐式全局；ES 模块和 class 内部自动严格，不用手写。",
      "四种作用域：全局/函数/块/模块；块作用域只约束 let、const、class。",
      "let 也会提升，只是处于 TDZ 访问就抛错 —— 说「let 不提升」是错的。",
      "作用域链由内到外，且在定义时确定（词法作用域）；this 相反，是调用时确定。",
      "闭包 = 函数记住定义时的作用域；用途是私有状态、防抖、柯里化，以及 React Hooks 的全部基础。",
      "IIFE 当年是唯一的隔离手段，现在只剩「需要异步作用域」这一个真实场合。"
    ],
    "transfer": [
      "问「解释一下闭包」 函数记住定义时的作用域 + 举私有状态和防抖两个用途",
      "循环里的回调都拿到最后一个值 闭包共享同一个 var 绑定，换 let",
      "「React 里数值卡住不动」 过期闭包 —— 闭包捕获的是那次渲染的值",
      "要手写防抖/节流 返回函数 + 闭包存 timer + function 转发 this",
      "声明前调用报 TypeError 函数表达式，只提升了变量名",
      "声明前调用报 ReferenceError let/const/class 的 TDZ",
      "问纯函数有什么用 好测、可缓存、可并发；接到 React 渲染和 reducer",
      "对象方法里 this 是 undefined 别用箭头函数写方法"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-js-this",
    "objectives": [
      "按优先级说出 this 指向的四条判定规则",
      "分清 call、apply、bind 三者的差别并手写一个 bind",
      "说明 JS 的原型继承和 class 的关系"
    ],
    "whyForAssessment": "this 是「给你一段代码问输出什么」的常客，而且答错就说明基本功不牢。手写 bind、手写 new、手写继承是现场编码题的高频三件套。这一组也是理解 React 类组件为什么要 bind 的前提。",
    "conceptHeadings": [
      "什么是面向对象编程",
      "this 指向什么",
      "call、apply、bind 的区别"
    ],
    "conceptLedes": [
      "#302 What is Object-Oriented Programming (OOP)",
      "#303 What does 'this' refer to",
      "#304 What are the differences between call, apply & bind"
    ],
    "exerciseTitles": [],
    "sourcePaths": [],
    "recap": [
      "OOP 四特征：封装、继承、多态、抽象；JS 是原型继承，class 只是语法糖。",
      "this 四条规则按优先级：new > call/apply/bind > obj.fn() > 默认；箭头函数不参与。",
      "隐式丢失是最常见的坑，也是 React 类组件要 bind 的原因。",
      "Apply 收 Array、Call 用 Comma；bind 返回新函数、能预置参数、绑一次锁死但 new 能突破。"
    ],
    "transfer": [
      "「this 是 undefined」 隐式丢失 —— 点号没了；用 bind 或箭头包一层",
      "给你代码问 this 是什么 按 new > 显式 > 隐式 > 默认 四条走；箭头看外层",
      "要转发不定参数和 this fn.apply(this, args)",
      "问 class 和原型的关系 class 是语法糖，底下是原型链"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-js-loop",
    "objectives": [
      "说出宏任务和微任务的执行顺序，并推出一段代码的输出",
      "说清 async/await 只是 Promise 的语法糖以及它带来的实际差别",
      "在四种并发场景下选对 Promise.all / allSettled / race / any",
      "说明为什么 try/catch 抓不到异步错误"
    ],
    "whyForAssessment": "事件循环是最能分出层次的一道题：只会说「JS 是单线程、异步靠回调」是及格，能背出「同步 → 微任务 → 渲染 → 宏任务」并解释 await 之后的代码是微任务，才是好答案。Promise 的四个静态方法几乎必被追问。",
    "conceptHeadings": [
      "事件循环是怎么工作的",
      "async/await vs Promise",
      "什么是回调地狱",
      "Promise 链里的 finally() 有什么用",
      "错误处理怎么做",
      "怎么处理异步操作"
    ],
    "conceptLedes": [
      "#305 What does the event loop",
      "#306 Async/await vs Promise",
      "#307 What is callback hell",
      "#309 What is the purpose of the finally() method in a Promise chain",
      "#310 Error Handling",
      "#311 Handle asynchronous operations"
    ],
    "exerciseTitles": [],
    "sourcePaths": [],
    "recap": [
      "事件循环一轮：同步跑完 → 微任务一次全清 → 渲染 → 取一个宏任务；异步能力来自宿主环境不是引擎。",
      "async 函数体在第一个 await 前是同步的；await 之后等价于 .then，属微任务。",
      "async/await 是 Promise 语法糖，最大好处是错误处理和同步代码统一；最大坑是把并行写成串行。",
      "回调地狱真正的问题是错误处理要写 n 遍和无法组合，不只是缩进深。",
      "finally 拿不到值、原样透传、但里面抛错会覆盖结果；关 loading 就该放这儿。",
      "try/catch 抓不到回调里的异步错误；抛 Error 对象不抛字符串；最外层要有兜底。",
      "all 全成功、allSettled 全结束、race 第一个结束、any 第一个成功。"
    ],
    "transfer": [
      "给代码问输出顺序 同步 → 微任务全清 → 一个宏任务；Promise 先于 setTimeout",
      "两个 await 连着写 检查是否该改成 Promise.all 并行",
      "「出错后卡在 Loading」 setLoading(false) 放 finally",
      "try/catch 抓不到错误 错误在回调里，已经是下一轮事件循环",
      "批量操作要报告每一个 allSettled，不是 all",
      "要超时 race 是不等了，AbortController 才是真取消",
      "fetch 拿到 404 却当成功 自己检查 res.ok"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-js-tooling",
    "objectives": [
      "说清 DOM 是什么、以及为什么频繁操作 DOM 慢",
      "写出事件委托并说明它解决了哪两个问题",
      "分清 CommonJS 和 ES 模块在时机与语法上的差别",
      "说出 Webpack 的四个核心概念和构建流程"
    ],
    "whyForAssessment": "事件委托是唯一有区分度的一道 —— 它连着 React 的事件机制。模块和 Webpack 属于工程题，答得出「为什么需要打包」比背配置项更重要。fetch vs axios 是很实用的一道，我们那道 fetch 变式题的第一个坑就在这里。",
    "conceptHeadings": [
      "什么是 DOM，什么是 DOM 事件",
      "事件传播 vs 事件委托",
      "ES6 有哪些新特性",
      "什么是 ES6 模块",
      "什么是 npm",
      "Webpack 是怎么工作的",
      "fetch 和 axios 的区别"
    ],
    "conceptLedes": [
      "#288 What is the DOM and what is DOM event",
      "#289 Event propagation vs Event delegation",
      "#301 Name the new ES6 features",
      "#308 What are ES6 modules",
      "#312 What is npm",
      "#283 How does Webpack work",
      "#387 What is the difference between making server requests via fetch and axios?"
    ],
    "exerciseTitles": [],
    "sourcePaths": [],
    "recap": [
      "DOM 是浏览器提供的对象树 API，不属于 JS 语言；慢是因为重排重绘，不是读写属性本身。",
      "target 是被点的元素，currentTarget 是监听器挂在哪；事件委托全靠这个区别。",
      "委托解决监听器数量和动态元素两个问题；React 把事件委托到 root 并用合成事件。",
      "ESM 编译期确定依赖 → 能 tree shaking；CommonJS 运行时加载、导出是值拷贝。",
      "package-lock.json 必须提交；CI 用 npm ci 而不是 npm install。",
      "Webpack 四概念 entry/output/loader/plugin，loader 从右到左执行。",
      "fetch 不因 4xx reject，必须查 res.ok —— 这是从 axios 转过来最容易漏的一条。"
    ],
    "transfer": [
      "列表每一项都绑监听器 事件委托，挂父元素 + e.target.closest()",
      "「动态插入的元素没有行为」 委托，天然覆盖后来的元素",
      "问 React 事件机制 委托到 root + 合成事件；拦不住原生监听器",
      "问为什么要打包 模块化、转译、合并压缩、tree shaking",
      "问 Vite 为什么快 开发不打包用原生 ESM，依赖预构建用 esbuild",
      "CI 里装依赖 npm ci，严格按 lock",
      "从 axios 转到 fetch 记得补 res.ok 检查和超时"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-react-what",
    "objectives": [
      "说清虚拟 DOM 为什么快，以及它「不一定比手写 DOM 快」这层真相",
      "解释 diff 算法的三条启发式规则，并说明 key 为什么重要",
      "分清 SPA 的优点和它带来的三个新问题",
      "说明 JSX 编译成了什么"
    ],
    "whyForAssessment": "这一组考的是「心智模型」。虚拟 DOM 和 diff 答得空洞（只说「快」）会掉分，答得出「批量 + 最小化真实操作，代价是内存和一次 diff 计算」才算过关。key 那条会直接连到 Q1 里列表渲染的真实代码。",
    "conceptHeadings": [
      "什么是 SPA",
      "React 的优势是什么",
      "React vs Angular",
      "什么是 JSX",
      "虚拟 DOM 和 diff 算法",
      "什么是 reconciliation",
      "React 项目里 babel 和 webpack 干什么"
    ],
    "conceptLedes": [
      "#321 What is a SPA",
      "#320 React advantage",
      "#319 React vs Angular",
      "#326 What is JSX",
      "#330 Virtual DOM and diffing algorithm",
      "#353 What is reconciliation",
      "#337 What do we use babel and web pack for in React applications"
    ],
    "exerciseTitles": [],
    "sourcePaths": [],
    "recap": [
      "SPA 的代价是首屏慢、SEO 差、路由自己管、监听器不会自动清。",
      "React 三个卖点：声明式、组件化、单向数据流；缺点是选型成本和手动性能优化。",
      "JSX 编译成 createElement（17 后是 _jsx）；{} 里只能放表达式；默认转义所以防 XSS。",
      "虚拟 DOM 快在批量和最小化，但它是可维护性与性能的折中，不是性能银弹。",
      "diff 三规则：只比同层、类型不同整棵重建、同层用 key 认身份。",
      "reconciliation 是完整流程，Fiber 把它拆成可中断的 render 和不可中断的 commit。",
      "Babel 只转语法（新 API 靠 polyfill），Webpack 管打包；Babel 是 Webpack 流水线的一环。"
    ],
    "transfer": [
      "问虚拟 DOM 为什么快 批量 + 最小化；并主动说「不一定比手写快」",
      "问 key 同层认身份；index 会导致误更新和输入串行",
      "问 Fiber render 可中断、commit 不可中断",
      "问 SPA 缺点 首屏慢、SEO 差、路由自管、监听器要自己清",
      "「刷新页面 404」 服务端没配 history fallback"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-react-comp",
    "objectives": [
      "把类组件的生命周期一一映射到 useEffect 的写法",
      "说清 props 和 state 的三处差别，并解释为什么 props 不能改",
      "列出组件通信的五种方式并说明各自的适用场景",
      "分清受控和非受控，并说出各自的选择理由"
    ],
    "whyForAssessment": "这一组和 Q1 那道真题重合度最高：受控输入、状态提升、props 往下事件往上，都是那道题的直接考点。生命周期与 useEffect 的对应关系是从类组件时代过来的人必被问的一题。",
    "conceptHeadings": [
      "函数组件 vs 类组件",
      "React 的生命周期有哪些",
      "useEffect 和生命周期怎么对应",
      "props vs state",
      "组件之间怎么通信",
      "受控组件 vs 非受控组件",
      "什么是状态提升",
      "什么是 props drilling",
      "什么是 Pure Component",
      "什么是 Fragment",
      "什么是 HOC"
    ],
    "conceptLedes": [
      "#322 Functional components vs Class components",
      "#323 Explain the React component lifecycle and its methods",
      "#325 UseEffect vs Lifecycle Methods",
      "#327 props vs state",
      "#328 Communication between components",
      "#329 Controlled component vs uncontrolled component",
      "#345 What is Lifting State Up in React",
      "#331 What is props drilling",
      "#336 What are Pure Component",
      "#338 React Fragment",
      "#335 What is HOC"
    ],
    "exerciseTitles": [],
    "sourcePaths": [],
    "recap": [
      "函数组件胜出的真正原因：逻辑按关注点组织、复用不用套娃、没有 this 问题。",
      "三个 willXxx 生命周期被废弃，因为 Fiber 的 render 阶段可能重跑。",
      "useEffect 不是生命周期替代品，是「声明副作用依赖什么」；[] 版在绘制后执行，不完全等于 didMount。",
      "props 只读是因为渲染函数必须纯；能算出来的都别存。",
      "通信五种：props、回调、状态提升、Context、状态库；层数深不等于该上 Redux。",
      "默认用受控；file 输入只能非受控；初始值写 \"\" 别写 undefined。",
      "PureComponent / memo 是浅比较，必须配不可变更新与稳定引用才有意义。",
      "Fragment 解决 tr 和 flex 里多一层 div 的真实问题；要 key 得用完整写法。",
      "HOC 的三个毛病（wrapper 地狱、来源不明、命名冲突）都被自定义 hook 解决了。"
    ],
    "transfer": [
      "问生命周期怎么迁移 didMount→[]、didUpdate→[dep]、willUnmount→return",
      "「测量 DOM 后改样式闪一下」 换 useLayoutEffect",
      "兄弟组件要共享数据 状态提升到最近共同父级",
      "中间层被迫透传 props 先试 children 组合，超过三四层再上 Context",
      "「输入框打字没反应」 传了 value 没传 onChange",
      "「从非受控变成受控」警告 初始值别用 undefined，用 \"\"",
      "加了 memo 却没效果 props 里有新引用，配 useMemo/useCallback",
      "tr 或 flex 容器里要返回多个元素 Fragment；要 key 就用完整写法"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-react-hook",
    "objectives": [
      "说出 hooks 解决的三个类组件痛点",
      "分清 useMemo、useCallback、React.memo 各自缓存什么",
      "说出 hooks 的两条规则以及「为什么」不能写在条件里",
      "写出一个自定义 hook 并说明命名约定"
    ],
    "whyForAssessment": "「useMemo 和 useCallback 有什么区别」是出现频率最高的 React 题之一，而且大部分人答不全 —— 能补上「什么时候不该用」和「三个必须配套」才是好答案。hooks 规则那道会追问底层原因（链表 + 调用顺序），答得出来就上一个档。",
    "conceptHeadings": [
      "什么是 hooks，为什么要用",
      "useMemo vs useCallback",
      "React.memo vs useMemo",
      "自定义 hook 是干什么的，命名有什么约定"
    ],
    "conceptLedes": [
      "#324 What are hooks in React and Why do we use them",
      "#339 useMemo vs useCallback",
      "#346 React.memo vs useMemo",
      "#340 What are custom hooks for and what is the naming convention for them"
    ],
    "exerciseTitles": [],
    "sourcePaths": [],
    "recap": [
      "hooks 解决三件事：逻辑复用难、逻辑被生命周期切碎、this 易错。",
      "hooks 规则的底层原因是「按调用顺序存链表」，不是按名字。",
      "useMemo 缓存值、useCallback 缓存函数；useCallback 就是 useMemo(() => fn, deps)。",
      "React.memo 省一次渲染、useMemo 省一次计算；三个必须配套用才有意义。",
      "memo 拦不住 context 变化 —— 所以 context value 必须 useMemo。",
      "自定义 hook 必须 use 开头（ESLint 靠它识别）；复用逻辑不复用状态。"
    ],
    "transfer": [
      "hook 写在 if 里 React 按调用顺序存链表，会错位；条件放 effect 内部",
      "问 useMemo vs useCallback 一个缓存值一个缓存函数；后者是前者的语法糖",
      "加了 memo 没效果 三个必须配套；context 变化 memo 拦不住",
      "同一组 state+effect 出现两次 抽自定义 hook，use 开头",
      "以为自定义 hook 能共享状态 复用的是逻辑，状态各自独立"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-react-perf",
    "objectives": [
      "按「先测量再优化」的顺序列出 React 性能优化手段",
      "说清 React 18 的自动批处理和并发特性带来的实际差别",
      "解释 StrictMode 为什么故意渲染两次",
      "说明错误边界能抓什么、不能抓什么"
    ],
    "whyForAssessment": "性能优化那道是开放题，最能看出你有没有真调过 —— 先说「用 Profiler 找出问题」比直接列 API 高一个档。React 18 和 StrictMode 那两道会问到「为什么」，答得出并发和纯函数就说明理解了设计动机。",
    "conceptHeadings": [
      "怎么优化 React 性能",
      "React 里怎么写样式",
      "React 18 有哪些新变化",
      "React.lazy 是干什么的",
      "什么是 StrictMode",
      "什么是错误边界，有什么用",
      "React Router 的意义是什么",
      "写 React 时你会注意哪些最佳实践"
    ],
    "conceptLedes": [
      "#343 How could you improve performance in React",
      "#342 How to use styles in React",
      "#344 What are the new changes in react 18",
      "#347 What is React lazy function",
      "#332 What is React strict mode",
      "#333 What are error boundaries and How are they useful",
      "#334 React router, What is the point of it",
      "#348 When coding React, what are some best practices that you keep in mind"
    ],
    "exerciseTitles": [],
    "sourcePaths": [],
    "recap": [
      "性能优化先用 Profiler 测量；三类手段是少渲染、少下载、少算，长列表虚拟化收益最大。",
      "动态样式用 CSS 变量而不是行内 style —— 保留伪类和媒体查询。",
      "React 18 核心是并发渲染；最易感知的是自动批处理，用不上并发特性通常是没换 createRoot。",
      "React.lazy 要配 Suspense，还要配错误边界兜住 chunk 加载失败。",
      "StrictMode 只在开发生效，故意双渲染和双挂载来暴露不纯的渲染和缺失的清理函数。",
      "错误边界抓不到事件回调、异步代码、SSR 的错误；要按区块放而不是只放根节点。",
      "Router 用 Link 不用 a；BrowserRouter 需要服务端 history fallback。",
      "最佳实践六条：不可变更新、别存派生数据、state 放刚好够用的层、清理副作用、稳定 key、先测量再优化。"
    ],
    "transfer": [
      "问性能优化 先说用 Profiler 测量，再分「少渲染/少下载/少算」三类",
      "长列表卡 虚拟化，收益远大于 memo",
      "频繁变的 state 拖累整棵树 state 下移，别提到顶层",
      "要动态样式 行内只放 CSS 变量，规则留在 CSS 文件",
      "「setState 两次只渲染一次了」 React 18 自动批处理；要立即渲染用 flushSync",
      "「effect 跑了两次 / 日志打两遍」 StrictMode 故意的，检查清理函数写了没",
      "「一个小组件报错整页白屏」 按区块放错误边界",
      "「刷新子路由 404」 服务端配 history fallback，或用 HashRouter"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-react-redux",
    "objectives": [
      "说清 Redux 和 Context 解决的不是同一个问题",
      "画出 action → middleware → reducer → store → view 的完整流转",
      "背出三大原则并解释每一条为什么必要",
      "说明静态类型检查在什么阶段发现什么问题"
    ],
    "whyForAssessment": "只要简历上写了 Redux，这四道基本会连着问。「Redux vs Context」是最容易答错的一道 —— 说「Context 能替代 Redux」或者反过来都不对。TS 那两道是现在的标配题。",
    "conceptHeadings": [
      "Redux vs Context API",
      "Redux 的结构和工作流",
      "Redux 的三大原则",
      "解释一下 Redux 中间件",
      "JavaScript vs TypeScript",
      "什么是静态类型检查，有什么好处"
    ],
    "conceptLedes": [
      "#349 Redux vs Context API",
      "#350 Redux structure and workflow",
      "#352 Redux 3 main principles",
      "#354 explain Redux Middleware",
      "#355 Javascript vs TypeScript",
      "#356 What is static type checking and how can developers benefit from it"
    ],
    "exerciseTitles": [],
    "sourcePaths": [],
    "recap": [
      "Context 管传递，Redux 管状态管理；Context 缺精细订阅、中间件、DevTools 三样。",
      "Redux 单向环：dispatch → middleware → reducer → store → view；现在一律用 RTK 的 createSlice。",
      "三大原则串起来才是重点：单一数据源→可序列化，只读→可记录，纯 reducer→可重放。",
      "中间件签名 store => next => action，是专门给副作用留的位置；thunk 够用，saga 只在需要编排时值。",
      "TS 编译后运行时什么都不剩 —— 所以类型不能校验外部数据，as 只是「我保证」。",
      "静态检查最被低估的价值是重构有底气；但它只保证类型对不保证逻辑对，不能替代测试。"
    ],
    "transfer": [
      "问 Redux vs Context 一个是传递方案一个是状态管理；Context 缺精细订阅、中间件、DevTools",
      "「context 一变全都重渲染」 拆 Context，或换 selector 型状态库",
      "reducer 里想发请求 挪到中间件或 thunk，reducer 必须纯",
      "问三大原则 串起来讲：可序列化 → 可记录 → 可重放 = 时间旅行",
      "问服务端数据怎么管 TanStack Query / SWR，别用 Redux 硬凑缓存",
      "以为 TS 类型能校验接口数据 运行时没有 TS，要用 zod"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-node",
    "objectives": [
      "说出 Node 事件循环的几个阶段以及 nextTick 的特殊位置",
      "按顺序描述一个请求从进来到响应出去经过了什么",
      "在路径参数和查询参数之间做出正确设计选择",
      "把 CRUD 映射到 HTTP 方法和状态码"
    ],
    "whyForAssessment": "这四道直接对应 Federation 那门课里 Task 2 写的六个 Spring 端点 —— 那道题的评分点就是「方法对不对、状态码对不对、参数从哪来」。Node 事件循环那道会和浏览器的对比着问。",
    "conceptHeadings": [
      "Node.js 的事件循环是怎么工作的",
      "请求 - 响应周期是怎样的",
      "查询参数 vs 路径参数",
      "什么是 CRUD"
    ],
    "conceptLedes": [
      "#313 How does the event loop work in Node.js",
      "#314 Explain the request & response cycle",
      "#315 Query parameters vs Path parameters",
      "#316 What is CRUD"
    ],
    "exerciseTitles": [],
    "sourcePaths": [],
    "recap": [
      "Node 六个阶段：timers → pending → idle → poll → check → close；每阶段之间清微任务，nextTick 最优先。",
      "主模块里 setTimeout(0) 和 setImmediate 顺序不保证，I/O 回调里 setImmediate 一定更早。",
      "Express 请求流程：解析 → 通用中间件 → 认证 → 路由 → 业务 → 响应 → 404/错误兜底。",
      "中间件按注册顺序、必须 next()；一个请求只能响应一次；错误中间件必须四个参数。",
      "路径参数标识资源、查询参数描述怎么取；敏感数据永远不放 URL。",
      "CRUD 映射：POST 201、GET 200/404、PUT 整体替换、PATCH 局部、DELETE 204。",
      "GET/PUT/DELETE 幂等，POST 不幂等 —— 防重复下单要用幂等键。"
    ],
    "transfer": [
      "问 nextTick 和 Promise 谁先 nextTick 有独立队列，比所有 Promise 微任务优先",
      "「req.body 是 undefined」 漏了 express.json()",
      "请求一直转圈不返回 中间件忘了调 next()，或响应后没 return",
      "错误处理中间件不生效 必须四个参数 (err, req, res, next)",
      "设计接口纠结参数放哪 「去掉它还是同一个资源吗」",
      "创建资源返回什么码 201；删除用 204"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-sql",
    "objectives": [
      "在关系型和文档型之间给出选型理由，而不是背优缺点",
      "说清主键和外键各自保证什么",
      "解释外键约束在删除时的几种行为"
    ],
    "whyForAssessment": "这两道是全栈岗的入门筛选题。选型那道答「看数据形状和访问模式」比列表格好；主键外键那道会追问到索引和级联删除。",
    "conceptHeadings": [
      "关系型数据库 vs 非关系型数据库",
      "主键 vs 外键"
    ],
    "conceptLedes": [
      "#317 Relational database vs Non-relational database",
      "#318 Primary key vs Foreign key"
    ],
    "exerciseTitles": [],
    "sourcePaths": [],
    "recap": [
      "关系型强在关联和事务，文档型强在灵活和横向扩展；选型看数据形状和访问模式。",
      "Postgres 的 jsonb 让界限变模糊，「先上 Postgres 需要时用 jsonb」是常见现实选择。",
      "主键唯一非空自动建索引；外键可重复可为空，且 PostgreSQL 不会自动给它建索引。",
      "外键的价值是引用完整性；删除行为 RESTRICT / CASCADE / SET NULL 要按业务选。"
    ],
    "transfer": [
      "问数据库选型 看数据形状和访问模式，别背优缺点表",
      "JOIN 很慢 外键列可能没索引（PostgreSQL 不自动建）",
      "问删除时子记录怎么办 RESTRICT / CASCADE / SET NULL 三选一",
      "问自增 id 还是 UUID 提 ULID / UUIDv7 折中"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-web",
    "objectives": [
      "说清 CORS 是谁在拦、预检请求什么时候发、以及为什么前端改不了",
      "对比 JWT 和 session 在存储位置与失效能力上的根本差别",
      "分清测试金字塔的三层各测什么",
      "按类别说出常用状态码及其语义"
    ],
    "whyForAssessment": "CORS 那道几乎人人遇到过，但能说清「是浏览器在拦、不是服务器拒绝、所以前端改不了」的人不多 —— 这是最有区分度的一道。JWT vs session 会追问「怎么让 JWT 提前失效」，答不出说明只是背过概念。",
    "conceptHeadings": [
      "什么是 CORS，怎么解决 CORS 错误",
      "HTTPS vs HTTP",
      "什么是 JWT",
      "session vs cookie",
      "常见的 HTTP 状态码",
      "测试有哪几种"
    ],
    "conceptLedes": [
      "#360 What is CORS and how to solve the CORS error",
      "#358 HTTPS vs HTTP",
      "#359 What is JWT",
      "#361 sessions vs cookies",
      "#362 Give some HTTP response status codes",
      "#357 What are the different kinds of tests"
    ],
    "exerciseTitles": [],
    "sourcePaths": [],
    "recap": [
      "CORS 是浏览器在拦，请求可能已经执行了；前端无解，靠服务端加头或代理。",
      "application/json 会触发 OPTIONS 预检；带 cookie 时 Allow-Origin 必须写具体域名。",
      "HTTPS 给三样：加密、身份验证、完整性；非对称交换密钥、对称传数据。",
      "JWT 的 payload 只是 Base64 不是加密；最大缺点是没法主动失效，标准解法是短过期 + refresh token。",
      "cookie 是浏览器存储机制，session 是服务端状态方案，后者靠前者传 id；四个安全属性要会。",
      "401 没认证、403 没授权；201 创建、204 删除；GraphQL 一律 200 把错误放 errors。",
      "测试金字塔单元→集成→E2E；覆盖率不代表断言强 ——「空实现恰好通过」是实测过的。"
    ],
    "transfer": [
      "CORS 报错 浏览器在拦，前端改不了；服务端加头或走代理",
      "「配了 cors 还是不行」 带 cookie 时 Allow-Origin 不能是 *",
      "「POST 前多了一个 OPTIONS」 application/json 触发了预检",
      "问怎么让 JWT 提前失效 短过期 + refresh token；黑名单会变回有状态",
      "「刷新一下就掉登录」 多实例下 session 存内存了，改存 Redis",
      "分不清 401 和 403 401 没认证，403 认证了没授权",
      "问覆盖率要多少 别给数字；说覆盖率不代表断言强，举「空实现也能过」的例子"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-coding-map",
    "objectives": [
      "知道这 16 道题分别对应本站哪一节课",
      "识别出「换了个业务壳但考点相同」的题",
      "说清 7 道缺口题各自新增的是什么考点"
    ],
    "whyForAssessment": "coding 题的名字千变万化，考点其实很少。把 16 道题归成几类之后你会发现：能独立写出 Q1 的 CRUD、变式三的 fetch 三态、变式五的 Context，题库里一半的题就自动会了。这一节的用处是让你不要重复刷同类题。",
    "conceptHeadings": [
      "覆盖对照表",
      "16 道题其实只有五类考点"
    ],
    "conceptLedes": [
      "9 道已覆盖，7 道补进来。",
      "认出类别，就不用一道道刷。"
    ],
    "exerciseTitles": [
      "认出考点：这道题在考什么"
    ],
    "sourcePaths": [],
    "recap": [
      "16 道题里 9 道已被 Q1、Q2、五道变式题和两套模拟考覆盖，别重复刷。",
      "五类考点：受控输入+CRUD（七道）、异步三态、跨层共享、组件内交互状态机、useRef 命令式。",
      "最大的缺口是第四类「组件内部交互状态机」—— Dropdown / Tabs / 星级评分。",
      "Kanban 是 CRUD 的升级版：一次操作同时改两个数组，要写成一个纯函数。"
    ],
    "transfer": []
  },
  {
    "examId": "interview",
    "lessonId": "iv-coding-widgets",
    "objectives": [
      "用 useRef + document 监听实现「点外面关掉」，并正确清理",
      "说清 Tabs 为什么只需要一个 state",
      "把「hover 预览」和「已选值」叠成一个显示值",
      "实现同时支持受控和非受控的组件"
    ],
    "whyForAssessment": "这三道是 Easy / Medium 里出现频率最高的。它们代码量小，所以面试官会盯细节：点外面关不关、Escape 关不关、监听器解绑没有、ARIA 有没有、hover 移出后回不回到已选值。写得出来是及格，这些细节全中才是好。",
    "conceptHeadings": [
      "Dropdown：点外面要关掉",
      "Tabs：只需要一个 state",
      "星级评分：两个状态叠出一个显示值"
    ],
    "conceptLedes": [
      "这道题唯一的难点就是「怎么知道用户点的不是我」。",
      "很多人会给每个 tab 存一个 isActive，那是多余的。",
      "已选值 + hover 预览，显示的是「有 hover 就用 hover」。"
    ],
    "exerciseTitles": [
      "补全「点外面关掉」",
      "自己写出星级评分"
    ],
    "sourcePaths": [],
    "recap": [
      "点外面关掉三要素：useRef 拿节点、document 上 mousedown、contains 判断，外加清理。",
      "解绑必须用同一个函数引用，传新箭头函数解不掉且不报错。",
      "Tabs 只需要一个 activeId，其余全是派生；ARIA 三件套别漏。",
      "星级评分核心是 shown = hover ?? current；onMouseLeave 挂容器不挂每颗星。",
      "用 button 而不是 span，天然可聚焦可回车；受控判断用 !== undefined。"
    ],
    "transfer": [
      "「点外面要关掉」 useRef + document mousedown + contains + 清理",
      "解绑监听器没生效 绑和解必须是同一个函数引用",
      "「弹层要能按 Escape 关」 同一个 effect 里再加 keydown",
      "「哪一项被选中」 只存一个 id，其余派生",
      "hover 预览 + 已选值 shown = hover ?? current，别用 ||",
      "要同时支持受控和非受控 判断 prop !== undefined"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-coding-ref-hook",
    "objectives": [
      "分清 useRef 的两种用途：存不参与渲染的值 vs 拿 DOM 节点",
      "说明什么时候必须走命令式（ref）而不是声明式",
      "写出一个带惰性初始化和错误兜底的自定义 hook",
      "说清「复用逻辑不复用状态」"
    ],
    "whyForAssessment": "「用 useRef 做一个播放器」考的是你知不知道 React 里有命令式逃逸口 —— 播放、聚焦、滚动、测量这些事没法用 state 表达。自定义 hook 那道是 #340 的动手版，面试官会看你的命名、返回值形状、以及有没有处理异常。",
    "conceptHeadings": [
      "useRef 的两种用途",
      "播放器的三个细节",
      "写一个自定义 hook",
      "怎么验证"
    ],
    "conceptLedes": [
      "很多人只知道第一种。",
      "把 state + effect 打包，命名必须 use 开头。",
      "这就是跑出 24 / 24 的那个测试文件（六道题合在一起）。"
    ],
    "exerciseTitles": [
      "自己写出 useLocalStorage"
    ],
    "sourcePaths": [],
    "recap": [
      "useRef 两种用途：存不参与渲染的值、拿 DOM 节点调命令式 API；两者都不触发重渲染。",
      "播放/聚焦/滚动/测量是「动作」不是「状态」，这是 React 留 ref 口子的原因。",
      "媒体组件的模式是「事实在 DOM 里，state 只是镜像」，所以要监听 onEnded 之类的事件。",
      "jsdom 不实现媒体播放，测试要 spyOn(HTMLMediaElement.prototype, \"play\")。",
      "自定义 hook 四要点：惰性初始化、try/catch 兜底、依赖带 key、as const 返元组。",
      "复用逻辑不复用状态 —— 两个组件各调一次就是两份独立 state。"
    ],
    "transfer": [
      "要 focus / play / scroll / 测量尺寸 useRef 拿节点，走命令式",
      "要存定时器 id 或上一次的值 useRef 存值，不用 state",
      "「DOM 自己变了但界面没同步」 监听对应事件把 state 同步回来",
      "同一组 state+effect 写了两遍 抽 use 开头的自定义 hook",
      "初始值需要一次昂贵计算或 I/O useState(() => …) 惰性初始化",
      "自定义 hook 返回数组类型不对 加 as const"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-coding-rtk",
    "objectives": [
      "用 createSlice 写出一个完整的 slice，并说明 Immer 为什么不违反「state 只读」",
      "解释 prepare 的作用以及为什么 id 不能在 reducer 里生成",
      "用 selector 做到「只订阅自己要的那部分」",
      "脱离 React 单测 reducer"
    ],
    "whyForAssessment": "「用 Redux Toolkit 做一个 Todo」是 Medium 里的常见题。它真正在考三件事：知不知道现在不该手写 action types 了、知不知道 Immer 的草稿是怎么回事、知不知道 selector 的意义。同一个业务和变式一对照着看，能清楚看出 Redux 换来了什么、代价是什么。",
    "conceptHeadings": [
      "createSlice：一次生成 reducer 和 actions",
      "selector：这才是 Redux 比 Context 强的地方",
      "和变式一（useState 版）对比：换来了什么，代价是什么"
    ],
    "conceptLedes": [
      "手写 Redux 的那套样板已经过时了。",
      "三个 useSelector 各自订阅一小块。"
    ],
    "exerciseTitles": [
      "补全 createSlice"
    ],
    "sourcePaths": [],
    "recap": [
      "createSlice 一次生成 reducer、action creators 和 types，老写法的三份样板全省。",
      "Immer 给的是草稿代理，push 也能产出新对象 —— 但这个特权只在 createSlice/createReducer 里有。",
      "id 要在 prepare 里生成，reducer 必须纯，否则时间旅行失效。",
      "selector 让组件只订阅自己那部分 —— 这是 Redux 比 Context 强的具体地方。",
      "selector 不要返回新对象，否则每次 store 变都重渲染。",
      "这道题的规模用 useState 就够；能说出「什么时候才该上 Redux」比写完更重要。"
    ],
    "transfer": [
      "要写 Redux createSlice，别手写 action types",
      "reducer 里想用 nanoid / Date.now 挪到 prepare 或 action creator",
      "「加了 selector 还是每次都重渲染」 selector 返回了新对象",
      "问该不该上 Redux 看是否多组件读写 + 是否需要按 action 追溯",
      "要脱离 React 测状态逻辑 reducer 是纯函数，直接 reducer(state, action)"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-coding-kanban",
    "objectives": [
      "把「移动一张卡」写成一个纯函数，一次返回完整的新 board",
      "说清为什么不能写成「先删再加」两次 setState",
      "让没被碰到的列复用原数组引用",
      "处理「没动」和「找不到卡」两种边界"
    ],
    "whyForAssessment": "Kanban 是 Hard 档的常见题，但拖拽只是外壳 —— 面试官真正看的是你怎么组织这次「同时影响两处」的状态更新。写成纯函数的人和在组件里堆两次 setState 的人，一眼就能分出来。",
    "conceptHeadings": [
      "数据形状：用 Record 而不是数组套数组",
      "moveCard：这道题的全部难点"
    ],
    "conceptLedes": [
      "board 是「列 id → 卡片数组」的映射。",
      "函数体十行，四个关键决定。每一个都有理由。"
    ],
    "exerciseTitles": [
      "写出 moveCard"
    ],
    "sourcePaths": [],
    "recap": [
      "board 用 Record<ColumnId, Card[]>，配计算属性名一次改两个键；列的顺序单独放常量。",
      "moveCard 必须是纯函数：可以脱离 React 单测，而且不可能产生中间态。",
      "两个 early return 要返回原引用而不是 { ...board }，否则白渲染一次。",
      "{ ...board } 只浅拷贝顶层 —— 未被碰到的列自动复用原数组，和评论树「只重建路径」同理。",
      "别写成两次 setState「先删再加」：一旦中间插入校验或提前 return，卡片就会消失。"
    ],
    "transfer": [
      "一次操作要改两处状态 写成一个纯函数，一次返回完整新状态",
      "「状态没变但界面重渲染了」 early return 时返回原引用，别造 { ...x }",
      "映射结构要改其中两个键 { ...obj, [k1]: …, [k2]: … } 计算属性名",
      "想验证「真的没改原数据」 测试里 Object.freeze 深冻结",
      "Kanban / 分组列表 / 多选穿梭框 都是同一个「一次改两个数组」的模式"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-hand-timing",
    "objectives": [
      "一句话说清 debounce 和 throttle 的语义差别，并各举一个正确的使用场景",
      "手写 trailing debounce，带 cancel",
      "手写 leading + trailing 的 throttle",
      "说清为什么两者都必须用闭包存状态"
    ],
    "whyForAssessment": "美国面试 phone screen 的头号手写题。考的不只是写出来 —— 面试官会先问「这俩有什么区别、各用在哪」，答错场景直接扣分：搜索框用 throttle、滚动埋点用 debounce 都是反着的。",
    "conceptHeadings": [
      "debounce：把一串调用压成最后一次",
      "throttle：不管多密，每个窗口最多一次"
    ],
    "conceptLedes": [
      "Write a debounce; when do you reach for it",
      "Write a throttle with leading and trailing calls"
    ],
    "exerciseTitles": [
      "手写 debounce（带 cancel）",
      "手写 throttle（leading + trailing）"
    ],
    "sourcePaths": [],
    "recap": [
      "debounce = 等你停手：清旧 timer + 设新 timer 就是「重新计时」。",
      "throttle = 匀速放行：时间戳管 leading，timer + lastArgs 管 trailing。",
      "连续事件流里 debounce 可能永远不执行，throttle 保证节奏 —— 场景选错直接扣分。",
      "状态放闭包（造函数那一层），放进返回函数里就全废了。",
      "追问点：leading 选项、cancel vs flush、单变量简版的取舍。"
    ],
    "transfer": [
      "「停止输入后再搜索」「resize 结束后」 debounce —— 等你停手",
      "「滚动时持续上报」「拖拽跟随」 throttle —— 匀速放行",
      "手写题要在多次调用之间记住东西 闭包变量声明在「造函数的那一层」",
      "计时类测试在慢环境里抖 只断言「等待后已发生」，别断言「等待后还没发生」"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-hand-data",
    "objectives": [
      "手写 deepClone：分支覆盖 Date / Map / Set / 数组 / 对象，循环引用不爆栈",
      "说清 JSON.parse(JSON.stringify(x)) 为什么不算深拷贝的答案",
      "手写 flatten，depth 语义与 Array.prototype.flat 一致",
      "手写 curry，部分应用可复用、互不污染"
    ],
    "whyForAssessment": "deepClone 是「递归 + 分支 + 防循环」三合一的经典题，面试官用它一次看三个能力。flatten 考递归出口的干净程度。curry 考闭包攒参数 —— 写成共享数组就会在「复用部分应用」这一问上当场翻车。",
    "conceptHeadings": [
      "deepClone：先登记，再递归",
      "flatten：递归的出口就是 depth",
      "curry：攒参数必须造新数组"
    ],
    "conceptLedes": [
      "Write a deepClone that survives circular references",
      "Write a flatten with a depth parameter",
      "Write a curry; why must partial applications not share state"
    ],
    "exerciseTitles": [
      "手写 deepClone（防循环）",
      "手写 flatten（depth 语义对齐原生 flat）",
      "手写 curry（部分应用可复用）"
    ],
    "sourcePaths": [],
    "recap": [
      "deepClone 的灵魂：先登记再递归。分支顺序：原始值 → seen → Date → Map/Set → 数组 → 对象。",
      "JSON.parse(JSON.stringify(x)) 的五宗罪要背下来 —— 这是必问的追问。",
      "flatten 的出口就是 depth；默认 1、depth 0 浅拷贝，语义对齐原生。",
      "curry 攒参数必须拼新数组 —— push 版会污染部分应用，有测试专门抓。",
      "fn.length 数不到默认参数和 rest 参数 —— 说得出这句就答干净了。"
    ],
    "transfer": [
      "克隆 / 序列化类题目提到「循环引用」 WeakMap 登记「原对象 → 结果」，先登记再递归",
      "「和原生 API 行为一致」 先把原生的默认值和边界抄下来（flat 默认 1、depth 0 浅拷贝）",
      "闭包攒东西 + 要求可复用 造新数组 / 新对象，绝不 push 共享的"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-hand-async",
    "objectives": [
      "手写 Promise.all：按输入顺序收结果、首个失败立刻整体失败",
      "手写 Promise.allSettled，并说清它和 all 的语义差别",
      "手写 EventEmitter：on / off / once / emit，once 不挤掉邻居",
      "手写 LRUCache：利用 Map 的插入序，不手搓双向链表"
    ],
    "whyForAssessment": "Promise.all 是异步手写题的第一名，考点全在两个细节：结果顺序和短路失败。EventEmitter 考「遍历中修改列表」这个老陷阱。LRU 是数据结构题里最常见的一道 —— 知道 Map 按插入序遍历，就能把它从 40 行压到 15 行。",
    "conceptHeadings": [
      "Promise.all：下标写入 + 计数器",
      "EventEmitter：拷贝一份再遍历",
      "LRU：Map 的插入序就是现成的链表"
    ],
    "conceptLedes": [
      "Implement Promise.all and Promise.allSettled by hand",
      "Implement an EventEmitter with on, off, once and emit",
      "Implement an LRU cache without writing a linked list"
    ],
    "exerciseTitles": [
      "手写 Promise.all + allSettled",
      "手写 EventEmitter",
      "手写 LRUCache（用 Map，不写链表）"
    ],
    "sourcePaths": [],
    "recap": [
      "Promise.all 三件套：下标写入、空数组先判、reject 直接当 then 的第二参 —— 短路失败。",
      "allSettled = 每项包成「永远成功带 status」再交给 all；场景差别要用例子答。",
      "EventEmitter 唯一的坑：emit 拷贝列表再遍历，once 的自删才不会挤掉邻居。",
      "LRU 用 Map 的插入序：删掉再放回 = 刷新，迭代器第一个键 = 最旧。",
      "教科书版哈希表 + 双向链表是语言无关的答案 —— 两个版本都要会讲。"
    ],
    "transfer": [
      "「结果要和输入对得上」的并发题 下标写入 + 计数器，别 push",
      "回调 / 监听器列表在触发中会变 遍历前拷贝一份（[...list]）",
      "要 O(1) 的「最近使用」语义 JS 里先想 Map 的插入序，再讲教科书的哈希 + 链表",
      "「XX 和 XX 的语义差别」式追问 一败即停 vs 逐项报告 —— 用场景答，不用定义答"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-ts-utility",
    "objectives": [
      "在 patch 参数、props 裁剪、字典三个场景里说出该用哪个 utility type，以及为什么不用索引签名",
      "手写 MyPartial 与 MyPick，并逐符号解释 { [K in keyof T]?: T[K] }",
      "用 Pick 加 Exclude 组合出 Omit，并说出官方 Omit 的约束宽在哪里",
      "解释条件类型的分配律，并用 infer 手写 MyReturnType"
    ],
    "whyForAssessment": "senior 面试几乎不问「Partial 是什么」，问的是「Partial 怎么实现」。会不会 mapped type 和 conditional type，是「用过 TS」和「懂 TS」的分界线 —— 这三道题就压在这条线上。",
    "conceptHeadings": [
      "Partial、Required、Pick、Omit、Record 分别解决什么问题",
      "手写 MyPick 和 MyPartial",
      "Exclude、Extract、ReturnType 是怎么实现的"
    ],
    "conceptLedes": [
      "What problems do Partial, Required, Pick, Omit and Record each solve",
      "Implement Pick and Partial by hand",
      "How are Exclude, Extract and ReturnType implemented"
    ],
    "exerciseTitles": [
      "认出这个 mapped type 在干什么"
    ],
    "sourcePaths": [],
    "recap": [
      "五个 utility type 对应五种属性集合操作：变可选、变必填、留白名单、去黑名单、按键集合造字典。",
      "Partial 是浅的：只动第一层，嵌套对象内部照样必填。",
      "mapped type 一行四件事：keyof T 取键、in 循环、?/readonly/-? 改修饰符、T[K] 抄类型。",
      "MyPick 的 K extends keyof T 是泛型约束，把传错键的错误挡在调用处。",
      "Omit = Pick<T, Exclude<keyof T, K>>；官方 Omit 的 K 约束是 keyof any，比 keyof T 宽。",
      "分配律：裸类型参数遇到联合就逐成员求值再并；never 是空联合，并进去就消失。"
    ],
    "transfer": [
      "更新函数要接「只改几个字段」的参数 Partial<T> 当 patch 类型：可选，但保留字段级检查",
      "组件只用到大类型的几个字段 Pick 白名单；对外脱敏优先 Pick 而不是 Omit",
      "键是有限集合的字典 Record<字面量联合, V>，少键多键都在编译期报错",
      "被问「XX 工具类型怎么实现」 mapped type 循环属性；conditional type 配 infer 拆结构"
    ]
  },
  {
    "examId": "interview",
    "lessonId": "iv-ts-generics",
    "objectives": [
      "写出 getProp<T, K extends keyof T>(obj: T, key: K): T[K]，并解释约束和返回类型各解决什么",
      "用判别联合、switch 收窄和 never 兜底写出编译期的穷尽检查",
      "说清 as 断言为什么是逃生舱：它让编译器闭嘴，不产生任何运行时检查",
      "分清 unknown / any / never，并写出 catch (e) 的标准处理"
    ],
    "whyForAssessment": "senior 面试的泛型题多半长成 getProp 的样子：先让你写，再追问「不写约束行不行」「返回 any 行不行」。收窄和 unknown 两道验的是同一件事 —— 不靠 any 也能过编译。代码里 any 的密度，面试官是真的会看。",
    "conceptHeadings": [
      "为什么 getProp 必须写 K extends keyof T",
      "判别联合怎么配合 switch 做穷尽检查",
      "unknown、any、never 各自是什么语义"
    ],
    "conceptLedes": [
      "Why does getProp need the constraint K extends keyof T",
      "How do discriminated unions enable exhaustiveness checking",
      "What do unknown, any and never each mean"
    ],
    "exerciseTitles": [
      "unknown 参数该怎么用起来"
    ],
    "sourcePaths": [],
    "recap": [
      "泛型约束一举两得：obj[key] 合法化，返回类型精确到 T[K]。",
      "T[K] 的精确来自 K 被推断成字面量类型，而不是 string。",
      "判别联合 = 同名字段、不同字面量；switch 收窄，default 赋给 never 做穷尽检查。",
      "as 是闭嘴不是证明：不产生运行时检查，错误被推迟到别处爆发。",
      "unknown 是顶、never 是底、any 在层级外还会传染；边界一律 unknown。",
      "catch (e) 的 e 是 unknown：instanceof Error 收窄，String(e) 兜底。"
    ],
    "transfer": [
      "报错 Type 'K' cannot be used to index type 'T' 给 K 加约束：K extends keyof T",
      "对象联合要按成员分别处理 判别字段 + switch 收窄，default 里赋给 never",
      "想写 as 让报错消失 先问有没有运行时检查；没有就写类型守卫，不是断言",
      "JSON.parse、catch、API 响应这类外部输入 入口标 unknown，收窄之后再进业务代码"
    ]
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-read-tests",
    "objectives": [
      "读出四个测试各自查的是什么",
      "抄出全部 13 个 data-testid，知道改名会红哪一片",
      "说清为什么测试 4 是这道题真正的分水岭",
      "知道 `vi.useFakeTimers()` 让 Loading 的 1 秒变成可控的"
    ],
    "whyForAssessment": "这道题的判分完全由 data-testid 驱动 —— 页面长得对但 testid 错一个，那一片全红。先读测试再写代码，能省掉一半的返工。测试 4「只留最新三条」是分水岭：slice 方向写反、忘了 reverse、或者原地改了 state，都会挂在这一条。",
    "conceptHeadings": [
      "四个测试各查什么",
      "13 个 data-testid 就是契约"
    ],
    "conceptLedes": [
      "读完这张表，你就知道要写哪些东西",
      "改一个名字，红一片。所以先抄表"
    ],
    "exerciseTitles": [
      "哪个断言决定了「分组顺序」不能自己定？",
      "补齐 RideHistory 的两个 testid 和互斥逻辑"
    ],
    "sourcePaths": [
      "cab-booking-context/src/test/App.test.jsx",
      "cab-booking-context/src/data/data.json"
    ],
    "recap": [
      "四个测试是一次完整用户流程：首页 → 选车 → 加载 → 确认 → 历史。",
      "13 个 data-testid 是唯一契约；改名字或挂错层级都会红一片。",
      "测试 2 的 toEqual 是有序断言，分组顺序来自 data.json 的键顺序，别自己排。",
      "断言「不存在」只能用 queryBy —— getBy 找不到会抛错。",
      "原样跑是 0 个测试跑起来：把 CabContext.js 改名成 .jsx 才能开始。"
    ],
    "transfer": [
      "测试全靠 data-testid 找元素 先抄一张 testid 表，标清每个几个、挂在哪一层",
      "要断言「某个东西不存在」 queryBy 而不是 getBy —— getBy 找不到会抛错",
      "空状态和列表两个 testid 它们互斥，用三元表达式，别两个都渲染",
      "toEqual 比一个数组 那是有序断言，顺序错了就红"
    ]
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-provider-layer",
    "objectives": [
      "写出 Context 三件套：createContext / Provider / 自定义 hook",
      "说清为什么 Provider 必须在 App 外面，而不是 App 内部",
      "知道自定义 hook 里那个 throw 守卫在防什么",
      "看懂测试为什么也要自己包一层 CabProvider"
    ],
    "whyForAssessment": "这是这道题最容易一次死透的地方。App 里的 handleSelectCab 要调 updateBookedCabDetails，所以 App 本身就是一个消费者 —— 如果你把 Provider 写在 App 的 return 里，App 自己拿不到 context，那个 throw 守卫会立刻炸，四个测试全红。",
    "conceptHeadings": [
      "Context 三件套",
      "Provider 必须在 App 外面",
      "一个 action 同时改两个 state"
    ],
    "conceptLedes": [
      "createContext 造管道、Provider 灌数据、自定义 hook 取数据",
      "因为 App 自己就是一个消费者",
      "选一辆车 = 设为当前 + 追加进历史"
    ],
    "exerciseTitles": [
      "补齐 Context 三件套",
      "从签名写出整个 CabContext"
    ],
    "sourcePaths": [
      "cab-booking-context/src/context/CabContext.js",
      "cab-booking-context/src/index.jsx"
    ],
    "recap": [
      "Context 三件套：createContext 造管道、Provider 灌值、自定义 hook 取值 + 守卫。",
      "Provider 必须在 App 外面 —— App 自己就是消费者（handleSelectCab 要写入）。",
      "createContext 不给默认值 + 守卫抛错，是为了让「忘套 Provider」立刻暴露。",
      "updateBookedCabDetails 一次改两个 state，业务规则集中在一处。",
      "追加历史必须造新数组，push 会让 React 跳过重渲染。"
    ],
    "transfer": [
      "组件读不到自己提供的 Context useContext 往上找 —— Provider 必须在消费者之上",
      "测试文件自己包了一层 Provider 那是在告诉你 Provider 该在哪一层",
      "「Cannot destructure property of undefined」 十有八九是忘了套 Provider",
      "一个业务动作要改两个 state 包成 Context 里的一个函数，别让调用方调两次"
    ]
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-page-machine",
    "objectives": [
      "用一个 currentPage state 管四个页面",
      "说清 && 条件渲染和三元的区别，以及为什么这里用 &&",
      "知道为什么 handleSelectCab 必须写在 App 里，而不是 CabCard 里",
      "看懂四个页面之间的转移图"
    ],
    "whyForAssessment": "题目没给路由，所以你得自己决定「页面」怎么表示。写成四个 boolean（isHome / isLoading …）能跑，但两个同时为 true 时会同时渲染两个页面，测试 3 的 getByTestId 会因为找到多个而抛错。一个字符串 state 从根上排除了这种状态。",
    "conceptHeadings": [
      "四个页面 = 一个字符串 state",
      "为什么 handleSelectCab 在 App 里"
    ],
    "conceptLedes": [
      "转移图画出来，代码就是照抄",
      "因为它要同时干两件事，而其中一件只有 App 知道"
    ],
    "exerciseTitles": [
      "把一次完整预订的六步排好",
      "补齐 App 的状态机"
    ],
    "sourcePaths": [
      "cab-booking-context/src/App.jsx",
      "cab-booking-context/src/components/Home/Home.jsx"
    ],
    "recap": [
      "四个页面用一个 currentPage 字符串管，四个 && 各判一次。",
      "先画转移表：四条转移就是四个回调，代码照抄。",
      "handleSelectCab 放在 App 里，因为「切页面」只有 App 做得到。",
      "onSelectCab={handleSelectCab} 不能加括号 —— 加了会在渲染时执行并无限重渲染。",
      "RideHistory 挂在首页里，所以点完确认回首页就能看到新记录。"
    ],
    "transfer": [
      "几个界面互斥地出现 一个字符串 state + 若干 &&，别用多个 boolean",
      "一个动作要改状态又要切界面 把两件事包进同一个 handler，放在拥有界面状态的那一层",
      "子组件需要触发父组件的状态变化 父组件传回调下去，子组件不碰父的 state",
      "onClick 里想传参数 () => fn(arg)；参数不变就直接传 fn，别多包一层"
    ]
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-options-grid",
    "objectives": [
      "用 Object.keys + 两层 map 把分组数据渲染出来",
      "说清为什么分组顺序不用自己排",
      "写出 CabCard 的五个 data-testid",
      "知道为什么 ride.id 单独做 key 在历史列表里不安全"
    ],
    "whyForAssessment": "测试 2 一次查九个断言：一个容器、三个分组标题（有序）、五种卡片字段各 6 个。这一节把这九个断言一次性满足。分组顺序是送分题 —— 老实用 Object.keys 就对了，自己排序反而会错。",
    "conceptHeadings": [
      "Object.keys 加两层 map",
      "五个字段，和 key 的那个坑"
    ],
    "conceptLedes": [
      "数据长什么样，代码就长什么样",
      "卡片里每个字段都有 testid；历史列表的 key 不能只用 id"
    ],
    "exerciseTitles": [
      "哪个 key 在历史列表里会出问题？",
      "从零写出 CabCard"
    ],
    "sourcePaths": [
      "cab-booking-context/src/data/data.json",
      "cab-booking-context/src/components/CabOptions/CabOptions.jsx",
      "cab-booking-context/src/components/CabOptions/CabCard.jsx"
    ],
    "recap": [
      "3 个类型 × 2 辆车 = 6 张卡，五个 toHaveLength(6) 就是这么来的。",
      "分组顺序来自 data.json 的键插入顺序，Object.keys 直接给你，别 sort。",
      "CabCard 五个 testid：img / name / type / price / select-button。",
      "历史列表的 key 不能只用 ride.id —— 同一辆车能订两次。",
      "onClick={onSelectCab} 会把事件对象当 cab 传进去，必须包箭头函数。"
    ],
    "transfer": [
      "数据是「分组名 → 数组」的对象 Object.keys 外层、值数组内层，两层 map",
      "断言用 toEqual 比分组顺序 别自己 sort —— 键的插入顺序就是答案",
      "列表里可能出现重复的业务 id key 用 `${id}-${index}`，或给每条记录一个自己的 id",
      "onClick 需要带自己的参数 () => fn(arg)；直接传 fn 会收到事件对象"
    ]
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-loading-timer",
    "objectives": [
      "在 useEffect 里写 setTimeout 并正确清理",
      "说清清理函数在防什么，以及不清理的真实症状",
      "看懂测试为什么要 vi.useFakeTimers() + advanceTimersByTime(1000)",
      "知道 act() 包住时间推进的原因"
    ],
    "whyForAssessment": "这是 effect 清理的标准考法，也是本站 React 变式二「计时器」的同一个考点。测试用 fake timer 把 1 秒变成一行代码，所以延迟数字必须正好是 1000 —— 写 900 或 1200，advanceTimersByTime(1000) 之后页面状态就不对了。",
    "conceptHeadings": [
      "为什么定时器必须在 useEffect 里",
      "清理函数在防什么"
    ],
    "conceptLedes": [
      "写在组件体里，每次渲染都会开一个新的",
      "组件已经不在了，定时器还在替它调 setState"
    ],
    "exerciseTitles": [
      "补齐 Loading 的四个空",
      "Debug Lab：定时器永远不到期"
    ],
    "sourcePaths": [
      "cab-booking-context/src/components/Loading/Loading.jsx",
      "cab-booking-context/src/test/App.test.jsx"
    ],
    "recap": [
      "setTimeout 是副作用，必须在 useEffect 里；写组件体里每渲染一次开一个。",
      "延迟必须是 1000 —— 测试拨的正好是 1000ms。",
      "清理函数在这道题里不影响测试结果，但加个「取消」按钮它就是可见 bug。",
      "React 18 起不再警告「在已卸载组件上 setState」，所以漏清理毫无提示。",
      "漏写依赖数组 = 每次渲染都重开定时器，那 1 秒永远数不完。"
    ],
    "transfer": [
      "组件里要开定时器 / 订阅 / 加监听 放进 useEffect，并在 return 里成对清掉",
      "「本该自动跳转但一直不跳」 先看 effect 的依赖数组 —— 漏了就每次渲染都重置",
      "测试要控制一段延迟 vi.useFakeTimers() + act(() => vi.advanceTimersByTime(n))",
      "afterEach 里要不要清定时器 要 —— runOnlyPendingTimers 再 useRealTimers，否则漏到下个测试"
    ]
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-history-three",
    "objectives": [
      "说清 slice(-3) 和 slice(0, 3) 的区别",
      "知道 reverse() 是原地修改，以及为什么这里安全",
      "写出「最新三条、最新在最上」的取法",
      "说清为什么 bookedCabDetails 后面必须有可选链"
    ],
    "whyForAssessment": "测试 4 是这道题唯一会「看起来做对了但实际全错」的地方：它同时查数量、顺序、和最旧那条真的消失。slice 方向写反、忘了 reverse、或者直接 reverse 到 state 上，三种错法都只在这一条测试里暴露。",
    "conceptHeadings": [
      "slice(-3) 是「最后三个」",
      "reverse() 原地修改 —— 这里为什么安全",
      "bookedCabDetails?.name —— 那个问号不能省"
    ],
    "conceptLedes": [
      "负数从尾巴数起。方向写反，测试 4 直接红",
      "因为 slice 已经给了你一个新数组",
      "初始值是 null，而 null 上取属性会抛错"
    ],
    "exerciseTitles": [
      "哪些写法能让测试 4 全绿？（多选）",
      "从零写出 RideHistory"
    ],
    "sourcePaths": [
      "cab-booking-context/src/components/Home/RideHistory.jsx",
      "cab-booking-context/src/components/CabConfirmation/CabConfirmation.jsx"
    ],
    "recap": [
      "slice(-3) 是最后三条，slice(0, 3) 是最前三条 —— 方向写反测试 4 才抓得住。",
      "reverse() 原地修改；slice(-3).reverse() 安全是因为 slice 先给了新数组。",
      "直接 rideHistory.reverse() 会翻掉 state，且 StrictMode 下开发时看不出来。",
      "sort / reverse / splice / push 都是原地改；slice / map / filter / concat 返回新数组。",
      "bookedCabDetails 初始 null，所以 ?.name 那个问号不能省。"
    ],
    "transfer": [
      "要「最新 N 条」 slice(-N)；越界安全，不足 N 条也不报错",
      "要倒序显示 先 slice 出副本再 reverse，或用 toReversed()",
      "看到 sort / reverse / splice 作用在 state 上 立刻停 —— 它们原地改，先复制",
      "某个 state 初始值是 null 读它的属性配 ?.；只在真会为空的地方加",
      "测试只断言了「有几个」 补一条「该消失的真的消失了」—— 数量对内容错抓不住"
    ]
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-scaffold-bug",
    "objectives": [
      "读懂「Failed to parse source for import analysis」这条报错",
      "说清 Vite 为什么默认不在 .js 里解析 JSX",
      "在两种修法里选对的那个，并说出为什么",
      "养成「先跑一次基线」的习惯"
    ],
    "whyForAssessment": "这是本站主线 ③「脚手架本身也会有问题」的又一个实例，而且这次踩得最狠 —— 不是某个测试失败，是 0 个测试跑起来。真实考试里遇到这种情况，能不能在两分钟内判断出「是环境问题不是我写错了」，直接决定你剩下的时间怎么花。",
    "conceptHeadings": [
      "为什么 .js 里的 JSX 会炸",
      "两种修法，选哪个",
      "两处「测试能过但面试会问」的写法"
    ],
    "conceptLedes": [
      "esbuild 默认按扩展名决定用哪个 loader",
      "改扩展名，还是改构建配置",
      "不是 bug。但你得知道它们的边界在哪"
    ],
    "exerciseTitles": [
      "Debug Lab：0 个测试跑起来",
      "下面哪些说法是对的？（多选）"
    ],
    "sourcePaths": [
      "cab-booking-context/src/context/CabContext.js",
      "cab-booking-context/vite.config.mjs"
    ],
    "recap": [
      "基线是 0 个测试跑起来 —— 不是某个测试失败，是连收集都没过。",
      "根因：CabContext.js 里有 JSX，但 esbuild 按扩展名选 loader。",
      "修法是改名 .jsx，一处 import 都不用改（import 都没写扩展名）。",
      "别用 vite.config 的 loader 覆盖来救一个文件 —— 那是拿长期换短期。",
      "两处「能过但可更好」：非函数式更新、value 未记忆化。它们不是 bug，要说清边界条件。"
    ],
    "transfer": [
      "报错里出现「Tests no tests」/「0 test」 挂在收集阶段，别改业务代码 —— 去看构建/转换层",
      "「Failed to parse source for import analysis」 十有八九是 .js 里写了 JSX，改扩展名",
      "报错最后一句给了具体建议 先照着做 —— 这类工具报错常常直接给答案",
      "想加一条全局配置来救一个文件 先问「改那个文件行不行」",
      "面试问「这段代码有什么问题」 先说清它在什么条件下是对的，再说什么条件下会坏"
    ]
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-rewrite",
    "objectives": [
      "在空文件夹里搭出 Vite + React + Vitest 的测试环境",
      "凭四个测试的要求写出 Context 和六个组件",
      "自己发现并修掉 .js / .jsx 那个坑",
      "跑到 4 passed / 4 total"
    ],
    "whyForAssessment": "真实考试就是这样：一个仓库、一份 README、一套测试，没有答案。前面三个部分你都是「跟着看」，这一节是「自己做」。做不出来不代表白学了 —— 卡在哪一步，那一步就是你真正的薄弱点。",
    "conceptHeadings": [
      "按什么顺序写"
    ],
    "conceptLedes": [
      "让测试一条一条变绿，而不是全写完再跑"
    ],
    "exerciseTitles": [
      "空文件夹里做出整个 Cab Booking"
    ],
    "sourcePaths": [
      "cab-booking-context/src/test/App.test.jsx",
      "cab-booking-context/src/data/data.json"
    ],
    "recap": [
      "按测试顺序写：测试 1 绿了再写测试 2 需要的东西，每步只有一个变量。",
      "第一步是「让测试能跑起来并且全红」—— 这就已经好过源项目的基线了。",
      "带 JSX 的文件从一开始就叫 .jsx，别重复那个坑。",
      "两个最容易错的点：slice(-3).reverse() 的顺序、确认页的 ?.name。",
      "提示分四级，先自己想 15 分钟 —— 你练的是没提示时自己找路。"
    ],
    "transfer": [
      "拿到一个只给测试的项目 先跑基线记下来，再按测试顺序一条一条变绿",
      "一次改动之后好几条测试同时红 回退到只改一处，把变量降到一个",
      "「我知道怎么做但写不出来」 那就是这一档要练的东西 —— 卡住的地方才是薄弱点",
      "本机装不了 Node StackBlitz：WebContainers 能真跑 npm install 和 npm test"
    ]
  }
];

/** 按 examId/lessonId 取那一节的全部可搜文本 */
export function searchTextOf(examId: string, lessonId: string): string {
  const l = SEARCH_LESSONS.find((x) => x.examId === examId && x.lessonId === lessonId);
  if (!l) return "";
  return [
    l.whyForAssessment,
    ...l.objectives,
    ...l.recap,
    ...l.conceptHeadings,
    ...l.conceptLedes,
    ...l.transfer,
    ...l.exerciseTitles,
    ...l.sourcePaths,
  ].join(" ");
}
