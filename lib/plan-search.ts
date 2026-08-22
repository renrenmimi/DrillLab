// 搜索里的「引导计划」条目 —— 六条计划本身，加上每一档。
//
// 【为什么单独一个文件】
// components/search.tsx 挂在根 layout 上，每个路由都会下载它。
// 计划清单（content/plan-manifest.ts）有 80 KB 出头，不该跟着搜索框白下 ——
// 而搜索要按 ⌘K 才打开。所以这里和 content/search-index.ts 一样是懒加载的：
// 第一次打开搜索时才 import()，没加载完之前搜索照常工作，只是暂时搜不到计划。
//
// 返回的是纯数据（没有 JSX），Hit 的形状由 search.tsx 自己拼。

import { litePlans, type LiteItem } from "./plan-lite";
import type { PlanItemKind } from "./plan-types";

export interface PlanHit {
  href: string;
  kindZh: string;
  kindEn: string;
  titleZh: string;
  titleEn: string;
  subZh: string;
  subEn: string;
  haystack: string;
}

/** 一档里装了什么 —— 按类型计数，给搜索结果当第二行 */
const KIND_UNIT: Record<PlanItemKind, [string, string, string]> = {
  lesson: ["节课文", "lesson", "lessons"],
  exercise: ["个练习", "exercise", "exercises"],
  drill: ["道八股", "drill", "drills"],
  coding: ["道 coding", "coding problem", "coding problems"],
  arena: ["道考场题", "arena challenge", "arena challenges"],
  mock: ["套模拟考", "mock exam", "mock exams"],
};

function summarize(items: LiteItem[]): { zh: string; en: string } {
  const n = new Map<PlanItemKind, number>();
  for (const it of items) n.set(it.kind, (n.get(it.kind) ?? 0) + 1);
  const parts = [...n].map(([kind, c]) => {
    const [zh, en1, enN] = KIND_UNIT[kind];
    return { zh: `${c} ${zh}`, en: `${c} ${c === 1 ? en1 : enN}` };
  });
  return {
    zh: parts.map((p) => p.zh).join(" · "),
    en: parts.map((p) => p.en).join(" · "),
  };
}

export function planHits(): PlanHit[] {
  const out: PlanHit[] = [];

  for (const plan of litePlans()) {
    // 一个人搜的是「React 考试」或者「Spring」，那应该先命中计划 ——
    // 计划是「按什么顺序做」的答案，比单独一节课有用。
    out.push({
      href: `/plans/${plan.id}`,
      kindZh: "引导计划",
      kindEn: "Guided plan",
      titleZh: plan.zh,
      titleEn: plan.en,
      subZh: plan.outcomeZh,
      subEn: plan.outcomeEn,
      haystack: [
        plan.zh,
        plan.en,
        plan.outcomeZh,
        plan.outcomeEn,
        plan.forZh,
        plan.forEn,
        ...plan.stages.flatMap((st) => [st.zh, st.en]),
      ].join(" "),
    });

    plan.stages.forEach((st, i) => {
      const sum = summarize(st.items);
      out.push({
        href: `/plans/${plan.id}#stage-${st.id}`,
        kindZh: `${plan.zh} · 第 ${i + 1} 档`,
        kindEn: `${plan.en} · stage ${i + 1}`,
        titleZh: st.zh,
        titleEn: st.en,
        subZh: sum.zh,
        subEn: sum.en,
        haystack: [st.zh, st.en, plan.zh, plan.en, ...st.items.map((it) => it.zh)].join(" "),
      });
    });
  }

  return out;
}
