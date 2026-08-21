// 考试清单 —— 只有这一个数组，故意不放任何查询函数。
//
// 【为什么要单独一个文件】
// content/coding.ts 和 content/arena.ts 需要遍历全部考试来派生题目，
// 而 content/registry.ts 又要 re-export 它们的查询函数。
// 如果它们互相 import 就成了环 —— 而 ESM 会把 `export … from` 提升到模块顶部，
// 于是 coding.ts 会在 registry 的 EXAMS 初始化之前执行，
// 报 `Cannot access 'EXAMS' before initialization`（踩过）。
//
// 把纯数据抽到这里，依赖方向就变成单向：
//   exam-list ← registry
//   exam-list ← drills / coding / arena ← registry（re-export）

import type { Exam } from "./types";

import foundations from "./exams/foundations";
import react from "./exams/react";
import graphqlFederation from "./exams/graphql-federation";
import interview from "./exams/interview";
import cabBooking from "./exams/cab-booking";

export const EXAMS: Exam[] = [
  foundations,
  react,
  graphqlFederation,
  interview,
  cabBooking,
];
