// 面试八股 —— 第四门课。
//
// 【它和另外三门不一样，这一点写清楚很重要】
//
// 另外三门对应真实的 综合项目 项目，所以代码块能标「源项目」。
// 这一门的题目来自作者做过的前端面试题（99 道问答 + 16 道 coding），
// 编号沿用题库里的 #269 ~ #387。答案是 DrillLab 写的，不来自任何源项目，
// 所以：
//   · 讲解里的代码块一律 demo()（页面显示「示意」）
//   · 练习一律带 generated: true
//   · coding 题里补进来的参考解法会先在本机跑通再标「已跑通」
//
// 每道题的固定格式：
//   heading  中文问题
//   lede     英文原题 + 题库编号（面试官会照这个念）
//   body     一句话 → 展开 → 会追问什么
//
// 「一句话」那一段是刻意的：面试的第一句话决定对方要不要往深里问，
// 所以每道题都先给一个 30 秒能说完的版本，再展开。

import type { Exam } from "../types";
import { ivBasics } from "./iv-basics";
import { ivJsCore } from "./iv-js1";
import { ivJsAsync } from "./iv-js2";
import { ivReactBasics } from "./iv-react1";
import { ivReactHooks } from "./iv-react2";
import { ivBackend } from "./iv-backend";
import { ivCoding } from "./iv-coding";
import { ivHand } from "./iv-hand";
import { ivTs } from "./iv-ts";

const interview: Exam = {
  id: "interview",
  title: "前端面试八股 · 99 问 + 16 道 coding",
  shortTitle: "面试八股",
  description:
    "一份作者做过的前端面试题整理，按 HTML / CSS / JavaScript / React / Node / 数据库 / 网络分好组，每道题给「一句话答案 + 展开 + 会被追问什么」。最后一节把 16 道 coding 题逐题对照本站已有的练习，指出哪些已经写过、哪些是缺口。",
  category: "全栈",
  tests:
    "八股考的是「你有没有想过为什么」。同一道题，说出结论是及格，说出取舍和边界才是好答案 —— 所以每道题都写了「会追问什么」，那才是真正拉开差距的地方。coding 题考的东西和另外两门的真题高度重合，所以这里只补真正的缺口，不重复出题。",
  sourceProjects: [],
  prerequisites: [],
  stack: [
    "HTML",
    "CSS",
    "JavaScript",
    "TypeScript",
    "React",
    "Redux",
    "Node.js",
    "Express",
    "SQL",
    "HTTP",
  ],
  status: "ready",
  mockExams: [],
  checklist: [
    {
      task: "HTML 5 题（#269、#380 ~ #385）",
      covered: "块级/行内、事件冒泡与捕获、meta、语义化、无障碍",
      tested: false,
    },
    {
      task: "CSS 8 题（#270 ~ #275、#383、#384）",
      covered: "盒模型、margin/padding、Flex vs Grid、选择器与优先级、SCSS、预处理器、响应式",
      tested: false,
    },
    {
      task: "JavaScript 38 题（#276 ~ #312、#386、#387）",
      covered: "引擎与类型、函数与作用域、this 与 OOP、异步与事件循环、DOM 与工具链，共 5 节",
      tested: false,
    },
    {
      task: "React 与生态 36 题（#319 ~ #356）",
      covered: "虚拟 DOM 与 diff、组件与通信、Hooks、性能与 React 18、Redux 与 TypeScript，共 5 节",
      tested: false,
    },
    {
      task: "Node / Express 4 题（#313 ~ #316）",
      covered: "Node 事件循环、请求响应周期、参数选择、CRUD 与幂等",
      tested: false,
    },
    {
      task: "数据库 2 题（#317、#318）",
      covered: "关系型 vs 非关系型选型、主键与外键及删除行为",
      tested: false,
    },
    {
      task: "网络、安全与测试 6 题（#357 ~ #362）",
      covered: "CORS、HTTPS、JWT、session vs cookie、状态码、测试金字塔",
      tested: false,
    },
    {
      task: "Coding 16 题（#363 ~ #378）",
      covered: "逐题对照现有练习，9 道已被覆盖，7 道作为缺口补进来（参考解法在本机跑过测试）",
      tested: true,
    },
  ],
  modules: [ivBasics, ivJsCore, ivJsAsync, ivReactBasics, ivReactHooks, ivBackend, ivCoding, ivHand, ivTs],
};

export default interview;
