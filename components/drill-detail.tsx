// 单题页 —— 服务端组件。99 道全部预渲染（见 app/drill/[id]/page.tsx）。
//
// 这一页的定位：一道题一个可以分享、可以收藏、可以直接搜到的地址。
// 所以正文一次给全（不折叠），上下题能连着翻，出处能一键回到那节课。

import Link from "next/link";
import { drillById, drillNeighbours, TRACK_LABEL } from "@/content/drills";
// lessonPath 从 nav 取而不是 registry：registry 还 re-export 了 coding / arena，
// 这一页用不上，没必要把它们拖进这条 import 链。
import { lessonPath } from "@/content/nav";
import { DrillAnswer } from "./drill-answer";
import { DrillMarks } from "./drill-marks";
import { NoteRecent } from "./recent";
import { T } from "./t";

export function DrillDetail({ id }: { id: string }) {
  const q = drillById(id);

  if (!q) {
    return (
      <main className="main" data-rail="off">
        <div className="content">
          <p className="empty">
            <T zh="没有这道题。" en="No such question." />
          </p>
          <Link href="/drill">
            <T zh="回题库 →" en="Back to the bank →" />
          </Link>
        </div>
      </main>
    );
  }

  const { prev, next, index, total } = drillNeighbours(id);
  const track = TRACK_LABEL[q.track];

  return (
    <main className="main" data-rail="off">
      <NoteRecent
        mode="review"
        href={`/drill/${q.id}`}
        title={q.zh}
        titleEn={q.en}
        sub={`八股题 · ${track.zh}`}
        subEn={`Drill · ${track.en}`}
      />
      <div className="content drill-detail">
        <nav className="crumb" aria-label="面包屑 / Breadcrumb">
          <Link href="/drill">
            <T zh="八股题库" en="Question bank" />
          </Link>
          <span className="crumb-sep" aria-hidden>
            /
          </span>
          <Link href={`/drill?track=${q.track}`}>
            <T zh={track.zh} en={track.en} />
          </Link>
        </nav>

        <div className="lesson-n">
          <T zh={`第 ${index} / ${total} 道`} en={`${index} / ${total}`} />
          <span className="crumb-sep"> · </span>
          {q.bank.length > 0 ? (
            <span className="mono">{q.bank.map((n) => `#${n}`).join(" / ")}</span>
          ) : (
            <span>
              <T zh="DrillLab 自出" en="By DrillLab" />
            </span>
          )}
        </div>

        <h1 className="drill-detail-title serif">{q.zh}</h1>
        <p className="drill-detail-en" lang="en">
          {q.en}
        </p>

        <div className="drill-detail-marks">
          <span className="strip-label">
            <T zh="先自己答，再往下看" en="Answer it yourself first" />
          </span>
          <DrillMarks id={q.id} />
        </div>

        <div className="drill-detail-body">
          <DrillAnswer q={q} scope="one" />
        </div>

        <div className="drill-detail-foot">
          <span className="dim" style={{ fontSize: 14 }}>
            <T zh="这道题的出处：" en="Comes from:" />{" "}
            <Link href={`${lessonPath(q.examId, q.lessonId)}#${q.id}`}>
              <T zh="课程里的这一节 →" en="this lesson →" />
            </Link>
          </span>
          <Link className="btn btn-sm" href="/drill/session">
            <T zh="用抽认卡过一遍" en="Run a flashcard round" />
          </Link>
        </div>

        {/* 复用课程页页脚那套样式，但文案得是「上一题 / 下一题」 */}
        <nav className="lesson-foot" aria-label="上一题 / 下一题">
          {prev ? (
            <Link className="foot-link" data-dir="prev" href={`/drill/${prev.id}`}>
              <span className="foot-dir">
                <T zh="← 上一题" en="← Previous" />
              </span>
              <span className="foot-title">
                <T zh={prev.zh} en={prev.en} />
              </span>
            </Link>
          ) : (
            <div className="foot-spacer" />
          )}
          {next ? (
            <Link className="foot-link" data-dir="next" href={`/drill/${next.id}`}>
              <span className="foot-dir">
                <T zh="下一题 →" en="Next →" />
              </span>
              <span className="foot-title">
                <T zh={next.zh} en={next.en} />
              </span>
            </Link>
          ) : (
            <div className="foot-spacer" />
          )}
        </nav>
      </div>
    </main>
  );
}
