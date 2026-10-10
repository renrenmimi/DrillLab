"use client";

// 模拟考的自评分小岛。服务端的详情页只把 examId / mockId / 满分传进来，
// 进度读写留在客户端。

import { useEffect, useId, useState } from "react";
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
  const hintId = useId();

  const rec = ready ? mockRecord(examId, mockId) : undefined;

  // 记过分的，输入框里回填那个分数 —— 不然改分时得先想起上次填的是几
  const recorded = rec?.score;
  useEffect(() => {
    if (recorded !== undefined) setScore((s) => (s === "" ? String(recorded) : s));
  }, [recorded]);

  // 【分数要在 0 到满分之间，步长 0.5】曾经只看 Number.isFinite，
  // 负数、999 / 20、1e3 都照样记下（审查 A38）。空着就是「只标做过」。
  const trimmed = score.trim();
  const n = Number(trimmed);
  const empty = trimmed === "";
  const valid = empty || (Number.isFinite(n) && n >= 0 && n <= outOf && Number.isInteger(n * 2));

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
        inputMode="decimal"
        onChange={(e) => setScore(e.target.value)}
        aria-label={t("自评得分", "Self-assessed score")}
        aria-invalid={!valid || undefined}
        aria-describedby={valid ? undefined : hintId}
      />
      <button
        type="button"
        className="btn btn-sm btn-primary"
        disabled={!valid}
        onClick={() => {
          markMock(examId, mockId, empty ? undefined : n, outOf);
        }}
      >
        <T en="Record it" zh="记下成绩" />
      </button>
      {!valid && (
        <span className="why-disabled" id={hintId}>
          <T
            zh={`填 0 到 ${outOf} 之间的数，可以带 .5；空着就只记「做过」。`}
            en={`Enter a number from 0 to ${outOf} (halves allowed), or leave it empty to mark it attempted.`}
          />
        </span>
      )}
    </div>
  );
}
