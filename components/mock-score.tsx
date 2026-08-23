"use client";

// 模拟考的自评分小岛。服务端的详情页只把 examId / mockId / 满分传进来，
// 进度读写留在客户端。

import { useState } from "react";
import { useT } from "@/lib/locale";
import { useProgress } from "@/lib/progress";
import { T } from "./t";

export function MockScore({
  examId,
  mockId,
  outOf,
}: {
  examId: string;
  mockId: string;
  outOf: number;
}) {
  const { mockRecord, markMock, ready } = useProgress();
  const t = useT();
  const [score, setScore] = useState("");

  const rec = ready ? mockRecord(examId, mockId) : undefined;

  return (
    <div className="done-bar" data-done={!!rec} style={{ marginTop: "var(--sp-4)" }}>
      <span className="done-bar-text">
        {rec ? (
          rec.score !== undefined ? (
            <T
              en={`Your recorded score: ${rec.score} / ${rec.outOf}.`}
              zh={`你记录的成绩：${rec.score} / ${rec.outOf}。`}
            />
          ) : (
            <T en="Marked as attempted." zh="已标记为做过。" />
          )
        ) : (
          <T
            en="When you are done, score yourself against the rubric and record it here."
            zh="做完之后按 rubric 给自己打个分，记在这里。"
          />
        )}
      </span>
      <input
        className="mono mk-score"
        placeholder={`/${outOf}`}
        value={score}
        onChange={(e) => setScore(e.target.value)}
        aria-label={t("自评得分", "Self-assessed score")}
      />
      <button
        type="button"
        className="btn btn-sm btn-primary"
        onClick={() => {
          const n = Number(score);
          markMock(
            examId,
            mockId,
            Number.isFinite(n) && score.trim() !== "" ? n : undefined,
            outOf,
          );
        }}
      >
        <T en="Record it" zh="记下成绩" />
      </button>
    </div>
  );
}
