"use client";

// ⌘K 搜索。课、练习、八股、coding、考场题全部进索引（计数都从 nav 派生），
// 光靠侧栏翻太慢。
//
// 索引对象：平台页面、考试、课程（标题 + 一行钩子 + 考点）、模拟考，
// 加上刷题三层（八股 / coding / 考场）。
//
// 【双语】展示字段是 LocalizedString，但**匹配用 allText 拼中英两版** ——
// 搜索是找东西，不该被当前界面语言挡住。八股的英文原题尤其重要：
// 面试官念的是英文，用户会用英文搜。
// 匹配规则：把查询按空格切成词，每个词都要在标题或正文里出现（AND），
// 命中标题的排前面。纯前端、零依赖，数据来自轻量的 content/nav（不是全文内容）。

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/lib/locale";
import type { PlanHit } from "@/lib/plan-search";
import type { Hit } from "./search-data";
import { allText, Loc, T } from "./t";

/** 还没拉到计划条目时用它 —— 常量，免得每次渲染都造新数组触发 useMemo */
const EMPTY_PLAN_HITS: PlanHit[] = [];

type IndexModule = typeof import("./search-data");

export function Search() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  /** 打开之前焦点在哪 —— 关掉之后还回去（审查 A12） */
  const returnTo = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  const router = useRouter();
  const path = usePathname();
  const t = useT();

  const openSearch = () => {
    const a = document.activeElement;
    returnTo.current = a instanceof HTMLElement && a !== document.body ? a : null;
    setOpen(true);
  };

  /* ---- 索引本身：懒加载 ----

     建索引要读 content/nav（components/search-data.ts）。搜索框挂在根 layout 上，
     静态 import 的话 nav 就跟着进了每一页的首屏。所以第一次打开搜索时才拉。
     拉到之前结果区显示「正在载入」，通常只有一两百毫秒。 */
  const [data, setData] = useState<IndexModule | null>(null);

  useEffect(() => {
    if (!open || data) return;
    let alive = true;
    import("./search-data").then((mod) => {
      if (alive) setData(mod);
    });
    return () => {
      alive = false;
    };
  }, [open, data]);

  /* ---- 深层索引：懒加载 ----

     content/search-index.ts 里是 objectives / recap / conceptLedes 这些
     只给搜索用的字段，130 KB 出头。以前它们挂在 nav.ts 上，
     于是**每个页面**都白下 80 kB（gzip 后，实测占 /drill 首屏 JS 的 40%），
     而绝大多数访问根本不会按 ⌘K。

     现在：第一次打开搜索时才 import()。没加载完之前索引照常工作，
     只是暂时只匹配标题和一句话简介 —— 敲字立刻有结果，不会卡在空白。
     加载完成后 setDeep 触发一次重建，深层匹配随即生效。 */
  const [deep, setDeep] = useState<((examId: string, lessonId: string) => string) | null>(null);

  useEffect(() => {
    if (!open || deep) return;
    let alive = true;
    import("@/content/search-index").then((mod) => {
      if (alive) setDeep(() => mod.searchTextOf);
    });
    return () => {
      alive = false;
    };
  }, [open, deep]);

  /* ---- 引导计划的条目：同样懒加载 ----

     计划清单（content/plan-manifest.ts）80 KB 出头。搜索框挂在根 layout 上，
     每个路由都会下载它 —— 清单不该跟着白下。所以和深层索引一样，
     第一次打开搜索时才拉；没拉到之前搜索照常工作，只是暂时搜不到计划。 */
  const [plans, setPlans] = useState<PlanHit[]>(EMPTY_PLAN_HITS);

  useEffect(() => {
    if (!open || plans.length > 0) return;
    let alive = true;
    import("@/lib/plan-search").then((mod) => {
      if (alive) setPlans(mod.planHits());
    });
    return () => {
      alive = false;
    };
  }, [open, plans]);

  const index = useMemo(
    () => (data ? data.buildIndex(deep ?? (() => ""), plans) : []),
    [data, deep, plans],
  );

  const hits = useMemo(() => {
    const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return index.slice(0, 8);

    const scored: { hit: Hit; score: number }[] = [];
    for (const hit of index) {
      // allText 把中英两版都拼进来 —— 用哪种语言搜都得中。
      const title = allText(hit.title).toLowerCase();
      const hay = (title + " " + allText(hit.sub) + " " + hit.haystack).toLowerCase();
      // 每个词都要命中（AND）
      if (!terms.every((t) => hay.includes(t))) continue;
      // 标题命中的排前面；命中越靠前分越高
      const inTitle = terms.filter((t) => title.includes(t)).length;
      scored.push({ hit, score: inTitle * 100 - title.indexOf(terms[0]) });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 12).map((s) => s.hit);
  }, [q, index]);

  // ⌘K / Ctrl+K 打开，/ 也能打开（不在输入框里时）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA";
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) setOpen(false);
        else openSearch();
      } else if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        openSearch();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // 换页时关闭 —— 新页面从头开始，焦点不用还回旧页面的元素
  useEffect(() => {
    returnTo.current = null;
    setOpen(false);
  }, [path]);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      setQ("");
      setCursor(0);
      // 等对话框挂上再聚焦
      window.requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    // 关掉之后焦点还回去：打开之前那个元素还在页面上就回它，否则回搜索按钮。
    // 曾经一关就落到 body 上，键盘用户得从页首重新 Tab（审查 A12）。
    const back = returnTo.current;
    returnTo.current = null;
    window.requestAnimationFrame(() => {
      const target = back && back.isConnected ? back : triggerRef.current;
      target?.focus({ preventScroll: true });
    });
  }, [open]);

  useEffect(() => {
    setCursor(0);
  }, [q]);

  if (!open) {
    return (
      <button
        type="button"
        className="search-trigger"
        ref={triggerRef}
        onClick={openSearch}
        aria-label={t("搜索课程与练习", "Search lessons and problems")}
        aria-haspopup="dialog"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M9.2 9.2 12.4 12.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span className="search-trigger-label">
          <T en="Search" zh="搜索" />
        </span>
        <kbd className="search-kbd">⌘K</kbd>
      </button>
    );
  }

  const activeId = hits[cursor] ? `search-hit-${cursor}` : undefined;

  return (
    <>
      <div className="search-scrim" onClick={() => setOpen(false)} aria-hidden />
      <div
        aria-label={t("搜索", "Search")}
        aria-modal
        className="search-panel"
        role="dialog"
        ref={panelRef}
        // 【Esc 和 Tab 在面板上统一处理】Esc 曾经只挂在输入框上 —— 焦点到了结果链接上
        // 就关不掉；Tab 也会一路走出对话框，走到背后的页面里（审查 A12）。
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
            return;
          }
          if (e.key !== "Tab") return;
          const items = [
            ...(panelRef.current?.querySelectorAll<HTMLElement>("input, a[href], button") ?? []),
          ];
          if (items.length === 0) return;
          const first = items[0];
          const last = items[items.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }}
      >
        <input
          ref={inputRef}
          className="search-input"
          value={q}
          role="combobox"
          aria-expanded
          aria-controls="search-results"
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          /* 【占位符要短】原来那一句带三个例子，在 360px 的输入框里被切在词
             中间（"...(try "filte"），看着像坏了。例子本来就由下面的结果列表
             自己演示 —— 一打开就有六条默认结果。 */
          placeholder={t("搜课程、练习、八股、考场…", "Search lessons, problems, questions…")}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setCursor((c) => Math.min(hits.length - 1, c + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setCursor((c) => Math.max(0, c - 1));
            } else if (e.key === "Enter" && hits[cursor]) {
              e.preventDefault();
              setOpen(false);
              router.push(hits[cursor].href);
            }
          }}
        />

        <div
          className="search-results"
          id="search-results"
          role="listbox"
          aria-label={t("搜索结果", "Search results")}
        >
          {!data ? (
            <p className="search-empty">
              <T en="Loading the index…" zh="正在载入索引…" />
            </p>
          ) : hits.length === 0 ? (
            <p className="search-empty">
              <T en="Nothing matched. Try another word." zh="没有匹配的内容。换个词试试。" />
            </p>
          ) : (
            hits.map((h, i) => (
              <Link
                key={h.href}
                href={h.href}
                id={`search-hit-${i}`}
                role="option"
                aria-selected={i === cursor}
                className="search-hit"
                data-on={i === cursor || undefined}
                onMouseEnter={() => setCursor(i)}
                onClick={() => setOpen(false)}
              >
                <span className="search-hit-kind">
                  <Loc v={h.kind} />
                </span>
                <span className="search-hit-title">
                  <Loc v={h.title} />
                </span>
                <span className="search-hit-sub">
                  <Loc v={h.sub} />
                </span>
              </Link>
            ))
          )}
        </div>

        <div className="search-foot">
          <span>
            <kbd className="search-kbd">↑</kbd>
            <kbd className="search-kbd">↓</kbd> <T en="move" zh="选择" />
          </span>
          <span>
            <kbd className="search-kbd">↵</kbd> <T en="open" zh="打开" />
          </span>
          <span>
            <kbd className="search-kbd">Esc</kbd> <T en="close" zh="关闭" />
          </span>
          <span style={{ marginLeft: "auto" }}>
            <T
              en={`${index.length} things indexed`}
              zh={`共 ${index.length} 条可搜内容`}
            />
          </span>
        </div>
      </div>
    </>
  );
}
