// 考试注册表 —— 全站唯一的清单。
//
// 加一门新考试：
//   1. 在 content/exams/ 下写 <id>.tsx,default export 一个 Exam
//   2. 在下面的 EXAMS 数组里 import 进来
// 导航、学习路径、练习场、模拟考页面都会自动带上它，不需要改任何组件。

import type { Exam, Exercise, Lesson, Module } from "./types";

// 清单本身在 exam-list.ts —— 见那个文件顶部关于循环依赖的说明
export { EXAMS } from "./exam-list";
import { EXAMS } from "./exam-list";

/* ---------- 基础查找 ---------- */

export function examById(id: string): Exam | undefined {
  return EXAMS.find((e) => e.id === id);
}

export function moduleById(exam: Exam, moduleId: string): Module | undefined {
  return exam.modules.find((m) => m.id === moduleId);
}

export interface LessonRef {
  exam: Exam;
  module: Module;
  lesson: Lesson;
  /** 该考试内的序号，从 1 开始 */
  index: number;
  /** 该考试的课程总数 */
  total: number;
}

/** 把一门考试的所有课拉平，带上所属模块与序号 */
export function lessonsOf(exam: Exam): LessonRef[] {
  const flat: LessonRef[] = [];
  exam.modules.forEach((module) => {
    module.lessons.forEach((lesson) => {
      flat.push({ exam, module, lesson, index: 0, total: 0 });
    });
  });
  return flat.map((ref, i) => ({ ...ref, index: i + 1, total: flat.length }));
}

export function findLesson(examId: string, lessonId: string): LessonRef | undefined {
  const exam = examById(examId);
  if (!exam) return undefined;
  return lessonsOf(exam).find((r) => r.lesson.id === lessonId);
}

export function prevNextLesson(examId: string, lessonId: string): {
  prev?: LessonRef;
  next?: LessonRef;
} {
  const exam = examById(examId);
  if (!exam) return {};
  const all = lessonsOf(exam);
  const i = all.findIndex((r) => r.lesson.id === lessonId);
  if (i < 0) return {};
  return { prev: all[i - 1], next: all[i + 1] };
}

/* ---------- 路径 ---------- */

export const examPath = (examId: string) => `/exams/${examId}`;
export const lessonPath = (examId: string, lessonId: string) =>
  `/exams/${examId}/${lessonId}`;
export const mockPath = (examId: string, mockId: string) =>
  `/mock/${examId}/${mockId}`;

/* ---------- 聚合 ---------- */

export interface ExerciseRef {
  exam: Exam;
  lesson: Lesson;
  exercise: Exercise;
}

/** 全站练习，按考试顺序排列 —— /practice 页面的数据源 */
export function allExercises(examId?: string): ExerciseRef[] {
  const out: ExerciseRef[] = [];
  for (const exam of EXAMS) {
    if (examId && exam.id !== examId) continue;
    for (const ref of lessonsOf(exam)) {
      for (const exercise of ref.lesson.exercises ?? []) {
        out.push({ exam, lesson: ref.lesson, exercise });
      }
    }
  }
  return out;
}

export function allMockExams() {
  return EXAMS.flatMap((exam) => exam.mockExams.map((mock) => ({ exam, mock })));
}

/** 学习路径：按 module.stage 分组的全站阶段视图 */
export function stages(): { stage: string; exam: Exam; module: Module }[] {
  const out: { stage: string; exam: Exam; module: Module }[] = [];
  for (const exam of EXAMS) {
    for (const mod of exam.modules) {
      if (mod.stage) out.push({ stage: mod.stage, exam, module: mod });
    }
  }
  return out;
}

export function examStats(exam: Exam) {
  const lessons = lessonsOf(exam);
  const exercises = lessons.flatMap((r) => r.lesson.exercises ?? []);
  return {
    modules: exam.modules.length,
    lessons: lessons.length,
    exercises: exercises.length,
    minutes: lessons.reduce((sum, r) => sum + r.lesson.minutes, 0),
    mocks: exam.mockExams.length,
    debugLabs: exercises.filter((e) => e.kind === "debug").length,
    rebuilds: exercises.filter((e) => e.kind === "from-scratch").length,
  };
}

/* ============================================================
   刷题层的三张表
   ------------------------------------------------------------
   注意 import 方向：drills / coding / arena 反过来 import 本文件的 EXAMS，
   所以这里只能用 re-export，不能在顶部 import 它们 —— 否则循环依赖。
   ============================================================ */

export { allDrills, drillById, drillsByTrack, drillTrackCounts, drillNeighbours } from "./drills";
export { allCodingProblems, codingProblemById } from "./coding";
export { allArena, arenaById, arenaPublicById } from "./arena";
export type { ArenaPublic } from "./arena";
