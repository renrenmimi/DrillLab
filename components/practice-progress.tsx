"use client";

// 练习场右栏的「你做对过」—— 只有这一小块需要读进度。
// 它按 nav 里的 id 清单去数，不需要 import 全文内容。

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

  // 【第三轮改动】没有进度时不显示「0 / 123」。
  // 对新用户，一个大大的 0 是压力不是信息 —— 它把「我还差 123 个」摆在脸上，
  // 而这一页正是他第一次来的地方。换成一句话说清练习该怎么用。
  if (ready && count === 0) {
    return (
      <div className="rail-block">
        <div className="rail-head">
          <T en="How to use this" zh="怎么用这一页" />
        </div>
        <p className="dimmer" style={{ fontSize: 12.5, lineHeight: 1.7, margin: 0 }}>
          <T
            en="Do the exercises at the end of each lesson as you go. Come back here when you want to drill a specific kind on its own."
            zh="正常的做法是跟着课文走，每节课尾做本课的练习。想单独刷某一类的时候再回这一页。"
          />
        </p>
      </div>
    );
  }

  return (
    <div className="rail-block">
      <div className="rail-head">
        <T en="You got these right" zh="你做对过" />
      </div>
      <div className="rail-stat">
        <b>{count}</b> / {total}
      </div>
      <div className="bar" style={{ marginTop: 8 }}>
        <i style={{ width: `${(count / Math.max(1, total)) * 100}%` }} />
      </div>
    </div>
  );
}
