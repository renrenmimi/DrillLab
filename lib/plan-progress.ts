// 计划的进度 —— 全部从**已有**的进度记录推导，不新开一套完成度。
//
// 【为什么必须推导，不能另存】
// 一个人可能先自己在 /drill 里刷了三十道，几天后才选了「前端面试复习」这条计划。
// 如果计划自己记一套「计划内完成」，那三十道就白刷了 —— 他会看到 0 / 105。
// 反过来，跟着计划做完一节课，回到 Learn 模式那一节也必须是打过勾的。
// 所以计划里的每一格都只是「已有记录的一个视图」：
//
//   课文     progress.lessons[`${examId}/${lessonId}`]
//   练习     progress.exercises 或 rebuilds（从零重写那一类走 rebuilds）
//   八股     progress.drills[id] —— 有记录就算「过过一遍」，mark === "known" 才算「会」
//   coding   progress.coding[id]
//   考场     progress.arena[id] 里有没有 outcome === "passed" 的那一次
//   模拟考   progress.mocks[`${examId}/${mockId}`]
//
// 【为什么是纯函数模块】
// 没有 "use client"、不带 hook。首页、侧栏、计划页都是客户端组件，
// 但课文页是服务端组件 —— 服务端渲染的那部分要判断「这一节在不在当前计划里」，
// 也得能 import 这里。ProgressData 只按类型 import，会被 TS 完全擦掉。

import type { PlanItem, ResolvedPlan, ResolvedStage } from "@/content/plans";
import type { DrillMark, ProgressData } from "./progress";

/**
 * 一格的状态。
 *
 * `done` 是「算不算这一档完成的分子」，`state` 是给 UI 用的细分 ——
 * 两者刻意分开：一道标了「模糊」的八股 **算过过一遍**（done），
 * 但显示上要和标了「会」的区分开。
 */
export type ItemState =
  | "todo"
  | "done"
  /** 八股：自评过，但不是「会」 */
  | "reviewed"
  /** 八股：标了「会」 */
  | "confident"
  /** 考场：试过，还没通过 */
  | "attempted"
  /** 考场：正在计时 */
  | "live"
  /** 考场：通过过 */
  | "passed";

export interface ItemStatus {
  state: ItemState;
  done: boolean;
  /** 只有八股有：当前的自评档位 */
  mark?: DrillMark;
}

export interface StageStatus {
  done: number;
  total: number;
  complete: boolean;
  /** 只有「背」那一档有：其中标了「会」的条数。和 done 分开显示 */
  confident?: number;
}

export interface PlanStatus {
  plan: ResolvedPlan;
  /** key → 状态。key 就是 PlanItem.key */
  itemStatus: Map<string, ItemStatus>;
  /** 和 plan.stages 同序 */
  stages: StageStatus[];
  done: number;
  total: number;
  complete: boolean;
  /** 第一个没完成的档的下标。全部完成时等于 stages.length */
  currentStageIndex: number;
  /** 下一步就是这一格。计划走完了就是 undefined */
  next?: { item: PlanItem; stageIndex: number; itemIndex: number };
  /**
   * 计划里最不熟的那道八股（不会 → 模糊 → 会）。
   *
   * 和 next 分开：八股「过过一遍」就算这一档完成，所以计划会往下走，
   * 但那些标了「不会」的仍然值得回头再过。计划走完之后这一条就是
   * 「还能做什么」的答案。
   */
  weakestDrill?: PlanItem;
}

/* ============================================================
   单格
   ============================================================ */

const DRILL_RANK: Record<DrillMark, number> = { unknown: 1, fuzzy: 2, known: 3 };

export function itemStatus(item: PlanItem, p: ProgressData): ItemStatus {
  switch (item.kind) {
    case "lesson": {
      const hit = !!p.lessons[`${item.examId}/${item.id}`];
      return { state: hit ? "done" : "todo", done: hit };
    }

    case "exercise": {
      // 从零重写那一类走的是 rebuilds（markRebuild），别的走 exercises（markExercise）。
      // 两个 bag 都是 `${examId}/${exerciseId}` 这个键，只是语义不同。
      const key = `${item.examId}/${item.id}`;
      const hit =
        item.exerciseKind === "from-scratch" ? !!p.rebuilds[key] : !!p.exercises[key];
      return { state: hit ? "done" : "todo", done: hit };
    }

    case "drill": {
      const rec = p.drills[item.id];
      if (!rec) return { state: "todo", done: false };
      // 自评过一次就算「过过一遍」—— 不逼人把每道都标成「会」才让走下一档
      return {
        state: rec.mark === "known" ? "confident" : "reviewed",
        done: true,
        mark: rec.mark,
      };
    }

    case "coding": {
      const hit = !!p.coding[item.id];
      return { state: hit ? "done" : "todo", done: hit };
    }

    case "arena": {
      if (p.arenaLive?.id === item.id) return { state: "live", done: false };
      const attempts = p.arena[item.id] ?? [];
      if (attempts.some((a) => a.outcome === "passed")) {
        return { state: "passed", done: true };
      }
      if (attempts.length > 0) return { state: "attempted", done: false };
      return { state: "todo", done: false };
    }

    case "mock": {
      const hit = !!p.mocks[`${item.examId}/${item.id}`];
      return { state: hit ? "done" : "todo", done: hit };
    }
  }
}

/* ============================================================
   一档里的「下一格」
   ------------------------------------------------------------
   八股这一档特殊：不是「第一个没做的」，而是按复习优先级排 ——
   没见过 → 不会 → 模糊 → 会。别的档就是定义顺序里第一个没完成的。
   ============================================================ */

function nextInStage(
  stage: ResolvedStage,
  status: Map<string, ItemStatus>,
): { item: PlanItem; itemIndex: number } | undefined {
  if (stage.source.from === "drills") {
    let best: { item: PlanItem; itemIndex: number; rank: number } | undefined;
    stage.items.forEach((item, i) => {
      const st = status.get(item.key);
      // 没见过的排最前（rank 0），其余按自评档位
      const rank = st?.mark ? DRILL_RANK[st.mark] : 0;
      if (!best || rank < best.rank) best = { item, itemIndex: i, rank };
    });
    return best ? { item: best.item, itemIndex: best.itemIndex } : undefined;
  }

  const i = stage.items.findIndex((item) => !status.get(item.key)?.done);
  return i < 0 ? undefined : { item: stage.items[i], itemIndex: i };
}

/* ============================================================
   整条计划
   ============================================================ */

export function planStatus(plan: ResolvedPlan, p: ProgressData): PlanStatus {
  const itemStatusMap = new Map<string, ItemStatus>();
  for (const item of plan.items) itemStatusMap.set(item.key, itemStatus(item, p));

  const stages: StageStatus[] = plan.stages.map((stage) => {
    let done = 0;
    let confident = 0;
    for (const item of stage.items) {
      const st = itemStatusMap.get(item.key)!;
      if (st.done) done++;
      if (st.state === "confident") confident++;
    }
    return {
      done,
      total: stage.items.length,
      complete: done === stage.items.length,
      confident: stage.source.from === "drills" ? confident : undefined,
    };
  });

  const done = stages.reduce((n, s) => n + s.done, 0);
  const total = stages.reduce((n, s) => n + s.total, 0);

  // 【只有一个答案】第一个没完成的档，那一档里第一个没完成的格。
  // 页面上任何地方要「下一步」都读这一条，不许各自再算一遍。
  const currentStageIndex = stages.findIndex((s) => !s.complete);
  const next =
    currentStageIndex < 0
      ? undefined
      : (() => {
          const hit = nextInStage(plan.stages[currentStageIndex], itemStatusMap);
          return hit ? { ...hit, stageIndex: currentStageIndex } : undefined;
        })();

  // 最不熟的那道八股 —— 跨全部「背」的档一起排
  let weakest: { item: PlanItem; rank: number } | undefined;
  for (const stage of plan.stages) {
    if (stage.source.from !== "drills") continue;
    for (const item of stage.items) {
      const st = itemStatusMap.get(item.key);
      const rank = st?.mark ? DRILL_RANK[st.mark] : 0;
      if (rank === 3) continue; // 已经标「会」的不用再排
      if (!weakest || rank < weakest.rank) weakest = { item, rank };
    }
  }

  return {
    plan,
    itemStatus: itemStatusMap,
    stages,
    done,
    total,
    complete: currentStageIndex < 0,
    currentStageIndex: currentStageIndex < 0 ? stages.length : currentStageIndex,
    next,
    weakestDrill: weakest?.item,
  };
}

/* ============================================================
   给页面用的小工具
   ============================================================ */

/** 一格在计划里的 key。页面只有 (kind, id) 时用它反查 */
export function itemKey(
  kind: PlanItem["kind"],
  id: string,
  examId?: string,
): string {
  switch (kind) {
    case "lesson":
      return `lesson:${examId}/${id}`;
    case "exercise":
      return `exercise:${examId}/${id}`;
    case "mock":
      return `mock:${examId}/${id}`;
    default:
      return `${kind}:${id}`;
  }
}

/** 百分比。只用来画进度条的宽度，显示的数字一律给「7 / 12」 */
export const pct = (done: number, total: number) =>
  total > 0 ? Math.round((done / total) * 100) : 0;
