"use client";

// 考场列表 —— 客户端组件，因为它要读 localStorage 里的尝试记录。
//
// 它只 import content/nav（生成物，纯数据），不 import content/arena。
// 理由见 CLAUDE.md：客户端组件一旦 import 内容，全部课程正文会被打进同一个
// chunk（踩过一次，784 KB）。题面、需求、答案全部留在服务端那三页。
//
// 这一页最重要的一件事：**让「没试过的题」显眼**。
// 试过的题会自己长出记录，没试过的题什么都不会长出来 —— 所以要主动标出来。

import Link from "next/link";
import { ARENA, arenaPath, navExam } from "@/content/nav";
import { useProgress } from "@/lib/progress";
import { T } from "./t";
import { ArenaWhy, AttemptTags, attemptMs, bestPass, fmtClock } from "./arena-bits";
import { PlanStripSlot } from "./plan-slots";
import { NoteRecent } from "./recent";
import { Ladder } from "./ladder";

export function ArenaList() {
  const { ready, arenaAttempts, arenaLive } = useProgress();

  // ready 之前一律按「什么记录都没有」渲染 —— 服务端和首次客户端渲染走同一支，
  // 不会有 hydration 警告。挂载后 ready 翻成 true，再补上真实记录。
  const live = ready ? arenaLive() : undefined;
  const rows = ARENA.map((a) => {
    const attempts = ready ? arenaAttempts(a.id) : [];
    return {
      nav: a,
      attempts,
      best: bestPass(attempts),
      last: attempts.length > 0 ? attempts[attempts.length - 1] : undefined,
      fresh: attempts.length === 0,
    };
  });

  const freshCount = rows.filter((r) => r.fresh).length;
  const passedCount = rows.filter((r) => r.best).length;
  const liveNav = live ? ARENA.find((a) => a.id === live.id) : undefined;

  return (
    <main className="main" data-rail="off">
      <NoteRecent
        mode="assess"
        href="/arena"
        title="考场"
        titleEn="Arena"
        sub={`${ARENA.length} 道计时题`}
        subEn={`${ARENA.length} timed papers`}
      />
      <div className="content arena-list">
        <div className="page-head">
          <div className="eyebrow">
            <T zh="考场" en="Arena" />
          </div>
          <h1 className="page-title display">
            <T
              zh="计时、无提示、答案锁到交卷之后"
              en="Timed, no hints, answers locked until you hand in"
            />
          </h1>
          {/* ArenaWhy 自带 <p>，所以这里用 div 包 —— p 里套 p 会被浏览器拆开 */}
          <div className="page-lede arena-lede">
            <ArenaWhy />
          </div>
        </div>

        <PlanStripSlot mode="assess" />

        <Ladder current="arena" />

        {ready && live && (
          <div className="arena-live">
            <div>
              <strong>
                <T zh="你有一场考试还在计时中" en="You have a run in progress" />
              </strong>
              <p>
                {liveNav ? liveNav.title : live.id}
                {" —— "}
                <T
                  zh="刷新、关标签页都不会重置计时，计时基准是开考那一刻的时间戳。"
                  en="Refreshing or closing the tab does not reset the clock; it is anchored to the timestamp taken when you started."
                />
              </p>
            </div>
            <Link className="btn btn-primary btn-sm" href={`${arenaPath(live.id)}/run`}>
              <T zh="回到考场" en="Back to the run" />
            </Link>
          </div>
        )}

        <div className="arena-sum">
          <span className="arena-sum-cell">
            <b className="mono">{ARENA.length}</b>
            <T zh="道考场题" en="challenges" />
          </span>
          <span className="arena-sum-cell" data-tone={freshCount > 0 ? "call" : undefined}>
            <b className="mono">{freshCount}</b>
            <T zh="道没试过" en="never attempted" />
          </span>
          <span className="arena-sum-cell">
            <b className="mono">{passedCount}</b>
            <T zh="道通过过" en="passed at least once" />
          </span>
        </div>

        {freshCount === ARENA.length && (
          <div className="callout" data-tone="note">
            <strong className="callout-title">
              <T zh="先去把课看完再来" en="Do the lessons first" />
            </strong>
            <p>
              <T
                zh="考场不是入门用的。这里的每道题都假设你已经在对应那节课里做过一遍，现在要验证的是「没有答案在旁边还写不写得出来」。第一次进来建议从时限最短的那道开始。"
                en="The arena is not for first contact. Every challenge assumes you already worked through the matching lesson; what is being tested is whether you can still write it with no answer next to you. On your first visit, start with the shortest limit."
              />
            </p>
          </div>
        )}

        <div className="minihead">
          <T zh="规则很短" en="The rules are short" />
        </div>
        <div className="prose">
          <p>
            <T
              zh="开考按钮一按，计时立刻开始，需求才会出现在下一页 —— 读题也算在时间里，真实考试就是这样。中途刷新不会重置，超时不会打断，但记录会照实写。"
              en="The moment you press start the clock runs, and only then does the next page show the requirements: reading the paper is part of the time, exactly as in the real thing. Refreshing does not reset it, going over time does not interrupt you, and the record says what happened."
            />
          </p>
        </div>

        {/* 【别写死数字】原来这里是「六道题 / Six challenges」，
            而 ARENA 早就是 7 道了 —— 页面自己和自己对不上。 */}
        <div className="minihead">
          <T zh={`${rows.length} 道题`} en={`${rows.length} challenges`} />
        </div>

        <div className="exam-list">
          {rows.map((r, i) => {
            const exam = navExam(r.nav.examId);
            return (
              <div className="exam-row" key={r.nav.id} data-fresh={r.fresh || undefined}>
                <span className="exam-idx">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <Link className="exam-name" href={arenaPath(r.nav.id)}>
                    <T zh={r.nav.title} en={r.nav.titleEn} />
                  </Link>
                  <p className="exam-desc">
                    <T zh={r.nav.scenario} en={r.nav.scenarioEn} />
                  </p>
                  <div className="exam-tags">
                    {r.fresh && (
                      <span className="tag" data-tone="accent">
                        <T zh="★ 没试过" en="★ Never attempted" />
                      </span>
                    )}
                    <span className="tag" data-tone="danger">
                      <T zh={`限时 ${r.nav.minutes} 分钟`} en={`${r.nav.minutes} min limit`} />
                    </span>
                    {exam && <span className="tag">{exam.shortTitle}</span>}
                    <span className="tag">
                      <T
                        zh={`${r.nav.requirementCount} 条需求`}
                        en={`${r.nav.requirementCount} requirements`}
                      />
                    </span>
                    <span className="tag">
                      <T
                        zh={`${r.nav.commandCount} 条验收命令`}
                        en={`${r.nav.commandCount} acceptance commands`}
                      />
                    </span>
                    {r.nav.fromMock && (
                      <span className="tag" data-tone="warn">
                        <T zh="DrillLab 自出" en="DrillLab-authored" />
                      </span>
                    )}
                  </div>
                </div>

                <div className="exam-side">
                  {r.fresh ? (
                    <Link className="btn btn-sm btn-primary" href={arenaPath(r.nav.id)}>
                      <T zh="去开考" en="Start" />
                    </Link>
                  ) : (
                    <div className="arena-side">
                      <div>
                        <T
                          zh={`试过 ${r.attempts.length} 次`}
                          en={`${r.attempts.length} attempt${r.attempts.length > 1 ? "s" : ""}`}
                        />
                      </div>
                      <div>
                        {r.best ? (
                          <>
                            <T zh="最好 " en="best " />
                            <span className="num mono">{fmtClock(attemptMs(r.best))}</span>
                          </>
                        ) : (
                          <span className="dimmer">
                            <T zh="还没通过过" en="not passed yet" />
                          </span>
                        )}
                      </div>
                      <div className="arena-side-tags">
                        <span className="dimmer">
                          <T zh="最近 " en="latest " />
                        </span>
                        {r.last && <AttemptTags a={r.last} />}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
