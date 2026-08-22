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

/**
 * 列表页页头下面那条进度。
 *
 * 【为什么不再是右栏里的一个大数字】
 * 四个模式列表页现在共用同一条进度原语（.ui-prog，见 styles/layout.css）。
 * 老版本这里是右栏的 .rail-stat：22px 的大数字 + 一条 5px 的轨道，
 * 而同一个「N / M」在别的列表页上又是另一套字号 —— 一份东西四种长相。
 */
export function CodingCount({ total }: { total: number }) {
  const { ready, data } = useProgress();
  const done = ready ? Object.keys(data.coding).length : 0;

  return (
    <div className="mode-prog">
      <div className="ui-prog">
        <span className="ui-prog-num">
          <b>{done}</b> / {total}
        </span>
        <span className="ui-bar">
          <i style={{ width: `${(done / Math.max(1, total)) * 100}%` }} />
        </span>
        <span className="ui-prog-label">
          <T zh="道打过勾" en="ticked done" />
        </span>
      </div>

      <span className="ui-sec-note">
        <T
          zh="只有你自己打勾才会加。不做自动判定 —— 测试绿了不等于你不看答案也能写出来。"
          en="Only your own tick counts. Green tests do not prove you could write it again from scratch."
        />
      </span>
    </div>
  );
}
