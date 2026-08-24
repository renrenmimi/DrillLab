// 首页那五张卡上的一句话简介 —— **手写的**，不是把课程简介截断。
//
// 【为什么不直接用 track.blurbZh】那段话是给课程总览页写的：三到五行，
// 解释这门课覆盖什么、为什么这么排。上一版在卡片上用 `-webkit-line-clamp: 2`
// 把它截成两行，于是五张卡上有五个半截句子（「……再加两道书面」）。
// **CSS 不该替你编辑文案** —— 截断只是把「太长了」这件事藏起来。
//
// 所以这里每条自己写一遍，规矩是**最多两句、每句短**：
// 第一句说「这一类是什么」，第二句说「练到什么程度」。
//
// 没写进这张表的分类会退回 track.blurbZh —— 加一门新考试仍然只要三步
// （见 CLAUDE.md「加一门新考试」），不会因为漏了这里就渲染出空白。

export type TrackCopy = { zh: string; en: string };

const CARD: Record<string, TrackCopy> = {
  foundations: {
    zh: "一个 JavaScript 项目是怎么跑起来的：Node、npm、scripts、测试。再补上两门考试真正要用的 JS 与 TypeScript。",
    en: "How a JavaScript project actually runs: Node, npm, scripts, tests. Then just the JavaScript and TypeScript the two exams really use.",
  },
  react: {
    zh: "跟着 react-notes-app 这个真实项目走：一个增删改的 Notes Manager，一个带并发上限的任务调度器。",
    en: "Built on the real react-notes-app project: a Notes Manager that adds, edits and deletes, and an async runner with a concurrency limit.",
  },
  "graphql-federation": {
    zh: "一个 Apollo Federation subgraph 加一个 Spring Boot 服务。从「GraphQL 是什么」讲到能在空目录里重建它。",
    en: "One Apollo Federation subgraph plus one Spring Boot service. From what GraphQL is to rebuilding it in an empty directory.",
  },
  interview: {
    zh: "按 HTML / CSS / JavaScript / React / Node / 网络分组的面试问答。每道给一句话答案、展开讲解，以及会被追问什么。",
    en: "Interview questions grouped by HTML, CSS, JavaScript, React, Node and networking. Each one gets a one-sentence answer, a full explanation, and the follow-ups to expect.",
  },
  "cab-booking": {
    zh: "一个用 Context 管全局状态的打车小应用：四个页面、一个 Provider、四个测试。",
    en: "A small cab-booking app that keeps its global state in one Context: four pages, one Provider, four tests.",
  },
};

export function trackCopy(id: string): TrackCopy | undefined {
  return CARD[id];
}
