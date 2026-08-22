// 把生成的轻量清单展开成能用的对象。
//
// 【这一层存在的唯一理由是首屏字节】
// 顶栏那枚计划徽标、侧栏那块面板、页内那条位置条是**全站挂载**的。
// 它们要算「我在计划的第几档第几格、下一格是什么」，而完整地展开一条计划
// 需要 content/nav（134 KB）+ content/nav-exercises（39 KB）——
// 一旦这条依赖出现在全站挂载的组件里，webpack 就把 nav 从「所有页面共用的
// 那个 chunk」拆出去，于是每个路由都要单独再下一遍。
// 实测：课程页 First Load JS 142 → 195 kB（+37%）。
//
// content/plan-manifest.ts 是构建期压好的结果，**不 import 任何内容模块**。
// 这个文件只负责把「按列存的数组」还原成对象，并补上两样派生字段：
// key（进度查询用）和 mode（徽章用）。
//
// 纯函数，没有 "use client" —— 服务端组件要判断「这一节在不在计划里」也能用。

import { PLAN_ITEMS, PLAN_MANIFEST } from "@/content/plan-manifest";
import type { ModeId } from "./modes";
import { itemKey, type PlanStatus } from "./plan-progress";
import { MODE_OF_KIND, type PlanItemKind, type PlanPhase } from "./plan-types";

export interface LiteItem {
  key: string;
  kind: PlanItemKind;
  mode: ModeId;
  href: string;
  zh: string;
  en?: string;
  examId?: string;
  id: string;
  exerciseKind?: string;
  /** 有估时的才有（课文、coding、考场、模拟考）。练习和八股没有 */
  minutes?: number;
}

export interface LiteStage {
  id: string;
  phase: PlanPhase;
  zh: string;
  en: string;
  /** 这一档为什么在这儿 —— 首页那张「下一件事」的卡用它回答「为什么是这一件」 */
  whyZh: string;
  whyEn: string;
  items: LiteItem[];
}

export interface LitePlan {
  id: string;
  zh: string;
  en: string;
  outcomeZh: string;
  outcomeEn: string;
  forZh: string;
  forEn: string;
  minutes: number;
  stages: LiteStage[];
  items: LiteItem[];
}

export type LiteStatus = PlanStatus<LitePlan>;

/** 下标 → 对象。同一条条目在多条计划里共用，所以这一层也缓存 */
const ITEM_CACHE = new Map<number, LiteItem>();

function itemAt(i: number): LiteItem {
  const hit = ITEM_CACHE.get(i);
  if (hit) return hit;
  const [kind, id, examId, zh, en, href, xkind, minutes] = PLAN_ITEMS[i];
  const out: LiteItem = {
    key: itemKey(kind, id, examId || undefined),
    kind,
    mode: MODE_OF_KIND[kind],
    href,
    zh,
    // 空串表示「没补英文」，<T> 缺 en 时回落中文，所以这里要给 undefined 而不是 ""
    en: en || undefined,
    examId: examId || undefined,
    id,
    exerciseKind: xkind || undefined,
    minutes: minutes || undefined,
  };
  ITEM_CACHE.set(i, out);
  return out;
}

const PLAN_CACHE = new Map<string, LitePlan>();

function expand(m: (typeof PLAN_MANIFEST)[number]): LitePlan {
  const hit = PLAN_CACHE.get(m.id);
  if (hit) return hit;
  const stages: LiteStage[] = m.stages.map((s) => ({
    id: s.id,
    phase: s.phase,
    zh: s.zh,
    en: s.en,
    whyZh: s.whyZh,
    whyEn: s.whyEn,
    items: s.items.map(itemAt),
  }));
  const out: LitePlan = {
    id: m.id,
    zh: m.zh,
    en: m.en,
    outcomeZh: m.outcomeZh,
    outcomeEn: m.outcomeEn,
    forZh: m.forZh,
    forEn: m.forEn,
    minutes: m.minutes,
    stages,
    items: stages.flatMap((s) => s.items),
  };
  PLAN_CACHE.set(m.id, out);
  return out;
}

/** 六条计划，顺序就是 content/plans.ts 里的顺序 */
export const litePlans = (): LitePlan[] => PLAN_MANIFEST.map(expand);

export function litePlanById(id: string | undefined): LitePlan | undefined {
  if (!id) return undefined;
  const m = PLAN_MANIFEST.find((p) => p.id === id);
  return m ? expand(m) : undefined;
}

/** 这一档由哪几档组成（去重、保持顺序）—— 计划卡片上那排小徽章 */
export function phasesOf(plan: LitePlan): PlanPhase[] {
  const seen = new Set<PlanPhase>();
  const out: PlanPhase[] = [];
  for (const s of plan.stages) {
    if (seen.has(s.phase)) continue;
    seen.add(s.phase);
    out.push(s.phase);
  }
  return out;
}
