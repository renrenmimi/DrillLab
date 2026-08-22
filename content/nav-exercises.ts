// 全站 148 个课内练习的清单 —— 生成物，不要手改。改完内容跑 `npm run gen:nav`。
//
// 【为什么和 content/nav.ts 分开】
// nav.ts 被每一个客户端页面下载。这一份只有引导计划用得上，而计划那一套
// 是懒加载的（components/plan-slots.tsx：没跟计划的人一个字节都不下）。
// 合成一份的实测代价：nav 133 → 160 KB，webpack 分块随之改变，
// 课程页从 470 kB 原始字节涨到 615 kB —— 而课程页本来一点 nav 都不需要。
//
// 只有 id / 所属课与节 / 题型 / 难度 / 标题，**没有题面和答案**。

export interface NavExerciseRef {
  examId: string;
  lessonId: string;
  id: string;
  title: string;
  /** 英文标题。148 个里大部分只有中文，<T> 会回落 */
  titleEn?: string;
  kind: string;
  level: number;
}

export const EXERCISES: NavExerciseRef[] = [
  {
    "examId": "foundations",
    "lessonId": "node-and-npm",
    "id": "f-dep-place",
    "title": "这个包该放哪边？",
    "titleEn": "Which side does this package go on?",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "foundations",
    "lessonId": "node-and-npm",
    "id": "f-lockfile-rule",
    "title": "lockfile 该怎么对待",
    "titleEn": "How to treat the lockfile",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "foundations",
    "lessonId": "package-json",
    "id": "f-pkg-blanks",
    "title": "补全 subgraph 的 package.json 关键字段",
    "titleEn": "Fill in the key fields of the subgraph package.json",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "foundations",
    "lessonId": "npm-scripts",
    "id": "f-how-to-test",
    "title": "怎么跑 react-notes-app 的测试",
    "titleEn": "How to run the tests of react-notes-app",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "foundations",
    "lessonId": "npm-scripts",
    "id": "f-debug-order",
    "title": "script 报错了，按什么顺序排查",
    "titleEn": "A script failed: in what order do you check things",
    "kind": "ordering",
    "level": 1
  },
  {
    "examId": "foundations",
    "lessonId": "project-layout",
    "id": "f-which-file",
    "title": "Q1 的 state 应该放在哪个文件",
    "titleEn": "Which file should hold the state for Q1",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "foundations",
    "lessonId": "project-layout",
    "id": "f-distractor",
    "title": "哪个是干扰项",
    "titleEn": "Which one is the distractor",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "foundations",
    "lessonId": "js-immutable-data",
    "id": "f-crud-blanks",
    "title": "补全 Q1 的三个数据操作",
    "titleEn": "Fill in the three data operations of Q1",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "foundations",
    "lessonId": "js-immutable-data",
    "id": "f-debug-push",
    "title": "Debug Lab · 数据加进去了，界面没反应",
    "titleEn": "Debug Lab · the data went in, the screen did not move",
    "kind": "debug",
    "level": 2
  },
  {
    "examId": "foundations",
    "lessonId": "js-async",
    "id": "f-async-all",
    "title": "该用 all 还是 allSettled",
    "titleEn": "all or allSettled",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "foundations",
    "lessonId": "js-async",
    "id": "f-async-fn",
    "title": "为什么 tasks 是「函数数组」而不是「Promise 数组」",
    "titleEn": "Why tasks is an array of functions, not an array of Promises",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "foundations",
    "lessonId": "js-async",
    "id": "f-async-blanks",
    "title": "补全 DataLoader 的批量函数",
    "titleEn": "Fill in the batch function of the DataLoader",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "foundations",
    "lessonId": "js-modules",
    "id": "f-debug-esm",
    "title": "Debug Lab · ERR_MODULE_NOT_FOUND",
    "titleEn": "Debug Lab · ERR_MODULE_NOT_FOUND",
    "kind": "debug",
    "level": 2
  },
  {
    "examId": "foundations",
    "lessonId": "ts-types",
    "id": "f-ts-props",
    "title": "补全 NoteTable 的 props 类型",
    "titleEn": "Fill in the props type of NoteTable",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "foundations",
    "lessonId": "ts-generics-and-errors",
    "id": "f-whose-fault",
    "title": "这是谁的问题",
    "titleEn": "Whose problem is this",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "foundations",
    "lessonId": "ts-generics-and-errors",
    "id": "f-generic-blanks",
    "title": "补全泛型参数",
    "titleEn": "Fill in the generic parameters",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-component",
    "id": "r-jsx-brace",
    "title": "哪一行会把变量的值显示出来",
    "titleEn": "Which line prints the value of a variable",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "react",
    "lessonId": "r-component",
    "id": "r-where-code",
    "title": "三道题的代码该写在哪个文件",
    "titleEn": "Which file the code for the three tasks belongs in",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "react",
    "lessonId": "r-props",
    "id": "r-props-blanks",
    "title": "补全 NoteItem 的两个按钮",
    "titleEn": "Fill in the two buttons of NoteItem",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-props",
    "id": "r-debug-immediate-call",
    "title": "Debug Lab · 页面一打开，所有笔记就消失了",
    "titleEn": "Debug Lab · every note disappears the moment the page opens",
    "kind": "debug",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-state",
    "id": "r-render-order",
    "title": "把一次点击的顺序排对",
    "titleEn": "Put the steps of one click in order",
    "kind": "ordering",
    "level": 1
  },
  {
    "examId": "react",
    "lessonId": "r-state",
    "id": "r-write-state",
    "title": "自己写出 NoteManager 的两个 state 和删除逻辑",
    "titleEn": "Write the two states of NoteManager and the delete logic yourself",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "react",
    "lessonId": "r-controlled-input",
    "id": "r-controlled-blanks",
    "title": "补全受控输入的闭环",
    "titleEn": "Complete the loop of a controlled input",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-controlled-input",
    "id": "r-debug-preventdefault",
    "title": "Debug Lab · 点 Add 之后页面闪一下，笔记没了",
    "titleEn": "Debug Lab · the page blinks after Add and the note is gone",
    "kind": "debug",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-lists-keys",
    "id": "r-key-choice",
    "title": "这个列表该用什么当 key",
    "titleEn": "What should this list use as its key",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "react",
    "lessonId": "r-lists-keys",
    "id": "r-map-return",
    "title": "哪一段什么都不会渲染",
    "titleEn": "Which one renders nothing at all",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "react",
    "lessonId": "r-useeffect",
    "id": "r-effect-blanks",
    "title": "补全编辑回填的 useEffect",
    "titleEn": "Complete the useEffect that prefills the form for editing",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-useeffect",
    "id": "r-debug-effect-loop",
    "title": "Debug Lab · 点 Edit 之后页面卡死",
    "titleEn": "Debug Lab · the page freezes after you press Edit",
    "kind": "debug",
    "level": 3
  },
  {
    "examId": "react",
    "lessonId": "r-derived-lifting",
    "id": "r-derived-or-state",
    "title": "哪个应该做成 state",
    "titleEn": "Which one should become state",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "react",
    "lessonId": "r-derived-lifting",
    "id": "r-where-state-lives",
    "title": "这个 state 该住哪",
    "titleEn": "Where should this state live",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "react",
    "lessonId": "r-derived-lifting",
    "id": "r-write-derived",
    "title": "写出派生数据与按钮文字",
    "titleEn": "Write the computed value and the button text",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "react",
    "lessonId": "r-read-q1",
    "id": "r-q1-forbidden",
    "title": "哪一处改动会让测试挂掉",
    "titleEn": "Which change makes a test fail",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "react",
    "lessonId": "r-read-q1",
    "id": "r-q1-hidden-req",
    "title": "题目没写但测试在查的是哪一条",
    "titleEn": "The requirement the task never states but a test checks",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "react",
    "lessonId": "r-read-q1",
    "id": "r-q1-workflow",
    "title": "把上手顺序排对",
    "titleEn": "Put the starting steps in order",
    "kind": "ordering",
    "level": 1
  },
  {
    "examId": "react",
    "lessonId": "r-task1-add",
    "id": "r-t1-blank",
    "title": "补全新增逻辑",
    "titleEn": "Fill in the add logic",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-task1-add",
    "id": "r-t1-write",
    "title": "不看答案，自己写出 Task 1",
    "titleEn": "Write Task 1 yourself, without looking at the answer",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "react",
    "lessonId": "r-task2-delete",
    "id": "r-t2-blank",
    "title": "补全删除逻辑",
    "titleEn": "Fill in the delete logic",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-task2-delete",
    "id": "r-t2-write",
    "title": "不看答案，自己写出 Task 2",
    "titleEn": "Write Task 2 yourself, without looking at the answer",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "react",
    "lessonId": "r-task2-delete",
    "id": "r-debug-filter-title",
    "title": "Debug Lab · 删一条，同名的全没了",
    "titleEn": "Debug Lab · delete one note and every note with the same title goes too",
    "kind": "debug",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-task3-edit",
    "id": "r-t3-blank",
    "title": "补全编辑逻辑的四个关键位置",
    "titleEn": "Fill in the four key spots of the edit logic",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-task3-edit",
    "id": "r-t3-write",
    "title": "不看答案，自己写出完整的 Task 3",
    "titleEn": "Write all of Task 3 yourself, without looking at the answer",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "react",
    "lessonId": "r-task3-edit",
    "id": "r-debug-new-id",
    "title": "Debug Lab · 点 Update 之后毫无反应",
    "titleEn": "Debug Lab · nothing happens after you click Update",
    "kind": "debug",
    "level": 3
  },
  {
    "examId": "react",
    "lessonId": "r-tests",
    "id": "r-test-blindspot",
    "title": "哪个实现能骗过全部四个测试但其实是错的",
    "titleEn": "Which implementation passes all four tests and is still wrong",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "react",
    "lessonId": "r-tests",
    "id": "r-test-await",
    "title": "这个测试失败是因为什么",
    "titleEn": "Why this test fails",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "react",
    "lessonId": "r-tests",
    "id": "r-write-own-test",
    "title": "自己补一个测试，覆盖「按 id 删除」这个盲区",
    "titleEn": "Write a test of your own to cover the delete-by-id blind spot",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "react",
    "lessonId": "r-q2-read",
    "id": "r-q2-why-fn",
    "title": "如果参数改成 Promise 数组会怎样",
    "titleEn": "What happens if the parameter becomes an array of Promises",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "react",
    "lessonId": "r-q2-read",
    "id": "r-q2-not-allsettled",
    "title": "为什么不能直接用 Promise.allSettled",
    "titleEn": "Why Promise.allSettled on its own is not the answer",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "react",
    "lessonId": "r-q2-implement",
    "id": "r-q2-blanks",
    "title": "补全 worker pool 的五个关键位置",
    "titleEn": "Fill in the five key spots of the worker pool",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-q2-implement",
    "id": "r-q2-write",
    "title": "从签名开始，自己写出整个 runTasks",
    "titleEn": "Start from the signature and write all of runTasks yourself",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "react",
    "lessonId": "r-q2-implement",
    "id": "r-debug-q2-no-parens",
    "title": "Debug Lab · 一行 START 都没打印",
    "titleEn": "Debug Lab · not one START line prints",
    "kind": "debug",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-var-todo",
    "id": "r-var-todo-blank",
    "title": "补全翻转与批量操作",
    "titleEn": "Fill in the toggle and the bulk action",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-var-todo",
    "id": "r-var-todo-write",
    "title": "自己写出筛选与「清除已完成」",
    "titleEn": "Write the filtering and the clear-completed action yourself",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "react",
    "lessonId": "r-var-timer",
    "id": "r-var-timer-blank",
    "title": "补全计时器的 effect",
    "titleEn": "Fill in the effect of the timer",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-var-timer",
    "id": "r-var-timer-write",
    "title": "自己写出整个计时器",
    "titleEn": "Write the whole timer yourself",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "react",
    "lessonId": "r-var-timer",
    "id": "r-var-timer-debug",
    "title": "Debug Lab · 计时器越跑越快",
    "titleEn": "Debug Lab · the timer keeps getting faster",
    "kind": "debug",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-var-fetch",
    "id": "r-var-fetch-blank",
    "title": "补全取数 effect 的四个关键位置",
    "titleEn": "Fill in the four key spots of the fetching effect",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-var-fetch",
    "id": "r-var-fetch-write",
    "title": "自己写出带竞态防护的取数 effect",
    "titleEn": "Write the fetching effect with race protection yourself",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "react",
    "lessonId": "r-var-fetch",
    "id": "r-var-fetch-debug",
    "title": "Debug Lab · URL 上是用户 2，界面显示用户 1",
    "titleEn": "Debug Lab · the URL says user 2 and the screen shows user 1",
    "kind": "debug",
    "level": 3
  },
  {
    "examId": "react",
    "lessonId": "r-var-comment-tree",
    "id": "r-var-tree-blank",
    "title": "补全递归统计与递归渲染",
    "titleEn": "Fill in the recursive count and the recursive render",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-var-comment-tree",
    "id": "r-var-tree-write",
    "title": "写出树形数据的不可变更新",
    "titleEn": "Write an immutable update for tree data",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "react",
    "lessonId": "r-var-comment-tree",
    "id": "r-var-tree-debug",
    "title": "Debug Lab · 回复加进去了，界面不动",
    "titleEn": "Debug Lab · the reply went in and the screen never moved",
    "kind": "debug",
    "level": 3
  },
  {
    "examId": "react",
    "lessonId": "r-var-theme-context",
    "id": "r-var-theme-blank",
    "title": "补全 ThemeContext 的四个关键位置",
    "titleEn": "Fill in the four key spots of ThemeContext",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-var-theme-context",
    "id": "r-var-theme-write",
    "title": "自己写出 ThemeProvider 和 useTheme",
    "titleEn": "Write ThemeProvider and useTheme yourself",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "react",
    "lessonId": "r-var-theme-context",
    "id": "r-var-theme-debug",
    "title": "Debug Lab · Cannot destructure property 'theme'",
    "kind": "debug",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-debug-lab",
    "id": "r-lab-import-path",
    "title": "故障 1 · 路径大小写",
    "titleEn": "Fault 1 · upper and lower case in a path",
    "kind": "debug",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-debug-lab",
    "id": "r-lab-props-undefined",
    "title": "故障 2 · props 名字对不上",
    "titleEn": "Fault 2 · the prop names do not match",
    "kind": "debug",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-debug-lab",
    "id": "r-lab-testid-typo",
    "title": "故障 3 · 测试找不到元素",
    "titleEn": "Fault 3 · the test cannot find the element",
    "kind": "debug",
    "level": 2
  },
  {
    "examId": "react",
    "lessonId": "r-debug-lab",
    "id": "r-lab-silent-mutation",
    "title": "故障 4 · 编辑后列表毫无变化（综合题）",
    "titleEn": "Fault 4 · the list does not change after an edit (mixed question)",
    "kind": "debug",
    "level": 3
  },
  {
    "examId": "react",
    "lessonId": "r-rebuild",
    "id": "r-rebuild-q1",
    "title": "从零重建 Q1 · Notes Manager",
    "titleEn": "Rebuild Q1 · Notes Manager",
    "kind": "from-scratch",
    "level": 4
  },
  {
    "examId": "react",
    "lessonId": "r-rebuild",
    "id": "r-rebuild-q2",
    "title": "从零重建 Q2 · 并发任务调度器",
    "titleEn": "Rebuild Q2 · the concurrent task runner",
    "kind": "from-scratch",
    "level": 4
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-what-is",
    "id": "g-which-is-scalar",
    "title": "哪些字段是标量",
    "titleEn": "Which fields are scalars",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-what-is",
    "id": "g-query-vs-mutation",
    "title": "这个操作该放哪",
    "titleEn": "Where does this operation belong",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-what-is",
    "id": "g-schema-blanks",
    "title": "补全 schema 的关键声明",
    "titleEn": "Fill in the key declarations of the schema",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-resolver",
    "id": "g-context-key",
    "title": "从 context 里取订单数据源，正确写法是",
    "titleEn": "The right way to read the order data source out of context",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-resolver",
    "id": "g-which-param",
    "title": "这个 resolver 该用哪个参数",
    "titleEn": "Which argument should this resolver use",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-resolver",
    "id": "g-resolver-order",
    "title": "把 resolver 的调用顺序排对",
    "titleEn": "Put the resolver calls in the right order",
    "kind": "ordering",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-nullable",
    "id": "g-nullable-return",
    "title": "这个 resolver 找不到数据时该返回什么",
    "titleEn": "What should this resolver return when it finds nothing",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-nullable",
    "id": "g-price-trap",
    "title": "createOrder 为什么必须查价格",
    "titleEn": "Why createOrder has to look up the price",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-nullable",
    "id": "g-nullable-blanks",
    "title": "给四个 TODO 各自选对兜底策略",
    "titleEn": "Pick the right fallback for each of the four TODOs",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-why-federation",
    "id": "g-fed-why",
    "title": "Federation 主要解决的是什么问题",
    "titleEn": "What problem does Federation mainly solve",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-why-federation",
    "id": "g-not-in-repo",
    "title": "哪些东西不在这个仓库里",
    "titleEn": "What is not in this repository",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-subgraph",
    "id": "g-build-subgraph",
    "title": "_entities 这个字段是谁加的",
    "titleEn": "Who adds the _entities field",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-subgraph",
    "id": "g-verify-how",
    "title": "本地怎么验证 federation 部分",
    "titleEn": "How to check the Federation part locally",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-entity",
    "id": "g-key-meaning",
    "title": "@key 在声明什么",
    "titleEn": "What @key declares",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-entity",
    "id": "g-parent-of-orders",
    "title": "User.orders 里的 user 参数上有什么",
    "titleEn": "What the user argument of User.orders carries",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-entity",
    "id": "g-entity-blanks",
    "title": "补全 entity 声明与引用解析",
    "titleEn": "Fill in the entity declaration and the reference resolver",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-dataloader",
    "id": "g-dataloader-why",
    "title": "DataLoader 靠什么把 N 次合并成 1 次",
    "titleEn": "How DataLoader turns N calls into 1",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-dataloader",
    "id": "g-batch-rules",
    "title": "batch 函数里哪种写法是错的",
    "titleEn": "Which return value from a batch function is wrong",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-dataloader",
    "id": "g-loader-blanks",
    "title": "修好 createOrderLoader 并写出 shippingInfo",
    "titleEn": "Fix createOrderLoader and write shippingInfo",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-dataloader",
    "id": "g-debug-loader-method",
    "title": "Debug Lab · DataLoader 报 is not a function",
    "titleEn": "Debug Lab · DataLoader reports is not a function",
    "kind": "debug",
    "level": 2
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-read-task1",
    "id": "g-fake-pass",
    "title": "为什么基线里有 4 个测试是通过的",
    "titleEn": "Why 4 tests already pass at the baseline",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-read-task1",
    "id": "g-fix-where",
    "title": "埋雷 1 该在哪个文件修",
    "titleEn": "Which file should planted bug 1 be fixed in",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-read-task1",
    "id": "g-task1-order",
    "title": "把 Task 1 的推进顺序排对",
    "titleEn": "Put the steps of Task 1 in the right order",
    "kind": "ordering",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-user-orders",
    "id": "g-t1-blank",
    "title": "补全 User.orders",
    "titleEn": "Fill in User.orders",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-user-orders",
    "id": "g-t1-write",
    "title": "不看答案，自己写出 User.orders",
    "titleEn": "Write User.orders yourself, without looking at the answer",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-shipping-info",
    "id": "g-t2-blank",
    "title": "补全 Order.shippingInfo",
    "titleEn": "Fill in Order.shippingInfo",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-shipping-info",
    "id": "g-t2-why-loader",
    "title": "为什么不能直接调数据源",
    "titleEn": "Why you cannot just call the data source",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-queries",
    "id": "g-t34-blank",
    "title": "补全两个 Query resolver",
    "titleEn": "Fill in both Query resolvers",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-queries",
    "id": "g-t34-write",
    "title": "不看答案，自己写出两个 Query resolver",
    "titleEn": "Write both Query resolvers yourself, without looking at the answer",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-planted-bugs",
    "id": "g-debug-orderapi",
    "title": "Debug Lab · Cannot read properties of undefined",
    "titleEn": "Debug Lab · Cannot read properties of undefined",
    "kind": "debug",
    "level": 3
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-planted-bugs",
    "id": "g-debug-swallowed",
    "title": "Debug Lab · 错误码不对（不报错的那种 bug）",
    "titleEn": "Debug Lab · The wrong error code (the kind of bug that throws nothing)",
    "kind": "debug",
    "level": 3
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-spring-basics",
    "id": "g-spring-exception",
    "title": "找不到订单时该怎么处理",
    "titleEn": "What to do when the order is not found",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-spring-basics",
    "id": "g-spring-annotations",
    "title": "这三个参数注解各从哪取值",
    "titleEn": "Where each of these parameter annotations reads from",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-endpoints",
    "id": "g-status-post",
    "title": "POST 创建成功该返回什么",
    "titleEn": "What a successful POST should return",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-endpoints",
    "id": "g-null-passes",
    "title": "为什么 return null 能骗过三个测试",
    "titleEn": "Why return null fools three of the tests",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-endpoints",
    "id": "g-endpoints-blank",
    "title": "补全三个关键端点的状态码与调用",
    "titleEn": "Fill in the status codes and calls of three key endpoints",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-endpoints",
    "id": "g-endpoints-write",
    "title": "不看答案，自己写出全部六个端点",
    "titleEn": "Write all six endpoints yourself, without looking at the answer",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-endpoints",
    "id": "g-debug-404-swallowed",
    "title": "Debug Lab · 查一个不存在的订单，返回了 200",
    "titleEn": "Debug Lab · Asking for an order that does not exist returns 200",
    "kind": "debug",
    "level": 3
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-written",
    "id": "g-written-worst",
    "title": "哪一行是最严重的安全问题",
    "titleEn": "Which line is the most serious security problem",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-written",
    "id": "g-written-serial",
    "title": "为什么 User subgraph 慢会拖慢 Orders subgraph",
    "titleEn": "Why a slow User subgraph slows the Orders subgraph down",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-written",
    "id": "g-written-fix",
    "title": "写出 actuator 那一条的修正配置",
    "titleEn": "Write the corrected configuration for the actuator line",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-debug-lab",
    "id": "g-lab-resolver-name",
    "title": "故障 1 · resolver 写了，字段还是 null",
    "titleEn": "Fault 1 · the resolver is written, the field is still null",
    "kind": "debug",
    "level": 3
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-debug-lab",
    "id": "g-lab-nonnull",
    "title": "故障 2 · Cannot return null for non-nullable field",
    "titleEn": "Fault 2 · Cannot return null for non-nullable field",
    "kind": "debug",
    "level": 2
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-debug-lab",
    "id": "g-lab-loader-order",
    "title": "故障 3 · A 拿到了 B 的数据",
    "titleEn": "Fault 3 · A receives B's data",
    "kind": "debug",
    "level": 3
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-debug-lab",
    "id": "g-lab-java-500",
    "title": "故障 4 · PATCH 传了小写状态，返回 500",
    "titleEn": "Fault 4 · PATCH sends a lowercase status and gets a 500",
    "kind": "debug",
    "level": 2
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-rebuild",
    "id": "g-rebuild-subgraph",
    "title": "从零重建 Task 1 · Orders subgraph",
    "titleEn": "Rebuild Task 1 · the Orders subgraph",
    "kind": "from-scratch",
    "level": 4
  },
  {
    "examId": "graphql-federation",
    "lessonId": "g-rebuild",
    "id": "g-rebuild-controller",
    "title": "从零重建 Task 2 · Spring Boot 控制器",
    "titleEn": "Rebuild Task 2 · the Spring Boot controller",
    "kind": "from-scratch",
    "level": 4
  },
  {
    "examId": "interview",
    "lessonId": "iv-coding-map",
    "id": "iv-coding-recog",
    "title": "认出考点：这道题在考什么",
    "titleEn": "Name the point: what is this question testing",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "interview",
    "lessonId": "iv-coding-widgets",
    "id": "iv-coding-dropdown-blank",
    "title": "补全「点外面关掉」",
    "titleEn": "Fill in \"click outside closes it\"",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "interview",
    "lessonId": "iv-coding-widgets",
    "id": "iv-coding-stars-write",
    "title": "自己写出星级评分",
    "titleEn": "Write the star rating yourself",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "interview",
    "lessonId": "iv-coding-ref-hook",
    "id": "iv-coding-hook-write",
    "title": "自己写出 useLocalStorage",
    "titleEn": "Write useLocalStorage yourself",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "interview",
    "lessonId": "iv-coding-rtk",
    "id": "iv-coding-rtk-blank",
    "title": "补全 createSlice",
    "titleEn": "Fill in createSlice",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "interview",
    "lessonId": "iv-coding-kanban",
    "id": "iv-coding-kanban-write",
    "title": "写出 moveCard",
    "titleEn": "Write moveCard",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "interview",
    "lessonId": "iv-hand-timing",
    "id": "hd-debounce-write",
    "title": "手写 debounce（带 cancel）",
    "titleEn": "Write debounce by hand (with cancel)",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "interview",
    "lessonId": "iv-hand-timing",
    "id": "hd-throttle-write",
    "title": "手写 throttle（leading + trailing）",
    "titleEn": "Write throttle by hand (leading + trailing)",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "interview",
    "lessonId": "iv-hand-data",
    "id": "hd-clone-write",
    "title": "手写 deepClone（防循环）",
    "titleEn": "Write deepClone by hand (cycle-safe)",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "interview",
    "lessonId": "iv-hand-data",
    "id": "hd-flatten-write",
    "title": "手写 flatten（depth 语义对齐原生 flat）",
    "titleEn": "Write flatten by hand (depth behaves like the built-in flat)",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "interview",
    "lessonId": "iv-hand-data",
    "id": "hd-curry-write",
    "title": "手写 curry（部分应用可复用）",
    "titleEn": "Write curry by hand (partial applications stay reusable)",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "interview",
    "lessonId": "iv-hand-async",
    "id": "hd-pall-write",
    "title": "手写 Promise.all + allSettled",
    "titleEn": "Write Promise.all and allSettled by hand",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "interview",
    "lessonId": "iv-hand-async",
    "id": "hd-emitter-write",
    "title": "手写 EventEmitter",
    "titleEn": "Write an EventEmitter by hand",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "interview",
    "lessonId": "iv-hand-async",
    "id": "hd-lru-write",
    "title": "手写 LRUCache（用 Map，不写链表）",
    "titleEn": "Write an LRUCache by hand (use a Map, no linked list)",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "interview",
    "lessonId": "iv-ts-utility",
    "id": "iv-ts-utility-recog",
    "title": "认出这个 mapped type 在干什么",
    "titleEn": "Work out what this mapped type does",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "interview",
    "lessonId": "iv-ts-generics",
    "id": "iv-ts-generics-recog",
    "title": "unknown 参数该怎么用起来",
    "titleEn": "How to actually use an unknown parameter",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-read-tests",
    "id": "cb-tests-recognition",
    "title": "哪个断言决定了「分组顺序」不能自己定？",
    "titleEn": "Which assertion makes the group order fixed?",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-read-tests",
    "id": "cb-testid-fill",
    "title": "补齐 RideHistory 的两个 testid 和互斥逻辑",
    "titleEn": "Fill in the two testids of RideHistory and the either-or logic",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-provider-layer",
    "id": "cb-context-fill",
    "title": "补齐 Context 三件套",
    "titleEn": "Fill in the three parts of the Context",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-provider-layer",
    "id": "cb-context-write",
    "title": "从签名写出整个 CabContext",
    "titleEn": "Write the whole CabContext from the signature",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-page-machine",
    "id": "cb-flow-order",
    "title": "把一次完整预订的六步排好",
    "titleEn": "Put the six steps of one full booking in order",
    "kind": "ordering",
    "level": 1
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-page-machine",
    "id": "cb-app-fill",
    "title": "补齐 App 的状态机",
    "titleEn": "Fill in the state machine of App",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-options-grid",
    "id": "cb-keys-recognition",
    "title": "哪个 key 在历史列表里会出问题？",
    "titleEn": "Which key goes wrong in the history list?",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-options-grid",
    "id": "cb-card-write",
    "title": "从零写出 CabCard",
    "titleEn": "Write CabCard from an empty file",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-loading-timer",
    "id": "cb-loading-fill",
    "title": "补齐 Loading 的四个空",
    "titleEn": "Fill in the four blanks of Loading",
    "kind": "fill-blank",
    "level": 2
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-loading-timer",
    "id": "cb-timer-debug",
    "title": "Debug Lab：定时器永远不到期",
    "titleEn": "Debug Lab: the timer never fires",
    "kind": "debug",
    "level": 2
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-history-three",
    "id": "cb-slice-recognition",
    "title": "哪些写法能让测试 4 全绿？（多选）",
    "titleEn": "Which versions make test 4 pass? (more than one)",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-history-three",
    "id": "cb-history-write",
    "title": "从零写出 RideHistory",
    "titleEn": "Write RideHistory from an empty file",
    "kind": "code-completion",
    "level": 3
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-scaffold-bug",
    "id": "cb-ext-debug",
    "title": "Debug Lab：0 个测试跑起来",
    "titleEn": "Debug Lab: zero tests run",
    "kind": "debug",
    "level": 2
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-scaffold-bug",
    "id": "cb-better-recognition",
    "title": "下面哪些说法是对的？（多选）",
    "titleEn": "Which of these statements are correct? (more than one)",
    "kind": "recognition",
    "level": 1
  },
  {
    "examId": "cab-booking",
    "lessonId": "cb-rewrite",
    "id": "cb-from-scratch",
    "title": "空文件夹里做出整个 Cab Booking",
    "titleEn": "Build the whole of Cab Booking from an empty folder",
    "kind": "from-scratch",
    "level": 4
  }
];

/** 某一门课的练习，按课文顺序 */
export const exercisesOfExam = (examId: string) =>
  EXERCISES.filter((x) => x.examId === examId);
