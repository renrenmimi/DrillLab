// 计划的标记 —— 单独一个文件，因为它要被**两边**用：
// 一边是外壳里那个不加载任何内容的静态入口（components/plan-slots.tsx），
// 一边是真正的计划零件（components/plan-kit.tsx）。
// 放在 plan-kit 里就会把 content/plans 和 content/nav 拖进外壳的首屏包。
//
// 图形是一条竖着的路线：两个空心站点、一条线、一个实心终点。
// 三处刻意的处理：
// ① 终点实心并用 var(--accent)，前面两站空心 —— 和品牌那个「四根递减的柱子」
//    同一个语气：越往后越是主角。
// ② 竖着而不是横着。计划页的路线图就是竖的，图标和它同向。
// ③ 只有三站。四站在 14px 里挤成一团，两站看不出「一条路」。

export function PlanMark({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden>
      <path
        d="M7 2.6 V11.4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.4"
      />
      <circle cx="7" cy="2.6" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.55" />
      <circle cx="7" cy="7" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.55" />
      <circle cx="7" cy="11.4" r="2.1" fill="var(--accent)" />
    </svg>
  );
}
