"use client";

// 六种练习的实现 + 一个分发器 <ExerciseView />。
//
// Level 1 recognition / ordering  —— 认得出概念、排得对顺序
// Level 2 fill-blank              —— 挖空（空位只挖真正的知识点）
// Level 2/3 debug                 —— Debug Lab：读报错 → 判类型 → 定位 → 改 → 验证
// Level 3 code-completion         —— 只给签名和要求，自己写整块；文本级 Check
// Level 4 from-scratch            —— 从空文件开始，四级提示，最后才给答案
//
// 做对了会写进进度(useProgress.markExercise)，不做花哨的庆祝动画。

import { useMemo, useState, type ReactNode } from "react";
import type {
  CodeCompletionExercise,
  DebugExercise,
  Exercise,
  FillBlankExercise,
  FromScratchExercise,
  OrderingExercise,
  RecognitionExercise,
} from "@/content/types";
import { useProgress } from "@/lib/progress";
import { BilingualList } from "./lesson-kit";
import { L, T } from "./t";
import { CodeBlock, CodeFragment, DiffView, EditableCode, TerminalCommand } from "./code";
import { HintPanel, SolutionGate } from "./hint-panel";
import { useT } from "@/lib/locale";
import { KIND_LABEL, LEVEL_HINT, LEVEL_LABEL } from "@/lib/exercise-labels";

/* ============================================================
   外壳
   ============================================================ */



function ExShell({
  ex,
  examId,
  children,
  right,
}: {
  ex: Exercise;
  examId: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  const t = useT();
  const { exerciseDone, ready } = useProgress();
  const done = ready && exerciseDone(examId, ex.id);

  return (
    <div className="ex" id={`ex-${ex.id}`}>
      <div className="ex-head">
        {/* 【难度和题型分开写】老代码把难度徽章写成「L2 · 填空」，
            而 L2 里既有填空也有 Debug Lab —— 一道 Debug Lab 的题头上
            就明晃晃写着「填空」，标题自己和自己打架。
            现在左边只说刻度（L2），右边说题型（Debug Lab）。
            标签在 lib/exercise-labels.ts，和练习场筛选器共用同一份。 */}
        <span className="ex-level" data-level={ex.level} title={t(LEVEL_HINT[ex.level].zh, LEVEL_HINT[ex.level].en)}>
          {LEVEL_LABEL[ex.level]}
        </span>
        <span className="ex-kind">
          <T zh={KIND_LABEL[ex.kind].zh} en={KIND_LABEL[ex.kind].en} />
        </span>
        <span className="ex-title">
          <T zh={ex.title} en={ex.titleEn} />
        </span>
        <span className="ex-head-right">
          {ex.generated && (
            <span
              className="tag"
              data-tone="warn"
              title="DrillLab 自出的题，不是源项目原题 / Written by DrillLab, not from the source project"
            >
              <T en="Written by DrillLab" zh="DrillLab 自出" />
            </span>
          )}
          {done && (
            <span className="tag" data-tone="ok">
              <T en="Solved" zh="做对过" />
            </span>
          )}
          {right}
        </span>
      </div>
      <div className="ex-body">
        <div className="ex-prompt">
          <T zh={ex.prompt} en={ex.promptEn} />
        </div>
        {children}
      </div>
    </div>
  );
}

/* ============================================================
   Level 1 —— 识别
   ============================================================ */

const KEYS = "ABCDEFGH";

function Recognition({ ex, examId }: { ex: RecognitionExercise; examId: string }) {
  const { markExercise } = useProgress();
  const multi = ex.answer.length > 1;
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);

  const right =
    picked.length === ex.answer.length && picked.every((p) => ex.answer.includes(p));

  const toggle = (id: string) => {
    if (checked) return;
    setPicked(multi ? (picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id]) : [id]);
  };

  const state = (id: string) => {
    if (!checked) return picked.includes(id) ? "picked" : undefined;
    if (ex.answer.includes(id)) return "right";
    return picked.includes(id) ? "wrong" : undefined;
  };

  return (
    <ExShell ex={ex} examId={examId}>
      {ex.code && <CodeBlock ex={ex.code} />}

      {multi && (
        <p className="ex-note">
          <T en="More than one answer is correct." zh="这题是多选。" />
        </p>
      )}

      <div className="opts" role={multi ? "group" : "radiogroup"}>
        {ex.options.map((o, i) => (
          <button
            key={o.id}
            type="button"
            className="opt"
            data-state={state(o.id)}
            disabled={checked}
            onClick={() => toggle(o.id)}
          >
            <span className="opt-key" aria-hidden>
              {KEYS[i]}
            </span>
            <span className="opt-label mono">
              <T zh={o.label} en={o.labelEn} />
            </span>
          </button>
        ))}
      </div>

      <div className="ex-actions">
        {!checked ? (
          <>
            <button
              type="button"
              className="btn btn-sm"
              disabled={picked.length === 0}
              aria-describedby={picked.length === 0 ? `${ex.id}-why-disabled` : undefined}
              onClick={() => {
                setChecked(true);
                if (
                  picked.length === ex.answer.length &&
                  picked.every((p) => ex.answer.includes(p))
                ) {
                  markExercise(examId, ex.id);
                }
              }}
            >
              <T en="Check" zh="检查" />
            </button>
            {/* disabled 时必须说清缺什么，光变灰会被当成坏了 */}
            {picked.length === 0 && (
              <span className="why-disabled" id={`${ex.id}-why-disabled`}>
                <T zh="先选一个选项" en="Pick an option first" />
              </span>
            )}
          </>
        ) : (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              setChecked(false);
              setPicked([]);
            }}
          >
            <T en="Try again" zh="再来一次" />
          </button>
        )}
        {checked && (
          <span className="ex-verdict" data-ok={right}>
            {right ? <T en="Correct" zh="对了" /> : <T en="Not yet" zh="还不对" />}
          </span>
        )}
      </div>

      {checked && (
        <div className="blank-why">
          <div className="blank-why-row">
            <span className="blank-why-n">
              <T en="Why" zh="为什么" />
            </span>
            <span>
              <T zh={ex.explain} en={ex.explainEn} />
            </span>
          </div>
        </div>
      )}
    </ExShell>
  );
}

/* ============================================================
   Level 1 —— 排序
   ============================================================ */

function Ordering({ ex, examId }: { ex: OrderingExercise; examId: string }) {
  const t = useT();
  const { markExercise } = useProgress();
  const [order, setOrder] = useState(() => ex.items.map((i) => i.id));
  const [checked, setChecked] = useState(false);

  const right = order.every((id, i) => id === ex.answer[i]);

  const move = (from: number, to: number) => {
    if (checked || to < 0 || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setOrder(next);
  };

  // 返回 <T>，因为条目标签是双语的（labelEn 可能缺，<T> 会回落中文）
  const label = (id: string) => {
    const it = ex.items.find((i) => i.id === id);
    return it ? <T zh={it.label} en={it.labelEn} /> : id;
  };

  return (
    <ExShell ex={ex} examId={examId}>
      <div className="order-list">
        {order.map((id, i) => (
          <div
            key={id}
            className="order-item"
            data-state={checked ? (ex.answer[i] === id ? "right" : "wrong") : undefined}
          >
            <span className="order-n">{i + 1}</span>
            <span className="order-label mono">
              {label(id)}
            </span>
            {/* 上移 / 下移走全站唯一那套按钮（.btn.btn-sm），
                .order-move-btn 只负责把它压成正方形 —— 老代码在这里
                自己画了一个 24×24 的小方块，既不是 .btn，也够不到触摸目标。 */}
            <span className="order-move">
              <button
                type="button"
                className="btn btn-sm order-move-btn"
                onClick={() => move(i, i - 1)}
                disabled={i === 0 || checked}
                aria-label={t("上移", "Move up")}
              >
                ↑
              </button>
              <button
                type="button"
                className="btn btn-sm order-move-btn"
                onClick={() => move(i, i + 1)}
                disabled={i === order.length - 1 || checked}
                aria-label={t("下移", "Move down")}
              >
                ↓
              </button>
            </span>
          </div>
        ))}
      </div>

      <div className="ex-actions">
        {!checked ? (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              setChecked(true);
              if (order.every((id, i) => id === ex.answer[i])) markExercise(examId, ex.id);
            }}
          >
            <T en="Check the order" zh="检查顺序" />
          </button>
        ) : (
          <button type="button" className="btn btn-sm" onClick={() => setChecked(false)}>
            <T en="Keep rearranging" zh="继续调整" />
          </button>
        )}
        {checked && (
          <span className="ex-verdict" data-ok={right}>
            {right ? <T en="Order is right" zh="顺序对了" /> : <T en="Something is out of place" zh="有位置不对" />}
          </span>
        )}
      </div>

      {checked && (
        <div className="blank-why">
          <div className="blank-why-row">
            <span className="blank-why-n">
              <T en="Why" zh="为什么" />
            </span>
            <span>
              <T zh={ex.explain} en={ex.explainEn} />
            </span>
          </div>
        </div>
      )}
    </ExShell>
  );
}

/* ============================================================
   Level 2 —— 填空
   ============================================================ */

/** 把含 ___n___ 的模板切成「文本片段 + 空位」序列，按行组织 */
function parseTemplate(template: string) {
  return template.split("\n").map((line) => {
    const parts: ({ text: string } | { blank: number })[] = [];
    const re = /___(\d+)___/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line))) {
      if (m.index > last) parts.push({ text: line.slice(last, m.index) });
      parts.push({ blank: Number(m[1]) });
      last = m.index + m[0].length;
    }
    if (last < line.length) parts.push({ text: line.slice(last) });
    return parts;
  });
}

const norm = (s: string) => s.trim().replace(/\s+/g, " ");

function FillBlank({ ex, examId }: { ex: FillBlankExercise; examId: string }) {
  const t = useT();
  const { markExercise } = useProgress();
  // 空位是靠 ___n___ 占位符对齐的，所以英文模板必须占位符一致。
  // 这里用 t() 而不是 <T> 双份渲染：模板要先解析成空位再渲染，
  // 渲染两份等于出现两套输入框，一套是隐藏的 —— 那会让 Tab 键走进看不见的框。
  const template = t(ex.template, ex.templateEn ?? ex.template);
  const lines = useMemo(() => parseTemplate(template), [template]);
  const [vals, setVals] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const [showHints, setShowHints] = useState(false);

  const isRight = (n: number) => {
    const blank = ex.blanks.find((b) => b.n === n);
    if (!blank) return false;
    return blank.accept.some((a) => norm(a) === norm(vals[n] ?? ""));
  };

  const allRight = ex.blanks.every((b) => isRight(b.n));
  const filled = ex.blanks.every((b) => (vals[b.n] ?? "").trim().length > 0);
  const remaining = ex.blanks.filter((b) => (vals[b.n] ?? "").trim().length === 0).length;

  return (
    <ExShell ex={ex} examId={examId}>
      <div className="blank-code">
        <div className="codewin-bar">
          <span className="codewin-lang">{ex.language.toUpperCase()}</span>
          {ex.filename && (
            <span className="codewin-name">
              <T zh={ex.filename} en={ex.filenameEn} />
            </span>
          )}
          <span className="codewin-bar-right">
            <span className="codewin-flag">
              <T en={`${ex.blanks.length} blanks`} zh={`${ex.blanks.length} 个空`} />
            </span>
          </span>
        </div>
        <div className="blank-body">
          {lines.map((parts, li) => (
            <div key={li} className="cl">
              <span className="cl-n">{li + 1}</span>
              <span className="cl-c">
                {parts.map((p, pi) =>
                  "text" in p ? (
                    <CodeFragment key={pi} text={p.text} lang={ex.language} />
                  ) : (
                    <span key={pi}>
                      <span className="blank-n" aria-hidden>
                        {p.blank}
                      </span>
                      <input
                        className="blank-input"
                        data-state={
                          checked ? (isRight(p.blank) ? "right" : "wrong") : undefined
                        }
                        style={{
                          width: `${
                            (ex.blanks.find((b) => b.n === p.blank)?.width ??
                              Math.max(
                                6,
                                (ex.blanks.find((b) => b.n === p.blank)?.accept[0]
                                  ?.length ?? 8) + 2,
                              )) * 0.62
                          }em`,
                        }}
                        value={vals[p.blank] ?? ""}
                        placeholder={t(`空 ${p.blank}`, `Blank ${p.blank}`)}
                        spellCheck={false}
                        autoCapitalize="off"
                        autoCorrect="off"
                        aria-label={t(`第 ${p.blank} 个空`, `Blank ${p.blank}`)}
                        onChange={(e) => {
                          setChecked(false);
                          setVals({ ...vals, [p.blank]: e.target.value });
                        }}
                      />
                    </span>
                  ),
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="ex-actions">
        {/* disabled 按钮必须说清为什么 —— 光变灰会让人以为坏了。
            这里直接把「还差几个空」写在按钮旁边。 */}
        <button
          type="button"
          className="btn btn-sm"
          disabled={!filled}
          aria-describedby={!filled ? `${ex.id}-why-disabled` : undefined}
          onClick={() => {
            setChecked(true);
            if (ex.blanks.every((b) => b.accept.some((a) => norm(a) === norm(vals[b.n] ?? "")))) {
              markExercise(examId, ex.id);
            }
          }}
        >
          <T en="Check my answers" zh="检查答案" />
        </button>
        {!filled && (
          <span className="why-disabled" id={`${ex.id}-why-disabled`}>
            <T
              zh={`把 ${ex.blanks.length} 个空都填上才能检查（还差 ${remaining} 个）`}
              en={`Fill all ${ex.blanks.length} blanks to check (${remaining} to go)`}
            />
          </span>
        )}
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            setVals({});
            setChecked(false);
          }}
        >
          <T en="Reset" zh="重置" />
        </button>
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => setShowHints(!showHints)}
        >
          {showHints ? <T en="Hide hints" zh="收起提示" /> : <T en="Show hints" zh="看提示" />}
        </button>
        {checked && (
          <span className="ex-verdict" data-ok={allRight}>
            {allRight
              ? t("全对", "All correct")
              : t(
                  `${ex.blanks.filter((b) => isRight(b.n)).length} / ${ex.blanks.length} 对`,
                  `${ex.blanks.filter((b) => isRight(b.n)).length} / ${ex.blanks.length} correct`,
                )}
          </span>
        )}
      </div>

      {showHints && !checked && (
        <div className="blank-why">
          {ex.blanks.map((b) => (
            <div key={b.n} className="blank-why-row">
              <span className="blank-why-n">
                <T en={`Blank ${b.n}`} zh={`空 ${b.n}`} />
              </span>
              <span>
                <T zh={b.hint} en={b.hintEn} />
              </span>
            </div>
          ))}
        </div>
      )}

      {checked && (
        <div className="blank-why">
          {ex.blanks.map((b) => (
            <div key={b.n} className="blank-why-row">
              <span className="blank-why-n" data-ok={isRight(b.n)}>
                {isRight(b.n) ? "✓" : "✕"} {b.n}
              </span>
              <span>
                <b>{b.accept[0]}</b>
                {b.accept.length > 1 && (
                  <span className="dimmer blank-alt">
                    <T
                      en={` (also accepts ${b.accept.slice(1).join(" / ")})`}
                      zh={`（也接受 ${b.accept.slice(1).join(" / ")}）`}
                    />
                  </span>
                )}
                <br />
                <T zh={b.why} en={b.whyEn} />
              </span>
            </div>
          ))}
        </div>
      )}
    </ExShell>
  );
}

/* ============================================================
   Level 3 —— 写整块
   ============================================================ */

/** 去掉注释和字符串，避免「把答案写在注释里」也算通过 */
function stripNoise(code: string) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ")
    .replace(/#[^\n]*/g, " ");
}

function CodeCompletion({ ex, examId }: { ex: CodeCompletionExercise; examId: string }) {
  const t = useT();
  const { markExercise } = useProgress();
  const [value, setValue] = useState(ex.starter);
  const [checked, setChecked] = useState(false);

  const results = useMemo(() => {
    const src = stripNoise(value);
    return ex.checks.map((c) => {
      let ok = true;
      if (c.must) ok = ok && new RegExp(c.must, "m").test(src);
      if (c.mustNot) ok = ok && !new RegExp(c.mustNot, "m").test(src);
      return { label: c.label, labelEn: c.labelEn, ok };
    });
  }, [value, ex.checks]);

  const allOk = results.every((r) => r.ok);

  return (
    <ExShell ex={ex} examId={examId}>
      <div className="minihead">
        <T en="Requirements" zh="要求" />
      </div>
      <ul className="ws-req">
        <BilingualList zh={ex.requirements} en={ex.requirementsEn} />
      </ul>

      <EditableCode
        language={ex.language}
        filename={ex.filename}
        value={value}
        onChange={(v) => {
          setValue(v);
          setChecked(false);
        }}
        onReset={() => {
          setValue(ex.starter);
          setChecked(false);
        }}
        rows={Math.max(10, ex.starter.split("\n").length + 4)}
        actions={
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              setChecked(true);
              if (allOk) markExercise(examId, ex.id);
            }}
          >
            <T en="Check my code" zh="检查我的代码" />
          </button>
        }
        message={
          checked ? (
            <span className="ex-verdict" data-ok={allOk}>
              {allOk
                ? t("检查项全过", "All checks pass")
                : t(
                    `${results.filter((r) => r.ok).length} / ${results.length} 项通过`,
                    `${results.filter((r) => r.ok).length} / ${results.length} checks pass`,
                  )}
            </span>
          ) : (
            t(
              "检查是文本级的：它看你有没有用对关键写法，不代表能跑通",
              "This check is textual: it looks for the right constructs, it does not run your code",
            )
          )
        }
      />

      {checked && (
        <div className="checks">
          {results.map((r, i) => (
            <div key={i} className="check-row" data-ok={r.ok}>
              <span className="check-mark" aria-hidden>
                {r.ok ? "✓" : "✕"}
              </span>
              <span>
                <T zh={r.label} en={r.labelEn} />
              </span>
            </div>
          ))}
        </div>
      )}

      <HintPanel hints={ex.hints} hintsEn={ex.hintsEn} />

      <div className="ex-solution">
        <SolutionGate>
          <div className="minihead">
            <T en="Reference answer" zh="参考答案" />
          </div>
          <CodeBlock ex={ex.solution} />
          <div className="minihead">
            <T en="Your code vs the reference" zh="你的代码 vs 参考答案" />
          </div>
          <div className="codewin ex-diff">
            <DiffView mine={value} theirs={ex.solution.code} />
          </div>
        </SolutionGate>
      </div>
    </ExShell>
  );
}

/* ============================================================
   Debug Lab
   ============================================================ */

function Debug({ ex, examId }: { ex: DebugExercise; examId: string }) {
  const { markExercise } = useProgress();
  const [cls, setCls] = useState<string | null>(null);
  const [loc, setLoc] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const clsOk = cls === ex.classify.answer;
  const locOk = loc === ex.locate.answer;
  const brokenLines = ex.broken.code.trimEnd().split("\n").length;

  /** 退回某一步重做。把那一步及之后的选择清掉 —— 清掉之后
      data-state 只剩 "picked"，刚才泄露的正确答案高亮也跟着消失。 */
  const redoFrom = (n: 1 | 2) => {
    if (n <= 1) setCls(null);
    setLoc(null);
    setStep(n);
  };

  return (
    <ExShell ex={ex} examId={examId}>
      {/* 【第 1 步必须给代码】
          原来 ex.broken 只在第 3 步渲染，而第 2 步就要你判断「这是什么类型的
          错误」—— 手里只有报错文本。对于「没有报错，只有症状」那一类
          （状态更新错误：push 完 setState，界面不动），报错文本里根本没有代码，
          等于让人凭空猜。用户的原话：「你告诉我代码是哪啊？是什么样？」
          现在第 1 步就是「现场」：症状 + 出错的代码，两样一起给。
          第 3 步只问哪一行，不再重复贴一遍。 */}
      <div className="errbox">
        <div className="errbox-bar">
          <T
            en="Step 1 · read the symptom and the code before you touch anything"
            zh="第 1 步 · 先看现象和代码，别急着改"
          />
        </div>
        <div className="errbox-body">
          <T zh={ex.errorOutput} en={ex.errorOutputEn} />
        </div>
      </div>

      <CodeBlock ex={ex.broken} />

      <div className="debug-step" data-done={step > 1}>
        <div className="debug-step-head">
          <T en="Step 2 · what kind of error is this" zh="第 2 步 · 这是什么类型的错误" />
        </div>
        <div className="opts">
          {ex.classify.options.map((o, i) => (
            <button
              key={o.id}
              type="button"
              className="opt"
              disabled={step > 1}
              data-state={
                step > 1
                  ? o.id === ex.classify.answer
                    ? "right"
                    : o.id === cls
                      ? "wrong"
                      : undefined
                  : cls === o.id
                    ? "picked"
                    : undefined
              }
              onClick={() => setCls(o.id)}
            >
              <span className="opt-key" aria-hidden>
                {KEYS[i]}
              </span>
              <span className="opt-label">
                <T zh={o.label} en={o.labelEn} />
              </span>
            </button>
          ))}
        </div>
        {step === 1 && (
          <button
            type="button"
            className="btn btn-sm"
            disabled={!cls}
            onClick={() => setStep(2)}
          >
            <T en="Confirm" zh="确定" />
          </button>
        )}
        {step > 1 && (
          <div className="ex-actions">
            <span className="ex-verdict" data-ok={clsOk}>
              {clsOk ? (
                <T en="Right call." zh="判断对了。" />
              ) : (
                <T en="Not that kind — the green one is it." zh="不是这一类 —— 绿色那条才是。" />
              )}
            </span>
            {/* 【选错必须能重来】原来选错了就锁死，只能刷新整页 ——
                而刷新会把这一页所有练习的作答全清掉。 */}
            {!clsOk && (
              <button type="button" className="btn btn-sm" onClick={() => redoFrom(1)}>
                <T en="Redo this step" zh="这一步重做" />
              </button>
            )}
          </div>
        )}
      </div>

      {step >= 2 && (
        <div className="debug-step" data-done={step > 2}>
          <div className="debug-step-head">
            <T en="Step 3 · where the fault is" zh="第 3 步 · 病灶在哪" />
          </div>
          <p className="debug-q">
            <T zh={ex.locate.question} en={ex.locate.questionEn} />
          </p>
          {/* 代码在第 1 步已经给全了。只有**长到会滚出屏幕**的才在这里再放一份
              收起的供对照 —— 短代码重复贴一遍纯属噪音，而且 collapsible 只是
              max-height: 300px，内容不到那么高就会出现一个「展开全部 4 行」
              却什么也没折叠的按钮，看着像坏了。 */}
          {brokenLines > 14 && <CodeBlock ex={{ ...ex.broken, collapsible: true }} />}
          <div className="opts">
            {ex.locate.options.map((o, i) => (
              <button
                key={o.id}
                type="button"
                className="opt"
                disabled={step > 2}
                data-state={
                  step > 2
                    ? o.id === ex.locate.answer
                      ? "right"
                      : o.id === loc
                        ? "wrong"
                        : undefined
                    : loc === o.id
                      ? "picked"
                      : undefined
                }
                onClick={() => setLoc(o.id)}
              >
                <span className="opt-key" aria-hidden>
                  {KEYS[i]}
                </span>
                <span className="opt-label mono">
                  {o.label}
                </span>
              </button>
            ))}
          </div>
          {step === 2 && (
            <button
              type="button"
              className="btn btn-sm"
              disabled={!loc}
              onClick={() => {
                setStep(3);
                // 两步都对才算做对。重做之后再对上也要能记 —— 所以判定放在
                // 这个点上，而不是「第一次提交」这个时刻。
                if (clsOk && loc === ex.locate.answer) markExercise(examId, ex.id);
              }}
            >
              <T en="Confirm" zh="确定" />
            </button>
          )}
          {step > 2 && (
            <div className="ex-actions">
              <span className="ex-verdict" data-ok={locOk}>
                {locOk ? <T en="Found it." zh="找对了。" /> : <T en="Not there." zh="不在这里。" />}
              </span>
              {!locOk && (
                <button type="button" className="btn btn-sm" onClick={() => redoFrom(2)}>
                  <T en="Redo this step" zh="这一步重做" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {step >= 3 && (
        <>
          <div className="debug-step" data-done>
            <div className="debug-step-head">
              <T en="Step 4 · change it to this" zh="第 4 步 · 改成这样" />
            </div>
            <CodeBlock ex={ex.fixed} />
          </div>

          <div className="debug-step" data-done>
            <div className="debug-step-head">
              <T en="Step 5 · verify it yourself" zh="第 5 步 · 自己验证" />
            </div>
            <TerminalCommand
              steps={[
                {
                  cmd: ex.verifyEn ? { zh: ex.verify, en: ex.verifyEn } : ex.verify,
                },
              ]}
            />
          </div>

          <div className="callout" data-tone="why">
            <strong className="callout-title">
              <T en="Root cause" zh="根本原因" />
            </strong>
            <T zh={ex.rootCause} en={ex.rootCauseEn} />
          </div>

          <div className="ex-actions">
            <button type="button" className="btn btn-sm" onClick={() => redoFrom(1)}>
              <T en="Redo the whole thing" zh="整题重做" />
            </button>
            <span className="why-disabled">
              <T
                zh="看懂了不等于会 —— 隔一天回来空手再走一遍"
                en="Understanding it is not the same as being able to do it — come back tomorrow and walk it again"
              />
            </span>
          </div>
        </>
      )}
    </ExShell>
  );
}

/* ============================================================
   Level 4 —— 从零重写
   ============================================================ */

function FromScratch({ ex, examId }: { ex: FromScratchExercise; examId: string }) {
  const t = useT();
  const { rebuildDone, markRebuild, ready } = useProgress();
  const done = ready && rebuildDone(examId, ex.id);

  return (
    <ExShell
      ex={ex}
      examId={examId}
      right={
        done ? (
          <span className="tag" data-tone="ok">
            <T en="Rebuild done" zh="已完成重写" />
          </span>
        ) : undefined
      }
    >
      <div className="ws-brief">
        <div className="ws-brief-head">
          <T
            en="Requirements — no code given, implement it yourself"
            zh="需求（不给代码，自己实现）"
          />
        </div>
        <ul className="ws-req">
          <BilingualList zh={ex.requirements} en={ex.requirementsEn} />
        </ul>
      </div>

      <div className="minihead">
        <T en="Files you create yourself" zh="你需要自己建的文件" />
      </div>
      <div className="filetree">
        <div className="filetree-bar">
          <span>
            <T en="File list" zh="文件清单" />
          </span>
        </div>
        <div className="filetree-body">
          {ex.fileList.map((f) => (
            <div key={f.path} className="ft-row">
              <span className="ft-path">{f.path}</span>
              <span className="ft-role">
                <T zh={f.role} en={f.roleEn} />
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="minihead">
        <T en="Verify it locally like this" zh="写完后在本机这样验证" />
      </div>
      <TerminalCommand
        steps={ex.commands.map((c) => ({
          cmd: c.cmd,
          out: c.expectEn ? { zh: c.expect, en: c.expectEn } : c.expect,
        }))}
      />

      <HintPanel hints={ex.hints} hintsEn={ex.hintsEn} />

      <div className="ex-solution">
        <SolutionGate
          note={L(
            "这一关的意义就在于「没有答案也能写出来」。请确认你已经在本机建好文件、跑过验证命令，再打开参考答案对照。",
            "The whole point of this level is writing it with no answer in front of you. Create the files on your machine and run the verification commands first, then come back and compare.",
          )}
          label={L("我已经在本机做完了，打开参考答案", "I finished it locally — open the reference answer")}
        >
          <div className="minihead">参考答案</div>
          {ex.solution.map((s, i) => (
            <CodeBlock key={i} ex={s} />
          ))}
        </SolutionGate>
      </div>

      <div className="done-bar ex-done" data-done={done}>
        <span className="done-bar-text">
          {done
            ? t(
                "你标记了「已从零写完并跑通」。",
                "You marked this as rebuilt from scratch and passing.",
              )
            : t(
                "在本机独立写完、并且验证命令给出预期结果之后，再勾这里。",
                "Tick this once you have written it locally and the verification commands give the expected output.",
              )}
        </span>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => markRebuild(examId, ex.id)}
        >
          {done ? (
            <T en="Unmark" zh="取消标记" />
          ) : (
            <T en="I rebuilt it and it passes" zh="我从零写完并跑通了" />
          )}
        </button>
      </div>
    </ExShell>
  );
}

/* ============================================================
   分发器
   ============================================================ */

export function ExerciseView({ ex, examId }: { ex: Exercise; examId: string }) {
  switch (ex.kind) {
    case "recognition":
      return <Recognition ex={ex} examId={examId} />;
    case "ordering":
      return <Ordering ex={ex} examId={examId} />;
    case "fill-blank":
      return <FillBlank ex={ex} examId={examId} />;
    case "code-completion":
      return <CodeCompletion ex={ex} examId={examId} />;
    case "debug":
      return <Debug ex={ex} examId={examId} />;
    case "from-scratch":
      return <FromScratch ex={ex} examId={examId} />;
  }
}
