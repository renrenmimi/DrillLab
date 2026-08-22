// 练习的「难度」和「题型」两套标签 —— 全站唯一一份。
//
// 【为什么要拆成两套】
// 老代码把难度徽章写成 `L2 · 填空 / Fill the blanks`，可 L2 里既有填空
// 也有 Debug Lab —— 于是一道 Debug Lab 的题头上明晃晃写着「填空」。
// L1 同理（recognition 和 ordering 都在 L1）。
// 难度是难度（给你多少东西），题型是题型（怎么问），不是一回事。
//
// 【为什么要共享】
// 题型标签原来在 components/exercise.tsx 和 components/practice-page.tsx
// 各写了一份，改一边忘一边就会出现「筛选器叫「写整块」、题头叫别的」。
// 这里是唯一真相，两边都从这儿拿。
//
// 纯数据，没有 JSX，服务端组件和客户端组件都能 import。

import type { Exercise } from "@/content/types";

/**
 * 六种练习题型。
 *
 * 【为什么要 re-export 这个类型】content/types.ts 里带 ReactNode 的类型不少，
 * 而客户端组件（Practice 模式的侧栏）只需要这一个联合类型。
 * `import type` 会被 TS 完全擦掉，所以从这里取它不会把内容拖进客户端包，
 * 但从这里取比让每个消费方各自 import content/types 更不容易走错。
 */
export type ExerciseKind = Exercise["kind"];

/** 难度只说刻度，不说题型 */
export const LEVEL_LABEL: Record<number, string> = {
  1: "L1",
  2: "L2",
  3: "L3",
  4: "L4",
};

/** 难度的一句话含义 —— 和四档（说得出 / 认得出 / 写得对 / 空手做）同一个意思 */
export const LEVEL_HINT: Record<number, { zh: string; en: string }> = {
  1: { zh: "给你选项", en: "You get options" },
  2: { zh: "挖好了空", en: "Blanks are cut for you" },
  3: { zh: "给你起始文件", en: "You get a starter file" },
  4: { zh: "什么都不给", en: "Nothing is handed to you" },
};

export const KIND_LABEL: Record<Exercise["kind"], { zh: string; en: string }> = {
  recognition: { zh: "认出来", en: "Spot it" },
  ordering: { zh: "排顺序", en: "Order it" },
  "fill-blank": { zh: "填空", en: "Fill the blanks" },
  "code-completion": { zh: "写整块", en: "Write a block" },
  debug: { zh: "Debug Lab", en: "Debug Lab" },
  "from-scratch": { zh: "从零重写", en: "Rebuild from scratch" },
};
