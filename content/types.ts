// DrillLab 的内容数据模型 —— 全站唯一的事实来源。
//
// 四层：Exam → Module → Lesson → Exercise。
// 新增一门考试 = 在 content/exams/ 下加一个文件 + 在 registry.ts 里 import,
// 不需要碰任何页面、导航或组件。路由是 /exams/[examId]/[lessonId],
// 侧栏、学习路径、练习场、模拟考的列表全部从注册表推导出来。
//
// 硬规矩：凡是 verified: false 的代码块，页面上必须显示「未在源项目中验证」标记；
// 凡是 DrillLab 自己出的题（模拟题），必须带 generated: true。

import type { ReactNode } from "react";

/* ============================================================
   代码与来源
   ============================================================ */

export type CodeLang =
  | "tsx"
  | "ts"
  | "js"
  | "jsx"
  | "graphql"
  | "java"
  | "json"
  | "bash"
  | "css"
  | "properties"
  | "text";

export interface CodeExample {
  language: CodeLang;
  /**
   * 显示在代码窗标题栏的文件名。
   * 注意它常被当**标题**用，不只是路径 —— 「改对之后」「验证命令」
   * 「本机实测输出」都是这个字段，所以需要英文版。纯路径不用加。
   */
  filename?: string;
  filenameEn?: string;
  code: string;
  /**
   * 英文版代码 —— **只有注释和面向读者的字符串不同，可执行的行必须逐字节相同。**
   *
   * 【为什么这条约束是硬的】
   * `highlight` 是行号。英文注释一旦比中文多占或少占一行，高亮就指到别的行，
   * 而且**不会报错**，只是默默指错 —— 比缺英文难发现得多。
   * 所以 codeEn 的行数必须和 code 完全一致。
   * 有个审计脚本查这件事：scripts/audit-code-lines.mjs。
   *
   * 另外：测试数据里的字符串（比如 `body: '很好'`）**不要翻译** ——
   * 那是数据不是文案，改了就和真实项目对不上了。只翻注释，和明确写给读者看的字符串。
   */
  codeEn?: string;
  /** 代码窗下方的说明 */
  explanation?: ReactNode;
  explanationEn?: ReactNode;
  /**
   * 这段代码在源项目里的真实路径，例如
   * "react-notes-app/src/components/NoteManager/index.tsx"。
   * 有值 → 页面显示 Source 标注。
   */
  sourceFile?: string;
  /** 高亮行号(1-based) */
  highlight?: number[];
  /**
   * 可信度三档：
   *   "source"   原样来自源项目（sourceFile 指向的真实文件里能找到）
   *   "verified" 不在源项目里，但我在本机真实跑通过（如参考解法、模拟考答案）
   *   "demo"     教学示意 / 故意写错的反例 / 没跑过的片段
   */
  verified: "source" | "verified" | "demo";
  /** 折叠展示（长文件用） */
  collapsible?: boolean;
}

/* ============================================================
   讲解段落
   ============================================================ */

export type ConceptTone = "note" | "warn" | "why" | "trap" | "transfer";

export interface ConceptSection {
  /** 段内锚点 id，用于右侧目录 */
  id: string;
  heading: string;
  headingEn?: string;
  /** 一句话副标，写「这一段到底在解决什么」 */
  lede?: string;
  ledeEn?: string;
  body: ReactNode;
  /**
   * 英文版正文。给了它，这一段就会长出「中文 / English」两个 tab。
   * 面试八股尤其需要 —— 面试官用英文问，你得用英文答。
   * 没给就只渲染中文，不出现 tab。
   */
  bodyEn?: ReactNode;
  code?: CodeExample[];
}

export interface Callout {
  tone: ConceptTone;
  title: string;
  titleEn?: string;
  body: ReactNode;
  bodyEn?: ReactNode;
}

/* ============================================================
   练习
   ============================================================ */

export type ExerciseLevel = 1 | 2 | 3 | 4;

interface ExerciseBase {
  id: string;
  /** 属于哪节课（由 registry 回填，内容文件不用写） */
  lessonId?: string;
  examId?: string;
  title: string;
  /** 见 Lesson.titleEn */
  titleEn?: string;
  /** Level 1 认得出 / 2 填空 / 3 写整块 / 4 从零建 */
  level: ExerciseLevel;
  prompt: ReactNode;
  promptEn?: ReactNode;
  /** DrillLab 自出题（非源项目原题）必须为 true */
  generated?: boolean;
  sourceFile?: string;
}

/** Level 1 —— 认得出来 */
export interface RecognitionExercise extends ExerciseBase {
  kind: "recognition";
  level: 1;
  /** 可选：题干里附一段代码 */
  code?: CodeExample;
  options: { id: string; label: string; labelEn?: string }[];
  /** 正确选项 id；多选时给多个 */
  answer: string[];
  explain: ReactNode;
  explainEn?: ReactNode;
}

/** Level 1 —— 把乱序步骤排对 */
export interface OrderingExercise extends ExerciseBase {
  kind: "ordering";
  level: 1;
  /** 打乱后展示给用户的条目；正确顺序由 answer 决定 */
  items: { id: string; label: string; labelEn?: string }[];
  answer: string[];
  explain: ReactNode;
  explainEn?: ReactNode;
}

/** Level 2 —— 挖空。code 里用 ___1___ ___2___ 标记空位 */
export interface FillBlankExercise extends ExerciseBase {
  kind: "fill-blank";
  level: 2;
  language: CodeLang;
  /** 常被当标题用（「两个真实片段」），不只是路径，所以要英文版 */
  filename?: string;
  filenameEn?: string;
  /** 含 ___n___ 占位符的代码 */
  template: string;
  /**
   * 英文版模板。约束和 CodeExample.codeEn 一样：**行数必须一致**，
   * 而且 ___n___ 占位符的**个数、编号、位置都不能变** —— 空位是靠它们对齐的。
   */
  templateEn?: string;
  blanks: {
    n: number;
    /** 可接受的答案（去空白后比较，大小写敏感）；第一个是展示用的标准答案 */
    accept: string[];
    hint: string;
    hintEn?: string;
    /** 为什么是这个 —— 提交后展示 */
    why: ReactNode;
    whyEn?: ReactNode;
    /** 输入框宽度（字符数），默认按标准答案长度 */
    width?: number;
  }[];
}

/** Level 3 —— 给签名/要求，自己写整块 */
export interface CodeCompletionExercise extends ExerciseBase {
  kind: "code-completion";
  level: 3;
  language: CodeLang;
  /** 常被当标题用，不只是路径 —— 见 CodeExample.filenameEn */
  filename?: string;
  filenameEn?: string;
  /** 预填的骨架（通常是签名 + 注释要求） */
  starter: string;
  /** 英文版骨架。约束同 CodeExample.codeEn：行数必须一致 */
  starterEn?: string;
  requirements: string[];
  /** 英文版。长度必须和 requirements 一致 —— 理由见 Lesson.objectivesEn */
  requirementsEn?: string[];
  /** 文本级校验：必须出现 / 必须不出现 */
  checks: {
    label: string;
    labelEn?: string;
    /** 正则（对去掉注释后的代码做匹配） */
    must?: string;
    mustNot?: string;
  }[];
  hints: string[];
  /** 英文版。长度必须和 hints 一致 */
  hintsEn?: string[];
  solution: CodeExample;
}

/** Debug Lab —— 给报错，自己找病灶 */
export interface DebugExercise extends ExerciseBase {
  kind: "debug";
  level: 2 | 3;
  /** 真实报错文本（尽量原样） */
  errorOutput: string;
  /**
   * 英文版。
   *
   * 【为什么这个也需要英文】
   * 报错正文本身是原样保留的，但这些块里常掺着中文标注行
   * （`# 更严重的情况：…`、`# 复现：…`），那是给读者的说明，不是报错的一部分。
   * 报错行照抄，标注行译 —— 和 codeEn 一个道理。
   */
  errorOutputEn?: string;
  /** 出错的代码 */
  broken: CodeExample;
  /** 「这是什么类型的错误」多选 */
  classify: {
    options: { id: string; label: string; labelEn?: string }[];
    answer: string;
  };
  /** 「病灶在哪个文件/哪一行」 */
  locate: {
    question: string;
    questionEn?: string;
    options: { id: string; label: string; labelEn?: string }[];
    answer: string;
  };
  fixed: CodeExample;
  /** 根因解释 */
  rootCause: ReactNode;
  rootCauseEn?: ReactNode;
  /** 怎么验证修好了 */
  verify: string;
  verifyEn?: string;
}

/** 从零重写 */
export interface FromScratchExercise extends ExerciseBase {
  kind: "from-scratch";
  level: 4;
  /** 要求（用户视角的需求，不给代码） */
  requirements: string[];
  /** 英文版。长度必须和 requirements 一致 */
  requirementsEn?: string[];
  /** 需要自己建的文件清单 */
  fileList: { path: string; role: string; roleEn?: string }[];
  /** 本机验证命令 */
  commands: { cmd: string; expect: string; expectEn?: string }[];
  /** 四级递进提示 */
  hints: [string, string, string, string];
  hintsEn?: [string, string, string, string];
  solution: CodeExample[];
}

export type Exercise =
  | RecognitionExercise
  | OrderingExercise
  | FillBlankExercise
  | CodeCompletionExercise
  | DebugExercise
  | FromScratchExercise;

/* ============================================================
   课程结构
   ============================================================ */

export interface Lesson {
  id: string;
  title: string;
  /**
   * 英文标题。
   *
   * 【为什么是旁挂字段而不是把 title 放宽成 string | Bilingual】
   * 全站有 150 处直接读 .title，其中不少要的是纯字符串 ——
   * generateMetadata 的 title、aria-label、排序键、搜索索引。
   * 放宽联合类型等于在这 150 处都得插一次 pick()，改动面大、回归风险高。
   * 旁挂之后：那 150 处一行不用动（继续拿中文），只有真正显示标题的地方
   * 改成 <T zh={l.title} en={l.titleEn} />，而 <T> 缺 en 时自动回落中文。
   * 于是英文可以一门课一门课地补，中间任何时刻站点都是可用的。
   */
  titleEn?: string;
  /** 侧栏用的一行钩子 */
  blurb: string;
  blurbEn?: string;
  /** 阅读时长（分钟，诚实估） */
  minutes: number;
  /** 「学完这节你会…」 */
  objectives: string[];
  /**
   * 英文版。
   *
   * 【长度必须和中文一致】
   * 这是两个平行数组，不是一个双语数组。逐项对齐靠的是下标，
   * 所以长度一旦不等，第 3 条中文就会配上第 3 条不存在的英文。
   * 渲染那一侧（components/lesson-kit.tsx 的 LearningObjective）
   * 发现长度不等就**整段回落中文** —— 宁可全中文，也不要错位。
   */
  objectivesEn?: string[];
  /** 「这在考试里考什么」—— 没有考点的课不该存在 */
  whyForAssessment: string;
  whyForAssessmentEn?: string;
  concepts: ConceptSection[];
  /** 涉及的源项目文件。edit: true 表示「这个文件需要你动手改」，页面上会高亮 */
  sourceFiles?: { path: string; role: string; roleEn?: string; edit?: boolean }[];
  callouts?: Callout[];
  exercises?: Exercise[];
  /** 常见错误 */
  mistakes?: { wrong: CodeExample; why: ReactNode; whyEn?: ReactNode }[];
  /** 迁移模式：看到什么信号 → 想到什么解法 */
  transfer?: {
    signal: string;
    reachFor: string;
    signalEn?: string;
    reachForEn?: string;
  }[];
  /** 要点回顾 */
  recap?: string[];
  /** 英文版。长度必须和 recap 一致 —— 理由见 objectivesEn */
  recapEn?: string[];
}

export interface Module {
  id: string;
  title: string;
  summary: string;
  /** 见 Lesson.titleEn */
  titleEn?: string;
  summaryEn?: string;
  /** 学习路径里的阶段标签，如 "Stage 3" */
  stage?: string;
  lessons: Lesson[];
}

/* ============================================================
   模拟考
   ============================================================ */

/**
 * 「怎么在本机把这套题跑起来」。
 *
 * 【为什么这是一个必填字段】
 * 模拟考和考场**故意不给页面内的运行环境**。理由不是技术上做不到 ——
 * React 模拟考就是一个组件加五个 RTL 测试，形状和 `/code` 里那 11 道跑绿的
 * 沙箱一模一样，接上去一定能跑。理由是四档的分工：
 *
 *   说得出 → 认得出 → 写得对 → 空手做
 *
 * 模拟考就是最右边那一档（它本来就是考场 6 道里的 2 道）。
 * 给它配一个连好依赖和测试的编辑器，等于把它降成「写得对」——
 * 那一档已经有 11 道题了；改成页面上填空，等于降成「认得出」——
 * 那一档已经有 123 个练习。两种改法的结果一样：
 * **站里再没有任何东西对准真实考试。**
 *
 * 既然不给运行环境，这一段说明就必须够硬：命令能直接抄、文件树完整、
 * 起始态和做对之后各该看到什么都写实测数字。
 * 说明不到位，「自己搭环境」就从考点变成了劝退。
 */
export interface MockSetup {
  /**
   * 从零起一个项目要跑的命令，按顺序。
   * note 是双语的 —— 这一段是操作说明，装不了 Node 的英文读者最需要它。
   */
  bootstrap: { cmd: string; note?: Bilingual }[];
  /** 额外要装的依赖（bootstrap 里已经装的不用重复列） */
  deps?: string[];
  /** 要建哪些文件。edit: true = 这次要你动手写的 */
  files: { path: string; role: Bilingual; edit?: boolean }[];
  /** 起始态跑测试**实测**看到什么 —— 不许凭感觉写 */
  baseline: Bilingual;
  /** 全做对**实测**看到什么 */
  target: Bilingual;
}

/** 双语短句。和 components/t.tsx 的 LocalizedString 同形，但 content 层不 import 组件 */
export type Bilingual = { zh: string; en: string };

export interface MockExam {
  id: string;
  title: string;
  /** 见 Lesson.titleEn */
  titleEn?: string;
  /** 换了业务场景，但核心技能一致 —— 这里写清是哪些技能 */
  mirrors: string;
  mirrorsEn?: string;
  scenario: string;
  scenarioEn?: string;
  minutes: number;
  /** 怎么在本机跑起来。见 MockSetup 的注释 */
  setup: MockSetup;
  /** 任务清单（不给答案） */
  tasks: {
    id: string;
    title: string;
    titleEn?: string;
    requirement: string[];
    /** 英文版。长度必须和 requirement 一致 —— 理由见 Lesson.objectivesEn */
    requirementEn?: string[];
    /** 评分点 */
    rubric: { points: number; label: string; labelEn?: string }[];
  }[];
  starter: CodeExample[];
  tests?: CodeExample[];
  commands?: { cmd: string; expect: string; expectEn?: string }[];
  /** 交卷后才展示 */
  walkthrough: ConceptSection[];
  solution: CodeExample[];
}

/* ============================================================
   考试
   ============================================================ */

export interface Exam {
  id: string;
  title: string;
  /** 见 Lesson.titleEn */
  titleEn?: string;
  /** 侧栏/卡片上的短标题 */
  shortTitle: string;
  shortTitleEn?: string;
  description: string;
  descriptionEn?: string;
  category: "基础" | "前端" | "后端" | "全栈";
  /** 一行说明这门考试考什么 */
  tests: string;
  testsEn?: string;
  /** 源项目在本机的真实路径（可为空，如 Foundations） */
  sourceProjects: { path: string; role: string; roleEn?: string }[];
  /** 前置考试 id */
  prerequisites: string[];
  /** 技术栈标签 */
  stack: string[];
  modules: Module[];
  mockExams: MockExam[];
  /** 真实项目里的任务覆盖清单，展示在考试首页 */
  checklist?: { task: string; covered: string; tested: boolean }[];
  /** 状态：ready = 内容完整；draft = 占位 */
  status: "ready" | "draft";
}

/* ============================================================
   刷题层 —— 题目是一等实体
   ------------------------------------------------------------
   这一层全部**从现有内容派生**，不复制正文。
   理由：content/exams/**（约 3.6 万行）是本机实测过的资产，
   抄一份出来就等于制造第二份真相，两边必然会漂。
   所以 answer / brief / solution 这些字段直接引用原来的 ReactNode，
   讲解用 lessonId 回链，不 copy-paste。
   ============================================================ */

/** 八股题的方向 —— 按所属 lesson 推导，不手写 */
export type DrillTrack = "html" | "css" | "js" | "react" | "node" | "db" | "web" | "ts";

/** 一道八股问答题 —— 从 interview 的 ConceptSection 派生 */
export interface DrillQuestion {
  /** 沿用现有的 q269 / q276 … */
  id: string;
  /** 题库编号。#279 与 #386 是同一题，所以是数组；DrillLab 自出的题没有编号（空数组） */
  bank: number[];
  /** DrillLab 自出（不来自真实题库）—— UI 上显示「DrillLab 自出」而不是编号 */
  generated?: boolean;
  /** 中文问题（= ConceptSection.heading） */
  zh: string;
  /** 英文原题（从 lede 里拆出来，去掉 # 编号和中文注记） */
  en: string;
  track: DrillTrack;
  /** 引用原 ConceptSection.body，不复制 */
  answer: ReactNode;
  /** 原 ConceptSection.bodyEn */
  answerEn?: ReactNode;
  code?: CodeExample[];
  /** 回链到出处那一节 */
  lessonId: string;
  examId: string;
}

/** 一道 coding 题 */
export interface CodingProblem {
  id: string;
  title: string;
  /** 英文标题。见 Lesson.titleEn 里那段为什么是旁挂字段 */
  titleEn?: string;
  track: "react" | "js" | "graphql" | "java";
  difficulty: 1 | 2 | 3;
  minutes: number;
  /** 题面：要做什么、验收标准 */
  brief: ReactNode;
  requirements: string[];
  /** React/JS 能在浏览器里跑；GraphQL/Java 不能 */
  runnable: boolean;
  /** runnable 时必填 */
  sandbox?: SandboxSpec;
  /** 不可运行时给终端命令 */
  commands?: { cmd: string; expect: string; expectEn?: string }[];
  /** 「展开讲解」引用哪一节 */
  explainLessonId?: string;
  /** 参考答案，放在门后 */
  solution: CodeExample[];
}

/** 浏览器沙箱的一份规格 */
export interface SandboxSpec {
  /** 起始文件 */
  files: Record<string, string>;
  /** 转写为 jest-like 的测试 */
  tests: string;
  dependencies?: Record<string, string>;
  /** 例如 "8 passed" */
  expect: string;
  /**
   * 「空白重来」时要清空的文件。
   * 不填就默认清掉除 package.json 和测试以外的全部文件。
   */
  blankKeep?: string[];
  /**
   * 打开工作区时默认停在哪个文件。
   *
   * 不填就沿用老行为（`blankKeep[0]`，也就是第一个「给定不用改」的文件）。
   * Cab Booking 那道需要它：给定文件有五个，而真正要先读的是
   * `/CabContext.tsx` —— 它的头注释里写着全部十二条验收标准，
   * 而它本身是要自己写的，所以不可能出现在 blankKeep 里。
   */
  activeFile?: string;
}

/** 考场：一次计时、无提示、答案锁死的从零重写 */
export interface ArenaChallenge {
  id: string;
  title: string;
  /**
   * 英文标题。
   *
   * 【为什么有的有、有的没有】
   * 考场题全部派生：2 道来自模拟考（MockExam.titleEn 补了就有），
   * 4 道来自 from-scratch 练习（Exercise 类型还没有英文字段，所以还没有）。
   * 缺的那几道由 <T> 回落中文，不是 bug，是那一层还没做。
   */
  titleEn?: string;
  scenario: string;
  scenarioEn?: string;
  /** 真实时限，诚实估 */
  minutes: number;
  /** 用户视角的需求，不给代码 */
  requirements: string[];
  fileList: { path: string; role: string }[];
  /** 本机验收命令 */
  commands: { cmd: string; expect: string; expectEn?: string }[];
  /** 从哪个 from-scratch / mock 派生（复用现有内容，不新写） */
  sourceExerciseId?: string;
  sourceMockId?: string;
  sourceExamId: string;
  // 这里原来有一个 blankSandbox?: SandboxSpec —— 已删除。
  // 它一处都没被用过，是「在浏览器里跑考场题」那个念头的残留。
  // 考场故意不给页面内的运行环境，理由见 MockSetup 的注释。

  /* 以下全部只在交卷后可见 —— 交卷前服务端不许渲染 */
  hints: [string, string, string, string];
  solution: CodeExample[];
  explainLessonId?: string;
}
