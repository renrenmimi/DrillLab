// 四级阶梯 —— 放在 /practice、/drill、/code、/arena 四页的最上面。
//
// 【为什么需要它】
// 使用者的原话：「首页 八股 Coding 考场 模拟考 课程 速查，我还是不清楚这几个有什么区别。」
//
// 上一版的做法是在**首页**加一张解释表 —— 没用，因为那张表在第一屏以下，
// 而困惑发生在顶栏。所以这一版把答案放在困惑发生的地方：
// 不管你落在哪一条主线上，页面顶部第一件事就是整个阶梯，当前那一格高亮。
//
// 四条线的区别不是「题的类型」，是**给你多少东西** —— 越往右给得越少：
//   八股      给你问题，你用嘴答            → 说得出
//   课内练习  挖好了空等你填                → 认得出
//   Coding    文件、依赖、测试都给好了      → 写得对
//   考场      什么都不给，还计时            → 空手做
//
// 顺带砍掉了顶栏的「模拟考」—— 它的 2 套题本来就在考场那几道里（数字从 ARENA.length 派生）
// （content/arena.ts 从 2 套模拟考派生了 2 道），顶栏留两个入口指同一批东西，
// 才是「分不清」的真正来源。/mock 路由保留，只是不再是顶级目的地。
//
// 没有 "use client"：纯展示，不带 hook，四个服务端页面都能直接用。

import Link from "next/link";
import { ARENA, CODING, DRILLS, NAV } from "@/content/nav";
import { T } from "./t";

export type LadderStep = "drill" | "exercises" | "code" | "arena";

const STEPS = [
  {
    key: "drill" as const,
    href: "/drill",
    name: { zh: "八股", en: "Drills" },
    goal: { zh: "说得出", en: "Say it" },
    gives: { zh: "给你问题，你用嘴答", en: "You get the question, you answer out loud" },
  },
  {
    key: "exercises" as const,
    href: "/practice",
    name: { zh: "课内练习", en: "Lesson exercises" },
    goal: { zh: "认得出", en: "Spot it" },
    gives: {
      zh: "填空、写整块、Debug Lab —— 挖好了空等你填",
      en: "Fill-in-the-blank, write-a-block, debug labs",
    },
  },
  {
    key: "code" as const,
    href: "/code",
    name: { zh: "Coding", en: "Coding" },
    goal: { zh: "写得对", en: "Write it" },
    gives: {
      zh: "文件、依赖、测试都给好了",
      en: "Files, deps and tests are handed to you",
    },
  },
  {
    key: "arena" as const,
    href: "/arena",
    name: { zh: "考场", en: "Arena" },
    goal: { zh: "空手做", en: "Build it blind" },
    gives: {
      zh: "空文件夹、计时、没有提示按钮",
      en: "Empty folder, timed, no hint button",
    },
  },
];

const COUNT: Record<LadderStep, number> = {
  drill: DRILLS.length,
  // 课内练习的总数从 NAV 算 —— 它是各门课 exerciseCount 的和
  exercises: NAV.reduce((n, e) => n + e.exerciseCount, 0),
  code: CODING.length,
  arena: ARENA.length,
};

export function Ladder({ current }: { current: LadderStep }) {
  return (
    <nav className="ladder" aria-label="四种练法 / Four ways to practise">
      {/* 标题和「怎么选」的展开开关同一行 —— 第一版把开关单独放一行，
          省下的说明高度正好被新增的那行吃掉，净收益为零（实测 212 → 217）。
          放同一行才真的减掉一整块。 */}
      <div className="ladder-head">
        {/* 四档不再自己充当一级导航（那是顶栏四个模式的活），所以这一行
            必须把两套说法对上 —— 否则同一个地方又会有两个名字，
            正是 docs/ia-audit-round3.md 记的那个毛病。 */}
        <T
          zh="同一批本事的四个难度档，区别是「给你多少东西」—— 它们分布在「背知识点 / 做练习 / 模拟考」三个模式里"
          en="Four fidelity levels of the same skill — the difference is how much you are given. They live across the Review, Practice and Assess modes."
        />
      </div>
      <ol className="ladder-steps">
        {STEPS.map((s, i) => {
          const on = s.key === current;
          return (
            <li key={s.key} className="ladder-step" data-on={on || undefined}>
              {on ? (
                <span className="ladder-link" aria-current="page">
                  <span className="ladder-goal">
                    <T zh={s.goal.zh} en={s.goal.en} />
                  </span>
                  <span className="ladder-name">
                    <T zh={s.name.zh} en={s.name.en} />
                    <span className="ladder-n tabular">{COUNT[s.key]}</span>
                  </span>
                  <span className="ladder-gives">
                    <T zh={s.gives.zh} en={s.gives.en} />
                  </span>
                </span>
              ) : (
                <Link className="ladder-link" href={s.href}>
                  <span className="ladder-goal">
                    <T zh={s.goal.zh} en={s.goal.en} />
                  </span>
                  <span className="ladder-name">
                    <T zh={s.name.zh} en={s.name.en} />
                    <span className="ladder-n tabular">{COUNT[s.key]}</span>
                  </span>
                  <span className="ladder-gives">
                    <T zh={s.gives.zh} en={s.gives.en} />
                  </span>
                </Link>
              )}
              {i < STEPS.length - 1 && (
                <span className="ladder-arrow" aria-hidden>
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {/* 【为什么这段收进 details】
          四格对比本身必须一直可见 —— 它就是第三轮用来回答
          「我还是不清楚这几个有什么区别」的东西，藏起来等于白改。
          但下面这段补充说明每页都摊开，实测让整个 Ladder 高 212px（24% 视口），
          /drill 的第一张卡被顶到 y=1000，**首屏一道题都看不到**。
          所以：对比留下，说明可展开。第一次想看的人点一下，
          回头客直接看到题目。纯 <details>，零 JS。 */}
      <details className="ladder-more">
        <summary className="ladder-more-head">
          <T zh="这四档到底怎么选" en="How to pick a tier" />
        </summary>
        <p className="ladder-foot">
          <T
            zh={
              <>
                往右一格，帮你的东西就少一样。<strong>只有最右边那格对准真实考试</strong>——
                前三格跑绿了不代表空手能做出来。
                两套<Link href="/mock">模拟考</Link>就在考场的 {ARENA.length} 道里。
              </>
            }
            en={
              <>
                Each step right takes one crutch away.{" "}
                <strong>Only the rightmost one matches a real assessment.</strong> The two{" "}
                <Link href="/mock">mock exams</Link> live inside the arena — 2 of its{" "}
                {ARENA.length}.
              </>
            }
          />
        </p>
      </details>
    </nav>
  );
}
