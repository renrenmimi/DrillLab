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
import { sectionOf } from "@/lib/side-nav";
import { useTheme } from "@/lib/theme";
import { ContinueButton } from "./continue";
import { Search } from "./search";
import { Mark, SideNav } from "./side-nav";
import { ContextSidebar } from "./sidebars";
import { T } from "./t";

/**
 * 右边那个 ? 菜单 —— 「使用说明」和「速查表」的家。
 *
 * 速查表在侧栏里也有一项。这里留着它是因为「卡住了想查一下」发生在读课文的
 * 中途，那时手在顶栏（搜索旁边），不在侧栏底部。
 *
 * 【键盘和焦点】
 * 点按钮开合；开着时 Esc 关闭并把焦点还给按钮；焦点离开这一块也关闭。
 * 三个行为都不依赖 hover —— 触屏上 hover 菜单等于没有。
 */
function HelpMenu() {
  const path = usePathname();
  const { locale } = useLocale();
  const en = locale === "en";
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    };
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <div
      className="helpmenu"
      ref={wrapRef}
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        type="button"
        className="icon-btn"
        ref={btnRef}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={en ? "Help and reference" : "帮助与速查"}
        title={en ? "Help and reference" : "帮助与速查"}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
          <circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path
            d="M6.1 6.1a1.95 1.95 0 1 1 2.9 1.7c-.6.35-1 .8-1 1.5v.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <circle cx="8" cy="11.9" r="0.85" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div className="helpmenu-panel" role="menu" ref={panelRef}>
          <Link className="helpmenu-item" role="menuitem" href="/guide">
            <span className="helpmenu-item-name">
              <T zh="使用说明" en="How to use this" />
            </span>
            <span className="helpmenu-item-sub">
              <T
                zh="按什么顺序走、每天怎么用、考前一周怎么冲"
                en="What order to go in, how to use it day to day"
              />
            </span>
          </Link>
          <Link className="helpmenu-item" role="menuitem" href="/reference">
            <span className="helpmenu-item-name">
              <T zh="速查表" en="Reference" />
            </span>
            <span className="helpmenu-item-sub">
              <T
                zh="命令、API、状态码、报错对照 —— 查完就走"
                en="Commands, APIs, status codes, error tables"
              />
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { theme, toggle } = useTheme();
  const { locale, toggle: toggleLocale } = useLocale();

  const mode = modeOf(path);
  // 分隔线以下那一段（当前模式自己的结构）只在模式页面上有内容
  const hasCtx = mode !== undefined;
  const section = sectionOf(path);

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
    panel?.querySelector<HTMLElement>("a, button")?.focus();

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

  return (
    <div className="shell">
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
        <Link className="topbar-brand" href="/">
          <Mark />
          <span className="topbar-brand-name display">DrillLab</span>
        </Link>

        {/* 「我在哪」。只给区段名 —— 页面标题就在下面那行 h1 上。 */}
        <div className="topbar-loc" aria-hidden={!section}>
          {section && (
            <span className="topbar-loc-name">
              <T zh={section.zh} en={section.en} />
            </span>
          )}
        </div>

        <div className="topbar-tools">
          {/* 窄屏顶栏里的〔继续〕—— 桌面上它在侧栏。
              手机上第一屏必须能看到主动作，而侧栏在抽屉后面。 */}
          <div className="topbar-cont">
            <ContinueButton />
          </div>
          <Search />
          <HelpMenu />

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
