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
import { ARENA, CODING, DRILLS, NAV, arenaPath, codingPath, drillPath, examPath, lessonPath, mockPath, navLessonsOf } from "@/content/nav";
import { stageEn } from "@/content/path";
import { useT } from "@/lib/locale";
import { allText, L, Loc, T, type LocalizedString } from "./t";

interface Hit {
  href: string;
  /** 类别标签。字符串 = 两种语言都用这个（考试名、track 名这类不翻） */
  kind: LocalizedString;
  title: LocalizedString;
  sub: LocalizedString;
  /** 参与匹配但不一定展示的文本。中英都要塞进来 —— 用哪种语言搜都得中 */
  haystack: string;
}

// 【两处过期信息在这一版修掉了】
//  · /path 原来写「八个阶段的完整路线」—— 全局 Stage 0–11 早就废了，
//    现在是「按考试分组 + 组内序号」，见 components/learning-path.tsx。
//  · /exams 这一条删掉了 —— 那个路由已经在 next.config.mjs 里重定向到 /path，
//    搜出来点进去等于原地跳转，纯噪音。
// 顺手把四条主线（八股 / Coding / 考场）补进来 —— 它们本来不在页面索引里。
/** 有沙箱的题数 —— 别硬写，nav 里 hasSandbox 就是真相 */
const SANDBOXED = CODING.filter((c) => c.hasSandbox).length;

const PAGES: Hit[] = [
  {
    href: "/",
    kind: L("页面", "Page"),
    title: L("首页", "Home"),
    sub: L("DrillLab 是什么、从哪开始", "What DrillLab is and where to start"),
    haystack: "首页 home 概览 overview start",
  },
  {
    href: "/path",
    kind: L("学课程", "Learn"),
    title: L("课程路线图", "Roadmap"),
    sub: L(`${NAV.length} 门课分组的完整路线`, `The full route, grouped by ${NAV.length} courses`),
    // 四个模式的名字都要能搜到 —— 一个人记住的是顶栏上那个词，
    // 不是路由名（见 lib/modes.ts）
    haystack: "学习路径 路线图 roadmap 课程 path 归档 学课程 learn 课文 lesson",
  },
  {
    href: "/drill",
    kind: L("背知识点", "Review"),
    title: L("八股题库", "Interview drills"),
    sub: L(`${DRILLS.length} 道问答，题库模式 + 抽认卡`, `${DRILLS.length} questions, bank mode and flashcards`),
    haystack: "八股 题库 抽认卡 drill flashcard 面试 interview 背知识点 review 复习",
  },
  {
    href: "/code",
    kind: L("做练习", "Practice"),
    title: L("Coding 题", "Coding problems"),
    sub: L(
      `${CODING.length} 道，${SANDBOXED} 道能在浏览器里跑`,
      `${CODING.length} problems, ${SANDBOXED} run in the browser`,
    ),
    haystack: "coding 题 沙箱 sandbox 浏览器 run 跑测试 做练习 practice",
  },
  {
    href: "/arena",
    kind: L("模拟考试", "Assess"),
    title: L("考场", "Arena"),
    sub: L(
      `${ARENA.length} 道 —— 空文件夹、计时、无提示`,
      `${ARENA.length} papers — empty folder, timed, no hints`,
    ),
    haystack: "考场 arena 从零重写 计时 timed 验收 模拟考试 assess",
  },
  {
    href: "/practice",
    kind: L("做练习", "Practice"),
    title: L("课内练习", "Lesson exercises"),
    sub: L("按课程 / 难度 / 题型筛练习", "Filter by course, level and kind"),
    haystack: "练习 练习场 填空 debug 难度 practice exercise 做练习 课内练习",
  },
  {
    href: "/mock",
    kind: L("模拟考试", "Assess"),
    title: L("模拟考", "Mock exams"),
    sub: L("换了场景、考点一致", "Different scenario, same skills tested"),
    haystack: "模拟考 mock 模拟",
  },
  {
    href: "/reference",
    kind: L("页面", "Page"),
    title: L("速查", "Reference"),
    sub: L("命令、SDL、状态码、报错对照表", "Commands, SDL, status codes, error table"),
    haystack: "速查 命令 报错 状态码 hooks sdl debug 清单 reference cheatsheet",
  },
];

/**
 * 建索引。
 *
 * deepText 是「那一节的全部可搜文本」—— 它来自 content/search-index.ts，
 * 那份数据 130 KB 出头，所以是**懒加载**的：第一次打开搜索时才 import()。
 * 还没加载完的时候 deepText 返回空串，索引照样能用，只是暂时只匹配
 * 标题和一句话简介 —— 用户敲第一个字就已经有结果，不会看到空白。
 */
function buildIndex(deepText: (examId: string, lessonId: string) => string): Hit[] {
  // 英文补上了就给双语，没补就退回中文字符串 —— 和 <T> 的回落行为一致。
  const loc = (zh: string, en?: string) => (en ? { zh, en } : zh);

  const out: Hit[] = [...PAGES];

  for (const exam of NAV) {
    out.push({
      href: examPath(exam.id),
      kind: L("考试", "Course"),
      title: loc(exam.title, exam.titleEn),
      sub: loc(exam.description, exam.descriptionEn),
      // 两种语言都进 haystack —— 否则英文界面下用英文词搜不到东西
      haystack: [
        exam.title,
        exam.titleEn,
        exam.shortTitle,
        exam.shortTitleEn,
        exam.description,
        exam.descriptionEn,
        exam.tests,
        exam.testsEn,
        ...exam.stack,
      ]
        .filter(Boolean)
        .join(" "),
    });

    for (const ref of navLessonsOf(exam)) {
      const l = ref.lesson;
      out.push({
        href: lessonPath(exam.id, l.id),
        kind: {
          zh: `${exam.shortTitle} · ${ref.module.stage ?? "课程"}`,
          en: `${exam.shortTitleEn ?? exam.shortTitle} · ${
            (ref.module.stage && stageEn(ref.module.stage)) ?? "Lesson"
          }`,
        },
        title: loc(l.title, l.titleEn),
        sub: loc(l.blurb, l.blurbEn),
        haystack: [l.title, l.titleEn, l.blurb, l.blurbEn, deepText(exam.id, l.id)]
          .filter(Boolean)
          .join(" "),
      });
    }

    for (const m of exam.mockExams) {
      out.push({
        href: mockPath(exam.id, m.id),
        kind: {
          zh: `${exam.shortTitle} · 模拟考`,
          en: `${exam.shortTitleEn ?? exam.shortTitle} · Mock exam`,
        },
        title: m.title,
        sub: m.scenario,
        haystack: [m.title, m.scenario, m.mirrors, ...m.taskTitles].join(" "),
      });
    }
  }

  /* ---- 刷题层：八股 / coding / 考场 ----
     中文问题和英文原题都要能搜到 —— 面试官念的是英文。
     题库编号也要能搜（用户会记 #305 这种）。 */

  for (const q of DRILLS) {
    out.push({
      href: drillPath(q.id),
      kind: L("八股题", "Drill"),
      title: q.zh,
      sub: q.en,
      haystack: [q.zh, q.en, q.track, ...q.bank.map((n) => `#${n}`), ...q.bank.map(String)].join(" "),
    });
  }

  for (const c of CODING) {
    out.push({
      href: codingPath(c.id),
      kind: L("Coding 题", "Coding"),
      title: c.title,
      // hasSandbox 才是「这一页真能跑」的真相；runnable 只表示「原理上能跑」。
      // 这里不能用 runnable —— 那会让 fetch-user 这种没沙箱的题也标成「可在浏览器跑」。
      sub: {
        zh: `${c.track} · 约 ${c.minutes} 分钟${c.hasSandbox ? " · 可在浏览器跑" : " · 需要本机跑"}`,
        en: `${c.track} · ~${c.minutes} min${c.hasSandbox ? " · runs in the browser" : " · run it locally"}`,
      },
      haystack: [
        c.title,
        c.track,
        c.hasSandbox ? "可运行 runnable 沙箱 sandbox browser" : "本机 local",
      ].join(" "),
    });
  }

  for (const a of ARENA) {
    out.push({
      href: arenaPath(a.id),
      kind: L("考场", "Arena"),
      title: a.title,
      sub: a.scenario,
      haystack: [a.title, a.scenario, "考场 arena 从零重写 计时 timed rebuild"].join(" "),
    });
  }

  return out;
}

export function Search() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const path = usePathname();
  const t = useT();

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

  const index = useMemo(() => buildIndex(deep ?? (() => "")), [deep]);

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
        setOpen((v) => !v);
      } else if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // 换页时关闭
  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    if (open) {
      setQ("");
      setCursor(0);
      // 等对话框挂上再聚焦
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setCursor(0);
  }, [q]);

  if (!open) {
    return (
      <button
        type="button"
        className="search-trigger"
        onClick={() => setOpen(true)}
        aria-label={t("搜索课程与练习", "Search lessons and problems")}
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

  return (
    <>
      <div className="search-scrim" onClick={() => setOpen(false)} aria-hidden />
      <div aria-label={t("搜索", "Search")} aria-modal className="search-panel" role="dialog">
        <input
          ref={inputRef}
          className="search-input"
          value={q}
          placeholder={t(
            "搜课程、练习、模拟考…（试试「filter」「DataLoader」「状态码」）",
            "Search lessons, problems, mocks… (try “filter”, “DataLoader”, “status code”)",
          )}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setOpen(false);
            } else if (e.key === "ArrowDown") {
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

        <div className="search-results">
          {hits.length === 0 ? (
            <p className="search-empty">
              <T en="Nothing matched. Try another word." zh="没有匹配的内容。换个词试试。" />
            </p>
          ) : (
            hits.map((h, i) => (
              <Link
                key={h.href}
                href={h.href}
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
