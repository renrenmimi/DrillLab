"use client";

// 外壳：顶栏 + 随模式而变的侧栏 + 主内容（+ 可选右侧目录栏）。
//
// 【这一版换掉了什么，以及为什么】
//
// 上一版是「一个常驻侧栏装下全部」：完整课程树 + 平行支线 + 四张全量表 +
// 速查 + 清空进度，全部同时露出。它解决了上上一版「不知道该点左边还是点上边」
// 的问题，但换来一个更根本的毛病 ——
//
//   **要先读懂这个站的内容模型，才能决定点哪儿。**
//
// 一个刚来的人不知道该从哪开始；一个只想复习 React 的人也得先穿过课程结构。
// 而这个产品明明有五种都成立的用法：跟着课程走 / 用抽认卡背知识点 /
// 按题目找练习 / 进考场计时 / 只在卡住时查课文。
//
// 所以这一版把导航拆成两个问题，分给两个控件：
//
//   顶栏：我现在想做哪一类事？   → 四个模式（lib/modes.ts）
//   侧栏：在这件事里我在哪、下一步是什么？ → 四个侧栏（components/sidebars.tsx）
//
// 顶栏因此从「首页 / 使用说明」两个弱链接，换成四个真正的产品模式，
// 再加一颗「继续」—— 回头客打开站的第一个念头是「我上次到哪了」，
// 那个答案以前只在首页，而且只认课文。
//
// 「使用说明」没有删，它退到右边那个 ? 菜单里 —— 它是第一次来才需要的，
// 不该占着四个一级位置里的一个。
//
// 四档难度（说得出 / 认得出 / 写得对 / 空手做）也没有删，
// 它仍然是 components/ladder.tsx 那套解释，只是不再自己充当一级导航：
// 它现在分布在 Review / Practice / Assess 三个模式里。
//
// 首页、使用说明、速查、计划页不属于任何模式，所以它们**没有侧栏**
// （data-nav="off"）—— 首页本身就是那张仪表盘，/plans 本身就是那张选择表。
//
// 【这一轮加的：引导计划】
// 四个模式解决了「我想做哪一类事」，但四个里只有 Learn 是线性的 ——
// Review / Practice / Assess 仍然是题库和筛选器。所以顶栏在四个模式**左边**
// 多了一枚计划徽标（中间一条竖线隔开，因为它和那四项不是同一类东西：
// 四项是活动，它是一条路），侧栏顶部多了一块计划面板。
// 两个入口互补，不是替代：计划回答「下一步做什么」，四个模式回答「让我自己挑」。

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale } from "@/lib/locale";
import { MODES, modeOf } from "@/lib/modes";
import { useTheme } from "@/lib/theme";
import { ContinueButton } from "./continue";
import { PlanChipSlot, PlanPanelSlot } from "./plan-slots";
import { Search } from "./search";
import { ContextSidebar } from "./sidebars";
import { T } from "./t";

function Mark() {
  // 四根递减的柱子 —— 这个站的内核就是「越往后给你的脚手架越少」：
  // 八股给题目、练习给挖好的空、coding 给文件依赖测试，考场只给一个空文件夹。
  // 所以柱子从高到低，最后一根只剩底座。
  //
  // 三处刻意的处理，别当成手滑改掉：
  // ① 前三根用 currentColor 压到 0.32，第四根用 var(--accent) 实色。
  //    「给你的东西是背景，自己写出来的才是主角」，跟全站「只有强调色是彩色主角」一致。
  //    两个颜色都跟着主题走，深浅两套不用各画一份。
  // ② 第四根不画成 0 高，留 2 个单位当底座 —— 画成 0 会读作只有三根。
  // ③ 底下那条基线比柱子两端各出挑一点（x 从 2 到 18.5）。四根柱子站在同一条线上，
  //    这条线同时也是「空文件夹」的那个底；去掉它，四根柱子会散开读作柱状图。
  //
  // 柱子等宽等距，和 hamburger 那三条横线方向相反，不会认错。
  //
  // 【favicon 那份的两个坑】app/icon.svg 是同一个符号，但它要过 Next 的
  // metadata 图片解析器，比这里严格两条：
  // ① 前导注释不能长。它只嗅探文件开头有限的字节去找 <svg>，注释太长就直接
  //    报「not a valid image file」。原来那份沙漏注释 301 字符能过，写到 652 就挂。
  //    所以完整设计说明放在这里，那份只留两行指过来。
  // ② SVG 内部和注释里都不能出现连续两个横线。XML 规范不允许 -- 出现在注释中，
  //    所以那边写「accent，#547563」而不是把 CSS 变量名原样抄进去。
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden>
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

/**
 * 右边那个 ? 菜单 —— 「使用说明」和「速查表」的家。
 *
 * 【为什么这两项不进顶栏】
 * 它们不是「我现在想做哪一类事」的答案：使用说明是第一次来读一遍的，
 * 速查表是卡住了才翻的。放在一级位置会挤掉真正的四个模式，
 * 而顶栏一旦变成工具条，四个模式就不再显眼了。
 *
 * 【键盘和焦点】
 * 点按钮开合；开着时 Esc 关闭并把焦点还给按钮；焦点离开这一块（Tab 出去、
 * 点别处）也关闭。三个行为都不依赖 hover —— 触屏上 hover 菜单等于没有。
 */
function HelpMenu() {
  const path = usePathname();
  const { locale } = useLocale();
  const en = locale === "en";
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // 换页时收起
  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    if (!open) return;
    // 打开时把焦点移进菜单，否则键盘用户按了回车之后还停在按钮上
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
        // relatedTarget 是焦点即将去的地方。还在这一块里就不关。
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
  // 首页 / 使用说明 / 速查不属于任何模式 —— 它们没有侧栏，也就没有抽屉按钮
  const hasSidebar = mode !== undefined;

  // 【答案 tab 跟着界面语言走】
  // AnswerTabs 是纯 CSS 的 radio tab（正文留在服务端，不进客户端 chunk），
  // 所以 CSS 没法替它选中另一个 radio。结果是英文界面下答案 tab 仍停在「中文」——
  // tab 就在眼前，但英文读者得自己点一下才看到英文答案。
  //
  // 这里只做一件事：语言变化时（含首次挂载）把页面上所有答案 tab 拨到对应那一档。
  // 不传任何内容进来，所以正文照旧留在服务端。
  // 之后用户手动点 tab 不会被打断 —— 这个 effect 只在 locale 变化时跑。
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
    const mq = window.matchMedia("(max-width: 900px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // 换页时收起抽屉
  useEffect(() => {
    setDrawer(false);
  }, [path]);

  // 抽屉打开时：Esc 关闭 + 焦点锁在抽屉内 + 关闭后焦点还给汉堡按钮
  useEffect(() => {
    if (!drawer) return;

    const panel = panelRef.current;
    // 打开时把焦点移进抽屉，否则键盘用户还停在按钮上
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
    <div className="shell" data-nav={hasSidebar ? undefined : "off"}>
      <header className="topbar">
        {/* 汉堡只在「这一页有侧栏」且窄屏时出现。桌面由 CSS 隐藏 ——
            那里侧栏是常驻列，没有可开合的东西。 */}
        {hasSidebar && (
          <button
            type="button"
            className="icon-btn menu-btn"
            ref={openerRef}
            aria-label={
              drawer
                ? en
                  ? "Close section navigation"
                  : "收起本区导航"
                : en
                  ? "Open section navigation"
                  : "打开本区导航"
            }
            aria-expanded={drawer}
            aria-controls="context-nav"
            onClick={() => setDrawer(!drawer)}
          >
            <svg width="17" height="17" viewBox="0 0 17 17" aria-hidden>
              <rect x="1" y="3" width="15" height="1.7" rx="0.85" fill="currentColor" />
              <rect x="1" y="7.6" width="15" height="1.7" rx="0.85" fill="currentColor" />
              <rect x="1" y="12.2" width="15" height="1.7" rx="0.85" fill="currentColor" />
            </svg>
          </button>
        )}

        <Link className="topbar-brand" href="/">
          <Mark />
          DrillLab
        </Link>

        {/* 计划徽标 + 四个模式。**只有这一份 DOM** —— 窄屏靠 grid-area 把它
            整块挪到第二行，不是另渲染一份。渲染两份会在无障碍树里留下两个
            同名的导航地标。
            计划徽标 flex 不参与均分（flex: 0 0 auto），所以四个模式在窄屏
            仍然是等宽四格。 */}
        <nav className="topbar-nav" aria-label={en ? "Where to go" : "去哪儿"}>
          <PlanChipSlot />
          <span className="topbar-navsep" aria-hidden />
          {MODES.map((m) => {
            const on = mode === m.id;
            return (
              <Link
                key={m.id}
                className="topbar-mode"
                href={m.href}
                data-active={on || undefined}
                aria-current={on ? "page" : undefined}
                title={en ? m.blurbEn : m.blurbZh}
              >
                <T zh={m.zh} en={m.en} />
              </Link>
            );
          })}
        </nav>

        <div className="topbar-right">
          <ContinueButton />
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

      {hasSidebar && (
        <>
          <div
            className="drawer-scrim"
            data-open={drawer || undefined}
            onClick={() => setDrawer(false)}
            aria-hidden
          />
          <aside
            className="sidebar"
            id="context-nav"
            data-open={drawer}
            aria-label={en ? "Where you are" : "本区导航"}
            ref={panelRef}
            {...(drawer ? { role: "dialog", "aria-modal": true } : {})}
            // 在屏幕外时移出可聚焦序列，键盘不会 Tab 进看不见的链接
            inert={narrow && !drawer}
          >
            {/* 计划面板在侧栏最上面，且**只给四样**：叫什么、走到哪、
                这一档是什么、下一格是什么。侧栏剩下的部分照旧是当前模式
                自己的结构 —— 不把整条计划搬进来。没跟计划时它什么都不渲染。 */}
            <PlanPanelSlot onNavigate={() => setDrawer(false)} />
            <ContextSidebar mode={mode} onNavigate={() => setDrawer(false)} />
          </aside>
        </>
      )}

      {children}
    </div>
  );
}
