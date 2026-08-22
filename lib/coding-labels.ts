// Coding 题的「方向」和「难度」两套标签 —— 全站唯一一份。
//
// 【为什么从 content/coding.ts 搬到这里】
// 这两张表原来长在 content/coding.ts 里（那个文件 196 KB，装着 25 道题的
// 题面、测试和参考答案）。服务端页面 import 它没问题，但**客户端组件不许**——
// 一 import 就把 25 道题的正文打进 JS 包（README 里记的 784 KB 那个坑）。
//
// 而 Practice 模式的侧栏是客户端组件，它需要这两套标签给筛选项写名字。
// 所以标签搬到这个纯数据模块里，content/coding.ts 改成从这儿 re-export ——
// 抄第二份就会出现「侧栏叫 Java、列表页叫 Java / Spring」。
//
// 和 lib/exercise-labels.ts 是同一个套路。

export type CodingTrack = "react" | "js" | "graphql" | "java";

/** 方向名。四个都是专有名词，两种语言一样 */
export const CODING_TRACK_LABEL: Record<CodingTrack, string> = {
  react: "React",
  js: "JavaScript",
  graphql: "GraphQL",
  java: "Java / Spring",
};

export const CODING_TRACK_ORDER: CodingTrack[] = ["react", "js", "graphql", "java"];

export const DIFFICULTY_LABEL: Record<1 | 2 | 3, { zh: string; en: string }> = {
  1: { zh: "简单", en: "Easy" },
  2: { zh: "中等", en: "Medium" },
  3: { zh: "困难", en: "Hard" },
};
