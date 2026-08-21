"use client";

// 分级提示 —— 一次只放一级，不点一下就把答案全倒出来。
//
// 四级递进（与 FromScratchExercise.hints 的顺序一致）：
//   1 只说思考方向
//   2 说该改哪个文件 / 用什么概念
//   3 给伪代码
//   4 给局部代码
// 答案是第五步，由调用方单独用 SolutionGate 控制。
//
// 【双语】note / label 收的是 LocalizedString（见 components/t.tsx）——
// 调用方用 L("中文", "English") 传，两种语言同时进 HTML，CSS 藏一份。
// 提示正文（hints 数组）来自课程内容，那一层的翻译是另一件事，这里不管。

import { useState, type ReactNode } from "react";
import { L, Loc, T, type LocalizedString } from "./t";

const STEP_LABEL: LocalizedString[] = [
  L("提示 1 · 先想这个方向", "Hint 1 · which direction to think in"),
  L("提示 2 · 该动哪里 / 用什么", "Hint 2 · what to touch and what to use"),
  L("提示 3 · 伪代码", "Hint 3 · pseudocode"),
  L("提示 4 · 局部代码", "Hint 4 · partial code"),
];

export function HintPanel({ hints }: { hints: string[] }) {
  const [shown, setShown] = useState(0);
  const left = hints.length - shown;

  return (
    <div className="hints">
      <div className="hints-head">
        <strong>
          <T en="Hints" zh="提示" />
        </strong>
        <span>
          <T
            en={`${hints.length} levels, ${shown} opened`}
            zh={`共 ${hints.length} 级，已看 ${shown} 级`}
          />
        </span>
        {left > 0 && (
          <button
            className="btn btn-sm"
            onClick={() => setShown(shown + 1)}
            style={{ marginLeft: "auto" }}
            type="button"
          >
            {shown === 0 ? (
              <T en="I am stuck, point me somewhere" zh="我卡住了，给个方向" />
            ) : (
              <T
                en={`One more hint (${left} left)`}
                zh={`再给一级提示（还剩 ${left}）`}
              />
            )}
          </button>
        )}
        {shown > 0 && (
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setShown(0)}
            style={left > 0 ? undefined : { marginLeft: "auto" }}
            type="button"
          >
            <T en="Collapse" zh="收起" />
          </button>
        )}
      </div>

      {shown === 0 ? (
        <div className="hint-more dim" style={{ fontSize: 14.5 }}>
          <T
            en="Think for two minutes first. Then use the button above — hints come one level at a time, never all at once."
            zh="先自己想两分钟。想不出来再点右上角 —— 提示是一级一级放的，不会一次给完。"
          />
        </div>
      ) : (
        hints.slice(0, shown).map((h, i) => (
          <div className="hint-step" key={i}>
            <span className="hint-step-n">
              {STEP_LABEL[i] ? (
                <Loc v={STEP_LABEL[i]} />
              ) : (
                <T en={`Hint ${i + 1}`} zh={`提示 ${i + 1}`} />
              )}
            </span>
            {h}
          </div>
        ))
      )}
    </div>
  );
}

/** 参考答案的「门」—— 必须显式点开 */
export function SolutionGate({
  children,
  note = L(
    "看答案之前，先确认你已经自己动手写过一遍。看懂别人的答案和自己写出来，是两种能力。",
    "Before you open this, make sure you have written it yourself once. Following someone else's answer and producing your own are two different skills.",
  ),
  label = L("我写过了，给我看参考答案", "I wrote it — show me the reference answer"),
}: {
  children: ReactNode;
  note?: LocalizedString;
  label?: LocalizedString;
}) {
  const [open, setOpen] = useState(false);

  if (open) return <>{children}</>;

  return (
    <div className="reveal-gate">
      <p>
        <Loc v={note} />
      </p>
      <button className="btn" onClick={() => setOpen(true)} type="button">
        <Loc v={label} />
      </button>
    </div>
  );
}
