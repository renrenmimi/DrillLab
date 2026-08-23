"use client";

// 四个「随模式而变」的侧栏。
//
// 【分工】
// 顶栏回答：我现在想做哪一类事？（见 lib/modes.ts）
// 侧栏回答：在这件事里，我在哪、下一步是什么？
//
// 所以任何时候侧栏里**只有一个模式的结构**：
//   Learn    只有课程路线图 —— 四张全量表一个都不出现
//   Review   只有方向和掌握状态 —— 完整课程树一节都不出现
//   Practice 先选「课内练习 / Coding」，选完才摊开那一档自己的筛选项
//   Assess   只有考场和模拟考，按科目分组，带上你之前的尝试
//
// 上一版把这四样叠在同一个常驻侧栏里，于是一个人得先把这个站的内容模型
// 读懂，才能决定点哪儿。这一版每个模式最多两三组，一屏之内看得完。
//
// 【为什么全部只 import content/nav】
// 客户端组件一旦 import content/registry 或 content/exams/*，全部课程正文
// 会被打进同一个 chunk（实测踩过一次，784 KB，每页都下载）。
// 侧栏只需要标题和数字，nav.ts 就是那份「只有文字和数字」的镜像。

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ARENA,
  CODING,
  DRILLS,
  DRILL_TRACK_LABEL,
  DRILL_TRACK_ORDER,
  NAV,
  arenaPath,
  examPath,
  lessonPath,
  navExam,
  navLessonsOf,
  type NavExam,
} from "@/content/nav";
import { pathGroups, stageEn } from "@/content/path";
import {
  CODING_TRACK_LABEL,
  CODING_TRACK_ORDER,
  DIFFICULTY_LABEL,
} from "@/lib/coding-labels";
import { KIND_LABEL, LEVEL_LABEL, type ExerciseKind } from "@/lib/exercise-labels";
import { codingHref, practiceHref, queryOfHref } from "@/lib/list-query";
import { useLocale } from "@/lib/locale";
import { modeById, type ModeId } from "@/lib/modes";
import { useProgress } from "@/lib/progress";
import { attemptMs, bestPass, fmtClock } from "./arena-bits";
import { lessonPositionOf, useLearnTarget, useResume } from "./continue";
import { drillListHref } from "./drill-query";
import { T } from "./t";

/* ============================================================
   公用零件
   ============================================================ */

/**
 * 每个模式最上面那一个主行动。
 *
 * 一个模式只给一颗 —— 「下一步做什么」不该有两个同样显眼的答案。
 */
function CtxCta({
  href,
  label,
  item,
  sub,
  tone,
  onNavigate,
}: {
  href: string;
  label: ReactNode;
  item?: ReactNode;
  sub?: ReactNode;
  tone?: "live";
  onNavigate: () => void;
}) {
  return (
    <Link className="ctx-cta" data-tone={tone} href={href} onClick={onNavigate}>
      <span className="ctx-cta-label">{label}</span>
      {item && <span className="ctx-cta-item">{item}</span>}
      {sub && <span className="ctx-cta-sub">{sub}</span>}
    </Link>
  );
}

function CtxSec({
  title,
  note,
  link,
  children,
  label,
}: {
  title: ReactNode;
  /** 分节标题右边那条安静的链接（「看总览 →」这一类）。
      上一版它在一个单独的 .ctx-head 里，于是侧栏多出一层标题 ——
      而模式名在主导航里已经高亮着了，那一层是重复的。 */
  link?: { href: string; zh: string; en: string };
  note?: ReactNode;
  children: ReactNode;
  /** <nav> 的无障碍名字。只能是字符串，所以调用方用 useT() 取 */
  label: string;
}) {
  return (
    <nav className="ctx-sec" aria-label={label}>
      <div className="ctx-sec-head">
        <span className="ctx-sec-row">
          <span className="ctx-sec-title">{title}</span>
          {link && (
            <Link className="ctx-sec-link" href={link.href}>
              <T zh={link.zh} en={link.en} />
            </Link>
          )}
        </span>
        {note && <span className="ctx-sec-note">{note}</span>}
      </div>
      {children}
    </nav>
  );
}

/** 一行：名字在左，数量贴右。四个侧栏的清单都用它。 */
function CtxItem({
  href,
  active,
  label,
  n,
  sub,
  tone,
  onNavigate,
}: {
  href: string;
  active?: boolean;
  label: ReactNode;
  n?: number;
  sub?: ReactNode;
  tone?: "ok" | "warn" | "live";
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link
        className="ctx-item"
        href={href}
        data-active={active || undefined}
        data-tone={tone}
        aria-current={active ? "true" : undefined}
        onClick={onNavigate}
      >
        <span className="ctx-item-label">{label}</span>
        {n !== undefined && <span className="ctx-item-n tabular">{n}</span>}
        {sub && <span className="ctx-item-sub">{sub}</span>}
      </Link>
    </li>
  );
}

/* ============================================================
   Learn —— 只有课程路线图
   ============================================================ */

/** 从路径里认出「现在在哪一节课」。/exams/<examId>/<lessonId> */
function lessonOfPath(path: string) {
  const m = /^\/exams\/([^/]+)\/([^/]+)$/.exec(path);
  if (!m) return undefined;
  const exam = navExam(m[1]);
  if (!exam) return undefined;
  const ref = navLessonsOf(exam).find((r) => r.lesson.id === m[2]);
  return ref ? { exam, ref } : undefined;
}

function examOfPath(path: string) {
  const m = /^\/exams\/([^/]+)/.exec(path);
  return m ? navExam(m[1]) : undefined;
}

function LearnSide({ onNavigate }: { onNavigate: () => void }) {
  const path = usePathname();
  const { locale } = useLocale();
  const { ready, countLessons, activePlan } = useProgress();
  const en = locale === "en";

  /* ---- 这一段不再有「接着学」那颗按钮 ----

     UI v2 把「继续」收成了全站唯一一颗，在侧栏导航位下面
     （components/continue.tsx 的 SideContinue）。这一段是**当前这一类
     事情的结构**，不是第二个主动作。

     上一版这里有一颗实心大按钮，而它正上方还有计划面板的「下一步」卡 ——
     两张一模一样的实心块，都写着「往这儿走」，等于没有入口。
     那一版靠一个信号 context 去比较两处的 href、把其中一处降级；
     这一版结构上就只剩一处，那套比较连带 lib/plan-signal.tsx 一起删掉了。 */
  const groups = pathGroups();
  const main = groups.find((g) => g.kind === "main")?.exams ?? [];
  // 「接着学」的目标和 /path 页顶那条共用一份（components/continue.tsx）——
  // 各算各的实测就会在同一屏上给出两个不同的「从这里开始」。
  const { target: startTarget, resumed } = useLearnTarget();

  const here = lessonOfPath(path);
  const currentExam = here?.exam ?? examOfPath(path);

  // 主线里第一门没做完的那门 —— 编号只说顺序，这个才回答「现在该进行哪一步」。
  // 平行支线不参与：它任何时候都能开始，谈不上「下一步」。
  const nextExamId = ready
    ? main.find((e) => countLessons(e.id) < e.lessonCount)?.id
    : undefined;

  // 展开哪一门（永远只有一门）：
  //   在课程页上 → 就是这一门
  //   不在（比如站在 /path）→ 「接着学」那颗按钮指向的那一门，
  //     否则主线里第一门没做完的，再否则第一门。
  //   中间这一条不能省：按钮说「接着学 React 的某一节」而侧栏展开的是
  //   地基，等于同一屏上两个说法。
  const openExamId =
    currentExam?.id ??
    lessonPositionOf(startTarget.href)?.examId ??
    nextExamId ??
    main[0]?.id ??
    NAV[0]?.id;

  return (
    <>
      {/* 【这里原本有一条「3 / 80 节读完」的全局进度条，删掉了】
          两个理由：① 它正上方就是计划那条 4 / 130，两个总量条叠在一起，
          人得先分辨哪个是哪个；② 下面每一门课自己都写着 3 / 9、0 / 21，
          那是能直接动手的数字，而 80 分之几不是。 */}

      {groups.map((group) => (
        <CtxSec
          key={group.kind}
          label={
            group.kind === "main"
              ? en
                ? "Courses"
                : "课程"
              : en
                ? "Parallel track"
                : "平行支线"
          }
          link={
            group.kind === "main"
              ? { href: "/path", zh: "看总览 →", en: "Roadmap →" }
              : undefined
          }
          title={
            group.kind === "main" ? (
              <T zh="课程" en="Courses" />
            ) : (
              <T zh="平行支线" en="Parallel track" />
            )
          }
          note={
            group.kind === "parallel" ? (
              <T
                zh="不依赖主线，任何时候都能开始"
                en="No prerequisites — start any time"
              />
            ) : undefined
          }
        >
          {group.exams.map((exam, i) => (
            <CourseNode
              key={exam.id}
              exam={exam}
              num={group.kind === "main" ? i + 1 : undefined}
              open={exam.id === openExamId}
              isNext={exam.id === nextExamId}
              currentLessonId={here?.ref.lesson.id}
              onNavigate={onNavigate}
            />
          ))}
        </CtxSec>
      ))}
    </>
  );
}

function CourseNode({
  exam,
  num,
  open,
  isNext,
  currentLessonId,
  onNavigate,
}: {
  exam: NavExam;
  /** 主线才有编号；平行支线不编号 —— 它没有前置，编成 05 是在说一个不存在的顺序 */
  num?: number;
  open: boolean;
  isNext: boolean;
  currentLessonId?: string;
  onNavigate: () => void;
}) {
  const path = usePathname();
  const { ready, lessonDone, countLessons } = useProgress();

  const done = ready ? countLessons(exam.id) : 0;
  const lessons = navLessonsOf(exam);
  const indexOf = new Map(lessons.map((r) => [r.lesson.id, r.index]));
  const nextRef = ready ? lessons.find((r) => !lessonDone(exam.id, r.lesson.id)) : undefined;
  const overview = examPath(exam.id);

  return (
    <div className="ctx-course" data-open={open || undefined}>
      <Link
        className="ctx-course-top"
        href={overview}
        data-active={open || undefined}
        data-next={isNext || undefined}
        aria-current={path === overview ? "page" : undefined}
        onClick={onNavigate}
      >
        {/* 平行支线没有编号。上一版这里放了一个 ✦ —— 那个字符在
            这一版的显示字族里没有字形，实际渲染成一个空方块。
            现在留空：编号本来就是「主线第几门」的意思，支线不该有。 */}
        <span className="ctx-course-idx tabular" aria-hidden>
          {num === undefined ? "" : String(num).padStart(2, "0")}
        </span>
        <span className="ctx-course-name">
          <T zh={exam.shortTitle} en={exam.shortTitleEn} />
        </span>
        <span className="ctx-course-n tabular">
          {done} / {exam.lessonCount}
        </span>
      </Link>

      {/* 【为什么这里不再有那个柠檬绿药丸】
          它曾经是一个实心的「Start here」小胶囊，孤零零挂在课程行下面 ——
          而侧栏里唯一该是实心强调色的东西是那颗〔继续〕。
          现在改成一行安静的说明，和别的行同一条轴。
          只在 ready 之后渲染 —— 进度在 localStorage 里，服务端不知道，
          提前渲染会 hydration 不一致。 */}
      {isNext && ready && (
        <span className="ctx-course-flag">
          {done === 0 ? <T zh="从这门开始" en="Start with this one" /> : <T zh="接着学这门" en="Pick this up" />}
        </span>
      )}

      {open && (
        <>
          {/* 「下一节还没读的是哪一节」。当前那一节在下面高亮着，
              但如果你正在回看一节早就读过的课，这一行才是「下一步」。 */}
          {nextRef && nextRef.lesson.id !== currentLessonId && (
            <Link
              className="ctx-course-next"
              href={lessonPath(exam.id, nextRef.lesson.id)}
              onClick={onNavigate}
            >
              <span className="ctx-course-next-label">
                <T zh="下一节" en="Next up" />
              </span>
              <span className="ctx-course-next-title">
                <span className="tabular">{String(nextRef.index).padStart(2, "0")}</span>{" "}
                <T zh={nextRef.lesson.title} en={nextRef.lesson.titleEn} />
              </span>
            </Link>
          )}

          {exam.modules.map((mod) => {
            const hasCurrent = mod.lessons.some((l) => l.id === currentLessonId);
            const hasNext = !currentLessonId && !!nextRef && mod.lessons.some((l) => l.id === nextRef.lesson.id);
            const doneInMod = ready
              ? mod.lessons.filter((l) => lessonDone(exam.id, l.id)).length
              : 0;
            return (
              // 原生 <details>：零 JS，键盘和屏幕阅读器都免费得到正确行为。
              // open 由当前路径算出来，换页时自动跟着走；中途手动展开别的模块
              // 也不会被打断（React 不会因为无关渲染去改它）。
              <details className="ctx-mod" key={mod.id} open={hasCurrent || hasNext}>
                <summary className="ctx-mod-head">
                  {mod.stage && (
                    <span className="ctx-mod-stage">
                      {/* stage 是「<课程名> · 第 N 部分」，这里只要后半截。
                          英文那半必须走 stageEn()（「Part 2」）—— 直接给 undefined
                          会让 <T> 回落中文，于是一列英文里夹着「第 2 部分」。 */}
                      <T
                        zh={mod.stage.replace(/^.*· /, "")}
                        en={stageEn(mod.stage)?.replace(/^.*· /, "")}
                      />
                    </span>
                  )}
                  <span className="ctx-mod-name">
                    <T zh={mod.title} en={mod.titleEn} />
                  </span>
                  <span className="ctx-mod-n tabular">
                    {doneInMod}/{mod.lessons.length}
                  </span>
                </summary>
                <ul className="ctx-lessons">
                  {mod.lessons.map((lesson) => {
                    const href = lessonPath(exam.id, lesson.id);
                    const active = path === href;
                    return (
                      <li key={lesson.id}>
                        <Link
                          className="ctx-lesson"
                          href={href}
                          data-active={active || undefined}
                          data-done={
                            ready && lessonDone(exam.id, lesson.id) ? "true" : undefined
                          }
                          aria-current={active ? "page" : undefined}
                          onClick={onNavigate}
                        >
                          <span className="ctx-lesson-n tabular">
                            {String(indexOf.get(lesson.id) ?? 0).padStart(2, "0")}
                          </span>
                          <span className="ctx-lesson-t">
                            <T zh={lesson.title} en={lesson.titleEn} />
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </details>
            );
          })}
        </>
      )}
    </div>
  );
}

/* ============================================================
   Review —— 只有方向和掌握状态
   ============================================================ */

const TRACK_COUNT = DRILL_TRACK_ORDER.map((t) => ({
  track: t,
  n: DRILLS.filter((d) => d.track === t).length,
})).filter((x) => x.n > 0);

/** 今天自评过几道。时间戳在 DrillRecord.at 里，不用另存一份「今天」。 */
function sameDay(ms: number, now: number) {
  const a = new Date(ms);
  const b = new Date(now);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function ReviewSide({ onNavigate }: { onNavigate: () => void }) {
  const path = usePathname();
  const { locale } = useLocale();
  const { ready, data, drillCounts } = useProgress();
  const resume = useResume("review");
  const en = locale === "en";

  const c = ready ? drillCounts() : { known: 0, fuzzy: 0, unknown: 0, untouched: 0 };
  const touched = Math.min(DRILLS.length, c.known + c.fuzzy + c.unknown);
  const unseen = DRILLS.length - touched;
  const needsReview = c.fuzzy + c.unknown;

  // 只在 ready 之后算 —— Date.now() 在服务端和客户端不一样，提前算会 hydration 不一致
  const today = ready
    ? Object.values(data.drills).filter((r) => sameDay(r.at, Date.now())).length
    : 0;

  // 当前筛的是哪一档。**不读 URL** —— 读的是列表页写进进度的那条 href，
  // 理由见 components/recent.tsx 顶部。
  const q = queryOfHref(resume?.href);
  const onList = path === "/drill";
  const curTrack = onList ? (q.track ?? "all") : undefined;
  const curMark = onList ? (q.mark ?? "all") : undefined;

  return (
    <>
      <CtxCta
        href="/drill/session"
        onNavigate={onNavigate}
        label={<T zh="开始一轮抽认卡" en="Start a flashcard round" />}
        sub={
          <T
            zh="一次一题，空格翻面，1 / 2 / 3 自评"
            en="One card at a time · space to flip · 1 / 2 / 3 to rate"
          />
        }
      />

      <div className="ctx-stat">
        <span className="ctx-stat-cell">
          <b className="tabular">{today}</b>
          <T zh="今天过了" en="reviewed today" />
        </span>
        <span className="ctx-stat-cell" data-tone={needsReview > 0 ? "warn" : undefined}>
          <b className="tabular">{needsReview}</b>
          <T zh="要复习" en="needs review" />
        </span>
        <span className="ctx-stat-cell" data-tone={c.known > 0 ? "ok" : undefined}>
          <b className="tabular">{c.known}</b>
          <T zh="已掌握" en="confident" />
        </span>
      </div>

      {curTrack && curTrack !== "all" && (
        <p className="ctx-now">
          <T zh="当前方向：" en="Now on: " />
          <strong>
            <T
              zh={DRILL_TRACK_LABEL[curTrack as keyof typeof DRILL_TRACK_LABEL]?.zh ?? curTrack}
              en={DRILL_TRACK_LABEL[curTrack as keyof typeof DRILL_TRACK_LABEL]?.en}
            />
          </strong>
        </p>
      )}

      <CtxSec
        label={en ? "Question topics" : "题目方向"}
        title={<T zh="方向" en="Topics" />}
        link={{ href: "/drill", zh: "全部 →", en: "All →" }}
      >
        <ul className="ctx-list">
          <CtxItem
            href={drillListHref({}, {})}
            active={curTrack === "all"}
            label={<T zh="全部题目" en="All questions" />}
            n={DRILLS.length}
            onNavigate={onNavigate}
          />
          {TRACK_COUNT.map((x) => (
            <CtxItem
              key={x.track}
              href={drillListHref({}, { track: x.track })}
              active={curTrack === x.track}
              label={
                <T zh={DRILL_TRACK_LABEL[x.track].zh} en={DRILL_TRACK_LABEL[x.track].en} />
              }
              n={x.n}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </CtxSec>

      <CtxSec
        label={en ? "By what you know" : "按掌握状态"}
        title={<T zh="按掌握状态" en="By what you know" />}
        note={
          <T
            zh="自评结果决定抽认卡下一轮先抽谁"
            en="Your own ratings decide what the next round shows first"
          />
        }
      >
        <ul className="ctx-list">
          <CtxItem
            href={drillListHref({}, { mark: "none" })}
            active={curMark === "none"}
            label={<T zh="还没做" en="Not seen" />}
            n={ready ? unseen : undefined}
            onNavigate={onNavigate}
          />
          <CtxItem
            href={drillListHref({}, { mark: "review" })}
            active={curMark === "review"}
            label={<T zh="要复习" en="Needs review" />}
            n={ready ? needsReview : undefined}
            tone={needsReview > 0 ? "warn" : undefined}
            onNavigate={onNavigate}
          />
          <CtxItem
            href={drillListHref({}, { mark: "known" })}
            active={curMark === "known"}
            label={<T zh="已掌握" en="Confident" />}
            n={ready ? c.known : undefined}
            tone={c.known > 0 ? "ok" : undefined}
            onNavigate={onNavigate}
          />
        </ul>
      </CtxSec>
    </>
  );
}

/* ============================================================
   Practice —— 两个子模式，只摊开当前那一个的筛选项
   ============================================================ */

const EXERCISE_TOTAL = NAV.reduce((n, e) => n + e.exerciseCount, 0);
const KIND_TOTAL = (k: ExerciseKind) =>
  NAV.reduce((n, e) => n + (e.exerciseKinds[k] ?? 0), 0);
const LEVEL_TOTAL = (l: number) =>
  NAV.reduce((n, e) => n + (e.exerciseLevels[String(l)] ?? 0), 0);

// 「浏览器里能跑」= 有沙箱且标了 runnable。这里读的是 nav 的 hasSandbox
// （客户端拿不到 content/coding 的正文），和列表页那边现算的结果一致。
const BROWSER_COUNT = CODING.filter((c) => c.runnable && c.hasSandbox).length;
const LOCAL_COUNT = CODING.length - BROWSER_COUNT;

function PracticeSide({ onNavigate }: { onNavigate: () => void }) {
  const path = usePathname();
  const { locale } = useLocale();
  const resume = useResume("practice");
  const en = locale === "en";

  // 子模式由路径决定，不由状态决定 —— /practice 和 /code 都是真实路由，
  // 所以「我在哪一档」永远没有歧义。
  const onCoding = path === "/code" || path.startsWith("/code/");
  const q = queryOfHref(resume?.href);
  // 只有当那条 recent 记录确实是当前这一档的，才拿它的筛选条件打高亮
  const forThis = (resume?.href ?? "").startsWith(onCoding ? "/code" : "/practice");
  const cur = (k: string, dflt = "all") => (forThis ? (q[k] ?? dflt) : dflt);

  return (
    <>
      <nav
        className="ctx-sub"
        aria-label={en ? "Practice kind" : "练习类别"}
      >
        <Link
          className="ctx-sub-btn"
          href="/practice"
          data-on={!onCoding || undefined}
          aria-current={!onCoding ? "true" : undefined}
          onClick={onNavigate}
        >
          <span className="ctx-sub-name">
            <T zh="课内练习" en="Lesson exercises" />
          </span>
          <span className="ctx-sub-n tabular">{EXERCISE_TOTAL}</span>
        </Link>
        <Link
          className="ctx-sub-btn"
          href="/code"
          data-on={onCoding || undefined}
          aria-current={onCoding ? "true" : undefined}
          onClick={onNavigate}
        >
          <span className="ctx-sub-name">
            <T zh="Coding 题" en="Coding problems" />
          </span>
          <span className="ctx-sub-n tabular">{CODING.length}</span>
        </Link>
      </nav>

      <p className="ctx-sub-note">
        {onCoding ? (
          <T
            zh={`一道一道写完整的题，${BROWSER_COUNT} 道能直接在浏览器里跑测试。`}
            en={`Whole problems, one at a time — ${BROWSER_COUNT} of them run their tests right in the browser.`}
          />
        ) : (
          <T
            zh="跟着课文走的练习：填空、写整块、Debug Lab。检查是正则匹配，不跑代码。"
            en="The exercises that follow the lessons: blanks, whole blocks, debug labs. The check is a regex match, it does not run your code."
          />
        )}
      </p>

      {onCoding ? (
        <>
          <CtxSec label={en ? "Coding topic" : "Coding 方向"} title={<T zh="方向" en="Topic" />}>
            <ul className="ctx-list">
              <CtxItem
                href={codingHref(q, { track: "all" })}
                active={cur("track") === "all"}
                label={<T zh="全部方向" en="All topics" />}
                n={CODING.length}
                onNavigate={onNavigate}
              />
              {CODING_TRACK_ORDER.map((t) => (
                <CtxItem
                  key={t}
                  href={codingHref(q, { track: t })}
                  active={cur("track") === t}
                  label={CODING_TRACK_LABEL[t]}
                  n={CODING.filter((c) => c.track === t).length}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </CtxSec>

          <CtxSec label={en ? "Coding difficulty" : "Coding 难度"} title={<T zh="难度" en="Difficulty" />}>
            <ul className="ctx-list">
              <CtxItem
                href={codingHref(q, { diff: "all" })}
                active={cur("diff") === "all"}
                label={<T zh="全部难度" en="Any" />}
                onNavigate={onNavigate}
              />
              {([1, 2, 3] as const).map((d) => (
                <CtxItem
                  key={d}
                  href={codingHref(q, { diff: String(d) })}
                  active={cur("diff") === String(d)}
                  label={<T zh={DIFFICULTY_LABEL[d].zh} en={DIFFICULTY_LABEL[d].en} />}
                  n={CODING.filter((c) => c.difficulty === d).length}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </CtxSec>

          <CtxSec label={en ? "Where it runs" : "在哪跑"} title={<T zh="怎么跑" en="How it runs" />}>
            <ul className="ctx-list">
              <CtxItem
                href={codingHref(q, { run: "all" })}
                active={cur("run") === "all"}
                label={<T zh="不限" en="Either" />}
                onNavigate={onNavigate}
              />
              <CtxItem
                href={codingHref(q, { run: "browser" })}
                active={cur("run") === "browser"}
                label={<T zh="浏览器里能跑" en="Runs in the browser" />}
                n={BROWSER_COUNT}
                onNavigate={onNavigate}
              />
              <CtxItem
                href={codingHref(q, { run: "local" })}
                active={cur("run") === "local"}
                label={<T zh="只能本机跑" en="Local only" />}
                n={LOCAL_COUNT}
                onNavigate={onNavigate}
              />
            </ul>
          </CtxSec>
        </>
      ) : (
        <>
          <CtxSec label={en ? "Exercise course" : "练习所属课程"} title={<T zh="课程" en="Course" />}>
            <ul className="ctx-list">
              <CtxItem
                href={practiceHref(q, { exam: "all", page: "1" })}
                active={cur("exam") === "all"}
                label={<T zh="全部课程" en="All courses" />}
                n={EXERCISE_TOTAL}
                onNavigate={onNavigate}
              />
              {NAV.filter((e) => e.exerciseCount > 0).map((e) => (
                <CtxItem
                  key={e.id}
                  href={practiceHref(q, { exam: e.id, page: "1" })}
                  active={cur("exam") === e.id}
                  label={<T zh={e.shortTitle} en={e.shortTitleEn} />}
                  n={e.exerciseCount}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </CtxSec>

          <CtxSec
            label={en ? "Exercise level" : "练习难度"}
            title={<T zh="难度" en="Level" />}
            note={
              <T
                zh="L1 → L4：给你的东西越来越少"
                en="L1 → L4: less is handed to you"
              />
            }
          >
            <ul className="ctx-list">
              <CtxItem
                href={practiceHref(q, { level: "all", page: "1" })}
                active={cur("level") === "all"}
                label={<T zh="全部难度" en="Any" />}
                onNavigate={onNavigate}
              />
              {[1, 2, 3, 4].map((l) => (
                <CtxItem
                  key={l}
                  href={practiceHref(q, { level: String(l), page: "1" })}
                  active={cur("level") === String(l)}
                  label={LEVEL_LABEL[l]}
                  n={LEVEL_TOTAL(l)}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </CtxSec>

          <CtxSec label={en ? "Exercise kind" : "练习题型"} title={<T zh="题型" en="Kind" />}>
            <ul className="ctx-list">
              <CtxItem
                href={practiceHref(q, { kind: "all", page: "1" })}
                active={cur("kind") === "all"}
                label={<T zh="全部题型" en="Any" />}
                onNavigate={onNavigate}
              />
              {(Object.keys(KIND_LABEL) as ExerciseKind[]).map((k) => (
                <CtxItem
                  key={k}
                  href={practiceHref(q, { kind: k, page: "1" })}
                  active={cur("kind") === k}
                  label={<T zh={KIND_LABEL[k].zh} en={KIND_LABEL[k].en} />}
                  n={KIND_TOTAL(k)}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </CtxSec>
        </>
      )}
    </>
  );
}

/* ============================================================
   Assess —— 只有考场和模拟考，按科目分组
   ============================================================ */

/** 考场题按科目分组。顺序跟 pathGroups() 走，和 Learn 侧栏、路线图一致。 */
function assessGroups() {
  const order = pathGroups().flatMap((g) => g.exams.map((e) => e.id));
  const rebuilds = ARENA.filter((a) => !a.fromMock);
  const byExam = order
    .map((id) => ({ exam: navExam(id), items: rebuilds.filter((a) => a.examId === id) }))
    .filter((g) => g.exam && g.items.length > 0) as {
    exam: NavExam;
    items: typeof rebuilds;
  }[];
  return { byExam, mocks: ARENA.filter((a) => a.fromMock) };
}

function AssessSide({ onNavigate }: { onNavigate: () => void }) {
  const path = usePathname();
  const { locale } = useLocale();
  const { ready, arenaAttempts, arenaLive } = useProgress();
  const en = locale === "en";

  const live = ready ? arenaLive() : undefined;
  const liveNav = live ? ARENA.find((a) => a.id === live.id) : undefined;
  const { byExam, mocks } = assessGroups();

  const state = (id: string) => {
    const attempts = ready ? arenaAttempts(id) : [];
    if (live?.id === id) return { kind: "live" as const, attempts };
    const best = bestPass(attempts);
    if (best) return { kind: "passed" as const, attempts, best };
    if (attempts.length > 0) return { kind: "tried" as const, attempts };
    return { kind: "fresh" as const, attempts };
  };

  const freshCount = ready ? ARENA.filter((a) => arenaAttempts(a.id).length === 0).length : ARENA.length;
  const passedCount = ready ? ARENA.filter((a) => bestPass(arenaAttempts(a.id))).length : 0;

  // 主行动：有在计时的就回到那一场；否则挑第一道没试过的开考。
  const suggest = ready ? ARENA.find((a) => arenaAttempts(a.id).length === 0) : ARENA[0];

  const readiness = (id: string): { text: ReactNode; tone?: "ok" | "warn" | "live" } => {
    const s = state(id);
    if (s.kind === "live") return { text: <T zh="正在计时" en="in progress" />, tone: "live" };
    if (s.kind === "passed")
      return {
        text: (
          <T
            zh={`通过过 · 最好 ${fmtClock(attemptMs(s.best))}`}
            en={`passed · best ${fmtClock(attemptMs(s.best))}`}
          />
        ),
        tone: "ok",
      };
    if (s.kind === "tried")
      return {
        text: (
          <T
            zh={`试过 ${s.attempts.length} 次 · 还没通过`}
            en={`${s.attempts.length} attempt${s.attempts.length > 1 ? "s" : ""} · not passed`}
          />
        ),
        tone: "warn",
      };
    return { text: <T zh="没试过" en="never attempted" /> };
  };

  return (
    <>
      {live && liveNav ? (
        <CtxCta
          href={`${arenaPath(live.id)}/run`}
          onNavigate={onNavigate}
          tone="live"
          label={<T zh="回到考场" en="Resume attempt" />}
          item={<T zh={liveNav.title} en={liveNav.titleEn} />}
          sub={<T zh="计时还在跑" en="the clock is still running" />}
        />
      ) : (
        suggest && (
          <CtxCta
            href={arenaPath(suggest.id)}
            onNavigate={onNavigate}
            label={<T zh="开考" en="Start" />}
            item={<T zh={suggest.title} en={suggest.titleEn} />}
            sub={<T zh={`限时 ${suggest.minutes} 分钟`} en={`${suggest.minutes} min limit`} />}
          />
        )
      )}

      <div className="ctx-stat">
        <span className="ctx-stat-cell">
          <b className="tabular">{ARENA.length}</b>
          <T zh="道题" en="papers" />
        </span>
        <span className="ctx-stat-cell" data-tone={freshCount > 0 ? "warn" : undefined}>
          <b className="tabular">{freshCount}</b>
          <T zh="没试过" en="not tried" />
        </span>
        <span className="ctx-stat-cell" data-tone={passedCount > 0 ? "ok" : undefined}>
          <b className="tabular">{passedCount}</b>
          <T zh="通过过" en="passed" />
        </span>
      </div>

      {byExam.map((g, gi) => (
        <CtxSec
          key={g.exam.id}
          label={g.exam.shortTitleEn ?? g.exam.shortTitle}
          title={<T zh={g.exam.shortTitle} en={g.exam.shortTitleEn} />}
          link={gi === 0 ? { href: "/arena", zh: "全部 →", en: "All →" } : undefined}
        >
          <ul className="ctx-list">
            {g.items.map((a) => {
              const r = readiness(a.id);
              const href = arenaPath(a.id);
              return (
                <CtxItem
                  key={a.id}
                  href={href}
                  active={path === href || path.startsWith(href + "/")}
                  label={<T zh={a.title} en={a.titleEn} />}
                  sub={
                    <>
                      <span className="tabular">
                        <T zh={`${a.minutes} 分钟`} en={`${a.minutes} min`} />
                      </span>
                      <span className="ctx-item-dot" aria-hidden>
                        ·
                      </span>
                      {r.text}
                    </>
                  }
                  tone={r.tone}
                  onNavigate={onNavigate}
                />
              );
            })}
          </ul>
        </CtxSec>
      ))}

      <CtxSec
        label={en ? "Mock exams" : "模拟考"}
        title={<T zh="模拟考" en="Mock exams" />}
        note={
          <T
            zh="换了业务场景、考点不变。题面在考场里，交卷后回来自评。"
            en="Same skills, different business scenario. The paper is in the arena; come back here to score yourself."
          />
        }
      >
        <ul className="ctx-list">
          {mocks.map((a) => {
            const r = readiness(a.id);
            const href = arenaPath(a.id);
            const exam = navExam(a.examId);
            const mock = exam?.mockExams.find((m) => m.id === a.id);
            return (
              <li key={a.id}>
                <Link
                  className="ctx-item"
                  href={href}
                  data-active={(path === href || path.startsWith(href + "/")) || undefined}
                  data-tone={r.tone}
                  aria-current={path === href ? "true" : undefined}
                  onClick={onNavigate}
                >
                  <span className="ctx-item-label">
                    <T zh={a.title} en={a.titleEn} />
                  </span>
                  <span className="ctx-item-sub">
                    <span className="tabular">
                      <T zh={`${a.minutes} 分钟`} en={`${a.minutes} min`} />
                    </span>
                    <span className="ctx-item-dot" aria-hidden>
                      ·
                    </span>
                    {r.text}
                  </span>
                </Link>
                {exam && mock && (
                  <Link
                    className="ctx-item-aside"
                    href={`/mock/${exam.id}/${mock.id}`}
                    onClick={onNavigate}
                  >
                    <T zh="按 rubric 自评 →" en="Score yourself →" />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </CtxSec>
    </>
  );
}

/* ============================================================
   分发
   ============================================================ */

export function ContextSidebar({
  mode,
  onNavigate,
}: {
  mode: ModeId;
  onNavigate: () => void;
}) {
  switch (mode) {
    case "learn":
      return <LearnSide onNavigate={onNavigate} />;
    case "review":
      return <ReviewSide onNavigate={onNavigate} />;
    case "practice":
      return <PracticeSide onNavigate={onNavigate} />;
    case "assess":
      return <AssessSide onNavigate={onNavigate} />;
  }
}
