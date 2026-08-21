"use client";

// 首页。不做企业 Dashboard，也不做 SaaS Hero。
//
// 【这一版的重点：第一屏必须回答「我该点哪」】
// 之前的问题是编辑式引言压在最上面，「该从哪开始」在一屏半以下 ——
// 新用户进来先读到三段散文，然后看到 4 门课并列，不知道从哪下手。
// 现在第一屏就是一个「开始」条：没进度就是「从第一节开始」，
// 有进度就是「继续上次」。只有一个主按钮。
//
// 另一个修正：以前文案写死成「两个真实的 综合项目」。
// 现在不止两个 —— 八股问答、小 coding、三个真题项目的大题、两套模拟考，
// 而且以后还会加。所以数量一律从 NAV 里算，不写死。

import Link from "next/link";
import { ARENA, CODING, DRILLS, NAV, examPath, lessonPath, navLessonsOf } from "@/content/nav";
import { pathGroups } from "@/content/path";
import { useProgress } from "@/lib/progress";
import { LayerMap } from "./lesson-kit";
import { T } from "./t";

export function Home() {
  const { data, ready, countLessons, countExercises } = useProgress();

  const totals = NAV.reduce(
    (acc, exam) => ({
      lessons: acc.lessons + exam.lessonCount,
      exercises: acc.exercises + exam.exerciseCount,
      debugLabs: acc.debugLabs + exam.debugLabs,
      rebuilds: acc.rebuilds + exam.rebuilds,
      mocks: acc.mocks + exam.mockExams.length,
    }),
    { lessons: 0, exercises: 0, debugLabs: 0, rebuilds: 0, mocks: 0 },
  );

  const doneLessons = ready ? NAV.reduce((n, e) => n + countLessons(e.id), 0) : 0;
  const doneExercises = ready ? NAV.reduce((n, e) => n + countExercises(e.id), 0) : 0;

  const last = ready ? data.last : undefined;
  const foundations = NAV.find((e) => e.id === "foundations");
  const firstLesson = foundations ? navLessonsOf(foundations)[0] : undefined;
  const started = doneLessons > 0 || doneExercises > 0;

  // 有真题项目的那几门（面试八股不对应源项目）
  const withSource = NAV.filter((e) => e.id === "react" || e.id === "graphql-federation");

  /* ---------- 四档的「什么时候来」----------

     三种状态，全部从进度派生，不写死：
       later   还没到时候 —— 但**照样能点**，只是文字上劝你先上课
       now     建议现在来
       open    已经解锁

     刻意不做锁死逻辑、不做任务面板、不做进度环。这里只是一行建议文字：
     判断「我现在该干什么」是这一页要替用户做的事，
     但**决定权仍然在用户手里**。有基础的人第一天就想去考场，不该被挡。

     门槛的定的依据：
       练习   —— 跟着课文走，所以只要开始上课就该来
       八股   —— 「一门课走完」再刷，因为答案里大量引用课程里的概念
       Coding —— 课内练习做过一些之后（它是「写得对」那一档，比填空高一级）
       考场   —— 前三档跑过之后来验收
  */
  const firstCourseDone = ready
    ? NAV.some((e) => e.lessonCount > 0 && countLessons(e.id) >= e.lessonCount)
    : false;

  type TierState = "later" | "now" | "open";
  const tierState = (key: "drill" | "practice" | "code" | "arena"): TierState => {
    if (!ready) return "later";
    switch (key) {
      case "practice":
        return started ? "now" : "later";
      case "drill":
        return firstCourseDone ? "now" : "later";
      case "code":
        return doneExercises >= 5 ? "now" : "later";
      case "arena":
        return firstCourseDone && doneExercises >= 5 ? "now" : "later";
    }
  };

  const WHEN = {
    drill: {
      later: ["课程走完一门再来刷", "Come back once you have finished a course"],
      now: ["你已经走完一门课了 —— 可以开始刷了", "You have finished a course — start drilling"],
      open: ["随时来", "Any time"],
    },
    practice: {
      later: ["课文页尾就有本课的练习，先从那儿开始", "Each lesson ends with its own exercises — start there"],
      now: ["每节课尾都有本课的练习；想集中刷就来这一页", "Every lesson ends with its exercises; come here to drill in bulk"],
      open: ["随时来", "Any time"],
    },
    code: {
      later: ["先在课里做几个练习，再来写整块", "Do a few lesson exercises first, then come write whole blocks"],
      now: ["可以开始写整块了", "Ready to write whole blocks"],
      open: ["随时来", "Any time"],
    },
    arena: {
      later: ["前三档跑绿之后来验收", "Come here to be checked once the first three tiers are green"],
      now: ["可以来验收了 —— 空文件夹、计时、没有提示", "Ready to be checked — empty folder, timed, no hints"],
      open: ["随时来", "Any time"],
    },
  } as const;

  const TIERS = [
    {
      key: "drill" as const,
      href: "/drill",
      nameZh: "八股题库",
      nameEn: "Interview drills",
      goalZh: "说得出",
      goalEn: "Say it",
      givesZh: "给你问题，你用嘴答",
      givesEn: "You get the question, you answer aloud",
      count: DRILLS.length,
    },
    {
      key: "practice" as const,
      href: "/practice",
      nameZh: "练习",
      nameEn: "Practice",
      goalZh: "认得出",
      goalEn: "Spot it",
      givesZh: "挖好了空等你填",
      givesEn: "The blanks are cut, you fill them",
      count: NAV.reduce((n, e) => n + e.exerciseCount, 0),
    },
    {
      key: "code" as const,
      href: "/code",
      nameZh: "Coding 题",
      nameEn: "Coding problems",
      goalZh: "写得对",
      goalEn: "Write it",
      givesZh: "文件、依赖、测试都给好了",
      givesEn: "Files, deps and tests handed to you",
      count: CODING.length,
    },
    {
      key: "arena" as const,
      href: "/arena",
      nameZh: "考场",
      nameEn: "Arena",
      goalZh: "空手做",
      goalEn: "Build it blind",
      givesZh: "空文件夹、计时、没有提示按钮",
      givesEn: "Empty folder, timed, no hint button",
      count: ARENA.length,
    },
  ].map((t) => ({
    ...t,
    whenZh: (st: TierState) => WHEN[t.key][st][0],
    whenEn: (st: TierState) => WHEN[t.key][st][1],
  }));

  return (
    <main className="main" data-rail="off">
      <div className="content home">
        {/* ================================================================
            第一屏：**唯一**的主行动。
            没进度 → 开始第一课；有进度 → 回到上次那一节。
            这一屏刻意不放任何全局数字和菜单 —— 认知负担全砍掉。
            ================================================================ */}
        <section className="hero">
          <div className="eyebrow">DrillLab</div>

          {last ? (
            <>
              <h1 className="hero-title serif">
                <T zh="接着上次往下走" en="Pick up where you left off" />
              </h1>
              <p className="hero-sub">
                <T zh="你上次停在" en="You stopped at" />
                <strong> {last.title} </strong>
                <T zh="这一节。" en="" />
              </p>
              <Link
                className="hero-cta"
                href={lessonPath(last.examId, last.lessonId)}
              >
                <span className="hero-cta-main">
                  <T zh="回到这一节" en="Resume this lesson" />
                </span>
                <span className="hero-cta-sub">{last.title}</span>
              </Link>
              <p className="hero-alt">
                <Link href="/path">
                  <T zh="或者先看全部课程挑一段 →" en="Or browse all courses and pick a spot →" />
                </Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="hero-title serif">
                <T
                  zh="从「一个 JavaScript 项目是怎么跑起来的」开始。"
                  en="Start with how a JavaScript project actually runs."
                />
              </h1>
              <p className="hero-sub">
                <T
                  zh="不假设你会 npm，不假设你读得懂 package.json。一节一节往下走，最后你能在一个空文件夹里把整个项目重写出来。"
                  en="No assumptions about npm or package.json. One lesson at a time, until you can rebuild a whole project in an empty folder."
                />
              </p>
              {firstLesson && (
                <Link
                  className="hero-cta"
                  href={lessonPath(firstLesson.exam.id, firstLesson.lesson.id)}
                >
                  <span className="hero-cta-main">
                    <T zh="开始第一课" en="Start the first lesson" />
                  </span>
                  <span className="hero-cta-sub">
                  <T zh={firstLesson.lesson.title} en={firstLesson.lesson.titleEn} />
                </span>
                </Link>
              )}
              <p className="hero-alt">
                <Link href="/path">
                  <T
                    zh="已经有基础？先看全部课程挑一段 →"
                    en="Already know the basics? Browse all courses →"
                  />
                </Link>
              </p>
            </>
          )}
        </section>

        {/* 英文用户的边界说明。这条要写准，别含糊 ——
            **有英文**：界面、367 个讲解段正文、99 道八股答案、模拟考讲解与环境说明。
            **只有中文**：讲解段的标题和副标、学完你会 / 考点 / 要点回顾、
            138 个练习的题面和提示、12 处 callout、代码块里的注释、速查表。
            所以英文读者拿到的是「英文正文 + 中文标题 + 中文练习」。
            与其让人点进去才发现，不如在这里说清。
            zh 那一边留空 —— 中文用户不需要看到这句。 */}
        <T
          en={
            <p className="home-langnote">
              <strong>A note on language.</strong> Fully in English: the interface,
              all 381 numbered explanation sections, all 105 drill answers, the mock
              walkthroughs and setup notes, and every code block, command, test
              output and sandbox problem statement.{" "}
              <strong>Still Chinese only:</strong> section headings and subtitles,
              the objectives / what-it-tests / recap lists, all 148 exercise prompts
              and hints, 13 callouts, the comments inside code blocks, and the
              reference tables. So in English you get English prose under Chinese
              headings, and the exercises stay Chinese.
            </p>
          }
          zh=""
        />

        {/* ================================================================
            次要区：四档。压在主行动下面，不跟它抢焦点。

            【第三轮改动 —— 用户说「无从下手」，问题在这一块】
            前两轮改的是 hero 和顶栏，都没解决。这一块才是稀释路径感的地方：
            四个带数字的并列入口（99 / 123 / 16 / 6），**没有任何一条说
            「什么时候该来这一档」**。刚被主 CTA 立起来的「先上课」，
            立刻被四个同等重量的入口冲掉。

            这一版三个改动：
            ① 每一档加一行「什么时候来」，状态从进度派生
               （未开始 / 建议现在来 / 已解锁）—— 只是文字建议，
               **不加锁死逻辑，四个都能点**；
            ② 数字视觉降级（.tier-n 变小变淡），不与主按钮抢焦点；
            ③ **链接文字用正式名字**（八股题库 / 练习 / Coding 题 / 考场），
               四档的目标动词（说得出…）退成副标。
               原来把「说得出」当第一个词，于是新用户在首页学到的名字是
               「说得出」，点进去页面叫「八股题库」，顶栏又叫「练习」——
               同一个地方三个名字。见 docs/ia-audit-round3.md 的术语统一表。
            ================================================================ */}
        <section className="home-sec">
          <h2 className="home-sec-title">
            <T zh="练的时候有四档" en="Four ways to practise" />
          </h2>
          <p className="home-sec-lede">
            <T
              zh="区别不是题的类型，是「给你多少东西」—— 越往后给得越少。先上课，练习跟着课文走；剩下三档是课上完之后的事。"
              en="The difference is not the kind of problem, it is how much you are given. Start with the lessons; practice follows them. The other three tiers come after."
            />
          </p>
          <ol className="tier-list">
            {TIERS.map((t) => {
              const state = tierState(t.key);
              return (
                <li key={t.key}>
                  {/* 三行 + 左侧序号。序号不是装饰 —— 四档是**有顺序**的，
                      01→04 让「越往后给得越少」这件事在视觉上直接成立。
                      档位（说得出…）跟在名字后面当小字，仍然排在名字之后，
                      不会重蹈「新用户以为这一档就叫『说得出』」那个坑。 */}
                  <Link href={t.href}>
                    <span className="tier-step" aria-hidden />
                    <span className="tier-head">
                      <span className="tier-name">
                        <T en={t.nameEn} zh={t.nameZh} />
                      </span>
                      <span className="tier-goal">
                        <T en={t.goalEn} zh={t.goalZh} />
                      </span>
                    </span>
                    <span className="tier-n tabular">{t.count}</span>
                    <span className="tier-gives">
                      <T en={t.givesEn} zh={t.givesZh} />
                    </span>
                    <span className="tier-when" data-state={state}>
                      <T en={t.whenEn(state)} zh={t.whenZh(state)} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
          <p className="home-note">
            <T
              zh={
                <>
                  <strong>前三档跑绿不代表能空手做出来。</strong>
                  只有<Link href="/arena">考场</Link>对准真实考试 ——
                  两套模拟考就在它的 {ARENA.length} 道里。
                </>
              }
              en={
                <>
                  <strong>Green tests in the first three tiers do not mean you can build
                  it from nothing.</strong> Only <Link href="/arena">the arena</Link>{" "}
                  matches a real assessment.
                </>
              }
            />
          </p>
        </section>

        {/* 进度：有进度才显示，没有就不占地方 */}
        {started && (
          <section className="home-sec">
            <h2 className="home-sec-title">
              <T zh="你的进度" en="Your progress" />
            </h2>
            <div style={{ maxWidth: "var(--measure)" }}>
              {/* 顺序和侧栏、路线图取同一个来源 —— NAV 是登记顺序，
                  会把平行支线排在 Cab Booking 前面，三处就又不一致了。 */}
              {pathGroups().flatMap((g) => g.exams).map((exam) => {
                const done = countLessons(exam.id);
                return (
                  <div className="progress-row" key={exam.id}>
                    <span>
                      <T zh={exam.shortTitle} en={exam.shortTitleEn} />
                    </span>
                    <span className="bar">
                      <i
                        style={{
                          width: `${(done / Math.max(1, exam.lessonCount)) * 100}%`,
                        }}
                      />
                    </span>
                    <span className="progress-num">
                      {done}/{exam.lessonCount}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="dimmer" style={{ fontSize: 13.5, marginTop: 10 }}>
              <T
                zh="进度只存在这台浏览器里，不上传，也不需要登录。"
                en="Progress lives only in this browser. Nothing uploaded, no sign-in."
              />
            </p>
          </section>
        )}

        {/* 折叠区：速查、课程归档、内容来源这些查完就走的东西 */}
        <details className="home-more">
          <summary>
            <T zh="其他：速查表、课程归档、内容来源" en="More: reference, archive, sources" />
          </summary>
          <div className="home-more-body">
            <ul>
              <li>
                <Link href="/reference">
                  <T zh="速查表" en="Reference" />
                </Link>{" "}
                <span className="dimmer">
                  <T zh="命令、API、状态码 —— 查完就走" en="Commands, APIs, status codes" />
                </span>
              </li>
              <li>
                <Link href="/mock">
                  <T zh="模拟考" en="Mock exams" />
                </Link>{" "}
                <span className="dimmer">
                  <T
                    zh="题目本身在考场里，这一页是交卷后按 rubric 自评用的"
                    en="The papers live in the arena; this page is for scoring yourself"
                  />
                </span>
              </li>
              <li>
                <Link href="/path">
                  <T zh="课程" en="Courses" />
                </Link>{" "}
                <span className="dimmer">
                  <T
                    zh={`${totals.lessons} 节 —— 题目背后的讲解，卡住了回来查`}
                    en={`${totals.lessons} lessons — the explanation behind the problems`}
                  />
                </span>
              </li>
            </ul>
            <p className="dimmer" style={{ fontSize: 13.5 }}>
              <T
                zh="三门真题课读的是本机上的 react-notes-app、graphql-federation-practice 与 cab-booking-context，只读不改。标了「源项目」或「已跑通」的代码都在本机真实跑过。"
                en="The three assessment courses read three real projects on this machine, read-only. Every block marked “source” or “verified” was actually run here."
              />
            </p>
          </div>
        </details>
      </div>
    </main>
  );
}
