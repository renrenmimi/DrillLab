"use client";

// 路线图 —— 回答「我在哪、下一步去哪」。
//
// 【为什么不是列表】
// 之前这一页是一串扁平的模块清单，看不出顺序也看不出自己在哪。
// 现在是带连线的节点（road）：读完的打勾变灰，当前那一段强高亮并标「你在这」，
// 后面的弱化 —— 视觉上引导按顺序走，但链接不锁死，有基础的人要能跳。
//
// 分组和序号都从 module.stage 推导（形如「React · 第 3 部分」），不是硬编码。

import Link from "next/link";
import { NAV, lessonPath, navStages } from "@/content/nav";
import { pathGroups, stageEn } from "@/content/path";
import { useProgress } from "@/lib/progress";
import { T } from "./t";


export function LearningPath() {
  const { lessonDone, ready } = useProgress();
  const all = navStages();

  // 【为什么不再用全局线性 Stage】
  // 原来 22 个模块共用一套 "Stage 0"–"Stage 11" 的全局编号，实测 12 个 Stage 里
  // 有 7 个挂着多个模块（Stage 4 挂了三个），所以「Stage」既不是顺序也不是分组。
  // 根子上的原因是：八股本来就是并行轨道，不是「走完 8 个阶段之后」。
  // 现在改成「按考试分组 + 组内序号」，stage 字段的值形如「React · 第 3 部分」。
  //
  // 【顺序必须和侧栏一致】
  // 这里原来用 NAV 的数组顺序，而侧栏按 prerequisites 排。两处于是互相矛盾：
  // NAV 里 interview 排第 4、cab-booking 第 5，侧栏说 cab-booking 是 04、
  // interview 是平行支线。同一个问题给两个答案，正是这次要修的毛病。
  // 所以两处都从 content/path 的 pathGroups() 取顺序，只有一个来源。
  const grouped = all.reduce<Record<string, typeof all>>((acc, s) => {
    (acc[s.exam.id] ??= []).push(s);
    return acc;
  }, {});
  const groups = pathGroups()
    .map((g) => ({ ...g, exams: g.exams.filter((e) => grouped[e.id]) }))
    .filter((g) => g.exams.length > 0);

  const totalLessons = all.reduce((n, s) => n + s.module.lessons.length, 0);
  const doneLessons = ready
    ? all.reduce(
        (n, s) =>
          n + s.module.lessons.filter((l) => lessonDone(s.exam.id, l.id)).length,
        0,
      )
    : 0;

  /* ---------- 路线图状态 ----------
     每个模块算三种状态之一：
       done     这一部分全部读完
       current  第一个没读完的 —— 强高亮，就是「你在这」
       locked   current 之后的，视觉弱化 + 锁
     锁是**软锁**：链接照样能点（不挡想跳着学的人），
     只是视觉上告诉你「建议先走前面」。硬拦住会把已经有基础的人赶走。 */
  // 【每组各自算状态，不能拉成一条】
  // 原来是把所有模块拉平成一条算「第一个没读完的」。把平行支线排在主线之后，
  // 它 9 个模块就会全部显示成「锁住」—— 而它恰恰是任何时候都能开始的那条。
  // 所以主线和平行支线各算一次：每组内部有自己的「你在这」。
  const stateMap = new Map<string, "done" | "current" | "locked">();
  for (const g of groups) {
    const flat = g.exams.flatMap((e) => grouped[e.id]);
    const firstUndone = flat.findIndex(
      (s) => !s.module.lessons.every((l) => lessonDone(s.exam.id, l.id)),
    );
    flat.forEach((s, i) => {
      let st: "done" | "current" | "locked";
      if (!ready) st = i === 0 ? "current" : "locked";
      else if (firstUndone === -1) st = "done";
      else if (i < firstUndone) st = "done";
      else if (i === firstUndone) st = "current";
      else st = "locked";
      stateMap.set(s.module.id, st);
    });
  }
  const flat = groups.flatMap((g) => g.exams.flatMap((e) => grouped[e.id]));

  return (
    <main className="main" data-rail="off">
      <div className="content">
        <div className="page-head">
          <div className="eyebrow">
            <T zh="学课程 · 路线图" en="Learn · roadmap" />
          </div>
          <h1 className="page-title">
            <T zh="你在这儿，下一步往这走" en="You are here. This is what comes next." />
          </h1>
          <p className="page-lede">
            <T
              zh={`${NAV.length} 门课、${flat.length} 个部分、${totalLessons} 节。已读完的打勾变灰，当前那一段高亮，后面的先弱化 —— 但都能点，想跳着学随你。`}
              en={`${NAV.length} courses, ${flat.length} parts, ${totalLessons} lessons. Finished parts are ticked and dimmed, the current one is highlighted, later ones are muted — but all of them are clickable.`}
            />
          </p>
        </div>

        {/* 一条「接着学」。这一页是 Learn 模式的落地页，站在这儿的人
            要么想找位置，要么就是想接着上次那一节 —— 后者给一个按钮解决。 */}
        {/* 【UI v2 删掉了这里那颗「接着学」】
            侧栏里已经有全站唯一那颗〔继续〕，而它和这一条永远指同一节课。
            这一页的职责是**方位**（五门课怎么排、我在整条路的哪儿），
            不是「下一步」。 */}

        {ready && (
          <div className="road-progress">
            <span className="road-progress-num tabular">
              {doneLessons} / {totalLessons}
            </span>
            <span className="bar">
              <i style={{ width: `${(doneLessons / Math.max(1, totalLessons)) * 100}%` }} />
            </span>
          </div>
        )}

        {groups.map((g) => (
          <div key={g.kind}>
            {/* 平行支线单独起一组，并且不编号 —— 它没有前置课，也没有课依赖它，
                编成 05 是在说一个不存在的顺序。措辞和侧栏保持一致。 */}
            {g.kind === "parallel" && (
              <div className="road-band">
                <span className="road-band-title">
                  <T zh="平行支线" en="Parallel track" />
                </span>
                <span className="road-band-note">
                  <T
                    zh="不依赖主线，任何时候都能开始 —— 下面的「你在这」是这条线自己的进度"
                    en="No prerequisites, start any time — the marker below follows this line on its own"
                  />
                </span>
              </div>
            )}
            <ol className="road">
              {g.exams.map((exam, ei) => {
            const examId = exam.id;
            const items = grouped[examId];
            return (
              <li className="road-course" key={examId}>
                <h2 className="road-course-title">
                  {g.kind === "main" && (
                    <span className="road-course-idx tabular">
                      {String(ei + 1).padStart(2, "0")}
                    </span>
                  )}
                  <T
                    zh={items[0]?.exam.shortTitle ?? ""}
                    en={items[0]?.exam.shortTitleEn}
                  />
                </h2>
                <ol className="road-nodes">
                  {items.map((s) => {
                    const st = stateMap.get(s.module.id) ?? "locked";
                    const total = s.module.lessons.length;
                    const done = ready
                      ? s.module.lessons.filter((l) => lessonDone(s.exam.id, l.id)).length
                      : 0;
                    const firstLesson = s.module.lessons[0];
                    return (
                      <li className="road-node" data-state={st} key={s.module.id}>
                        <span className="road-dot" aria-hidden>
                          {st === "done" ? "✓" : st === "locked" ? "·" : ""}
                        </span>
                        <div className="road-body">
                          <div className="road-node-head">
                            <span className="road-part">
                              <T
                                zh={s.stage.replace(/^.*· /, "")}
                                en={stageEn(s.stage)?.replace(/^.*· /, "")}
                              />
                            </span>
                            {st === "current" && (
                              <span className="tag" data-tone="accent">
                                <T zh="你在这" en="You are here" />
                              </span>
                            )}
                            {st === "done" && (
                              <span className="tag" data-tone="ok">
                                <T zh="读完了" en="Done" />
                              </span>
                            )}
                            <span className="road-count tabular">
                              {done} / {total}
                            </span>
                          </div>
                          <h3 className="road-node-title">
                            {firstLesson ? (
                              <Link href={lessonPath(s.exam.id, firstLesson.id)}>
                                <T zh={s.module.title} en={s.module.titleEn} />
                              </Link>
                            ) : (
                              <T zh={s.module.title} en={s.module.titleEn} />
                            )}
                          </h3>
                          <p className="road-summary">
                            <T zh={s.module.summary} en={s.module.summaryEn} />
                          </p>
                          <div className="road-lessons">
                            {s.module.lessons.map((l) => (
                              <Link
                                key={l.id}
                                className="chip"
                                href={lessonPath(s.exam.id, l.id)}
                                data-done={
                                  ready && lessonDone(s.exam.id, l.id) ? "true" : undefined
                                }
                              >
                                <T zh={l.title} en={l.titleEn} />
                              </Link>
                            ))}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </li>
            );
              })}
            </ol>
          </div>
        ))}

        <div className="road-end">
          <h2 className="home-sec-title">
            <T zh="路线走完之后" en="After the roadmap" />
          </h2>
          <p>
            <T
              zh={
                <>
                  课文只是「题目背后的讲解」。真正的验收在
                  <Link href="/arena">考场</Link>：空文件夹、计时、没有提示按钮。
                  想先热手就去<Link href="/practice">练习</Link>。
                </>
              }
              en={
                <>
                  The lessons are only the explanation behind the problems. The real
                  check is <Link href="/arena">the arena</Link>. Warm up in{" "}
                  <Link href="/practice">practice</Link> first if you like.
                </>
              }
            />
          </p>
        </div>
      </div>
    </main>
  );
}
