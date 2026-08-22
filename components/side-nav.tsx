"use client";

// 侧栏的**主导航** —— 全站唯一一套，位置在每一页上都一样。
//
// 顺序是刻意的：
//   ① 品牌
//   ② 今天 / 我的计划       —— 「我在准备什么」
//   ③ 计划进度 + 一颗〔继续〕 —— 「下一步做哪一件事」
//   ④ 资料库 / 检验 / 速查   —— 「让我自己挑」
//
// ③ 在 ④ 上面，是因为「继续」是这个产品的主动作。把它放在导航列表下面，
// 它就变成了第九个链接。
//
// 【这个文件不许 import 任何内容模块】
// 它每一页都渲染。lib/side-nav.ts 是静态结构（没有计数），
// 计划那一块是懒加载的（components/plan-slots.tsx）——
// 没跟计划的人身上它一个字节都不下载。

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/locale";
import { activeSideHref, SIDE_NAV } from "@/lib/side-nav";
import { SideContinue } from "./continue";
import { PlanSideSlot } from "./plan-slots";
import { T } from "./t";

/** 四根递减的柱子 —— 见 app-shell.tsx 里那段完整说明 */
export function Mark({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      <rect x="2" y="3" width="3" height="14" rx="1" fill="currentColor" opacity="0.32" />
      <rect x="6.5" y="7" width="3" height="10" rx="1" fill="currentColor" opacity="0.32" />
      <rect x="11" y="11" width="3" height="6" rx="1" fill="currentColor" opacity="0.32" />
      <rect x="15.5" y="15" width="3" height="2" rx="1" fill="var(--accent)" />
      <path
        d="M2 18.4 H18.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.32"
      />
    </svg>
  );
}

export function SideNav({ onNavigate }: { onNavigate: () => void }) {
  const path = usePathname();
  const { locale } = useLocale();
  const en = locale === "en";
  const active = activeSideHref(path);

  return (
    <div className="snav">
      <Link className="snav-brand" href="/" onClick={onNavigate}>
        <Mark size={19} />
        <span className="snav-brand-name display">DrillLab</span>
      </Link>

      <nav className="snav-main" aria-label={en ? "Main" : "主导航"}>
        {SIDE_NAV.map((g, gi) => (
          <div className="snav-group" key={gi}>
            {g.zh && (
              <div className="snav-group-title">
                <T zh={g.zh} en={g.en} />
              </div>
            )}
            <ul className="snav-list">
              {g.items.map((it) => {
                const on = active === it.href;
                return (
                  <li key={it.href}>
                    <Link
                      className="snav-item"
                      href={it.href}
                      data-active={on || undefined}
                      aria-current={on ? "page" : undefined}
                      onClick={onNavigate}
                    >
                      <T zh={it.zh} en={it.en} />
                    </Link>
                  </li>
                );
              })}
            </ul>
            {/* 计划那一块插在「今天 / 我的计划」之后 —— 它回答的是
                「下一步做哪一件事」，必须在资料库那一组上面。 */}
            {gi === 0 && (
              <div className="snav-plan">
                <PlanSideSlot onNavigate={onNavigate} />
                <SideContinue onNavigate={onNavigate} />
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
