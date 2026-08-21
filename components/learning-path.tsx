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
  // 分组键用 examId，顺序直接用 NAV 的数组顺序 —— 不再解析数字排序
  // （那会让各门课的「第 1 部分」全挤在一起）。
  const grouped = all.reduce<Record<string, typeof all>>((acc, s) => {
    (acc[s.exam.id] ??= []).push(s);
    return acc;
  }, {});
  const order = NAV.map((e) => e.id).filter((id) => grouped[id]);

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
  const flat = order.flatMap((examId) => grouped[examId]);
  const firstUndoneIdx = flat.findIndex(
    (s) => !s.module.lessons.every((l) => lessonDone(s.exam.id, l.id)),
  );
  const stateOf = (idx: number): "done" | "current" | "locked" => {
    if (!ready) return idx === 0 ? "current" : "locked";
    if (firstUndoneIdx === -1) return "done";
    if (idx < firstUndoneIdx) return "done";
    if (idx === firstUndoneIdx) return "current";
    return "locked";
  };
  let seq = 0;

  return (
    <main className="main" data-rail="off">
      <div className="content">
        <div className="page-head">
          <div className="eyebrow">
            <T zh="路线图" en="Roadmap" />
          </div>
          <h1 className="page-title serif">
            <T zh="你在这儿，下一步往这走" en="You are here. This is what comes next." />
          </h1>
          <p className="page-lede">
            <T
              zh={`${NAV.length} 门课、${flat.length} 个部分、${totalLessons} 节。已读完的打勾变灰，当前那一段高亮，后面的先弱化 —— 但都能点，想跳着学随你。`}
              en={`${NAV.length} courses, ${flat.length} parts, ${totalLessons} lessons. Finished parts are ticked and dimmed, the current one is highlighted, later ones are muted — but all of them are clickable.`}
            />
          </p>
        </div>

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

        <ol className="road">
          {order.map((examId) => {
            const items = grouped[examId];
            return (
              <li className="road-course" key={examId}>
                <h2 className="road-course-title">{items[0]?.exam.shortTitle}</h2>
                <ol className="road-nodes">
                  {items.map((s) => {
                    const idx = seq++;
                    const st = stateOf(idx);
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
                              {s.stage.replace(/^.*· /, "")}
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
                                {s.module.title}
                              </Link>
                            ) : (
                              s.module.title
                            )}
                          </h3>
                          <p className="road-summary">{s.module.summary}</p>
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
                                {l.title}
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
