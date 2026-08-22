"use client";

// 练习场页头下面那条进度 —— 只有这一小块需要读 localStorage。
// 它按 nav 里的 id 清单去数，不需要 import 全文内容。
//
// 【为什么不再是右栏里的一个大数字】
// 四个模式列表页现在共用同一条进度原语（.ui-prog，见 styles/layout.css）。
// 老版本这里是右栏的 .rail-stat：22px 的大数字 + 一条 5px 的轨道，
// 而同一个「N / M」在别的列表页上又是另一套字号 —— 一份东西四种长相。

import { NAV } from "@/content/nav";
import { useProgress } from "@/lib/progress";
import { T } from "./t";

export function PracticeProgress({ total }: { total: number }) {
  const { data, ready } = useProgress();

  // 进度里存的键是 `${examId}/${exerciseId}`，直接数属于本站考试的那些
  const ids = new Set(NAV.map((e) => e.id));
  const count = ready
    ? Object.keys({ ...data.exercises, ...data.rebuilds }).filter((k) =>
        ids.has(k.split("/")[0]),
      ).length
    : 0;

  return (
    <div className="mode-prog">
      <div className="ui-prog">
        <span className="ui-prog-num">
          <b>{count}</b> / {total}
        </span>
        <span className="ui-bar">
          <i style={{ width: `${(count / Math.max(1, total)) * 100}%` }} />
        </span>
        <span className="ui-prog-label">
          <T en="you got right" zh="个做对过" />
        </span>
      </div>

      {/* 【第三轮改动，这里保留】一个还没有进度的人不需要「0 / 148」旁边
          再来一句压力，需要的是「这一页什么时候该用」。
          所以零进度时下面挂一句说明；有进度之后它自己消失。 */}
      {ready && count === 0 && (
        <span className="ui-sec-note">
          <T
            en="Do the exercises at the end of each lesson as you go. Come back here when you want to drill a specific kind on its own."
            zh="正常的做法是跟着课文走，每节课尾做本课的练习。想单独刷某一类的时候再回这一页。"
          />
        </span>
      )}
    </div>
  );
}
