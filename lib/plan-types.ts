// 引导计划的几个基础类型 —— 手写，全站唯一一份。
//
// 【为什么单独一个文件】
// 这几个类型被三处用：
//   content/plans.ts          完整定义（构建期 / 服务端）
//   content/plan-manifest.ts  生成的轻量清单（全站挂载的客户端零件读它）
//   lib/plan-progress.ts      完成度推导
// 放在 content/plans.ts 里的话，清单就得 import 它 —— 而那正是这一轮要断开的
// 那条依赖（content/plans 会拖上 content/nav 的 134 KB）。
//
// 纯类型加一张常量表，不带 JSX、不 import 任何内容模块。

import type { ModeId } from "./modes";

/** 一档的性质。决定徽章文字和颜色 */
export type PlanPhase =
  | "prereq"
  | "learn"
  | "review"
  | "practice"
  | "code"
  | "rebuild"
  | "assess";

/** 一格是什么东西。决定完成状态去哪个进度 bag 里查 */
export type PlanItemKind =
  | "lesson"
  | "exercise"
  | "drill"
  | "coding"
  | "arena"
  | "mock";

/**
 * 一格属于哪个模式 —— 条目上那枚小徽章、以及列表页那条计划提示要用。
 *
 * 【为什么是派生而不是每条都存一遍】
 * kind 和 mode 是一一对应的，存两份就会出现「lesson 那一条写着 practice」
 * 这种改一边忘一边的错。
 */
export const MODE_OF_KIND: Record<PlanItemKind, ModeId> = {
  lesson: "learn",
  exercise: "practice",
  drill: "review",
  coding: "practice",
  arena: "assess",
  mock: "assess",
};
