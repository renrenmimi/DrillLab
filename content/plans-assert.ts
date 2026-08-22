// 引导计划的完整性断言 —— **只给服务端页面 import**。
//
// 【为什么单独一个文件】
// 断言要把六条计划全部展开一遍才能发现「引用了不存在的东西」。
// 如果它留在 content/plans.ts 的模块作用域里，那么**每一个**页面
// （顶栏那枚计划徽标在每一页都有）都会在客户端把六条计划、
// 一千多个条目全展开一次 —— 白烧 CPU，而且那段代码也白进包。
//
// 现在它由 app/plans/page.tsx 和 app/plans/[planId]/page.tsx import。
// 这两页都是预渲染的，所以 next build 一定会跑到这里 ——
// 引用写错就是**构建失败**，不是页面上安静地少一格。
// dev 下打开 /plans 也会立刻炸。

import { PLANS, resolvePlan } from "./plans";

/* ============================================================
   完整性断言 —— 引用写错就当场炸
   ------------------------------------------------------------
   在模块作用域跑，所以：
     · dev 下第一次 import 就炸；
     · next build 预渲染 /plans 时会 import 到这里，构建直接失败。
   宁可构建失败，也不要页面上安静地少一格。
   ============================================================ */

export function assertPlans() {
  if (PLANS.length === 0) throw new Error("plans: 一条计划都没有");

  const planIds = new Set<string>();

  for (const plan of PLANS) {
    if (planIds.has(plan.id)) throw new Error(`plans: 计划 id 重复 ${plan.id}`);
    planIds.add(plan.id);

    if (plan.stages.length === 0) {
      throw new Error(`plans: 计划 ${plan.id} 一档都没有`);
    }

    const stageIds = new Set<string>();
    // 展开一次，顺带把上面那些「引用了不存在的东西」的 throw 全部触发
    const resolved = resolvePlan(plan);

    for (const stage of resolved.stages) {
      if (stageIds.has(stage.id)) {
        throw new Error(`plans: 计划 ${plan.id} 里的档 id 重复 ${stage.id}`);
      }
      stageIds.add(stage.id);

      if (stage.items.length === 0) {
        // 一档解析成 0 条，说明查询写错了（比如模块 id 对但那个模块里没练习）。
        // 真的没内容就该整档删掉，不该留一个空档。
        throw new Error(
          `plans: 计划 ${plan.id} 的「${stage.zh}」这一档解析出 0 条内容 —— ` +
            `真的没内容就把整档删掉，别留空档`,
        );
      }
      if (!stage.whyZh || !stage.whyEn) {
        throw new Error(`plans: 计划 ${plan.id} 的「${stage.zh}」这一档没写「为什么在这儿」`);
      }
    }

    // 同一条计划里同一个条目出现两次 —— 走到那儿会看到重复的一格，
    // 而且完成度的分母会虚高。
    const seen = new Map<string, string>();
    for (const stage of resolved.stages) {
      for (const item of stage.items) {
        const prev = seen.get(item.key);
        if (prev) {
          throw new Error(
            `plans: 计划 ${plan.id} 里 ${item.key} 出现两次（「${prev}」和「${stage.zh}」）`,
          );
        }
        seen.set(item.key, stage.zh);
      }
    }
  }
}
