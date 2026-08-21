// 学习路径的派生视图 —— 手写文件。
// **不要**把这些放进 content/nav.ts：那份是 gen:nav 生成的，会被整体覆盖。
//
// 【为什么需要这一层】
// nav.ts 给的是两套互不相通的数据：
//   一套是「五门课 → 模块 → 课文」，只能从侧栏进；
//   一套是「105 道八股 / 25 道 coding / 7 道考场题」三张全量表，只能从顶栏进。
// 同一批材料被切成两种形状，于是学的人得自己猜「现在该点左边还是点上边」。
//
// 这一层把第二套挂回第一套：给定一门课（或一节课），它有哪些题。
// 归属方式三条主线各不相同，所以反查逻辑只应该有一份：
//   drill  自带 examId 和 lessonId  → 能精确到课文
//   arena  自带 examId              → 只能到课程
//   coding 只有 explainLessonId     → 顺着课文反查课程

import {
  NAV,
  DRILLS,
  CODING,
  ARENA,
  type NavExam,
  type NavDrill,
  type NavCoding,
  type NavArena,
} from "./nav";

/** lessonId → examId。课文内嵌在 exam.modules[].lessons[] 里，扁平化一次就够。 */
const EXAM_OF_LESSON: Record<string, string> = {};
for (const exam of NAV) {
  for (const mod of exam.modules) {
    for (const lesson of mod.lessons) EXAM_OF_LESSON[lesson.id] = exam.id;
  }
}

/** 这门课的八股题。目前 105 道全部属于 interview，别的课是 0。 */
export const drillsOfExam = (examId: string): NavDrill[] =>
  DRILLS.filter((d) => d.examId === examId);

/**
 * 这一节课的八股题。
 *
 * 105 道题挂在 17 节课上，最多的一节 12 道。侧栏不可能把 105 条平铺出来，
 * 但可以在课文那一行标出「这节有几道」，再链到只筛这一节的题单 —— 这样
 * 八股才真正落在阶梯上，而不是只存在于顶栏那张全量表里。
 */
export const drillsOfLesson = (lessonId: string): NavDrill[] =>
  DRILLS.filter((d) => d.lessonId === lessonId);

/** 这门课的 coding 题。coding 没有 examId，顺着「展开讲解」那节课反查。 */
export const codingOfExam = (examId: string): NavCoding[] =>
  CODING.filter(
    (c) => c.explainLessonId && EXAM_OF_LESSON[c.explainLessonId] === examId,
  );

/** 这门课的考场题 */
export const arenaOfExam = (examId: string): NavArena[] =>
  ARENA.filter((a) => a.examId === examId);

/**
 * 侧栏的分组和顺序。
 *
 * 【为什么不直接用 NAV 的数组顺序】
 * NAV 是内容文件的登记顺序，不表示学习顺序。真正的顺序写在 prerequisites 里：
 * foundations 没有前置；react / graphql-federation / cab-booking 都要求 foundations；
 * 而 interview（面试八股）**也没有前置**，并且没有任何课以它为前置。
 *
 * 所以 interview 不是「第五步」，把它编号成 05 是在骗人 —— 它是一条平行支线，
 * 任何时候都能开始，也不必等主线做完。侧栏据此分成两组，只给主线编号。
 */
export interface PathGroup {
  kind: "main" | "parallel";
  exams: NavExam[];
}

export function pathGroups(): PathGroup[] {
  const main: NavExam[] = [];
  const parallel: NavExam[] = [];

  for (const exam of NAV) {
    const isDependedOn = NAV.some((e) => e.prerequisites.includes(exam.id));
    if (exam.prerequisites.length === 0 && !isDependedOn) parallel.push(exam);
    else main.push(exam);
  }

  // 主线内部：无前置的排最前。其余都只依赖 foundations，彼此之间无序，
  // 保持登记顺序即可（sort 在这里是稳定的）。
  main.sort((a, b) => a.prerequisites.length - b.prerequisites.length);

  const out: PathGroup[] = [{ kind: "main", exams: main }];
  if (parallel.length) out.push({ kind: "parallel", exams: parallel });
  return out;
}
