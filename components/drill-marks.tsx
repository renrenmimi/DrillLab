"use client";

// 掌握状态的两个客户端小岛：三个自评按钮 + 顶部那条进度。
//
// 【为什么是小岛】题目正文是服务端渲染的，这里只碰 localStorage 里的
// 「会 / 模糊 / 不会」。它们不 import 任何内容文件 —— 要题面就读 content/nav。

import { useProgress, type DrillMark } from "@/lib/progress";
import { T } from "./t";

/** 三档自评。key 是抽认卡上的键盘快捷键，列表页也顺手显示出来 */
export const MARK_META: {
  id: DrillMark;
  zh: string;
  en: string;
  key: string;
  tone: "ok" | "warn" | "danger";
}[] = [
  { id: "known", zh: "会", en: "Got it", key: "1", tone: "ok" },
  { id: "fuzzy", zh: "模糊", en: "Shaky", key: "2", tone: "warn" },
  { id: "unknown", zh: "不会", en: "No idea", key: "3", tone: "danger" },
];

export const MARK_BY_ID = new Map(MARK_META.map((m) => [m.id, m]));

/**
 * 三个自评按钮。
 *
 * mode="toggle"（列表页 / 单题页）：再点一次已选中的那档 = 取消标记。
 * mode="set"（抽认卡）：一律写入并回调，不做取消 ——
 *   抽认卡点完要自动进下一题，「点一下变成取消」在那里只会让人误评。
 */
export function DrillMarks({
  id,
  mode = "toggle",
  showKeys = false,
  onMarked,
}: {
  id: string;
  mode?: "toggle" | "set";
  showKeys?: boolean;
  onMarked?: (mark: DrillMark) => void;
}) {
  const { drillMark, setDrillMark, clearDrillMark, ready } = useProgress();
  const current = ready ? drillMark(id) : undefined;

  return (
    <div className="drill-marks" role="group" aria-label="自评掌握状态 / Self-assessment">
      {MARK_META.map((m) => (
        <button
          key={m.id}
          type="button"
          className="drill-mark"
          data-kind={m.id}
          data-on={current === m.id || undefined}
          aria-pressed={current === m.id}
          onClick={() => {
            if (mode === "toggle" && current === m.id) clearDrillMark(id);
            else setDrillMark(id, m.id);
            onMarked?.(m.id);
          }}
        >
          {showKeys && (
            <span className="drill-mark-key" aria-hidden>
              {m.key}
            </span>
          )}
          <T zh={m.zh} en={m.en} />
        </button>
      ))}
    </div>
  );
}

/** 已标状态的小徽章 */
export function DrillMarkBadge({ id }: { id: string }) {
  const { drillMark, ready } = useProgress();
  const mark = ready ? drillMark(id) : undefined;
  if (!mark) return null;
  const m = MARK_BY_ID.get(mark);
  if (!m) return null;
  return (
    <span className="tag" data-tone={m.tone}>
      <T zh={`已标：${m.zh}`} en={`Marked: ${m.en}`} />
    </span>
  );
}

/**
 * 顶部那条进度 —— 四个模式列表页共用同一个进度原语（.ui-prog，见
 * styles/layout.css）。这里只多挂一行四档明细：会 / 模糊 / 不会 / 还没做。
 *
 * 【为什么不再自己画一条四色分段条】
 * 老版本 .drill-strip 自己写了一条 6px 的分段轨道、一个卡片底和一行小标题，
 * 于是同一个「N / M」在四个列表页上有四种字号和四种轨道高度。
 * 分段的信息一条也没丢：四个数字仍然在下面那行，颜色点还在。
 *
 * 「没做」= 总数 − 有记录的三档之和，不单独存。这样不用担心
 * localStorage 里存着已经被删掉的老题 id 时数字对不上。
 */
export function DrillProgressStrip({ total }: { total: number }) {
  const { drillCounts, ready } = useProgress();
  const c = ready ? drillCounts() : { known: 0, fuzzy: 0, unknown: 0, untouched: 0 };
  const touched = Math.min(total, c.known + c.fuzzy + c.unknown);
  const untouched = total - touched;

  const rows = [
    { id: "known", zh: "会", en: "Got it", n: c.known },
    { id: "fuzzy", zh: "模糊", en: "Shaky", n: c.fuzzy },
    { id: "unknown", zh: "不会", en: "No idea", n: c.unknown },
    { id: "untouched", zh: "还没做", en: "Not seen", n: untouched },
  ];

  return (
    <div className="mode-prog">
      <div className="ui-prog">
        <span className="ui-prog-num">
          <b>{touched}</b> / {total}
        </span>
        <span className="ui-bar">
          <i style={{ width: `${total > 0 ? (touched / total) * 100 : 0}%` }} />
        </span>
        <span className="ui-prog-label">
          <T zh="道自评过" en="self-assessed" />
        </span>
      </div>

      <div className="drill-legends">
        {rows.map((r) => (
          <span key={r.id} className="drill-legend" data-kind={r.id}>
            <b className="tabular">{r.n}</b>
            <T zh={r.zh} en={r.en} />
          </span>
        ))}
      </div>

      {!ready && (
        <span className="ui-sec-note">
          <T zh="正在读这台浏览器里的标记…" en="Reading your marks from this browser…" />
        </span>
      )}
    </div>
  );
}
