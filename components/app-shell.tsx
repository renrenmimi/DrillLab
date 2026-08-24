"use client";

// 外壳（UI v2）：**左侧一套导航，顶栏只有工具。**
//
// 【这一版换掉了什么，以及为什么】
//
// 上一版是「顶栏 = 模式，侧栏 = 那个模式的结构」。那一步解决了更早那版
// 「不知道该点左边还是点上边」，但它自己留下一个更难受的毛病：
//
//   **两套导航同屏竞争。**
//
// 顶栏上同时有：品牌、计划徽标（带 4/130）、四个模式、一颗「继续」、
// 搜索、帮助、语言、主题 —— 九件东西，其中三件都在说「往这儿走」。
// 侧栏上同时有：计划面板（含「下一步」卡）、「接着学」大按钮、
// 全局课文进度、课程树、「下一节」卡 —— 又是五件，其中三件还在说
// 「往这儿走」。
//
// 结果是「下一步做哪一件事」被稀释成六七个都挺重要的东西。
//
// 现在的分工只有一句话：
//
//   侧栏回答「去哪儿」（导航），顶栏回答「我在哪」（位置）加四个工具。
//
// 具体：
// ① **顶栏不再有任何导航。** 四个模式整块搬进侧栏的「资料库 / 检验」两组，
//    位置在每一页上都一样（见 lib/side-nav.ts）。
// ② **「继续」全站只有一颗**，在侧栏计划块的正下方（components/continue.tsx
//    的 SideContinue）。首页和计划详情页除外 —— 那两页的主内容本身
//    就是这颗按钮的放大版，同屏两个入口等于没有入口。
// ③ 侧栏**上半（导航位）在所有页面完全一致**，只有分隔线以下那一段随页面变
//    （课程页给课程路线图、八股页给方向筛选……）。导航位一动，人就得重新找。
// ④ 侧栏现在**每一页都有**（老版本首页 / /plans / /guide / /reference 没有）。
//    没有侧栏的页面等于把导航藏起来，而这四页恰好是新访客最先看到的。
//
// 【为什么只渲染一份 DOM】
// 窄屏靠 CSS 把 .sidebar 变成抽屉，不是另渲染一份。渲染两份会在无障碍树里
// 留下两个同名的导航地标，读屏的人会听到两遍。

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale } from "@/lib/locale";
import { modeOf } from "@/lib/modes";
import { locationOf } from "@/lib/side-nav";
import { useTheme } from "@/lib/theme";
import { cedesContinue, ContinueButton } from "./continue";
import { Search } from "./search";
import { Mark, SideNav } from "./side-nav";
import { ContextSidebar } from "./sidebars";
import { T } from "./t";


export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { theme, toggle } = useTheme();
  const { locale, toggle: toggleLocale } = useLocale();

  const mode = modeOf(path);
  // 分隔线以下那一段（当前模式自己的结构）只在模式页面上有内容
  const hasCtx = mode !== undefined;
  const loc = locationOf(path);

  // 【答案 tab 跟着界面语言走】
  // AnswerTabs 是纯 CSS 的 radio tab（正文留在服务端，不进客户端 chunk），
  // 所以 CSS 没法替它选中另一个 radio。这里只在语言变化时把页面上所有
  // 答案 tab 拨到对应那一档，不传任何内容进来。
  useEffect(() => {
    const cls = locale === "en" ? "ans-radio-en" : "ans-radio-zh";
    document.querySelectorAll<HTMLInputElement>(`.${cls}`).forEach((r) => {
      r.checked = true;
    });
  }, [locale]);

  const [drawer, setDrawer] = useState(false);
  const panelRef = useRef<HTMLElement | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  // 初始 false，与服务端渲染一致；挂载后才根据实际视口修正
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 960px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setDrawer(false);
  }, [path]);

  // 抽屉打开时：Esc 关闭 + 焦点锁在抽屉内 + 关闭后焦点还给汉堡按钮
  useEffect(() => {
    if (!drawer) return;

    const panel = panelRef.current;
    // 【必须挑「看得见的」那一个】抽屉里第一个 a 是品牌，而品牌在窄屏是
    // display: none（顶栏已经有一份）。对它调 focus() 什么都不会发生，
    // 于是焦点留在 body 上 —— 打开抽屉之后按 Tab 要从整页开头走一遍。
    const firstVisible = [
      ...(panel?.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)") ?? []),
    ].find((el) => el.getClientRects().length > 0);
    firstVisible?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setDrawer(false);
        openerRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !panel) return;

      const focusable = [
        ...panel.querySelectorAll<HTMLElement>("a[href], button:not(:disabled), summary"),
      ].filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawer]);

  const en = locale === "en";

  /* 语言和主题。**在所有宽度上都直接留在顶栏** ——
     它们是随时会按的偏好开关，尤其语言：这个站每一段文字都有中英两版。
     上一版为了在 390px 上腾地方，把这两颗收进了那个 ? 菜单，
     结果是手机上根本找不到怎么换语言（用户报的）。
     腾地方改成别的办法：窄屏收起品牌字样（只留标记），
     并且把「使用说明」搬进侧栏 —— 它和速查一样是「要用时才查」的东西，
     不该占着顶栏一个 44px 的位置。 */
  const tools = (
    <>
      <button
        type="button"
        className="lang-btn"
        onClick={toggleLocale}
        aria-label={en ? "Switch to Chinese" : "切换到英文"}
        title={en ? "Switch to Chinese" : "切换到英文"}
      >
        <span data-lang="zh">中</span>
        <span data-lang="en">EN</span>
      </button>

      <button
        type="button"
        className="icon-btn"
        onClick={toggle}
        aria-label={
          theme === "light"
            ? en
              ? "Switch to dark"
              : "切换到深色"
            : en
              ? "Switch to light"
              : "切换到浅色"
        }
        title={
          theme === "light"
            ? en
              ? "Switch to dark"
              : "切换到深色"
            : en
              ? "Switch to light"
              : "切换到浅色"
        }
      >
        {theme === "light" ? (
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
            <path
              d="M13.2 10.4A5.6 5.6 0 0 1 5.6 2.8a5.6 5.6 0 1 0 7.6 7.6Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
            <circle cx="8" cy="8" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
              <path d="M8 1v1.8M8 13.2V15M1 8h1.8M13.2 8H15M3.1 3.1l1.3 1.3M11.6 11.6l1.3 1.3M12.9 3.1l-1.3 1.3M4.4 11.6l-1.3 1.3" />
            </g>
          </svg>
        )}
      </button>
    </>
  );

  // 【为什么要这个标记】窄屏顶栏排成两行（见 styles/shell.css 那段算式）：
  // 六个 44px 的目标加上「DrillLab」字样，在 360px 上量出来 377px，
  // 一行放不下。第二行只在这一页真有那颗〔继续〕时才占位置，
  // 所以那一行的高度不能写死在 :root 上 —— 挂在这里，CSS 按它改 --topbar-h。
  const hasCont = !cedesContinue(path);

  return (
    <div className="shell" data-cont={hasCont || undefined}>
      {/* ---------- 顶栏：位置 + 四个工具，一个导航链接都没有 ---------- */}
      <header className="topbar">
        {/* 汉堡只在窄屏出现。桌面上侧栏是常驻列，没有可开合的东西。 */}
        <button
          type="button"
          className="icon-btn menu-btn"
          ref={openerRef}
          aria-label={
            drawer
              ? en
                ? "Close navigation"
                : "收起导航"
              : en
                ? "Open navigation"
                : "打开导航"
          }
          aria-expanded={drawer}
          aria-controls="main-nav"
          onClick={() => setDrawer(!drawer)}
        >
          <svg width="17" height="17" viewBox="0 0 17 17" aria-hidden>
            <rect x="1" y="3" width="15" height="1.7" rx="0.85" fill="currentColor" />
            <rect x="1" y="7.6" width="15" height="1.7" rx="0.85" fill="currentColor" />
            <rect x="1" y="12.2" width="15" height="1.7" rx="0.85" fill="currentColor" />
          </svg>
        </button>

        {/* 品牌只在窄屏的顶栏出现 —— 桌面上它在侧栏顶部。
            CSS 控制显隐，DOM 只有这一份。 */}
        {/* 360px 以下字样会被 CSS 收起来，所以这里给一个固定的可访问名 ——
            不然那时候这个链接只剩一个 aria-hidden 的图形，读屏念不出东西。 */}
        <Link className="topbar-brand" href="/" aria-label="DrillLab">
          <Mark />
          <span className="topbar-brand-name display">DrillLab</span>
        </Link>

        {/* 「我在哪」。一级页面一段（今天 / 学课程……），深页面两段
            （学课程 / React 考试）。**永远不写页面标题** —— 那就在下面
            一行的 h1 上，写两遍是重复。顶栏是 sticky 的，所以正文那条
            面包屑滚走之后，这一条还在。 */}
        {loc ? (
          <nav className="topbar-loc" aria-label={en ? "Location" : "当前位置"}>
            {loc.sub ? (
              <Link className="topbar-loc-up" href={loc.sectionHref}>
                <T zh={loc.section.zh} en={loc.section.en} />
              </Link>
            ) : (
              <span className="topbar-loc-name">
                <T zh={loc.section.zh} en={loc.section.en} />
              </span>
            )}
            {loc.sub && (
              <>
                <span className="topbar-loc-sep" aria-hidden>
                  /
                </span>
                <span className="topbar-loc-name" aria-current="page">
                  <T zh={loc.sub.zh} en={loc.sub.en} />
                </span>
              </>
            )}
          </nav>
        ) : (
          <div className="topbar-loc" />
        )}

        {/* 窄屏顶栏里的〔继续〕—— 桌面上它在侧栏（CSS 收起）。
            手机上第一屏必须能看到主动作，而侧栏在抽屉后面。
            首页和计划详情页不给 —— 那两页的主内容本身就是这颗按钮。
            【它是 .topbar 的直接子元素，不在工具组里】窄屏要把它整个换到
            第二行去，而工具组是同一行右边那一簇。 */}
        {hasCont && (
          <div className="topbar-cont">
            <ContinueButton />
          </div>
        )}

        <div className="topbar-tools">
          <Search />
          {tools}
        </div>
      </header>

      {/* ---------- 侧栏：全站唯一一套导航 ---------- */}
      <div
        className="drawer-scrim"
        data-open={drawer || undefined}
        onClick={() => setDrawer(false)}
        aria-hidden
      />
      <aside
        className="sidebar"
        id="main-nav"
        data-open={drawer}
        aria-label={en ? "Navigation" : "导航"}
        ref={panelRef}
        {...(drawer ? { role: "dialog", "aria-modal": true } : {})}
        // 在屏幕外时移出可聚焦序列，键盘不会 Tab 进看不见的链接
        inert={narrow && !drawer}
      >
        <SideNav onNavigate={() => setDrawer(false)} />

        {/* 分隔线以下：当前这一类事情自己的结构。导航位以上的部分不动。 */}
        {hasCtx && (
          <div className="sidebar-ctx">
            <ContextSidebar mode={mode} onNavigate={() => setDrawer(false)} />
          </div>
        )}
      </aside>

      {children}
    </div>
  );
}
