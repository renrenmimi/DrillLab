"use client";

// 代码展示原语。
//  CodeBlock        —— 只读代码窗：文件名 + 语言 + 来源标注 + 行号 + 行高亮 + 复制
//  TerminalCommand  —— 终端命令（带 $ 提示符、可复制、可附真实输出）
//  EditableCode     —— 可编辑代码区（Reset / 复制 / 外部传入的动作按钮）
//  DiffView         —— 行级差异对照（用户代码 vs 参考答案）

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { highlight, LANG_LABEL, type Lang } from "@/lib/highlight";
import { useT } from "@/lib/locale";
import { Loc, T, pick, type LocalizedString } from "./t";
import type { CodeExample } from "@/content/types";

/* ---------- 复制按钮 ---------- */

function useCopy() {
  const [copied, setCopied] = useState(false);
  // 「已复制」那个提示要在 1.4 秒后收回。timer 存在 ref 里，
  // 卸载时清掉 —— 不然组件没了它还会去 setState。
  // （这一条正是本站计时器那道题的考点，自己先做到。）
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const copy = (text: string) => {
    const done = () => {
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1400);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done, () => {});
    } else {
      // 老环境兜底
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        done();
      } finally {
        document.body.removeChild(ta);
      }
    }
  };
  return { copied, copy };
}

/* ---------- 高亮行渲染 ---------- */

export function CodeLines({
  code,
  lang,
  highlightLines,
}: {
  code: string;
  lang: Lang;
  highlightLines?: number[];
}) {
  const lines = useMemo(
    () => highlight(code.replace(/\s+$/, ""), lang),
    [code, lang],
  );
  const hl = useMemo(() => new Set(highlightLines ?? []), [highlightLines]);

  return (
    <>
      {lines.map((toks, i) => (
        <div key={i} className={`cl${hl.has(i + 1) ? " hl" : ""}`}>
          <span className="cl-n">{i + 1}</span>
          <span className="cl-c">
            {toks.length === 0
              ? " "
              : toks.map((tok, j) =>
                  tok.t ? (
                    <span key={j} className={`tk-${tok.t}`}>
                      {tok.s}
                    </span>
                  ) : (
                    <span key={j}>{tok.s}</span>
                  ),
                )}
          </span>
        </div>
      ))}
    </>
  );
}

/** 可信度三档。label 是 JSX（走 <T>），title 是属性（只能收字符串，走 useT）。 */
const FLAG = {
  source: {
    zh: "源项目",
    en: "From source",
    tipZh: "原样来自源项目 —— 在下方 Source 指向的真实文件里能找到",
    tipEn:
      "Verbatim from the source project — find it in the file named under Source",
  },
  verified: {
    zh: "已跑通",
    en: "Verified",
    tipZh: "不在源项目里，但这段代码在本机真实跑过并通过了测试",
    tipEn:
      "Not in the source project, but this code was actually run here and its tests passed",
  },
  demo: {
    zh: "示意",
    en: "Illustrative",
    tipZh: "教学示意代码 / 故意写错的反例 / 未跑过的片段",
    tipEn:
      "Teaching sketch, a deliberately wrong counter-example, or a snippet that was not run",
  },
} as const;

/** 单行片段高亮 —— 不带行号、不带换行，给填空题的模板片段用 */
export function CodeFragment({ text, lang }: { text: string; lang: Lang }) {
  const toks = useMemo(() => highlight(text, lang)[0] ?? [], [text, lang]);
  return (
    <>
      {toks.map((tok, i) =>
        tok.t ? (
          <span key={i} className={`tk-${tok.t}`}>
            {tok.s}
          </span>
        ) : (
          <span key={i}>{tok.s}</span>
        ),
      )}
    </>
  );
}

/* ---------- CodeBlock ---------- */

export function CodeBlock({ ex }: { ex: CodeExample }) {
  const { copied, copy } = useCopy();
  const t = useT();
  const [open, setOpen] = useState(!ex.collapsible);
  // 行数和复制按钮要的是纯字符串，用 t() 解析。
  // 【正文不能这么做】useLocale 初始是 zh，挂载后才切成 en，
  // 用 t() 取正文会让英文读者看到一闪的中文代码。所以正文走 <T> 双份渲染，
  // 由 CSS 隐掉一份 —— 和站里其它内容一个机制，没有闪动。
  // 行数差一位、复制按钮闪一下，看不见也无所谓。
  const codeForCopy = t(ex.code, ex.codeEn ?? ex.code);
  const lineCount = codeForCopy.trimEnd().split("\n").length;

  return (
    <div className="codewin">
      <div className="codewin-bar">
        <span className="codewin-lang">{LANG_LABEL[ex.language]}</span>
        {ex.filename && (
          <span className="codewin-name">
            <T zh={ex.filename} en={ex.filenameEn} />
          </span>
        )}
        <span className="codewin-bar-right">
          <span
            className="codewin-flag"
            data-verified={ex.verified}
            title={t(FLAG[ex.verified].tipZh, FLAG[ex.verified].tipEn)}
          >
            <T en={FLAG[ex.verified].en} zh={FLAG[ex.verified].zh} />
          </span>
          <button
            aria-label={t("复制代码", "Copy code")}
            className="codewin-copy"
            onClick={() => copy(codeForCopy)}
            type="button"
          >
            {copied ? <T en="Copied" zh="已复制" /> : <T en="Copy" zh="复制" />}
          </button>
        </span>
      </div>

      <div className="codewin-body" data-collapsed={ex.collapsible && !open}>
        {/* 这一层 .cl-wrap 不是装饰。它按内容取宽（width: max-content），
            横滚条才有东西可滚；同时每行的 min-width: 100% 是相对它算的，
            所以高亮行的背景能一直铺到最长那一行的末尾。见 styles/code.css。 */}
        <div className="cl-wrap">
          {ex.codeEn ? (
            <T
              zh={
                <CodeLines
                  code={ex.code}
                  lang={ex.language}
                  highlightLines={ex.highlight}
                />
              }
              en={
                <CodeLines
                  code={ex.codeEn}
                  lang={ex.language}
                  highlightLines={ex.highlight}
                />
              }
            />
          ) : (
            <CodeLines
              code={ex.code}
              lang={ex.language}
              highlightLines={ex.highlight}
            />
          )}
        </div>
      </div>

      {ex.collapsible && (
        <button
          type="button"
          className="codewin-expand"
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <T en="Collapse" zh="收起" />
          ) : (
            <T
              en={`Show all ${lineCount} lines`}
              zh={`展开全部 ${lineCount} 行`}
            />
          )}
        </button>
      )}

      {ex.sourceFile && (
        <div className="codewin-src">
          Source: <code>{ex.sourceFile}</code>
        </div>
      )}

      {ex.explanation && <div className="codewin-note">{ex.explanation}</div>}
    </div>
  );
}

/* ---------- TerminalCommand ---------- */

export interface TermStep {
  /**
   * 命令本身。
   *
   * 【为什么可以是双语的】
   * 有些命令带 shell 注释，中文写在注释里，比如
   * `npm test   # 10 个测试应该全部通过`。命令部分两种语言一样，
   * 注释部分不一样，所以整条要能双语。
   * 纯命令直接写字符串就行。
   */
  cmd: LocalizedString;
  /**
   * 真实输出或说明（可选）。写在这里的都应该是实际跑出来的。
   * 可以是双语的 —— 模拟考的「怎么跑起来」那段命令注释就是双语。
   */
  out?: LocalizedString;
}

export function TerminalCommand({
  cwd,
  steps,
}: {
  /** 在哪个目录跑 */
  cwd?: string;
  steps: TermStep[];
}) {
  const { copied, copy } = useCopy();
  const t = useT();

  return (
    <div className="term">
      {cwd && <div className="term-cwd">{cwd}</div>}
      {steps.map((s, i) => (
        <div key={i}>
          <div className="term-row">
            <span className="term-prompt" aria-hidden>
              $
            </span>
            <span className="term-cmd">
              <Loc v={s.cmd} />
            </span>
            <button
              // aria-label 和复制都要纯字符串，所以在这里按当前语言解析一次
              aria-label={t(
                `复制命令 ${pick(s.cmd, "zh")}`,
                `Copy command ${pick(s.cmd, "en")}`,
              )}
              className="term-copy"
              onClick={() => copy(t(pick(s.cmd, "zh"), pick(s.cmd, "en")))}
              type="button"
            >
              {copied ? "✓" : <T en="Copy" zh="复制" />}
            </button>
          </div>
          {s.out && (
            <div className="term-out">
              <Loc v={s.out} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- EditableCode ---------- */

export function EditableCode({
  language,
  filename,
  value,
  onChange,
  onReset,
  rows,
  actions,
  message,
}: {
  language: Lang;
  filename?: string;
  value: string;
  onChange: (next: string) => void;
  onReset: () => void;
  rows?: number;
  actions?: ReactNode;
  message?: ReactNode;
}) {
  const { copied, copy } = useCopy();
  const t = useT();

  return (
    <div className="editor">
      <div className="editor-bar">
        <span className="codewin-lang">{LANG_LABEL[language]}</span>
        {filename && <span className="codewin-name">{filename}</span>}
        <span className="codewin-bar-right">
          <button
            className="codewin-copy"
            onClick={() => copy(value)}
            type="button"
          >
            {copied ? <T en="Copied" zh="已复制" /> : <T en="Copy" zh="复制" />}
          </button>
        </span>
      </div>

      <textarea
        className="editor-area"
        value={value}
        rows={rows ?? 12}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // Tab 插两个空格，而不是跳走焦点
          if (e.key === "Tab") {
            e.preventDefault();
            const el = e.currentTarget;
            const { selectionStart: s, selectionEnd: t } = el;
            const next = value.slice(0, s) + "  " + value.slice(t);
            onChange(next);
            window.requestAnimationFrame(() => {
              el.selectionStart = el.selectionEnd = s + 2;
            });
          }
        }}
      />

      <div className="editor-foot">
        {actions}
        <button className="btn btn-sm" onClick={onReset} type="button">
          <T en="Reset" zh="重置" />
        </button>
        {message && <span className="editor-hintmsg">{message}</span>}
      </div>
    </div>
  );
}

/* ---------- DiffView ---------- */

/** 最短编辑脚本（LCS 回溯），行级 */
function diffLines(a: string[], b: string[]) {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: { k: "same" | "add" | "del"; text: string }[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ k: "same", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ k: "del", text: a[i] });
      i++;
    } else {
      out.push({ k: "add", text: b[j] });
      j++;
    }
  }
  while (i < n) out.push({ k: "del", text: a[i++] });
  while (j < m) out.push({ k: "add", text: b[j++] });
  return out;
}

export function DiffView({ mine, theirs }: { mine: string; theirs: string }) {
  const t = useT();
  const rows = useMemo(
    () => diffLines(mine.trimEnd().split("\n"), theirs.trimEnd().split("\n")),
    [mine, theirs],
  );

  return (
    <div
      aria-label={t(
        "你的代码与参考答案的差异",
        "Your code vs the reference answer",
      )}
      className="diff"
    >
      {rows.map((r, i) => (
        <div key={i} className="diff-row" data-k={r.k}>
          <span className="diff-sign" aria-hidden>
            {r.k === "add" ? "+" : r.k === "del" ? "−" : " "}
          </span>
          <span className="diff-text">{r.text === "" ? " " : r.text}</span>
        </div>
      ))}
    </div>
  );
}
