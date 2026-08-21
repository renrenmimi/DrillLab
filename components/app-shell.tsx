"use client";

// 外壳：顶栏 + 左侧学习路径 + 主内容（+ 可选右侧目录栏）。
//
// 【为什么又改了导航 —— 上一版仍然是错的】
//
// 上一版的分工是「顶栏 = 去哪儿，侧栏 = 我在学什么，侧栏只在课程页出现」。
// 使用者的反馈是：那七个已上线的 app「你点左边那栏，一步一步做，就不会错过
// 任何信息」，而这个不行 ——「你不知道该点左边还是该点 header 那些链接」。
//
// 病根不是标签起得不好，是**这个产品是二维的，而导航把两维拆给了两个控件**：
//   一维是学什么   —— foundations / react / federation / cab-booking / 八股
//   一维是给你多少 —— 八股 → 课内练习 → Coding → 考场（见 components/ladder.tsx）
// 两维正交，谁也不是谁的子集。侧栏管第一维、顶栏管第二维，于是站在任何
// 一页上都有两个都说得通的下一步，学的人得在脑子里拼一张矩阵才知道点哪个。
//
// 这一版只做一件事：**把第二维塞进第一维**。
//   · 侧栏常驻，每一页都在，就是那条唯一的阶梯；
//   · 主线按 prerequisites 排序并编号 01 起 —— 不是按 NAV 的登记顺序；
//   · 展开当前那门课时，四个难度档按顺序摊开：
//     课文（每节带自己的八股题数）→ Coding → 考场 → 模拟考；
//     哪一档没内容就不出现（给 foundations 挂个「Coding 0」只是噪音）；
//   · 面试八股没有前置、也没有课依赖它，所以不编号，单独放「平行支线」；
//   · 主线里第一门没做完的那门标「从这里开始 / 接着学」——
//     编号只说顺序，这个才回答「现在该进行哪一步」；
//   · 四张全量表（/drill /practice /code /arena）压到最下面一组：
//     竖着走一门课是主路，横着看一整档是另一种看法，都留着但不并列。
//
// 顶栏因此只剩跟学习内容无关的东西：品牌、搜索、语言、主题。
//
// 侧栏内容全部由 content/nav 和 content/path 推导 —— 加一门考试不用碰这个文件。

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ARENA,
  CODING,
  DRILLS,
  NAV,
  arenaPath,
  codingPath,
  examPath,
  lessonPath,
  type NavExam,
} from "@/content/nav";
import {
  arenaOfExam,
  codingOfExam,
  drillsOfExam,
  drillsOfLesson,
  pathGroups,
} from "@/content/path";
import { useLocale } from "@/lib/locale";
import { useProgress } from "@/lib/progress";
import { useTheme } from "@/lib/theme";
import { drillListHref } from "./drill-query";
import { Search } from "./search";
import { T } from "./t";

// 顶栏只留四项。
//
// 【为什么砍到四项】
// 使用者两次说「这几个我分不清」。7 项里有 4 项都是「做题」
// （八股 / Coding / 考场 / 模拟考），标签本身不带区别，光靠文案解释没用。
// 而且「模拟考」那 2 套题本来就在考场里（content/arena.ts 从它派生），
// 顶栏留两个入口指同一批数据，是「分不清」最直接的来源。
//
// 现在：
//   首页  唯一的主行动
//   课程  路线图（我在哪、下一步去哪）
//   练习  三种练法的 hub：八股 / Coding / 课内练习
//   考场  计时、无提示、答案锁死（模拟考在里面）
//
// /drill、/code、/mock、/reference 路由全部保留 —— 只是不再抢顶栏的视觉焦点。
const TOP_NAV = [
  { href: "/", zh: "首页", en: "Home" },
  { href: "/path", zh: "课程", en: "Learning path" },
  { href: "/practice", zh: "练习", en: "Practice" },
  { href: "/arena", zh: "考场", en: "Arena" },
  // 「使用说明」排在最后：它是第一次来才需要的，不该跟四条主线抢位置。
  // 但必须在顶栏里 —— 藏在首页某一段里的说明书等于没有。
  { href: "/guide", zh: "使用说明", en: "How to use" },
];

function Mark() {
  // 四根递减的柱子 —— 这个站的内核就是四条主线，每一条给你的脚手架比上一条少：
  // drill 给题目、practice 给挖好的空、code 给文件依赖测试，arena 只给一个空文件夹。
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
 * 一门课在侧栏里的那一节。
 *
 * 折叠时一行：编号、名字、进度。
 * 展开时（只有当前这门会展开）把这门课的四个难度档按顺序摊开 ——
 * 课文 → Coding → 考场 → 模拟考。顺序就是 Ladder 的顺序，不是随便排的。
 */
function ExamNode({
  exam,
  num,
  isNext,
  onNavigate,
}: {
  exam: NavExam;
  /** 主线才有编号；平行支线传 undefined */
  num?: number;
  /** 建议从这门开始 / 接着学 */
  isNext: boolean;
  onNavigate: () => void;
}) {
  const path = usePathname();
  const { locale } = useLocale();
  const { lessonDone, countLessons, ready } = useProgress();

  const isCurrent =
    path.startsWith(examPath(exam.id)) || path.startsWith(`/mock/${exam.id}`);
  const done = ready ? countLessons(exam.id) : 0;

  const coding = codingOfExam(exam.id);
  const arena = arenaOfExam(exam.id);
  const drills = drillsOfExam(exam.id);

  return (
    <div className="side-group">
      <Link
        className="side-exam"
        href={examPath(exam.id)}
        data-active={isCurrent || undefined}
        data-next={isNext || undefined}
        onClick={onNavigate}
      >
        <span className="side-exam-title">
          <span className="side-exam-idx tabular">
            {num === undefined ? "—" : String(num).padStart(2, "0")}
          </span>
          {exam.shortTitle}
          {exam.status === "draft" && (
            <span className="tag" style={{ fontSize: 10 }}>
              <T zh="草稿" en="Draft" />
            </span>
          )}
        </span>
        <span className="side-exam-meta">
          <T
            zh={`${done} / ${exam.lessonCount} 节${drills.length ? ` · ${drills.length} 道八股` : ""}`}
            en={`${done} / ${exam.lessonCount} lessons${drills.length ? ` · ${drills.length} drills` : ""}`}
          />
        </span>
        {/* 只在 ready 之后渲染 —— 进度在 localStorage 里，服务端不知道，
            提前渲染会 hydration 不一致。 */}
        {isNext && ready && (
          <span className="side-exam-next">
            {done === 0 ? (
              <T zh="从这里开始" en="Start here" />
            ) : (
              <T zh="接着学" en="Continue" />
            )}
          </span>
        )}
      </Link>

      {/* 【为什么模块要折叠】
          原来当前那门课的所有模块全展开 —— React 考试 21 节、八股 25 节
          堆成一长条，要找「我在哪」得整条扫一遍。
          现在只展开你正在读的那个模块，其余收起来。

          用原生 <details>：零 JS，键盘和屏幕阅读器都免费得到正确行为。
          open 由当前路径算出来，所以换页时会自动跟着走；
          中途手动展开别的模块也不会被打断（React 不会因为无关渲染去改它）。 */}
      {isCurrent &&
        exam.modules.map((mod) => {
          const hasCurrent = mod.lessons.some((l) => path === lessonPath(exam.id, l.id));
          const doneInMod = ready
            ? mod.lessons.filter((l) => lessonDone(exam.id, l.id)).length
            : 0;
          return (
            <details className="side-mod" key={mod.id} open={hasCurrent}>
              <summary className="side-mod-title">
                {mod.stage && <span className="side-mod-stage">{mod.stage}</span>}
                <span className="side-mod-name">{mod.title}</span>
                <span className="side-mod-count tabular">
                  {doneInMod}/{mod.lessons.length}
                </span>
              </summary>
              <ul className="side-lessons">
                {mod.lessons.map((lesson) => {
                  const href = lessonPath(exam.id, lesson.id);
                  // 这一节自己的八股题。105 道挂在 17 节课上，最多一节 12 道 ——
                  // 平铺进侧栏不可能，但标出数量并链到只筛这一节的题单可以。
                  const n = drillsOfLesson(lesson.id).length;
                  return (
                    <li key={lesson.id}>
                      <Link
                        className="side-lesson"
                        href={href}
                        data-active={path === href || undefined}
                        data-done={ready && lessonDone(exam.id, lesson.id) ? "true" : undefined}
                        onClick={onNavigate}
                      >
                        <span className="side-lesson-n">·</span>
                        <span>{lesson.title}</span>
                      </Link>
                      {n > 0 && (
                        <Link
                          className="side-drill-n tabular"
                          href={drillListHref({}, { lesson: lesson.id })}
                          onClick={onNavigate}
                          title={
                            locale === "en"
                              ? `${n} short questions from this lesson`
                              : `这一节的 ${n} 道八股题`
                          }
                        >
                          <T zh={`八股 ${n}`} en={`${n} drills`} />
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}

      {/* 课文之后是三个更高的难度档。哪一档没有内容就不出现 ——
          给 foundations 挂一个「Coding 0」只是噪音。 */}
      {isCurrent && coding.length > 0 && (
        <details className="side-mod" open={path.startsWith("/code")}>
          <summary className="side-mod-title">
            <span className="side-mod-stage">
              <T zh="写得对" en="Write it" />
            </span>
            {/* 不叫「Coding 题」：八股那门课里有个模块就叫「Coding 题：对照与补缺」，
                两个都以「Coding 题」开头挨在同一列里，正是使用者说的「分不清」。
                那个是讲题的课，这个是整套的题本身。 */}
            <span className="side-mod-name">
              <T zh="整套 Coding 题" en="Coding problems" />
            </span>
            <span className="side-mod-count tabular">{coding.length}</span>
          </summary>
          <ul className="side-lessons">
            {coding.map((c) => {
              const href = codingPath(c.id);
              return (
                <li key={c.id}>
                  <Link
                    className="side-lesson"
                    href={href}
                    data-active={path === href || undefined}
                    onClick={onNavigate}
                  >
                    <span className="side-lesson-n">·</span>
                    <span>{c.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </details>
      )}

      {isCurrent && arena.length > 0 && (
        <details className="side-mod" open={path.startsWith("/arena")}>
          <summary className="side-mod-title">
            <span className="side-mod-stage">
              <T zh="空手做" en="Build it blind" />
            </span>
            <span className="side-mod-name">
              <T zh="考场题" en="Arena" />
            </span>
            <span className="side-mod-count tabular">{arena.length}</span>
          </summary>
          <ul className="side-lessons">
            {arena.map((a) => {
              const href = arenaPath(a.id);
              return (
                <li key={a.id}>
                  <Link
                    className="side-lesson"
                    href={href}
                    data-active={path === href || undefined}
                    onClick={onNavigate}
                  >
                    <span className="side-lesson-n">·</span>
                    <span>{a.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </details>
      )}

      {isCurrent && exam.mockExams.length > 0 && (
        <div className="side-mod">
          <div className="side-mod-title">
            <T zh="模拟考" en="Mock exams" />
          </div>
          <ul className="side-lessons">
            {exam.mockExams.map((m) => {
              const href = `/mock/${exam.id}/${m.id}`;
              return (
                <li key={m.id}>
                  <Link
                    className="side-lesson"
                    href={href}
                    data-active={path === href || undefined}
                    onClick={onNavigate}
                  >
                    <span className="side-lesson-n">·</span>
                    <span>{m.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function Sidebar({
  open,
  onNavigate,
  panelRef,
  offscreen,
}: {
  open: boolean;
  onNavigate: () => void;
  panelRef: React.RefObject<HTMLElement | null>;
  /** 窄屏且抽屉关着 —— 此时侧栏在屏幕外，要整块移出可聚焦序列 */
  offscreen: boolean;
}) {
  const path = usePathname();
  const { countLessons, ready, reset } = useProgress();
  const { locale } = useLocale();

  const groups = pathGroups();
  const main = groups.find((g) => g.kind === "main")?.exams ?? [];

  // 「下一步该学哪门」：主线里第一门没做完的。
  // 这是使用者提的那个问题的直接答案（「第一步应该是从哪个内容学习」）——
  // 光有编号还不够，编号只说顺序，不说你走到哪了。
  // 平行支线不参与：它任何时候都能开始，谈不上「下一步」。
  const nextExam = ready
    ? main.find((e) => countLessons(e.id) < e.lessonCount)?.id
    : undefined;

  const exerciseTotal = NAV.reduce((n, e) => n + e.exerciseCount, 0);

  // 四张全量表。侧栏是竖着走一门课，这里是横着看同一批题的某一档 ——
  // 两种看法都留着，但竖的是主路，所以这一组压在最下面。
  const BANKS = [
    { href: "/drill", zh: "八股全表", en: "All drills", n: DRILLS.length },
    { href: "/practice", zh: "课内练习", en: "Lesson exercises", n: exerciseTotal },
    { href: "/code", zh: "Coding 全表", en: "All coding", n: CODING.length },
    { href: "/arena", zh: "考场全表", en: "All arena", n: ARENA.length },
    { href: "/reference", zh: "速查", en: "Reference", n: undefined },
  ];

  return (
    <aside
      className="sidebar"
      id="course-nav"
      data-open={open}
      aria-label={locale === "en" ? "Navigation" : "导航"}
      ref={panelRef}
      {...(open ? { role: "dialog", "aria-modal": true } : {})}
      // 在屏幕外时移出可聚焦序列，键盘不会 Tab 进看不见的链接
      inert={offscreen}
    >
      {/* 窄屏专用：顶栏在窄屏是隐藏的，主导航必须在抽屉里有一份 */}
      <nav className="side-top-nav" aria-label={locale === "en" ? "Main" : "主导航"}>
        {TOP_NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            data-active={(n.href === "/" ? path === "/" : path.startsWith(n.href)) || undefined}
            onClick={onNavigate}
          >
            <T zh={n.zh} en={n.en} />
          </Link>
        ))}
      </nav>

      {/* 注意用条件渲染而不是 hidden 属性 —— .side-head 是 display: flex，
          会盖掉 UA 样式表里的 [hidden] { display: none }（踩过）。 */}
      <div className="side-head">
        <span className="side-head-label">
          <T zh="学习路径" en="Learning path" />
        </span>
        <Link className="side-head-link" href="/path" onClick={onNavigate}>
          <T zh="看总览 →" en="Overview →" />
        </Link>
      </div>

      {groups.map((group) => (
        <div key={group.kind}>
          {/* 平行支线单独起一组，并且**不给编号**。
              它没有前置课，也没有课以它为前置 —— 编成 05 是在骗人。 */}
          {group.kind === "parallel" && (
            <div className="side-band">
              <span className="side-band-title">
                <T zh="平行支线" en="Parallel track" />
              </span>
              <span className="side-band-note">
                <T
                  zh="不依赖主线，任何时候都能开始"
                  en="No prerequisites — start any time"
                />
              </span>
            </div>
          )}
          {group.exams.map((exam, i) => (
            <ExamNode
              key={exam.id}
              exam={exam}
              num={group.kind === "main" ? i + 1 : undefined}
              isNext={exam.id === nextExam}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}

      <div className="side-band">
        <span className="side-band-title">
          <T zh="题库总表" en="Whole banks" />
        </span>
        <span className="side-band-note">
          <T
            zh="上面是竖着走一门课，这里是横着看同一档的全部题"
            en="Above walks one course down; these list one tier across all courses"
          />
        </span>
      </div>
      <nav className="side-banks" aria-label={locale === "en" ? "Question banks" : "题库"}>
        {BANKS.map((b) => (
          <Link
            key={b.href}
            href={b.href}
            data-active={path === b.href || undefined}
            onClick={onNavigate}
          >
            <T zh={b.zh} en={b.en} />
            {b.n !== undefined && <span className="side-bank-n tabular">{b.n}</span>}
          </Link>
        ))}
      </nav>

      <div className="side-foot">
        <p style={{ marginBottom: 8 }}>
          <T
            zh="进度只存在这台浏览器里（localStorage），不上传、不需要登录。"
            en="Progress lives only in this browser (localStorage). Nothing is uploaded, no sign-in."
          />
        </p>
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => {
            const msg =
              locale === "en"
                ? "Clear all progress? Checked lessons, solved exercises, rebuild and mock-exam records will be deleted. This cannot be undone."
                : "清空全部学习进度？已勾选的课程、做对的练习、从零重写与模拟考记录都会被删除，无法恢复。";
            if (window.confirm(msg)) reset();
          }}
        >
          <T zh="清空进度" en="Clear progress" />
        </button>
      </div>
    </aside>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { theme, toggle } = useTheme();
  const { locale, toggle: toggleLocale } = useLocale();

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
        ...panel.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)"),
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
      <header className="topbar" style={{ gridColumn: "1 / -1" }}>
        {/* 汉堡在桌面由 CSS 隐藏（那里侧栏是常驻列）；窄屏永远显示，
            因为抽屉同时承担主导航 */}
        {
          <button
            type="button"
            className="icon-btn menu-btn"
            ref={openerRef}
            aria-label={
              drawer
                ? en
                  ? "Close course contents"
                  : "收起课程目录"
                : en
                  ? "Open course contents"
                  : "打开课程目录"
            }
            aria-expanded={drawer}
            aria-controls="course-nav"
            onClick={() => setDrawer(!drawer)}
          >
            <svg width="17" height="17" viewBox="0 0 17 17" aria-hidden>
              <rect x="1" y="3" width="15" height="1.7" rx="0.85" fill="currentColor" />
              <rect x="1" y="7.6" width="15" height="1.7" rx="0.85" fill="currentColor" />
              <rect x="1" y="12.2" width="15" height="1.7" rx="0.85" fill="currentColor" />
            </svg>
          </button>
        }

        <Link className="topbar-brand" href="/">
          <Mark />
          DrillLab
        </Link>

        <nav className="topbar-nav" aria-label={en ? "Main navigation" : "主导航"}>
          {TOP_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              data-active={
                (n.href === "/" ? path === "/" : path.startsWith(n.href)) || undefined
              }
            >
              <T zh={n.zh} en={n.en} />
            </Link>
          ))}
        </nav>

        <div className="topbar-right">
          <Search />

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

      <div
        className="drawer-scrim"
        data-open={drawer || undefined}
        onClick={() => setDrawer(false)}
        aria-hidden
      />
      <Sidebar
        open={drawer}
        onNavigate={() => setDrawer(false)}
        panelRef={panelRef}
        offscreen={narrow && !drawer}
      />

      {children}
    </div>
  );
}
