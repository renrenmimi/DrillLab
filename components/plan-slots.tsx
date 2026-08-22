"use client";

// 计划零件的**懒加载插槽**。
//
// 【为什么必须这么做 —— 实测的数字】
// 计划要算完成度，就得展开计划，就得读 content/nav（120 KB 原始字节）
// 和 content/plans（40 KB）。第一版把 PlanChip / PlanPanel 直接 import 进
// 外壳（app-shell 在根 layout 里），于是**每一个路由**都开始下载 nav ——
// 那些原本不需要它的页面涨得最狠：
//
//   /drill/[id]   373 → 525 kB 原始字节（+152）
//   /code/[id]    387 → 539（+152）
//   课程页        470 → 625（+155）
//
// 而这些零件有一个共同点：**没跟计划的人身上它们一个字都不渲染**
// （每个都以 `if (!ready || !status) return null` 开头）。ready 又只有
// hydration 之后才为真。所以「先渲染再判断」白下了 160 KB。
//
// 现在反过来：
//   · 这个文件本身不 import 任何内容模块（只有 Link、progress、PlanMark）；
//   · 先用 useProgress 看一眼「有没有在跟计划」—— progress.tsx 本来就在外壳里；
//   · 真的在跟计划，才 next/dynamic 把 plan-kit 拉进来（独立异步 chunk）。
//
// 结果：没跟计划的人首屏字节和改动前一样；跟着计划的人在 hydration 之后
// 多下一个 chunk —— 而那正是那些零件本来就要等的时刻。
//
// 【为什么「计划」那个入口是静态的】
// 顶栏那枚徽标在没选计划时是一个普通的「计划」链接，它必须在首屏 HTML 里
// （否则四个模式会在 hydration 后横向跳一下）。所以它在这个文件里，
// 不走懒加载 —— 它只是一个 Link 加一个内联 SVG。

import dynamic from "next/dynamic";
import Link from "next/link";
import { useProgress } from "@/lib/progress";
import { PlanMark } from "./plan-mark";
import { T } from "./t";

/* ---------- 懒加载的真身 ---------- */

const LiveChip = dynamic(() => import("./plan-kit").then((m) => m.PlanChip), {
  ssr: false,
});
const LivePanel = dynamic(() => import("./plan-kit").then((m) => m.PlanPanel), {
  ssr: false,
});
const LiveBanner = dynamic(() => import("./plan-kit").then((m) => m.PlanItemBanner), {
  ssr: false,
});
const LiveNextStep = dynamic(() => import("./plan-kit").then((m) => m.PlanNextStep), {
  ssr: false,
});
const LiveStrip = dynamic(() => import("./plan-kit").then((m) => m.PlanStrip), {
  ssr: false,
});

/** 有没有在跟计划。只读 progress 里那一个字段，不碰内容模块 */
function useFollowing(): boolean {
  const { ready, activePlan } = useProgress();
  return ready && !!activePlan();
}

/* ---------- 顶栏 ---------- */

export function PlanChipSlot({ onNavigate }: { onNavigate?: () => void }) {
  const following = useFollowing();

  if (following) return <LiveChip onNavigate={onNavigate} />;

  // 没跟计划：一个静态入口，首屏 HTML 里就有
  return (
    <Link className="topbar-plan" href="/plans" data-empty onClick={onNavigate}>
      <PlanMark />
      <span className="topbar-plan-name">
        <T zh="计划" en="Plans" />
      </span>
    </Link>
  );
}

/* ---------- 侧栏 ---------- */

export function PlanPanelSlot({ onNavigate }: { onNavigate: () => void }) {
  return useFollowing() ? <LivePanel onNavigate={onNavigate} /> : null;
}

/* ---------- 页内 ---------- */

export function PlanItemBannerSlot({
  itemKey,
  compact,
}: {
  itemKey: string;
  compact?: boolean;
}) {
  return useFollowing() ? <LiveBanner itemKey={itemKey} compact={compact} /> : null;
}

export function PlanNextStepSlot({ itemKey }: { itemKey: string }) {
  return useFollowing() ? <LiveNextStep itemKey={itemKey} /> : null;
}

export function PlanStripSlot({ mode }: { mode: "learn" | "review" | "practice" | "assess" }) {
  return useFollowing() ? <LiveStrip mode={mode} /> : null;
}
