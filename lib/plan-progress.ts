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

import type { PlanItemKind } from "./plan-types";
import type { DrillMark, ProgressData } from "./progress";

/* ============================================================
   这个模块对「一条计划」的最小要求
   ------------------------------------------------------------
   两种形状都要能喂进来：
     · content/plans.ts 的 ResolvedPlan  —— /plans/[planId] 用，带估时和「为什么」
     · lib/plan-lite.ts 的 LitePlan      —— 全站挂载的零件用，只有算位置要的字段
   所以这里按**结构**约束，不绑具体类型。泛型把 next.item 的类型原样带回给调用方，
   这样两边都能直接读自己那份多出来的字段。
   ============================================================ */

/** 一格至少要有这些 —— 完成状态就靠它们去进度里查 */
export interface StatusItem {
  key: string;
  kind: PlanItemKind;
  id: string;
  examId?: string;
  /** 只有 exercise 有：从零重写那一类的记录在 rebuilds 里，其余在 exercises 里 */
  exerciseKind?: string;
}

export interface StatusStage {
  items: StatusItem[];
}

export interface StatusPlan {
  id: string;
  stages: StatusStage[];
  items: StatusItem[];
}

/** 喂进来的那一份计划里，一格的真实类型 —— next.item 要原样还给调用方 */
type ItemOf<P extends StatusPlan> = P["items"][number];

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

export interface PlanStatus<P extends StatusPlan> {
  plan: P;
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
  next?: { item: ItemOf<P>; stageIndex: number; itemIndex: number };
  /** 这一轮从什么时候开始算。没重走过就是 undefined */
  roundStart?: number;
  /**
   * 计划里最不熟的那道八股（不会 → 模糊 → 会）。
   *
   * 和 next 分开：八股「过过一遍」就算这一档完成，所以计划会往下走，
   * 但那些标了「不会」的仍然值得回头再过。计划走完之后这一条就是
   * 「还能做什么」的答案。
   */
  weakestDrill?: ItemOf<P>;
}

/* ============================================================
   单格
   ============================================================ */

const DRILL_RANK: Record<DrillMark, number> = { unknown: 1, fuzzy: 2, known: 3 };

/**
 * 这条记录**存在**，而且算「这一轮」的。
 *
 * 【两个条件缺一不可】第一版只写了后半句，于是 `stamp === undefined`
 * （压根没做过）碰上 `roundStart === undefined`（没重走过）时返回了 true ——
 * 整条计划直接变成全做完。回归脚本第一次跑就抓到了：4 / 130 显示成 92 / 130。
 *
 * roundStart 是 undefined（从来没重走过这条计划）时不做时间过滤 ——
 * 老数据和绝大多数情况都走这一支，行为和以前完全一样。
 *
 * 有 roundStart 时比时间戳。**老数据里那四个 bag 的值是字面量 `1`**，
 * 而 1 小于任何真实时间戳，所以它自动落在「这一轮之前」—— 正是想要的：
 * 你按下「重走一遍」之前做完的东西，这一轮不算。
 */
const inRound = (stamp: number | undefined, roundStart?: number) =>
  stamp !== undefined && (roundStart === undefined || stamp >= roundStart);

export function itemStatus(
  item: StatusItem,
  p: ProgressData,
  roundStart?: number,
): ItemStatus {
  switch (item.kind) {
    case "lesson": {
      const hit = inRound(p.lessons[`${item.examId}/${item.id}`], roundStart);
      return { state: hit ? "done" : "todo", done: hit };
    }

    case "exercise": {
      // 从零重写那一类走的是 rebuilds（markRebuild），别的走 exercises（markExercise）。
      // 两个 bag 都是 `${examId}/${exerciseId}` 这个键，只是语义不同。
      const key = `${item.examId}/${item.id}`;
      const stamp = item.exerciseKind === "from-scratch" ? p.rebuilds[key] : p.exercises[key];
      const hit = inRound(stamp, roundStart);
      return { state: hit ? "done" : "todo", done: hit };
    }

    case "drill": {
      const rec = p.drills[item.id];
      if (!rec || !inRound(rec.at, roundStart)) return { state: "todo", done: false };
      // 自评过一次就算「过过一遍」—— 不逼人把每道都标成「会」才让走下一档
      return {
        state: rec.mark === "known" ? "confident" : "reviewed",
        done: true,
        mark: rec.mark,
      };
    }

    case "coding": {
      const hit = inRound(p.coding[item.id], roundStart);
      return { state: hit ? "done" : "todo", done: hit };
    }

    case "arena": {
      if (p.arenaLive?.id === item.id) return { state: "live", done: false };
      // 考场用「开考时间」判轮次 —— 一次尝试属于它开始的那一轮
      const attempts = (p.arena[item.id] ?? []).filter((a) => inRound(a.startedAt, roundStart));
      if (attempts.some((a) => a.outcome === "passed")) {
        return { state: "passed", done: true };
      }
      if (attempts.length > 0) return { state: "attempted", done: false };
      return { state: "todo", done: false };
    }

    case "mock": {
      const hit = inRound(p.mocks[`${item.examId}/${item.id}`]?.at, roundStart);
      // mocks 的记录一定带 at，所以 ?. 取不到就是「没做过」，正好落在 undefined 那一支
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

/** 这一档装的是八股吗。一档只会来自一种查询，所以看第一条就够 */
const isDrillStage = (stage: StatusStage) => stage.items[0]?.kind === "drill";

function nextInStage<I extends StatusItem>(
  stage: { items: I[] },
  status: Map<string, ItemStatus>,
): { item: I; itemIndex: number } | undefined {
  if (isDrillStage(stage)) {
    let best: { item: I; itemIndex: number; rank: number } | undefined;
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

export function planStatus<P extends StatusPlan>(
  plan: P,
  p: ProgressData,
  /** 这条计划「这一轮」的起点。undefined = 没重走过，算全部记录 */
  roundStart?: number,
): PlanStatus<P> {
  type I = ItemOf<P>;
  const itemStatusMap = new Map<string, ItemStatus>();
  for (const item of plan.items) itemStatusMap.set(item.key, itemStatus(item, p, roundStart));

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
      confident: isDrillStage(stage) ? confident : undefined,
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
          return hit
            ? { item: hit.item as I, itemIndex: hit.itemIndex, stageIndex: currentStageIndex }
            : undefined;
        })();

  // 最不熟的那道八股 —— 跨全部「背」的档一起排
  let weakest: { item: I; rank: number } | undefined;
  // 下面两处 as I：stages 的元素类型是泛型的索引访问，TS 只看得到它满足
  // StatusStage，推不出「里面装的正是 ItemOf<P>」。运行时是同一个对象。
  for (const stage of plan.stages) {
    if (!isDrillStage(stage)) continue;
    for (const item of stage.items) {
      const st = itemStatusMap.get(item.key);
      const rank = st?.mark ? DRILL_RANK[st.mark] : 0;
      if (rank === 3) continue; // 已经标「会」的不用再排
      if (!weakest || rank < weakest.rank) weakest = { item: item as I, rank };
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
    roundStart,
  };
}

/* ============================================================
   给页面用的小工具
   ============================================================ */

/** 一格在计划里的 key。页面只有 (kind, id) 时用它反查 */
export function itemKey(
  kind: PlanItemKind,
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
