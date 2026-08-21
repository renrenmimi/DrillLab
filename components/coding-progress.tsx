"use client";

// coding 题的进度小岛。三个都很小，只读 lib/progress，不碰内容。

import { useProgress } from "@/lib/progress";
import { T } from "./t";

/** 列表里那一枚「已完成 / 未开始」 */
export function CodingDoneBadge({ id }: { id: string }) {
  const { ready, codingDone } = useProgress();
  if (!ready) return <span className="cd-badge" data-on="pending" aria-hidden />;

  const done = codingDone(id);
  return (
    <span className="cd-badge" data-on={done ? "yes" : "no"}>
      {done ? <T zh="已完成" en="Done" /> : <T zh="未开始" en="Not started" />}
    </span>
  );
}

/** 详情页底部的打勾 */
export function CodingDoneToggle({
  id,
  title,
  titleEn,
}: {
  id: string;
  title: string;
  /** 英文标题 —— 下面那句话把标题嵌进句子里，英文那半不能嵌中文标题 */
  titleEn?: string;
}) {
  const { ready, codingDone, toggleCoding } = useProgress();
  const done = ready && codingDone(id);

  return (
    <div className="done-bar">
      <span className="done-bar-text">
        {done ? (
          <T
            zh={`「${title}」已标记为完成。想再练一遍就点右边取消。`}
            en={`"${titleEn ?? title}" is marked done. Untick to run it again.`}
          />
        ) : (
          <T
            zh="自己写出来、测试全绿之后再打勾。看懂答案不算。"
            en="Tick this only after you wrote it yourself and the tests went green."
          />
        )}
      </span>
      <button
        type="button"
        className={done ? "btn btn-sm" : "btn btn-sm btn-primary"}
        disabled={!ready}
        onClick={() => toggleCoding(id)}
      >
        {done ? <T zh="取消完成" en="Unmark" /> : <T zh="标记为完成" en="Mark done" />}
      </button>
    </div>
  );
}

/** 列表页右栏的计数 */
export function CodingCount({ total }: { total: number }) {
  const { ready, data } = useProgress();
  const done = ready ? Object.keys(data.coding).length : 0;

  return (
    <div className="rail-block">
      <div className="rail-head">
        <T zh="我的进度" en="Progress" />
      </div>
      {/* 【别用 .progress-row】那是「标题 + 进度条 + 数字」的三列栅格
          （minmax(0,1fr) 96px 62px）。这里只有一个数字，塞进去会被挤成
          26px 宽，"0 / 25" 直接折成两行。右栏统计一律用 .rail-stat。 */}
      <div className="rail-stat">
        <b>{done}</b> / {total}
      </div>
      <div className="bar" style={{ marginTop: 8 }}>
        <i style={{ width: `${(done / Math.max(1, total)) * 100}%` }} />
      </div>
      <p className="dimmer" style={{ fontSize: 12.5, lineHeight: 1.6, margin: "10px 0 0" }}>
        <T
          zh="只有你自己打勾才会加。不做自动判定 —— 测试绿了不等于你不看答案也能写出来。"
          en="Only your own tick counts. Green tests do not prove you could write it again from scratch."
        />
      </p>
    </div>
  );
}
